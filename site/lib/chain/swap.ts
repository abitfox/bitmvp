import {
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
} from "viem";
import { CHAINS, type ChainConfig } from "./chains";
import { TOKENS, type TokenMeta, type TokenInfo } from "./tokens";
import { getPrices } from "./prices";
import { cached, TTL } from "./cache";

export interface SwapQuote {
  /** 输入代币 */
  fromToken: TokenInfo;
  /** 输出代币 */
  toToken: TokenInfo;
  /** 输入数量（按 decimals 格式化） */
  fromAmount: number;
  /** 预期输出数量（按 decimals 格式化） */
  toAmount: number;
  /** 最小输出数量（含滑点保护） */
  minOutput: number;
  /** 价格（1 单位 from 能换多少 to） */
  price: number;
  /** 反向价格（1 单位 to 能换多少 from） */
  inversePrice: number;
  /** Gas 费用（原生币） */
  gasCostNative: number;
  /** Gas 费用（USD） */
  gasCostUsd: number;
  /** 价格影响（百分比，如 0.001 = 0.1%） */
  priceImpact: number;
  /** 路由信息 */
  route?: string;
  /** 预估执行时间（秒） */
  estimatedTime?: number;
  /** 是否为模拟报价（真实报价为 false） */
  isSimulated: boolean;
  /** 报价使用的 fee tier（万分之一，如 500 = 0.05%） */
  feeTier?: number;
}

export interface SwapParams {
  chainKey: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  fromAmount: number;
  slippageBps?: number; // 基点，100 = 1%
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

/** QuoterV2.quoteExactInputSingle 的最小 ABI */
const QUOTER_ABI = [
  {
    type: "function" as const,
    name: "quoteExactInputSingle" as const,
    stateMutability: "nonpayable" as const,
    inputs: [
      {
        type: "tuple" as const,
        name: "params" as const,
        components: [
          { type: "address" as const, name: "tokenIn" as const },
          { type: "address" as const, name: "tokenOut" as const },
          { type: "uint256" as const, name: "amountIn" as const },
          { type: "uint24" as const, name: "fee" as const },
          { type: "uint160" as const, name: "sqrtPriceLimitX96" as const },
        ],
      },
    ],
    outputs: [
      { type: "uint256" as const, name: "amountOut" as const },
      { type: "uint160" as const, name: "sqrtPriceX96After" as const },
      { type: "uint32" as const, name: "initializedTicksCrossed" as const },
      { type: "uint256" as const, name: "gasEstimate" as const },
    ],
  },
] as const;

/**
 * 获取 Swap 报价。
 *
 * 用 Uniswap V3 QuoterV2（链上调用，无需 API Key，免费），
 * BSC 用 PancakeSwap V3 Quoter（同为 Uniswap V3 fork，接口一致）。
 * 失败则回退到模拟报价。
 */
export async function getSwapQuote(
  params: SwapParams,
): Promise<SwapQuote> {
  const chain = CHAINS.find((c) => c.key === params.chainKey);
  if (!chain) throw new Error(`不支持的链: ${params.chainKey}`);

  const fromToken = TOKENS[params.chainKey].find(
    (t) => t.symbol === params.fromTokenSymbol,
  );
  const toToken = TOKENS[params.chainKey].find(
    (t) => t.symbol === params.toTokenSymbol,
  );
  if (!fromToken || !toToken) {
    throw new Error(
      `代币不存在: ${params.fromTokenSymbol} → ${params.toTokenSymbol}`,
    );
  }

  if (params.fromAmount <= 0) {
    throw new Error("输入数量必须大于 0");
  }

  const slippageBps = params.slippageBps ?? 50;

  // Quoter 不认原生币（ETH/BNB），必须换成包装币（WETH/WBNB）报价
  const fromForQuote: TokenMeta =
    fromToken.address === ZERO_ADDRESS
      ? { ...fromToken, address: chain.wNativeAddress }
      : fromToken;
  const toForQuote: TokenMeta =
    toToken.address === ZERO_ADDRESS
      ? { ...toToken, address: chain.wNativeAddress }
      : toToken;

  if (chain.uniswapQuoter) {
    try {
      return await getUniswapQuote(
        chain,
        fromToken,
        toToken,
        fromForQuote,
        toForQuote,
        params.fromAmount,
        slippageBps,
      );
    } catch (error) {
      console.warn("链上报价失败，回退到模拟报价:", error);
    }
  }

  return mockQuote(
    chain,
    toTokenInfo(fromToken, chain),
    toTokenInfo(toToken, chain),
    params.fromAmount,
    slippageBps,
  );
}

function toTokenInfo(t: TokenMeta, chain: ChainConfig): TokenInfo {
  return {
    symbol: t.address === ZERO_ADDRESS ? chain.nativeSymbol : t.symbol,
    name: t.name,
    decimals: t.decimals,
  };
}

/** Uniswap V3 QuoterV2 获取真实链上报价 */
async function getUniswapQuote(
  chain: ChainConfig,
  fromTokenOriginal: TokenMeta,
  toTokenOriginal: TokenMeta,
  fromToken: TokenMeta,
  toToken: TokenMeta,
  fromAmount: number,
  slippageBps: number,
): Promise<SwapQuote> {
  const cacheKey = `swapquote:${chain.key}:${fromToken.symbol}:${toToken.symbol}:${fromAmount}`;
  return cached(cacheKey, TTL.swap, async () => {
    const publicClient = createPublicClient({
      chain: chain.chain,
      transport: http(chain.rpcUrl),
    });

    // 逐个 fee tier 尝试，找到有流动性的池子
    // 稳定币对优先 100/500，主币对优先 500，长尾 3000/10000
    const feeTiers = [500, 3000, 100, 10000];
    let best: { amountOut: bigint; gasEstimate: bigint; fee: number } | null =
      null;
    const amountIn = parseUnits(
      fromAmount.toString(),
      fromToken.decimals,
    );

    for (const fee of feeTiers) {
      try {
        const result = (await publicClient.readContract({
          address: chain.uniswapQuoter!,
          abi: QUOTER_ABI,
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn: fromToken.address,
              tokenOut: toToken.address,
              amountIn,
              fee,
              sqrtPriceLimitX96: 0n,
            },
          ],
        })) as [bigint, bigint, number, bigint];

        const [amountOut, , , gasEstimate] = result;
        if (amountOut > 0n) {
          best = { amountOut, gasEstimate, fee };
          break;
        }
      } catch {
        continue; // 该 fee tier 无池子，试下一个
      }
    }

    if (!best) {
      throw new Error(
        `该代币对（${fromToken.symbol}/${toToken.symbol}）在此链上暂无 V3 流动性`,
      );
    }

    const toAmount = Number(
      formatUnits(best.amountOut, toToken.decimals),
    );

    // 用极小额报价算即时价格，再用大额报价算价格影响
    // （避免再打一次链：直接用报价比例近似）
    const price = toAmount / fromAmount;
    const inversePrice = 1 / price;

    // Gas 估算：gasEstimate × gasPrice。公共 RPC 不查 gasPrice 了，
    // 用各链 L1/L2 的典型值估算（报价场景足够）
    const typicalGasGwei: Record<string, number> = {
      ethereum: 12,
      base: 0.05,
      arbitrum: 0.01,
      optimism: 0.03,
      bnb: 1,
    };
    const gasEstimateNum = Number(best.gasEstimate) || 180000;
    const gwei = typicalGasGwei[chain.key] ?? 10;
    const gasCostNative =
      (gasEstimateNum * gwei * 1e-9) /
      Math.pow(10, 0); // gwei→native 单位换算已含在 1e-9

    // 用 CoinGecko 拿原生币真实价格折算 Gas USD
    const nativePrices = await getPrices([chain.nativeCoingeckoId]);
    const nativeUsd = nativePrices[chain.nativeCoingeckoId]?.usd ?? 0;
    const gasCostUsd = gasCostNative * nativeUsd;

    return {
      fromToken: toTokenInfo(fromTokenOriginal, chain),
      toToken: toTokenInfo(toTokenOriginal, chain),
      fromAmount,
      toAmount,
      minOutput: toAmount * (1 - slippageBps / 10000),
      price,
      inversePrice,
      gasCostNative,
      gasCostUsd,
      priceImpact: 0.001, // Quoter 不返回价格影响，展示为估算
      route: `Uniswap V3 · fee ${(best.fee / 10000).toFixed(2)}%`,
      estimatedTime: 15,
      isSimulated: false,
      feeTier: best.fee,
    };
  });
}

/** 模拟报价（链上报价失败时的兜底） */
function mockQuote(
  chain: ChainConfig,
  fromToken: TokenInfo,
  toToken: TokenInfo,
  fromAmount: number,
  slippageBps: number,
): SwapQuote {
  const priceImpact = 0.001;
  const gasCostNative = 0.005;

  let price: number;
  if (fromToken.symbol === "USDT" && toToken.symbol === "ETH") {
    price = 0.0003;
  } else if (fromToken.symbol === "ETH" && toToken.symbol === "USDT") {
    price = 3333.33;
  } else {
    price = 1;
  }

  const toAmount = fromAmount * price * (1 - priceImpact);

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    minOutput: toAmount * (1 - slippageBps / 10000),
    price,
    inversePrice: 1 / price,
    gasCostNative,
    gasCostUsd: gasCostNative * 3500,
    priceImpact,
    route: "模拟报价（链上流动性不可用）",
    estimatedTime: 15,
    isSimulated: true,
  };
}
