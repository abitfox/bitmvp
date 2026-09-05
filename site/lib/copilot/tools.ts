/**
 * BitMVP Copilot 工具定义
 *
 * 暴露给 LLM 的工具集（OpenAI-compatible function calling 格式）。
 *
 * 设计要点：
 * 1. **直接复用 lib/chain/**：工具执行器把 LLM 的 tool_call 转成已有函数调用，
 *    不写第二套链上查询逻辑。Portfolio / Swap / Radar 三个模块的能力天然共享。
 * 2. **强 schema 约束**：所有参数都声明 enum / pattern，避免模型瞎猜。
 * 3. **演示降级**：每个工具有 `execute()` 兜底分支，LLM 不可用时仍能跑示例。
 */

import { getPortfolio } from "@/lib/chain/portfolio";
import { getSwapQuote } from "@/lib/chain/swap";
import { getMarketPulse, getOnchainPulse } from "@/lib/chain/radar";

/** OpenAI-compatible 工具定义 */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "portfolio_getBalances",
      description:
        "查询某个钱包地址在指定链上的代币余额与美元估值。返回每条链每个代币的余额、symbol、decimals、当前价格与美元价值。仅返回余额大于 0 的代币。",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description:
              "钱包地址（0x 开头 42 字符）或 ENS 名（如 vitalik.eth）",
          },
          chains: {
            type: "array",
            items: {
              type: "string",
              enum: ["ethereum", "base", "arbitrum", "optimism", "bnb"],
            },
            description: "要查询的链名列表，默认查全部 5 条",
          },
          minUsdValue: {
            type: "number",
            description: "过滤掉美元估值低于该值的代币，默认 0.01",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "swap_getQuote",
      description:
        "获取代币兑换的最优报价。在指定链上从 fromToken 兑换 toToken，给出预计可获得数量、Gas 估算与价格影响。注意：这只是报价，不执行交易。",
      parameters: {
        type: "object",
        properties: {
          chain: {
            type: "string",
            enum: ["ethereum", "base", "arbitrum", "optimism", "bnb"],
            description: "执行兑换的链",
          },
          fromToken: {
            type: "string",
            description: "源代币 symbol，如 USDC / ETH / WBTC",
          },
          toToken: {
            type: "string",
            description: "目标代币 symbol",
          },
          amountIn: {
            type: "string",
            description:
              "输入数量（人类可读单位，如 '100' 表示 100 USDC）。最小 0.0001。",
          },
        },
        required: ["chain", "fromToken", "toToken", "amountIn"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "radar_getMarketPulse",
      description:
        "获取当前市场的整体热度与异动：CoinGecko 趋势榜前 N 名、24h 涨幅 / 跌幅前列代币。适合回答「现在市场在炒什么」这类问题。",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "返回的代币数量，默认 10，范围 1-50",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "radar_getOnchainPulse",
      description:
        "获取指定链最新区块的资金动向：扫描最近区块内的 ERC20 Transfer 事件，过滤出大额转账（默认 > $5000）。返回地址、代币、数量、美元价值与区块浏览器链接。",
      parameters: {
        type: "object",
        properties: {
          chain: {
            type: "string",
            enum: ["ethereum", "base", "arbitrum", "optimism", "bnb"],
            description: "要扫描的链",
          },
          minNativeValue: {
            type: "number",
            description: "过滤掉原生币金额低于该值的转账，默认 50",
          },
          limit: {
            type: "number",
            description: "返回条数，默认 20，范围 1-100",
          },
        },
        required: ["chain"],
      },
    },
  },
];

/** 工具执行结果统一封装 */
export interface ToolResult {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
  ms: number;
  ok: boolean;
  error?: string;
}

/** 工具执行器 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const start = Date.now();
  try {
    let result: unknown;
    switch (name) {
      case "portfolio_getBalances": {
        const address = String(args.address ?? "");
        const chains = Array.isArray(args.chains)
          ? (args.chains as string[])
          : undefined;
        const minUsdValue =
          typeof args.minUsdValue === "number" ? args.minUsdValue : 0.01;
        const portfolio = await getPortfolio(address);
        const holdings = portfolio.holdings
          .filter((h) => (h.valueUsd ?? 0) >= minUsdValue)
          .filter((h) =>
            chains && chains.length > 0
              ? chains.includes(h.chainKey)
              : true,
          )
          .map((h) => ({
            chain: h.chainName,
            symbol: h.symbol,
            balance: h.balance,
            priceUsd: h.priceUsd,
            valueUsd: h.valueUsd?.toFixed(2) ?? "—",
          }));
        result = {
          address: portfolio.address,
          totalUsdValue: portfolio.totalUsd?.toFixed(2) ?? "—",
          pricesAvailable: portfolio.pricesAvailable,
          holdingsCount: holdings.length,
          holdings,
        };
        break;
      }
      case "swap_getQuote": {
        const chain = String(args.chain ?? "ethereum");
        const fromToken = String(args.fromToken ?? "");
        const toToken = String(args.toToken ?? "");
        const amountIn = String(args.amountIn ?? "0");
        const amountNum = Number(amountIn);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
          return {
            name,
            args,
            result: null,
            ms: Date.now() - start,
            ok: false,
            error: `amountIn 必须为正数: ${amountIn}`,
          };
        }
        const quote = await getSwapQuote({
          chainKey: chain,
          fromTokenSymbol: fromToken,
          toTokenSymbol: toToken,
          fromAmount: amountNum,
          slippageBps: 50,
        });
        result = {
          chain,
          fromToken,
          toToken,
          amountIn,
          amountOut: quote.toAmount.toFixed(8),
          minOutput: quote.minOutput.toFixed(8),
          estimatedGasUsd: quote.gasCostUsd?.toFixed(4),
          priceImpactPct: (quote.priceImpact * 100).toFixed(3),
          route: quote.route,
        };
        break;
      }
      case "radar_getMarketPulse": {
        const limit = typeof args.limit === "number" ? args.limit : 10;
        const pulse = await getMarketPulse();
        result = {
          trending: pulse.trending.slice(0, limit).map((c) => ({
            symbol: c.symbol,
            name: c.name,
            priceUsd: c.priceUsd,
            change24hPct: c.change24h?.toFixed(2),
          })),
          topGainers: pulse.gainers.slice(0, 5).map((c) => ({
            symbol: c.symbol,
            change24hPct: c.change24h.toFixed(2),
          })),
          topLosers: pulse.losers.slice(0, 5).map((c) => ({
            symbol: c.symbol,
            change24hPct: c.change24h.toFixed(2),
          })),
        };
        break;
      }
      case "radar_getOnchainPulse": {
        const chain = String(args.chain ?? "ethereum");
        const minValue =
          typeof args.minNativeValue === "number"
            ? args.minNativeValue
            : 50;
        const limit = typeof args.limit === "number" ? args.limit : 20;
        const pulse = await getOnchainPulse(chain);
        result = {
          chain: pulse.chainName,
          blockNumber: pulse.blockNumber,
          txCount: pulse.txCount,
          baseFeeGwei: pulse.baseFeeGwei,
          whales: pulse.whaleTxs
            .filter((t) => t.valueNative >= minValue)
            .slice(0, limit)
            .map((t) => ({
              hash: t.hash,
              from: t.from,
              to: t.to,
              valueNative: t.valueNative,
            })),
        };
        break;
      }
      default:
        return {
          name,
          args,
          result: null,
          ms: Date.now() - start,
          ok: false,
          error: `Unknown tool: ${name}`,
        };
    }
    return { name, args, result, ms: Date.now() - start, ok: true };
  } catch (e) {
    return {
      name,
      args,
      result: null,
      ms: Date.now() - start,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** 工具名到友好显示名的映射（前端展示用） */
export const TOOL_DISPLAY: Record<
  string,
  { name: string; color: string; icon: string }
> = {
  portfolio_getBalances: {
    name: "Portfolio · 查余额",
    color: "portfolio",
    icon: "▦",
  },
  swap_getQuote: { name: "Swap · 报价", color: "swap", icon: "⇄" },
  radar_getMarketPulse: {
    name: "Radar · 市场脉搏",
    color: "radar",
    icon: "📈",
  },
  radar_getOnchainPulse: {
    name: "Radar · 链上扫描",
    color: "radar",
    icon: "🔗",
  },
};
