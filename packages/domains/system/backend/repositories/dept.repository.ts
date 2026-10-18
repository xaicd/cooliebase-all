/**
 * SystemDept Repository - 树形结构
 */

import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import { getCurrentTenantId, isPlatformContext, isTenantRequired } from "@/modules/shared/backend/lib/biz-tenant"
import { SEED_DEPTS } from "@prisma/data"

export type SystemDeptRow = {
  id: string
  name: string
  parentId: string | null
  sort: number
  leaderId: string | null
  phone: string | null
  email: string | null
  status: string
  tenantId: string | null
  createdAt: string
  updatedAt: string
}

export type CreateDeptData = {
  name: string
  parentId?: string
  sort?: number
  leaderId?: string
  phone?: string
  email?: string
  status?: string
}

export type UpdateDeptData = Partial<CreateDeptData>

function currentTenantId(): string | undefined {
  const tenantId = getCurrentTenantId()
  if (tenantId) return tenantId
  if (isTenantRequired() && !isPlatformContext()) throw new Error("部门数据访问缺少租户上下文")
  return undefined
}

// === 内存存储（部门树 init 种子） ===
const MEMORY_STORE: SystemDeptRow[] = [...SEED_DEPTS]

let memoryIdSeq = 200

export const SystemDeptRepository = {
  /** 获取全部部门列表（树形场景需要全量） */
  async findAll(params?: { status?: string; keyword?: string }): Promise<SystemDeptRow[]> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return findAllFromDb(params, tenantId)
    let filtered = MEMORY_STORE.filter((d) => !tenantId || d.tenantId === tenantId)
    if (params?.status) filtered = filtered.filter((d) => d.status === params.status)
    if (params?.keyword) filtered = filtered.filter((d) => d.name.toLowerCase().includes(params.keyword!.toLowerCase()))
    return filtered.sort((a, b) => a.sort - b.sort)
  },

  async findById(id: string): Promise<SystemDeptRow | null> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return findByIdFromDb(id, tenantId)
    return MEMORY_STORE.find((d) => d.id === id && (!tenantId || d.tenantId === tenantId)) ?? null
  },

  async create(data: CreateDeptData): Promise<SystemDeptRow> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return createInDb(data, tenantId)
    const now = new Date().toISOString()
    const row: SystemDeptRow = { id: String(++memoryIdSeq), name: data.name, parentId: data.parentId ?? null, sort: data.sort ?? 0, leaderId: data.leaderId ?? null, phone: data.phone ?? null, email: data.email ?? null, status: data.status ?? "ACTIVE", tenantId: tenantId ?? null, createdAt: now, updatedAt: now }
    MEMORY_STORE.push(row)
    return row
  },

  async update(id: string, data: UpdateDeptData): Promise<SystemDeptRow> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return updateInDb(id, data, tenantId)
    const idx = MEMORY_STORE.findIndex((d) => d.id === id && (!tenantId || d.tenantId === tenantId))
    if (idx === -1) throw new Error(`部门不存在: ${id}`)
    const dept = MEMORY_STORE[idx]
    const updated: SystemDeptRow = { ...dept, name: data.name ?? dept.name, parentId: data.parentId !== undefined ? (data.parentId ?? null) : dept.parentId, sort: data.sort ?? dept.sort, leaderId: data.leaderId !== undefined ? (data.leaderId ?? null) : dept.leaderId, phone: data.phone !== undefined ? (data.phone ?? null) : dept.phone, email: data.email !== undefined ? (data.email ?? null) : dept.email, status: data.status ?? dept.status, updatedAt: new Date().toISOString() }
    MEMORY_STORE[idx] = updated
    return updated
  },

  async delete(id: string): Promise<void> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return deleteInDb(id, tenantId)
    const hasChildren = MEMORY_STORE.some((d) => d.parentId === id && (!tenantId || d.tenantId === tenantId))
    if (hasChildren) throw new Error("该部门下存在子部门，无法删除")
    const idx = MEMORY_STORE.findIndex((d) => d.id === id && (!tenantId || d.tenantId === tenantId))
    if (idx === -1) throw new Error(`部门不存在: ${id}`)
    MEMORY_STORE.splice(idx, 1)
  },
}

// === Kysely 实现 ===

async function findAllFromDb(params: { status?: string; keyword?: string } | undefined, tenantId?: string): Promise<SystemDeptRow[]> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_dept").where("deleted", "=", false)
  if (params?.status) query = query.where("status", "=", params.status)
  if (params?.keyword) query = query.where("name", "like", `%${params.keyword}%`)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const rows = await query.selectAll().orderBy("sort", "asc").execute()
  return rows.map(mapDbRow)
}

async function findByIdFromDb(id: string, tenantId?: string): Promise<SystemDeptRow | null> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_dept").selectAll().where("id", "=", id).where("deleted", "=", false)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const row = await query.executeTakeFirst()
  return row ? mapDbRow(row) : null
}

async function createInDb(data: CreateDeptData, tenantId?: string): Promise<SystemDeptRow> {
  const db = await getKyselyDb()
  const row = await db.insertInto("system_dept").values({
    id: crypto.randomUUID(),
    name: data.name,
    parent_id: data.parentId ?? null,
    sort: data.sort ?? 0,
    leader_id: data.leaderId ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    status: data.status ?? "ACTIVE",
    tenant_id: tenantId ?? null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted: false,
  } as any).returningAll().executeTakeFirstOrThrow()
  return mapDbRow(row)
}

async function updateInDb(id: string, data: UpdateDeptData, tenantId?: string): Promise<SystemDeptRow> {
  const db = await getKyselyDb()
  const updateData: Record<string, any> = { updated_at: new Date() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.parentId !== undefined) updateData.parent_id = data.parentId
  if (data.sort !== undefined) updateData.sort = data.sort
  if (data.leaderId !== undefined) updateData.leader_id = data.leaderId
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.email !== undefined) updateData.email = data.email
  if (data.status !== undefined) updateData.status = data.status

  let query = db.updateTable("system_dept").set(updateData).where("id", "=", id).where("deleted", "=", false)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const row = await query.returningAll().executeTakeFirstOrThrow()
  return mapDbRow(row)
}

async function deleteInDb(id: string, tenantId?: string): Promise<void> {
  const db = await getKyselyDb()
  let childrenQuery = db.selectFrom("system_dept").select("id").where("parent_id", "=", id).where("deleted", "=", false)
  if (tenantId) childrenQuery = childrenQuery.where("tenant_id", "=", tenantId)
  const children = await childrenQuery.execute()
  if (children.length > 0) throw new Error("该部门下存在子部门，无法删除")
  let deleteQuery = db.updateTable("system_dept").set({ deleted: true, updated_at: new Date() }).where("id", "=", id)
  if (tenantId) deleteQuery = deleteQuery.where("tenant_id", "=", tenantId)
  await deleteQuery.execute()
}

function mapDbRow(row: any): SystemDeptRow {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sort: row.sort,
    leaderId: row.leader_id,
    phone: row.phone,
    email: row.email,
    status: row.status,
    tenantId: row.tenant_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}
export const systemDeptRepository = SystemDeptRepository
