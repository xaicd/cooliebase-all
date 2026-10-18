"use client"

import { useState, useEffect, useCallback } from "react"
import { request, API } from "@/modules/shared/frontend/lib/request"

type MenuNode = {
  id: string
  name: string
  type: string // DIR | MENU | BUTTON
  permission: string | null
  path: string | null
  component: string | null
  icon: string | null
  sort: number
  status: string
  visible: boolean
  parentId: string | null
  children: MenuNode[]
}

const typeLabel = (t: string) => t === "DIR" ? "目录" : t === "MENU" ? "菜单" : "按钮"
const typeColor = (t: string) => t === "DIR" ? "bg-blue-50 text-blue-700" : t === "MENU" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"

// Flatten tree to rows while keeping level info for rendering
type FlatRow = { node: MenuNode; level: number; hasChildren: boolean; parentIds: string[] }

function flattenTree(nodes: MenuNode[], expandedIds: Set<string>, level = 0, parentIds: string[] = []): FlatRow[] {
  const rows: FlatRow[] = []
  for (const node of nodes) {
    const hasChildren = (node.children?.length ?? 0) > 0
    rows.push({ node, level, hasChildren, parentIds })
    if (hasChildren && expandedIds.has(node.id)) {
      rows.push(...flattenTree(node.children, expandedIds, level + 1, [...parentIds, node.id]))
    }
  }
  return rows
}

// Get all IDs in tree
function getAllIds(nodes: MenuNode[]): string[] {
  const ids: string[] = []
  const collect = (ns: MenuNode[]) => ns.forEach(n => { ids.push(n.id); if (n.children?.length) collect(n.children) })
  collect(nodes)
  return ids
}

export default function SystemMenusPage() {
  return <SystemMenusPageContent key="cooliebase-menu-data-v2" />
}

function SystemMenusPageContent() {
  const [tree, setTree] = useState<MenuNode[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MenuNode | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [allExpanded, setAllExpanded] = useState(false)
  const [keyword, setKeyword] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await request.get<MenuNode[]>(API.MENUS)
      if (!res.success) {
        setTree([])
        setLoadError(res.error || "菜单数据加载失败")
        return
      }

      const data = res.data ?? []
      setTree(data)
      // Default: expand top-level (DIR) nodes
      const topIds = data.filter((n) => n.type === "DIR").map((n) => n.id)
      setExpandedIds(new Set(topIds))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (menu: MenuNode) => {
    if (!confirm(`确认删除菜单「${menu.name}」？`)) return
    const res = await request.delete(`${API.MENUS}/${menu.id}`)
    if (res.success) loadData(); else alert(res.error || "删除失败")
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    const res = editing
      ? await request.put(`${API.MENUS}/${editing.id}`, formData)
      : await request.post(API.MENUS, formData)
    if (res.success) { setShowForm(false); loadData() } else alert(res.error || "操作失败")
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(getAllIds(tree)))
    }
    setAllExpanded(!allExpanded)
  }

  const handleCreate = (parentId?: string) => {
    setEditing(null)
    setDefaultParentId(parentId)
    setShowForm(true)
  }

  // Flatten for table rendering
  const flatRows = flattenTree(tree, expandedIds)
  const allRows = flattenTree(tree, new Set(getAllIds(tree)))
  const blockedParentIds = new Set(editing
    ? allRows.filter((row) => row.node.id === editing.id || row.parentIds.includes(editing.id)).map((row) => row.node.id)
    : [])
  const parentCandidates = allRows
    .filter((row) => row.node.type !== "BUTTON" && !blockedParentIds.has(row.node.id))
    .map((row) => ({ id: row.node.id, name: row.node.name, level: row.level }))

  // Filter by keyword if set
  const filteredRows = keyword
    ? flatRows.filter(r => r.node.name.toLowerCase().includes(keyword.toLowerCase()) || (r.node.permission ?? "").toLowerCase().includes(keyword.toLowerCase()))
    : flatRows

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">菜单管理</h1>
          <p className="mt-0.5 text-sm text-slate-500">管理系统菜单、权限码与路由配置</p>
        </div>
        <button onClick={() => handleCreate()} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">新增菜单</button>
      </div>

      {/* 搜索栏 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="菜单名称 / 权限码"
            className="h-9 w-64 rounded-md border px-3 text-sm"
          />
          <button onClick={() => { setKeyword(""); loadData() }} className="h-9 rounded-md border px-4 text-sm text-slate-500">重置</button>
          <button onClick={loadData} className="h-9 rounded-md border px-4 text-sm text-slate-600">刷新数据</button>
          <button
            onClick={toggleExpandAll}
            className="h-9 rounded-md border px-4 text-sm text-slate-600"
          >
            {allExpanded ? "全部折叠" : "全部展开"}
          </button>
          <span className="ml-auto text-xs text-slate-400">{filteredRows.length} 条</span>
        </div>
      </div>

      {/* 菜单树表格 */}
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3 w-72">菜单名称</th>
              <th className="px-4 py-3 w-20">类型</th>
              <th className="px-4 py-3 w-16">排序</th>
              <th className="px-4 py-3">权限码</th>
              <th className="px-4 py-3 w-20">状态</th>
              <th className="px-4 py-3 text-right w-40">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">加载中...</td></tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm text-red-600">菜单加载失败：{loadError}</p>
                  <button onClick={loadData} className="mt-2 text-xs text-blue-600 hover:text-blue-800">重新加载</button>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">暂无数据</td></tr>
            ) : (
              filteredRows.map(({ node, level, hasChildren }) => (
                <tr key={node.id} className="border-b last:border-0 hover:bg-slate-50">
                  {/* 名称 + 缩进 + 展开 */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
                      {hasChildren ? (
                        <button
                          onClick={() => toggleExpand(node.id)}
                          className="mr-1.5 flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
                        >
                          {expandedIds.has(node.id) ? "▼" : "▶"}
                        </button>
                      ) : (
                        <span className="mr-1.5 w-4" />
                      )}
                      <span className="mr-2 inline-flex items-center text-slate-400">
                        {node.type === "DIR" ? (
                          <svg className="h-4 w-4 text-blue-600 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        ) : node.type === "MENU" ? (
                          <svg className="h-4 w-4 text-slate-500 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 text-amber-500 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                        )}
                      </span>
                      <span className={`font-medium ${node.status === "DISABLED" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {node.name}
                      </span>
                      {!node.visible && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-200">隐藏</span>
                      )}

                    </div>
                  </td>

                  {/* 类型 */}
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColor(node.type)}`}>
                      {typeLabel(node.type)}
                    </span>
                  </td>

                  {/* 排序 */}
                  <td className="px-4 py-2.5 text-slate-500">{node.sort}</td>

                  {/* 权限码 */}
                  <td className="px-4 py-2.5">
                    {node.permission ? (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{node.permission}</code>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  {/* 状态 */}
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${node.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {node.status === "ACTIVE" ? "启用" : "禁用"}
                    </span>
                  </td>

                  {/* 操作 */}
                  <td className="px-4 py-2.5 text-right space-x-2">
                    {node.type !== "BUTTON" && (
                      <button onClick={() => handleCreate(node.id)} className="text-green-600 hover:text-green-800 text-xs">子菜单</button>
                    )}
                    <button onClick={() => { setEditing(node); setDefaultParentId(node.parentId ?? undefined); setShowForm(true) }} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                    <button onClick={() => handleDelete(node)} className="text-red-600 hover:text-red-800 text-xs">删除</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="mb-4 text-base font-semibold">{editing ? "编辑菜单" : "新增菜单"}</h2>
            <MenuForm
              menu={editing}
              defaultParentId={defaultParentId}
              allMenus={parentCandidates}
              onSubmit={handleSubmit}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// === 菜单表单 ===
function MenuForm({ menu, defaultParentId, allMenus, onSubmit, onClose }: {
  menu: MenuNode | null
  defaultParentId?: string
  allMenus: { id: string; name: string; level: number }[]
  onSubmit: (d: Record<string, any>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: menu?.name ?? "",
    type: menu?.type ?? "MENU",
    permission: menu?.permission ?? "",
    path: menu?.path ?? "",
    component: menu?.component ?? "",
    icon: menu?.icon ?? "",
    sort: String(menu?.sort ?? 0),
    status: menu?.status ?? "ACTIVE",
    visible: menu?.visible !== false,
    parentId: menu?.parentId ?? defaultParentId ?? "",
  })
  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: form.name,
      type: form.type,
      permission: form.permission || undefined,
      path: form.path || undefined,
      component: form.component || undefined,
      icon: form.icon || undefined,
      sort: Number(form.sort),
      status: form.status,
      visible: form.visible,
      parentId: form.parentId || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 上级菜单 */}
      <div>
        <label className="mb-1 block text-xs text-slate-600">上级菜单</label>
        <select value={form.parentId} onChange={(e) => update("parentId", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm">
          <option value="">顶级菜单（无上级）</option>
          {allMenus.map(m => (
            <option key={m.id} value={m.id}>
              {"　".repeat(m.level)}{m.name}
            </option>
          ))}
        </select>
      </div>

      {/* 名称 + 类型 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-600">菜单名称 *</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">类型</label>
          <select value={form.type} onChange={(e) => update("type", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm">
            <option value="DIR">目录</option>
            <option value="MENU">菜单</option>
            <option value="BUTTON">按钮</option>
          </select>
        </div>
      </div>

      {/* 权限码 + 排序 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-600">权限码</label>
          <input value={form.permission} onChange={(e) => update("permission", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" placeholder="system:user:create" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">排序</label>
          <input type="number" value={form.sort} onChange={(e) => update("sort", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" />
        </div>
      </div>

      {/* 路由路径 + 组件 */}
      {form.type !== "BUTTON" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-600">路由路径</label>
            <input value={form.path} onChange={(e) => update("path", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" placeholder="/system/users" />
          </div>
          {form.type === "MENU" && (
            <div>
              <label className="mb-1 block text-xs text-slate-600">组件路径</label>
              <input value={form.component} onChange={(e) => update("component", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" placeholder="system/user/index" />
            </div>
          )}
        </div>
      )}

      {/* 图标 + 状态 + 显示 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-600">图标</label>
          <input value={form.icon} onChange={(e) => update("icon", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" placeholder="ep:user" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">状态</label>
          <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm">
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">显示</label>
          <select value={String(form.visible)} onChange={(e) => update("visible", e.target.value === "true")} className="h-9 w-full rounded-md border px-3 text-sm">
            <option value="true">显示</option>
            <option value="false">隐藏</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="h-9 rounded-md border px-4 text-sm">取消</button>
        <button type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">确认</button>
      </div>
    </form>
  )
}
