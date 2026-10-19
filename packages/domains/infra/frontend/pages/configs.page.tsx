"use client"

import { useState, useEffect, useCallback } from "react"
import { request, API } from "@/modules/shared/frontend/lib/request"
import { Pagination } from "@/modules/shared/frontend/components/pagination"

type InfraConfig = { id: string; category: string; name: string; configKey: string; value: string; visible: boolean; remark: string | null; createdAt: string }
type PageData = { items: InfraConfig[]; total: number; page: number; pageSize: number }

export default function InfraConfigsPage() {
  const [data, setData] = useState<PageData>({ items: [], total: 0, page: 1, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<InfraConfig | null>(null)

  const loadData = useCallback(async (p = page, ps = pageSize, kw = keyword) => {
    setLoading(true)
    try {
      const res = await request.get(API.CONFIGS, { page: p, pageSize: ps, keyword: kw || undefined })
      if (res.success) setData(res.data)
    } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => {
    loadData(page, pageSize, keyword)
  }, [loadData, page, pageSize])

  const handleDelete = async (config: InfraConfig) => {
    if (!confirm(`确认删除配置「${config.name}」？`)) return
    const res = await request.delete(`${API.CONFIGS}/${config.id}`)
    if (res.success) loadData(page, pageSize, keyword); else alert(res.error)
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    const res = editing
      ? await request.put(`${API.CONFIGS}/${editing.id}`, formData)
      : await request.post(API.CONFIGS, formData)
    if (res.success) { setShowForm(false); loadData(page, pageSize, keyword) } else alert(res.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div><h1 data-testid="config-title" className="text-lg font-semibold text-slate-900">系统配置</h1><p className="mt-0.5 text-sm text-slate-500">管理系统运行参数与配置项</p></div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">新增配置</button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-white p-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索配置名称 / Key"
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />
        <button onClick={() => { setPage(1); loadData(1, pageSize, keyword) }} className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white">查询</button>
        <button onClick={() => { setKeyword(""); setPage(1); loadData(1, pageSize, "") }} className="h-9 rounded-md border px-4 text-sm">重置</button>
        <span className="ml-auto text-xs text-slate-500">
          共 <span className="font-semibold text-slate-900">{data.total}</span> 个配置项
        </span>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500">
            <th className="px-4 py-3">配置名称</th><th className="px-4 py-3">Key</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">分类</th><th className="px-4 py-3 text-right">操作</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="py-8 text-center text-slate-400">加载中...</td></tr>
            : data.items.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-400">暂无数据</td></tr>
            : data.items.map((config) => (
              <tr key={config.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{config.name}</td>
                <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{config.configKey}</code></td>
                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{config.value}</td>
                <td className="px-4 py-3"><span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{config.category}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(config); setShowForm(true) }} className="mr-2 text-blue-600 hover:text-blue-800">编辑</button>
                  <button onClick={() => handleDelete(config)} className="text-red-600 hover:text-red-800">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 通用底部分页控件 */}
      <Pagination
        total={data.total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => {
          setPage(p)
          loadData(p, pageSize, keyword)
        }}
        onPageSizeChange={(ps) => {
          setPageSize(ps)
          setPage(1)
          loadData(1, ps, keyword)
        }}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-base font-semibold">{editing ? "编辑配置" : "新增配置"}</h2>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSubmit({ name: fd.get("name"), configKey: fd.get("configKey"), value: fd.get("value"), category: fd.get("category") || "DEFAULT", remark: fd.get("remark") || undefined }) }} className="space-y-3">
              <div><label className="mb-1 block text-xs text-slate-600">配置名称 *</label><input name="name" required defaultValue={editing?.name ?? ""} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
              <div><label className="mb-1 block text-xs text-slate-600">Key *</label><input name="configKey" required defaultValue={editing?.configKey ?? ""} className="h-9 w-full rounded-md border px-3 text-sm" disabled={Boolean(editing)} /></div>
              <div><label className="mb-1 block text-xs text-slate-600">Value *</label><input name="value" required defaultValue={editing?.value ?? ""} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
              <div><label className="mb-1 block text-xs text-slate-600">分类</label><input name="category" defaultValue={editing?.category ?? "DEFAULT"} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
              <div><label className="mb-1 block text-xs text-slate-600">备注</label><input name="remark" defaultValue={editing?.remark ?? ""} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowForm(false)} className="h-9 rounded-md border px-4 text-sm">取消</button><button type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">确认</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
