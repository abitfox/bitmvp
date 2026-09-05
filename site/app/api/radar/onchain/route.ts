import { NextRequest, NextResponse } from "next/server";
import { getOnchainPulse } from "@/lib/chain/radar";

export async function GET(request: NextRequest) {
  const chainKey = new URL(request.url).searchParams.get("chainKey");
  if (!chainKey) {
    return NextResponse.json(
      { ok: false, error: "缺少 chainKey 参数" },
      { status: 400 },
    );
  }

  try {
    const data = await getOnchainPulse(chainKey);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
