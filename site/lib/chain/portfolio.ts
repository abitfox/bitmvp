import {
  createPublicClient,
  http,
  formatUnits,
  isAddress,
  getAddress,
  erc20Abi,
  type Address,
} from "viem";
import { mainnet } from "viem/chains";
import { CHAINS, type ChainConfig } from "./chains";
import { TOKENS } from "./tokens";
import { getPrices, type PriceMap } from "./prices";
import { cached, TTL } from "./cache";

/**
 * 多链资产聚合 —— BitMVP 共享链上数据服务层的核心。
 *
 * 设计要点：
 * 1. **Multicall3**：一条链上 N 个代币的余额查询压缩成 1 次 RPC。
 *    5 条链 × (1 次 multicall + 1 次原生币查询) = 10 次请求，
 *    而不是 5 × 30 = 150 次。这是能否实用的分水岭。
 * 2. **单链失败不影响全局**：用 allSettled，某条链 RPC 挂了只降级那一条。
 * 3. **价格失败不阻断**：拿不到价格就显示「—」，余额照常出。
 * 4. **零余额过滤**：候选清单 30 个代币，实际持有的通常不到 10 个。
 */

export interface AssetHolding {
  chainKey: string;
  chainName: string;
  chainColor: string;
  symbol: string;
  name: string;
  isNative: boolean;
  /** 已按 decimals 格式化好的余额 */
  balance: number;
  /** 原始整数（字符串，避免 JS number 精度丢失） */
  rawBalance: string;
  decimals: number;
  priceUsd: number | null;
  change24h: number | null;
  valueUsd: number | null;
}

export interface ChainBreakdown {
  chainKey: string;
  chainName: string;
  color: string;
  valueUsd: number;
  pct: number;
  ok: boolean;
  error?: string;
}

export interface PortfolioSnapshot {
  address: string;
  totalUsd: number | null;
  holdings: AssetHolding[];
  chains: ChainBreakdown[];
  /** 价格服务是否可用（不可用则只展示余额） */
  pricesAvailable: boolean;
  fetchedAt: string;
  meta: {
    chainOk: number;
    chainTotal: number;
    durationMs: number;
  };
}

/** 演示地址：未连接钱包时展示真实链上数据，让面试官打开就能看到效果 */
export const DEMO_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

export async function getPortfolio(address: string): Promise<PortfolioSnapshot> {
  const normalized = await resolveAddress(address);
  return cached(`portfolio:${normalized}`, TTL.portfolio, () =>
    buildPortfolio(normalized),
  );
}

/**
 * 解析用户输入的地址：
 * - 0x... 直接返回 checksum 形式
 * - xxx.eth 通过 ENS 反解析（缓存 5 分钟）
 * - 其他格式抛错
 */
async function resolveAddress(input: string): Promise<Address> {
  const trimmed = input.trim();
  if (isAddress(trimmed)) return getAddress(trimmed);
  if (trimmed.toLowerCase().endsWith(".eth")) {
    return cached(
      `ens:${trimmed.toLowerCase()}`,
      5 * 60_000,
      async () => {
        const ethCfg = CHAINS.find((c) => c.key === "ethereum");
        if (!ethCfg) throw new Error("Ethereum 链未配置");
        const client = createPublicClient({
          chain: mainnet,
          transport: http(ethCfg.rpcUrl),
        });
        const resolved = await client.getEnsAddress({
          name: trimmed,
        });
        if (!resolved) throw new Error(`ENS 解析失败: ${trimmed}`);
        return resolved;
      },
    );
  }
  throw new Error(`无效的地址或 ENS 名: ${input}`);
}

async function buildPortfolio(
  address: Address,
): Promise<PortfolioSnapshot> {
  const started = Date.now();

  // 1. 并行查询所有链的余额（单链失败不影响其他链）
  const chainResults = await Promise.allSettled(
    CHAINS.map((cfg) => readChainBalances(cfg, address)),
  );

  // 2. 收集所有非零持仓
  const rawHoldings: Array<
    Omit<AssetHolding, "priceUsd" | "change24h" | "valueUsd"> & {
      coingeckoId: string;
    }
  > = [];
  const chainStatus: { cfg: ChainConfig; ok: boolean; error?: string }[] = [];

  chainResults.forEach((res, i) => {
    const cfg = CHAINS[i];
    if (res.status === "fulfilled") {
      rawHoldings.push(...res.value);
      chainStatus.push({ cfg, ok: true });
    } else {
      chainStatus.push({
        cfg,
        ok: false,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      });
    }
  });

  // 3. 一次性查询所有涉及代币的价格
  const coingeckoIds = [
    ...new Set(rawHoldings.map((h) => h.coingeckoId).filter(Boolean)),
  ] as string[];
  const prices: PriceMap = await getPrices(coingeckoIds);

  // 4. 合并价格，计算美元估值
  const holdings: AssetHolding[] = rawHoldings.map((h) => {
    const p = h.coingeckoId ? prices[h.coingeckoId] : undefined;
    const valueUsd = p ? h.balance * p.usd : null;
    const { coingeckoId: _drop, ...rest } = h;
    return {
      ...rest,
      priceUsd: p?.usd ?? null,
      change24h: p?.change24h ?? null,
      valueUsd,
    };
  });

  // 按估值降序；无估值的排在后面
  holdings.sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));

  // 5. 按链聚合
  const byChain = new Map<string, number>();
  for (const h of holdings) {
    if (h.valueUsd == null) continue;
    byChain.set(h.chainKey, (byChain.get(h.chainKey) ?? 0) + h.valueUsd);
  }

  const totalUsd = [...byChain.values()].reduce((a, b) => a + b, 0);

  const chains: ChainBreakdown[] = chainStatus.map(({ cfg, ok, error }) => {
    const valueUsd = byChain.get(cfg.key) ?? 0;
    return {
      chainKey: cfg.key,
      chainName: cfg.name,
      color: cfg.color,
      valueUsd,
      pct: totalUsd > 0 ? (valueUsd / totalUsd) * 100 : 0,
      ok,
      error,
    };
  });

  chains.sort((a, b) => b.valueUsd - a.valueUsd);

  const pricedCount = holdings.filter((h) => h.valueUsd != null).length;

  return {
    address,
    totalUsd: totalUsd > 0 ? totalUsd : null,
    holdings,
    chains,
    pricesAvailable: pricedCount > 0,
    fetchedAt: new Date().toISOString(),
    meta: {
      chainOk: chainStatus.filter((c) => c.ok).length,
      chainTotal: CHAINS.length,
      durationMs: Date.now() - started,
    },
  };
}

/** 单链余额读取 */
async function readChainBalances(
  cfg: ChainConfig,
  address: Address,
): Promise<
  (Omit<AssetHolding, "priceUsd" | "change24h" | "valueUsd"> & {
    coingeckoId: string;
  })[]
> {
  const client = createPublicClient({
    chain: cfg.chain,
    transport: http(cfg.rpcUrl, { timeout: 15_000 }),
  });

  const tokens = TOKENS[cfg.key] ?? [];

  // 原生币余额 + 所有 ERC20 余额（一次 multicall）并行
  const [nativeResult, tokenResults] = await Promise.all([
    client.getBalance({ address }).catch(() => null),
    tokens.length > 0
      ? client
          .multicall({
            contracts: tokens.map((t) => ({
              address: t.address,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [address],
            })),
            allowFailure: true,
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const out: (Omit<AssetHolding, "priceUsd" | "change24h" | "valueUsd"> & {
    coingeckoId: string;
  })[] = [];

  // 原生币
  if (nativeResult != null && nativeResult > 0n) {
    const balance = Number(formatUnits(nativeResult, 18));
    out.push({
      chainKey: cfg.key,
      chainName: cfg.name,
      chainColor: cfg.color,
      symbol: cfg.nativeSymbol,
      name: `${cfg.name} 原生代币`,
      isNative: true,
      balance,
      rawBalance: nativeResult.toString(),
      decimals: 18,
      coingeckoId: cfg.nativeCoingeckoId,
    });
  }

  // ERC20
  if (tokenResults) {
    tokenResults.forEach((res, i) => {
      const t = tokens[i];
      if (res.status !== "success" || res.result == null) return;
      const raw = res.result as bigint;
      if (raw <= 0n) return; // 过滤零余额

      out.push({
        chainKey: cfg.key,
        chainName: cfg.name,
        chainColor: cfg.color,
        symbol: t.symbol,
        name: t.name,
        isNative: false,
        balance: Number(formatUnits(raw, t.decimals)),
        rawBalance: raw.toString(),
        decimals: t.decimals,
        coingeckoId: t.coingeckoId,
      });
    });
  }

  // 这条链既没读到原生币也没读到代币 —— 视为失败，便于 UI 提示
  if (nativeResult === null && tokenResults === null) {
    throw new Error("RPC 请求失败");
  }

  return out;
}
