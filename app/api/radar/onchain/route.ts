import { NextRequest, NextResponse } from "next/server";
import { getOnchainPulse } from "@/lib/chain/radar";
import { friendlyError } from "@/lib/api/error";

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
      { ok: false, error: friendlyError("onchain", error) },
      { status: 500 },
    );
  }
}
