import type { Metadata } from "next";
import { ModulePageShell } from "@/components/ModulePageShell";
import { ChatPanel } from "@/components/copilot/ChatPanel";
import { CopilotPreview } from "@/components/previews/CopilotPreview";

export const metadata: Metadata = {
  title: "Copilot · 用一句话完成链上操作",
  description:
    "不是又一个聊天框。Copilot 通过 MCP 真实调用 Portfolio、Swap、Radar 的能力，把自然语言翻译成可执行的工具链。",
};

// Edge runtime：工具执行（链上查询 + LLM 推理）可能 >10s
export const runtime = "edge";

export default function CopilotPage() {
  const live = Boolean(process.env.GLM_API_KEY);
  return (
    <ModulePageShell
      moduleKey="copilot"
      preview={live ? <ChatPanel /> : <CopilotPreview />}
    />
  );
}
