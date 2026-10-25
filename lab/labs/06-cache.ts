// 需求 06：被 429 教育了——手写 30 行 LRU + TTL 缓存
// 策划案：lab/需求06-手写缓存.md
// 运行：npx tsx lab/labs/06-cache.ts

class Cache {
  #map = new Map<string, { value: unknown; expireAt: number }>();

  get(key: string) {
    const hit = this.#map.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expireAt) { this.#map.delete(key); return null; } // TTL：过期即失效
    this.#map.delete(key); this.#map.set(key, hit); // LRU：摸一下，浮到「最新」
    return hit.value;
  }

  set(key: string, value: unknown, ttlMs: number) {
    this.#map.set(key, { value, expireAt: Date.now() + ttlMs });
    if (this.#map.size > 200) this.#map.delete(this.#map.keys().next().value as string); // 满了挤最久未用
  }
}

// 模拟「带配额的上游」：统计真实请求数，演示缓存把请求数砍掉九成
let upstreamCalls = 0;
async function fetchPriceCached(coinId: string) {
  const key = `price:${coinId}`;
  const hit = priceCache.get(key);
  if (hit !== null) { console.log(`  [缓存命中] ${coinId} = $${hit}`); return hit; }
  upstreamCalls++;
  console.log(`  [真实请求] ${coinId}`);
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
  if (res.status === 429) { console.log("  HTTP 429：被限流了（这正是没有缓存时的下场）"); return null; }
  const price = ((await res.json()) as Record<string, { usd: number }>)[coinId]?.usd ?? null;
  priceCache.set(key, price, 60_000); // 价格 TTL 60s：变化慢，没必要更勤
  return price;
}

const priceCache = new Cache();
console.log("连续 5 次查询（间隔 1 秒），观察真实请求数：");
for (let i = 0; i < 5; i++) {
  await fetchPriceCached("ethereum");
  await new Promise((r) => setTimeout(r, 1000));
}
console.log(`\n总请求 5 次，真实上游请求 ${upstreamCalls} 次——省下 ${4 - upstreamCalls >= 0 ? 5 - upstreamCalls : 0} 次`);
console.log("分层 TTL：余额 15s / 价格 60s / ENS 300s（按数据变化速度估，错了以后再调）");
