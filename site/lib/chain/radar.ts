import { createPublicClient, http, formatUnits, type Address } from "viem";
import { CHAINS, CHAIN_BY_KEY } from "./chains";
import { cached, TTL } from "./cache";

/**
 * Radar 数据层 —— 三个信号源：
 *
 * 1. 市场热度（CoinGecko /search/trending）：当前讨论度最高的币
 * 2. 市场异动（CoinGecko /coins/markets）：24h 涨跌幅榜（市值 Top 100 内）
 * 3. 链上脉搏（直接读公共 RPC 最新区块）：
 *    最新块高 / 交易数 / 块时间 / Base Fee / 大额转账（鲸鱼雷达）
 *
 * 前两个是市场数据，第三个是真正的链上数据——
 * 演示「不依赖任何付费 API，直接从区块链读取并加工原始数据」的能力。
 */

const CG_BASE = process.env.COINGECKO_BASE || "https://api.coingecko.com/api/v3";

/* ---------------- 1. 市场热度 ---------------- */

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number | null;
  priceUsd: number | null;
  change24h: number | null;
}

export async function getTrending(): Promise<TrendingCoin[]> {
  return cached("radar:trending", 120_000, async () => {
    const res = await fetch(`${CG_BASE}/search/trending`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];

    const raw = (await res.json()) as {
      coins?: Array<{
        item: {
          id: string;
          name: string;
          symbol: string;
          market_cap_rank?: number | null;
          data?: {
            price?: number | string;
            price_change_percentage_24h?: { usd?: number } | number;
          };
        };
      }>;
    };

    return (raw.coins ?? []).slice(0, 7).map(({ item }) => {
      // trending 接口的 price 有时是 "$1,234.56" 这种带符号字符串，做防御
      const priceRaw = item.data?.price;
      const priceUsd =
        typeof priceRaw === "number"
          ? priceRaw
          : priceRaw != null
            ? parseFloat(String(priceRaw).replace(/[^0-9.\-]/g, ""))
            : null;

      const chg = item.data?.price_change_percentage_24h;
      const change24h =
        typeof chg === "number" ? chg : (chg?.usd ?? null);

      return {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        marketCapRank: item.market_cap_rank ?? null,
        priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
        change24h,
      } satisfies TrendingCoin;
    });
  });
}

/* ---------------- 2. 市场异动 ---------------- */

export interface MoverCoin {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  marketCapUsd: number | null;
}

export async function getMovers(): Promise<{
  gainers: MoverCoin[];
  losers: MoverCoin[];
}> {
  return cached("radar:movers", 60_000, async () => {
    const res = await fetch(
      `${CG_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc` +
        `&per_page=100&page=1&price_change_percentage=24h`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) return { gainers: [], losers: [] };

    const raw = (await res.json()) as Array<{
      id: string;
      symbol: string;
      name: string;
      current_price: number;
      market_cap: number | null;
      price_change_percentage_24h: number | null;
    }>;

    const withChange = raw
      .filter((c) => c.price_change_percentage_24h != null)
      .map(
        (c): MoverCoin => ({
          id: c.id,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          priceUsd: c.current_price,
          change24h: c.price_change_percentage_24h!,
          marketCapUsd: c.market_cap ?? null,
        }),
      );

    const gainers = [...withChange]
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 6);
    const losers = [...withChange]
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 6);

    return { gainers, losers };
  });
}

/* ---------------- 3. 链上脉搏（鲸鱼雷达） ---------------- */

export interface WhaleTx {
  hash: `0x${string}`;
  from: Address;
  to: Address;
  /** 原生币数量（已格式化） */
  valueNative: number;
}

export interface OnchainPulse {
  chainKey: string;
  chainName: string;
  nativeSymbol: string;
  blockNumber: number;
  blockTimeSec: number;
  txCount: number;
  baseFeeGwei: number;
  gasUsedRatio: number;
  whaleTxs: WhaleTx[];
  fetchedAt: string;
}

/** 鲸鱼阈值：value 超过它就上榜 */
const WHALE_THRESHOLD: Record<string, number> = {
  ethereum: 50,
  base: 20,
  arbitrum: 20,
  optimism: 20,
  bnb: 100,
};

export async function getOnchainPulse(
  chainKey: string,
): Promise<OnchainPulse> {
  const cfg = CHAIN_BY_KEY.get(chainKey);
  if (!cfg) throw new Error(`不支持的链: ${chainKey}`);

  return cached(`radar:pulse:${chainKey}`, TTL.balance, async () => {
    const client = createPublicClient({
      chain: cfg.chain,
      transport: http(cfg.rpcUrl),
    });

    // 最新块（含全部交易）
    const latest = await client.getBlock({ includeTransactions: true });
    const prev = await client.getBlock({
      blockNumber: latest.number - 1n,
    });

    const blockTimeSec = Number(latest.timestamp - prev.timestamp) || 12;

    // 大额转账：从真实区块交易里捞
    const threshold = WHALE_THRESHOLD[chainKey] ?? 20;
    const whaleTxs: WhaleTx[] = latest.transactions
      .filter((tx) => tx.to !== null && tx.value > 0n)
      .map((tx) => ({
        hash: tx.hash,
        from: tx.from as Address,
        to: tx.to as Address,
        valueNative: Number(formatUnits(tx.value, 18)),
      }))
      .filter((tx) => tx.valueNative >= threshold)
      .sort((a, b) => b.valueNative - a.valueNative)
      .slice(0, 8);

    const baseFeeGwei = latest.baseFeePerGas
      ? Number(formatUnits(latest.baseFeePerGas, 9))
      : 0;

    const gasUsedRatio =
      latest.gasLimit > 0n
        ? Number((latest.gasUsed * 10_000n) / latest.gasLimit) / 100
        : 0;

    return {
      chainKey: cfg.key,
      chainName: cfg.name,
      nativeSymbol: cfg.nativeSymbol,
      blockNumber: Number(latest.number),
      blockTimeSec,
      txCount: latest.transactions.length,
      baseFeeGwei,
      gasUsedRatio,
      whaleTxs,
      fetchedAt: new Date().toISOString(),
    } satisfies OnchainPulse;
  });
}

/* ---------------- 组合接口（一次给市场全景） ---------------- */

export interface MarketPulse {
  trending: TrendingCoin[];
  gainers: MoverCoin[];
  losers: MoverCoin[];
}

export async function getMarketPulse(): Promise<MarketPulse> {
  const [trending, movers] = await Promise.all([
    getTrending().catch(() => [] as TrendingCoin[]),
    getMovers().catch(() => ({ gainers: [], losers: [] })),
  ]);
  return { trending, gainers: movers.gainers, losers: movers.losers };
}

/** 前端展示用的区块浏览器映射 */
export function explorerUrlOf(chainKey: string): string {
  const urls: Record<string, string> = {
    ethereum: "https://etherscan.io",
    base: "https://basescan.org",
    arbitrum: "https://arbiscan.io",
    optimism: "https://optimistic.etherscan.io",
    bnb: "https://bscscan.com",
  };
  return urls[chainKey] ?? "https://etherscan.io";
}

export { CHAINS };
