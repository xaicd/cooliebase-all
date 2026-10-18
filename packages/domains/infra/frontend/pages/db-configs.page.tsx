"use client"

import { useCallback, useEffect, useState } from "react"
import { dataSourceConfigApi, type DataSourceConfig, type DataSourceConfigPage, type DataSourceConfigPayload } from "@/modules/infra/frontend/api/data-source-config.api"
import { request } from "@/modules/shared/frontend/lib/request"

const driverOptions = ["postgresql", "mysql", "mariadb", "tidb", "oceanbase", "opengauss", "gaussdb", "kingbase"]
const emptyPage: DataSourceConfigPage = { items: [], total: 0, page: 1, pageSize: 20 }
type Tenant = { id: string; tenantCode: string; name: string; status: string }

export default function InfraDbConfigsModulePage() {
  const [data, setData] = useState<DataSourceConfigPage>(emptyPage)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [tenantId, setTenantId] = useState("")
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<DataSourceConfig | null | undefined>(undefined)
  const [testing, setTesting] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!tenantId) { setData(emptyPage); return }
    setLoading(true); setError("")
    const response = await dataSourceConfigApi.page({ tenantId, page, pageSize: 20, keyword: keyword || undefined })
    if (response.success && response.data) setData(response.data); else setError(response.error || "数据源配置加载失败")
    setLoading(false)
  }, [page, keyword, tenantId])
  useEffect(() => { void request.get<{ items: Tenant[] }>("/api/v1/admin/system/tenants", { page: 1, pageSize: 100, status: "ACTIVE" }).then((response) => { if (response.success && response.data) { setTenants(response.data.items); setTenantId((current) => current || response.data!.items[0]?.id || "") } }) }, [])
  useEffect(() => { void loadData() }, [loadData])

  async function remove(item: DataSourceConfig) {
    if (item.isMaster || !confirm(`确认删除数据源「${item.name}」？`)) return
    const response = await dataSourceConfigApi.remove(item.id, item.tenantId!)
    if (response.success) loadData(); else alert(response.error || "删除失败")
  }
  async function test(item: DataSourceConfig) {
    if (item.isMaster) return
    setTesting(item.id)
    const response = await dataSourceConfigApi.test({ id: item.id, tenantId: item.tenantId! })
    setTesting(null)
    alert(response.success ? `连接成功，耗时 ${response.data?.latencyMs ?? 0} ms` : response.error || "连接失败")
  }
  async function submit(form: DataSourceConfigPayload) {
    const response = editing ? await dataSourceConfigApi.update(editing.id, form) : await dataSourceConfigApi.create(form as Required<DataSourceConfigPayload>)
    if (response.success) { setEditing(undefined); loadData() } else alert(response.error || "保存失败")
  }
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return <div className="space-y-4">
    <div className="flex items-center justify-between rounded-lg border bg-white p-4"><div><h1 className="text-lg font-semibold">数据源配置</h1><p className="mt-1 text-xs text-slate-500">系统主数据源仅供平台管理员查看；自定义数据源必须归属一个租户，AUTO报表仅可读取当前租户的数据源。</p></div><button disabled={!tenantId} onClick={() => setEditing(null)} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50">新增数据源</button></div>
    <div className="rounded-lg border bg-white p-4"><div className="flex items-center gap-3"><select value={tenantId} onChange={(event) => { setTenantId(event.target.value); setPage(1) }} className="h-9 rounded-md border px-3 text-sm"><option value="">请选择归属租户</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} · {tenant.tenantCode}</option>)}</select><input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (setPage(1), loadData())} placeholder="名称 / 类型 / 地址" className="h-9 w-64 rounded-md border px-3 text-sm" /><button disabled={!tenantId} onClick={() => { setPage(1); loadData() }} className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white disabled:opacity-50">查询</button><button onClick={() => { setKeyword(""); setPage(1) }} className="h-9 rounded-md border px-4 text-sm">重置</button></div>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</div>
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="px-4 py-3">名称</th><th className="px-4 py-3">类型</th><th className="px-4 py-3">数据源连接</th><th className="px-4 py-3">用户名</th><th className="px-4 py-3">创建时间</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-12 text-center text-slate-400">加载中...</td></tr> : data.items.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-slate-400">当前租户暂无自定义数据源</td></tr> : data.items.map((item) => <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50"><td className="px-4 py-3 font-medium">{item.name}{item.isMaster && <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">主数据源</span>}</td><td className="px-4 py-3 text-slate-600">{item.driver}</td><td className="max-w-xs truncate px-4 py-3 text-slate-600" title={item.url}>{item.url}</td><td className="px-4 py-3 text-slate-600">{item.username}</td><td className="px-4 py-3 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td><td className="whitespace-nowrap px-4 py-3 text-right">{!item.isMaster && <><button onClick={() => test(item)} disabled={testing === item.id} className="mr-3 text-slate-700 disabled:opacity-50">{testing === item.id ? "测试中" : "测试连接"}</button><button onClick={() => setEditing(item)} className="mr-3 text-blue-600">编辑</button><button onClick={() => remove(item)} className="text-red-600">删除</button></>}</td></tr>)}</tbody></table>{totalPages > 1 && <div className="flex justify-between border-t px-4 py-3 text-xs"><span>第 {page}/{totalPages} 页，共 {data.total} 条</span><div className="space-x-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-50">上一页</button><button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-50">下一页</button></div></div>}</div>
    {editing !== undefined && <DataSourceForm initial={editing} tenantId={tenantId} onClose={() => setEditing(undefined)} onSubmit={submit} />}
  </div>
}

function DataSourceForm({ initial, tenantId, onClose, onSubmit }: { initial: DataSourceConfig | null; tenantId: string; onClose: () => void; onSubmit: (data: DataSourceConfigPayload) => void }) {
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  async function formData(form: HTMLFormElement): Promise<DataSourceConfigPayload> { const values = new FormData(form); return { tenantId, name: String(values.get("name") || ""), driver: String(values.get("driver") || ""), url: String(values.get("url") || ""), username: String(values.get("username") || ""), password: String(values.get("password") || "") || undefined, remark: String(values.get("remark") || "") || undefined } }
  async function testDraft(form: HTMLFormElement) { const payload = await formData(form); if (!payload.password) return alert("测试草稿连接时必须输入密码"); setTesting(true); const response = await dataSourceConfigApi.test(payload); setTesting(false); alert(response.success ? `连接成功，耗时 ${response.data?.latencyMs ?? 0} ms` : response.error || "连接失败") }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"><h2 className="mb-4 text-base font-semibold">{initial ? "编辑数据源" : "新增数据源"}</h2><form onSubmit={async (event) => { event.preventDefault(); setSaving(true); await onSubmit(await formData(event.currentTarget)); setSaving(false) }} className="space-y-3"><div className="grid grid-cols-2 gap-3"><Field label="数据源名称 *"><input name="name" required defaultValue={initial?.name ?? ""} className="input" /></Field><Field label="数据库类型 *"><select name="driver" defaultValue={initial?.driver ?? "postgresql"} className="input">{driverOptions.map((driver) => <option key={driver}>{driver}</option>)}</select></Field></div><Field label="数据源连接 *"><input name="url" type="url" required defaultValue={initial?.url ?? ""} placeholder="postgresql://127.0.0.1:5432/cooliebase" className="input" /></Field><Field label="用户名 *"><input name="username" required defaultValue={initial?.username ?? ""} className="input" /></Field><Field label={initial ? "密码（留空则保留原密码）" : "密码 *"}><input name="password" type="password" required={!initial} autoComplete="new-password" className="input" /></Field><Field label="备注"><input name="remark" defaultValue={initial?.remark ?? ""} className="input" /></Field><p className="text-xs text-slate-500">连接地址不得携带用户名或密码；密码仅加密保存，后续不会回显。</p><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={(event) => testDraft(event.currentTarget.form!)} disabled={testing} className="h-9 rounded-md border px-4 text-sm disabled:opacity-50">{testing ? "测试中..." : "测试连接"}</button><button type="button" onClick={onClose} className="h-9 rounded-md border px-4 text-sm">取消</button><button disabled={saving} type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white disabled:opacity-50">{saving ? "保存中..." : "确认"}</button></div></form></div></div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-xs text-slate-600">{label}</span>{children}</label> }
