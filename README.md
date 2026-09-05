# BitMVP

> Web3 multi-chain wallet product suite — Portfolio · Swap · Radar · Copilot

Portfolio-grade demo targeting a product/frontend role at Bitget. One repo, one product surface, four modules that share the same chain abstraction and design system.

## Modules

| Module    | Status | What it does                                                               |
| --------- | ------ | -------------------------------------------------------------------------- |
| Portfolio | live   | Real on-chain holdings across 5 EVM chains via Multicall3                  |
| Swap      | live   | Uniswap V3 QuoterV2 quotes on-chain, signs approve + swap via wagmi        |
| Radar     | live   | CoinGecko market pulse + on-chain block scanner                            |
| Copilot   | planned | AI assistant — future scope (Bitget GetAgent / MCP differentiation)      |

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4
- wagmi 3 · viem · @tanstack/react-query
- Chain abstraction: `lib/chain/{chains,tokens,portfolio,swap,radar}.ts`
- LRU cache per category with explicit TTL (15s balance · 30s swap · 60s price)

## Local development

```bash
cd site
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start -- -p 3100
```

> Add `CODEBUDDY_SAFE_DELETE_ENABLED=0` prefix when running `next build` inside WorkBuddy sandbox
> to bypass the bulk-delete guard on `.next` cache.

## Project layout

```
web3-wallet-demo/
├── 01_Demo路线规划.md
├── 02_BitMVP产品架构设计.md
├── 03_品牌视觉与设计系统规范.md
├── 04_数据层选型分析.md
├── 05_部署选型_海外免费与低价方案.md
└── site/                  # Next.js app
    ├── app/
    │   ├── api/           # /api/portfolio /api/swap /api/radar
    │   ├── portfolio/ swap/ radar/ copilot/  # module pages
    │   ├── layout.tsx · page.tsx
    ├── components/
    ├── lib/chain/
    ├── public/
    └── ...
```

## License

Personal project — all rights reserved.
