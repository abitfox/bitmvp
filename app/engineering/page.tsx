import type { Metadata } from "next";
import Link from "next/link";
import { MODULES } from "@/lib/products";

export const metadata: Metadata = {
  title: "工程笔记",
  description:
    "BitMVP 的实现细节：统一链上数据服务层、多链聚合、精度处理、链上索引与 AI 工具调用的工程取舍，以及当前已知限制。",
};

/** 我们如何处理这些问题（技术版） */
const TRADEOFFS = [
  {
    problem: "多链余额读取太慢",
    how: "用 Multicall3 把同一条链上的 N 次余额调用聚合成 1 次 RPC 请求；多条链并行发起。链上读取走 viem 直连节点，不引入中间层。",
  },
  {
    problem: "上游限流与额度消耗",
    how: "代币元数据与价格分两层缓存：进程内缓存承接热请求，持久层承接冷启动。峰值时命中缓存，直接不打到上游。",
  },
  {
    problem: "金额精度丢失",
    how: "所有金额以链上最小单位的整数存储与计算（DECIMAL(65,0)），只在展示层做单位换算，全程不经过浮点数。",
  },
  {
    problem: "报价不准或拿不到",
    how: "优先使用 Uniswap V3 QuoterV2 获取真实可成交报价；未部署 QuoterV2 的链回退到读取 Pool slot0 的 sqrtPriceX96 自算现货价，并在界面明确标注报价来源。",
  },
  {
    problem: "链上信号被二手转述",
    how: "自建 Node 索引服务按区块扫描 Transfer 事件，解析后清洗入库。MySQL 分区表承载历史转账，JSON 字段通过 generated column 建索引（兼容 5.7 与 8.0）。",
  },
  {
    problem: "实时推送的复杂度",
    how: "异动推送用 SSE 单向通道而不是 WebSocket —— 场景只有服务端到客户端一条方向，没必要为双向连接付出心跳与重连的复杂度。",
  },
  {
    problem: "AI 输出不可验证",
    how: "模块能力以标准工具（MCP）暴露给模型，模型输出的是函数调用而非文本描述；每次调用的工具名、参数、耗时与状态全量落库，回答可逐条回看。",
  },
  {
    problem: "AI 越权执行",
    how: "能力分白名单：只读类可直接执行，转账与授权类必须经人工确认。结果通过 SSE 流式返回，中间过程对用户可见。",
  },
];

/** 技术栈与选型理由 */
const STACK = [
  {
    group: "前端",
    items: [
      ["Next.js 15", "App Router + RSC，营销页与数据密集界面共用一套代码"],
      ["TypeScript", "链上数据与金额类型必须显式，靠约定迟早出事"],
      ["Tailwind v4", "设计 token 收敛在 CSS 变量，改主题不动组件"],
      ["viem + wagmi", "EVM 交互的事实标准，类型完备"],
    ],
  },
  {
    group: "服务与数据",
    items: [
      ["Node.js", "索引服务与 API 常驻，PM2 守护"],
      ["MySQL", "分区表承载历史转账，JSON 用 generated column 建索引"],
      ["SSE", "单向实时推送，替代 WebSocket"],
      ["大语言模型服务", "驱动 Copilot 的意图理解与工具编排"],
    ],
  },
  {
    group: "数据源",
    items: [
      ["链上节点", "多链接入，公共节点作为降级备份"],
      ["Multicall3", "把 N 次链上调用压缩为 1 次"],
      ["行情源", "价格与市值，不可用时降级为仅显示余额"],
      ["MCP", "把模块能力标准化为可调用工具"],
    ],
  },
];

export default function EngineeringPage() {
  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-x-0 top-0 h-64 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, #00D3B4 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-20">
          <nav className="flex items-center gap-2 text-xs text-faint">
            <Link href="/" className="transition-colors hover:text-muted">
              BitMVP
            </Link>
            <span>/</span>
            <span className="text-portfolio">工程笔记</span>
          </nav>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg md:text-5xl">
            工程笔记
          </h1>

          <p className="mt-4 text-xl font-medium text-portfolio md:text-2xl">
            我们如何解决这些问题
          </p>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">
            这一页写给想知道「怎么做到的」的人。产品页面讲的是你能得到什么，
            这里记录的是背后的取舍 —— 包括我们放弃了什么，以及目前还做不到什么。
          </p>
        </div>
      </section>

      {/* ---- 架构总览 ---- */}
      <section className="border-b border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            一个数据层，四个入口
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">
            四个模块不各自调 API。链上读取、价格补全、代币元数据解析、索引查询
            全部收敛到同一层服务，统一做缓存、限流与错误处理。
            Copilot 也不自己实现查询，而是调用这套服务暴露出来的工具 ——
            所以改一处，四个模块同时生效。
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {MODULES.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="card group p-5 transition-colors hover:border-primary/50"
              >
                <div
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: m.hex }}
                >
                  {m.short}
                </div>
                <div className="mt-2 text-base font-semibold text-fg">
                  {m.question}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-sm transition-all group-hover:gap-2.5" style={{ color: m.hex }}>
                  查看 <span aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 我们如何处理这些问题 ---- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          我们如何处理这些问题
        </h2>
        <p className="mt-3 text-sm text-muted">
          以下每一条，都是一个真实遇到过的工程问题，以及我们选择的解法。
        </p>

        <ul className="mt-8 space-y-4">
          {TRADEOFFS.map((t) => (
            <li key={t.problem} className="card p-6">
              <h3 className="text-base font-semibold text-fg">{t.problem}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {t.how}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- 技术栈 ---- */}
      <section className="border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-fg">技术栈</h2>
          <p className="mt-3 text-sm text-muted">
            每一项的理由都写在一起 —— 没有理由的选择，通常只是随大流。
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STACK.map((col) => (
              <div key={col.group} className="card p-6">
                <h3 className="text-sm font-semibold tracking-wider text-primary uppercase">
                  {col.group}
                </h3>
                <dl className="mt-5 space-y-4">
                  {col.items.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-sm font-medium text-fg">{k}</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-muted">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 系统状态 ---- */}
      <section id="status" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-fg">系统状态</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          功能依赖若干外部服务。我们不假装它们永远可用，
          因此每一项都设计了明确的降级路径 —— 出问题时你会看到提示，而不是空白或错误数字。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              name: "链上节点",
              behavior: "单条链读取失败时跳过该链，并在界面标注，其余链照常展示。",
            },
            {
              name: "行情源",
              behavior: "不可用时降级为仅展示代币余额，链上读取仍然正常。",
            },
            {
              name: "模型服务",
              behavior: "不可用时 Copilot 转为演示模式，明确提示当前非实时回答。",
            },
          ].map((s) => (
            <div key={s.name} className="card p-6">
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-up" />
                <h3 className="text-base font-semibold text-fg">{s.name}</h3>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {s.behavior}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 已知限制 ---- */}
      <section id="limits" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            已知限制
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            与其让你在使用中自己发现，不如先写在这里。
          </p>

          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {[
              "部分网络依赖公共节点，高峰期可能限流，表现为个别链加载变慢或跳过。",
              "行情数据来自第三方聚合源，与交易所成交价可能存在偏差，仅供参考。",
              "未部署 QuoterV2 的网络上，Swap 采用池子现货价估算，与实际成交价存在滑点差异。",
              "Radar 的链上索引覆盖有限的网络与区块范围，更早的历史记录暂不可查。",
              "Copilot 只执行白名单内的只读与准备类操作，涉及转账与授权一律需要你确认。",
              "当前为个人项目，未接入可用性监控与告警，故障依赖人工发现。",
            ].map((l) => (
              <li
                key={l}
                className="flex items-start gap-3 rounded-md border border-border bg-surface px-5 py-4"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                <span className="text-sm leading-relaxed text-muted">{l}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="/"
              className="text-sm text-primary transition-opacity hover:opacity-80"
            >
              ← 回到产品首页
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
