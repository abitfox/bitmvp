import { mainnet, base, arbitrum, optimism, bsc, sepolia } from "viem/chains";
import type { Chain } from "viem/chains";

/**
 * BitMVP 支持的链配置。
 *
 * RPC 先用公共端点（无需 API Key），把流程跑通；
 * 后续换成 Alchemy / QuickNode 只需改这里的 rpcUrl（建议走环境变量）。
 */
export interface ChainConfig {
  /** viem chain 定义（含 chain id、区块浏览器等） */
  chain: Chain;
  key: string;
  name: string;
  rpcUrl: string;
  nativeSymbol: string;
  nativeCoingeckoId: string;
  /** 模块配色，用于分布图 */
  color: string;
  /** Uniswap V3 SwapRouter02 地址（可选） */
  uniswapRouter?: `0x${string}`;
  /** Uniswap V3 QuoterV2 地址（可选） */
  uniswapQuoter?: `0x${string}`;
  /**
   * Uniswap V3 Factory 地址（可选）。
   * 当链上没有部署 QuoterV2 时（例如 Sepolia），报价走 fallback：
   * Factory.getPool → Pool.slot0 → 用 sqrtPriceX96 自算价格。
   */
  uniswapFactory?: `0x${string}`;
  /** 包装原生币地址（WETH/WBNB），原生币交易经它路由 */
  wNativeAddress: `0x${string}`;
  /**
   * Uniswap UniversalRouter 地址（可选）。
   * 部分链（如 Sepolia）没有 SwapRouter02，只能用 UniversalRouter 的
   * V3_SWAP_EXACT_IN 命令执行交易。
   */
  uniswapUniversalRouter?: `0x${string}`;
  /** 测试网标记：UI 上打标，避免用户误以为是主网真实资产 */
  testnet?: boolean;
}

// 允许用环境变量覆盖 RPC（生产环境建议走 Alchemy，避免公共端点限流）
const envRpc = (key: string, fallback: string) =>
  process.env[`RPC_${key.toUpperCase()}`] || fallback;

export const CHAINS: ChainConfig[] = [
  {
    chain: mainnet,
    key: "ethereum",
    name: "Ethereum",
    rpcUrl: envRpc("ethereum", "https://ethereum-rpc.publicnode.com"),
    nativeSymbol: "ETH",
    nativeCoingeckoId: "ethereum",
    color: "#5B9DEF",
    uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    uniswapQuoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wNativeAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  {
    chain: base,
    key: "base",
    name: "Base",
    rpcUrl: envRpc("base", "https://mainnet.base.org"),
    nativeSymbol: "ETH",
    nativeCoingeckoId: "ethereum",
    color: "#00D3B4",
    uniswapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
    uniswapQuoter: "0x3d4e44Eb1374240CE5F1B136041212E6B3B8Df87",
    uniswapFactory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    wNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  {
    chain: arbitrum,
    key: "arbitrum",
    name: "Arbitrum",
    rpcUrl: envRpc("arbitrum", "https://arb1.arbitrum.io/rpc"),
    nativeSymbol: "ETH",
    nativeCoingeckoId: "ethereum",
    color: "#A78BFA",
    uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    uniswapQuoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wNativeAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
  {
    chain: optimism,
    key: "optimism",
    name: "Optimism",
    rpcUrl: envRpc("optimism", "https://mainnet.optimism.io"),
    nativeSymbol: "ETH",
    nativeCoingeckoId: "ethereum",
    color: "#FF6B6B",
    uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    uniswapQuoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  {
    chain: bsc,
    key: "bnb",
    name: "BNB Chain",
    rpcUrl: envRpc("bnb", "https://bsc-rpc.publicnode.com"),
    nativeSymbol: "BNB",
    nativeCoingeckoId: "binancecoin",
    color: "#F5B544",
    uniswapRouter: "0x1b81D678ffb9C0263b24A97847620C99d213eB14", // PancakeSwap V3 Smart Router
    uniswapQuoter: "0x78D78E420Da98ad378D7799bE8f4AF69033EB077",
    uniswapFactory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865", // PancakeSwap V3 Quoter
    wNativeAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
  {
    chain: sepolia,
    key: "sepolia",
    name: "Sepolia 测试网",
    rpcUrl: envRpc("sepolia", "https://ethereum-sepolia-rpc.publicnode.com"),
    nativeSymbol: "ETH",
    nativeCoingeckoId: "ethereum",
    color: "#7B8A9C",
    // Sepolia 上只有 Uniswap V3 Factory + UniversalRouter，没有 QuoterV2 /
    // SwapRouter02。报价走 Factory+Pool.slot0 fallback，执行走 UniversalRouter。
    uniswapFactory: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    uniswapUniversalRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
    wNativeAddress: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    testnet: true,
  },
];

export const CHAIN_BY_KEY = new Map(CHAINS.map((c) => [c.key, c]));

/** Multicall3 部署地址在所有链上一致 */
export const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;
