import { NextResponse } from "next/server";
import { getMarketPulse } from "@/lib/chain/radar";

export async function GET() {
  try {
    const data = await getMarketPulse();
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
