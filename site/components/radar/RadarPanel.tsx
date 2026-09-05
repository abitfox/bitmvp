"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CHAINS } from "@/lib/chain/chains";
import {
  type MarketPulse,
  type OnchainPulse,
  explorerUrlOf,
} from "@/lib/chain/radar";
import { shortenAddress, formatUsd, formatPrice } from "@/lib/format";

/**
 * Radar 主面板：三个信号源。
 *
 * - 市场热度 / 市场异动：CoinGecko 公共接口（缓存 1-2 分钟）
 * - 链上脉搏：直接读公共 RPC 最新区块（缓存 15s），从真实交易里捞大额转账
 *
 * 涨红跌绿、地址等宽、数值等宽 —— 全部按设计规范。
 */
export function RadarPanel() {
  return (
    <div className="space-y-8">
      <MarketSection />
      <OnchainSection />
    </div>
  );
}

/* ================= 市场信号 ================= */

function MarketSection() {
  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } =
    useQuery<MarketPulse>({
      queryKey: ["radar-market"],
      queryFn: async () => {
        const res = await fetch("/api/radar/market");
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "获取市场数据失败");
        return json.data as MarketPulse;
      },
      staleTime: 60_000,
    });

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-md bg-elevated"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 p-6 text-center">
        <div className="text-sm font-medium text-danger">市场数据读取失败</div>
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

  const empty =
    data.trending.length === 0 &&
    data.gainers.length === 0 &&
    data.losers.length === 0;

  if (empty) {
    return (
      <p className="rounded-md border border-border bg-surface-alt px-4 py-8 text-center text-sm text-muted">
        市场数据源暂时不可用（公共 API 限流），稍后自动恢复。
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">市场信号</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-faint">
            更新于 {new Date(dataUpdatedAt).toLocaleTimeString("zh-CN")}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isFetching ? "刷新中…" : "刷新"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CoinList
          title="市场热度"
          subtitle="讨论度最高的代币"
          coins={data.trending.map((t) => ({
            id: t.id,
            symbol: t.symbol,
            name: t.name,
            priceUsd: t.priceUsd,
            change24h: t.change24h,
            extra: t.marketCapRank ? `MC #${t.marketCapRank}` : null,
          }))}
        />
        <CoinList
          title="市值 Top100 · 24h 领涨"
          subtitle="大盘异动"
          coins={data.gainers}
        />
        <CoinList
          title="市值 Top100 · 24h 领跌"
          subtitle="大盘异动"
          coins={data.losers}
        />
        <div className="rounded-md border border-border bg-surface-alt p-4">
          <div className="text-xs text-faint">数据口径说明</div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            热度榜来自 CoinGecko 趋势接口（每 2 分钟刷新）；涨跌榜为市值
            Top 100 中的 24 小时极值（每分钟刷新）。市场情绪只做参考，
            链上脉搏才是本模块的硬核数据。
          </p>
        </div>
      </div>
    </div>
  );
}

function CoinList({
  title,
  subtitle,
  coins,
}: {
  title: string;
  subtitle: string;
  coins: Array<{
    id: string;
    symbol: string;
    name: string;
    priceUsd: number | null;
    change24h: number | null;
    extra?: string | null;
  }>;
}) {
  if (coins.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-surface-alt p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-fg">{title}</span>
        <span className="text-xs text-faint">{subtitle}</span>
      </div>
      <div className="mt-3 space-y-1">
        {coins.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-elevated"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 text-xs text-faint num">{i + 1}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-fg">
                    {c.symbol}
                  </span>
                  {c.extra && (
                    <span className="rounded-sm border border-border px-1 text-[10px] text-faint">
                      {c.extra}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-faint">{c.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted num">
                {c.priceUsd != null ? formatPrice(c.priceUsd) : "—"}
              </div>
              {c.change24h != null && (
                <div
                  className={`text-xs num ${c.change24h >= 0 ? "text-up" : "text-down"}`}
                >
                  {c.change24h >= 0 ? "+" : ""}
                  {c.change24h.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= 链上脉搏 ================= */

function OnchainSection() {
  const [chainKey, setChainKey] = useState("ethereum");

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } =
    useQuery<OnchainPulse>({
      queryKey: ["radar-onchain", chainKey],
      queryFn: async () => {
        const res = await fetch(`/api/radar/onchain?chainKey=${chainKey}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "读取链上数据失败");
        return json.data as OnchainPulse;
      },
      staleTime: 15_000,
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold text-fg">链上脉搏</h3>
          <span className="flex items-center gap-1.5 rounded-sm border border-down/40 bg-down/10 px-2 py-0.5 text-xs text-down">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-down" />
            直读区块链
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHAINS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setChainKey(c.key)}
              className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                chainKey === c.key
                  ? "border-radar bg-radar/10 text-radar"
                  : "border-border text-muted hover:border-border-strong"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-faint">
        下方数据来自公共 RPC 最新区块的原始交易，不经过任何第三方 API ——
        鲸鱼转账是直接从区块里捞出来的真实记录。
      </p>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <div className="h-20 animate-pulse rounded-md bg-elevated" />
          <div className="h-48 animate-pulse rounded-md bg-elevated" />
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-danger/40 bg-danger/5 p-6 text-center">
          <div className="text-sm font-medium text-danger">链上读取失败</div>
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
      )}

      {data && (
        <>
          {/* 区块统计 */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="最新区块"
              value={data.blockNumber.toLocaleString("en-US")}
              hint={`~${data.blockTimeSec}s / 块`}
            />
            <Stat label="区块交易数" value={String(data.txCount)} hint="最近一个块" />
            <Stat
              label="Base Fee"
              value={`${data.baseFeeGwei.toFixed(2)} gwei`}
              hint={`Gas 使用 ${data.gasUsedRatio.toFixed(1)}%`}
            />
            <Stat
              label="大额转账"
              value={`${data.whaleTxs.length} 笔`}
              hint={`≥ ${
                { ethereum: 50, base: 20, arbitrum: 20, optimism: 20, bnb: 100 }[
                  data.chainKey
                ] ?? 20
              } ${data.nativeSymbol}`}
            />
          </div>

          {/* 鲸鱼转账表 */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-faint">
                最新区块大额转账（{data.chainName}）
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-faint">
                  {new Date(dataUpdatedAt).toLocaleTimeString("zh-CN")}
                </span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-radar hover:text-radar disabled:opacity-50"
                >
                  {isFetching ? "刷新中…" : "刷新"}
                </button>
              </div>
            </div>

            {data.whaleTxs.length === 0 ? (
              <p className="mt-3 rounded-md border border-border bg-surface-alt px-4 py-6 text-center text-sm text-muted">
                最新区块没有超过阈值的大额转账（这本身就是信息：鲸鱼今天安静）。
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-faint">
                      <th className="pb-2.5 font-normal">转账方</th>
                      <th className="pb-2.5 font-normal">接收方</th>
                      <th className="pb-2.5 text-right font-normal">金额</th>
                      <th className="pb-2.5 text-right font-normal">交易</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.whaleTxs.map((tx) => (
                      <tr
                        key={tx.hash}
                        className="border-b border-border-soft last:border-0"
                      >
                        <td className="py-3">
                          <a
                            href={`${explorerUrlOf(data.chainKey)}/address/${tx.from}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-fg mono hover:text-primary"
                          >
                            {shortenAddress(tx.from)}
                          </a>
                        </td>
                        <td className="py-3">
                          <a
                            href={`${explorerUrlOf(data.chainKey)}/address/${tx.to}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted mono hover:text-primary"
                          >
                            {shortenAddress(tx.to)}
                          </a>
                        </td>
                        <td className="py-3 text-right font-medium text-up num">
                          {tx.valueNative.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {data.nativeSymbol}
                        </td>
                        <td className="py-3 text-right">
                          <a
                            href={`${explorerUrlOf(data.chainKey)}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            查看 ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-3 text-xs text-faint">
              汇总：最近一个区块内共转移约{" "}
              <span className="text-muted num">
                {data.whaleTxs
                  .reduce((a, t) => a + t.valueNative, 0)
                  .toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
                {data.nativeSymbol}
              </span>{" "}
              的大额资金。
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-alt p-3.5">
      <div className="text-xs text-faint">{label}</div>
      <div className="mt-1.5 text-xl font-semibold text-fg num">{value}</div>
      <div className="mt-0.5 text-xs text-faint">{hint}</div>
    </div>
  );
}
