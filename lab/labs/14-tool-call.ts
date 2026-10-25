// 需求 14：懒得自己查了——第一个 AI 工具（function calling）
// 策划案：lab/需求14-第一个AI工具.md
// 运行：npx tsx lab/labs/14-tool-call.ts "vitalik 有多少 ETH？"
// 前置：.env.local 里有 GLM_API_KEY（智谱开放平台）；Key 绝不出镜
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";
import { readFileSync } from "node:fs";

// 读取本机 .env.local（不打印）
const env = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
const GLM_API_KEY = /GLM_API_KEY=(.+)/.exec(env)?.[1]?.trim();
if (!GLM_API_KEY) { console.log("未找到 GLM_API_KEY，本集脚本需要它。其余集不受影响。"); process.exit(1); }

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

// 我的工具：模型只「说」要调它，执行永远在我手里
async function get_balance(args: { address: string }) {
  const balance = await client.getBalance({ address: args.address as `0x${string}` });
  return formatEther(balance);
}

const tools = [{
  type: "function",
  function: {
    name: "get_balance",
    description: "查询以太坊主网某地址当前持有的 ETH 数量（仅支持主网原生币，不含 ERC-20）",
    parameters: {
      type: "object",
      properties: { address: { type: "string", description: "0x 开头的 42 位地址" } },
      required: ["address"],
    },
  },
}];

const question = process.argv[2] ?? "vitalik 有多少 ETH？";
const messages: any[] = [
  { role: "system", content: "你是链上助手，回答要用工具查询，不要编造数字。" },
  { role: "user", content: question },
];

for (let round = 1; round <= 3; round++) {
  const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GLM_API_KEY}` },
    body: JSON.stringify({ model: "glm-5.3-flash", messages, tools }),
  });
  const data: any = await res.json();
  const msg = data.choices[0].message;
  messages.push(msg);

  if (!msg.tool_calls?.length) { console.log(`\n最终回答：${msg.content}`); break; }

  for (const call of msg.tool_calls) {
    const args = JSON.parse(call.function.arguments);
    console.log(`[第${round}轮] 模型要求调 ${call.function.name}(${args.address})`);
    const result = await (get_balance as any)(args);
    console.log(`[第${round}轮] 我执行完毕，把结果喂回去：${result}`);
    messages.push({ role: "tool", tool_call_id: call.id, content: String(result) });
  }
}
