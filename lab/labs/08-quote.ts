// 需求 08：我想换币——Quoter 报价，报价的本质是一次合约读操作
// 策划案：lab/需求08-QuoterV2报价.md
// 运行：npx tsx lab/labs/08-quote.ts
import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// 以太坊主网只有 Uniswap V3 Quoter V1（V2 没部署在主网）。
// V1 的签名和 V2 不同：flat 参数，且 fee 在 amountIn 前面——这里踩过坑
const QUOTER_V1 = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const QUOTER_ABI = [
  {
    name: "quoteExactInputSingle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "amountIn", type: "uint256" },
      { name: "sqrtPriceLimitX96", type: "uint160" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const amountOut = await client.readContract({
  address: QUOTER_V1,
  abi: QUOTER_ABI,
  functionName: "quoteExactInputSingle",
  args: [USDC, WETH, 500, parseUnits("100", 6), 0n],
});

console.log("100 USDC →", formatUnits(amountOut, 18), "WETH （fee=500 档）");
console.log("报价 = 一次合约读操作。对比：去 Uniswap 官网输入同样参数，量级应一致（时间差导致小数位不同）");
