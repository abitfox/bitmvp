const ROUTES = [
  { name: "Uniswap V3", pct: 62, out: "1,842.61", selected: true },
  { name: "Curve", pct: 28, out: "1,841.90", selected: false },
  { name: "1inch Fusion", pct: 10, out: "1,839.44", selected: false },
];

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "warning";
}) {
  const cls =
    tone === "warning"
      ? "text-warning"
      : tone === "muted"
        ? "text-muted"
        : "text-fg";
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-faint">{label}</span>
      <span className={`text-xs ${cls} num`}>{value}</span>
    </div>
  );
}

export function SwapPreview() {
  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-fg">兑换</h3>
        <span className="rounded-sm border border-border bg-surface-alt px-2 py-1 text-xs text-muted">
          滑点 0.5%
        </span>
      </div>

      {/* From */}
      <div className="mt-5 rounded-md border border-border bg-surface-alt p-4">
        <div className="flex items-center justify-between text-xs text-faint">
          <span>支付</span>
          <span>余额 12.482 ETH</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-2xl font-semibold text-fg num">1.0</span>
          <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-bg"
              style={{ backgroundColor: "#5B9DEF" }}
            >
              ET
            </span>
            <span className="text-sm font-medium text-fg">ETH</span>
            <span className="text-xs text-faint">▾</span>
          </span>
        </div>
        <div className="mt-2 text-xs text-faint num">≈ $3,142.80</div>
      </div>

      {/* 切换 */}
      <div className="relative -my-3 flex justify-center">
        <span className="z-10 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-sm text-primary">
          ↓
        </span>
      </div>

      {/* To */}
      <div className="rounded-md border border-border bg-surface-alt p-4">
        <div className="flex items-center justify-between text-xs text-faint">
          <span>收到（预估）</span>
          <span>余额 24,500 USDC</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-2xl font-semibold text-fg num">1,842.61</span>
          <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-bg"
              style={{ backgroundColor: "#00D3B4" }}
            >
              US
            </span>
            <span className="text-sm font-medium text-fg">USDC</span>
            <span className="text-xs text-faint">▾</span>
          </span>
        </div>
        <div className="mt-2 text-xs text-faint num">≈ $1,842.79</div>
      </div>

      {/* 路由比价 */}
      <div className="mt-5">
        <div className="text-xs text-faint">路由比价</div>
        <div className="mt-2 space-y-1.5">
          {ROUTES.map((r) => (
            <div
              key={r.name}
              className={`flex items-center justify-between rounded-sm border px-3 py-2 ${
                r.selected
                  ? "border-swap bg-swap/10"
                  : "border-border bg-surface-alt"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs ${r.selected ? "text-swap" : "text-muted"}`}
                >
                  {r.name}
                </span>
                <span className="text-xs text-faint">{r.pct}%</span>
              </div>
              <span className="text-xs text-fg num">{r.out}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 成本明细 */}
      <div className="mt-5 rounded-md border border-border bg-surface-alt px-4 py-2">
        <Row label="汇率" value="1 ETH = 1,842.61 USDC" />
        <Row label="价格影响" value="-0.12%" tone="muted" />
        <Row label="滑点容忍" value="0.5%" tone="muted" />
        <Row label="网络费（预估）" value="$2.14" tone="muted" />
        <Row label="最小到账" value="1,833.40 USDC" tone="warning" />
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-sm bg-swap px-4 py-3 text-sm font-semibold text-bg"
      >
        确认兑换
      </button>
      <p className="mt-3 text-center text-xs text-faint">
        签名前可撤销 · 授权额度将精确匹配本次数量
      </p>
    </div>
  );
}
