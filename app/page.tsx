import Link from "next/link";
import { MODULES, LOOP_ORDER, getModule } from "@/lib/products";
import { StatusBadge } from "@/components/StatusBadge";

export default function HomePage() {
  return (
    <>
      {/* ============ Hero ============ */}
      <section className="glow-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs text-muted">
                One Account, Full Onchain Control
              </span>
            </div>

            <h1 className="mt-7 text-4xl leading-[1.15] font-bold tracking-tight text-fg md:text-6xl">
              链上资产
              <span className="text-primary">智能工作台</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              BitMVP 把散落在多条链上的资产、交易与信号收拢进同一个工作台。
              四个模块共享一套链上数据服务层，构成
              <span className="text-fg">「查看 → 执行 → 洞察 → 辅助」</span>
              的完整闭环。
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/portfolio"
                className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-primary-dark hover:text-fg"
              >
                进入 Portfolio
              </Link>
              <a
                href="#modules"
                className="rounded-sm border border-border bg-surface px-6 py-3 text-sm font-medium text-fg transition-colors hover:border-primary hover:text-primary"
              >
                查看产品矩阵
              </a>
            </div>

            {/* 数据条：让「壳」也有内容感 */}
            <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {[
                { label: "支持链路", value: "5+" },
                { label: "产品模块", value: "4" },
                { label: "数据来源", value: "链上直读" },
                { label: "上手门槛", value: "无需注册" },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-xs text-faint">{s.label}</dt>
                  <dd className="mt-1.5 text-2xl font-semibold text-fg num">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ============ 产品矩阵 ============ */}
      <section id="modules" className="mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-fg">
            四个模块，一个产品
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            每个模块回答用户的一个问题。它们不是并列的四个功能，而是同一次决策的四个环节。
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {MODULES.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="card group relative overflow-hidden p-6 transition-colors hover:border-primary/50"
            >
              {/* 模块色顶边 */}
              <div
                className="absolute inset-x-0 top-0 h-0.5 opacity-70"
                style={{ backgroundColor: m.hex }}
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="text-xs font-semibold tracking-wider uppercase"
                    style={{ color: m.hex }}
                  >
                    {m.short}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-fg">
                    {m.question}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{m.tagline}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>

              <p className="mt-5 text-sm leading-relaxed text-muted">
                {m.desc}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {m.features.slice(0, 3).map((f) => (
                  <span
                    key={f.title}
                    className="rounded-sm border border-border-soft bg-surface-alt px-2.5 py-1 text-xs text-muted"
                  >
                    {f.title}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2.5" style={{ color: m.hex }}>
                了解 {m.short}
                <span aria-hidden>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ 闭环 ============ */}
      <section className="border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-fg">
              闭环是怎么转起来的
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              用户在四个模块之间自然流转，每一步的输出都是下一步的输入；
              底层则由同一套链上数据服务支撑 —— 这是「一个产品」与「四个 demo」的分界线。
            </p>
          </div>

          {/* 用户流 */}
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {LOOP_ORDER.map((key, i) => {
              const m = getModule(key);
              return (
                <div key={key} className="relative">
                  <div className="card h-full p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-faint num">
                        0{i + 1}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: m.hex }}
                      >
                        {m.short}
                      </span>
                    </div>
                    <div className="mt-4 text-base font-semibold text-fg">
                      {m.question}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {m.tagline}
                    </p>
                  </div>
                  {i < LOOP_ORDER.length - 1 && (
                    <div className="absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 text-lg text-border md:block">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 数据层 */}
          <div className="mt-8 rounded-md border border-primary/25 bg-primary/5 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-primary px-2 py-1 text-xs font-semibold text-bg">
                共享底座
              </span>
              <h3 className="text-base font-semibold text-fg">
                统一链上数据服务层
              </h3>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              四个模块不各自取数。所有链上读取、价格与代币信息都来自同一层服务，
              统一处理缓存与异常。
              <span className="text-fg">
                Copilot 也不另起炉灶 —— 它调用的正是这套服务。
              </span>
              改一处，四个模块同时生效。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "一次请求聚合多链余额",
                "代币信息自动补全",
                "多源价格聚合",
                "逐块索引链上转账",
                "能力以工具形式开放",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-sm border border-primary/25 bg-bg px-2.5 py-1 text-xs text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 为什么可信 ============ */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-fg">
            数据从哪来，为什么可信
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            链上工具最让人不安的，是不知道屏幕上的数字从哪来。
            我们把数据来源、成本构成和操作边界都摊开给你。
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            {
              title: "数字直接来自链上",
              desc: "余额、行情与转账记录都从链上节点和公开区块数据读取，不经第三方加工 —— 你看到的和链上是一致的。",
            },
            {
              title: "代价在签名前摊开",
              desc: "Gas、滑点、价格影响分项列出。点确认之前，你已经清楚这笔交易要付出什么。",
            },
            {
              title: "关键操作由你拍板",
              desc: "涉及转账与授权的动作一律停下等你确认，自动化只负责把方案准备好。",
            },
            {
              title: "每一步都能复盘",
              desc: "查询、报价、工具调用全程留痕。结果对不对、慢在哪一步，随时可以回看。",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="text-base font-semibold text-fg">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          想了解这些能力具体是怎么实现的？
          <Link
            href="/engineering"
            className="ml-1 text-primary transition-opacity hover:opacity-80"
          >
            查看工程笔记 →
          </Link>
        </p>
      </section>

      {/* ============ CTA ============ */}
      <section
        id="early-access"
        className="border-t border-border bg-surface-alt"
      >
        <div className="mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-fg">
            连接钱包，开始使用
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
            无需注册，地址即身份。四个模块均已上线 —— 连接钱包即可查看资产、比较报价、跟踪资金流向。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/portfolio"
              className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-primary-dark hover:text-fg"
            >
              打开 Portfolio
            </Link>
            <Link
              href="/copilot"
              className="rounded-sm border border-border bg-surface px-6 py-3 text-sm font-medium text-fg transition-colors hover:border-ai hover:text-ai"
            >
              看看 Copilot 能做什么
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
