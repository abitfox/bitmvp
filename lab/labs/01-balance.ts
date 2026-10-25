// 需求 01：这个地址有多少 ETH？——读链的第一步
// 策划案：lab/需求01-读链第一步.md
// 运行：npx tsx lab/labs/01-balance.ts [可选:0x地址]
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

const address = (process.argv[2] ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045") as `0x${string}`;
const balance = await client.getBalance({ address });

console.log(address);
console.log(balance, "wei");
console.log(formatEther(balance), "ETH");
