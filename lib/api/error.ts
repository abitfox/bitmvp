/**
 * 接口报错统一出口。
 *
 * 原则：详细信息（RPC 地址、上游堆栈）只进服务端日志；
 * 返回给前端的必须是一句用户看得懂、且不含基础设施细节的话。
 */
export function friendlyError(scope: ErrorScope, error: unknown): string {
  console.error(`[api:${scope}]`, error);
  return FRIENDLY[scope];
}

export type ErrorScope = keyof typeof FRIENDLY;

const FRIENDLY = {
  portfolio: "暂时无法读取链上资产，请稍后重试。",
  quote: "暂时无法获取这笔兑换的报价，请稍后重试。",
  market: "暂时无法获取市场数据，请稍后重试。",
  onchain: "暂时无法获取链上动态，请稍后重试。",
} as const;
