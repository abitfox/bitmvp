import type { Metadata } from "next";
import { ModulePageShell } from "@/components/ModulePageShell";
import { CopilotPreview } from "@/components/previews/CopilotPreview";

export const metadata: Metadata = {
  title: "Copilot · 用一句话完成链上操作",
  description:
    "不是又一个聊天框。Copilot 通过 MCP 真实调用 Portfolio、Swap、Radar 的能力，把自然语言翻译成可执行的工具链。",
};

export default function CopilotPage() {
  return <ModulePageShell moduleKey="copilot" preview={<CopilotPreview />} />;
}
