"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { request, API } from "@/modules/shared/frontend/lib/request"
import { Pagination } from "@/modules/shared/frontend/components/pagination"

type SystemRole = {
  id: string
  name: string
  code: string
  sort: number
  status: string
  dataScope: string
  remark: string | null
  createdAt: string
}

type PageData = { items: SystemRole[]; total: number; page: number; pageSize: number }
type MenuNode = { id: string; name: string; permission: string | null; children: MenuNode[] }
type RoleMenuIdsResponse = { menuIds: string[] }

export default function SystemRolesPage() {
  const [data, setData] = useState<PageData>({ items: [], total: 0, page: 1, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SystemRole | null>(null)

  const loadData = useCallback(async (p = page, ps = pageSize, kw = keyword) => {
    setLoading(true)
    try {
      const res = await request.get(API.ROLES, { page: p, pageSize: ps, keyword: kw || undefined })
      if (res.success) setData(res.data)
    } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => {
    loadData(page, pageSize, keyword)
  }, [loadData, page, pageSize])

  const handleDelete = async (role: SystemRole) => {
    if (!confirm(`确认删除角色「${role.name}」？`)) return
    const res = await request.delete(`${API.ROLES}/${role.id}`)
    if (res.success) loadData(page, pageSize, keyword); else alert(res.error)
  }

  const [showMenuAssign, setShowMenuAssign] = useState(false)
  const [assigningRole, setAssigningRole] = useState<SystemRole | null>(null)

  const handleAssignMenus = (role: SystemRole) => {
    setAssigningRole(role)
    setShowMenuAssign(true)
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    const res = editing
      ? await request.put(`${API.ROLES}/${editing.id}`, formData)
      : await request.post(API.ROLES, formData)
    if (res.success) { setShowForm(false); loadData(page, pageSize, keyword) } else alert(res.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">角色管理</h1>
          <p className="mt-0.5 text-sm text-slate-500">管理系统角色与数据权限</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">新增角色</button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-white p-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索角色名称/编码"
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />
        <button onClick={() => { setPage(1); loadData(1, pageSize, keyword) }} className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white">查询</button>
        <button onClick={() => { setKeyword(""); setPage(1); loadData(1, pageSize, "") }} className="h-9 rounded-md border px-4 text-sm">重置</button>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">角色名称</th>
              <th className="px-4 py-3">角色编码</th>
              <th className="px-4 py-3">显示顺序</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">数据范围</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">加载中...</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">暂无数据</td></tr>
            ) : data.items.map((role) => (
              <tr key={role.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{role.name}</td>
                <td className="px-4 py-3"><code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{role.code}</code></td>
                <td className="px-4 py-3">{role.sort}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${role.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{role.status === "ACTIVE" ? "启用" : "禁用"}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500">{role.dataScope}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleAssignMenus(role)} className="mr-2 text-green-600 hover:text-green-800">菜单</button>
                  <button onClick={() => { setEditing(role); setShowForm(true) }} className="mr-2 text-blue-600 hover:text-blue-800">编辑</button>
                  <button onClick={() => handleDelete(role)} className="text-red-600 hover:text-red-800">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {showForm && <RoleFormDialog role={editing} onSubmit={handleSubmit} onClose={() => setShowForm(false)} />}
      {showMenuAssign && assigningRole && <MenuAssignDialog key={`${assigningRole.id}-cooliebase-menu-permissions-v2`} role={assigningRole} onClose={() => setShowMenuAssign(false)} />}
    </div>
  )
}

function RoleFormDialog({ role, onSubmit, onClose }: { role: SystemRole | null; onSubmit: (d: Record<string, any>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: role?.name ?? "", code: role?.code ?? "", sort: String(role?.sort ?? 0), status: role?.status ?? "ACTIVE", dataScope: role?.dataScope ?? "ALL", remark: role?.remark ?? "" })
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold">{role ? "编辑角色" : "新增角色"}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, sort: Number(form.sort) }) }} className="space-y-3">
          <div><label className="mb-1 block text-xs text-slate-600">角色名称 *</label><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
          <div><label className="mb-1 block text-xs text-slate-600">角色编码 *</label><input required value={form.code} onChange={(e) => update("code", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" disabled={Boolean(role)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-slate-600">排序</label><input type="number" value={form.sort} onChange={(e) => update("sort", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
            <div><label className="mb-1 block text-xs text-slate-600">状态</label><select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option></select></div>
          </div>
          <div><label className="mb-1 block text-xs text-slate-600">数据范围</label><select value={form.dataScope} onChange={(e) => update("dataScope", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm"><option value="ALL">全部</option><option value="DEPT">本部门</option><option value="DEPT_AND_CHILD">本部门及以下</option><option value="SELF">仅本人</option></select></div>
          <div><label className="mb-1 block text-xs text-slate-600">备注</label><input value={form.remark} onChange={(e) => update("remark", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border px-4 text-sm">取消</button>
            <button type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">确认</button>
          </div>
        </form>
      </div>
    </div>
  )
}


// === 菜单分配弹窗（参考 Yudao：回显、级联、半选节点、展开控制） ===
function MenuAssignDialog({ role, onClose }: { role: SystemRole; onClose: () => void }) {
  const [menuTree, setMenuTree] = useState<MenuNode[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      request.get<MenuNode[]>(API.ROLE_ASSIGNABLE_MENUS, { roleId: role.id }),
      request.get<RoleMenuIdsResponse>(API.ROLE_MENU_IDS, { roleId: role.id }),
    ]).then(([menus, assigned]) => {
      if (!active) return
      if (!menus.success) setLoadError(menus.error || "菜单树加载失败")
      else if (!assigned.success) setLoadError(assigned.error || "角色菜单加载失败")
      else {
        const tree = menus.data ?? []
        setMenuTree(tree)
        setCheckedIds(new Set(assigned.data?.menuIds ?? []))
        setExpandedIds(new Set(tree.map((node) => node.id)))
      }
    }).catch(() => active && setLoadError("菜单授权数据加载失败"))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [role.id])

  const descendantIds = (node: MenuNode): string[] => [node.id, ...node.children.flatMap(descendantIds)]
  const allMenuIds = menuTree.flatMap(descendantIds)
  const nodeState = (node: MenuNode): "checked" | "partial" | "empty" => {
    const ids = descendantIds(node)
    const selected = ids.filter((id) => checkedIds.has(id)).length
    return selected === ids.length ? "checked" : selected > 0 ? "partial" : "empty"
  }

  const toggleCheck = (node: MenuNode) => {
    const ids = descendantIds(node)
    setCheckedIds((current) => {
      const next = new Set(current)
      const shouldCheck = ids.some((id) => !next.has(id))
      ids.forEach((id) => shouldCheck ? next.add(id) : next.delete(id))
      return next
    })
  }

  const toggleExpanded = (id: string) => setExpandedIds((current) => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleSelectAll = () => setCheckedIds(new Set(allMenuIds))
  const handleDeselectAll = () => setCheckedIds(new Set())
  const handleExpandAll = () => setExpandedIds(new Set(allMenuIds))
  const handleCollapseAll = () => setExpandedIds(new Set())

  // Yudao 提交 checked + halfChecked；半选父级也保留，确保授权树路径完整。
  const savedMenuIds = () => {
    const ids = new Set(checkedIds)
    const collectPartialParents = (nodes: MenuNode[]) => nodes.forEach((node) => {
      if (nodeState(node) === "partial") ids.add(node.id)
      collectPartialParents(node.children)
    })
    collectPartialParents(menuTree)
    return Array.from(ids)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await request.post(API.ASSIGN_ROLE_MENU, { roleId: role.id, menuIds: savedMenuIds() })
      if (res.success) { alert("菜单权限分配成功"); onClose() }
      else alert(res.error || "菜单权限分配失败")
    } finally { setSaving(false) }
  }

  const renderTree = (nodes: MenuNode[], level = 0) => (
    <div className={level > 0 ? "ml-5 border-l border-slate-100 pl-2" : ""}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0
        const state = nodeState(node)
        return (
          <div key={node.id} className="py-0.5">
            <div className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-50">
              {hasChildren ? <button type="button" onClick={() => toggleExpanded(node.id)} className="w-4 text-[10px] text-slate-400">{expandedIds.has(node.id) ? "▼" : "▶"}</button> : <span className="w-4" />}
              <TreeCheckbox state={state} onChange={() => toggleCheck(node)} />
              <button type="button" onClick={() => toggleCheck(node)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="truncate text-xs">{node.name}</span>
                {node.permission && <span className="truncate text-[10px] text-slate-400">{node.permission}</span>}
              </button>
            </div>
            {hasChildren && expandedIds.has(node.id) && renderTree(node.children, level + 1)}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div><h2 className="text-base font-semibold">分配菜单权限</h2><p className="mt-0.5 text-xs text-slate-500">角色：{role.name}（{role.code}）</p></div>
          <div className="flex gap-2 text-xs"><button onClick={handleSelectAll} className="text-blue-600 hover:text-blue-800">全选</button><button onClick={handleDeselectAll} className="text-slate-500 hover:text-slate-700">全不选</button><button onClick={handleExpandAll} className="text-blue-600 hover:text-blue-800">展开</button><button onClick={handleCollapseAll} className="text-slate-500 hover:text-slate-700">折叠</button></div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? <p className="py-8 text-center text-slate-400">加载中...</p>
          : loadError ? <p className="py-8 text-center text-red-600">{loadError}</p>
          : menuTree.length === 0 ? <p className="py-8 text-center text-slate-400">暂无菜单</p>
          : renderTree(menuTree)}
        </div>
        <div className="flex items-center justify-between border-t px-5 py-3"><span className="text-xs text-slate-400">已选 {savedMenuIds().length} 项</span><div className="flex gap-2"><button onClick={onClose} className="h-9 rounded-md border px-4 text-sm">取消</button><button onClick={handleSave} disabled={saving || loading || Boolean(loadError)} className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "确认分配"}</button></div></div>
      </div>
    </div>
  )
}

function TreeCheckbox({ state, onChange }: { state: "checked" | "partial" | "empty"; onChange: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (inputRef.current) inputRef.current.indeterminate = state === "partial" }, [state])
  return <input ref={inputRef} type="checkbox" checked={state === "checked"} onChange={onChange} className="rounded" />
}
