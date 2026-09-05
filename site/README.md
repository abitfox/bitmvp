# BitMVP · Site

bitmvp.com 的前端站点。Next.js 15 App Router + TypeScript + Tailwind CSS v4。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 生产构建
npm start        # 启动生产服务
```

## 目录结构

```
site/
├── app/
│   ├── layout.tsx           # 根布局：Header + Footer + 全局元数据
│   ├── globals.css          # 设计系统 Token（方案 A · Deep Vault 深穹）
│   ├── icon.svg             # 站点图标（Node Block）
│   ├── page.tsx             # 首页：Hero / 产品矩阵 / 闭环 / 技术栈 / CTA
│   ├── portfolio/page.tsx   # BitMVP Portfolio
│   ├── swap/page.tsx        # BitMVP Swap
│   ├── radar/page.tsx       # BitMVP Radar
│   └── copilot/page.tsx     # BitMVP Copilot
├── components/
│   ├── Logo.tsx             # Node Block Logo（SVG 组件）
│   ├── SiteHeader.tsx       # 顶部导航（四模块）
│   ├── SiteFooter.tsx       # 页脚
│   ├── StatusBadge.tsx      # 模块状态标签
│   ├── ModulePageShell.tsx  # 四个模块页共享的骨架
│   └── previews/            # 各模块的界面预览（静态示意）
├── lib/
│   └── products.ts          # ⭐ 产品矩阵元数据（单一数据源）
└── package.json
```

## 三个关键设计

### 1. `lib/products.ts` 是单一数据源

首页卡片、顶部导航、各模块页 Hero、页脚、模块间跳转 —— 全部从这一份数据读取。

**目的**：让四个模块在视觉与文案上呈现为「同一产品的四个入口」，
而不是四个各自为政的 demo。新增或修改模块只需改这一处。

### 2. `ModulePageShell` 统一模块页结构

四个模块页只有内容与预览不同，骨架完全一致。
访问者切换模块时会感知到一致的排版节奏。

### 3. 设计 Token 集中在 `globals.css`

Tailwind v4 的 `@theme` 块定义全部颜色，组件里只用语义类名
（`bg-surface`、`text-up`、`text-down`）。换配色只需改一处。

## 设计规范要点

| 规则 | 说明 |
|---|---|
| **涨红跌绿** | `#FF6B6B` 涨 / `#3DD68C` 跌。中国习惯，与欧美相反 |
| **等宽字体** | 地址、哈希、代币数量一律用 `.num` 或 `.mono` |
| **不加阴影** | 深色背景下阴影无意义，用边框区分层级 |
| **模块色仅小面积** | 用于图标、badge、顶边，避免整站花掉 |

完整规范见：`../03_品牌视觉与设计系统规范.md`

## 当前状态

P1 品牌骨架已完成：设计系统落地 + 首页 + 四个模块页（静态设计稿）。
各模块的功能实现见 `../01_Demo路线规划.md`。
