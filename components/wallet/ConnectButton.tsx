"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { shortenAddress } from "@/lib/format";

/**
 * 连接钱包按钮。
 *
 * 只挂 injected connector —— 覆盖 MetaMask / Rabby / OKX Wallet 等
 * 所有注入 window.ethereum 的钱包，不需要接 WalletConnect 那套复杂度。
 */
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="点击断开连接"
        className="flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:border-primary hover:bg-primary/20"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="mono">{shortenAddress(address)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-primary-dark hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "连接中…" : "连接钱包"}
      {error && (
        <span className="ml-2 text-xs text-danger">
          {error.message.slice(0, 20)}
        </span>
      )}
    </button>
  );
}
