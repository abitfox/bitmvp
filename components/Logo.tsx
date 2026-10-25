import type { SVGProps } from "react";

/**
 * BitMVP Logo · 概念一 Node Block
 * 方块 = 区块，四节点互联 = 网络
 * 纯几何 SVG，缩放不失真，favicon 友好
 */
export function Logo({
  size = 32,
  boxed = true,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; boxed?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BitMVP Logo"
      {...props}
    >
      {boxed && <rect width="32" height="32" rx="8" fill="#0A0E1A" />}
      <g stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round">
        <line x1="10" y1="10" x2="22" y2="22" />
        <line x1="22" y1="10" x2="10" y2="22" />
        <line x1="10" y1="10" x2="22" y2="10" />
        <line x1="10" y1="22" x2="22" y2="22" />
      </g>
      <circle cx="10" cy="10" r="3.5" fill="#00D3B4" />
      <circle cx="22" cy="10" r="3.5" fill="#00D3B4" />
      <circle cx="10" cy="22" r="3.5" fill="#0F6E56" />
      <circle cx="22" cy="22" r="3.5" fill="#0F6E56" />
    </svg>
  );
}

/** 字标组合：[Logo] BitMVP */
export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Logo size={size} />
      <span className="text-[17px] font-semibold tracking-tight text-fg">
        BitMVP
      </span>
    </span>
  );
}
