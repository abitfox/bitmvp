// 需求 02：钱包里大头是 ERC-20，怎么读？——Multicall3 把 30 次请求打进 1 次
// 策划案：lab/需求02-ERC20与Multicall3.md
// 运行：npx tsx lab/labs/02-erc20-multicall.ts
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});
const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

// 代币清单：symbol + 合约地址（含 decimals，03 集会专门讲）
const tokens = [
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "DAI",  address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
  { symbol: "UNI",  address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
] as const;

// 方案一：逐个读（30 个代币就是 30 次网络往返）
console.time("逐个读 5 个代币");
const single = [];
for (const t of tokens) {
  const raw = await client.readContract({
    address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [address],
  });
  single.push({ ...t, raw });
}
console.timeEnd("逐个读 5 个代币");

// 方案二：Multicall3 打包成 1 次
console.time("multicall 5 个代币");
const results = await client.multicall({
  contracts: tokens.map((t) => ({
    address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [address],
  })),
});
console.timeEnd("multicall 5 个代币");

console.log("\n各代币余额：");
for (let i = 0; i < tokens.length; i++) {
  const raw = (results[i].result as bigint) ?? 0n;
  console.log(`  ${tokens[i].symbol.padEnd(5)} ${formatUnits(raw, tokens[i].decimals)}`);
}
