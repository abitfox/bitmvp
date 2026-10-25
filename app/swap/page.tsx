import type { Metadata } from "next";
import { ModulePageShell } from "@/components/ModulePageShell";
import { SwapPanel } from "@/components/swap/SwapPanel";

export const metadata: Metadata = {
  title: "Swap · 看清代价，再点确认",
  description:
    "多路由比价，把报价、Gas、滑点、价格影响全部摊开在签名之前，让用户知道为这笔交易付出了什么。",
};

export default function SwapPage() {
  return <ModulePageShell moduleKey="swap" preview={<SwapPanel />} />;
}
