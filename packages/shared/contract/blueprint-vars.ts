/**
 * 全栈蓝图动态变量与双态占位符解析引擎 (Blueprint Variable & Dual-Mode Token Resolver)
 *
 * 设计目标：
 * 1. 让 cooliebase-all 成为可被外部引擎（Coolie工坊 / 27B本地大模型 / Mustache / CLI）直接消费的声明式模板；
 * 2. 支持配置文件中直接保留 `{{VAR_NAME}}` 占位符，运行时若检测到未渲染的 `{{VAR_NAME}}`，
 *    自动回退到 `blueprint.template.json` 定义的基准默认值，确保母版不经外部渲染也能 100% 通过编译与 28 道门禁；
 * 3. 内置 5 套行业场景预设词包 (`INDUSTRY_PRESETS`)，27B 本地模型只需切换一个枚举或覆盖少量变量即可完成全站与多端换肤换业态。
 */

import rawBlueprintManifest from "../../../blueprint.template.json"

export type IndustryPresetKey =
  | "general-enterprise"
  | "retail-commerce"
  | "smart-healthcare"
  | "digital-publishing"
  | "smart-manufacturing"

export interface PortalCategoryBlueprint {
  key: string
  label: string
}

export interface PortalCatalogItemBlueprint {
  id: string
  title: string
  author: string
  category: string
  categoryLabel: string
  priceCents: number
  rating: number
  ratingCount: number
  tags: string[]
  intro: string
  accentColor: string
  trialChapter: {
    title: string
    paragraphs: string[]
  }
}

export interface PortalBlueprintConfig {
  brandMark: string
  title: string
  subtitleEn: string
  heroBadge: string
  heroTitle: string
  heroDesc: string
  searchPlaceholder: string
  cartLabel: string
  primaryCta: string
  previewCta: string
  profileLabel: string
  categories: PortalCategoryBlueprint[]
  catalogItems: PortalCatalogItemBlueprint[]
}

export interface DomainShowcaseItem {
  id: string
  name: string
  path: string
  desc: string
  tag: string
}

export interface MultiClientBlueprintConfig {
  expoAppName: string
  expoAppSlug: string
  iosBundleId: string
  androidPackage: string
  wechatAppId: string
  tabHomeLabel: string
  tabStudioLabel: string
  tabMemberLabel: string
  defaultEntity: string
}

/**
 * 从根目录 `blueprint.template.json` 派生的 62 项默认变量字典
 */
export const BLUEPRINT_DEFAULT_VARS: Record<string, string | number | boolean> = (() => {
  const map: Record<string, string | number | boolean> = {}
  const vars = (rawBlueprintManifest as { variables?: Record<string, { default?: string | number | boolean }> })?.variables || {}
  for (const [key, meta] of Object.entries(vars)) {
    if (meta && meta.default !== undefined) {
      map[key] = meta.default
    }
  }
  return map
})()

const PLACEHOLDER_EXACT_RE = /^\{\{\s*([A-Z0-9_]+)\s*\}\}$/
const PLACEHOLDER_GLOBAL_RE = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g

/**
 * 判断字符串是否仍包含未渲染的 `{{VAR_NAME}}` 模板占位符
 */
export function hasUnrenderedPlaceholders(value: unknown): boolean {
  if (typeof value !== "string") return false
  return /\{\{\s*[A-Z0-9_]+\s*\}\}/.test(value)
}

/**
 * 解析单个字符串中的 `{{VAR_NAME}}` 占位符
 */
export function resolveBlueprintString(
  input: string,
  overrides: Record<string, string | number | boolean> = {}
): string {
  if (!input || !input.includes("{{")) return input
  return input.replace(PLACEHOLDER_GLOBAL_RE, (fullMatch, varName: string) => {
    if (Object.prototype.hasOwnProperty.call(overrides, varName) && overrides[varName] !== undefined) {
      return String(overrides[varName])
    }
    if (Object.prototype.hasOwnProperty.call(BLUEPRINT_DEFAULT_VARS, varName)) {
      return String(BLUEPRINT_DEFAULT_VARS[varName])
    }
    return fullMatch
  })
}

/**
 * 递归解析任意 JSON 对象/数组中的 `{{VAR_NAME}}` 占位符。
 * 若整个字段恰好是 `"{{ADMIN_PORT}}"` 且默认值为 number/boolean，则自动还原为对应原始类型。
 */
export function resolveBlueprintPlaceholders<T>(
  input: T,
  overrides: Record<string, string | number | boolean> = {}
): T {
  if (typeof input === "string") {
    const exactMatch = PLACEHOLDER_EXACT_RE.exec(input)
    if (exactMatch) {
      const varName = exactMatch[1]
      const rawVal = Object.prototype.hasOwnProperty.call(overrides, varName)
        ? overrides[varName]
        : BLUEPRINT_DEFAULT_VARS[varName]
      if (rawVal !== undefined) {
        return rawVal as unknown as T
      }
    }
    return resolveBlueprintString(input, overrides) as unknown as T
  }
  if (Array.isArray(input)) {
    return input.map((item) => resolveBlueprintPlaceholders(item, overrides)) as unknown as T
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = resolveBlueprintPlaceholders(v, overrides)
    }
    return out as T
  }
  return input
}

/**
 * 15 大原生业务域的通用企业默认展示矩阵（零特定垂直行业硬编码污染）
 */
export const DEFAULT_DOMAIN_SHOWCASE: DomainShowcaseItem[] = [
  { id: "mall", name: "交易商城 (Mall)", path: "/admin/mall/spu", desc: "商品与服务 SPU/SKU 管理、多级类目、营销活动与全渠道订单履约结算", tag: "Core Business" },
  { id: "member", name: "客户与会员 (Member)", path: "/admin/member/users", desc: "统一客户档案、会员等级成长体系、积分权益抵扣与用户行为画像", tag: "Core Business" },
  { id: "pay", name: "聚合支付 (Pay)", path: "/admin/pay/orders", desc: "微信/支付宝聚合收银台、多渠道清分对账、电子发票与原路退款闭环", tag: "Finance" },
  { id: "bpm", name: "流程协同 (BPM)", path: "/admin/bpm/models", desc: "可视化流程建模、业务上架审批、风控合规会签与大额资金流转审核", tag: "Workflow" },
  { id: "ai", name: "AI 智能网关 (AIGW)", path: "/admin/aigw/channels", desc: "多模型路由网关、27B 本地模型协同、业务智能助手与知识库向量检索", tag: "Intelligence" },
  { id: "system", name: "系统与安全 (System)", path: "/admin/system/users", desc: "多租户行级隔离、RBAC 细粒度权限控制、不可变操作审计与敏感词风控", tag: "Security" },
  { id: "infra", name: "基础设施 (Infra)", path: "/admin/infra/configs", desc: "动态参数中心、分布式任务调度、低代码生成引擎与可观测性遥测", tag: "Infra" },
  { id: "im", name: "即时通信 (IM)", path: "/admin/im/conversations", desc: "WebSocket 多端在线客服、群组协同会话、服务通知触达与合规过滤", tag: "Communication" },
  { id: "crm", name: "客户关系 (CRM)", path: "/admin/crm/customers", desc: "公海线索池、商机转化漏斗、合同回款计划与渠道合作伙伴管理", tag: "CRM" },
  { id: "erp", name: "企业资源 (ERP)", path: "/admin/erp/purchase-orders", desc: "采购申请与订单、供应商往来结算、库存成本核算与财务凭证联动", tag: "ERP" },
  { id: "wms", name: "智慧仓储 (WMS)", path: "/admin/wms/wms-warehouse", desc: "多仓多库位建模、入库质检上架、波次拣货出库与物流轨迹追踪", tag: "WMS" },
  { id: "mes", name: "制造执行 (MES)", path: "/admin/mes/work-orders", desc: "生产工单排程、BOM 工艺路线、车间工序报工与质量追溯看板", tag: "MES" },
  { id: "iot", name: "物联感知 (IoT)", path: "/admin/iot/devices", desc: "智能终端物模型定义、遥测数据采集、边缘规则引擎与异常告警联动", tag: "IoT" },
  { id: "mp", name: "微信生态 (MP)", path: "/admin/mp/accounts", desc: "公众号与小程序矩阵接入、模板消息推送、粉丝标签与裂变营销", tag: "WeChat" },
  { id: "report", name: "经营大屏 (Report)", path: "/admin/report/boards", desc: "全链路经营指标大盘、多维交叉分析报表与实时业务态势可视化看板", tag: "BI Analytics" },
]

/**
 * 通用企业默认 C 端精选目录项（支持在行业预设或 project-profile.json 中一键替换）
 */
export const DEFAULT_PORTAL_CATALOG_ITEMS: PortalCatalogItemBlueprint[] = [
  {
    id: "srv-01",
    title: "企业级全渠道商城与会员营销套件",
    author: "CoolieBase 商业中台团队",
    category: "commerce",
    categoryLabel: "数字商业",
    priceCents: 9900,
    rating: 4.9,
    ratingCount: 3820,
    tags: ["多端同源", "SPU/SKU", "会员积分"],
    intro: "开箱即用的 B2C/O2O 交易闭环套件，内置商品中心、优惠券秒杀、会员等级权益与聚合收银台，一键派生 Web、H5 与小程序客户端。",
    accentColor: "#4f46e5",
    trialChapter: {
      title: "方案概览 · 全渠道交易履约架构",
      paragraphs: [
        "1. 统一商品与价格中心：支持多规格 SKU 矩阵、阶梯会员价、限时促销与库存实时预占。",
        "2. 全端一致交互体验：PC 运营后台配置 PageBlockDSL 画布后，移动端与小程序实时同步渲染轮播、金刚区与双列商品流。",
        "3. 真实账实核对：每一笔订单自动关联 Pay 聚合支付流水与财务对账单，100% 满足企业级合规审计。"
      ]
    }
  },
  {
    id: "srv-02",
    title: "AI Agent 驱动的智能客服与知识助手",
    author: "CoolieBase AI 实验室",
    category: "ai",
    categoryLabel: "智能体应用",
    priceCents: 6800,
    rating: 5.0,
    ratingCount: 2450,
    tags: ["27B本地模型", "RAG检索", "工单流转"],
    intro: "深度融合 AIGW 智能网关与 IM 即时通信域，支持 27B 本地私有化大模型低成本部署，自动解答客户咨询并生成结构化业务工单。",
    accentColor: "#059669",
    trialChapter: {
      title: "方案概览 · 27B 私有模型与业务工具调用",
      paragraphs: [
        "1. 极简上下文契约：内置 342 份机器可读 Agent 契约，27B 本地模型无需漫游源码即可精准调用业务 API。",
        "2. 零信任权限护栏：每一次智能体操作均经过多租户 AST 上下文隔离与 RBAC 权限校验，全程留痕可回滚。",
        "3. 人机无缝协同：复杂客诉自动触发 BPM 审批流并转接人工坐席，会话上下文零丢失。"
      ]
    }
  },
  {
    id: "srv-03",
    title: "多组织供应链与智能制造协同套件 (ERP+WMS+MES)",
    author: "CoolieBase 工业互联团队",
    category: "supply",
    categoryLabel: "供应链制造",
    priceCents: 12800,
    rating: 4.9,
    ratingCount: 1960,
    tags: ["排产报工", "库位追溯", "业财一体"],
    intro: "打通从销售订单、采购计划、多仓波次出入库到车间工单排产与质检的全链条数字化台账，消除信息孤岛。",
    accentColor: "#0284c7",
    trialChapter: {
      title: "方案概览 · 从订单到交付全链路闭环",
      paragraphs: [
        "1. 计划与采购联动：根据安全库存与销售预测自动生成采购申请，供应商交期与质检合格率实时评估。",
        "2. 精细化库位管理：支持批次号/序列号全生命周期追踪，移动端扫码完成收货、上架、盘点与拣货。",
        "3. 车间透明化看板：工单进度、设备状态与不良品分布实时呈现在管理大屏。"
      ]
    }
  },
  {
    id: "srv-04",
    title: "可视化低代码表单与跨部门 BPM 审批中心",
    author: "CoolieBase 平台工程组",
    category: "workflow",
    categoryLabel: "流程与低代码",
    priceCents: 4900,
    rating: 4.8,
    ratingCount: 4120,
    tags: ["PageBlockDSL", "响应式联动", "双视口设计"],
    intro: "对标 PagePlug 与商业低代码平台，内置 22 种增强控件与零 eval 安全表达式沙箱，支持 PC 与手机小程序双视口实时预览。",
    accentColor: "#ea580c",
    trialChapter: {
      title: "方案概览 · 声明式 Schema 极速交付",
      paragraphs: [
        "1. 响应式表单联动：通过 {{ $form.xxx }} 表达式秒级配置字段显隐、禁用与动态必填，前后端共享同一套校验规则。",
        "2. 多区块自由拼装：单页即可组合 KPI 指标卡、分布图表、状态看板 (Kanban) 与高密度数据表格。",
        "3. 移动审批随行：审批待办自动同步至移动端工作台，支持电子签名与附件归档。"
      ]
    }
  }
]

/**
 * 5 套行业场景预设词包：27B 模型只需设置 `INDUSTRY_PRESET` 即可切换全站行业调性
 */
export const INDUSTRY_PRESETS: Record<
  IndustryPresetKey,
  {
    portal: PortalBlueprintConfig
    domainOverrides?: Partial<Record<string, { name: string; desc: string }>>
  }
> = {
  "general-enterprise": {
    portal: {
      brandMark: String(BLUEPRINT_DEFAULT_VARS.PORTAL_BRAND_MARK || "C"),
      title: String(BLUEPRINT_DEFAULT_VARS.PORTAL_TITLE || "数字化精选服务门户"),
      subtitleEn: String(BLUEPRINT_DEFAULT_VARS.PORTAL_SUBTITLE_EN || "DIGITAL SERVICE PORTAL"),
      heroBadge: String(BLUEPRINT_DEFAULT_VARS.PORTAL_HERO_BADGE || "ENTERPRISE CONSUMER PORTAL · 全端契约驱动"),
      heroTitle: String(BLUEPRINT_DEFAULT_VARS.PORTAL_HERO_TITLE || "探索精选企业级商品与数字化服务"),
      heroDesc: String(BLUEPRINT_DEFAULT_VARS.PORTAL_HERO_DESC || "打通线上浏览、方案预览、即时申购与会员权益积分，全链路对接真实后端业务域。"),
      searchPlaceholder: String(BLUEPRINT_DEFAULT_VARS.PORTAL_SEARCH_PLACEHOLDER || "搜索商品、服务、方案或标签..."),
      cartLabel: String(BLUEPRINT_DEFAULT_VARS.PORTAL_CART_LABEL || "选购清单"),
      primaryCta: String(BLUEPRINT_DEFAULT_VARS.PORTAL_PRIMARY_CTA || "立即选购"),
      previewCta: String(BLUEPRINT_DEFAULT_VARS.PORTAL_PREVIEW_CTA || "详情预览"),
      profileLabel: String(BLUEPRINT_DEFAULT_VARS.PORTAL_PROFILE_LABEL || "会员中心"),
      categories: [
        { key: "all", label: "全部精选" },
        { key: "commerce", label: "数字商业" },
        { key: "ai", label: "智能体应用" },
        { key: "supply", label: "供应链制造" },
        { key: "workflow", label: "流程与低代码" },
      ],
      catalogItems: DEFAULT_PORTAL_CATALOG_ITEMS,
    },
  },
  "retail-commerce": {
    portal: {
      brandMark: "商",
      title: "优品生活全渠道商城",
      subtitleEn: "OMNI-CHANNEL RETAIL MALL",
      heroBadge: "NEW RETAIL COMMERCE · 会员专享品质生活",
      heroTitle: "全球精选好物 · 极速履约到家",
      heroDesc: "汇聚品牌直供商品、会员专享补贴与同城极速达服务，支持小程序、App 与 Web 端同源购物体验。",
      searchPlaceholder: "搜索商品名称、品牌或促销标签...",
      cartLabel: "购物车",
      primaryCta: "立即抢购",
      previewCta: "商品详情",
      profileLabel: "我的会员",
      categories: [
        { key: "all", label: "全部商品" },
        { key: "commerce", label: "数码家电" },
        { key: "ai", label: "智能穿戴" },
        { key: "supply", label: "居家生活" },
        { key: "workflow", label: "会员专享" },
      ],
      catalogItems: DEFAULT_PORTAL_CATALOG_ITEMS,
    },
  },
  "smart-healthcare": {
    portal: {
      brandMark: "医",
      title: "智慧医疗与健康预约中心",
      subtitleEn: "SMART HEALTHCARE PORTAL",
      heroBadge: "DIGITAL CLINIC & CARE · 专业守护全周期健康",
      heroTitle: "在线专科预约 · 体检套餐与健康档案",
      heroDesc: "提供门诊分时段预约、特色体检套餐选购、电子报告查询与家庭健康顾问一站式服务。",
      searchPlaceholder: "搜索诊疗科室、体检套餐、医师或症状标签...",
      cartLabel: "预约清单",
      primaryCta: "立即预约",
      previewCta: "套餐明细",
      profileLabel: "健康档案",
      categories: [
        { key: "all", label: "全部服务" },
        { key: "commerce", label: "全身体检" },
        { key: "ai", label: "专科门诊" },
        { key: "supply", label: "疫苗接种" },
        { key: "workflow", label: "慢病管理" },
      ],
      catalogItems: DEFAULT_PORTAL_CATALOG_ITEMS,
    },
    domainOverrides: {
      mall: { name: "医疗服务商城 (Mall)", desc: "体检套餐、专科诊疗项目、康养产品上下架与在线预约结算" },
      member: { name: "患者与会员档案 (Member)", desc: "就诊人实名健康档案、家庭成员绑定、储值卡与随访关怀" },
      erp: { name: "药械采购管理 (ERP)", desc: "药品与耗材采购入库、批号效期预警与供应商资质台账" },
    },
  },
  "digital-publishing": {
    portal: {
      brandMark: "书",
      title: "数字化知识与典藏书城",
      subtitleEn: "DIGITAL KNOWLEDGE BOOKSTORE",
      heroBadge: "CURATED DIGITAL LIBRARY · 沉浸式在线阅读",
      heroTitle: "精选典藏著作 · 在线试读与数字借阅",
      heroDesc: "汇聚前沿科技、系统架构与人文经典，支持多端章节试读、书架同步与正版电子书授权。",
      searchPlaceholder: "搜索著作、作者、ISBN 或领域标签...",
      cartLabel: "阅读车",
      primaryCta: "解锁全本",
      previewCta: "免费试读",
      profileLabel: "研读中心",
      categories: [
        { key: "all", label: "全部典藏" },
        { key: "commerce", label: "数字商业" },
        { key: "ai", label: "人工智能" },
        { key: "supply", label: "系统工程" },
        { key: "workflow", label: "组织管理" },
      ],
      catalogItems: DEFAULT_PORTAL_CATALOG_ITEMS,
    },
  },
  "smart-manufacturing": {
    portal: {
      brandMark: "造",
      title: "智能制造与工业品协同门户",
      subtitleEn: "INDUSTRIAL SUPPLY PORTAL",
      heroBadge: "SMART MANUFACTURING CLOUD · 工业协同网络",
      heroTitle: "工业标准件选型 · 产能协同与备件申领",
      heroDesc: "连接上下游供应商、车间产线与终端客户，支持在线询价、BOM 齐套核验与售后工单追踪。",
      searchPlaceholder: "搜索工业品型号、BOM编码或技术规格...",
      cartLabel: "申购单",
      primaryCta: "加入申购",
      previewCta: "规格图纸",
      profileLabel: "客户工作台",
      categories: [
        { key: "all", label: "全部品类" },
        { key: "commerce", label: "传动组件" },
        { key: "ai", label: "工业传感" },
        { key: "supply", label: "产线工装" },
        { key: "workflow", label: "维保服务" },
      ],
      catalogItems: DEFAULT_PORTAL_CATALOG_ITEMS,
    },
  },
}

/**
 * 读取 C 端门户完整动态配置（优先读取 project-profile.json 的 consumerPortal，缺省回退行业预设与模板默认变量）
 */
export function readPortalBlueprint(profile?: {
  industryPreset?: string
  shortName?: string
  platformName?: string
  branding?: { mark?: string }
  consumerPortal?: Partial<PortalBlueprintConfig>
}): PortalBlueprintConfig {
  const presetKey = (
    profile?.industryPreset && profile.industryPreset in INDUSTRY_PRESETS
      ? profile.industryPreset
      : "general-enterprise"
  ) as IndustryPresetKey
  const base = INDUSTRY_PRESETS[presetKey].portal
  const custom = profile?.consumerPortal || {}

  return resolveBlueprintPlaceholders({
    brandMark: custom.brandMark || profile?.branding?.mark || base.brandMark,
    title: custom.title || base.title,
    subtitleEn: custom.subtitleEn || base.subtitleEn,
    heroBadge: custom.heroBadge || base.heroBadge,
    heroTitle: custom.heroTitle || base.heroTitle,
    heroDesc: custom.heroDesc || base.heroDesc,
    searchPlaceholder: custom.searchPlaceholder || base.searchPlaceholder,
    cartLabel: custom.cartLabel || base.cartLabel,
    primaryCta: custom.primaryCta || base.primaryCta,
    previewCta: custom.previewCta || base.previewCta,
    profileLabel: custom.profileLabel || base.profileLabel,
    categories: Array.isArray(custom.categories) && custom.categories.length > 0 ? custom.categories : base.categories,
    catalogItems:
      Array.isArray(custom.catalogItems) && custom.catalogItems.length > 0 ? custom.catalogItems : base.catalogItems,
  })
}

/**
 * 读取 B 端 15 大业务域展示矩阵（自动应用行业预设术语覆盖，告别硬编码）
 */
export function readDomainShowcase(profile?: {
  industryPreset?: string
  domainShowcase?: DomainShowcaseItem[]
}): DomainShowcaseItem[] {
  if (Array.isArray(profile?.domainShowcase) && profile!.domainShowcase.length > 0) {
    return resolveBlueprintPlaceholders(profile!.domainShowcase)
  }
  const presetKey = (
    profile?.industryPreset && profile.industryPreset in INDUSTRY_PRESETS
      ? profile.industryPreset
      : "general-enterprise"
  ) as IndustryPresetKey
  const overrides = INDUSTRY_PRESETS[presetKey].domainOverrides || {}
  return DEFAULT_DOMAIN_SHOWCASE.map((item) => {
    const ov = overrides[item.id]
    return ov ? { ...item, name: ov.name, desc: ov.desc } : item
  })
}

/**
 * 读取移动端/小程序多端配置
 */
export function readMultiClientBlueprint(profile?: {
  shortName?: string
  platformName?: string
  multiClient?: Partial<MultiClientBlueprintConfig>
}): MultiClientBlueprintConfig {
  const custom = profile?.multiClient || {}
  return resolveBlueprintPlaceholders({
    expoAppName: custom.expoAppName || profile?.shortName || String(BLUEPRINT_DEFAULT_VARS.EXPO_APP_NAME || "CoolieBase"),
    expoAppSlug: custom.expoAppSlug || String(BLUEPRINT_DEFAULT_VARS.EXPO_APP_SLUG || "cooliebase-all-app"),
    iosBundleId: custom.iosBundleId || String(BLUEPRINT_DEFAULT_VARS.IOS_BUNDLE_ID || "com.cooliebase.app"),
    androidPackage: custom.androidPackage || String(BLUEPRINT_DEFAULT_VARS.ANDROID_PACKAGE || "com.cooliebase.app"),
    wechatAppId: custom.wechatAppId || String(BLUEPRINT_DEFAULT_VARS.WECHAT_APP_ID || "wx0000000000000000"),
    tabHomeLabel: custom.tabHomeLabel || String(BLUEPRINT_DEFAULT_VARS.MOBILE_TAB_HOME_LABEL || "首页商城"),
    tabStudioLabel: custom.tabStudioLabel || String(BLUEPRINT_DEFAULT_VARS.MOBILE_TAB_STUDIO_LABEL || "工作台"),
    tabMemberLabel: custom.tabMemberLabel || String(BLUEPRINT_DEFAULT_VARS.MOBILE_TAB_MEMBER_LABEL || "会员中心"),
    defaultEntity: custom.defaultEntity || String(BLUEPRINT_DEFAULT_VARS.MOBILE_DEFAULT_ENTITY || "mall.product-spu"),
  })
}
