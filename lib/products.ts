/**
 * BitMVP 产品矩阵元数据（单一数据源）
 *
 * 设计意图：
 * 首页卡片、顶部导航、各模块页面的 Hero 全部从这里读取。
 * 这样四个模块在视觉与文案上是「同一套产品的四个入口」，
 * 而不是四个各自为政的独立 demo。
 *
 * 文案口径：
 * features  = 你能用什么（能力）
 * tradeoffs = 我们如何处理这些问题（工程取舍，用户价值视角）
 * 技术名词只在解释「为什么能做到」时出现，不做主语。
 */

export type ModuleKey = "portfolio" | "swap" | "radar" | "copilot";

export type ModuleStatus = "live" | "building" | "planned";

export interface ModuleFeature {
  title: string;
  desc: string;
}

export interface ModuleTradeoff {
  /** 需要解决的工程问题 */
  problem: string;
  /** 我们的处理方式，以及它给用户带来的结果 */
  answer: string;
}

/** 模块页上那块可直接操作的功能区 */
export interface ModuleConsole {
  /** 功能名，叫它是什么，而不是「预览」 */
  title: string;
  /** 一句话说明：怎么用、需要什么前提 */
  hint: string;
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
  /** 工程取舍：我们如何处理这些问题 */
  tradeoffs: ModuleTradeoff[];
  /** 可直接操作的功能区（标题 + 使用说明） */
  console: ModuleConsole;
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
    tagline: "多链资产，一屏看全",
    desc: "连接钱包，自动汇总你在各条链上的代币持仓，补全价格与盈亏，并按资产和链路拆解分布。支持 Ethereum、Base、Arbitrum、BNB Chain 等网络。",
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
    tradeoffs: [
      {
        problem: "多链加载慢",
        answer: "一次请求聚合全部资产。持币再多、跨链再广，也不用逐条等待。",
      },
      {
        problem: "上游限流",
        answer: "行情剧烈波动时依然保持秒级刷新，不会因为数据源限流而卡住。",
      },
      {
        problem: "精度丢失",
        answer: "金额按链上最小单位精确记录，再小的持仓也不会被四舍五入掉。",
      },
      {
        problem: "数据源可信度",
        answer: "直连链上节点取数，不经中间层 —— 你看到的余额就是链上的余额。",
      },
    ],
    console: {
      title: "资产看板",
      hint: "默认展示一个公开地址的持仓，你可以直接换成任意地址查看；连接钱包后自动切换成你自己的资产。",
    },
    href: "/portfolio",
  },
  {
    key: "swap",
    name: "BitMVP Swap",
    short: "Swap",
    question: "我要调仓",
    tagline: "每一分成本，签名前就看清",
    desc: "输入数量就能看到能到账多少、走哪条路径、扣掉哪些成本。确认之后一键提交，从签名到成交的每一步都看得见状态。",
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
    tradeoffs: [
      {
        problem: "交易过程看不见",
        answer: "报价、授权、成交逐段推进，卡在哪一步一眼可见。",
      },
      {
        problem: "授权成本偏高",
        answer: "支持签名式授权，少一笔链上交易、少付一份 gas。",
      },
      {
        problem: "成本算不清",
        answer: "Gas、滑点、价格影响分项列出，你付出的每一点成本都有出处。",
      },
      {
        problem: "失败后无从追溯",
        answer: "每笔交易全程留痕，失败可追溯、可重试，不用拿着哈希自己猜。",
      },
    ],
    console: {
      title: "兑换终端",
      hint: "选择网络与代币、输入数量即可拿到实时链上报价与成本明细；连接钱包后可继续完成授权与成交。",
    },
    href: "/swap",
  },
  {
    key: "radar",
    name: "BitMVP Radar",
    short: "Radar",
    question: "别人在买什么",
    tagline: "大额动向，打开就看见",
    desc: "持续跟踪链上的大额转账与成交，按代币和地址聚合出资金流向。哪些币在被集中买入、哪些地址在异动，不用自己翻区块。",
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
        desc: "大额转账与突发放量主动推送到页面，无需手动刷新。",
      },
      {
        title: "自建索引服务",
        desc: "不依赖第三方数据商。自己解析区块日志、清洗、入库，全链路可控。",
      },
    ],
    tradeoffs: [
      {
        problem: "信号来自二手转述",
        answer: "逐块扫描链上转账记录，数据取自原始区块，而不是第三方加工后的结果。",
      },
      {
        problem: "历史难以回溯",
        answer: "资金流向长期留档，想看多久之前的记录都能查得到。",
      },
      {
        problem: "复杂筛选太慢",
        answer: "筛选条件再复杂，结果依然快速返回，不必为了速度牺牲查询维度。",
      },
      {
        problem: "异动发现得太晚",
        answer: "异动主动推送到页面上，不需要手动刷新，也不用反复轮询。",
      },
    ],
    console: {
      title: "信号面板",
      hint: "市场热度与链上大额转账持续更新，切换网络即可查看不同链当下的资金动向。",
    },
    href: "/radar",
  },
  {
    key: "copilot",
    name: "BitMVP Copilot",
    short: "Copilot",
    question: "帮我搞定",
    tagline: "一句话问清链上的事",
    desc: "用自然语言提问，Copilot 会去查资产、比价格、找信号，并把用到的依据一并列出。涉及转账的动作会先停下来等你确认。",
    color: "copilot",
    hex: "#7C5CFF",
    status: "live",
    statusText: "已上线",
    features: [
      {
        title: "真实工具调用",
        desc: "模型输出的是函数调用而非文本描述，结果可验证。",
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
    tradeoffs: [
      {
        problem: "能力重复建设",
        answer: "复用的不是接口而是能力本身 —— Copilot 与三大模块共用同一套链上服务，答案和你在模块里看到的完全一致。",
      },
      {
        problem: "长任务容易断流",
        answer: "推理与链上查询全程流式推进，耗时较长的问题也不会中途断掉。",
      },
      {
        problem: "AI 会编造数字",
        answer: "每一个数字都必须由真实工具调用产生，模型不参与生成，结论可回溯到链上记录。",
      },
      {
        problem: "AI 越权执行",
        answer: "转账与授权类动作必须经你确认才会发生，AI 只负责把方案和数据准备好。",
      },
    ],
    console: {
      title: "对话窗口",
      hint: "用一句话说出你要查或要做的事，Copilot 会调用前三个模块的能力，并把用到的依据一并列出。",
    },
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
