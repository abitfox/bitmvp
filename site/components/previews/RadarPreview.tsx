const FLOWS = [
  {
    addr: "0x9f2c...4a18",
    label: "Smart Money #07",
    action: "买入" as const,
    token: "PEPE",
    amount: "420,000",
    usd: "$1,284,600",
    time: "12 秒前",
  },
  {
    addr: "0x3d81...be07",
    label: "Smart Money #12",
    action: "买入" as const,
    token: "LINK",
    amount: "38,400",
    usd: "$682,560",
    time: "47 秒前",
  },
  {
    addr: "0x1ab4...7f3d",
    label: "交易所热钱包",
    action: "卖出" as const,
    token: "UNI",
    amount: "92,150",
    usd: "$764,923",
    time: "1 分钟前",
  },
  {
    addr: "0xc7e9...2b55",
    label: "Smart Money #03",
    action: "买入" as const,
    token: "ARB",
    amount: "512,000",
    usd: "$431,232",
    time: "2 分钟前",
  },
  {
    addr: "0x6b02...dd91",
    label: "未标记地址",
    action: "卖出" as const,
    token: "AAVE",
    amount: "1,840",
    usd: "$318,432",
    time: "3 分钟前",
  },
];

const TOKENS = [
  { sym: "PEPE", net: "+2.14M", pct: 78 },
  { sym: "LINK", net: "+1.86M", pct: 64 },
  { sym: "ARB", net: "+0.94M", pct: 42 },
  { sym: "UNI", net: "-0.61M", pct: 26 },
];

export function RadarPreview() {
  return (
    <div>
      {/* 顶部筛选 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["全部", "聪明钱", "大额异动", "我的关注"].map((t, i) => (
            <span
              key={t}
              className={`rounded-sm border px-3 py-1.5 text-xs ${
                i === 1
                  ? "border-radar bg-radar/10 text-radar"
                  : "border-border text-muted"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-down">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-down" />
          实时推送中
        </span>
      </div>

      {/* 净流入榜 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TOKENS.map((t) => {
          const inflow = t.net.startsWith("+");
          return (
            <div
              key={t.sym}
              className="rounded-md border border-border bg-surface-alt p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-fg">{t.sym}</span>
                <span
                  className={`text-xs num ${inflow ? "text-up" : "text-down"}`}
                >
                  {t.net}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${t.pct}%`,
                    backgroundColor: inflow ? "#FF6B6B" : "#3DD68C",
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-faint">1h 净流入</div>
            </div>
          );
        })}
      </div>

      {/* 资金流列表 */}
      <div className="mt-7">
        <div className="text-xs text-faint">最新大额动向</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-faint">
                <th className="pb-2.5 font-normal">地址</th>
                <th className="pb-2.5 font-normal">动作</th>
                <th className="pb-2.5 font-normal">代币</th>
                <th className="pb-2.5 text-right font-normal">数量</th>
                <th className="pb-2.5 text-right font-normal">价值</th>
                <th className="pb-2.5 text-right font-normal">时间</th>
              </tr>
            </thead>
            <tbody>
              {FLOWS.map((f) => (
                <tr
                  key={f.addr}
                  className="border-b border-border-soft last:border-0"
                >
                  <td className="py-3">
                    <div className="text-fg mono">{f.addr}</div>
                    <div className="text-xs text-faint">{f.label}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-sm border px-2 py-0.5 text-xs ${
                        f.action === "买入"
                          ? "border-up/40 bg-up/10 text-up"
                          : "border-down/40 bg-down/10 text-down"
                      }`}
                    >
                      {f.action}
                    </span>
                  </td>
                  <td className="py-3 text-fg">{f.token}</td>
                  <td className="py-3 text-right text-muted num">
                    {f.amount}
                  </td>
                  <td className="py-3 text-right font-medium text-fg num">
                    {f.usd}
                  </td>
                  <td className="py-3 text-right text-faint num">{f.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
