const HOLDINGS = [
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    chain: "Ethereum",
    balance: "0.8472",
    price: "88,420.00",
    change: -1.28,
    value: "74,912.31",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    chain: "Ethereum",
    balance: "12.4820",
    price: "3,142.80",
    change: 2.41,
    value: "39,229.15",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Base",
    balance: "24,500.00",
    price: "1.0001",
    change: 0.01,
    value: "24,502.45",
  },
  {
    symbol: "ARB",
    name: "Arbitrum",
    chain: "Arbitrum",
    balance: "8,240.00",
    price: "0.8423",
    change: 5.67,
    value: "6,940.55",
  },
];

const CHAINS = [
  { name: "Ethereum", pct: 68.2, color: "#5B9DEF" },
  { name: "Base", pct: 18.5, color: "#00D3B4" },
  { name: "Arbitrum", pct: 9.4, color: "#A78BFA" },
  { name: "BNB Chain", pct: 3.9, color: "#F5B544" },
];

function Change({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={up ? "text-up" : "text-down"}>
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function PortfolioPreview() {
  return (
    <div>
      {/* 顶部概览 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-border bg-surface-alt px-2 py-1 text-xs text-muted mono">
              0x7a3f...9d21
            </span>
            <span className="flex items-center gap-1.5 text-xs text-down">
              <span className="h-1.5 w-1.5 rounded-full bg-down" />
              4 条链已同步
            </span>
          </div>
          <div className="mt-4 text-3xl font-semibold text-fg num">
            $145,584.46
          </div>
          <div className="mt-1.5 text-sm">
            <span className="text-up num">+$2,601.24 (+1.82%)</span>
            <span className="ml-2 text-faint">24h</span>
          </div>
        </div>

        <div className="flex gap-2">
          {["1D", "1W", "1M", "ALL"].map((t, i) => (
            <span
              key={t}
              className={`rounded-sm border px-3 py-1.5 text-xs mono ${
                i === 1
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 链分布 */}
      <div className="mt-7">
        <div className="text-xs text-faint">按链分布</div>
        <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-elevated">
          {CHAINS.map((c) => (
            <div
              key={c.name}
              style={{ width: `${c.pct}%`, backgroundColor: c.color }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {CHAINS.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs text-muted">{c.name}</span>
              <span className="text-xs text-fg num">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 资产表格 */}
      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
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
            {HOLDINGS.map((h) => (
              <tr
                key={h.symbol}
                className="border-b border-border-soft last:border-0"
              >
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-bg"
                      style={{ backgroundColor: "#00D3B4" }}
                    >
                      {h.symbol.slice(0, 2)}
                    </span>
                    <div>
                      <div className="font-medium text-fg">{h.symbol}</div>
                      <div className="text-xs text-faint">{h.chain}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-right text-fg num">{h.balance}</td>
                <td className="py-3.5 text-right text-muted num">
                  ${h.price}
                </td>
                <td className="py-3.5 text-right num">
                  <Change value={h.change} />
                </td>
                <td className="py-3.5 text-right font-medium text-fg num">
                  ${h.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
