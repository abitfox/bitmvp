import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/chain/portfolio";
import { friendlyError } from "@/lib/api/error";

/**
 * GET /api/portfolio/:address
 *
 * 为什么走服务端而不是浏览器直连节点：
 * 1. 浏览器直连会撞跨域策略与各节点的访问频率限制
 * 2. 服务端可以统一做缓存，后续换持久化存储只改一层
 * 3. 四个模块共用这一个入口 —— 这就是共享链上数据服务层的落点
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
    const message = err instanceof Error ? err.message : "";
    // 用户输入导致的错误照常回传提示；其余一律不暴露基础设施细节
    if (message.includes("无效的地址")) {
      return NextResponse.json(
        { ok: false, error: "地址格式不正确，请检查后重试。" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: friendlyError("portfolio", err) },
      { status: 502 },
    );
  }
}
