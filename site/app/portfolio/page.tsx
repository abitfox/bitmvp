import type { Metadata } from "next";
import { ModulePageShell } from "@/components/ModulePageShell";
import { PortfolioLive } from "@/components/wallet/PortfolioLive";

export const metadata: Metadata = {
  title: "Portfolio · 跨链资产一屏总览",
  description:
    "一次连接，聚合多链资产。Multicall3 批量读取余额，自动补全代币价格，把散落在各条链上的持仓收拢成一张可读的资产负债表。",
};

export default function PortfolioPage() {
  return (
    <ModulePageShell
      moduleKey="portfolio"
      preview={<PortfolioLive />}
      previewLabel="实时数据 · 链上读取"
    />
  );
}
