import Link from "next/link";
import type { ReactNode } from "react";
import type { ModuleKey } from "@/lib/products";
import { MODULES, getModule } from "@/lib/products";
import { StatusBadge } from "@/components/StatusBadge";

/**
 * 四个模块页共享的骨架。
 * 抽出来的意义：四个页面结构完全一致，只换内容与预览 ——
 * 访问者会自然感知到这是「同一产品的不同模块」。
 */
export function ModulePageShell({
  moduleKey,
  preview,
  previewLabel = "实时数据 · 可交互",
}: {
  moduleKey: ModuleKey;
  preview: ReactNode;
  previewLabel?: string;
}) {
  const m = getModule(moduleKey);
  const others = MODULES.filter((x) => x.key !== moduleKey);

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-x-0 top-0 h-64 opacity-[0.07]"
          style={{
            background: `radial-gradient(60% 100% at 50% 0%, ${m.hex} 0%, transparent 70%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-20">
          <nav className="flex items-center gap-2 text-xs text-faint">
            <Link href="/" className="transition-colors hover:text-muted">
              BitMVP
            </Link>
            <span>/</span>
            <span style={{ color: m.hex }}>{m.short}</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
              {m.name}
            </h1>
            <StatusBadge status={m.status} />
          </div>

          <div
            className="mt-4 text-xl font-medium md:text-2xl"
            style={{ color: m.hex }}
          >
            {m.question} · {m.tagline}
          </div>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">
            {m.desc}
          </p>
        </div>
      </section>

      {/* ---- 功能主区 ---- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-fg">
              {m.console.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              {m.console.hint}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted">
            {previewLabel}
          </span>
        </div>

        <div className="card overflow-hidden">
          {/* 窗口栏 */}
          <div className="flex items-center gap-2 border-b border-border bg-surface-alt px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-down/60" />
            <span className="ml-3 text-xs text-faint mono">
              bitmvp.com{m.href}
            </span>
          </div>
          <div className="p-5 md:p-7">{preview}</div>
        </div>
      </section>

      {/* ---- 核心能力 ---- */}
      <section className="border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-fg">核心能力</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {m.features.map((f, i) => (
              <div key={f.title} className="card p-6">
                <div className="flex items-start gap-4">
                  <span
                    className="mt-0.5 shrink-0 text-sm font-semibold num"
                    style={{ color: m.hex }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-fg">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 我们如何处理这些问题 ---- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          我们如何处理这些问题
        </h2>
        <p className="mt-3 text-sm text-muted">
          每个看起来理所当然的数字背后，都有必须解决的工程问题。
          这里是我们处理它们的方式，以及它对你意味着什么。
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {m.tradeoffs.map((t) => (
            <li
              key={t.problem}
              className="rounded-md border border-border bg-surface px-5 py-4"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: m.hex }}
                />
                <span className="text-sm font-semibold text-fg">
                  {t.problem}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t.answer}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- 切换到其他模块 ---- */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-xs font-semibold tracking-wider text-faint uppercase">
            切换到其他模块
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.key}
                href={o.href}
                className="card group p-5 transition-colors hover:border-primary/50"
              >
                <div
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: o.hex }}
                >
                  {o.short}
                </div>
                <div className="mt-2 text-base font-semibold text-fg">
                  {o.question}
                </div>
                <p className="mt-1.5 text-sm text-muted">{o.tagline}</p>
                <div className="mt-4 flex items-center gap-1.5 text-sm transition-all group-hover:gap-2.5" style={{ color: o.hex }}>
                  查看 <span aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
