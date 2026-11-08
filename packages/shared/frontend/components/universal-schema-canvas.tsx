"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  GENERATED_PAGE_SCHEMAS,
  type GeneratedPageSchema,
  type GeneratedPageField,
} from "../../contract/page-schemas.generated"
import { Pagination } from "./pagination"
import { request } from "../lib/request"
import { evaluateBooleanExpression, evaluateExpression } from "../lib/expression-engine"

export interface CanvasFieldExtended extends Omit<GeneratedPageField, "type"> {
  type: string
  showInList?: boolean
  showInForm?: boolean
  options?: Array<{ label: string; value: string; color?: string }>
  placeholder?: string
  span?: number
  group?: string
  visibleOn?: string
  disabledOn?: string
  requiredOn?: string
  defaultValue?: unknown
  subFields?: Array<{ code: string; label: string; type: string; required?: boolean }>
}

export interface CanvasBlockDef {
  id: string
  type:
    | "stat_metrics"
    | "chart"
    | "kanban"
    | "pro_table"
    | "detail_timeline"
    | "banner"
    | "grid_nav"
    | "product_waterfall"
    | "sku_action"
  title?: string
  surface?: "all" | "pc" | "mobile"
  visibleOn?: string
  chartKind?: "bar" | "line" | "pie" | "funnel"
  dimensionField?: string
  metricField?: string
  groupByField?: string
  metrics?: Array<{
    code: string
    label: string
    aggregate?: "count" | "sum" | "avg" | "filter_count" | "expression"
    field?: string
    filterExpr?: string
    unit?: string
    trend?: string
    tone?: "indigo" | "emerald" | "amber" | "rose" | "slate"
  }>
}

export interface CanvasSchemaExtended extends Omit<GeneratedPageSchema, "fields"> {
  layoutMode?: "table" | "kanban" | "split" | "dashboard" | "mobile_portal"
  fields: CanvasFieldExtended[]
  blocks?: CanvasBlockDef[]
}

export interface UniversalSchemaCanvasProps {
  entity: string
  domain?: string
  apiEndpoint?: string
  title?: string
  schema?: CanvasSchemaExtended | GeneratedPageSchema
  readOnly?: boolean
  className?: string
}

/**
 * 将下划线/驼峰转为 kebab-case (如 pay_order -> pay-order, AiApiKey -> ai-api-key)
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase()
}

/**
 * 格式化单元格数据展示
 */
function formatCellValue(val: any, field: CanvasFieldExtended): React.ReactNode {
  if (val === null || val === undefined || val === "") {
    return <span className="text-slate-300 font-mono">-</span>
  }

  // 评分组件
  if (field.type === "rate") {
    const stars = Math.max(0, Math.min(5, Math.round(Number(val) || 0)))
    return (
      <span className="text-amber-500 tracking-tight text-xs" title={`${stars} 星`}>
        {"★".repeat(stars)}
        <span className="text-slate-200">{"★".repeat(5 - stars)}</span>
      </span>
    )
  }

  // 标签数组或逗号分隔标签
  if (field.type === "tags") {
    const list = Array.isArray(val)
      ? val
      : String(val)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
    return (
      <div className="flex flex-wrap gap-1">
        {list.slice(0, 3).map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60"
          >
            {String(tag)}
          </span>
        ))}
      </div>
    )
  }

  // 状态类字段智能 Badge
  if (field.code.includes("status") || field.code.includes("state") || field.type === "select") {
    const matchedOpt = field.options?.find((o) => String(o.value) === String(val))
    const labelText = matchedOpt ? matchedOpt.label : String(val)
    const num = Number(val)
    if (
      num === 0 ||
      num === 1 ||
      String(val).toLowerCase() === "active" ||
      String(val).toLowerCase() === "success" ||
      String(val).toLowerCase() === "enabled"
    ) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          {labelText}
        </span>
      )
    }
    if (num === 2 || String(val).toLowerCase() === "pending" || String(val).toLowerCase() === "wait") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          {labelText}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {labelText}
      </span>
    )
  }

  // 金额分单位或 currency 转换
  if (
    field.type === "currency" ||
    field.code.includes("price") ||
    field.code.includes("amount") ||
    field.code.includes("balance")
  ) {
    const num = Number(val)
    if (!isNaN(num)) {
      const yuan = field.type === "currency" ? num.toFixed(2) : (num / 100).toFixed(2)
      return <span className="font-mono text-slate-900 font-medium">¥{yuan}</span>
    }
  }

  // 图片展示
  if (
    field.type === "image" ||
    (field.code.includes("url") && String(val).startsWith("http") && /\.(png|jpg|jpeg|webp|gif)/i.test(String(val)))
  ) {
    return (
      <img
        src={String(val)}
        alt="preview"
        className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-2xs"
      />
    )
  }

  // 布尔值 / 开关
  if (field.type === "boolean" || field.type === "switch" || typeof val === "boolean") {
    return val ? (
      <span className="text-emerald-600 font-medium text-xs">是</span>
    ) : (
      <span className="text-slate-400 text-xs">否</span>
    )
  }

  // 子表数组摘要
  if (field.type === "sub_table" && Array.isArray(val)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-700 font-mono">
        {val.length} 条明细
      </span>
    )
  }

  // 普通文本截断展示
  const str = typeof val === "object" ? JSON.stringify(val) : String(val)
  if (str.length > 40) {
    return <span title={str}>{str.slice(0, 37)}...</span>
  }
  return <span>{str}</span>
}

/**
 * UniversalSchemaCanvas v2 (多区块页面画布 + 看板视图 + Formily/PagePlug 式响应式表达式联动)
 */
export function UniversalSchemaCanvas({
  entity,
  domain,
  apiEndpoint: customEndpoint,
  title: customTitle,
  schema: customSchema,
  readOnly = false,
  className = "",
}: UniversalSchemaCanvasProps) {
  // 1. 动态解析 Schema 元数据
  const schema: CanvasSchemaExtended | null = useMemo(() => {
    if (customSchema) return customSchema as CanvasSchemaExtended
    const normalizedKey = entity.toLowerCase().replace(/-/g, "_")
    return (GENERATED_PAGE_SCHEMAS[normalizedKey] as CanvasSchemaExtended) || null
  }, [customSchema, entity])

  // 2. 推导标准 API Endpoint
  const apiEndpoint = useMemo(() => {
    if (customEndpoint) return customEndpoint
    const dom = domain || "system"
    const kebab = toKebabCase(entity)
    return `/api/v1/admin/${dom}/${kebab}`
  }, [customEndpoint, domain, entity])

  const pageTitle = customTitle || schema?.title || `${entity} 业务管理`

  // 3. 视图模式 (表格 Table / 看板 Kanban) 与图表抽屉开关
  const [viewMode, setViewMode] = useState<"table" | "kanban">(
    schema?.layoutMode === "kanban" ? "kanban" : "table",
  )
  const [showChartPanel, setShowChartPanel] = useState<boolean>(
    Boolean(schema?.blocks?.some((b) => b.type === "chart") || schema?.layoutMode === "dashboard"),
  )

  // 4. 业务数据状态
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 5. 搜索与筛选状态
  const [queryState, setQueryState] = useState<Record<string, any>>({})

  // 6. 模态框与详情状态
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<any | null>(null)

  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // 7. 加载数据流
  const loadData = useCallback(
    async (p = page, ps = pageSize, q = queryState) => {
      setLoading(true)
      setErrorMsg(null)
      try {
        const res = await request.get(apiEndpoint, { page: p, pageSize: ps, ...q })
        if (res && res.success !== false) {
          const payload = res.data ?? res
          if (Array.isArray(payload)) {
            setItems(payload)
            setTotal(payload.length)
          } else if (payload && Array.isArray(payload.items)) {
            setItems(payload.items)
            setTotal(payload.total ?? payload.items.length)
          } else if (payload && Array.isArray(payload.list)) {
            setItems(payload.list)
            setTotal(payload.total ?? payload.list.length)
          } else {
            setItems([])
            setTotal(0)
          }
        } else {
          setErrorMsg(res?.message || "数据加载失败")
        }
      } catch (err: any) {
        setErrorMsg(err.message || "网络请求异常")
      } finally {
        setLoading(false)
      }
    },
    [apiEndpoint, page, pageSize, queryState],
  )

  useEffect(() => {
    loadData(page, pageSize, queryState)
  }, [loadData, page, pageSize])

  // 8. 处理搜索与重置
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadData(1, pageSize, queryState)
  }

  const handleReset = () => {
    setQueryState({})
    setPage(1)
    loadData(1, pageSize, {})
  }

  // 9. 处理保存 (新建/修改)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError(null)
    try {
      const isEdit = Boolean(editingItem?.id)
      const res = isEdit
        ? await request.put(`${apiEndpoint}/${editingItem.id}`, formData)
        : await request.post(apiEndpoint, formData)

      if (res && res.success !== false) {
        showToast(isEdit ? "更新记录成功" : "创建新记录成功")
        setFormOpen(false)
        loadData(page, pageSize, queryState)
      } else {
        setFormError(res?.message || "操作提交失败")
      }
    } catch (err: any) {
      setFormError(err.message || "请求异常")
    } finally {
      setFormSubmitting(false)
    }
  }

  // 10. 处理删除
  const handleDelete = async (row: any) => {
    const id = row.id || row.no || row.code
    if (!id) return
    if (!window.confirm(`确定要删除此条记录 (${id}) 吗？此操作将触发审计日志留存。`)) return
    try {
      const res = await request.delete(`${apiEndpoint}/${id}`)
      if (res && res.success !== false) {
        showToast("删除记录成功")
        loadData(page, pageSize, queryState)
      } else {
        alert(res?.message || "删除失败")
      }
    } catch (err: any) {
      alert(err.message || "删除网络请求异常")
    }
  }

  // 11. 选取展示列与过滤列
  const displayFields = useMemo(() => {
    if (!schema?.fields) return []
    return schema.fields.filter((f) => f.showInList !== false).slice(0, 8)
  }, [schema])

  const filterFields = useMemo(() => {
    if (!schema?.fields) return []
    return schema.fields
      .filter((f) => f.type === "text" || f.type === "number" || f.type === "select" || f.type === "radio")
      .slice(0, 4)
  }, [schema])

  // 12. 自动推导状态/维度字段与数值指标字段（支撑 StatMetrics、Kanban 与 Chart 区块）
  const statusDimensionField = useMemo(() => {
    const explicitKanban = schema?.blocks?.find((b) => b.type === "kanban" && b.groupByField)?.groupByField
    if (explicitKanban) return explicitKanban
    const explicitChart = schema?.blocks?.find((b) => b.type === "chart" && b.dimensionField)?.dimensionField
    if (explicitChart) return explicitChart
    const found = (schema?.fields || []).find(
      (f) =>
        f.code.includes("status") ||
        f.code.includes("state") ||
        f.code.includes("type") ||
        f.code.includes("category") ||
        f.type === "select",
    )
    return found?.code || "status"
  }, [schema])

  const numericMetricField = useMemo((): CanvasFieldExtended | undefined => {
    const explicitChart = schema?.blocks?.find((b) => b.type === "chart" && b.metricField)?.metricField
    if (explicitChart) {
      const byCode = (schema?.fields || []).find((f) => f.code === explicitChart)
      if (byCode) return byCode
    }
    const found = (schema?.fields || []).find(
      (f) =>
        f.type === "currency" ||
        f.type === "number" ||
        f.code.includes("price") ||
        f.code.includes("amount") ||
        f.code.includes("total") ||
        f.code.includes("count"),
    )
    return found
  }, [schema])

  // 13. 计算顶部 StatMetrics 指标卡数据
  const computedMetrics = useMemo(() => {
    const activeCount = items.filter((r) => {
      const v = r[statusDimensionField]
      return v === 0 || v === 1 || String(v).toLowerCase() === "active" || String(v).toLowerCase() === "success"
    }).length
    const pendingCount = items.filter((r) => {
      const v = r[statusDimensionField]
      return v === 2 || String(v).toLowerCase() === "pending" || String(v).toLowerCase() === "wait"
    }).length

    let metricSum = 0
    if (numericMetricField) {
      for (const r of items) {
        const n = Number(r[numericMetricField.code])
        if (!isNaN(n)) metricSum += n
      }
    }
    const isCents =
      numericMetricField &&
      numericMetricField.type !== "currency" &&
      (numericMetricField.code.includes("price") ||
        numericMetricField.code.includes("amount") ||
        numericMetricField.code.includes("balance"))

    return [
      {
        code: "total",
        label: "总记录规模",
        value: String(total || items.length),
        unit: "条",
        sub: `当前页已载入 ${items.length} 条`,
        tone: "indigo" as const,
      },
      {
        code: "active",
        label: "正常 / 活跃态",
        value: String(activeCount),
        unit: "条",
        sub: items.length > 0 ? `占比 ${Math.round((activeCount / items.length) * 100)}%` : "实时状态统计",
        tone: "emerald" as const,
      },
      {
        code: "pending",
        label: "待处理 / 关注",
        value: String(pendingCount),
        unit: "条",
        sub: `按维度 (${statusDimensionField}) 聚合`,
        tone: "amber" as const,
      },
      {
        code: "metric",
        label: numericMetricField ? `${numericMetricField.label}汇总` : "Schema 契约字段",
        value: numericMetricField
          ? isCents
            ? `¥${(metricSum / 100).toFixed(2)}`
            : String(Math.round(metricSum * 100) / 100)
          : String(schema?.fields.length ?? 0),
        unit: numericMetricField ? "" : "项",
        sub: numericMetricField ? `字段: ${numericMetricField.code}` : "多端同源契约驱动",
        tone: "slate" as const,
      },
    ]
  }, [items, total, statusDimensionField, numericMetricField, schema])

  // 14. 计算看板 (Kanban) & 图表分布数据
  const groupedGroups = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const row of items) {
      const rawKey = row[statusDimensionField]
      const key =
        rawKey === undefined || rawKey === null || rawKey === "" ? "未分类 / 默认" : String(rawKey)
      const list = map.get(key) || []
      list.push(row)
      map.set(key, list)
    }
    if (map.size === 0) {
      return [
        { key: "待处理 (Pending)", rows: [] },
        { key: "进行中 (Active)", rows: [] },
        { key: "已完成 (Done)", rows: [] },
      ]
    }
    return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }))
  }, [items, statusDimensionField])

  // 15. 表单响应式联动上下文 ($form)
  const formEvalContext = useMemo(
    () => ({
      $form: formData,
      form: formData,
      $row: editingItem || formData,
      row: editingItem || formData,
    }),
    [formData, editingItem],
  )

  return (
    <div className={`space-y-4 text-slate-800 ${className}`}>
      {/* Toast 提示浮层 */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* 1. 顶部全息态头卡片 */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              PageBlockDSL v2
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-500 bg-slate-100">
              {entity}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>API: {apiEndpoint}</span>
            <span>•</span>
            <span>契约字段: {schema?.fields.length ?? 0} 个</span>
            <span>•</span>
            <span>多区块 & 表达式联动已就绪</span>
          </p>
        </div>

        {/* 视图切换与快捷操作区 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              表格视图
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              看板视图
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowChartPanel((v) => !v)}
            className={`h-9 px-3 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
              showChartPanel
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <span>图表区块</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectorOpen(true)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition flex items-center gap-1.5"
          >
            <span>契约透视</span>
          </button>
          <button
            type="button"
            onClick={() => loadData(page, pageSize, queryState)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            刷新
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                const defaults: Record<string, any> = {}
                for (const f of schema?.fields || []) {
                  if (f.defaultValue !== undefined) defaults[f.code] = f.defaultValue
                }
                setFormData(defaults)
                setFormOpen(true)
              }}
              className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs flex items-center gap-1.5"
            >
              <span>+ 新增</span>
            </button>
          )}
        </div>
      </div>

      {/* 1.5 区块一：顶部核心指标卡组 (StatMetricsBlock) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {computedMetrics.map((m) => (
          <div
            key={m.code}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{m.label}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  m.tone === "emerald"
                    ? "bg-emerald-500"
                    : m.tone === "amber"
                      ? "bg-amber-500"
                      : m.tone === "indigo"
                        ? "bg-indigo-500"
                        : "bg-slate-400"
                }`}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{m.value}</span>
              {m.unit && <span className="text-xs text-slate-400">{m.unit}</span>}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 1.8 区块二：可折叠可视化分布图表区块 (ChartBlock，对标 PagePlug ECharts) */}
      {showChartPanel && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                维度分布透视图 ({statusDimensionField})
              </h3>
              <p className="text-xs text-slate-400">
                按维度分组实时聚合当前数据集分布占比
              </p>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              ChartBlock • Live Aggregation
            </span>
          </div>
          <div className="space-y-2.5 pt-1">
            {groupedGroups.map((g) => {
              const pct = items.length > 0 ? Math.round((g.rows.length / items.length) * 100) : 0
              return (
                <div key={g.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{g.key}</span>
                    <span className="font-mono text-slate-500">
                      {g.rows.length} 条 ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${Math.max(pct, g.rows.length > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. 动态搜索过滤器栏 */}
      {filterFields.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            {filterFields.map((field) => (
              <div key={field.code} className="flex items-center gap-2 text-xs">
                <label className="text-slate-500 font-medium whitespace-nowrap">{field.label}:</label>
                {field.options && field.options.length > 0 ? (
                  <select
                    value={queryState[field.code] ?? ""}
                    onChange={(e) => setQueryState((prev) => ({ ...prev, [field.code]: e.target.value }))}
                    className="h-8.5 w-44 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="">全部</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={queryState[field.code] ?? ""}
                    onChange={(e) => setQueryState((prev) => ({ ...prev, [field.code]: e.target.value }))}
                    placeholder={field.placeholder || `输入${field.label}...`}
                    className="h-8.5 w-44 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                )}
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="submit"
                className="h-8.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
              >
                查询
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-8.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition"
              >
                重置
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. 主数据区域：支持 Table 表格视图 与 Kanban 状态看板视图切换 */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groupedGroups.map((group) => (
            <div
              key={group.key}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col gap-3 min-h-[260px]"
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-800">{group.key}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white border border-slate-200 text-slate-600">
                  {group.rows.length}
                </span>
              </div>
              {group.rows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-8">
                  暂无该分组卡片
                </div>
              ) : (
                <div className="space-y-2.5">
                  {group.rows.map((row, idx) => (
                    <div
                      key={row.id || idx}
                      className="rounded-xl bg-white border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-md transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                        <span className="truncate">
                          {row.name || row.title || row.no || row.code || `#${row.id || idx + 1}`}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">#{row.id || idx + 1}</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        {displayFields.slice(0, 4).map((f) => (
                          <div key={f.code} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{f.label}:</span>
                            <span className="text-slate-700 font-medium">{formatCellValue(row[f.code], f)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailItem(row)
                            setDetailOpen(true)
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          详情
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(row)
                              setFormData({ ...row })
                              setFormOpen(true)
                            }}
                            className="text-slate-700 hover:underline"
                          >
                            编辑
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center justify-between">
              <span>请求响应异常: {errorMsg}</span>
              <button onClick={() => loadData()} className="underline font-semibold">
                重试
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center text-slate-400">#</th>
                  {displayFields.map((field) => (
                    <th key={field.code} className="py-3 px-4 whitespace-nowrap">
                      {field.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={displayFields.length + 2} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                        <span>正在按契约提取业务数据...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={displayFields.length + 2} className="py-14 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <p className="text-sm font-medium text-slate-600">暂无业务实体数据</p>
                        <p className="text-xs text-slate-400">
                          当前环境数据库无记录，可通过上方【+ 新增】按钮手动创建，或通过 Agent 契约快速造数。
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      {displayFields.map((field) => (
                        <td key={field.code} className="py-3 px-4 text-slate-700">
                          {formatCellValue(row[field.code], field)}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailItem(row)
                              setDetailOpen(true)
                            }}
                            className="px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 font-medium transition text-xs"
                          >
                            详情
                          </button>
                          {!readOnly && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem(row)
                                  setFormData({ ...row })
                                  setFormOpen(true)
                                }}
                                className="px-2 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition text-xs"
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row)}
                                className="px-2 py-1 rounded-md text-rose-600 hover:bg-rose-50 font-medium transition text-xs"
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 4. 底部分页 */}
          <div className="p-3 border-t border-slate-100">
            <Pagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(ps) => {
                setPageSize(ps)
                setPage(1)
              }}
            />
          </div>
        </div>
      )}

      {/* 5. 动态联动表单模态框 (支持 visibleOn / disabledOn / requiredOn 实时求值与 20+ 控件) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? `编辑实体 (${editingItem.id || ""})` : `新增 ${pageTitle}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  支持 Formily / PagePlug 式 &#123;&#123;$form.xxx&#125;&#125; 响应式字段显隐与必填联动
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(schema?.fields || [])
                  .filter((f) => f.showInForm !== false)
                  .map((field) => {
                    const isVisible = field.visibleOn
                      ? evaluateBooleanExpression(field.visibleOn, formEvalContext, true)
                      : true
                    if (!isVisible) return null

                    const isDisabled = field.disabledOn
                      ? evaluateBooleanExpression(field.disabledOn, formEvalContext, false)
                      : false
                    const isRequired = Boolean(
                      field.required ||
                        (field.requiredOn
                          ? evaluateBooleanExpression(field.requiredOn, formEvalContext, false)
                          : false),
                    )
                    const isFullSpan =
                      field.span === 24 ||
                      field.type === "textarea" ||
                      field.type === "richtext" ||
                      field.type === "sub_table" ||
                      field.type === "json"

                    return (
                      <div key={field.code} className={isFullSpan ? "md:col-span-2" : ""}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          {field.label}
                          {isRequired && <span className="text-rose-500 ml-1">*</span>}
                          <span className="text-slate-300 font-mono font-normal ml-1.5 text-[11px]">
                            ({field.code})
                          </span>
                          {field.visibleOn && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono text-[10px]">
                              联动
                            </span>
                          )}
                        </label>

                        {field.type === "textarea" || field.type === "richtext" || field.type === "json" ? (
                          <textarea
                            rows={3}
                            required={isRequired}
                            disabled={isDisabled}
                            placeholder={field.placeholder}
                            value={formData[field.code] ?? ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, [field.code]: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          />
                        ) : field.type === "select" || field.type === "cascader" || field.type === "tree_select" ? (
                          <select
                            required={isRequired}
                            disabled={isDisabled}
                            value={formData[field.code] ?? ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, [field.code]: e.target.value }))}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          >
                            <option value="">请选择{field.label}...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "boolean" || field.type === "switch" ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              disabled={isDisabled}
                              checked={Boolean(formData[field.code])}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.code]: e.target.checked }))
                              }
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                            />
                            <span className="text-xs text-slate-600">
                              {formData[field.code] ? "已开启 (True)" : "已关闭 (False)"}
                            </span>
                          </label>
                        ) : field.type === "rate" ? (
                          <div className="flex items-center gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setFormData((prev) => ({ ...prev, [field.code]: star }))}
                                className={`text-lg leading-none transition ${
                                  Number(formData[field.code] || 0) >= star
                                    ? "text-amber-400"
                                    : "text-slate-200 hover:text-amber-200"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        ) : field.type === "sub_table" ? (
                          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-500">
                                明细子表 ({Array.isArray(formData[field.code]) ? formData[field.code].length : 0} 行)
                              </span>
                              <button
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  const rows = Array.isArray(formData[field.code]) ? [...formData[field.code]] : []
                                  rows.push({})
                                  setFormData((prev) => ({ ...prev, [field.code]: rows }))
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                              >
                                + 添加明细行
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input
                            type={
                              field.type === "number" || field.type === "currency" || field.type === "slider"
                                ? "number"
                                : field.type === "date"
                                  ? "date"
                                  : field.type === "datetime"
                                    ? "datetime-local"
                                    : "text"
                            }
                            required={isRequired}
                            disabled={isDisabled}
                            placeholder={field.placeholder}
                            value={formData[field.code] ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.code]:
                                  field.type === "number" || field.type === "currency" || field.type === "slider"
                                    ? e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                    : e.target.value,
                              }))
                            }
                            className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          />
                        )}
                      </div>
                    )
                  })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="h-9 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium transition shadow-xs"
                >
                  {formSubmitting ? "正在保存..." : "确认保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. 详情查看模态框 */}
      {detailOpen && detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">实体详细属性透视</h3>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {(schema?.fields || []).map((field) => (
                  <div key={field.code} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="text-slate-400 font-mono text-[11px]">
                      {field.label} ({field.code})
                    </div>
                    <div className="mt-1 text-slate-800 font-medium break-all">
                      {formatCellValue(detailItem[field.code], field)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="h-8.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 契约透视抽屉 */}
      {inspectorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-4 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900">Agent 契约与 PageBlockDSL 描述</h3>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">Entity Identifier</span>
                <span className="text-slate-900 font-semibold">{entity}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">API Base Path</span>
                <span className="text-blue-600 font-semibold">{apiEndpoint}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-slate-100 overflow-x-auto rounded-xl">
                <pre>{JSON.stringify(schema, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
