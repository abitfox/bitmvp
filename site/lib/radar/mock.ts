import { type RadarData, type TokenTrend, type WhaleActivity, type ChainFlow } from "./types";

/**
 * 模拟雷达数据服务。
 *
 * 真实数据需要接入 DeBank / Dune / Covalent 等 API，
 * 这里先用模拟数据完成 UI 和交互逻辑。
 */

export async function getRadarData(): Promise<RadarData> {
  // 模拟热门代币
  const topTokens: TokenTrend[] = [
    { symbol: "ETH", name: "Ethereum", chain: "Ethereum", change24h: 2.5, volume24h: 1500000000, price: 3500, marketCap: 420000000000 },
    { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", change24h: 1.8, volume24h: 2500000000, price: 65000, marketCap: 1280000000000 },
    { symbol: "SOL", name: "Solana", chain: "Solana", change24h: 5.2, volume24h: 800000000, price: 180, marketCap: 85000000000 },
    { symbol: "USDC", name: "USD Coin", chain: "Ethereum", change24h: 0.01, volume24h: 2000000000, price: 1, marketCap: 52000000000 },
    { symbol: "USDT", name: "Tether USD", chain: "Ethereum", change24h: 0.02, volume24h: 3000000000, price: 1, marketCap: 110000000000 },
    { symbol: "ARB", name: "Arbitrum", chain: "Arbitrum", change24h: -1.2, volume24h: 150000000, price: 0.85, marketCap: 2500000000 },
    { symbol: "OP", name: "Optimism", chain: "Optimism", change24h: 3.8, volume24h: 120000000, price: 2.3, marketCap: 2800000000 },
    { symbol: "BASE", name: "Base", chain: "Base", change24h: 4.5, volume24h: 90000000, price: 0.9, marketCap: 2000000000 },
  ];

  // 模拟大户动向
  const whaleActivities: WhaleActivity[] = [
    { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", chain: "Ethereum", action: "buy", tokenSymbol: "ETH", amount: 150, valueUsd: 525000, timestamp: Date.now() - 3600000 },
    { address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", chain: "Ethereum", action: "sell", tokenSymbol: "USDC", amount: 1000000, valueUsd: 1000000, timestamp: Date.now() - 7200000 },
    { address: "0x28C6c06298d514Db089934071355E5743bf21d60", chain: "Base", action: "buy", tokenSymbol: "ETH", amount: 50, valueUsd: 175000, timestamp: Date.now() - 1800000 },
    { address: "0x431f5efb7e0579c82e4db588ebf674c6b3983621", chain: "Arbitrum", action: "transfer", tokenSymbol: "USDT", amount: 500000, valueUsd: 500000, timestamp: Date.now() - 5400000 },
    { address: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", chain: "Optimism", action: "buy", tokenSymbol: "OP", amount: 100000, valueUsd: 230000, timestamp: Date.now() - 900000 },
  ];

  // 模拟链上资金流
  const chainFlows: ChainFlow[] = [
    { chain: "Ethereum", netInflow: 250000000, totalInflow: 1500000000, totalOutflow: 1250000000, change: 5.2 },
    { chain: "Base", netInflow: 80000000, totalInflow: 300000000, totalOutflow: 220000000, change: 12.5 },
    { chain: "Arbitrum", netInflow: -20000000, totalInflow: 400000000, totalOutflow: 420000000, change: -3.8 },
    { chain: "Optimism", netInflow: 50000000, totalInflow: 250000000, totalOutflow: 200000000, change: 8.3 },
    { chain: "BNB Chain", netInflow: 100000000, totalInflow: 600000000, totalOutflow: 500000000, change: 6.7 },
  ];

  return {
    topTokens,
    whaleActivities,
    chainFlows,
    updatedAt: new Date().toISOString(),
  };
}
