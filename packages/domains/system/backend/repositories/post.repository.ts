/**
 * SystemPost Repository
 */

import { randomUUID } from "node:crypto"
import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import type { PageResult } from "@/modules/shared/backend/lib/database"
import { getCurrentTenantId, isPlatformContext, isTenantRequired } from "@/modules/shared/backend/lib/biz-tenant"
import { INIT_POSTS } from "@prisma/data"

export type SystemPostRow = {
  id: string
  name: string
  code: string
  sort: number
  status: string
  remark: string | null
  tenantId: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePostData = { name: string; code: string; sort?: number; status?: string; remark?: string }
export type UpdatePostData = Partial<CreatePostData>
export type PostListParams = { page: number; pageSize: number; keyword?: string; status?: string }

function currentTenantId(): string | undefined {
  const tenantId = getCurrentTenantId()
  if (tenantId) return tenantId
  if (isTenantRequired() && !isPlatformContext()) throw new Error("岗位数据访问缺少租户上下文")
  return undefined
}

const MEMORY_STORE: SystemPostRow[] = [...INIT_POSTS]
let memoryIdSeq = 100

export const SystemPostRepository = {
  async findList(params: PostListParams): Promise<PageResult<SystemPostRow>> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return findListFromDb(params, tenantId)
    return findListFromMemory(params, tenantId)
  },

  async findById(id: string): Promise<SystemPostRow | null> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return findByIdFromDb(id, tenantId)
    return MEMORY_STORE.find((p) => p.id === id && (!tenantId || p.tenantId === tenantId)) ?? null
  },

  async findByCode(code: string): Promise<SystemPostRow | null> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return findByCodeFromDb(code, tenantId)
    return MEMORY_STORE.find((p) => p.code === code && (!tenantId || p.tenantId === tenantId)) ?? null
  },

  async create(data: CreatePostData): Promise<SystemPostRow> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return createInDb(data, tenantId)
    const now = new Date().toISOString()
    const row: SystemPostRow = { id: String(++memoryIdSeq), name: data.name, code: data.code, sort: data.sort ?? 0, status: data.status ?? "ACTIVE", remark: data.remark ?? null, tenantId: tenantId ?? null, createdAt: now, updatedAt: now }
    MEMORY_STORE.push(row)
    return row
  },

  async update(id: string, data: UpdatePostData): Promise<SystemPostRow> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return updateInDb(id, data, tenantId)
    const idx = MEMORY_STORE.findIndex((p) => p.id === id && (!tenantId || p.tenantId === tenantId))
    if (idx === -1) throw new Error(`岗位不存在: ${id}`)
    const post = MEMORY_STORE[idx]
    const updated: SystemPostRow = { ...post, name: data.name ?? post.name, code: data.code ?? post.code, sort: data.sort ?? post.sort, status: data.status ?? post.status, remark: data.remark !== undefined ? (data.remark ?? null) : post.remark, updatedAt: new Date().toISOString() }
    MEMORY_STORE[idx] = updated
    return updated
  },

  async delete(id: string): Promise<void> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) return deleteInDb(id, tenantId)
    const idx = MEMORY_STORE.findIndex((p) => p.id === id && (!tenantId || p.tenantId === tenantId))
    if (idx === -1) throw new Error(`岗位不存在: ${id}`)
    MEMORY_STORE.splice(idx, 1)
  },
}

function findListFromMemory(params: PostListParams, tenantId?: string): PageResult<SystemPostRow> {
  let filtered = [...MEMORY_STORE]
  if (tenantId) filtered = filtered.filter((p) => p.tenantId === tenantId)
  if (params.keyword) { const kw = params.keyword.toLowerCase(); filtered = filtered.filter((p) => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw)) }
  if (params.status) filtered = filtered.filter((p) => p.status === params.status)
  filtered.sort((a, b) => a.sort - b.sort)
  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  return { items: filtered.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize }
}

async function findListFromDb(params: PostListParams, tenantId?: string): Promise<PageResult<SystemPostRow>> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_post").where("deleted", "=", false)
  if (params.keyword) { const kw = `%${params.keyword}%`; query = query.where((eb) => eb.or([eb("name", "like", kw), eb("code", "like", kw)])) }
  if (params.status) query = query.where("status", "=", params.status)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const countResult = await query.select((eb) => eb.fn.countAll<number>().as("count")).executeTakeFirst()
  const total = Number(countResult?.count ?? 0)
  const offset = (params.page - 1) * params.pageSize
  const rows = await query.selectAll().orderBy("sort", "asc").offset(offset).limit(params.pageSize).execute()
  return { items: rows.map(mapDbRow), total, page: params.page, pageSize: params.pageSize }
}

async function findByIdFromDb(id: string, tenantId?: string): Promise<SystemPostRow | null> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_post").selectAll().where("id", "=", id).where("deleted", "=", false)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const row = await query.executeTakeFirst()
  return row ? mapDbRow(row) : null
}

async function findByCodeFromDb(code: string, tenantId?: string): Promise<SystemPostRow | null> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_post").selectAll().where("code", "=", code).where("deleted", "=", false)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const row = await query.executeTakeFirst()
  return row ? mapDbRow(row) : null
}

async function createInDb(data: CreatePostData, tenantId?: string): Promise<SystemPostRow> {
  const db = await getKyselyDb()
  const row = await db.insertInto("system_post").values({ id: randomUUID(), name: data.name, code: data.code, sort: data.sort ?? 0, status: data.status ?? "ACTIVE", remark: data.remark ?? null, tenant_id: tenantId ?? null, updated_at: new Date(), deleted: false } as any).returningAll().executeTakeFirstOrThrow()
  return mapDbRow(row)
}

async function updateInDb(id: string, data: UpdatePostData, tenantId?: string): Promise<SystemPostRow> {
  const db = await getKyselyDb()
  const updateData: Record<string, any> = { updated_at: new Date() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.code !== undefined) updateData.code = data.code
  if (data.sort !== undefined) updateData.sort = data.sort
  if (data.status !== undefined) updateData.status = data.status
  if (data.remark !== undefined) updateData.remark = data.remark
  let query = db.updateTable("system_post").set(updateData).where("id", "=", id).where("deleted", "=", false)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  const row = await query.returningAll().executeTakeFirstOrThrow()
  return mapDbRow(row)
}

async function deleteInDb(id: string, tenantId?: string): Promise<void> {
  const db = await getKyselyDb()
  let query = db.updateTable("system_post").set({ deleted: true, updated_at: new Date() }).where("id", "=", id)
  if (tenantId) query = query.where("tenant_id", "=", tenantId)
  await query.execute()
}

function mapDbRow(row: any): SystemPostRow {
  return { id: row.id, name: row.name, code: row.code, sort: row.sort, status: row.status, remark: row.remark, tenantId: row.tenant_id, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at) }
}
export const systemPostRepository = SystemPostRepository
