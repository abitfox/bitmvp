/**
 * 把底层（钱包 / 节点 / 接口）的报错翻译成用户看得懂的一句话。
 *
 * 详细原因只进浏览器控制台，界面上不出现技术细节与基础设施信息。
 */
export function toUserError(
  err: unknown,
  fallback = "操作未能完成，请稍后重试。",
): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  console.error("[bitmvp]", raw || err);

  if (/user rejected|user denied|denied transaction/i.test(raw))
    return "你取消了钱包签名。";
  if (/insufficient funds/i.test(raw))
    return "余额不足以支付这笔交易（含网络手续费）。";
  if (/chain mismatch|unsupported chain|does not match the target/i.test(raw))
    return "请先把钱包切换到对应的网络。";
  if (/未连接钱包|connector/i.test(raw))
    return "请先连接钱包。";
  if (/nonce|already pending|replacement/i.test(raw))
    return "有一笔交易还在确认中，请稍后再试。";
  if (/slippage|too little received|insufficient_output/i.test(raw))
    return "价格波动超过了你设置的滑点范围，请调整后重试。";
  if (/reverted/i.test(raw))
    return "这笔交易未能执行成功，可能已被链上拒绝。";
  if (/timeout|timed out/i.test(raw))
    return "网络响应超时，请稍后重试。";
  if (/failed to fetch|networkerror|load failed/i.test(raw))
    return "网络连接异常，请检查网络后重试。";

  return fallback;
}
