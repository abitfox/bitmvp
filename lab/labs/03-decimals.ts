// 需求 03：402143094812348905 是多少钱？——decimals 与浮点陷阱
// 策划案：lab/需求03-精度与浮点.md
// 运行：npx tsx lab/labs/03-decimals.ts
import { formatUnits } from "viem";

// 实验一：浮点丢尾巴（本集高潮，现场跑）
const raw = 402143094812348905n;
console.log("bigint 原样：", raw);
console.log("转成 number：", Number(raw), "← 尾巴没了");
console.log("经典浮点：  ", 0.1 + 0.2);

// 实验二：不同 decimals 的换算——链上只有整数，合约自报家门
const samples = [
  { symbol: "USDT", raw: 1222742332n,    decimals: 6 },  // 1 USDT = 10^6 最小单位
  { symbol: "USDC", raw: 1417755858n,    decimals: 6 },
  { symbol: "WETH", raw: 1466500000000000000n, decimals: 18 },
];
console.log("\n换算表（全程 bigint，只在打印这一刻 formatUnits）：");
for (const s of samples) {
  console.log(`  ${s.symbol.padEnd(5)} ${String(s.raw).padEnd(20)} → ${formatUnits(s.raw, s.decimals)}`);
}
