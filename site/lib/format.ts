/**
 * 数值格式化。
 *
 * ⚠️ 全部固定用 en-US locale —— 服务端与客户端格式必须一致，
 * 否则会触发 React hydration mismatch。
 */

export function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 代币余额：小额保留更多小数位，大额加千分位 */
export function formatBalance(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1000) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (n >= 1) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return n.toLocaleString("en-US", { maximumSignificantDigits: 6 });
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(4)}`;
}

export function formatPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

/**
 * 用各资产的 24h 涨跌反推组合整体涨跌幅。
 *
 * 不能直接对百分比求平均 —— 那会让 100 块的小仓位和 10 万的大仓位同权。
 * 正确做法：先由「当前价 + 涨跌幅」反推 24h 前的市值，再算整体变化。
 */
export function computePortfolioChange(
  holdings: { valueUsd: number | null; change24h: number | null }[],
): number | null {
  let total = 0;
  let prev = 0;
  let hasData = false;

  for (const h of holdings) {
    if (h.valueUsd == null || h.change24h == null) continue;
    const v = h.valueUsd;
    const c = h.change24h;
    if (c <= -100) continue; // 分母会变 0 或负数，跳过
    total += v;
    prev += v / (1 + c / 100);
    hasData = true;
  }

  if (!hasData || prev <= 0) return null;
  return ((total - prev) / prev) * 100;
}
