"use client"

import { useState } from "react"
import { Puck, Render, type Data } from "@puckeditor/core"
import "@puckeditor/core/puck.css"
import { apiPath, request } from "@/modules/shared/frontend/lib/request"

// === 物料组件定义 ===

const puckConfig: any = {
  components: {
    // 表格组件
    ProTable: {
      label: "数据表格",
      defaultProps: {
        title: "列表页",
        apiEndpoint: "/api/v1/admin/",
        columns: "id,name,status,createdAt",
        showSearch: true,
        showPagination: true,
      },
      fields: {
        title: { type: "text", label: "标题" },
        apiEndpoint: { type: "text", label: "API 端点" },
        columns: { type: "text", label: "列配置（逗号分隔）" },
        showSearch: { type: "radio", label: "显示搜索", options: [{ label: "是", value: true }, { label: "否", value: false }] },
        showPagination: { type: "radio", label: "显示分页", options: [{ label: "是", value: true }, { label: "否", value: false }] },
      },
      render: ({ title, apiEndpoint, columns, showSearch, showPagination }) => (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">API: {apiEndpoint}</p>
          {showSearch && <div className="mt-3 flex gap-2"><div className="h-8 w-48 rounded border bg-slate-50" /><div className="h-8 w-16 rounded bg-slate-900" /></div>}
          <div className="mt-3 rounded border border-dashed p-6 text-center text-xs text-slate-400">表格区域 · 列: {columns}</div>
          {showPagination && <div className="mt-3 flex justify-end gap-1"><div className="h-7 w-16 rounded border" /><div className="h-7 w-16 rounded border" /></div>}
        </div>
      ),
    },

    // 表单组件
    FormPanel: {
      label: "表单面板",
      defaultProps: {
        title: "新增/编辑",
        fields: "name:文本,status:选择,remark:多行",
        submitLabel: "确认",
      },
      fields: {
        title: { type: "text", label: "标题" },
        fields: { type: "textarea", label: "字段配置（name:类型）" },
        submitLabel: { type: "text", label: "提交按钮文字" },
      },
      render: ({ title, fields, submitLabel }) => (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">{title}</h3>
          <div className="space-y-2">
            {(fields as string).split(",").map((f: string, i: number) => {
              const [name, type] = f.split(":")
              return (
                <div key={i}>
                  <label className="mb-0.5 block text-xs text-slate-500">{name}</label>
                  {type === "多行" ? <div className="h-16 w-full rounded border bg-slate-50" /> : <div className="h-8 w-full rounded border bg-slate-50" />}
                </div>
              )
            })}
          </div>
          <button className="mt-3 h-8 rounded bg-blue-600 px-4 text-xs text-white">{submitLabel}</button>
        </div>
      ),
    },

    // 统计卡片
    StatCard: {
      label: "统计卡片",
      defaultProps: { title: "总数", value: "0", color: "blue" },
      fields: {
        title: { type: "text", label: "标题" },
        value: { type: "text", label: "值" },
        color: { type: "select", label: "颜色", options: [{ label: "蓝色", value: "blue" }, { label: "绿色", value: "green" }, { label: "紫色", value: "purple" }, { label: "橙色", value: "orange" }] },
      },
      render: ({ title, value, color }) => {
        const colors: Record<string, string> = { blue: "from-blue-500 to-blue-600", green: "from-green-500 to-green-600", purple: "from-purple-500 to-purple-600", orange: "from-orange-500 to-orange-600" }
        return (
          <div className="rounded-xl border bg-white p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{title}</p>
            <div className={`mt-2 h-1 w-10 rounded bg-gradient-to-r ${colors[color as string] ?? colors.blue}`} />
          </div>
        )
      },
    },

    // 标题区
    PageHeader: {
      label: "页面标题",
      defaultProps: { title: "页面标题", description: "页面描述" },
      fields: {
        title: { type: "text", label: "标题" },
        description: { type: "text", label: "描述" },
      },
      render: ({ title, description }) => (
        <div className="rounded-lg border bg-white p-4">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      ),
    },

    // 空白容器
    Container: {
      label: "容器",
      defaultProps: { padding: "16", background: "white", border: true },
      fields: {
        padding: { type: "select", label: "内边距", options: [{ label: "8px", value: "8" }, { label: "16px", value: "16" }, { label: "24px", value: "24" }] },
        background: { type: "select", label: "背景", options: [{ label: "白色", value: "white" }, { label: "灰色", value: "slate-50" }, { label: "透明", value: "transparent" }] },
        border: { type: "radio", label: "边框", options: [{ label: "有", value: true }, { label: "无", value: false }] },
      },
      render: ({ padding, background, border, puck }) => (
        <div className={`rounded-lg p-[${padding}px] bg-${background} ${border ? "border" : ""}`} style={{ padding: `${padding}px` }}>
          {(puck as any).renderDropZone({ zone: "content" })}
        </div>
      ),
    },

    // 按钮组
    ButtonGroup: {
      label: "操作按钮",
      defaultProps: { buttons: "新增:primary,导出:default,刷新:default" },
      fields: {
        buttons: { type: "text", label: "按钮配置（名称:样式）" },
      },
      render: ({ buttons }) => (
        <div className="flex gap-2">
          {(buttons as string).split(",").map((b: string, i: number) => {
            const [label, style] = b.split(":")
            return <button key={i} className={`h-9 rounded-md px-4 text-sm font-medium ${style === "primary" ? "bg-blue-600 text-white" : "border text-slate-600"}`}>{label}</button>
          })}
        </div>
      ),
    },

    // 标签页
    TabsPanel: {
      label: "标签页",
      defaultProps: { tabs: "基本信息,详细信息,操作日志", activeTab: 0 },
      fields: {
        tabs: { type: "text", label: "标签列表（逗号分隔）" },
        activeTab: { type: "number", label: "默认激活索引" },
      },
      render: ({ tabs, activeTab }) => {
        const tabList = (tabs as string).split(",")
        return (
          <div className="rounded-lg border bg-white">
            <div className="flex border-b">
              {tabList.map((t: string, i: number) => (
                <div key={i} className={`px-4 py-2.5 text-sm font-medium cursor-pointer ${i === (activeTab as number) ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`}>{t.trim()}</div>
              ))}
            </div>
            <div className="p-4 text-sm text-slate-400">标签页内容区域</div>
          </div>
        )
      },
    },

    // 描述列表（详情页用）
    DescriptionList: {
      label: "描述列表",
      defaultProps: { title: "基本信息", items: "名称:张三,手机:138xxxx,邮箱:test@example.com,部门:研发部,状态:启用", columns: 2 },
      fields: {
        title: { type: "text", label: "标题" },
        items: { type: "textarea", label: "项目配置（标签:值）" },
        columns: { type: "select", label: "列数", options: [{ label: "1列", value: 1 }, { label: "2列", value: 2 }, { label: "3列", value: 3 }] },
      },
      render: ({ title, items, columns }) => {
        const itemList = (items as string).split(",").map(i => { const [k, v] = i.split(":"); return { label: k, value: v } })
        return (
          <div className="rounded-lg border bg-white p-4">
            {title && <h3 className="mb-3 text-sm font-semibold">{title as string}</h3>}
            <div className={`grid gap-3 grid-cols-${columns}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {itemList.map((item, i) => (
                <div key={i}>
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{item.value}</dd>
                </div>
              ))}
            </div>
          </div>
        )
      },
    },

    // 图表占位
    ChartPlaceholder: {
      label: "图表",
      defaultProps: { title: "趋势图", chartType: "line", height: 240 },
      fields: {
        title: { type: "text", label: "图表标题" },
        chartType: { type: "select", label: "图表类型", options: [{ label: "折线图", value: "line" }, { label: "柱状图", value: "bar" }, { label: "饼图", value: "pie" }, { label: "面积图", value: "area" }] },
        height: { type: "number", label: "高度(px)" },
      },
      render: ({ title, chartType, height }) => (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">{title as string}</h3>
          <div className="flex items-center justify-center rounded border border-dashed bg-slate-50" style={{ height: `${height}px` }}>
            <span className="text-xs text-slate-400">📊 {chartType === "line" ? "折线图" : chartType === "bar" ? "柱状图" : chartType === "pie" ? "饼图" : "面积图"} · {height}px</span>
          </div>
        </div>
      ),
    },

    // 搜索筛选栏
    SearchBar: {
      label: "搜索栏",
      defaultProps: { fields: "关键词:text,状态:select,日期:date", showReset: true },
      fields: {
        fields: { type: "text", label: "字段配置（名称:类型）" },
        showReset: { type: "radio", label: "显示重置", options: [{ label: "是", value: true }, { label: "否", value: false }] },
      },
      render: ({ fields, showReset }) => (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            {(fields as string).split(",").map((f: string, i: number) => {
              const [label, type] = f.split(":")
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">{label}</span>
                  <div className={`h-8 rounded border bg-slate-50 ${type === "date" ? "w-32" : "w-36"}`} />
                </div>
              )
            })}
            <button className="h-8 rounded-md bg-slate-900 px-3 text-xs text-white">查询</button>
            {showReset && <button className="h-8 rounded-md border px-3 text-xs">重置</button>}
          </div>
        </div>
      ),
    },

    // 步骤条
    Steps: {
      label: "步骤条",
      defaultProps: { steps: "提交申请,审批中,已完成", current: 1 },
      fields: {
        steps: { type: "text", label: "步骤列表（逗号分隔）" },
        current: { type: "number", label: "当前步骤（0开始）" },
      },
      render: ({ steps, current }) => {
        const stepList = (steps as string).split(",")
        return (
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              {stepList.map((s: string, i: number) => (
                <div key={i} className="flex items-center">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i < (current as number) ? "bg-green-500 text-white" : i === (current as number) ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>{i + 1}</div>
                  <span className={`ml-2 text-xs ${i === (current as number) ? "font-medium text-blue-600" : "text-slate-500"}`}>{s.trim()}</span>
                  {i < stepList.length - 1 && <div className="mx-4 h-px w-12 bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>
        )
      },
    },

    // 空状态
    EmptyState: {
      label: "空状态",
      defaultProps: { title: "暂无数据", description: "试试调整筛选条件", icon: "📭" },
      fields: {
        title: { type: "text", label: "标题" },
        description: { type: "text", label: "描述" },
        icon: { type: "text", label: "图标(emoji)" },
      },
      render: ({ title, description, icon }) => (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="text-4xl">{icon as string}</div>
          <p className="mt-3 text-sm font-medium text-slate-700">{title as string}</p>
          <p className="mt-1 text-xs text-slate-400">{description as string}</p>
        </div>
      ),
    },

    // 树形结构
    TreeView: {
      label: "树形列表",
      defaultProps: { title: "组织架构", data: "总公司>研发部,总公司>市场部,总公司>财务部" },
      fields: {
        title: { type: "text", label: "标题" },
        data: { type: "textarea", label: "数据（父>子，逗号分隔）" },
      },
      render: ({ title, data }) => {
        const tree = new Map<string, string[]>()
        ;(data as string).split(",").forEach((pair: string) => {
          const [parent, child] = pair.split(">")
          if (!tree.has(parent)) tree.set(parent, [])
          tree.get(parent)!.push(child)
        })
        return (
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">{title as string}</h3>
            {[...tree.entries()].map(([parent, children]) => (
              <div key={parent} className="mb-2">
                <div className="flex items-center gap-1.5 text-sm font-medium">📁 {parent}</div>
                <div className="ml-5 mt-1 space-y-1 border-l pl-3">
                  {children.map((c, i) => <div key={i} className="text-xs text-slate-600">📄 {c}</div>)}
                </div>
              </div>
            ))}
          </div>
        )
      },
    },
  },
}

// 默认空页面数据
const defaultData: Data = { content: [], root: {} }

// === 主组件 ===

export default function PageBuilderPage() {
  const [mode, setMode] = useState<"edit" | "preview" | "json">("edit")
  const [pageData, setPageData] = useState<Data>(defaultData)
  const [savedPages, setSavedPages] = useState<{ id: string; name: string; data: Data }[]>([])
  const [pageName, setPageName] = useState("未命名页面")

  const handleSave = async () => {
    const dataStr = JSON.stringify(pageData)
    try {
      // 走统一请求层：自动带 token、401 跳登录、错误结构归一（不再自己 fetch+json）
      const res = await request.post<{ id: string }>(apiPath("/api/v1/admin/infra/pages"), {
        name: pageName,
        slug: pageName.toLowerCase().replace(/\s+/g, "-"),
        data: dataStr,
        status: "PUBLISHED",
      })
      if (res.success) {
        alert(`页面「${pageName}」已保存并发布 (ID: ${res.data?.id})`)
      } else {
        alert(`保存失败: ${res.error}`)
      }
    } catch {
      // Fallback to local
      const id = `page-${Date.now()}`
      setSavedPages((prev) => [...prev, { id, name: pageName, data: pageData }])
      alert(`页面「${pageName}」已保存到本地`)
    }
  }

  const handleExportJson = () => {
    const json = JSON.stringify(pageData, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${pageName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <input value={pageName} onChange={(e) => setPageName(e.target.value)} className="h-8 w-48 rounded border px-2 text-sm" />
          <div className="flex rounded-md border">
            {(["edit", "preview", "json"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-xs font-medium ${mode === m ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}>
                {m === "edit" ? "编辑" : m === "preview" ? "预览" : "JSON"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportJson} className="h-8 rounded-md border px-3 text-xs text-slate-600">导出 JSON</button>
          <button onClick={handleSave} className="h-8 rounded-md bg-blue-600 px-4 text-xs font-medium text-white">保存页面</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === "edit" && (
          <Puck
            config={puckConfig}
            data={pageData}
            onPublish={(data) => { setPageData(data); alert("已发布") }}
            onChange={(data) => setPageData(data)}
          />
        )}

        {mode === "preview" && (
          <div className="h-full overflow-auto bg-slate-100 p-6">
            <div className="mx-auto max-w-5xl space-y-4">
              <Render config={puckConfig} data={pageData} />
            </div>
          </div>
        )}

        {mode === "json" && (
          <div className="h-full overflow-auto bg-slate-900 p-4">
            <pre className="text-xs text-slate-100">{JSON.stringify(pageData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
