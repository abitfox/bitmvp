"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Logo";
import { ConnectButton } from "./wallet/ConnectButton";
import { MODULES } from "@/lib/products";

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {MODULES.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className={`rounded-sm px-3 py-2 text-sm transition-colors ${
                isActive(m.href)
                  ? "bg-elevated text-fg"
                  : "text-muted hover:bg-elevated/60 hover:text-fg"
              }`}
            >
              {m.short}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-faint sm:inline mono">
            v0.1.0
          </span>
          <ConnectButton />
        </div>
      </div>

      {/* 移动端模块导航 */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border-soft px-5 py-2 md:hidden">
        {MODULES.map((m) => (
          <Link
            key={m.key}
            href={m.href}
            className={`shrink-0 rounded-sm px-3 py-1.5 text-xs transition-colors ${
              isActive(m.href)
                ? "bg-elevated text-fg"
                : "text-muted hover:text-fg"
            }`}
          >
            {m.short}
          </Link>
        ))}
      </nav>
    </header>
  );
}
