"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { OnlineJeecgConfigurationTabs } from "@/modules/online/frontend/components/online-jeecg-config-tables"
import { OnlineMasterDetailSemanticsEditor } from "@/modules/online/frontend/components/online-master-detail-semantics-editor"
import { OnlineTreeSemanticsEditor } from "@/modules/online/frontend/components/online-tree-semantics-editor"
import type { OnlineDefinitionDetail } from "@/modules/online/backend/application/online-definition.contract"
import { request } from "@/modules/shared/frontend/lib/request"
import { evaluateBooleanExpression } from "@/modules/shared/frontend/lib/expression-engine"

const endpoint = "/api/v1/admin/online/definitions"
const exampleModel = {
  version: 1,
  storage: { kind: "GENERIC_RECORD" },
  fields: [{ code: "name", type: "string", nullable: false, length: 100, remark: "业务名称" }],
  indexes: [],
  relations: [],
}
const exampleInteraction = {
  version: 1,
  settings: { category: "general", identityStrategy: "PLATFORM_UUID", list: { pagination: true, selection: false, layout: "TABLE" }, form: { layout: "GRID", theme: "DEFAULT", horizontalScroll: false } },
  fields: [{ code: "name", label: "名称", widget: "TEXT", query: { enabled: true, operator: "LIKE" }, visibility: { list: true, form: true, detail: true }, list: { sortable: true, summary: false }, form: { span: 12 }, detail: { formatter: "PLAIN" }, validation: { ruleKeys: [] }, readOnly: false }],
  actions: [],
}

type Field = {
  code: string
  type: string
  nullable: boolean
  length?: number
  precision?: number
  remark?: string
  default?: string | number | boolean | null
  identity?: "PLATFORM_UUID" | "MANUAL"
  systemTemplate?: "CREATED_AUDIT" | "UPDATED_AUDIT"
  systemManaged?: boolean
}
type OnlineIndexInput = { code: string; fields: string[]; unique: boolean }
type OnlineRelationInput = { code: string; type: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE"; sourceField: string; targetDefinitionCode: string; targetField: string; onDelete: "RESTRICT" | "SET_NULL" }
type Model = { version: number; storage: { kind: string }; fields: Field[]; indexes: OnlineIndexInput[]; relations: OnlineRelationInput[] }
type InteractionField = Record<string, any> & { dictionaryCode?: string }
type Interaction = { version: number; settings: Record<string, unknown>; fields: InteractionField[]; actions: unknown[]; tree?: { parentField: string; sortField?: string; rootValue?: string | number | null; childrenIndicator?: boolean }; masterDetail?: { layout?: "ERP" | "INNER" | "TAB"; children: Array<{ code: string; targetDefinitionCode: string; foreignKeyField: string; display: "TABLE" | "TABS" }> } }

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T } catch { return fallback }
}

const widgetsByFieldType: Record<string, readonly string[]> = {
  string: ["TEXT", "TEXTAREA", "SELECT", "RADIO", "TAGS", "CASCADER", "TREE_SELECT", "DICTIONARY", "REFERENCE"],
  text: ["TEXT", "TEXTAREA", "RICHTEXT", "SELECT", "DICTIONARY"],
  integer: ["NUMBER", "RATE", "SLIDER", "SELECT", "DICTIONARY", "REFERENCE"],
  decimal: ["NUMBER", "CURRENCY", "SLIDER", "SELECT", "DICTIONARY"],
  boolean: ["SWITCH", "CHECKBOX"],
  date: ["DATE"],
  datetime: ["DATETIME"],
  json: ["JSON", "SUB_TABLE"],
}

function defaultWidget(field: Field): string {
  return field.type === "boolean" ? "SWITCH" : field.type === "integer" || field.type === "decimal" ? "NUMBER" : field.type === "date" ? "DATE" : field.type === "datetime" ? "DATETIME" : field.type === "json" ? "JSON" : "TEXT"
}

function fieldInteraction(field: Field) {
  return { code: field.code, label: field.code, widget: defaultWidget(field), query: { enabled: false }, visibility: { list: true, form: true, detail: true }, list: { sortable: false, summary: false }, form: { span: 12 }, detail: { formatter: "PLAIN" }, validation: { ruleKeys: [] }, readOnly: false }
}

function normalizeField(field: Field): Field {
  return { ...field, ...(!["string", "text"].includes(field.type) ? { length: undefined } : {}), ...(field.type !== "decimal" ? { precision: undefined } : {}) }
}

function normalizeFieldInteraction(field: Field, value: InteractionField | undefined): InteractionField {
  const defaults = fieldInteraction(field)
  const next: InteractionField = { ...defaults, ...value, code: field.code, query: { ...defaults.query, ...value?.query } }
  const supported = widgetsByFieldType[field.type] ?? [defaults.widget]
  if (!supported.includes(next.widget)) next.widget = defaults.widget
  if (next.query.widget && (!supported.includes(next.query.widget) || next.query.widget === "REFERENCE")) next.query.widget = defaults.widget
  if (![next.widget, next.query.widget].some((widget) => widget === "DICTIONARY" || widget === "SELECT")) delete next.dictionaryCode
  return next
}

export default function OnlineDefinitionDesignerPage({ code }: { code: string }) {
  const [detail, setDetail] = useState<OnlineDefinitionDetail | null>(null)
  const [modelText, setModelText] = useState(() => JSON.stringify(exampleModel, null, 2))
  const [interactionText, setInteractionText] = useState(() => JSON.stringify(exampleInteraction, null, 2))
  const [views, setViews] = useState<NonNullable<OnlineDefinitionDetail["revision"]>["views"]>([])
  const [message, setMessage] = useState("")
  const [messageTone, setMessageTone] = useState<"success" | "error">("success")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [busy, setBusy] = useState(false)
  const [designerTab, setDesignerTab] = useState<"schema" | "canvas">("schema")
  const [viewport, setViewport] = useState<"pc" | "mobile">("pc")
  const [selectedFieldCode, setSelectedFieldCode] = useState<string>("")
  const [previewFormValues, setPreviewFormValues] = useState<Record<string, any>>({})
  const [enabledBlocks, setEnabledBlocks] = useState<string[]>([
    "stat_metrics",
    "chart",
    "banner",
    "grid_nav",
  ])
  const fieldRowIds = useRef<string[]>([])
  const rowIdSequence = useRef(0)
  const createFieldRowId = () => `field-row-${++rowIdSequence.current}`
  const resetFieldRowIds = (count: number) => { fieldRowIds.current = Array.from({ length: count }, createFieldRowId) }

  const model = parseJson<Model>(modelText, exampleModel as Model)
  const interaction = parseJson<Interaction>(interactionText, exampleInteraction as Interaction)
  const fields = Array.isArray(model.fields) ? model.fields : []
  if (fieldRowIds.current.length !== fields.length) resetFieldRowIds(fields.length)
  const businessFields = fields.flatMap((field, sourceIndex) => field.systemManaged ? [] : [{ ...field, sourceIndex, rowId: fieldRowIds.current[sourceIndex] }])
  const configs = useMemo(() => new Map((Array.isArray(interaction.fields) ? interaction.fields : []).map((field) => [field.code as string, field])), [interaction.fields])
  const labels = useMemo(() => new Map((Array.isArray(interaction.fields) ? interaction.fields : []).map((field) => [field.code as string, field.label as string])), [interaction.fields])
  const relationFields = useMemo(() => new Set((model.relations ?? []).map((relation) => relation.sourceField)), [model.relations])
  const missingSystemFields = ["id", "creator", "create_time", "updater", "update_time", "deleted", "tenant_id"].some((fieldCode) => !fields.some((field) => field.code === fieldCode && field.systemManaged))

  const applyDetail = (next: OnlineDefinitionDetail) => {
    const revisionModel = next.revision?.model as { fields?: unknown[] } | undefined
    resetFieldRowIds(Array.isArray(revisionModel?.fields) ? revisionModel.fields.length : exampleModel.fields.length)
    setDetail(next)
    setModelText(JSON.stringify(next.revision?.model ?? exampleModel, null, 2))
    setInteractionText(JSON.stringify(next.revision?.interaction ?? exampleInteraction, null, 2))
    setViews(next.revision?.views ?? [])
  }
  const loadDetail = async () => {
    setLoading(true)
    setLoadError("")
    try {
      const response = await request.get<OnlineDefinitionDetail>(`${endpoint}/${code}`)
      if (!response.success || !response.data) { setLoadError(response.error ?? "Online 定义详情加载失败"); return }
      applyDetail(response.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { setDetail(null); void loadDetail() }, [code])

  const saveDraft = async () => {
    if (!detail) return
    setBusy(true); setMessage("")
    try {
      const draftModel = JSON.parse(modelText) as Model
      const normalizedModel = { ...draftModel, fields: draftModel.fields.map(normalizeField) }
      const draftInteraction = JSON.parse(interactionText) as Interaction
      const interactionByCode = new Map((Array.isArray(draftInteraction.fields) ? draftInteraction.fields : []).map((field) => [field.code, field]))
      const normalizedInteraction = { ...draftInteraction, fields: normalizedModel.fields.map((field) => normalizeFieldInteraction(field, interactionByCode.get(field.code))) }
      const response = await request.put<OnlineDefinitionDetail>(`${endpoint}/${detail.code}/draft`, {
        expectedLockVersion: detail.lockVersion,
        model: normalizedModel,
        interaction: normalizedInteraction,
        views: views.map(({ code: viewCode, kind, puckData, version }) => ({ code: viewCode, kind, puckData, version })),
      })
      if (!response.success || !response.data) {
        if (response.code === "CONFLICT") {
          await loadDetail()
          setMessageTone("error"); setMessage("草稿已被更新，页面已刷新到最新版本；请确认内容后再次保存")
          return
        }
        setMessageTone("error"); setMessage(response.details?.map((detail) => detail.message).join("；") || response.error || "保存失败"); return
      }
      applyDetail(response.data); setMessageTone("success"); setMessage("设计草稿已保存")
    } catch { setMessageTone("error"); setMessage("字段配置格式无效，请检查输入值") } finally { setBusy(false) }
  }
  const runLifecycle = async (path: string, success: string) => {
    if (!detail) return
    setBusy(true); setMessage("")
    try {
      const response = await request.post<OnlineDefinitionDetail>(`${endpoint}/${detail.code}${path}`, { expectedLockVersion: detail.lockVersion })
      if (!response.success) {
        if (response.code === "CONFLICT") {
          await loadDetail()
          setMessageTone("error"); setMessage("操作状态已变化，页面已刷新到最新版本；请确认后重试")
          return
        }
        setMessageTone("error"); setMessage(response.details?.map((item) => item.message).join("；") || response.error || "操作失败"); return
      }
      await loadDetail(); setMessageTone("success"); setMessage(success)
    } finally { setBusy(false) }
  }
  const publishDraft = async () => {
    if (!detail) return
    setBusy(true); setMessage("")
    try {
      const validation = await request.post<OnlineDefinitionDetail>(`${endpoint}/${detail.code}/validate`, { expectedLockVersion: detail.lockVersion })
      if (!validation.success || !validation.data) {
        if (validation.code === "CONFLICT") {
          await loadDetail()
          setMessageTone("error"); setMessage("草稿已被更新，页面已刷新到最新版本；请确认内容后再次发布")
          return
        }
        setMessageTone("error"); setMessage(validation.details?.map((item) => item.message).join("；") || validation.error || "发布前校验失败")
        return
      }
      const response = await request.post<OnlineDefinitionDetail>(`${endpoint}/${detail.code}/publish`, { expectedLockVersion: validation.data.lockVersion })
      if (!response.success) {
        if (response.code === "CONFLICT") {
          await loadDetail()
          setMessageTone("error"); setMessage("发布状态已变化，页面已刷新到最新版本；请确认后重试")
          return
        }
        setMessageTone("error"); setMessage(response.details?.map((item) => item.message).join("；") || response.error || "发布失败")
        return
      }
      await loadDetail(); setMessageTone("success"); setMessage("已发布为不可变 Release")
    } finally { setBusy(false) }
  }
  const downloadGeneratedCode = async () => {
    if (!detail?.publishedReleaseId) return
    setBusy(true); setMessage("")
    try {
      const token = localStorage.getItem("cooliebase_token")
      const response = await fetch(`${endpoint}/${detail.code}/codegen/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })  // request-contract-exempt: 下载生成代码包需要 Response.blob()，统一请求层只解 JSON
      if (!response.ok) { const body = await response.json().catch(() => null); setMessageTone("error"); setMessage(body?.error ?? "代码生成失败：当前发布版本可能包含尚未受共享模板支持的配置"); return }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a")
      link.href = url; link.download = `online-${detail.code}-release-${detail.currentRelease?.schemaRevision ?? 0}.zip`; link.click(); URL.revokeObjectURL(url)
      setMessageTone("success"); setMessage("已下载共享标准 CRUD 模板 ZIP，请审阅后受控注入")
    } finally { setBusy(false) }
  }
  const normalizeSystemFields = () => runLifecycle("/normalize-system-fields", "系统字段已补齐")
  const changeFields = (next: Field[]) => {
    const allowed = new Set(next.map((field) => field.code))
    const previous = new Map((Array.isArray(interaction.fields) ? interaction.fields : []).map((field) => [field.code, field]))
    const indexes = (model.indexes ?? []).map((index) => ({ ...index, fields: index.fields.filter((field) => allowed.has(field)) })).filter((index) => index.fields.length)
    const relations = (model.relations ?? []).filter((relation) => allowed.has(relation.sourceField))
    setModelText(JSON.stringify({ ...model, fields: next, indexes, relations }, null, 2))
    setInteractionText(JSON.stringify({ ...interaction, fields: next.map((field) => normalizeFieldInteraction(field, previous.get(field.code))) }, null, 2))
  }
  const addField = () => {
    fieldRowIds.current.push(createFieldRowId())
    changeFields([...fields, { code: `field_${fields.length + 1}`, type: "string", nullable: true, length: 100 }])
  }
  const changeField = (index: number, patch: Partial<Field>) => {
    const current = fields[index]
    if (!current) return
    const nextField = { ...current, ...patch, ...(patch.type && !["string", "text"].includes(patch.type) ? { length: undefined } : {}), ...(patch.type && patch.type !== "decimal" ? { precision: undefined } : {}) }
    const nextFields = fields.map((field, position) => position === index ? nextField : field)
    const interactions = Array.isArray(interaction.fields) ? interaction.fields : []
    const renamedInteractions = current.code === nextField.code ? interactions : interactions.map((field) => field.code === current.code ? { ...field, code: nextField.code } : field)
    const indexes = (model.indexes ?? []).map((item) => ({ ...item, fields: item.fields.map((field) => field === current.code ? nextField.code : field) }))
    const relations = (model.relations ?? []).map((item) => item.sourceField === current.code ? { ...item, sourceField: nextField.code } : item)
    setModelText(JSON.stringify({ ...model, fields: nextFields, indexes, relations }, null, 2))
    setInteractionText(JSON.stringify({ ...interaction, fields: nextFields.map((field) => normalizeFieldInteraction(field, renamedInteractions.find((item) => item.code === field.code))) }, null, 2))
  }
  const changeLabel = (fieldCode: string, label: string) => setInteractionText(JSON.stringify({ ...interaction, fields: fields.map((field) => field.code === fieldCode ? { ...(configs.get(fieldCode) ?? fieldInteraction(field)), label: label || fieldCode } : configs.get(field.code) ?? fieldInteraction(field)) }, null, 2))
  const changeInteraction = (fieldCode: string, patch: Record<string, any>) => {
    const field = fields.find((item) => item.code === fieldCode)
    if (!field) return
    const current: InteractionField = configs.get(fieldCode) ?? fieldInteraction(field)
    const next: InteractionField = { ...current, ...patch, query: patch.query ? { ...current.query, ...patch.query } : current.query, visibility: patch.visibility ? { ...current.visibility, ...patch.visibility } : current.visibility, list: patch.list ? { ...current.list, ...patch.list } : current.list, form: patch.form ? { ...current.form, ...patch.form } : current.form, validation: patch.validation ? { ...current.validation, ...patch.validation } : current.validation }
    if (![next.widget, next.query?.widget].some((widget) => widget === "DICTIONARY" || widget === "SELECT")) delete next.dictionaryCode
    setInteractionText(JSON.stringify({ ...interaction, fields: fields.map((item) => item.code === fieldCode ? next : configs.get(item.code) ?? fieldInteraction(item)) }, null, 2))
  }
  const changeIndexes = (indexes: OnlineIndexInput[]) => {
    const fieldCodes = new Set(fields.map((field) => field.code))
    const valid = indexes.length <= 64 && new Set(indexes.map((item) => item.code)).size === indexes.length && indexes.every((item) => /^[a-z][a-z0-9_]{1,63}$/.test(item.code) && item.fields.length > 0 && item.fields.length <= 16 && new Set(item.fields).size === item.fields.length && item.fields.every((field) => fieldCodes.has(field)))
    if (!valid) { setMessageTone("error"); setMessage("索引配置无效：编码必须唯一且合法，并引用 1–16 个当前字段"); return }
    setModelText(JSON.stringify({ ...model, indexes }, null, 2))
  }
  const changeRelations = (relations: OnlineRelationInput[]) => setModelText(JSON.stringify({ ...model, relations }, null, 2))
  const changeSettings = (settings: Record<string, unknown>) => setInteractionText(JSON.stringify({ ...interaction, settings }, null, 2))
  const changeDefault = (index: number, value: string | number | boolean | null | undefined) => changeField(index, { default: value })

  return <main className="min-h-full bg-white"><div className="mx-auto max-w-[1500px] pb-6">
    <header className="flex h-12 items-center justify-between border-b border-slate-200 px-5"><h1 className="text-sm font-medium text-slate-900">设计业务模型</h1><Link href="/admin/infra/online-definitions" className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="返回列表">×</Link></header>
    {message && <div role="status" className={`mx-5 mt-4 rounded border px-3 py-2 text-sm ${messageTone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</div>}
    {detail && <section className="bg-white"><div className="grid gap-x-10 gap-y-3 border-b border-slate-200 px-5 py-4 lg:grid-cols-3"><label className="flex items-center gap-3 text-sm text-slate-700"><span className="w-[88px] shrink-0 text-right">表名：</span><input value={detail.code} disabled className="h-8 w-full rounded border border-slate-200 bg-slate-100 px-2 font-mono text-sm text-slate-500" /></label><label className="flex items-center gap-3 text-sm text-slate-700"><span className="w-[88px] shrink-0 text-right">表描述：</span><input value={detail.name} disabled className="h-8 w-full rounded border border-slate-200 bg-slate-100 px-2 text-sm text-slate-500" /></label><label className="flex items-center gap-3 text-sm text-slate-700"><span className="w-[88px] shrink-0 text-right">表类型：</span><input value={detail.modelType === "TREE" ? "树表" : detail.modelType === "MASTER_DETAIL" ? "主子表" : "单表"} disabled className="h-8 w-full rounded border border-slate-200 bg-slate-100 px-2 text-sm text-slate-500" /></label></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            data-agent-target="online-designer:tab-schema"
            onClick={() => setDesignerTab("schema")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              designerTab === "schema" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            1. 表结构与字段配置
          </button>
          <button
            type="button"
            data-agent-target="online-designer:tab-canvas"
            onClick={() => {
              setDesignerTab("canvas")
              if (!selectedFieldCode && businessFields[0]) {
                setSelectedFieldCode(businessFields[0].code)
              }
            }}
            className={`rounded-md px-3 py-1 font-medium transition ${
              designerTab === "canvas" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2. 多端画布与表达式联动 (PC / 小程序双视口)
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={busy} onClick={() => void saveDraft()} className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50">保存</button>{missingSystemFields && <button type="button" disabled={busy} onClick={() => void normalizeSystemFields()} className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50">补齐</button>}<button type="button" disabled={busy} onClick={() => void runLifecycle("/validate", "模型校验通过")} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700 disabled:opacity-50">校验</button><button type="button" disabled={busy} onClick={() => void runLifecycle("/schema-plans", "计划已生成；请在本页审批并应用 DDL")} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700 disabled:opacity-50">计划</button>{detail.latestSchemaPlan?.status === "REVIEW_REQUIRED" && <button type="button" disabled={busy} onClick={() => void runLifecycle(`/schema-plans/${detail.latestSchemaPlan.id}/approve`, "计划已审批；确认后可应用物理表变更")} className="rounded border border-amber-200 px-3 py-1.5 text-xs text-amber-700 disabled:opacity-50">审批</button>}{detail.latestSchemaPlan?.status === "APPROVED" && <button type="button" disabled={busy} onClick={() => { if (confirm("确认应用已审批的 Schema Plan？这将创建或变更真实数据库物理表。")) void (async () => { setBusy(true); setMessage(""); try { const response = await request.post(`${endpoint}/${detail.code}/schema-plans/${detail.latestSchemaPlan!.id}/apply`, { expectedLockVersion: detail.lockVersion, confirmation: "APPLY_MANAGED_TABLE" }); if (!response.success) { setMessageTone("error"); setMessage(response.error ?? "物理表应用失败"); return }; await loadDetail(); setMessageTone("success"); setMessage("物理表已应用，可发布 Release") } finally { setBusy(false) } })() }} className="rounded border border-rose-200 px-3 py-1.5 text-xs text-rose-700 disabled:opacity-50">应用</button>}{detail.publishedReleaseId && <Link href={`/admin/infra/online-runtime/${encodeURIComponent(detail.code)}`} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700">功能测试</Link>}{detail.publishedReleaseId && <button type="button" disabled={busy} onClick={() => void downloadGeneratedCode()} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700 disabled:opacity-50">代码</button>}<button type="button" disabled={busy} onClick={() => void publishDraft()} className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">发布</button></div>
      </div>
      {designerTab === "canvas" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-5 py-4 bg-slate-50/60">
          {/* 左侧：多端区块库与字段大纲 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900">多端同源区块库 (PageBlockDSL v2)</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  { id: "stat_metrics", label: "StatMetrics 指标统计卡", surface: "PC/Mobile" },
                  { id: "chart", label: "Chart 可视化图表区块", surface: "PC" },
                  { id: "kanban", label: "Kanban 状态拖拽看板", surface: "PC" },
                  { id: "banner", label: "Banner 移动端轮播图", surface: "Mobile/小程序" },
                  { id: "grid_nav", label: "GridNav 金刚区宫格导航", surface: "Mobile/小程序" },
                  { id: "product_waterfall", label: "Waterfall 双列商品瀑布流", surface: "Mobile/小程序" },
                ].map((blk) => {
                  const active = enabledBlocks.includes(blk.id)
                  return (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() =>
                        setEnabledBlocks((prev) =>
                          prev.includes(blk.id) ? prev.filter((x) => x !== blk.id) : [...prev, blk.id],
                        )
                      }
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                        active
                          ? "border-indigo-300 bg-indigo-50/70 text-indigo-900 font-medium"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>{blk.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {blk.surface}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900">业务字段树 (点击配置联动)</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {businessFields.map((f) => {
                  const cfg = configs.get(f.code)
                  const isSel = (selectedFieldCode || businessFields[0]?.code) === f.code
                  return (
                    <button
                      key={f.code}
                      type="button"
                      onClick={() => setSelectedFieldCode(f.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                        isSel ? "bg-slate-900 text-white font-medium" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>
                        {labels.get(f.code) || f.code}{" "}
                        <span className="opacity-60 font-mono text-[10px]">({f.code})</span>
                      </span>
                      {cfg?.visibleOn && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500 text-white">联动</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 中间：PC 1440px / 手机小程序 375px 双视口实时交互预览画布 */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-xs font-bold text-slate-800">
                实时交互预览画布 ({viewport === "pc" ? "PC 管理端 1440px" : "微信小程序 / Expo 手机端 375px"})
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewport("pc")}
                  className={`px-3 py-1 rounded-md font-medium ${
                    viewport === "pc" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  💻 PC 宽屏视口
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={`px-3 py-1 rounded-md font-medium ${
                    viewport === "mobile" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600"
                  }`}
                >
                  📱 手机 / 小程序 (375px)
                </button>
              </div>
            </div>

            {viewport === "mobile" ? (
              <div className="mx-auto w-[375px] rounded-[32px] border-[6px] border-slate-900 bg-slate-50 shadow-xl overflow-hidden">
                {/* 微信小程序胶囊状态栏 */}
                <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold">{detail.name || detail.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/25 text-[11px] font-mono">••• | ◎</span>
                </div>
                <div className="p-3.5 space-y-3 max-h-[540px] overflow-y-auto">
                  {enabledBlocks.includes("banner") && (
                    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
                      <div className="text-[10px] font-mono uppercase opacity-80">MINI-PROGRAM / EXPO BANNER</div>
                      <div className="text-sm font-bold mt-1">{detail.name} · 移动端多端同源专区</div>
                      <div className="text-[11px] opacity-90 mt-0.5">后台改一次 Schema，PC / 小程序 / App 同步生效</div>
                    </div>
                  )}
                  {enabledBlocks.includes("grid_nav") && (
                    <div className="grid grid-cols-4 gap-2 rounded-xl bg-white p-3 text-center border border-slate-100">
                      {["核心登记", "进度查询", "移动审批", "数据看板"].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="mx-auto w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">{item}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-xl bg-white p-3.5 border border-slate-100 space-y-3">
                    <div className="text-xs font-bold text-slate-800">移动端动态联动表单预览</div>
                    {businessFields.map((f) => {
                      const cfg = configs.get(f.code) ?? {}
                      const isVis = cfg.visibleOn
                        ? evaluateBooleanExpression(cfg.visibleOn, { $form: previewFormValues }, true)
                        : true
                      if (!isVis) return null
                      return (
                        <div key={f.code} className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                            <span>{labels.get(f.code) || f.code}</span>
                            {cfg.visibleOn && (
                              <span className="text-[10px] font-mono text-indigo-600">已触发联动显示</span>
                            )}
                          </label>
                          <input
                            value={previewFormValues[f.code] ?? ""}
                            onChange={(e) =>
                              setPreviewFormValues((prev) => ({ ...prev, [f.code]: e.target.value }))
                            }
                            placeholder={`输入 ${labels.get(f.code) || f.code}...`}
                            className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                {enabledBlocks.includes("stat_metrics") && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "总记录规模", val: "1,284", tone: "text-indigo-600" },
                      { label: "活跃/正常态", val: "96.4%", tone: "text-emerald-600" },
                      { label: "字段契约数", val: String(businessFields.length), tone: "text-slate-900" },
                    ].map((m, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="text-[11px] text-slate-500">{m.label}</div>
                        <div className={`text-lg font-bold font-mono mt-1 ${m.tone}`}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                )}
                {enabledBlocks.includes("chart") && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 space-y-2">
                    <div className="text-xs font-bold text-slate-700">ChartBlock · 实时趋势分布图</div>
                    <div className="h-2 rounded-full bg-indigo-500 w-4/5" />
                    <div className="h-2 rounded-full bg-emerald-500 w-3/5" />
                  </div>
                )}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-bold text-slate-800">
                    PC 端响应式联动表单试运行 (输入值实时测试 &#123;&#123;$form.xxx&#125;&#125; 显隐)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {businessFields.map((f) => {
                      const cfg = configs.get(f.code) ?? {}
                      const isVis = cfg.visibleOn
                        ? evaluateBooleanExpression(cfg.visibleOn, { $form: previewFormValues }, true)
                        : true
                      if (!isVis) return null
                      const isDis = cfg.disabledOn
                        ? evaluateBooleanExpression(cfg.disabledOn, { $form: previewFormValues }, false)
                        : false
                      return (
                        <div key={f.code} className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <span>{labels.get(f.code) || f.code}</span>
                            <span className="text-[10px] font-mono text-slate-400">({cfg.widget || "TEXT"})</span>
                          </label>
                          <input
                            disabled={isDis}
                            value={previewFormValues[f.code] ?? ""}
                            onChange={(e) =>
                              setPreviewFormValues((prev) => ({ ...prev, [f.code]: e.target.value }))
                            }
                            placeholder={`测试输入 ${f.code} 的值...`}
                            className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs disabled:bg-slate-100"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：PagePlug / Formily 响应式表达式配置器 */}
          <div className="lg:col-span-3 space-y-4">
            {(() => {
              const targetCode = selectedFieldCode || businessFields[0]?.code || ""
              const currentCfg = (targetCode ? configs.get(targetCode) : undefined) ?? {}
              return (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-900">
                    字段属性与 &#123;&#123;表达式&#125;&#125; 联动 ({targetCode || "未选择"})
                  </div>
                  {targetCode ? (
                    <div className="space-y-3 text-xs">
                      <label className="block space-y-1">
                        <span className="text-slate-600 font-medium">显示标题 (Label)</span>
                        <input
                          value={labels.get(targetCode) || targetCode}
                          onChange={(e) => changeLabel(targetCode, e.target.value)}
                          className="w-full h-8 rounded border border-slate-200 px-2 text-xs"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-slate-600 font-medium">
                          动态显隐表达式 (visibleOn)
                        </span>
                        <input
                          value={currentCfg.visibleOn ?? ""}
                          onChange={(e) => changeInteraction(targetCode, { visibleOn: e.target.value })}
                          placeholder="如: {{ $form.name === 'VIP' }}"
                          className="w-full h-8 rounded border border-indigo-200 bg-indigo-50/30 px-2 font-mono text-xs"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-slate-600 font-medium">
                          动态禁用表达式 (disabledOn)
                        </span>
                        <input
                          value={currentCfg.disabledOn ?? ""}
                          onChange={(e) => changeInteraction(targetCode, { disabledOn: e.target.value })}
                          placeholder="如: {{ $form.status === 'LOCKED' }}"
                          className="w-full h-8 rounded border border-slate-200 px-2 font-mono text-xs"
                        />
                      </label>
                      <div className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-200 space-y-1">
                        <div className="text-indigo-300">// 实时沙箱求值预览 ($form)</div>
                        <div>{JSON.stringify(previewFormValues)}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">请先添加或选择业务字段</p>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">{detail.modelType === "TREE" && <OnlineTreeSemanticsEditor fields={businessFields} tree={interaction.tree} disabled={busy} onChange={(tree) => setInteractionText(JSON.stringify({ ...interaction, tree }))} />}{detail.modelType === "MASTER_DETAIL" && <OnlineMasterDetailSemanticsEditor masterDetail={interaction.masterDetail} disabled={busy} onChange={(masterDetail) => setInteractionText(JSON.stringify({ ...interaction, masterDetail }))} />}<OnlineJeecgConfigurationTabs fields={businessFields} labels={labels} configs={configs} relations={model.relations ?? []} indexes={model.indexes ?? []} settings={interaction.settings ?? {}} disabled={busy} relationFields={relationFields} onAddField={addField} onFieldChange={changeField} onLabelChange={changeLabel} onDefaultChange={changeDefault} onRemoveField={(sourceIndex) => { fieldRowIds.current.splice(sourceIndex, 1); changeFields(fields.filter((_, index) => index !== sourceIndex)) }} onInteractionChange={changeInteraction} onRelationsChange={changeRelations} onIndexesChange={changeIndexes} onSettingsChange={changeSettings} /></div>
      )}
    </section>}
    {loading && !detail && <section className="m-5 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">正在加载业务模型设计工作区…</section>}
    {!loading && !detail && loadError && <section className="m-5 rounded-xl border border-rose-200 bg-white p-12 text-center"><p className="text-sm text-rose-700">加载设计工作区失败：{loadError}</p><div className="mt-4 flex justify-center gap-2"><button type="button" onClick={() => void loadDetail()} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">重试</button><Link href="/admin/infra/online-definitions" className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-700">返回列表</Link></div></section>}
  </div></main>
}
