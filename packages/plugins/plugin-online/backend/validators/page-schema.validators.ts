import { z } from "zod"
import { evaluateBooleanExpression } from "@/shared/frontend/lib/expression-engine"

/**
 * 端无关「页面与多区块 Schema (PageBlockDSL v2)」—— 商业级多端低代码底座核心协议。
 *
 * 对标：
 *   - cloudtogo/pageplug (Appsmith + Formily + ECharts + Taro 小程序双视口)
 *   - 百度爱速搭 (Amis) / NocoBase 区块体系
 *
 * 100% 向后兼容存量 342 份 PageSchema (`{ entity, title, fields }`)，
 * 同时支持：
 *   1. 22 种商业级字段控件（含级联、树选、评分、滑块、货币、标签、子表、富文本等）；
 *   2. 类 Formily 响应式联动属性（`visibleOn`、`disabledOn`、`requiredOn` 支持 `{{ $form.xxx }}`）；
 *   3. 多端页面区块树 `blocks[]`（B端：StatMetrics 指标卡、Chart 图表、Kanban 看板、ProTable 表格、Timeline；
 *      C端/小程序：Banner 轮播、GridNav 金刚区宫格、ProductWaterfall 商品瀑布流、SkuAction 规格栏）；
 *   4. 多数据源 `queries[]` 与声明式事件动作链 `actions[]`。
 */

export const FIELD_WIDGET_TYPES = [
  "text",
  "textarea",
  "number",
  "boolean",
  "date",
  "datetime",
  "select",
  "radio",
  "checkbox",
  "switch",
  "cascader",
  "tree_select",
  "slider",
  "rate",
  "tags",
  "currency",
  "color",
  "image",
  "file",
  "richtext",
  "sub_table",
  "json",
] as const

export type FieldWidgetType = (typeof FIELD_WIDGET_TYPES)[number]

/** 子表单列定义（用于主子表明细录入，如订单明细行） */
export const subFieldDefSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/, "子字段编码需字母开头、字母数字下划线，≤40 位"),
  label: z.string().trim().min(1).max(60),
  type: z.enum(["text", "number", "select", "currency", "date", "boolean"]).default("text"),
  required: z.boolean().default(false),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
})

/** 单个动态字段定义（支持 Formily / PagePlug 式响应式联动表达式） */
export const fieldDefSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/, "字段编码需字母开头、字母数字下划线，≤40 位"),
  label: z.string().trim().min(1, "字段名称不能为空").max(60),
  type: z.enum(FIELD_WIDGET_TYPES).default("text"),
  required: z.boolean().default(false),
  showInList: z.boolean().default(true),
  showInForm: z.boolean().default(true),
  /** select / radio / checkbox / cascader / tags 类型的选项 */
  options: z.array(z.object({ label: z.string(), value: z.string(), color: z.string().optional() })).optional(),
  placeholder: z.string().max(120).optional(),
  sort: z.coerce.number().int().default(0),
  /** 栅格宽度 (1-24，默认 12 半宽，24 整行) */
  span: z.coerce.number().int().min(1).max(24).optional(),
  /** 表单分组标题 */
  group: z.string().max(60).optional(),
  /** 响应式显隐表达式，如 `{{ $form.orderType === 'VIP' }}` */
  visibleOn: z.string().max(300).optional(),
  /** 响应式禁用表达式，如 `{{ $form.status === 'LOCKED' }}` */
  disabledOn: z.string().max(300).optional(),
  /** 响应式必填表达式，如 `{{ $form.amount > 10000 }}` */
  requiredOn: z.string().max(300).optional(),
  /** 默认值 */
  defaultValue: z.unknown().optional(),
  /** sub_table 子表列定义 */
  subFields: z.array(subFieldDefSchema).optional(),
})

export type FieldDef = z.infer<typeof fieldDefSchema>

/** 指标卡单项定义 */
export const statMetricItemSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1),
  /** 聚合方式：count(总行数) | sum(求和) | avg(均值) | filter_count(条件计数) | expression(表达式) */
  aggregate: z.enum(["count", "sum", "avg", "filter_count", "expression"]).default("count"),
  field: z.string().optional(),
  filterExpr: z.string().optional(),
  unit: z.string().optional(),
  trend: z.string().optional(),
  tone: z.enum(["indigo", "emerald", "amber", "rose", "slate"]).default("indigo"),
})

export type StatMetricItem = z.infer<typeof statMetricItemSchema>

/** 页面区块定义 (B 端 + C 端/小程序同源区块) */
export const pageBlockSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum([
    "stat_metrics",
    "chart",
    "kanban",
    "pro_table",
    "detail_timeline",
    "banner",
    "grid_nav",
    "product_waterfall",
    "sku_action",
  ]),
  title: z.string().trim().max(80).default(""),
  /** 适用端：all | pc | mobile */
  surface: z.enum(["all", "pc", "mobile"]).default("all"),
  visibleOn: z.string().max(300).optional(),
  /** stat_metrics 专用配置 */
  metrics: z.array(statMetricItemSchema).optional(),
  /** chart 专用配置 (对标 PagePlug ECharts) */
  chartKind: z.enum(["bar", "line", "pie", "funnel"]).optional(),
  dimensionField: z.string().optional(),
  metricField: z.string().optional(),
  /** kanban 专用配置 (状态看板分组字段) */
  groupByField: z.string().optional(),
  /** C 端 banner / grid_nav 专用静态或绑定项 */
  items: z
    .array(
      z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        icon: z.string().optional(),
        imageUrl: z.string().optional(),
        badge: z.string().optional(),
        actionUrl: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .optional(),
})

export type PageBlockDef = z.infer<typeof pageBlockSchema>

/** 多数据源 Query 编排定义 (对标 PagePlug Queries) */
export const pageQuerySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  endpoint: z.string().trim().min(1),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  autoRun: z.boolean().default(true),
})

export type PageQueryDef = z.infer<typeof pageQuerySchema>

/** 事件动作链定义 (对标 PagePlug Actions) */
export const pageActionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  trigger: z.enum(["toolbar", "row", "form_submit"]).default("row"),
  confirmText: z.string().optional(),
  apiEndpoint: z.string().optional(),
  method: z.enum(["POST", "PUT", "DELETE"]).default("POST"),
  visibleOn: z.string().optional(),
  reloadAfter: z.boolean().default(true),
})

export type PageActionDef = z.infer<typeof pageActionSchema>

/** 一个实体/页面绑定的完整多端 Schema (PageBlockDSL v2) */
export const pageSchemaSchema = z.object({
  /** 绑定的实体（如 member_user） */
  entity: z.string().trim().min(1),
  /** 页面标题 */
  title: z.string().trim().max(60).default(""),
  /** 默认布局模式 */
  layoutMode: z.enum(["table", "kanban", "split", "dashboard", "mobile_portal"]).optional(),
  /** 字段清单：PC Web / Expo / 小程序共用同一 fields */
  fields: z.array(fieldDefSchema).default([]),
  /** 多区块列表（可选，不传则自动按字段推导标准区块） */
  blocks: z.array(pageBlockSchema).optional(),
  /** 多数据源查询列表（可选） */
  queries: z.array(pageQuerySchema).optional(),
  /** 自定义动作链（可选） */
  actions: z.array(pageActionSchema).optional(),
})

export type PageSchema = z.infer<typeof pageSchemaSchema>

export const pageSchemaUpdateSchema = z.object({
  title: z.string().trim().max(60).optional(),
  layoutMode: z.enum(["table", "kanban", "split", "dashboard", "mobile_portal"]).optional(),
  fields: z.array(fieldDefSchema).optional(),
  blocks: z.array(pageBlockSchema).optional(),
  queries: z.array(pageQuerySchema).optional(),
  actions: z.array(pageActionSchema).optional(),
})

export function defaultPageSchema(entity: string): PageSchema {
  return { entity, title: "", fields: [] }
}

/** 校验一条动态字段值是否符合定义（支持 visibleOn / requiredOn 响应式表达式联动校验） */
export function validateExtraValues(
  fields: FieldDef[],
  values: Record<string, unknown>,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const out: Record<string, unknown> = {}
  const evalCtx = { $form: values, form: values, $row: values, row: values }

  for (const f of fields) {
    // 若配置了 visibleOn 且当前求值为 false，说明字段处于隐藏态，跳过必填校验
    const isVisible = f.visibleOn ? evaluateBooleanExpression(f.visibleOn, evalCtx, true) : true
    if (!isVisible) continue

    const isDynamicallyRequired = f.requiredOn
      ? evaluateBooleanExpression(f.requiredOn, evalCtx, false)
      : false
    const mustFill = Boolean(f.required || isDynamicallyRequired)

    const v = values[f.code]
    if (mustFill && (v === undefined || v === null || v === "")) {
      return { ok: false, error: `字段「${f.label}」必填` }
    }
    if (v === undefined) continue
    if (
      (f.type === "number" || f.type === "currency" || f.type === "slider" || f.type === "rate") &&
      v !== "" &&
      Number.isNaN(Number(v))
    ) {
      return { ok: false, error: `字段「${f.label}」必须为数字` }
    }
    out[f.code] =
      f.type === "number" || f.type === "currency" || f.type === "slider" || f.type === "rate"
        ? Number(v)
        : f.type === "boolean" || f.type === "switch"
          ? Boolean(v)
          : v
  }
  return { ok: true, value: out }
}
