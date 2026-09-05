import Link from "next/link";
import { Logo } from "./Logo";
import { MODULES } from "@/lib/products";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* 品牌区 */}
          <div>
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-base font-semibold text-fg">BitMVP</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              One Account, Full Onchain Control.
              <br />
              链上资产智能工作台 —— 把查看、调仓、洞察与执行收进同一个闭环。
            </p>
            <p className="mt-6 text-xs text-faint">
              © {new Date().getFullYear()} BitMVP · 个人作品项目
            </p>
          </div>

          {/* 产品矩阵 */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-fg uppercase">
              产品矩阵
            </h3>
            <ul className="mt-4 space-y-2.5">
              {MODULES.map((m) => (
                <li key={m.key}>
                  <Link
                    href={m.href}
                    className="text-sm text-muted transition-colors hover:text-fg"
                  >
                    {m.short}
                    <span className="ml-2 text-xs text-faint">
                      {m.question}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 技术栈 */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-fg uppercase">
              技术栈
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>Next.js 15 · App Router</li>
              <li>TypeScript · Tailwind CSS v4</li>
              <li>viem · wagmi</li>
              <li>Node.js · MySQL</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
