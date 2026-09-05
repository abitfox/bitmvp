import { cached, TTL } from "./cache";

/**
 * 价格服务。
 *
 * 用 CoinGecko 公共接口（无需 API Key，限制 ~10-30 次/分钟）。
 * 生产环境建议申请免费 Demo Key 并走 COINGECKO_API_KEY 环境变量。
 *
 * 设计原则：**价格挂了不能让整个资产页挂掉**。
 * 失败时返回空对象，UI 降级显示「—」，余额照常展示。
 */

const BASE = process.env.COINGECKO_BASE || "https://api.coingecko.com/api/v3";

export interface PriceData {
  usd: number;
  change24h: number | null;
}

export type PriceMap = Record<string, PriceData>;

/** 稳定币兜底价，价格 API 不可用时用 */
const FALLBACK: Record<string, number> = {
  tether: 1,
  "usd-coin": 1,
  dai: 1,
};

export async function getPrices(ids: string[]): Promise<PriceMap> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return {};

  return cached(`prices:${unique.slice().sort().join(",")}`, TTL.price, () =>
    fetchPrices(unique),
  );
}

async function fetchPrices(ids: string[]): Promise<PriceMap> {
  const url =
    `${BASE}/simple/price?ids=${encodeURIComponent(ids.join(","))}` +
    `&vs_currencies=usd&include_24hr_change=true`;

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      console.warn(`[prices] CoinGecko ${res.status}, 使用兜底价`);
      return fallbackOnly(ids);
    }

    const raw = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;

    const out: PriceMap = {};
    for (const id of ids) {
      const p = raw[id];
      // API 成功但没返回某个 id 时，稳定币仍兜底
      if (p?.usd != null) {
        out[id] = { usd: p.usd, change24h: p.usd_24h_change ?? null };
      } else if (FALLBACK[id] != null) {
        out[id] = { usd: FALLBACK[id], change24h: 0 };
      }
    }
    return out;
  } catch (err) {
    console.warn("[prices] 请求失败，使用兜底价:", err);
    return fallbackOnly(ids);
  }
}

function fallbackOnly(ids: string[]): PriceMap {
  const out: PriceMap = {};
  for (const id of ids) {
    if (FALLBACK[id] != null) out[id] = { usd: FALLBACK[id], change24h: 0 };
  }
  return out;
}
