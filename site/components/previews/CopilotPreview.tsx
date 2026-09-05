/**
 * Copilot 模块的展示内容。
 *
 * 设计变化：2026-09-05 之前是写死的对话截图（设计稿示意）；
 * 现在是真聊天面板，调用 /api/copilot/chat 真实驱动 GLM-5.3-Flash。
 */
export { ChatPanel as CopilotPreview } from "@/components/copilot/ChatPanel";
