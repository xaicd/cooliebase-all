/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/modules/shared/frontend/components/ui/button"
import { Card } from "@/modules/shared/frontend/components/ui/card"
import { Input } from "@/modules/shared/frontend/components/ui/input"
import { Label } from "@/modules/shared/frontend/components/ui/label"
import { Textarea } from "@/modules/shared/frontend/components/ui/textarea"
import { apiPath, request } from "@/modules/shared/frontend/lib/request"

type TemplateCategory = "CRUD" | "TREE" | "SINGLETON" | "WORKFLOW" | "DOMAIN" | "FOUNDATION"
type TemplateType = "BACKEND" | "FRONTEND" | "API" | "SQL"
type TemplateEngine = "handlebars" | "mustache" | "ejs" | "json-template"
type TemplateStatus = "ACTIVE" | "DISABLED"

type TemplateRecord = {
  id: string
  code: string
  name: string
  category: TemplateCategory
  templateType: TemplateType
  engine: TemplateEngine
  content: string
  status: TemplateStatus
  description?: string
  options?: Record<string, unknown>
  updatedAt: string
}

type TemplateOptionsMeta = {
  stack?: string
  filePath?: string
  layer?: string
  bundleTemplateCodes?: string[]
}

type ExportMode = "stack-all" | "selected-only" | "service-pattern-pack"

type TemplateListResponse = {
  items: TemplateRecord[]
  total: number
  page: number
  pageSize: number
}

type TemplatePreviewResponse = {
  templateCode: string
  renderedContent: string
  engine: TemplateEngine
  category: TemplateCategory
  templateType: TemplateType
}

type TemplateScaffoldFile = {
  templateCode: string
  path: string
  content: string
  engine: TemplateEngine
  category: TemplateCategory
  templateType: TemplateType
}

type TemplateScaffoldResponse = {
  stack: string
  generatedAt: string
  files: TemplateScaffoldFile[]
}

const CATEGORY_OPTIONS: TemplateCategory[] = ["CRUD", "TREE", "SINGLETON", "WORKFLOW", "DOMAIN", "FOUNDATION"]
const TEMPLATE_TYPE_OPTIONS: TemplateType[] = ["BACKEND", "FRONTEND", "API", "SQL"]
const ENGINE_OPTIONS: TemplateEngine[] = ["handlebars", "mustache", "ejs", "json-template"]
const STATUS_OPTIONS: TemplateStatus[] = ["ACTIVE", "DISABLED"]

function createDraft(): TemplateRecord {
  return {
    id: "",
    code: "",
    name: "",
    category: "CRUD",
    templateType: "BACKEND",
    engine: "handlebars",
    content: "export function {{name}}() {\n  return \"{{code}}\"\n}",
    status: "ACTIVE",
    description: "",
    options: {},
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 兼容旧调用点的薄封装 —— **实现走统一请求层**（不再自己 fetch + 判 success）。
 * 保留签名是为了不动十几个调用点；这里要消灭的是"另一套请求逻辑"本身。
 */
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = ((init?.method as string) || "GET").toUpperCase() as "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
  const payload = await request<T>({ url, method, data: body })
  if (!payload?.success) {
    throw new Error(payload?.error ?? "请求失败")
  }
  return payload.data as T
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function InfraTemplateEnginePage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [form, setForm] = useState<TemplateRecord>(createDraft())
  const [keyword, setKeyword] = useState("")
  const [optionsText, setOptionsText] = useState("{}")
  const [previewVariablesText, setPreviewVariablesText] = useState('{"name":"cooliebase","code":"demo-template"}')
  const [previewResult, setPreviewResult] = useState("")
  const [scaffoldResult, setScaffoldResult] = useState<TemplateScaffoldResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportMode, setExportMode] = useState<ExportMode>("stack-all")
  const [message, setMessage] = useState<string | null>(null)

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? null,
    [selectedId, templates],
  )
  const selectedOptions = (selectedTemplate?.options ?? {}) as TemplateOptionsMeta

  const loadTemplates = async (nextKeyword = keyword) => {
    setLoading(true)
    setMessage(null)
    try {
      const search = new URLSearchParams({ page: "1", pageSize: "50" })
      if (nextKeyword.trim()) search.set("keyword", nextKeyword.trim())
      const data = await requestJson<TemplateListResponse>(
        `/api/admin/infra/codegen?${search.toString()}`,
      )
      setTemplates(data.items)
      if (data.items.length > 0 && !selectedId) {
        const first = data.items[0]
        setSelectedId(first.id)
        setForm(first)
        setOptionsText(JSON.stringify(first.options ?? {}, null, 2))
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "模板列表加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedTemplate) return
    setForm(selectedTemplate)
    setOptionsText(JSON.stringify(selectedTemplate.options ?? {}, null, 2))
    setPreviewResult("")
  }, [selectedTemplate])

  useEffect(() => {
    if (templates.length === 0) {
      if (selectedId) setSelectedId("")
      return
    }

    const selectedExists = templates.some((item) => item.id === selectedId)
    if (selectedExists) return

    const first = templates[0]
    setSelectedId(first.id)
    setForm(first)
    setOptionsText(JSON.stringify(first.options ?? {}, null, 2))
    setPreviewResult("")
  }, [selectedId, templates])

  const updateField = <K extends keyof TemplateRecord>(key: K, value: TemplateRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const resolveTemplateCodesForExport = () => {
    if (exportMode === "service-pattern-pack") {
      return ["next-react-admin-service-pattern-pack"]
    }

    if (exportMode === "selected-only") {
      return form.code.trim() ? [form.code.trim()] : []
    }

    const stack = String(selectedOptions.stack ?? "next-react")
    return templates
      .filter((item) => String(item.options?.stack ?? "next-react") === stack)
      .map((item) => item.code)
  }

  const handleSelect = (item: TemplateRecord) => {
    setSelectedId(item.id)
    setForm(item)
    setOptionsText(JSON.stringify(item.options ?? {}, null, 2))
    setPreviewResult("")
    setScaffoldResult(null)
  }

  const handleNew = () => {
    const draft = createDraft()
    setSelectedId("")
    setForm(draft)
    setOptionsText("{}")
    setPreviewResult("")
    setScaffoldResult(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const parsedOptions = optionsText.trim() ? JSON.parse(optionsText) : undefined
      const saved = await requestJson<TemplateRecord>("/api/admin/infra/codegen", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          options: parsedOptions,
        }),
      })
      setMessage(`已保存模板 ${saved.code}`)
      await loadTemplates(keyword)
      setSelectedId(saved.id)
      setForm(saved)
      setOptionsText(JSON.stringify(saved.options ?? {}, null, 2))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    setPreviewing(true)
    setMessage(null)
    try {
      const variables = previewVariablesText.trim() ? JSON.parse(previewVariablesText) : {}
      const data = await requestJson<TemplatePreviewResponse>("/api/admin/infra/codegen", {
        method: "POST",
        body: JSON.stringify({
          templateCode: form.code,
          variables,
        }),
      })
      setPreviewResult(data.renderedContent)
      setMessage(`预览完成：${data.templateCode}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "预览失败")
    } finally {
      setPreviewing(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const variables = previewVariablesText.trim() ? JSON.parse(previewVariablesText) : {}
      const templateCodes = resolveTemplateCodesForExport()
      if (templateCodes.length === 0) {
        throw new Error("当前导出模式下没有可导出的模板")
      }
      const data = await requestJson<TemplateScaffoldResponse>("/api/admin/infra/codegen/export", {
        method: "POST",
        body: JSON.stringify({
          stack: String(selectedOptions.stack ?? "next-react"),
          templateCodes,
          includeDisabled: false,
          format: "json",
          variables,
        }),
      })
      setScaffoldResult(data)
      setMessage(`已生成 ${data.files.length} 个文件`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败")
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadZip = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const variables = previewVariablesText.trim() ? JSON.parse(previewVariablesText) : {}
      const templateCodes = resolveTemplateCodesForExport()
      if (templateCodes.length === 0) {
        throw new Error("当前导出模式下没有可导出的模板")
      }
      const response = await fetch(apiPath("/api/admin/infra/codegen/export"), {  // request-contract-exempt: 导出 ZIP 需要 Response.blob()（另一处 requestJson 已改走统一层）
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stack: String(selectedOptions.stack ?? "next-react"),
          templateCodes,
          includeDisabled: false,
          format: "zip",
          variables,
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? "ZIP 下载失败")
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${String(selectedOptions.stack ?? "next-react")}-template.zip`
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage(`已下载 ${String(selectedOptions.stack ?? "next-react")} 模板 ZIP`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ZIP 下载失败")
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = () => {
    if (!scaffoldResult) return
    const blob = new Blob([JSON.stringify(scaffoldResult, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `next-react-template-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">模板引擎</h1>
            <p className="mt-1 text-sm text-slate-500">管理 Next/React 模板包、变量预览与统一代码生成配置。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => void loadTemplates()} disabled={loading}>
              {loading ? "刷新中..." : "刷新列表"}
            </Button>
            <Button onClick={handleNew}>新建模板</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按编码、名称、分类搜索"
            className="sm:max-w-sm"
          />
          <Button variant="outline" onClick={() => void loadTemplates(keyword)}>
            查询
          </Button>
        </div>

        {message ? <p className="mt-4 text-sm text-primary-700">{message}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">默认方案</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Next.js + React + App Router</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">模板风格</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">薄层路由 + Service + Validator</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">默认输出</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">api / service / validator / page / client / types</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="overflow-hidden border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">模板列表</h2>
              <span className="text-xs text-slate-500">{templates.length} 条</span>
            </div>
          </div>
          <div className="max-h-[72vh] overflow-y-auto p-2">
            {templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                暂无模板，先创建一个模板骨架。
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((item) => {
                  const active = item.id === selectedId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-primary-300 bg-primary-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.code}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.category}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.templateType}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.engine}</span>
                        {item.options?.stack ? (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-primary-700">{String(item.options.stack)}</span>
                        ) : null}
                      </div>
                      {item.options?.filePath ? (
                        <p className="mt-2 truncate text-[11px] text-slate-400">{String(item.options.filePath)}</p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-slate-400">{formatTime(item.updatedAt)}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-code">模板编码</Label>
                <Input
                  id="template-code"
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value)}
                  placeholder="user-service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-name">模板名称</Label>
                <Input
                  id="template-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="用户服务模板"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">模板分类</Label>
                <select
                  id="template-category"
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value as TemplateCategory)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary-400"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">模板类型</Label>
                <select
                  id="template-type"
                  value={form.templateType}
                  onChange={(event) => updateField("templateType", event.target.value as TemplateType)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary-400"
                >
                  {TEMPLATE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-engine">渲染引擎</Label>
                <select
                  id="template-engine"
                  value={form.engine}
                  onChange={(event) => updateField("engine", event.target.value as TemplateEngine)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary-400"
                >
                  {ENGINE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-status">状态</Label>
                <select
                  id="template-status"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as TemplateStatus)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary-400"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="template-desc">描述</Label>
              <Input
                id="template-desc"
                value={form.description ?? ""}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="说明这个模板适用的业务场景"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">目标栈</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedOptions.stack ?? "custom"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">文件路径</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{selectedOptions.filePath ?? "未配置"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
                <p className="text-xs font-medium text-slate-500">导出模式</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExportMode("stack-all")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      exportMode === "stack-all"
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    全栈模板包
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportMode("selected-only")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      exportMode === "selected-only"
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    当前模板
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportMode("service-pattern-pack")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      exportMode === "service-pattern-pack"
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    Service 设计模式四件套
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {exportMode === "stack-all" ? "导出当前 stack 下全部模板" : null}
                  {exportMode === "selected-only" ? "仅导出当前选中的模板" : null}
                  {exportMode === "service-pattern-pack" ? "通过组合包一键展开 Facade/Strategy/Guard/Test" : null}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="template-content">模板内容</Label>
              <Textarea
                id="template-content"
                value={form.content}
                onChange={(event) => updateField("content", event.target.value)}
                rows={14}
                className="font-mono text-sm"
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="template-options">选项 JSON</Label>
              <Textarea
                id="template-options"
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "保存中..." : "保存模板"}
              </Button>
              <Button variant="outline" onClick={() => void handlePreview()} disabled={previewing}>
                {previewing ? "预览中..." : "生成预览"}
              </Button>
              <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
                {exporting ? "导出中..." : "导出模板包"}
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={!scaffoldResult}>
                下载 JSON
              </Button>
              <Button variant="outline" onClick={() => void handleDownloadZip()} disabled={exporting}>
                下载 ZIP
              </Button>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">预览变量</h3>
                <span className="text-xs text-slate-500">JSON 对象</span>
              </div>
              <Textarea
                value={previewVariablesText}
                onChange={(event) => setPreviewVariablesText(event.target.value)}
                rows={10}
                className="mt-3 font-mono text-sm"
              />
            </Card>

            <Card className="border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">渲染结果</h3>
                <span className="text-xs text-slate-500">{form.engine}</span>
              </div>
              <pre className="mt-3 max-h-[360px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {previewResult || "点击生成预览查看模板渲染结果"}
              </pre>
            </Card>
          </div>

          <Card className="border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">导出文件清单</h3>
                <p className="mt-1 text-xs text-slate-500">按当前 stack 渲染出的多文件模板包</p>
              </div>
              <span className="text-xs text-slate-500">{scaffoldResult?.files.length ?? 0} 个文件</span>
            </div>
            <div className="mt-3 space-y-2">
              {scaffoldResult?.files?.length ? (
                scaffoldResult.files.map((file) => (
                  <div key={`${file.templateCode}:${file.path}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{file.path}</p>
                      <span className="text-[11px] text-slate-500">{file.templateCode}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {file.category} · {file.templateType} · {file.engine}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  点击“导出模板包”后，这里会显示多文件结果。
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}