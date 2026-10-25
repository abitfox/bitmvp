export interface TokenTrend {
  symbol: string;
  name: string;
  chain: string;
  /** 24h 涨跌幅（百分比） */
  change24h: number;
  /** 24h 交易量（USD） */
  volume24h: number;
  /** 当前价格 */
  price: number;
  /** 市值（USD） */
  marketCap: number;
}

export interface WhaleActivity {
  /** 钱包地址 */
  address: string;
  /** 链 */
  chain: string;
  /** 操作类型（买入/卖出/转账） */
  action: "buy" | "sell" | "transfer";
  /** 代币符号 */
  tokenSymbol: string;
  /** 数量 */
  amount: number;
  /** 价值（USD） */
  valueUsd: number;
  /** 时间戳 */
  timestamp: number;
}

export interface ChainFlow {
  /** 链名称 */
  chain: string;
  /** 净流入（USD） */
  netInflow: number;
  /** 总流入（USD） */
  totalInflow: number;
  /** 总流出（USD） */
  totalOutflow: number;
  /** 变化（相对于上一周期） */
  change: number;
}

export interface RadarData {
  /** 热门代币 */
  topTokens: TokenTrend[];
  /** 大户动向 */
  whaleActivities: WhaleActivity[];
  /** 链上资金流 */
  chainFlows: ChainFlow[];
  /** 数据更新时间 */
  updatedAt: string;
}
