"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { OnlineJeecgConfigurationTabs } from "@/modules/online/frontend/components/online-jeecg-config-tables"
import { OnlineMasterDetailSemanticsEditor } from "@/modules/online/frontend/components/online-master-detail-semantics-editor"
import { OnlineTreeSemanticsEditor } from "@/modules/online/frontend/components/online-tree-semantics-editor"
import type { OnlineDefinitionDetail } from "@/modules/online/backend/application/online-definition.contract"
import { request } from "@/modules/shared/frontend/lib/request"

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
  string: ["TEXT", "TEXTAREA", "SELECT", "DICTIONARY", "REFERENCE"], text: ["TEXT", "TEXTAREA", "SELECT", "DICTIONARY"],
  integer: ["NUMBER", "SELECT", "DICTIONARY", "REFERENCE"], decimal: ["NUMBER", "SELECT", "DICTIONARY"], boolean: ["SWITCH"],
  date: ["DATE"], datetime: ["DATETIME"], json: ["JSON"],
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
      const response = await fetch(`${endpoint}/${detail.code}/codegen/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!response.ok) { const body = await response.json().catch(() => null); setMessageTone("error"); setMessage(body?.error ?? "代码生成失败：当前发布版本可能包含尚未受共享模板支持的配置"); return }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a")
      link.href = url; link.download = `online-${detail.code}-release-${detail.currentRelease?.schemaRevision ?? 0}.zip`; link.click(); URL.revokeObjectURL(url)
      setMessageTone("success"); setMessage("已下载共享 CoolieBase CRUD 模板 ZIP，请审阅后受控注入")
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
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 px-5 py-3"><button type="button" disabled={busy} onClick={() => void saveDraft()} className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50">保存</button>{missingSystemFields && <button type="button" disabled={busy} onClick={() => void normalizeSystemFields()} className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50">补齐</button>}<button type="button" disabled={busy} onClick={() => void runLifecycle("/validate", "模型校验通过")} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700 disabled:opacity-50">校验</button><button type="button" disabled={busy} onClick={() => void runLifecycle("/schema-plans", "计划已生成；请在本页审批并应用 DDL")} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700 disabled:opacity-50">计划</button>{detail.latestSchemaPlan?.status === "REVIEW_REQUIRED" && <button type="button" disabled={busy} onClick={() => void runLifecycle(`/schema-plans/${detail.latestSchemaPlan.id}/approve`, "计划已审批；确认后可应用物理表变更")} className="rounded border border-amber-200 px-3 py-1.5 text-xs text-amber-700 disabled:opacity-50">审批</button>}{detail.latestSchemaPlan?.status === "APPROVED" && <button type="button" disabled={busy} onClick={() => { if (confirm("确认应用已审批的 Schema Plan？这将创建或变更真实数据库物理表。")) void (async () => { setBusy(true); setMessage(""); try { const response = await request.post(`${endpoint}/${detail.code}/schema-plans/${detail.latestSchemaPlan!.id}/apply`, { expectedLockVersion: detail.lockVersion, confirmation: "APPLY_MANAGED_TABLE" }); if (!response.success) { setMessageTone("error"); setMessage(response.error ?? "物理表应用失败"); return }; await loadDetail(); setMessageTone("success"); setMessage("物理表已应用，可发布 Release") } finally { setBusy(false) } })() }} className="rounded border border-rose-200 px-3 py-1.5 text-xs text-rose-700 disabled:opacity-50">应用</button>}{detail.publishedReleaseId && <Link href={`/admin/infra/online-runtime/${encodeURIComponent(detail.code)}`} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700">功能测试</Link>}{detail.publishedReleaseId && <button type="button" disabled={busy} onClick={() => void downloadGeneratedCode()} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-700 disabled:opacity-50">代码</button>}<button type="button" disabled={busy} onClick={() => void publishDraft()} className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">发布</button></div>
      <div className="px-5 py-4 space-y-4">{detail.modelType === "TREE" && <OnlineTreeSemanticsEditor fields={businessFields} tree={interaction.tree} disabled={busy} onChange={(tree) => setInteractionText(JSON.stringify({ ...interaction, tree }))} />}{detail.modelType === "MASTER_DETAIL" && <OnlineMasterDetailSemanticsEditor masterDetail={interaction.masterDetail} disabled={busy} onChange={(masterDetail) => setInteractionText(JSON.stringify({ ...interaction, masterDetail }))} />}<OnlineJeecgConfigurationTabs fields={businessFields} labels={labels} configs={configs} relations={model.relations ?? []} indexes={model.indexes ?? []} settings={interaction.settings ?? {}} disabled={busy} relationFields={relationFields} onAddField={addField} onFieldChange={changeField} onLabelChange={changeLabel} onDefaultChange={changeDefault} onRemoveField={(sourceIndex) => { fieldRowIds.current.splice(sourceIndex, 1); changeFields(fields.filter((_, index) => index !== sourceIndex)) }} onInteractionChange={changeInteraction} onRelationsChange={changeRelations} onIndexesChange={changeIndexes} onSettingsChange={changeSettings} /></div>
    </section>}
    {loading && !detail && <section className="m-5 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">正在加载业务模型设计工作区…</section>}
    {!loading && !detail && loadError && <section className="m-5 rounded-xl border border-rose-200 bg-white p-12 text-center"><p className="text-sm text-rose-700">加载设计工作区失败：{loadError}</p><div className="mt-4 flex justify-center gap-2"><button type="button" onClick={() => void loadDetail()} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">重试</button><Link href="/admin/infra/online-definitions" className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-700">返回列表</Link></div></section>}
  </div></main>
}
