// 需求 04：我在五条链上都有资产——链配置化 + 并行
// 策划案：lab/需求04-五条链一起查.md
// 运行：npx tsx lab/labs/04-multichain.ts
import { createPublicClient, http, formatEther } from "viem";
import { mainnet, base, arbitrum, optimism, bsc } from "viem/chains";

// 链是配置不是代码：差异只有三个常量
const CHAINS = [
  { name: "Ethereum", chain: mainnet,  rpc: "https://ethereum-rpc.publicnode.com" },
  { name: "Base",     chain: base,     rpc: "https://base-rpc.publicnode.com" },
  { name: "Arbitrum", chain: arbitrum, rpc: "https://arbitrum-one-rpc.publicnode.com" },
  { name: "Optimism", chain: optimism, rpc: "https://optimism-rpc.publicnode.com" },
  { name: "BNB Chain", chain: bsc,     rpc: "https://bsc-rpc.publicnode.com" },
];
const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

// 串行写法（注释留作对照：5 条链 × 各 1s ≈ 5s）
// for (const c of CHAINS) { await query(c); }

// 并行：链间没有依赖，Promise.all 同时发
console.time("五链并行");
const rows = await Promise.all(
  CHAINS.map(async (c) => {
    // 链上读取彼此独立，单链失败只影响自己——注意这里用 allSettled 的思想手动兜住
    try {
      const client = createPublicClient({ chain: c.chain, transport: http(c.rpc) });
      const balance = await client.getBalance({ address });
      return { name: c.name, eth: formatEther(balance), error: null as string | null };
    } catch (e) {
      return { name: c.name, eth: null, error: "RPC 不可用（只降级这一条）" };
    }
  }),
);
console.timeEnd("五链并行");

console.log(`\n${address}`);
for (const r of rows) {
  console.log(`  ${r.name.padEnd(10)} ${r.error ?? `${r.eth} ${CHAINS.find((c) => c.name === r.name)?.chain.nativeCurrency.symbol}`}`);
}
