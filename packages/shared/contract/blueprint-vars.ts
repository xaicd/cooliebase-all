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
    author: "{{SHORT_NAME}} 商业中台团队",
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
    author: "{{SHORT_NAME}} AI 实验室",
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
    author: "{{SHORT_NAME}} 工业互联团队",
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
    author: "{{SHORT_NAME}} 平台工程组",
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

export const RETAIL_COMMERCE_CATALOG_ITEMS: PortalCatalogItemBlueprint[] = [
  {
    id: "ret-01",
    title: "智能降噪无线耳机 Pro · 旗舰版",
    author: "{{SHORT_NAME}} 数码严选",
    category: "commerce",
    categoryLabel: "数码家电",
    priceCents: 89900,
    rating: 4.9,
    ratingCount: 5120,
    tags: ["主动降噪", "空间音频", "次日达"],
    intro: "搭载双核自适应降噪芯片与 36 小时超长续航充电盒，支持多设备无缝流转与门店同城闪送。",
    accentColor: "#4f46e5",
    trialChapter: {
      title: "商品详情 · 声学参数与售后保障",
      paragraphs: [
        "1. 旗舰声学架构：定制 11mm 动圈单元配合实时耳道声学补偿，高达 48dB 深度主动降噪。",
        "2. 全渠道无忧退换：支持 7 天无理由退货、1 年全国联保只换不修与门店现场试听。",
        "3. 会员专属权益：下单立返双倍购物积分，支持会员积分抵现与免息分期。"
      ]
    }
  },
  {
    id: "ret-02",
    title: "全天候健康监测智能手表 S5",
    author: "{{SHORT_NAME}} 智能穿戴馆",
    category: "ai",
    categoryLabel: "智能穿戴",
    priceCents: 129900,
    rating: 4.8,
    ratingCount: 3180,
    tags: ["血氧心率", "50米防水", "NFC门禁"],
    intro: "蓝宝石玻璃表镜配钛金属表圈，支持 100+ 运动模式识别、睡眠呼吸质量分析与微信离线支付。",
    accentColor: "#059669",
    trialChapter: {
      title: "商品详情 · 传感器规格与续航表现",
      paragraphs: [
        "1. 多通道生物追踪光学传感器：24 小时连续监测心率、血氧饱和度与压力指数。",
        "2. 双频五星定位系统：户外跑步与骑行轨迹精准还原，支持离线地图导航。",
        "3. 磁吸闪充体验：充电 10 分钟即可满足全天佩戴，典型场景续航长达 14 天。"
      ]
    }
  },
  {
    id: "ret-03",
    title: "北欧极简恒温意式浓缩咖啡机",
    author: "{{SHORT_NAME}} 居家生活馆",
    category: "supply",
    categoryLabel: "居家生活",
    priceCents: 158000,
    rating: 4.9,
    ratingCount: 2040,
    tags: ["20Bar高压", "PID温控", "蒸汽奶泡"],
    intro: "可视化压力表与商业级预浸泡系统，在家即可萃取出浓郁油脂的精品意式浓缩与丝滑拿铁。",
    accentColor: "#0284c7",
    trialChapter: {
      title: "商品详情 · 萃取工艺与附赠配件",
      paragraphs: [
        "1. PID 精准数字控温：水温恒定在 92°C 黄金萃取区间，充分释放咖啡豆原本果香与醇厚风味。",
        "2. 强劲干式蒸汽棒：轻松打发绵密微奶泡，新手也能快速掌握拉花技巧。",
        "3. 全套咖啡师礼盒：随箱附赠 58mm 实木手柄、不锈钢拉花缸、压粉锤与精选拼配咖啡豆。"
      ]
    }
  },
  {
    id: "ret-04",
    title: "黑金 PLUS 年度尊享会员权益卡",
    author: "{{SHORT_NAME}} 会员中心",
    category: "workflow",
    categoryLabel: "会员专享",
    priceCents: 19900,
    rating: 5.0,
    ratingCount: 8460,
    tags: ["全场95折", "每月免邮券", "专属客服"],
    intro: "开通即享全年 360 元无门槛津贴、会员专享补贴价、生日礼遇及全年无限次免运费极速达。",
    accentColor: "#ea580c",
    trialChapter: {
      title: "权益明细 · 黑金 PLUS 六大尊享特权",
      paragraphs: [
        "1. 折上95折：覆盖商城 90% 以上自营数码、家电与居家日用百货，大促期间可叠加使用。",
        "2. 运费全免：全年享受 36 张标准免邮券与上门取件免首重退换货权益。",
        "3. 贵宾专线：1 对 1 专属生活管家极速响应，优先参与新品首发内购。"
      ]
    }
  }
]

export const SMART_HEALTHCARE_CATALOG_ITEMS: PortalCatalogItemBlueprint[] = [
  {
    id: "med-01",
    title: "年度全项深度健康体检套餐（含全身精密筛查）",
    author: "{{SHORT_NAME}} 预防医学中心",
    category: "commerce",
    categoryLabel: "全身体检",
    priceCents: 68800,
    rating: 4.9,
    ratingCount: 3820,
    tags: ["血常规24项", "彩超+DR", "主任医师解读"],
    intro: "涵盖一般理学检查、血常规、生化全套、腹部彩超、胸部 DR 与心电图筛查，出具数字化终身健康档案并提供 1 对 1 主任医师报告解读。",
    accentColor: "#0d9488",
    trialChapter: {
      title: "套餐明细 · 体检流程与检验项目清单",
      paragraphs: [
        "1. 基础体征与检验：包含内科、外科、眼科、耳鼻喉科理学检查，以及 24 项全血细胞分析与肝肾功能、血脂血糖全套。",
        "2. 精密影像学筛查：配备高分辨率彩色多普勒超声与低剂量数字化 DR 影像，精准排查早期潜在病灶。",
        "3. 数字化健康报告：体检完成后 24 小时内自动推送结构化电子报告，支持历年指标趋势对比与异常指标智能预警。"
      ]
    }
  },
  {
    id: "med-02",
    title: "主任医师专家专科门诊分时段预约",
    author: "{{SHORT_NAME}} 专家诊疗中心",
    category: "ai",
    categoryLabel: "专科门诊",
    priceCents: 15000,
    rating: 5.0,
    ratingCount: 2450,
    tags: ["三甲级专家", "分时段候诊", "多学科会诊"],
    intro: "覆盖内科、外科、皮肤科、眼科与骨科专科门诊，按 15 分钟精准分时段预约到院，告别排队等待与交叉感染风险。",
    accentColor: "#059669",
    trialChapter: {
      title: "就诊指南 · 分时段预约与标准化问诊流程",
      paragraphs: [
        "1. 预检分诊建档：线上预约时即可上传既往病历与检查单，智能预问诊助手自动整理核心主诉供接诊专家审阅。",
        "2. 充足问诊时长：每位预约患者保障不少于 15 分钟深度面诊沟通，诊疗方案、处方与收费明细全程透明公开。",
        "3. 诊后随访闭环：离院后自动生成用药提醒与复诊日历，住院或手术患者直通绿色转诊通道。"
      ]
    }
  },
  {
    id: "med-03",
    title: "四价/多联免疫疫苗接种与抗体滴度检测套餐",
    author: "{{SHORT_NAME}} 免疫预防门诊",
    category: "supply",
    categoryLabel: "疫苗接种",
    priceCents: 29800,
    rating: 4.9,
    ratingCount: 4120,
    tags: ["冷链溯源", "抗体检测", "电子免疫证"],
    intro: "采用全程 2-8℃ 物联网冷链温控进口/国标疫苗，接种前进行体况评估，接种后留观 30 分钟并签发电子免疫凭证。",
    accentColor: "#0284c7",
    trialChapter: {
      title: "服务说明 · 冷链追溯与接种安全规范",
      paragraphs: [
        "1. 一苗一码溯源：每一支疫苗均绑定药品监管码与冷链温度曲线，扫码即可核验生产批号与效期。",
        "2. 科学免疫程序：根据年龄与既往免疫史定制首免或加强免疫计划，支持接种后 IgG 保护性抗体滴度定量检测。",
        "3. 全周期到期提醒：下一针加强免疫到期前 7 天自动通过短信与小程序推送提醒。"
      ]
    }
  },
  {
    id: "med-04",
    title: "慢性病居家监测与私人健康管理年卡",
    author: "{{SHORT_NAME}} 慢病管理团队",
    category: "workflow",
    categoryLabel: "慢病管理",
    priceCents: 99900,
    rating: 4.8,
    ratingCount: 1860,
    tags: ["动态监测", "营养处方", "季度复查"],
    intro: "面向高血压、糖尿病、术后康复及老年群体，提供居家体征远端监测、个性化营养与运动处方、季度随访复查及紧急绿通服务。",
    accentColor: "#ea580c",
    trialChapter: {
      title: "方案概览 · 院内诊疗与居家康复无缝衔接",
      paragraphs: [
        "1. 物联网体征联动：支持血压计、血糖仪与心率监测数据自动同步至健康档案，指标超限即时触发医护工作台预警。",
        "2. 多师共管服务：由专科医师、临床药师与注册营养师组成专属小组，按月评估康复进展并动态调整用药与膳食方案。",
        "3. 家属协同看板：授权家属可随时在移动端查看每日健康日报与复诊计划。"
      ]
    }
  }
]

export const DIGITAL_PUBLISHING_CATALOG_ITEMS: PortalCatalogItemBlueprint[] = [
  {
    id: "pub-01",
    title: "《云原生分布式系统架构与工程实践》典藏版",
    author: "{{SHORT_NAME}} 技术出版中心",
    category: "supply",
    categoryLabel: "系统工程",
    priceCents: 7900,
    rating: 4.9,
    ratingCount: 4210,
    tags: ["高并发架构", "多活容灾", "配套源码"],
    intro: "深入剖析大规模分布式系统的服务治理、共识算法、可观测性与混沌工程实践，随书附赠完整可运行实验沙箱。",
    accentColor: "#4f46e5",
    trialChapter: {
      title: "免费试读 · 第一章：从单体到领域驱动微内核",
      paragraphs: [
        "1. 架构演进的本质：优秀的系统架构并非追求最复杂的分布式原语，而是在业务演进速率与运维复杂度之间建立清晰的契约边界。",
        "2. 领域内聚与显式依赖：通过严格的模块边界守卫，让单体应用具备微服务的工程自治能力，同时规避跨网调用的分布式税。",
        "3. 可验证的稳定性：每一条架构红线都必须转化为自动化静态门禁与契约测试。"
      ]
    }
  },
  {
    id: "pub-02",
    title: "《大模型智能体 (AI Agent) 工程化落地指南》",
    author: "{{SHORT_NAME}} 智能科学研究院",
    category: "ai",
    categoryLabel: "人工智能",
    priceCents: 8800,
    rating: 5.0,
    ratingCount: 5630,
    tags: ["端侧模型", "工具编排", "RAG架构"],
    intro: "系统讲解 27B/70B 本地大模型部署、结构化工具调用、长短期记忆网络与企业级安全护栏设计。",
    accentColor: "#059669",
    trialChapter: {
      title: "免费试读 · 第二章：小参数模型的确定性契约设计",
      paragraphs: [
        "1. 认知负荷收敛：面对 27B 级本地模型，紧凑的 JSON Schema 契约远比冗长的自然语言提示词更能保证百次调用零漂移。",
        "2. 沙箱化执行闭环：将模型输出严格限制在声明式 DSL 与参数字典内，由确定性编译器负责生成最终代码与 SQL。",
        "3. 全链路可观测审计：记录每一次推理的 Token 消耗、工具入参与状态机迁移轨迹。"
      ]
    }
  },
  {
    id: "pub-03",
    title: "《数字化零售与全渠道会员增长方法论》",
    author: "{{SHORT_NAME}} 数字商业智库",
    category: "commerce",
    categoryLabel: "数字商业",
    priceCents: 5900,
    rating: 4.8,
    ratingCount: 2890,
    tags: ["全域增长", "LTV模型", "私域运营"],
    intro: "结合 50+ 行业标杆案例，拆解从公域获客、门店导购协同到会员全生命周期价值 (LTV) 提升的实战沙盘。",
    accentColor: "#0284c7",
    trialChapter: {
      title: "免费试读 · 序言：重构人、货、场的数字化底座",
      paragraphs: [
        "1. 统一身份识别：打通小程序、POS 门店与电商平台的 OneID 会员主档，消除多渠道积分与权益割裂。",
        "2. 数据驱动选品：基于实时动销率与复购漏斗动态调整商品陈列与组合促销策略。",
        "3. 敏捷活动编排：运营人员通过可视化区块画布 10 分钟上线专题会场。"
      ]
    }
  },
  {
    id: "pub-04",
    title: "《高成熟度软件研发组织与 CMMI 精益治理》",
    author: "{{SHORT_NAME}} 工程管理委员会",
    category: "workflow",
    categoryLabel: "组织管理",
    priceCents: 6900,
    rating: 4.9,
    ratingCount: 3150,
    tags: ["Spec驱动", "统计过程控制", "零缺陷交付"],
    intro: "如何将 CMMI 5 级过程资产转化为开发者友好的自动化流水线，实现高速度与高质量的工程并轨。",
    accentColor: "#ea580c",
    trialChapter: {
      title: "免费试读 · 第三章：Doc as Code 与不可变机器证据",
      paragraphs: [
        "1. 消灭形式主义文档：需求规格、架构决策与测试用例必须与源码同仓演进，并由 CI 门禁实时校验双向追溯矩阵。",
        "2. 缺陷根因阻断 (CAR)：每一次线上回归都必须沉淀为一条永久生效的静态扫描或端到端断言。",
        "3. 度量驱动改进：用构建时长、一次通过率与覆盖率基线替代主观经验判断。"
      ]
    }
  }
]

export const SMART_MANUFACTURING_CATALOG_ITEMS: PortalCatalogItemBlueprint[] = [
  {
    id: "mfg-01",
    title: "高精密行星减速机与伺服传动总成 (IP65)",
    author: "{{SHORT_NAME}} 精密传动事业部",
    category: "commerce",
    categoryLabel: "传动组件",
    priceCents: 368000,
    rating: 4.9,
    ratingCount: 1420,
    tags: ["背隙≤3弧分", "渗碳合金钢", "3D图纸下载"],
    intro: "适用于工业机器人、数控机床与自动化装配线，提供标准法兰接口、满负载寿命测试报告与交期实时追踪。",
    accentColor: "#0284c7",
    trialChapter: {
      title: "规格图纸 · 额定扭矩参数与安装尺寸说明",
      paragraphs: [
        "1. 机械性能指标：额定输出扭矩 120 N·m，最大径向载荷 4200 N，传动效率 ≥ 97%，全合成润滑脂终身免维护。",
        "2. 工况适配清单：支持法兰式与轴输出式安装，防护等级 IP65，适应 -25℃ 至 +90℃ 连续工业作业环境。",
        "3. 供应链齐套保障：常备标准速比（5/10/15/20）现货库存，支持 BOM 批量导入与批次质检报告随货同行。"
      ]
    }
  },
  {
    id: "mfg-02",
    title: "工业级多模态振动温湿度边缘传感终端",
    author: "{{SHORT_NAME}} 工业物联中心",
    category: "ai",
    categoryLabel: "工业传感",
    priceCents: 86000,
    rating: 5.0,
    ratingCount: 1980,
    tags: ["Modbus/MQTT", "预测性维护", "防爆认证"],
    intro: "内置三轴高频加速度计与边缘 FFT 频谱分析算法，毫秒级捕捉电机轴承早期磨损特征并直连 IoT 告警大屏。",
    accentColor: "#059669",
    trialChapter: {
      title: "规格图纸 · 通信协议与边缘推理物模型",
      paragraphs: [
        "1. 采集精度参数：三轴振动采样率高达 25.6 kHz，温度测量精度 ±0.3℃，支持磁吸与螺柱双模固定。",
        "2. 标准物模型接入：原生支持工业 Modbus-RTU、OPC-UA 与 MQTT 协议，上电即自动注册至平台设备台账。",
        "3. 异常闭环联动：检测到频谱包络超阈值时自动触发 MES 设备点检工单，避免产线非计划停机。"
      ]
    }
  },
  {
    id: "mfg-03",
    title: "柔性产线气动快换夹具与零点定位工装模组",
    author: "{{SHORT_NAME}} 智能装备工装部",
    category: "supply",
    categoryLabel: "产线工装",
    priceCents: 215000,
    rating: 4.8,
    ratingCount: 1160,
    tags: ["重复定位5μm", "快速换型", "阳极硬化"],
    intro: "专为多品种小批量柔性制造产线设计，实现 30 秒内工装托盘快速换型，重复定位精度达 ±0.005mm。",
    accentColor: "#4f46e5",
    trialChapter: {
      title: "规格图纸 · 锁紧力曲线与气路接口定义",
      paragraphs: [
        "1. 高刚性自锁机构：采用高强度模具钢整体淬火研磨，断气状态下依靠碟簧机械自锁保持 18 kN 拉紧力。",
        "2. 智能在位检测：集成气密座面吹扫与夹紧到位微动开关信号反馈，直连 PLC 安全互锁回路。",
        "3. 定制化非标服务：支持在线提交工件 STEP 模型，48 小时内出具夹具干涉仿真与选型方案。"
      ]
    }
  },
  {
    id: "mfg-04",
    title: "产线核心设备年度预防性维保与备件托管服务",
    author: "{{SHORT_NAME}} 客户工程服务部",
    category: "workflow",
    categoryLabel: "维保服务",
    priceCents: 580000,
    rating: 4.9,
    ratingCount: 890,
    tags: ["4小时到场", "备件先行", "OEE提升"],
    intro: "提供季度全套激光精度校准、关键易损件安全库存寄售托管与 7×24 小时驻厂/远程工程师应急保障。",
    accentColor: "#ea580c",
    trialChapter: {
      title: "规格图纸 · SLA 响应等级与巡检标准作业程序",
      paragraphs: [
        "1. 确定性 SLA 承诺：P1 级停线故障 15 分钟内远程接入诊断，核心工业圈 4 小时内备件与工程师携工具到场。",
        "2. 数字化巡检台账：每次保养均提供主轴振动、反向间隙与润滑油品检测报告，全程同步至客户工作台。",
        "3. 备件寄售零资金占用：常用易损件前置部署至客户现场智能物料柜，按实际领用扫码结算。"
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
      catalogItems: RETAIL_COMMERCE_CATALOG_ITEMS,
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
      catalogItems: SMART_HEALTHCARE_CATALOG_ITEMS,
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
      catalogItems: DIGITAL_PUBLISHING_CATALOG_ITEMS,
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
      catalogItems: SMART_MANUFACTURING_CATALOG_ITEMS,
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
  const runtimeOverrides: Record<string, string> = {}
  if (profile?.shortName || profile?.platformName) {
    runtimeOverrides.SHORT_NAME = profile.shortName || profile.platformName || ""
  }

  return resolveBlueprintPlaceholders(
    {
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
    },
    runtimeOverrides
  )
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
    expoAppName: custom.expoAppName || profile?.shortName || String(BLUEPRINT_DEFAULT_VARS.EXPO_APP_NAME || "数字化客户端"),
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
