"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { DEMO_ADDRESS, type PortfolioSnapshot } from "@/lib/chain/portfolio";
import {
  formatBalance,
  formatPct,
  formatPrice,
  formatUsd,
  shortenAddress,
  computePortfolioChange,
} from "@/lib/format";

/**
 * Portfolio 真实数据视图。
 *
 * 两种模式：
 * - 已连接钱包 → 查自己的地址
 * - 未连接 → 演示模式，展示一个公开地址的真实链上数据
 *
 * 「演示模式」是刻意设计的：面试官打开页面不需要装钱包、不需要授权，
 * 就能看到真实的链上读取效果。连不连钱包是他自己的选择。
 */
export function PortfolioLive() {
  const { address, isConnected } = useAccount();
  const queryAddress = address ?? DEMO_ADDRESS;
  const isDemo = !isConnected;

  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } =
    useQuery<PortfolioSnapshot>({
      queryKey: ["portfolio", queryAddress],
      queryFn: async () => {
        const res = await fetch(`/api/portfolio/${queryAddress}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "查询失败");
        return json.data as PortfolioSnapshot;
      },
      staleTime: 10_000,
    });

  /* ---------- 加载态 ---------- */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 w-56 animate-pulse rounded-md bg-elevated" />
        <div className="h-2 w-full animate-pulse rounded-full bg-elevated" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-elevated" />
          ))}
        </div>
        <p className="text-center text-xs text-faint">
          正在并行查询 {5} 条链的链上余额…
        </p>
      </div>
    );
  }

  /* ---------- 错误态 ---------- */
  if (error || !data) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 p-6 text-center">
        <div className="text-sm font-medium text-danger">读取失败</div>
        <p className="mt-2 text-xs text-muted">
          {error instanceof Error ? error.message : "未知错误"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-sm border border-border px-4 py-2 text-xs text-fg transition-colors hover:border-primary hover:text-primary"
        >
          重试
        </button>
      </div>
    );
  }

  const change = computePortfolioChange(data.holdings);
  const failedChains = data.chains.filter((c) => !c.ok);

  return (
    <div>
      {/* ---------- 顶部：地址 + 刷新 ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-border bg-surface-alt px-2 py-1 text-xs text-muted mono">
              {shortenAddress(data.address, 8, 6)}
            </span>
            {isDemo ? (
              <span className="rounded-sm border border-warning/40 bg-warning/10 px-2 py-1 text-xs text-warning">
                演示模式 · 示例地址
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-sm border border-down/40 bg-down/10 px-2 py-1 text-xs text-down">
                <span className="h-1.5 w-1.5 rounded-full bg-down" />
                已连接
              </span>
            )}
            <span className="text-xs text-faint">
              {data.meta.chainOk}/{data.meta.chainTotal} 条链 ·{" "}
              {data.meta.durationMs}ms
            </span>
          </div>

          <div className="mt-4 text-3xl font-semibold text-fg num">
            {formatUsd(data.totalUsd)}
          </div>

          {change != null && (
            <div className="mt-1.5 text-sm">
              <span className={`num ${change >= 0 ? "text-up" : "text-down"}`}>
                {formatPct(change)}
              </span>
              <span className="ml-2 text-xs text-faint">24h（按持仓加权）</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {isFetching ? "刷新中…" : "刷新"}
        </button>
      </div>

      {isDemo && (
        <p className="mt-4 rounded-sm border border-border bg-surface-alt px-3 py-2 text-xs leading-relaxed text-muted">
          未连接钱包，当前展示的是一个公开地址的
          <span className="text-fg">真实链上数据</span>
          。点击右上角「连接钱包」即可查看你自己的资产。
        </p>
      )}

      {/* ---------- 价格服务降级提示 ---------- */}
      {!data.pricesAvailable && (
        <p className="mt-4 rounded-sm border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
          价格服务暂时不可用，仅展示代币余额（链上读取正常）。
        </p>
      )}

      {/* ---------- 部分链失败提示 ---------- */}
      {failedChains.length > 0 && (
        <p className="mt-3 rounded-sm border border-border bg-surface-alt px-3 py-2 text-xs text-muted">
          {failedChains.map((c) => c.chainName).join("、")} 读取失败，已跳过
          <span className="ml-1 text-faint">
            （公共 RPC 限流，配置 Alchemy 后可解决）
          </span>
        </p>
      )}

      {/* ---------- 按链分布 ---------- */}
      {data.chains.some((c) => c.valueUsd > 0) && (
        <div className="mt-7">
          <div className="text-xs text-faint">按链分布</div>
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-elevated">
            {data.chains
              .filter((c) => c.pct > 0)
              .map((c) => (
                <div
                  key={c.chainKey}
                  style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                />
              ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {data.chains.map((c) => (
              <div key={c.chainKey} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-xs text-muted">{c.chainName}</span>
                <span className="text-xs text-fg num">
                  {c.pct > 0 ? `${c.pct.toFixed(1)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- 持仓表 ---------- */}
      {data.holdings.length === 0 ? (
        <p className="mt-8 rounded-md border border-border bg-surface-alt px-4 py-8 text-center text-sm text-muted">
          该地址在受支持的 {data.meta.chainTotal} 条链上没有检测到持仓。
        </p>
      ) : (
        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-faint">
                <th className="pb-2.5 font-normal">资产</th>
                <th className="pb-2.5 text-right font-normal">余额</th>
                <th className="pb-2.5 text-right font-normal">价格</th>
                <th className="pb-2.5 text-right font-normal">24h</th>
                <th className="pb-2.5 text-right font-normal">价值</th>
              </tr>
            </thead>
            <tbody>
              {data.holdings.map((h) => (
                <tr
                  key={`${h.chainKey}-${h.symbol}`}
                  className="border-b border-border-soft last:border-0"
                >
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-bg"
                        style={{ backgroundColor: h.chainColor }}
                      >
                        {h.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-fg">{h.symbol}</span>
                          {h.isNative && (
                            <span className="rounded-sm border border-border px-1 py-px text-[10px] text-faint">
                              原生
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-faint">{h.chainName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-fg num">
                    {formatBalance(h.balance)}
                  </td>
                  <td className="py-3.5 text-right text-muted num">
                    {formatPrice(h.priceUsd)}
                  </td>
                  <td className="py-3.5 text-right num">
                    {h.change24h == null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className={h.change24h >= 0 ? "text-up" : "text-down"}>
                        {formatPct(h.change24h)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right font-medium text-fg num">
                    {formatUsd(h.valueUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 text-xs text-faint">
        数据于 {new Date(dataUpdatedAt).toLocaleTimeString("zh-CN")} 获取 ·
        缓存在服务端，15 秒内重复查询不会打链
      </p>
    </div>
  );
}
