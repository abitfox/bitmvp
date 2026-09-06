# BitMVP · Site

> Web3 多链资产工作台 · Portfolio / Swap / Radar / Copilot
> 在线：https://bitmvp.com

Next.js 15 App Router + TypeScript + Tailwind CSS v4 + wagmi 3 + viem + 智谱 GLM-5.3-Flash。

---

## 快速开始

```bash
cd site
npm install

# 开发
npm run dev                       # http://localhost:3000

# 构建（WorkBuddy 沙盒里需要绕过删除守卫）
CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build

# 启动生产服务
npm run start -- -p 3100          # 自定义端口，避免 3000/502 冲突
```

环境变量（`.env.local`，**不要 commit**）：

```bash
# Copilot 模块需要：智谱 GLM-5.3-Flash API Key
GLM_API_KEY=xxx
```

部署到 Vercel：在项目设置里同步加 `GLM_API_KEY` 环境变量（Hobby plan 即可）。

---

## 目录结构

```
site/
├── app/
│   ├── layout.tsx · page.tsx · globals.css · icon.svg · providers.tsx
│   ├── portfolio/page.tsx     # 多链资产聚合
│   ├── swap/page.tsx          # Uniswap V3 报价 + 钱包签名
│   ├── radar/page.tsx         # 市场脉搏 + 链上扫描
│   ├── copilot/page.tsx       # AI 助手（GLM + 工具调用）
│   └── api/
│       ├── portfolio/[address]/route.ts   # 多链余额
│       ├── swap/quote/route.ts            # Uniswap V3 QuoterV2 真实报价
│       ├── radar/market/route.ts          # CoinGecko + 异动榜
│       ├── radar/onchain/route.ts         # 最新区块鲸鱼扫描
│       └── copilot/chat/route.ts          # Edge runtime SSE chat
├── components/
│   ├── Logo.tsx · ModulePageShell.tsx · SiteHeader.tsx · SiteFooter.tsx · StatusBadge.tsx
│   ├── wallet/        ConnectButton.tsx · PortfolioLive.tsx
│   ├── swap/          SwapPanel.tsx · useSwapExecution.ts
│   ├── radar/         RadarPanel.tsx
│   ├── copilot/       ChatPanel.tsx
│   └── previews/      # 静态设计稿（已逐步替换为真组件）
├── lib/
│   ├── products.ts          # ⭐ 产品矩阵元数据（单一数据源）
│   ├── format.ts            # 地址、金额、百分比格式化
│   ├── chain/               # 链上数据抽象层
│   │   ├── chains.ts        # 5 链配置（Ethereum/Base/Arbitrum/Optimism/BNB）
│   │   ├── tokens.ts        # 各链代币清单（含 WETH、USDC、USDT 等）
│   │   ├── cache.ts         # LRU 缓存（按类别 TTL）
│   │   ├── prices.ts        # CoinGecko 价格聚合
│   │   ├── portfolio.ts     # Multicall3 多链余额聚合（含 ENS）
│   │   ├── swap.ts          # Uniswap V3 QuoterV2 真实报价
│   │   └── radar.ts         # CoinGecko + 最新区块扫描
│   └── copilot/
│       └── tools.ts         # 4 个工具 schema + 执行器（复用 chain/*）
└── package.json
```

---

## 架构：BitMVP 的四模块如何共享一份链上数据

```
                         ┌─────────────────────────┐
                         │  lib/chain/  (核心抽象)  │
                         │  - chains.ts            │
   ┌────────┐            │  - tokens.ts            │
   │Portfolio│───────────▶│  - cache.ts (LRU+TTL)   │
   │(聚合读) │            │  - prices.ts (CoinGecko)│
   └────────┘            │  - portfolio.ts (Multicall3) │
                         │  - swap.ts (QuoterV2)        │
   ┌────────┐            │  - radar.ts (区块扫描)       │
   │  Swap  │───────────▶└─────────────────────────┘
   │(报价)  │                        ▲
   └────────┘                        │
                                     │
   ┌────────┐                         │
   │ Radar  │─────────────────────────┘
   │(扫描)  │
   └────────┘
                                     │
   ┌──────────────┐                  │
   │   Copilot    │──────────────────┘
   │ (GLM + tools)│  ← 通过 lib/copilot/tools.ts 复用同一份 chain/* 能力
   └──────────────┘
```

**核心约束**：四个模块都从 `lib/chain/*` 读数据，不写第二套实现。

- Portfolio 调 `getPortfolio()`（一次 RPC 调用读所有代币）
- Swap 调 `getSwapQuote()`（Uniswap V3 QuoterV2 多 fee tier 并行试）
- Radar 调 `getMarketPulse()` / `getOnchainPulse()`（CoinGecko + 区块扫描）
- Copilot 通过 `executeTool()` 把上面四个函数包成 LLM 工具

**好处**：
1. 改一条链的 RPC 只需改 `chains.ts` 一个文件
2. 加一个新模块就是新增一个 `lib/chain/foo.ts` + 一个 `app/foo/page.tsx`，不需要碰其他模块
3. Copilot 的工具集**永远不会比链模块的能力更多**——这是天然的「AI 不能超过产品边界」护栏

---

## Web3 前端关键决策（可直接复用）

### 1. 多链余额：Multicall3 批量读

不用 N 次 RPC，用一条链一次调用读所有代币。

```ts
import { multicall3Abi } from "viem";

// 每个代币构造一个 balanceOf 调用，aggregator 一次性发给 Multicall3
const results = await client.multicall({
  contracts: tokens.map((t) => ({
    address: t.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [userAddress],
  })),
  multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11", // Multicall3
  allowFailure: true,
});
```

5 条链 × 30 代币 = 150 次单点调用 → 5 次 multicall。

### 2. Swap 报价：Uniswap V3 QuoterV2 链上查询

**为什么不用 0x API / 1inch API**（2026 现状）：
- 0x API 免费层取消（2026 年起每请求 $0.01）
- 1inch 同理
- **Uniswap V3 QuoterV2 完全免费**，直接在链上调用

```ts
// 对每个 fee tier（500/3000/10000）试一遍，取最优
const quotes = await Promise.all(
  FEE_TIERS.map((fee) =>
    client.readContract({
      address: QUOTER_V2,
      abi: QUOTER_ABI,
      functionName: "quoteExactInputSingle",
      args: [
        { tokenIn, tokenOut, amountIn, sqrtPriceLimitX96: 0n, fee },
      ],
    }),
  ),
);
```

**原生币处理**：用户选 ETH，链上交易需要 WETH。QuoterV2 调 WETH 地址（`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`）。

### 3. 价格缓存：分层 TTL

| 类别 | TTL | 理由 |
|---|---|---|
| 余额 | 15s | 用户操作后要立刻反映 |
| 价格 | 60s | 没必要秒级，CoinGecko 也会限流 |
| Swap 报价 | 30s | 报价过快刷新会让 UI 闪；过慢会失真 |
| Radar trending | 120s | CoinGecko 趋势榜 2 分钟级 |
| ENS 解析 | 300s | ENS 不会变 |

实现：手写 LRU + TTL（`lib/chain/cache.ts`），不上 Redis——作品集场景用不上。

### 4. AI 助手：OpenAI 兼容协议 + Edge runtime + SSE

```ts
// app/api/copilot/chat/route.ts
export const runtime = "edge";        // 默认 30s 超时，比 Node 的 10s 宽裕
export const maxDuration = 30;

// SSE 事件类型
// - text        : 增量文本
// - reasoning   : 模型思考（前端折叠展示）
// - tool_call   : 模型决定调工具
// - tool_result : 工具执行结果
// - error · done
```

**为什么选智谱 GLM-5.3-Flash**：
- OpenAI 兼容协议 → 改 4 行代码就能换 OpenAI/Anthropic/DeepSeek
- 国内可直接访问，不需要代理
- 1M 上下文 + 支持 function calling + 流式 + thinking 模式
- 价格是 Claude Opus 4.8 的 1/40（限时折扣期内 1/20）

### 5. 钱包连接：wagmi 3 + injected

```ts
// 注意：wagmi v3 用 useAccount，不是 useConnection
// injected connector 从 "wagmi/connectors" 导入（不是 "@wagmi/connectors"）
import { useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

const { address, isConnected } = useAccount();
```

### 6. ENS 解析：直接调 mainnet RPC

```ts
// viem 内置，无需额外服务
const client = createPublicClient({ chain: mainnet, transport: http() });
const resolved = await client.getEnsAddress({ name: "vitalik.eth" });
```

---

## 性能与可用性

| 场景 | 方案 |
|---|---|
| 5 链 × 30 代币查询 | Multicall3 + 并发 + 15s 缓存 |
| 价格 API 限流 | CoinGecko free tier 兜底 + LRU + 价格不可用时只显示余额 |
| 链 RPC 临时挂 | `allowFailure: true` + 单链失败只降级那一条，不阻塞全局 |
| LLM 慢 | Edge runtime + SSE 流式 + 前端打字机效果（用户不感知延迟） |
| LLM 不可用 | 演示模式：写死 1-2 轮示例回复，UI 仍可用 |
| Vercel 10s 超时 | Copilot 路由显式 `runtime = "edge"`（默认 30s） |

---

## 部署

| 环节 | 选择 | 备注 |
|---|---|---|
| 平台 | Vercel Hobby | 免费 + 零配置 Next.js |
| Root Directory | `site` | Vercel 项目设置里改；monorepo 场景 |
| 环境变量 | `GLM_API_KEY` | 生产 + preview 都要 |
| 自定义域名 | bitmvp.com | 绑 apex + www（308 重定向） |
| CI/CD | GitHub App 自动 | push 到 main 自动部署；PR 自动 preview |

---

## 设计系统要点

| 规则 | 说明 |
|---|---|
| **涨红跌绿** | `#FF6B6B` 涨 / `#3DD68C` 跌。中国习惯，与欧美相反 |
| **等宽字体** | 地址、哈希、代币数量用 `.num` 或 `.mono` |
| **不加阴影** | 深色背景下阴影无意义，用边框 + 透明度区分层级 |
| **模块色仅小面积** | 用于图标、badge、顶边；避免整站花掉 |
| **设计 Token 集中** | Tailwind v4 `@theme` 块定义全部颜色，组件用语义类名 |

完整规范：`../03_品牌视觉与设计系统规范.md`

---

## 已知边界与下一步

- ✅ 四个模块全部 live
- ✅ 多链真实数据
- ✅ AI 助手 + 真实工具调用
- ⏳ Swap 浏览器端 MetaMask 实测（签名流程需要真钱包）
- ⏳ 工具调用落库审计（生产场景需要；作品集不需要）
- ⏳ MCP stdio 协议真暴露（让 Claude Desktop 等外部 agent 能直接调）

---

## 参考资料

- [wagmi 文档](https://wagmi.sh) · [viem 文档](https://viem.sh)
- [Uniswap V3 QuoterV2](https://docs.uniswap.org/contracts/v3/reference/periphery/QuoterV2)
- [Multicall3](https://www.multicall3.com/)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- [智谱 GLM-5.3-Flash](https://docs.bigmodel.cn/cn/guide/models/vlm/glm-5.3-flash)
- [MCP（Model Context Protocol）](https://modelcontextprotocol.io/)
