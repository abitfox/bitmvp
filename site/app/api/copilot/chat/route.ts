/**
 * Copilot chat API —— BitMVP 的 AI 入口。
 *
 * 协议：客户端发 POST，服务器返回 SSE 流（text/event-stream）。
 * 事件类型：
 *   - text       : LLM 输出的正文增量（已剔除 thinking）
 *   - reasoning  : LLM 的思考过程（可选，前端可选择渲染）
 *   - tool_call  : LLM 决定调用某个工具
 *   - tool_result: 工具执行结果
 *   - error      : 任意阶段出错
 *   - done       : 整个对话轮结束
 *
 * Runtime: edge — LLM 推理 + 工具链上调用加起来可能 >10s，
 *   Edge 默认 30s，足够；Node runtime 在 Vercel Hobby 上只有 10s。
 *
 * 安全：工具调用是只读（balance / quote / pulse），不写链上、不发交易。
 *   即使 LLM 被 prompt 注入，也只能读公开链上数据。
 */

import { TOOLS, executeTool, type ToolResult } from "@/lib/copilot/tools";

export const runtime = "edge";
export const maxDuration = 30;

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  /** 当前连接的钱包地址（可选，让 LLM 自动查询自己的资产） */
  walletAddress?: string;
}

const GLM_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
const GLM_MODEL = "glm-5.3-flash";
const GLM_API_KEY = process.env.GLM_API_KEY;
const MAX_TOOL_ROUNDS = 3;

const SYSTEM_PROMPT_BASE = `你是 BitMVP Copilot，一个 Web3 多链资产助手机器人。

你背后的三个模块（Portfolio / Swap / Radar）的能力通过工具函数暴露给你：
- portfolio_getBalances：查某地址在指定链上的代币余额与美元估值
- swap_getQuote：获取代币兑换的最优报价（只报价，不执行交易）
- radar_getMarketPulse：市场整体热度与涨跌幅榜
- radar_getOnchainPulse：扫描某条链最新区块的大额原生币转账

回答规则：
1. **优先用工具拿真实数据**，不要凭印象编造数字或地址。
2. **回答结构清晰**：先一句话结论，再分点依据，最后给出可操作建议。
3. **危险操作不替用户做决定**：涉及交易执行时明确说「需用户确认」。
4. **结果数据带上单位与上下文**：金额带 USD、变化带百分比、时间带时间戳。
5. **语言匹配用户**：用户中文你中文，用户英文你英文。

不要做的事：
- 不假装你做了链上交易
- 不暴露底层 API 密钥、工具实现细节
- 不回答与链上资产无关的闲聊（礼貌拒绝并建议其他工具）`;

const sse = (data: unknown): Uint8Array =>
  new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);

export async function POST(req: Request) {
  if (!GLM_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GLM_API_KEY 未配置。请在 Vercel 项目环境变量中添加。" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "请求体不是合法 JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const systemPrompt = body.walletAddress
    ? `${SYSTEM_PROMPT_BASE}\n\n当前用户连接的钱包地址：${body.walletAddress}\n当用户问「我的资产/我的持仓」时，优先用此地址调用 portfolio_getBalances。`
    : SYSTEM_PROMPT_BASE;

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: systemPrompt },
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 工具调用循环：每轮最多处理 N 个 tool_call，递归直到 LLM 输出 text 或达到轮次上限
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const upstream = await fetch(`${GLM_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GLM_API_KEY}`,
            },
            body: JSON.stringify({
              model: GLM_MODEL,
              stream: true,
              tool_stream: true,
              temperature: 1,
              top_p: 0.95,
              tools: TOOLS,
              messages,
            }),
          });

          if (!upstream.ok || !upstream.body) {
            const errText = await upstream.text().catch(() => "unknown");
            controller.enqueue(
              sse({ type: "error", message: `GLM ${upstream.status}: ${errText.slice(0, 300)}` }),
            );
            controller.enqueue(sse({ type: "done" }));
            controller.close();
            return;
          }

          // 解析流式响应：累积 assistant 消息，记录 tool_calls 与文本片段
          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let assistantContent = "";
          let assistantReasoning = "";
          const toolCalls = new Map<
            number,
            { id: string; name: string; arguments: string }
          >();
          let finishReason: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const evt = JSON.parse(payload);
                const delta = evt.choices?.[0]?.delta;
                if (!delta) continue;
                if (delta.content) {
                  assistantContent += delta.content;
                  controller.enqueue(
                    sse({ type: "text", content: delta.content }),
                  );
                }
                if (delta.reasoning_content) {
                  assistantReasoning += delta.reasoning_content;
                  // 把思考过程作为独立 SSE 事件推给前端，前端默认折叠渲染
                  controller.enqueue(
                    sse({ type: "reasoning", content: delta.reasoning_content }),
                  );
                }
                if (Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!toolCalls.has(idx)) {
                      toolCalls.set(idx, {
                        id: tc.id ?? `call_${idx}`,
                        name: tc.function?.name ?? "",
                        arguments: "",
                      });
                    }
                    const entry = toolCalls.get(idx)!;
                    if (tc.function?.name) entry.name = tc.function.name;
                    if (tc.function?.arguments)
                      entry.arguments += tc.function.arguments;
                  }
                }
                if (evt.choices?.[0]?.finish_reason) {
                  finishReason = evt.choices[0].finish_reason;
                }
              } catch {
                // 忽略解析失败的 chunk（keep-alive 等）
              }
            }
          }

          // 把这一轮的 assistant 消息写回 messages 历史
          const assistantMsg: Record<string, unknown> = {
            role: "assistant",
            content: assistantContent,
          };
          if (toolCalls.size > 0) {
            assistantMsg.tool_calls = Array.from(toolCalls.values()).map(
              (tc) => ({
                id: tc.id,
                type: "function",
                function: { name: tc.name, arguments: tc.arguments },
              }),
            );
          }
          if (assistantReasoning) {
            // 把 reasoning 作为 content 的一部分持久化（部分 API 不读 reasoning 字段，
            // 放回 content 会污染输出；这里放 reasoning_content 字段供兼容）
            assistantMsg.reasoning_content = assistantReasoning;
          }
          messages.push(assistantMsg);

          if (finishReason !== "tool_calls" || toolCalls.size === 0) {
            // 本轮 LLM 没有调工具，对话结束
            controller.enqueue(sse({ type: "done" }));
            controller.close();
            return;
          }

          // 执行所有 tool_calls
          const toolResults: ToolResult[] = [];
          for (const [, tc] of toolCalls) {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(tc.arguments || "{}");
            } catch {
              // 参数解析失败用空对象
            }
            controller.enqueue(
              sse({
                type: "tool_call",
                id: tc.id,
                name: tc.name,
                args: parsedArgs,
              }),
            );
            const result = await executeTool(tc.name, parsedArgs);
            toolResults.push(result);
            controller.enqueue(sse({ type: "tool_result", id: tc.id, result }));
          }

          // 把工具结果作为 tool 角色消息塞回 messages，进入下一轮
          for (const tc of toolCalls.values()) {
            const result = toolResults.find((r) => r.name === tc.name)!;
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(
                result.ok
                  ? result.result
                  : { error: result.error ?? "工具执行失败" },
              ),
            });
          }
        }

        // 超过 MAX_TOOL_ROUNDS 还没收敛，强制收尾
        controller.enqueue(
          sse({ type: "error", message: "工具调用轮次超过上限，对话终止" }),
        );
        controller.enqueue(sse({ type: "done" }));
        controller.close();
      } catch (e) {
        controller.enqueue(
          sse({
            type: "error",
            message: e instanceof Error ? e.message : String(e),
          }),
        );
        controller.enqueue(sse({ type: "done" }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
