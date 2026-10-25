// 需求 09：同一个兑换，价格不一样——三档 fee tier 并行取最优
// 策划案：lab/需求09-费率并行取最优.md
// 运行：npx tsx lab/labs/09-fee-tiers.ts
import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// 主网只有 Quoter V1：flat 参数且 fee 在 amountIn 前（V2 才是元组版）
const QUOTER_V1 = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const QUOTER_ABI = [
  {
    name: "quoteExactInputSingle", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" },
      { name: "fee", type: "uint24" }, { name: "amountIn", type: "uint256" },
      { name: "sqrtPriceLimitX96", type: "uint160" } ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

async function quote(fee: number) {
  const amountOut = await client.readContract({
    address: QUOTER_V1, abi: QUOTER_ABI, functionName: "quoteExactInputSingle",
    args: [USDC, WETH, fee, parseUnits("100", 6), 0n],
  });
  return { fee, amountOut };
}

// 三档费率对应三个独立池子：0.05% / 0.3% / 1%
// 猜想：USDC→WETH 的主流流动性在 500 档。04 集的链间并行，今天用在池间
console.time("三档并行");
const settled = await Promise.allSettled([quote(500), quote(3000), quote(10000)]);
console.timeEnd("三档并行");

const rows = settled.map((r, i) =>
  r.status === "fulfilled"
    ? { fee: r.value.fee, out: r.value.amountOut }
    : { fee: [500, 3000, 10000][i], out: null },
);
console.log("\n费率   | 报价（WETH）");
for (const r of rows) {
  console.log(`${String(r.fee).padEnd(7)}| ${r.out === null ? "（该池子没有流动性——没有报价也是信息）" : formatUnits(r.out, 18)}`);
}
const best = rows.filter((r) => r.out).sort((a, b) => (b.out! > a.out! ? 1 : -1))[0];
if (best) console.log(`\n最优：fee=${best.fee}，出 ${formatUnits(best.out!, 18)} WETH（简化：只比谁出得多，深度/滑点后面再说）`);
