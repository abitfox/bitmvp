import type { Metadata } from "next";
import { ModulePageShell } from "@/components/ModulePageShell";
import { RadarPanel } from "@/components/radar/RadarPanel";

export const metadata: Metadata = {
  title: "Radar · 从链上噪声里捞出信号",
  description:
    "市场热度、24h 异动、链上脉搏三个信号源。鲸鱼转账直接从公共 RPC 最新区块的原始交易里提取，不经过任何第三方 API。",
};

export default function RadarPage() {
  return <ModulePageShell moduleKey="radar" preview={<RadarPanel />} />;
}
