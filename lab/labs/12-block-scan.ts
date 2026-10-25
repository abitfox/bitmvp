// 需求 12：别人在买什么——直连 RPC 扫最新区块，捞大额转账
// 策划案：lab/需求12-扫区块.md
// 运行：npx tsx lab/labs/12-block-scan.ts [扫描块数，默认3]
import { createPublicClient, http, formatEther, formatGwei } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

const WHALE_THRESHOLD = 50n * 10n ** 18n; // 50 ETH，先拍脑袋，跑起来再调
const blocks = Number(process.argv[2] ?? 3);
const start = await client.getBlockNumber();

console.log(`扫 ${blocks} 个区块（阈值 ≥ ${formatEther(WHALE_THRESHOLD)} ETH）：\n`);
let whales = 0;
for (let i = 0; i < blocks; i++) {
  const block = await client.getBlock({ blockNumber: start - BigInt(i) });
  const gasPct = Number((block.gasUsed * 10000n) / block.gasLimit) / 100;
  console.log(`块 ${block.number} | 交易 ${block.transactions.length} 笔 | Gas 使用 ${gasPct.toFixed(1)}%`);

  const hits = block.transactions.filter((tx) => tx.value >= WHALE_THRESHOLD);
  if (hits.length === 0) {
    console.log("  大额转账 0 笔——鲸鱼今天安静（这本身也是信息）");
  }
  for (const tx of hits) {
    whales++;
    console.log(`  🐋 ${formatEther(tx.value)} ETH  ${tx.from} → ${tx.to}`);
  }
  console.log("");
}
console.log(`合计 ${whales} 笔大额转账。数据取自原始区块，未经任何第三方转述。`);
