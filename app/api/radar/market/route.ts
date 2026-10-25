import { NextResponse } from "next/server";
import { getMarketPulse } from "@/lib/chain/radar";
import { friendlyError } from "@/lib/api/error";

export async function GET() {
  try {
    const data = await getMarketPulse();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: friendlyError("market", error) },
      { status: 500 },
    );
  }
}
