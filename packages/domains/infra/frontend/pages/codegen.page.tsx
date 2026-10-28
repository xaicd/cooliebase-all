"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { API, request } from "@/modules/shared/frontend/lib/request"
import { Pagination } from "@/modules/shared/frontend/components/pagination"

type CodegenColumn = { name: string; comment?: string; type: string; uiComponent: "INPUT" | "TEXTAREA" | "NUMBER" | "SELECT" | "RADIO" | "CHECKBOX" | "SWITCH" | "DATE" | "DATETIME" | "UPLOAD" | "RICH_TEXT" | "TREE_SELECT" | "HIDDEN"; nullable: boolean; listShow: boolean; formShow: boolean; queryShow: boolean; queryType: "=" | "!=" | "LIKE" | "BETWEEN" | ">" | ">=" | "<" | "<=" | "IN"; dictType: string | null; formValidation: string | null }
type CodegenTable = { id: string; tableName: string; tableComment: string; moduleName: string; businessName: string; className: string; template: string; scene: string; permissionPrefix?: string | null; parentMenuId?: string | null; columns?: CodegenColumn[]; createdAt: string; updatedAt: string }
type MenuTreeNode = { id: string; name: string; type: string; parentId: string | null; children?: MenuTreeNode[] }
type DbTable = { id: string; name: string; comment?: string; fieldCount: number; source: "ONLINE" | "DATABASE"; physical: boolean; storageKind: "GENERIC_RECORD" | "MANAGED_TABLE" | null; online: { definitionCode: string; definitionName: string; releaseId: string; releaseNo: number; schemaRevision: number } | null }
type ImportCandidate = { source: "DATABASE"; tableName: string } | { source: "ONLINE"; definitionCode: string; releaseId: string }
type DbTablePage = { items: DbTable[]; total: number; page: number; pageSize: number; sourceMode: { mode: string; description: string } }
type PageData = { items: CodegenTable[]; total: number; page: number; pageSize: number }
type PreviewFile = { path: string; type: string; content: string }
type Mode = "list" | "import"
const candidateFor = (table: DbTable): ImportCandidate => table.source === "ONLINE" ? { source: "ONLINE", definitionCode: table.online!.definitionCode, releaseId: table.online!.releaseId } : { source: "DATABASE", tableName: table.name }
function findMenuNode(id: string, nodes: MenuTreeNode[]): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findMenuNode(id, node.children)
      if (found) return found
    }
  }
  return null
}

function deduceModuleFromMenuId(id: string, tree: MenuTreeNode[]): string | null {
  const node = findMenuNode(id, tree)
  if (!node) return null
  if (node.id.includes("-")) {
    const candidate = node.id.split("-")[0]
    if (["aigw", "system", "infra", "bpm", "pay", "mall", "member", "crm", "erp", "wms", "mes", "ai", "iot", "im"].includes(candidate)) {
      return candidate
    }
  }
  if ((node as any).permission?.includes(":")) return (node as any).permission.split(":")[0]
  if ((node as any).path) {
    const parts = (node as any).path.replace(/^\//, "").split("/")
    if (parts[0] === "admin" && parts[1]) return parts[1]
    if (parts[0]) return parts[0]
  }
  return null
}

const formatDate = (value: string) => new Date(value).toLocaleDateString("zh-CN")

function MenuOption({ node, depth }: { node: MenuTreeNode; depth: number }) {
  const indent = "\u00A0\u00A0".repeat(depth)
  const prefix = depth > 0 ? "└─ " : ""
  return <>
    <option value={node.id}>{indent}{prefix}{node.name}{node.type === "DIR" ? " 📁" : ""}</option>
    {node.children?.map(child => <MenuOption key={child.id} node={child} depth={depth + 1} />)}
  </>
}

export default function InfraCodegenPage() {
  const [mode, setMode] = useState<Mode>("list"), [data, setData] = useState<PageData>({ items: [], total: 0, page: 1, pageSize: 20 }), [keyword, setKeyword] = useState(""), [page, setPage] = useState(1), [loading, setLoading] = useState(false), [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dbTables, setDbTables] = useState<DbTable[]>([]), [sourceMode, setSourceMode] = useState({ mode: "unknown", description: "" }), [selectedTables, setSelectedTables] = useState<Record<string, ImportCandidate>>({}), [importing, setImporting] = useState(false), [importKeyword, setImportKeyword] = useState(""), [importSource, setImportSource] = useState<"ALL" | "ONLINE" | "DATABASE">("ALL"), [importPage, setImportPage] = useState(1), [importTotal, setImportTotal] = useState(0)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[] | null>(null), [previewActive, setPreviewActive] = useState(0), [previewTitle, setPreviewTitle] = useState(""), [configTable, setConfigTable] = useState<CodegenTable | null>(null), [configSaving, setConfigSaving] = useState(false)
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([])
  const loadList = useCallback(async () => { setLoading(true); try { const res = await request.get<PageData>(API.CODEGEN, { page, pageSize: 20, keyword: keyword || undefined }); if (res.success && res.data) setData(res.data) } finally { setLoading(false) } }, [page, keyword])
  const loadDbTables = async (nextPage = importPage, nextKeyword = importKeyword, nextSource = importSource) => { const res = await request.get<DbTablePage>(`${API.CODEGEN}/tables`, { page: nextPage, pageSize: 20, keyword: nextKeyword || undefined, source: nextSource }); if (res.success && res.data) { setDbTables(res.data.items); setSourceMode(res.data.sourceMode); setImportTotal(res.data.total); setImportPage(res.data.page) } }
  useEffect(() => { void loadList() }, [loadList])
  const openImport = () => { setMode("import"); void loadDbTables(1) }
  const toggleCandidate = (table: DbTable, checked: boolean) => setSelectedTables(current => { const next = { ...current }; if (checked) next[table.id] = candidateFor(table); else delete next[table.id]; return next })
  const handleImport = async () => { const candidates = Object.values(selectedTables); if (!candidates.length) return alert("请选择要导入的表"); setImporting(true); try { const res = await request.post<{ imported: { tableName: string }[]; skipped: string[] }>(`${API.CODEGEN}/import`, { candidates }); if (res.success && res.data) { alert(`导入成功：${res.data.imported.length} 张表${res.data.skipped.length ? `；跳过 ${res.data.skipped.length} 张` : ""}`); setSelectedTables({}); setMode("list"); void loadList() } else alert(res.error ?? "导入失败") } finally { setImporting(false) } }
  const showPreview = (files: PreviewFile[], title: string) => { setPreviewFiles(files); setPreviewActive(0); setPreviewTitle(title) }
  const handlePreview = async (table: CodegenTable) => { const res = await request.post<PreviewFile[]>(`${API.CODEGEN}/preview`, { tableId: table.id }); if (res.success && res.data) showPreview(res.data, `${table.businessName} · 代码预览`); else alert(res.error ?? "代码预览失败") }
  const download = async (path: string, name: string) => { const token = localStorage.getItem("cooliebase_token"), res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); if (!res.ok) return alert("下载失败，请确认拥有生成权限"); const url = URL.createObjectURL(await res.blob()), link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url) }  // request-contract-exempt: 下载生成的 ZIP 需要 Response.blob()，统一请求层只解 JSON
  const openConfig = async (table: CodegenTable) => { const [res, menuRes] = await Promise.all([request.get<CodegenTable>(`${API.CODEGEN}/${table.id}`), request.get<MenuTreeNode[]>("/api/v1/admin/system/menus?mode=tree")]); if (res.success && res.data?.columns) setConfigTable(res.data); else return alert(res.error ?? "字段配置加载失败"); if (menuRes.success && menuRes.data) setMenuTree(menuRes.data) }
  const patchColumn = (index: number, patch: Partial<CodegenColumn>) => setConfigTable(current => current?.columns ? { ...current, columns: current.columns.map((column, position) => position === index ? { ...column, ...patch } : column) } : current)
  const saveConfig = async () => { if (!configTable?.columns) return; setConfigSaving(true); try { const res = await request.put<CodegenTable>(`${API.CODEGEN}/${configTable.id}`, { moduleName: configTable.moduleName, businessName: configTable.businessName, className: configTable.className, permissionPrefix: configTable.permissionPrefix || null, parentMenuId: configTable.parentMenuId || null, columns: configTable.columns.map(({ name, uiComponent, listShow, formShow, queryShow, queryType, dictType, formValidation }) => ({ name, uiComponent, listShow, formShow, queryShow, queryType, dictType, formValidation })) }); if (!res.success) return alert(res.error ?? "字段配置保存失败"); setConfigTable(null); void loadList() } finally { setConfigSaving(false) } }
  const deleteTables = async (tables: CodegenTable[]) => { if (!tables.length || !confirm(`确认删除 ${tables.length} 个代码生成配置？`)) return; const res = await request.delete(`${API.CODEGEN}?ids=${tables.map(item => item.id).join(",")}`); if (res.success) { setSelectedIds([]); void loadList() } else alert(res.error ?? "删除失败") }
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize)), allSelected = data.items.length > 0 && data.items.every(item => selectedIds.includes(item.id))
  return <main className="min-h-full bg-slate-50 p-4 lg:p-6"><div className="mx-auto max-w-[1500px] space-y-4"><header className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-semibold text-blue-600">COOLIEBASE CODEGEN · IMPORTED TABLES</div><h1 className="mt-1 text-xl font-semibold text-slate-900">代码生成</h1><p className="mt-1 text-sm text-slate-500">用于已接入表的字段配置、预览和 ZIP 下载。新业务请在业务建模完成设计、同步、发布与代码下载；已发布 Online 模型仍可在导入页接入传统模板。</p></div><div className="flex gap-2"><Link href="/admin/infra/online-definitions" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">建模</Link><button onClick={openImport} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">导入</button></div></div></header>
    {mode === "list" && <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-end gap-3 border-b p-4"><label className="grid gap-1 text-sm text-slate-600"><span>表名 / 描述 / 实体</span><input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => event.key === "Enter" && void loadList()} placeholder="例如：system_user" className="h-9 w-64 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"/></label><button onClick={() => { setPage(1); void loadList() }} className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">查询</button><button onClick={() => { setKeyword(""); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-4 text-sm text-slate-700">重置</button><span className="ml-auto text-xs text-slate-500">共 {data.total} 张已接入表</span></div><div className="flex items-center justify-between border-b px-4 py-3"><div><span className="text-sm font-medium text-slate-800">生成配置</span><span className="ml-2 text-xs text-slate-500">配置影响预览和下载 ZIP。</span></div><div className="flex gap-2"><button disabled={!selectedIds.length} onClick={() => void deleteTables(data.items.filter(item => selectedIds.includes(item.id)))} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 disabled:opacity-40">删除</button><button onClick={openImport} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">导入</button></div></div>{loading ? <div className="p-12 text-center text-sm text-slate-400">加载中…</div> : !data.items.length ? <div className="grid gap-4 p-10 text-center"><div><p className="text-base font-medium text-slate-700">还没有生成配置</p><p className="mt-2 text-sm text-slate-500">请导入已有数据库表；新业务模型请进入业务建模。</p></div><div className="flex justify-center gap-2"><button onClick={openImport} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">导入</button><Link href="/admin/infra/online-definitions" className="rounded-lg border px-4 py-2 text-sm text-slate-700">建模</Link></div></div> : <><div className="overflow-x-auto"><table className="min-w-[1040px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="w-12 px-4 py-3"><input aria-label="全选" type="checkbox" checked={allSelected} onChange={event => setSelectedIds(event.target.checked ? data.items.map(item => item.id) : [])}/></th><th className="px-4 py-3">表名 / 说明</th><th className="px-4 py-3">模块</th><th className="px-4 py-3">实体</th><th className="px-4 py-3">模板</th><th className="px-4 py-3">更新时间</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>{data.items.map(item => <tr key={item.id} className="border-t border-slate-100 hover:bg-blue-50/40"><td className="px-4 py-4"><input aria-label={`选择 ${item.tableName}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))}/></td><td className="px-4 py-4"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{item.tableName}</code><p className="mt-1 text-xs text-slate-500">{item.tableComment}</p></td><td className="px-4 py-4"><span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{item.moduleName}</span></td><td className="px-4 py-4 font-medium text-slate-800">{item.className}</td><td className="px-4 py-4 text-xs text-slate-600">{item.template}</td><td className="px-4 py-4 text-xs text-slate-500">{formatDate(item.updatedAt)}</td><td className="px-4 py-4 text-right whitespace-nowrap"><button onClick={() => void openConfig(item)} className="mr-3 text-slate-700">配置</button><button onClick={() => void handlePreview(item)} className="mr-3 text-blue-700">预览</button><button onClick={() => void download(`${API.CODEGEN}/${item.id}/download`, `codegen-${item.className}.zip`)} className="mr-3 text-emerald-700">下载</button><button onClick={() => void deleteTables([item])} className="text-rose-600">删除</button></td></tr>)}</tbody></table></div>          <Pagination
            total={data.total}
            page={page}
            pageSize={20}
            onPageChange={(p) => {
              setPage(p)
              void loadList()
            }}
          />
        </>}
      </section>}
      {mode === "import" && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">导入表</h2>
              <p className="mt-1 text-xs text-slate-500">
                {sourceMode.description || "选择现有数据库表或已发布 Online 模型"}；Online 模型会保留其发布快照来源。
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode("list")} className="rounded-lg border px-3 py-2 text-sm text-slate-700">
                返回
              </button>
              <button
                onClick={() => void handleImport()}
                disabled={importing || !Object.keys(selectedTables).length}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                导入
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 border-b p-4">
            <label className="grid gap-1 text-sm text-slate-600">
              <span>表名 / 说明</span>
              <input
                value={importKeyword}
                onChange={(event) => setImportKeyword(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void loadDbTables(1)}
                className="h-9 w-64 rounded-lg border px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>来源</span>
              <select
                value={importSource}
                onChange={(event) => {
                  const source = event.target.value as typeof importSource
                  setImportSource(source)
                  void loadDbTables(1, importKeyword, source)
                }}
                className="h-9 rounded-lg border bg-white px-3 text-sm"
              >
                <option value="ALL">全部</option>
                <option value="ONLINE">Online</option>
                <option value="DATABASE">数据库</option>
              </select>
            </label>
            <button onClick={() => void loadDbTables(1)} className="h-9 rounded-lg bg-slate-900 px-4 text-sm text-white">
              查询
            </button>
            <button
              onClick={() => {
                setImportKeyword("")
                setImportSource("ALL")
                void loadDbTables(1, "", "ALL")
              }}
              className="h-9 rounded-lg border px-4 text-sm text-slate-700"
            >
              重置
            </button>
            <span className="ml-auto text-xs text-slate-500">
              已选 {Object.keys(selectedTables).length} 张 · 共 {importTotal} 张
            </span>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      aria-label="全选当前页"
                      type="checkbox"
                      checked={dbTables.length > 0 && dbTables.every((item) => Boolean(selectedTables[item.id]))}
                      onChange={(event) =>
                        setSelectedTables((current) => {
                          const next = { ...current }
                          for (const item of dbTables) event.target.checked ? (next[item.id] = candidateFor(item)) : delete next[item.id]
                          return next
                        })
                      }
                    />
                  </th>
                  <th className="px-4 py-3">表名</th>
                  <th className="px-4 py-3">说明</th>
                  <th className="px-4 py-3">来源</th>
                  <th className="px-4 py-3">字段</th>
                </tr>
              </thead>
              <tbody>
                {dbTables.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t hover:bg-blue-50/40 ${item.source === "ONLINE" ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        aria-label={`选择 ${item.name}`}
                        type="checkbox"
                        checked={Boolean(selectedTables[item.id])}
                        onChange={(event) => toggleCandidate(item, event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs">{item.name}</code>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.comment || item.online?.definitionName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.source === "ONLINE" ? (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                          Online · R{item.online!.releaseNo} ·{" "}
                          {item.storageKind === "GENERIC_RECORD"
                            ? "虚拟表"
                            : item.physical
                            ? "实体表"
                            : "托管表"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">数据库</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.fieldCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={importTotal}
            page={importPage}
            pageSize={20}
            onPageChange={(p) => void loadDbTables(p)}
          />
        </section>
      )}
    {configTable?.columns && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl"><div className="flex justify-between border-b px-5 py-4"><div><h2 className="font-semibold">生成配置 · {configTable.tableName}</h2><p className="mt-1 text-xs text-slate-500">字段配置影响预览和下载 ZIP。</p></div><button onClick={() => setConfigTable(null)} className="rounded border px-3 py-1.5 text-xs">关闭</button></div><div className="grid gap-3 border-b p-4 md:grid-cols-5"><label className="text-xs">模块<input value={configTable.moduleName} onChange={event => setConfigTable({ ...configTable, moduleName: event.target.value })} className="mt-1 h-8 w-full rounded border px-2 text-sm"/></label><label className="text-xs">功能说明<input value={configTable.businessName} onChange={event => setConfigTable({ ...configTable, businessName: event.target.value })} className="mt-1 h-8 w-full rounded border px-2 text-sm"/></label><label className="text-xs">实体类名<input value={configTable.className} onChange={event => setConfigTable({ ...configTable, className: event.target.value })} className="mt-1 h-8 w-full rounded border px-2 text-sm"/></label><label className="text-xs">权限前缀<input value={configTable.permissionPrefix ?? ""} onChange={event => setConfigTable({ ...configTable, permissionPrefix: event.target.value })} className="mt-1 h-8 w-full rounded border px-2 font-mono text-sm"/></label><label className="text-xs">上级菜单<select value={configTable.parentMenuId ?? ""} onChange={event => {
  const parentId = event.target.value || null
  const deduced = parentId ? deduceModuleFromMenuId(parentId, menuTree) : null
  const nextModule = deduced || configTable.moduleName
  const kebab = configTable.className ? configTable.className.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase() : ""
  setConfigTable({
    ...configTable,
    parentMenuId: parentId,
    ...(deduced ? { moduleName: deduced } : {}),
    ...(kebab && deduced ? { permissionPrefix: `${deduced}:${kebab}` } : {})
  })
}} className="mt-1 h-8 w-full rounded border px-2 text-sm"><option value="">顶层（自动按模块归入）</option>{menuTree.map(node => <MenuOption key={node.id} node={node} depth={0} />)}</select></label></div><div className="overflow-auto p-4"><table className="min-w-[1000px] w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="p-2">字段</th><th className="p-2">类型</th><th className="p-2">控件</th><th className="p-2">列表</th><th className="p-2">表单</th><th className="p-2">查询</th><th className="p-2">查询方式</th><th className="p-2">字典</th><th className="p-2">校验</th></tr></thead><tbody>{configTable.columns.map((column, index) => <tr key={column.name} className="border-t"><td className="p-2 font-mono">{column.name}<span className="ml-1 text-slate-400">{column.comment}</span></td><td className="p-2">{column.type}</td><td className="p-2"><select value={column.uiComponent} onChange={event => patchColumn(index, { uiComponent: event.target.value as CodegenColumn["uiComponent"] })} className="h-7 rounded border px-1">{["INPUT", "TEXTAREA", "NUMBER", "SELECT", "RADIO", "CHECKBOX", "SWITCH", "DATE", "DATETIME", "UPLOAD", "RICH_TEXT", "TREE_SELECT", "HIDDEN"].map(value => <option key={value}>{value}</option>)}</select></td>{(["listShow", "formShow", "queryShow"] as const).map(key => <td key={key} className="p-2 text-center"><input type="checkbox" checked={column[key]} onChange={event => patchColumn(index, { [key]: event.target.checked })}/></td>)}<td className="p-2"><select disabled={!column.queryShow} value={column.queryType} onChange={event => patchColumn(index, { queryType: event.target.value as CodegenColumn["queryType"] })} className="h-7 rounded border px-1">{["=", "!=", "LIKE", "BETWEEN", ">", ">=", "<", "<=", "IN"].map(value => <option key={value}>{value}</option>)}</select></td><td className="p-2"><input value={column.dictType ?? ""} onChange={event => patchColumn(index, { dictType: event.target.value || null })} className="h-7 w-28 rounded border px-1"/></td><td className="p-2"><select value={column.formValidation ?? ""} onChange={event => patchColumn(index, { formValidation: event.target.value === "required" ? "required" : null })} className="h-7 rounded border px-1"><option value="">无</option><option value="required">必填</option></select></td></tr>)}</tbody></table></div><div className="flex justify-end gap-2 border-t p-4"><button onClick={() => setConfigTable(null)} className="rounded border px-4 py-2 text-sm">取消</button><button disabled={configSaving} onClick={() => void saveConfig()} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">保存</button></div></div></div>}
    {previewFiles && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" className="flex h-full max-h-[85vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-base font-semibold">代码预览 · {previewTitle}</h2><p className="mt-1 text-xs text-slate-500">{previewFiles.length} 个文件；请下载 ZIP 后审阅。</p></div><button onClick={() => setPreviewFiles(null)} className="rounded border px-3 py-1.5 text-xs">关闭</button></div><div className="flex min-h-0 flex-1"><aside className="w-64 shrink-0 overflow-y-auto border-r bg-slate-50 p-3">{previewFiles.map((file, index) => <button key={file.path} onClick={() => setPreviewActive(index)} className={`mb-1 block w-full rounded px-3 py-2 text-left text-xs ${previewActive === index ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-white"}`}><span className="rounded bg-white px-1 py-0.5 text-[10px]">{file.type}</span><span className="mt-1 block truncate">{file.path.split("/").pop()}</span></button>)}</aside><section className="min-w-0 flex-1 overflow-auto p-4"><div className="mb-3 flex justify-between gap-3"><code className="truncate text-xs text-slate-500">{previewFiles[previewActive]?.path}</code><button onClick={() => void navigator.clipboard.writeText(previewFiles[previewActive]?.content ?? "")} className="rounded border px-3 py-1 text-xs">复制</button></div><pre className="min-h-full overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100"><code>{previewFiles[previewActive]?.content}</code></pre></section></div></div></div>}
  </div></main>
}
