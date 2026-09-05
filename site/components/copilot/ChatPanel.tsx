"use client";

/**
 * BitMVP Copilot 聊天面板（客户端组件）
 *
 * 能力：
 * 1. 流式接收 LLM 输出（打字机效果）
 * 2. 实时显示工具调用过程（tool_call → tool_result）
 * 3. 思考步骤（reasoning）默认隐藏，可点开看
 * 4. 演示降级：API 不可用时显示写死的引导示例
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { TOOL_DISPLAY } from "@/lib/copilot/tools";

interface Message {
  id: string;
  role: "user" | "assistant";
  /** Markdown-lite 文本（简单换行 + 加粗） */
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    ms?: number;
    ok?: boolean;
    error?: string;
  }>;
  /** 模型思考过程（默认折叠） */
  reasoning?: string;
  /** 流式状态 */
  streaming?: boolean;
  /** 工具执行过程（已执行但模型还在生成文字时） */
  pendingToolCall?: { id: string; name: string; args: Record<string, unknown> };
}

const SUGGESTIONS = [
  "我现在的仓位集中度是不是太高了？",
  "把 100 USDC 在 Ethereum 上换成 WETH，最优报价是多少？",
  "现在市场哪些代币涨得最猛？",
  "Ethereum 最近区块里有什么大额转账？",
];

const DEMO_REPLIES: Array<{
  user: string;
  assistant: string;
  toolName: keyof typeof TOOL_DISPLAY;
  toolArgs: Record<string, unknown>;
  toolResult: { ms: number };
}> = [
  {
    user: "帮我看看 USDC→WETH 在 Ethereum 上值不值得换，100 USDC",
    assistant:
      "调用了 Uniswap V3 QuoterV2 真实报价：100 USDC 在 Ethereum 上可换 **0.04071260 WETH**，最优路由走 fee 0.05% 池，价格影响 0.100%。扣除 gas 后净到手约 0.0407 WETH，与当前市价基本一致，流动性充足，可以执行。",
    toolName: "swap_getQuote",
    toolArgs: {
      chain: "ethereum",
      fromToken: "USDC",
      toToken: "WETH",
      amountIn: "100",
    },
    toolResult: { ms: 9603 },
  },
  {
    user: "今天哪些币涨得最猛？",
    assistant:
      "查了 CoinGecko 24h 涨跌幅榜，目前头部涨幅集中在 AI 与 Meme 板块。建议结合 Radar 的链上脉搏交叉验证，看资金流入方向再决定是否跟进。",
    toolName: "radar_getMarketPulse",
    toolArgs: { limit: 10 },
    toolResult: { ms: 412 },
  },
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      // 演示降级：用预置回复模拟
      if (demoMode) {
        const demo = DEMO_REPLIES.find((d) =>
          trimmed.includes(d.user.slice(0, 6)),
        );
        if (demo) {
          const userMsg: Message = {
            id: `u_${Date.now()}`,
            role: "user",
            content: trimmed,
          };
          const aId = `a_${Date.now()}`;
          const assistantMsg: Message = {
            id: aId,
            role: "assistant",
            content: "",
            toolCalls: [
              {
                id: `t_${Date.now()}`,
                name: demo.toolName,
                args: demo.toolArgs,
                ms: demo.toolResult.ms,
                ok: true,
                result: { demo: true },
              },
            ],
          };
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
          // 打字机效果逐字输出
          for (let i = 1; i <= demo.assistant.length; i++) {
            await new Promise((r) => setTimeout(r, 18));
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aId ? { ...m, content: demo.assistant.slice(0, i) } : m,
              ),
            );
          }
          setInput("");
          return;
        }
      }

      const userMsg: Message = {
        id: `u_${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const aId = `a_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: aId,
          role: "assistant",
          content: "",
          streaming: true,
        },
      ]);
      setInput("");
      setSending(true);
      setError(null);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const res = await fetch("/api/copilot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let assistantContent = "";
        let reasoningContent = "";
        const toolCallsMap = new Map<
          string,
          {
            id: string;
            name: string;
            args: Record<string, unknown>;
            result?: unknown;
            ms?: number;
            ok?: boolean;
            error?: string;
          }
        >();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data: ")) continue;
            const payload = t.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "text") {
                assistantContent += evt.content ?? "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId
                      ? {
                          ...m,
                          content: assistantContent,
                          reasoning: reasoningContent || m.reasoning,
                        }
                      : m,
                  ),
                );
              } else if (evt.type === "reasoning") {
                reasoningContent += evt.content ?? "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId
                      ? { ...m, reasoning: reasoningContent }
                      : m,
                  ),
                );
              } else if (evt.type === "tool_call") {
                toolCallsMap.set(evt.id, {
                  id: evt.id,
                  name: evt.name,
                  args: evt.args ?? {},
                  result: undefined,
                  ms: undefined,
                  ok: undefined,
                });
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId
                      ? {
                          ...m,
                          toolCalls: Array.from(toolCallsMap.values()),
                          pendingToolCall: {
                            id: evt.id,
                            name: evt.name,
                            args: evt.args ?? {},
                          },
                        }
                      : m,
                  ),
                );
              } else if (evt.type === "tool_result") {
                const prev = toolCallsMap.get(evt.id);
                if (prev) {
                  prev.result = evt.result;
                  prev.ms = evt.ms;
                  prev.ok = evt.ok;
                  prev.error = evt.error;
                  toolCallsMap.set(evt.id, prev);
                }
                setMessages((prevMsgs) =>
                  prevMsgs.map((m) =>
                    m.id === aId
                      ? {
                          ...m,
                          toolCalls: Array.from(toolCallsMap.values()),
                          pendingToolCall: undefined,
                        }
                      : m,
                  ),
                );
              } else if (evt.type === "error") {
                throw new Error(evt.message || "Unknown error");
              }
            } catch (parseErr) {
              if (
                parseErr instanceof SyntaxError ||
                String(parseErr).includes("JSON")
              ) {
                continue;
              }
              throw parseErr;
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aId ? { ...m, streaming: false } : m,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        // 网络/LLM 失败时自动进入演示模式
        setDemoMode(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aId
              ? {
                  ...m,
                  streaming: false,
                  content:
                    "⚠️ 暂未接通大模型（演示模式）。下面给你一条示例回答。",
                }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [messages, sending, demoMode],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="mx-auto flex h-[640px] max-w-2xl flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto pr-1 pb-2"
      >
        {messages.length === 0 && (
          <div className="rounded-md border border-border bg-surface-alt p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-ai text-[10px] font-bold text-bg">
                AI
              </span>
              <span className="text-xs font-semibold text-ai">
                BitMVP Copilot
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              你好，我是 BitMVP Copilot。我能调用 Portfolio、Swap、Radar
              三个模块的真实数据，回答你关于链上资产、交易价格、市场动向的问题。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={sending}
                  className="rounded-sm border border-ai/30 bg-ai/5 px-3 py-1.5 text-xs text-ai transition-colors hover:border-ai/60 hover:bg-ai/10 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {error && messages.length > 0 && demoMode && (
          <p className="text-center text-xs text-faint">
            真实 LLM 暂不可用（{error.slice(0, 40)}）· 已切换演示模式
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex items-center gap-3 rounded-md border border-border bg-surface-alt px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="问我关于链上资产、价格、市场信号的任何事…"
          disabled={sending}
          className="flex-1 bg-transparent text-sm text-fg placeholder:text-faint focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-sm bg-ai px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "生成中…" : "发送"}
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-faint">
        基于 {process.env.NEXT_PUBLIC_LLM_MODEL ?? "GLM-5.3-Flash"} · 工具调用真实链上数据 ·
        涉及转账需你二次确认
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] ${
          isUser
            ? "rounded-md rounded-br-sm bg-elevated px-4 py-3 text-sm text-fg"
            : "space-y-3"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-ai text-[10px] font-bold text-bg">
              AI
            </span>
            <span className="text-xs font-semibold text-ai">
              BitMVP Copilot
            </span>
            {message.streaming && (
              <span className="flex items-center gap-1 text-xs text-faint">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ai" />
                思考中
              </span>
            )}
          </div>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((tc) => {
              const meta = TOOL_DISPLAY[tc.name] ?? {
                name: tc.name,
                color: "ai",
                icon: "⚙",
              };
              return (
                <div
                  key={tc.id}
                  className="flex flex-wrap items-center gap-2 rounded-sm border border-ai/25 bg-ai/5 px-3 py-2 text-xs"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-ai text-[10px] font-bold text-bg">
                    {meta.icon}
                  </span>
                  <span className="font-medium text-ai">{meta.name}</span>
                  <code className="truncate rounded bg-bg/40 px-1.5 py-0.5 text-faint mono">
                    {JSON.stringify(tc.args)}
                  </code>
                  {typeof tc.ms === "number" && (
                    <span
                      className={`ml-auto flex shrink-0 items-center gap-1 text-xs ${
                        tc.ok === false ? "text-danger" : "text-down"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          tc.ok === false ? "bg-danger" : "bg-down"
                        }`}
                      />
                      {tc.ms}ms
                      {tc.ok === false && " · 失败"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {message.reasoning && message.reasoning.length > 0 && (
          <details
            open={showReasoning}
            onClick={(e) => {
              e.preventDefault();
              setShowReasoning(!showReasoning);
            }}
            className="rounded-sm border border-border bg-bg/30 px-3 py-1.5 text-xs"
          >
            <summary className="cursor-pointer text-faint">
              {showReasoning ? "收起思考过程" : "展开思考过程"}
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-faint">
              {message.reasoning.slice(0, 800)}
              {message.reasoning.length > 800 && "…"}
            </pre>
          </details>
        )}

        {message.content && (
          <div className="rounded-md rounded-bl-sm border border-border bg-surface-alt px-5 py-4 text-sm leading-relaxed text-fg">
            <MarkdownLite text={message.content} />
            {message.streaming && (
              <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-ai" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 极简 Markdown 渲染：只处理 **加粗** 和换行 */
function MarkdownLite({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-fg">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return (
          <span key={i}>
            {p.split("\n").map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}
