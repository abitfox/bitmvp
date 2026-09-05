import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/chain/portfolio";

/**
 * GET /api/portfolio/:address
 *
 * 为什么要走服务端而不是浏览器直连 RPC：
 * 1. 浏览器直连会撞 CORS 与各家 RPC 的限流策略
 * 2. 服务端可以统一做缓存（现在是内存，后续换 MySQL 只改一层）
 * 3. 四个模块共用这一个入口 —— 这就是「共享链上数据服务层」的落点
 */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  try {
    const data = await getPortfolio(address);
    return NextResponse.json(
      { ok: true, data },
      {
        headers: {
          // 客户端可缓存 10 秒，服务端 our 内存缓存 15 秒
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    const badRequest = message.includes("无效的地址");
    return NextResponse.json(
      { ok: false, error: message },
      { status: badRequest ? 400 : 502 },
    );
  }
}
