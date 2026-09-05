/**
 * BitMVP 产品矩阵元数据（单一数据源）
 *
 * 设计意图：
 * 首页卡片、顶部导航、各模块页面的 Hero 全部从这里读取。
 * 这样四个模块在视觉与文案上是「同一套产品的四个入口」，
 * 而不是四个各自为政的独立 demo。
 */

export type ModuleKey = "portfolio" | "swap" | "radar" | "copilot";

export type ModuleStatus = "live" | "building" | "planned";

export interface ModuleFeature {
  title: string;
  desc: string;
}

export interface ModuleMeta {
  key: ModuleKey;
  /** 展示全名，如 BitMVP Portfolio */
  name: string;
  /** 短名，如 Portfolio */
  short: string;
  /** 一句话定位（用户视角的「我」句式） */
  tagline: string;
  /** 副标题，回答「我有什么 / 我要调仓 / …」 */
  question: string;
  desc: string;
  /** Tailwind 颜色 token 名，如 portfolio（对应 bg-portfolio / text-portfolio） */
  color: "portfolio" | "swap" | "radar" | "copilot";
  /** 原始色值，供内联样式使用 */
  hex: string;
  status: ModuleStatus;
  statusText: string;
  features: ModuleFeature[];
  /** 技术要点，面试时讲这些 */
  tech: string[];
  href: string;
}

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  live: "已上线",
  building: "开发中",
  planned: "规划中",
};

export const MODULES: ModuleMeta[] = [
  {
    key: "portfolio",
    name: "BitMVP Portfolio",
    short: "Portfolio",
    question: "我有什么",
    tagline: "跨链资产一屏总览",
    desc: "一次连接，聚合 Ethereum、Base、Arbitrum、BNB Chain 等多链资产。自动识别代币、补全价格、计算盈亏，把散落在各条链上的余额收拢成一张可读的资产负债表。",
    color: "portfolio",
    hex: "#00D3B4",
    status: "live",
    statusText: "已上线",
    features: [
      {
        title: "多链余额聚合",
        desc: "并行查询多条链的代币余额，合并同币种、按美元估值排序，避免重复计价。",
      },
      {
        title: "代币元数据补全",
        desc: "未知合约自动拉取 symbol / decimals / logo，并对结果做本地缓存，规避重复请求。",
      },
      {
        title: "资产分布可视化",
        desc: "按链、按资产类别拆解持仓占比，一眼看出集中度风险。",
      },
      {
        title: "地址即身份",
        desc: "无需注册。连接钱包即建立档案，历史查看记录与关注列表自动保留。",
      },
    ],
    tech: [
      "viem / wagmi 直连 RPC 批量读取余额",
      "Multicall3 聚合调用，把 N 次请求压成 1 次",
      "代币元数据与价格双层缓存，削峰省额度",
      "DECIMAL(65,0) 存原始整数，杜绝精度丢失",
    ],
    href: "/portfolio",
  },
  {
    key: "swap",
    name: "BitMVP Swap",
    short: "Swap",
    question: "我要调仓",
    tagline: "看清代价，再点确认",
    desc: "把交易从「黑箱点击」变回「知情决策」。报价、路由、Gas、滑点、价格影响全部摊开在签名之前，让用户知道自己为这笔交易付出了什么。",
    color: "swap",
    hex: "#5B9DEF",
    status: "live",
    statusText: "已上线",
    features: [
      {
        title: "多路由比价",
        desc: "同时请求多个流动性来源，按到手数量排序，而不是按表面价格。",
      },
      {
        title: "成本透明化",
        desc: "Gas 估算、滑点容忍、价格影响、最小到账量分开呈现，签名前可见。",
      },
      {
        title: "全流程状态追踪",
        desc: "待签名 → 打包中 → 已完成 / 失败，状态机驱动，异常可回溯。",
      },
      {
        title: "风险前置提示",
        desc: "滑点过高、价格影响异常、代币未验证时主动拦截并给出解释。",
      },
    ],
    tech: [
      "报价 → 授权 → 交易三段式状态机",
      "EIP-2612 permit 授权，省一次链上交易",
      "成本拆解：Gas + 滑点 + 价格影响分别核算",
      "交易生命周期落库，支持失败重试与审计",
    ],
    href: "/swap",
  },
  {
    key: "radar",
    name: "BitMVP Radar",
    short: "Radar",
    question: "别人在买什么",
    tagline: "从链上噪声里捞出信号",
    desc: "自建索引服务持续扫描链上转账，把原始日志加工成可读的资金流向：哪些地址在悄悄建仓，哪些代币正在被集中买入，异常波动发生在什么时刻。",
    color: "radar",
    hex: "#A78BFA",
    status: "live",
    statusText: "已上线",
    features: [
      {
        title: "聪明钱追踪",
        desc: "标记并跟踪高胜率地址的建仓与减持动作，支持自定义关注列表。",
      },
      {
        title: "资金流热力",
        desc: "按代币聚合净流入 / 净流出，识别短期资金聚集方向。",
      },
      {
        title: "异动实时推送",
        desc: "大额转账与突发放量通过 SSE 主动推送，无需刷新页面。",
      },
      {
        title: "自建索引服务",
        desc: "不依赖第三方数据商。自己解析区块日志、清洗、入库，全链路可控。",
      },
    ],
    tech: [
      "Node 索引服务按区块扫描 Transfer 事件",
      "MySQL 分区表承载千万级转账记录",
      "Generated Column 为 JSON 字段建索引（5.7/8.0 通用）",
      "SSE 单向推送替代 WebSocket，代码量减少三分之二",
    ],
    href: "/radar",
  },
  {
    key: "copilot",
    name: "BitMVP Copilot",
    short: "Copilot",
    question: "帮我搞定",
    tagline: "用一句话完成链上操作",
    desc: "不是又一个聊天框。Copilot 通过 MCP 真实调用前面三个模块的能力——查资产、比价格、找信号——把自然语言翻译成可执行的工具链，并把每一步的依据展示出来。",
    color: "copilot",
    hex: "#7C5CFF",
    status: "planned",
    statusText: "规划中",
    features: [
      {
        title: "真实工具调用",
        desc: "对接 MCP 工具集，模型输出的是函数调用而非文本描述，结果可验证。",
      },
      {
        title: "与三大模块共享数据层",
        desc: "复用 Portfolio / Swap / Radar 的同一套链上数据服务，不做第二套实现。",
      },
      {
        title: "过程可解释",
        desc: "每次回答附带调用了哪些工具、耗时多少、依据是什么，拒绝黑箱。",
      },
      {
        title: "风险操作二次确认",
        desc: "涉及转账与授权的动作强制人工确认，AI 只做准备，不代替决策。",
      },
    ],
    tech: [
      "MCP Server 暴露三大模块能力为标准工具",
      "Tool call 全量落库：工具名 / 参数 / 耗时 / 状态",
      "SSE 流式输出，工具调用过程实时可见",
      "危险操作白名单 + 强制二次确认",
    ],
    href: "/copilot",
  },
];

/** 闭环流转顺序（首页 How it works 使用） */
export const LOOP_ORDER: ModuleKey[] = ["portfolio", "swap", "radar", "copilot"];

export function getModule(key: ModuleKey): ModuleMeta {
  const found = MODULES.find((m) => m.key === key);
  if (!found) throw new Error(`Unknown module: ${key}`);
  return found;
}
