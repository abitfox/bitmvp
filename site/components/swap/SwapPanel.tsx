"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { CHAINS, CHAIN_BY_KEY } from "@/lib/chain/chains";
import { TOKENS } from "@/lib/chain/tokens";
import { type SwapQuote } from "@/lib/chain/swap";
import { formatBalance, formatUsd } from "@/lib/format";
import { useSwapExecution } from "./useSwapExecution";

const STEP_TEXT: Record<string, string> = {
  "switching-chain": "正在切换链…请在钱包中确认",
  "checking-allowance": "正在查询授权额度…",
  approving: "请在钱包中确认授权（approve）…",
  "waiting-approval": "等待授权上链…",
  "sending-swap": "请在钱包中确认交易…",
  "waiting-swap": "交易已广播，等待上链确认…",
  done: "交易成功！",
};

/**
 * Swap 交易台。
 *
 * 报价走服务端 API（Uniswap V3 QuoterV2 链上报价），
 * 执行走浏览器钱包（approve → exactInputSingle）。
 */
export function SwapPanel() {
  const { isConnected } = useAccount();
  const [chainKey, setChainKey] = useState("ethereum");
  const [fromTokenSymbol, setFromTokenSymbol] = useState("USDC");
  const [toTokenSymbol, setToTokenSymbol] = useState("WETH");
  const [fromAmount, setFromAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { step, error: execError, txHash, execute, reset } = useSwapExecution();

  const chain = CHAIN_BY_KEY.get(chainKey);
  const tokens = TOKENS[chainKey];
  const fromToken = tokens.find((t) => t.symbol === fromTokenSymbol);
  const toToken = tokens.find((t) => t.symbol === toTokenSymbol);

  const busy = step !== "idle" && step !== "done" && step !== "error";

  const handleFetchQuote = async () => {
    const amt = parseFloat(fromAmount);
    if (!amt || amt <= 0) {
      setError("请输入有效的数量");
      return;
    }

    setLoading(true);
    setError(null);
    reset();
    try {
      const res = await fetch(
        `/api/swap/quote?chainKey=${chainKey}&fromTokenSymbol=${fromTokenSymbol}&toTokenSymbol=${toTokenSymbol}&fromAmount=${amt}&slippageBps=${slippageBps}`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "获取报价失败");
      setQuote(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    const routerAddress = chain?.uniswapRouter ?? chain?.uniswapUniversalRouter;
    if (!isConnected || !quote || !fromToken || !routerAddress) return;

    const amountIn = parseUnits(
      quote.fromAmount.toString(),
      fromToken.decimals,
    );
    // minOutput 转最小单位：用报价代币的 decimals
    const outTokenDecimals = quote.toToken.decimals;
    const amountOutMinimum = parseUnits(
      quote.minOutput.toFixed(Math.min(outTokenDecimals, 8)),
      outTokenDecimals,
    );

    await execute({
      chainKey,
      tokenInAddress: fromToken.address,
      tokenOutAddress:
        toToken?.address === "0x0000000000000000000000000000000000000000"
          ? chain?.wNativeAddress ?? "0x0000000000000000000000000000000000000000"
          : toToken!.address,
      feeTier: quote.feeTier ?? 500,
      amountIn,
      amountOutMinimum,
      routerAddress: routerAddress as `0x${string}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 链选择 */}
      <div>
        <label className="mb-2 block text-xs text-faint">选择链</label>
        <div className="flex flex-wrap gap-2">
          {CHAINS.map((c) => (
            <button
              key={c.key}
              type="button"
              disabled={busy}
              onClick={() => {
                setChainKey(c.key);
                setQuote(null);
                reset();
              }}
              className={`rounded-sm border px-3 py-2 text-xs transition-colors ${
                chainKey === c.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:border-border-strong"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 代币对 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs text-faint">出售</label>
          <select
            value={fromTokenSymbol}
            disabled={busy}
            onChange={(e) => {
              setFromTokenSymbol(e.target.value);
              setQuote(null);
            }}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {tokens.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs text-faint">购买</label>
          <select
            value={toTokenSymbol}
            disabled={busy}
            onChange={(e) => {
              setToTokenSymbol(e.target.value);
              setQuote(null);
            }}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {tokens.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 数量输入 */}
      <div>
        <label className="mb-2 block text-xs text-faint">
          输入数量 ({fromToken?.symbol})
        </label>
        <input
          type="number"
          value={fromAmount}
          disabled={busy}
          onChange={(e) => {
            setFromAmount(e.target.value);
            setQuote(null);
          }}
          placeholder="0.0"
          className="mono w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </div>

      {/* 滑点 */}
      <div>
        <label className="mb-2 block text-xs text-faint">
          滑点容忍度 {(slippageBps / 100).toFixed(2)}%
        </label>
        <div className="flex gap-2">
          {[10, 50, 100, 300].map((bps) => (
            <button
              key={bps}
              type="button"
              disabled={busy}
              onClick={() => {
                setSlippageBps(bps);
                setQuote(null);
              }}
              className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                slippageBps === bps
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:border-border-strong"
              }`}
            >
              {bps / 100}%
            </button>
          ))}
        </div>
      </div>

      {/* 获取报价 */}
      <button
        type="button"
        onClick={handleFetchQuote}
        disabled={loading || busy}
        className="w-full rounded-sm bg-primary px-4 py-3 text-sm font-medium text-bg transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "正在链上询价…" : "获取报价"}
      </button>

      {/* 报价错误 */}
      {error && (
        <div className="rounded-sm border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      {/* 报价详情 */}
      {quote && (
        <div className="space-y-4 rounded-sm border border-border bg-surface-alt p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">报价</span>
            <span className="text-xs text-faint">{quote.route}</span>
          </div>

          <div className="space-y-2">
            <Row
              label={`${quote.fromToken.symbol} → ${quote.toToken.symbol}`}
              value={`${formatBalance(quote.fromAmount)} → ${formatBalance(quote.toAmount)}`}
            />
            <Row
              label="价格"
              value={`1 ${quote.fromToken.symbol} = ${formatBalance(quote.price)} ${quote.toToken.symbol}`}
            />
            <Row
              label={`最小输出（滑点保护）`}
              value={`${formatBalance(quote.minOutput)} ${quote.toToken.symbol}`}
            />
            <Row label="价格影响（估）" value={`${(quote.priceImpact * 100).toFixed(3)}%`} />
            <Row
              label="Gas 费（估）"
              value={
                quote.gasCostUsd > 0
                  ? `${quote.gasCostNative.toFixed(6)} · ${formatUsd(quote.gasCostUsd)}`
                  : `${quote.gasCostNative.toFixed(6)}`
              }
            />
          </div>

          {quote.isSimulated && (
            <p className="rounded-sm border border-warning/40 bg-warning/5 px-2 py-1.5 text-xs text-warning">
              当前为模拟报价（该代币对暂无链上流动性数据）
            </p>
          )}

          {/* 执行状态 */}
          {busy && (
            <div className="rounded-sm border border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary">
              {STEP_TEXT[step]}
            </div>
          )}
          {step === "done" && txHash && (
            <div className="rounded-sm border border-down/40 bg-down/10 px-3 py-2 text-xs text-down">
              交易成功 ·{" "}
              <a
                href={`${chainExplorerUrl(chainKey)}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                查看交易 {txHash.slice(0, 10)}…
              </a>
            </div>
          )}
          {execError && (
            <div className="rounded-sm border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
              {execError}
            </div>
          )}

          <button
            type="button"
            onClick={handleSwap}
            disabled={!isConnected || busy || quote.isSimulated}
            className="w-full rounded-sm bg-primary px-4 py-3 text-sm font-medium text-bg transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnected ? "确认交易" : "请先连接钱包"}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="num text-fg">{value}</span>
    </div>
  );
}

function chainExplorerUrl(chainKey: string): string {
  const urls: Record<string, string> = {
    ethereum: "https://etherscan.io",
    base: "https://basescan.org",
    arbitrum: "https://arbiscan.io",
    optimism: "https://optimistic.etherscan.io",
    bnb: "https://bscscan.com",
  };
  return urls[chainKey] ?? "https://etherscan.io";
}
