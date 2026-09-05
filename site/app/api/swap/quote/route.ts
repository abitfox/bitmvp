import { NextRequest, NextResponse } from "next/server";
import { getSwapQuote, type SwapParams } from "@/lib/chain/swap";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainKey = searchParams.get("chainKey");
  const fromTokenSymbol = searchParams.get("fromTokenSymbol");
  const toTokenSymbol = searchParams.get("toTokenSymbol");
  const fromAmount = searchParams.get("fromAmount");
  const slippageBps = searchParams.get("slippageBps");

  if (!chainKey || !fromTokenSymbol || !toTokenSymbol || !fromAmount) {
    return NextResponse.json(
      { ok: false, error: "缺少必需参数" },
      { status: 400 },
    );
  }

  try {
    const quote = await getSwapQuote({
      chainKey,
      fromTokenSymbol,
      toTokenSymbol,
      fromAmount: parseFloat(fromAmount),
      slippageBps: slippageBps ? parseInt(slippageBps, 10) : undefined,
    });
    return NextResponse.json({ ok: true, data: quote });
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
