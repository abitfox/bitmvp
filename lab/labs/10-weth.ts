// 需求 10：我明明选的 ETH，合约里怎么是 WETH——包装戏法
// 策划案：lab/需求10-ETH与WETH.md
// 运行：npx tsx lab/labs/10-weth.ts
import { createPublicClient, http, formatEther, erc20Abi } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

// 同一个地址的两本账：ETH 记在账本本命字段，WETH 记在包装合约里
const eth = await client.getBalance({ address });
const weth = await client.readContract({
  address: WETH, abi: erc20Abi, functionName: "balanceOf", args: [address],
});

console.log("ETH :", formatEther(eth), "（getBalance，问账本本身）");
console.log("WETH:", formatEther(weth), "（balanceOf，问包装合约）");
console.log("\n两个都非零 → 这是两个独立的东西。");
console.log("用户视角说 ETH，合约视角统一 WETH：原生币不是 ERC-20，合约世界查无此人；");
console.log("WETH 合约 deposit() 锁 ETH 发凭证，withdraw() 凭证换回 ETH，1:1。");
