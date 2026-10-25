// 需求 05：余额有了，值多少钱？——第一次走出链，接 CoinGecko
// 策划案：lab/需求05-接价格API.md
// 运行：npx tsx lab/labs/05-prices.ts
// 注意：免费档限流（约 10–30 次/分钟），本脚本只请求 1 次；被 429 是预期教学素材
import { formatUnits } from "viem";

// 持仓（来自 04 集的五链余额，这里简化成静态数组演示估值）
const holdings = [
  { symbol: "ETH",  raw: 5023287000000000000n,  decimals: 18, coingeckoId: "ethereum" },
  { symbol: "USDT", raw: 1222742332n,           decimals: 6,  coingeckoId: "tether" },
  { symbol: "USDC", raw: 1654336246n,           decimals: 6,  coingeckoId: "usd-coin" },
];

// 链上没有价格：价格是链下世界（交易所）的事，CoinGecko 聚合后免费提供
const ids = holdings.map((h) => h.coingeckoId).join(",");
const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`CoinGecko 返回 ${res.status}`, await res.text());
  process.exit(1);
}
const prices = (await res.json()) as Record<string, { usd: number }>;

let total = 0n; // 全程整数（03 集铁律），价格先放大 1e8 再做整数乘法
console.log("\n估值表：");
for (const h of holdings) {
  const price = prices[h.coingeckoId]?.usd ?? 0;
  const scaled = BigInt(Math.round(price * 1e8)); // 价格放大 1e8 变整数
  const value = (h.raw * scaled) / 10n ** BigInt(h.decimals) / 10n ** 8n; // 先换单位再除回去
  total += value;
  console.log(`  ${h.symbol.padEnd(5)} ${formatUnits(h.raw, h.decimals).padStart(14)} × $${price} = $${value}`);
}
console.log(`  ${"—".repeat(38)}\n  总计${" ".repeat(26)}$${total}`);
