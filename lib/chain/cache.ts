/**
 * 极简进程内 TTL 缓存。
 *
 * 为什么不上 Redis：作品集阶段，单进程内存缓存足够，
 * 多一个中间件就多一份运维负担。等数据量真起来再换。
 *
 * 两个能力：
 * 1. TTL 过期
 * 2. 并发去重 —— 同一个 key 的并发请求只打一次上游（防缓存击穿）
 */

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();
const pending = new Map<string, Promise<unknown>>();

export function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return Promise.resolve(hit.value as T);
  }

  // 已有相同 key 的请求在飞行中，复用它
  const inflight = pending.get(key);
  if (inflight) return inflight as Promise<T>;

  const task = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, task);
  return task;
}

/** 防止内存无上限增长 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}, 60_000).unref?.();

export const TTL = {
  /** 链上余额：15 秒。区块时间 ~12s，再短没意义 */
  balance: 15_000,
  /** 价格：60 秒。免费 API 限流严，且价格不需要秒级 */
  price: 60_000,
  /** 聚合结果：15 秒 */
  portfolio: 15_000,
  /** Swap 报价：30 秒。链上价格变化相对慢 */
  swap: 30_000,
  /** 通用短缓存 */
  short: 30_000,
};
