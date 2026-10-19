"use client"

import { useState, useEffect, useCallback } from "react"

// === Types ===
type SystemUser = {
  id: string
  username: string
  nickname: string
  phone: string | null
  email: string | null
  deptId: string | null
  roleIds: string[]
  postIds: string[]
  status: string
  remark: string | null
  createdAt: string
}

type PageData = {
  items: SystemUser[]
  total: number
  page: number
  pageSize: number
}

// === API ===
import { request, API } from "@/modules/shared/frontend/lib/request"
import { DepartmentTreeSelect } from "@/modules/system/frontend/components/department-tree-select"
import { Pagination } from "@/modules/shared/frontend/components/pagination"

async function fetchUsers(params: {
  page: number
  pageSize: number
  keyword?: string
  status?: string
}): Promise<{ success: boolean; data?: PageData; error?: string }> {
  return request.get(API.USERS, params)
}

async function createUser(data: Record<string, any>) {
  return request.post(API.USERS, data)
}

async function updateUser(id: string, data: Record<string, any>) {
  return request.put(`${API.USERS}/${id}`, data)
}

async function deleteUser(id: string) {
  return request.delete(`${API.USERS}/${id}`)
}

async function updateUserStatus(id: string, status: string) {
  return request.patch(`${API.USERS}/${id}`, { action: "updateStatus", status })
}

// === Main Component ===
export default function SystemUsersPage() {
  const [data, setData] = useState<PageData>({ items: [], total: 0, page: 1, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)

  const loadData = useCallback(async (p = page, ps = pageSize, kw = keyword, st = statusFilter) => {
    setLoading(true)
    try {
      const result = await fetchUsers({
        page: p,
        pageSize: ps,
        keyword: kw || undefined,
        status: st || undefined,
      })
      if (result.success && result.data) {
        setData(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, statusFilter])

  useEffect(() => {
    loadData(page, pageSize, keyword, statusFilter)
  }, [loadData, page, pageSize])

  const handleSearch = () => {
    setPage(1)
    loadData(1, pageSize, keyword, statusFilter)
  }

  const handleReset = () => {
    setKeyword("")
    setStatusFilter("")
    setPage(1)
    loadData(1, pageSize, "", "")
  }

  const handleCreate = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEdit = async (user: SystemUser) => {
    const result = await request.get<SystemUser>(`${API.USERS}/${user.id}`)
    if (!result.success || !result.data) {
      alert(result.error || "加载用户详情失败")
      return
    }
    setEditingUser(result.data)
    setShowForm(true)
  }

  const handleDelete = async (user: SystemUser) => {
    if (!confirm(`确认删除用户「${user.nickname}」？`)) return
    const result = await deleteUser(user.id)
    if (result.success) {
      loadData()
    } else {
      alert(result.error || "删除失败")
    }
  }

  const handleToggleStatus = async (user: SystemUser) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
    const result = await updateUserStatus(user.id, newStatus)
    if (result.success) {
      loadData()
    } else {
      alert(result.error || "状态变更失败")
    }
  }

  const handleFormSubmit = async (formData: Record<string, any>) => {
    let result
    if (editingUser) {
      result = await updateUser(editingUser.id, formData)
    } else {
      result = await createUser(formData)
    }
    if (result.success) {
      setShowForm(false)
      loadData()
    } else {
      alert(result.error || "操作失败")
    }
  }

  const totalPages = Math.ceil(data.total / data.pageSize)

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <h1 data-testid="user-title" className="text-lg font-semibold text-slate-900">用户管理</h1>
          <p className="mt-0.5 text-sm text-slate-500">管理系统用户账号、角色分配与状态</p>
        </div>
        <button
          onClick={handleCreate}
          className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          新增用户
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="用户名 / 昵称 / 手机号"
            className="h-9 w-56 rounded-md border px-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
          <button
            onClick={handleSearch}
            className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white"
          >
            查询
          </button>
          <button
            onClick={handleReset}
            className="h-9 rounded-md border px-4 text-sm"
          >
            重置
          </button>
          <span className="ml-auto text-xs text-slate-400">
            共 {data.total} 条
          </span>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">用户名</th>
                <th className="px-4 py-3">昵称</th>
                <th className="px-4 py-3">手机号</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">加载中...</td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">暂无数据</td>
                </tr>
              ) : (
                data.items.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3">{user.nickname}</td>
                    <td className="px-4 py-3 text-slate-500">{user.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "启用" : "禁用"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(user)}
                        className="mr-2 text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 通用底部分页控件 */}
      <Pagination
        total={data.total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => {
          setPage(p)
          loadData(p, pageSize, keyword, statusFilter)
        }}
        onPageSizeChange={(ps) => {
          setPageSize(ps)
          setPage(1)
          loadData(1, ps, keyword, statusFilter)
        }}
      />

      {/* 新增/编辑弹窗 */}
      {showForm && (
        <UserFormDialog
          user={editingUser}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// === Form Dialog ===
function UserFormDialog({
  user,
  onSubmit,
  onClose,
}: {
  user: SystemUser | null
  onSubmit: (data: Record<string, any>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    username: user?.username ?? "",
    nickname: user?.nickname ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    password: "",
    status: user?.status ?? "ACTIVE",
    remark: user?.remark ?? "",
    roleIds: user?.roleIds ?? [],
    postIds: user?.postIds ?? [],
    deptId: user?.deptId ?? "",
  })

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [posts, setPosts] = useState<{ id: string; name: string; code: string }[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [rolesError, setRolesError] = useState("")
  const [postsError, setPostsError] = useState("")

  useEffect(() => {
    let active = true
    request.get<{ items: { id: string; name: string }[] }>(API.ROLES, { pageSize: 100, status: "ACTIVE" })
      .then((result) => {
        if (!active) return
        if (result.success && result.data) setRoles(result.data.items.map((role) => ({ id: role.id, name: role.name })))
        else setRolesError(result.error || "角色加载失败")
      })
      .finally(() => { if (active) setRolesLoading(false) })
    request.get<{ items: { id: string; name: string; code: string }[] }>(API.POSTS, { pageSize: 100, status: "ACTIVE" })
      .then((result) => {
        if (!active) return
        if (result.success && result.data) setPosts(result.data.items.map((post) => ({ id: post.id, name: post.name, code: post.code })))
        else setPostsError(result.error || "岗位加载失败")
      })
      .finally(() => { if (active) setPostsLoading(false) })
    return () => { active = false }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, any> = { ...form }
    if (user && !payload.password) delete payload.password
    if (!payload.deptId) delete payload.deptId
    onSubmit(payload)
  }

  const update = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleRole = (roleId: string) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }))
  }

  const togglePost = (postId: string) => {
    setForm((prev) => ({
      ...prev,
      postIds: prev.postIds.includes(postId)
        ? prev.postIds.filter((id) => id !== postId)
        : [...prev.postIds, postId],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <h2 className="mb-4 text-base font-semibold">
          {user ? "编辑用户" : "新增用户"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-600">用户名 *</label>
              <input required value={form.username} onChange={(e) => update("username", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" disabled={Boolean(user)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">昵称 *</label>
              <input required value={form.nickname} onChange={(e) => update("nickname", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-600">手机号</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">邮箱</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">{user ? "新密码（留空不修改）" : "密码 *"}</label>
            <input type="password" required={!user} value={form.password} onChange={(e) => update("password", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" placeholder={user ? "留空不修改" : "至少 6 位"} />
          </div>

          {/* 部门选择 */}
          <div>
            <label className="mb-1 block text-xs text-slate-600">所属部门</label>
            <DepartmentTreeSelect value={form.deptId} onChange={(value) => update("deptId", value)} activeOnly />
          </div>

          {/* 角色分配 */}
          <div>
            <label className="mb-1 block text-xs text-slate-600">分配角色</label>
            <div className="rounded-md border p-2 max-h-32 overflow-y-auto">
              {rolesLoading ? <p className="text-xs text-slate-400">加载中...</p> : rolesError ? <p className="text-xs text-red-500">{rolesError}</p> : roles.length === 0 ? <p className="text-xs text-slate-400">暂无可分配角色</p> : (
                <div className="grid grid-cols-2 gap-1">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} className="rounded" />
                      <span className="text-xs">{role.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 岗位分配 */}
          <div>
            <label className="mb-1 block text-xs text-slate-600">分配岗位</label>
            <div className="rounded-md border p-2 max-h-32 overflow-y-auto">
              {postsLoading ? <p className="text-xs text-slate-400">加载中...</p> : postsError ? <p className="text-xs text-red-500">{postsError}</p> : posts.length === 0 ? <p className="text-xs text-slate-400">暂无可分配岗位</p> : (
                <div className="grid grid-cols-2 gap-1">
                  {posts.map((post) => (
                    <label key={post.id} className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={form.postIds.includes(post.id)} onChange={() => togglePost(post.id)} className="rounded" />
                      <span className="text-xs">{post.name}<span className="ml-1 text-slate-400">{post.code}</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-600">状态</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm">
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">禁用</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">备注</label>
              <input value={form.remark} onChange={(e) => update("remark", e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border px-4 text-sm">取消</button>
            <button type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">确认</button>
          </div>
        </form>
      </div>
    </div>
  )
}
