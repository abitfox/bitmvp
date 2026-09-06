/**
 * 各链需要检测的代币清单。
 *
 * 现实约束：链上无法枚举「某个地址持有哪些代币」——
 * ERC20 没有反向索引，只能拿一个候选清单去逐个查余额。
 * 真实产品（如 Bitget Wallet）靠自建索引服务解决，MVP 阶段用精选清单。
 *
 * decimals 写死而非链上读取：省掉 N 次 RPC，且主流代币 decimals 不会变。
 */

export interface TokenMeta {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  /** CoinGecko id，用于查价格 */
  coingeckoId: string;
}

/** Swap UI 需要的精简代币信息 */
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
}

type TokenList = Record<string, TokenMeta[]>;

export const TOKENS: TokenList = {
  ethereum: [
    {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "ETH",
      name: "Ethereum 原生代币",
      decimals: 18,
      coingeckoId: "ethereum",
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      coingeckoId: "wrapped-bitcoin",
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      coingeckoId: "dai",
    },
    {
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      symbol: "LINK",
      name: "Chainlink",
      decimals: 18,
      coingeckoId: "chainlink",
    },
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
      coingeckoId: "uniswap",
    },
    {
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      symbol: "AAVE",
      name: "Aave",
      decimals: 18,
      coingeckoId: "aave",
    },
    {
      address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      symbol: "PEPE",
      name: "Pepe",
      decimals: 18,
      coingeckoId: "pepe",
    },
  ],

  base: [
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      symbol: "cbBTC",
      name: "Coinbase Wrapped BTC",
      decimals: 8,
      coingeckoId: "coinbase-wrapped-btc",
    },
    {
      address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
      symbol: "AERO",
      name: "Aerodrome Finance",
      decimals: 18,
      coingeckoId: "aerodrome-finance",
    },
    {
      address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
      symbol: "DEGEN",
      name: "Degen",
      decimals: 18,
      coingeckoId: "degen-base",
    },
  ],

  arbitrum: [
    {
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      symbol: "ARB",
      name: "Arbitrum",
      decimals: 18,
      coingeckoId: "arbitrum",
    },
    {
      address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
      symbol: "GMX",
      name: "GMX",
      decimals: 18,
      coingeckoId: "gmx",
    },
  ],

  optimism: [
    {
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x4200000000000000000000000000000000000042",
      symbol: "OP",
      name: "Optimism",
      decimals: 18,
      coingeckoId: "optimism",
    },
  ],

  bnb: [
    {
      address: "0x55d398326f99059fF775485246999027B3197955",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 18,
      coingeckoId: "tether",
    },
    {
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 18,
      coingeckoId: "usd-coin",
    },
    {
      address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      symbol: "BTCB",
      name: "Bitcoin BEP2",
      decimals: 18,
      coingeckoId: "binance-wrapped-btc",
    },
    {
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      symbol: "ETH",
      name: "Ethereum Token",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      symbol: "CAKE",
      name: "PancakeSwap",
      decimals: 18,
      coingeckoId: "pancakeswap-token",
    },
  ],
  sepolia: [
    {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "ETH",
      name: "Sepolia 测试网原生代币",
      decimals: 18,
      coingeckoId: "ethereum",
    },
    {
      address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
      symbol: "WETH",
      name: "Wrapped Ether (Sepolia)",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      symbol: "USDC",
      name: "USD Coin (Sepolia, Circle 官方测试币)",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
  ],
};

/** 稳定币：价格 API 挂掉时兜底按 1 美元算 */
export const STABLECOIN_IDS = new Set(["tether", "usd-coin", "dai"]);
