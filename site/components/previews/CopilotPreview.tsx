const TOOL_CALLS = [
  { name: "portfolio.getBalances", args: '{ "chains": ["eth","base","arb"] }', ms: 412 },
  { name: "market.getPrices", args: '{ "symbols": ["WBTC","ETH","ARB"] }', ms: 188 },
  { name: "radar.getNetFlow", args: '{ "window": "1h" }', ms: 634 },
];

export function CopilotPreview() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* 用户提问 */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-md rounded-br-sm bg-elevated px-4 py-3 text-sm text-fg">
          我现在的仓位集中度是不是太高了？如果想调仓，先看哪个标的？
        </div>
      </div>

      {/* 工具调用过程 */}
      <div className="mt-5 space-y-2">
        {TOOL_CALLS.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-3 rounded-sm border border-ai/25 bg-ai/5 px-3.5 py-2.5"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-ai text-[10px] font-bold text-bg">
              ⚡
            </span>
            <span className="text-xs text-ai mono">{t.name}</span>
            <span className="truncate text-xs text-faint mono">
              {t.args}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-down">
              <span className="h-1.5 w-1.5 rounded-full bg-down" />
              {t.ms}ms
            </span>
          </div>
        ))}
      </div>

      {/* AI 回答 */}
      <div className="mt-5 rounded-md rounded-bl-sm border border-border bg-surface-alt px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-ai text-[10px] font-bold text-bg">
            AI
          </span>
          <span className="text-xs font-semibold text-ai">BitMVP Copilot</span>
        </div>

        <div className="mt-3.5 space-y-3 text-sm leading-relaxed text-fg">
          <p>
            是的，集中度偏高。
            <span className="text-fg font-medium">WBTC 单仓占 51.5%</span>
            ，超过总仓位一半，且它是你唯一没有对冲的单一资产风险敞口。
          </p>
          <p>基于刚才调用的三个工具，给你三条可执行的判断依据：</p>
          <ol className="space-y-2">
            <li className="flex gap-2.5">
              <span className="shrink-0 text-ai num">01</span>
              <span className="text-muted">
                <span className="text-fg">ARB 1 小时净流入 +94 万</span>
                ，是四个观察标的里资金流入最持续的，短期有资金支撑。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 text-ai num">02</span>
              <span className="text-muted">
                <span className="text-fg">WBTC 24h 下跌 1.28%</span>
                ，与你的 ETH 持仓相关性过高（同属大盘 beta），减仓 WBTC
                能同时降低集中度和相关性。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 text-ai num">03</span>
              <span className="text-muted">
                若要调仓，建议先去
                <span className="text-swap"> Swap </span>
                比较路由 —— 当前 WBTC → ARB 的最优路径到手量比次优高 0.41%。
              </span>
            </li>
          </ol>
        </div>

        {/* 行动建议 */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          <span className="rounded-sm border border-swap/40 bg-swap/10 px-3 py-1.5 text-xs text-swap">
            去 Swap 比价
          </span>
          <span className="rounded-sm border border-radar/40 bg-radar/10 px-3 py-1.5 text-xs text-radar">
            查看 ARB 资金流
          </span>
          <span className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted">
            导出这份分析
          </span>
        </div>

        <p className="mt-4 text-xs text-faint">
          以上结论由 3 次工具调用生成，原始数据可展开核对 ·
          涉及转账的操作需你二次确认
        </p>
      </div>

      {/* 输入框 */}
      <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-surface-alt px-4 py-3">
        <span className="text-sm text-faint">继续追问…</span>
        <span className="ml-auto rounded-sm bg-ai px-3 py-1.5 text-xs font-medium text-bg">
          发送
        </span>
      </div>
    </div>
  );
}
