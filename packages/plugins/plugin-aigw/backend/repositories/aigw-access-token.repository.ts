import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import { getCurrentTenantId, isTenantRequired, isPlatformContext } from "@/modules/shared/backend/lib/biz-tenant"
import { INIT_AI_TOKENS } from "@prisma/data"

export type AigwAccessTokenRow = {
  id: string
  name: string
  key: string
  status: "ACTIVE" | "DISABLED"
  remainQuota: number
  unlimited: boolean
  models: string[]
  ipAllowlist: string[]
  group: string
  expiresAt?: string | null
  tenantId?: string | null
  createdAt: string
  updatedAt?: string
  deleted?: boolean
}

const MEMORY_STORE: AigwAccessTokenRow[] = JSON.parse(JSON.stringify(INIT_AI_TOKENS))
let memorySeq = 100

function mapFromDb(r: any): AigwAccessTokenRow {
  return {
    id: r.id,
    name: r.name,
    key: r.key,
    status: r.status ?? "ACTIVE",
    remainQuota: Number(r.remain_quota ?? 0),
    unlimited: Boolean(r.unlimited),
    models: typeof r.models === "string" ? JSON.parse(r.models) : (r.models ?? []),
    ipAllowlist: typeof r.ip_allowlist === "string" ? JSON.parse(r.ip_allowlist) : (r.ip_allowlist ?? []),
    group: r.group ?? "default",
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    tenantId: r.tenant_id,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    deleted: Boolean(r.deleted),
  }
}

/**
 * 租户唯一来源 = 全局上下文（AGENTS.md §4.8）。
 * 有上下文即过滤（admin 场景）；无上下文（relay/open 鉴权）不过滤，行为与现状兼容。
 */
function currentTenantId(): string | undefined {
  const tenantId = getCurrentTenantId()
  if (tenantId) return tenantId
  if (isTenantRequired() && !isPlatformContext()) throw new Error("令牌数据访问缺少租户上下文")
  return undefined
}

export const AigwAccessTokenRepository = {
  async findAll(params?: { status?: string; keyword?: string }): Promise<AigwAccessTokenRow[]> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      let query = db.selectFrom("ai_access_token" as any).selectAll().where("deleted" as any, "=", false)
      if (tenantId) query = query.where("tenant_id" as any, "=", tenantId)
      if (params?.status) query = query.where("status" as any, "=", params.status)
      const rows = await query.execute()
      return rows.map(mapFromDb)
    }

    let list = [...MEMORY_STORE].filter((r) => !r.deleted)
    if (tenantId) list = list.filter((r) => !r.tenantId || r.tenantId === tenantId)
    if (params?.status) list = list.filter((r) => r.status === params.status)
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(kw) || r.key.toLowerCase().includes(kw))
    }
    return list
  },

  async findByIds(ids: string[]): Promise<AigwAccessTokenRow[]> {
    if (!ids.length) return []
    const tenantId = currentTenantId()
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      let query = db.selectFrom("ai_access_token" as any).selectAll().where("id" as any, "in", ids)
      if (tenantId) query = query.where("tenant_id" as any, "=", tenantId)
      const rows = await query.execute()
      return rows.map(mapFromDb)
    }
    const set = new Set(ids)
    return MEMORY_STORE.filter((r) => set.has(r.id) && !r.deleted && (!tenantId || !r.tenantId || r.tenantId === tenantId))
  },

  async findById(id: string): Promise<AigwAccessTokenRow | null> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      let query = db.selectFrom("ai_access_token" as any).selectAll().where("id" as any, "=", id)
      if (tenantId) query = query.where("tenant_id" as any, "=", tenantId)
      const r = await query.executeTakeFirst()
      if (!r) return null
      return mapFromDb(r)
    }
    return MEMORY_STORE.find((r) => r.id === id && !r.deleted && (!tenantId || !r.tenantId || r.tenantId === tenantId)) ?? null
  },

  async findByKey(key: string): Promise<AigwAccessTokenRow | null> {
    const tenantId = currentTenantId()
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      let query = db.selectFrom("ai_access_token" as any).selectAll().where("key" as any, "=", key).where("deleted" as any, "=", false)
      if (tenantId) query = query.where("tenant_id" as any, "=", tenantId)
      const r = await query.executeTakeFirst()
      if (!r) return null
      return mapFromDb(r)
    }
    return MEMORY_STORE.find((r) => r.key === key && !r.deleted && (!tenantId || !r.tenantId || r.tenantId === tenantId)) ?? null
  },

  async create(data: Omit<AigwAccessTokenRow, "id" | "createdAt">): Promise<AigwAccessTokenRow> {
    const now = new Date().toISOString()
    const id = `tok-${Date.now().toString(36)}-${(++memorySeq).toString(36)}`
    // 租户优先级：显式传入（资源归属）→ 全局上下文；禁止硬编码 "1"
    const tenantId = data.tenantId ?? currentTenantId()
    if (isTenantRequired() && !tenantId) throw new Error("令牌创建缺少租户上下文")
    const row: AigwAccessTokenRow = {
      ...data,
      id,
      tenantId: tenantId ?? null,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    }
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      await db.insertInto("ai_access_token" as any).values({
        id,
        name: data.name,
        key: data.key,
        status: data.status,
        remain_quota: BigInt(data.remainQuota),
        unlimited: data.unlimited,
        models: JSON.stringify(data.models),
        ip_allowlist: JSON.stringify(data.ipAllowlist ?? []),
        group: data.group,
        expires_at: data.expiresAt ? new Date(data.expiresAt) : null,
        tenant_id: tenantId ?? null,
        created_at: now,
        updated_at: now,
        deleted: false,
      }).execute()
    } else {
      MEMORY_STORE.push(row)
    }
    return row
  },

  async update(id: string, data: Partial<AigwAccessTokenRow>): Promise<AigwAccessTokenRow> {
    const existing = await this.findById(id)
    if (!existing) throw new Error(`令牌不存在: ${id}`)
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      const updateData: any = { updated_at: updated.updatedAt }
      if (data.name !== undefined) updateData.name = data.name
      if (data.status !== undefined) updateData.status = data.status
      if (data.remainQuota !== undefined) updateData.remain_quota = BigInt(data.remainQuota)
      if (data.unlimited !== undefined) updateData.unlimited = data.unlimited
      if (data.models !== undefined) updateData.models = JSON.stringify(data.models)
      if (data.ipAllowlist !== undefined) updateData.ip_allowlist = JSON.stringify(data.ipAllowlist)
      if (data.group !== undefined) updateData.group = data.group
      if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt ? new Date(data.expiresAt) : null
      await db.updateTable("ai_access_token" as any).set(updateData).where("id" as any, "=", id).execute()
    } else {
      const idx = MEMORY_STORE.findIndex((r) => r.id === id)
      if (idx !== -1) MEMORY_STORE[idx] = updated
    }
    return updated
  },

  async deductQuota(key: string, amount: number): Promise<{ success: boolean; remainQuota: number }> {
    const token = await this.findByKey(key)
    if (!token) return { success: false, remainQuota: 0 }
    if (token.unlimited) return { success: true, remainQuota: token.remainQuota }
    if (token.remainQuota < amount) return { success: false, remainQuota: token.remainQuota }

    const nextQuota = token.remainQuota - amount
    await this.update(token.id, { remainQuota: nextQuota })
    return { success: true, remainQuota: nextQuota }
  },

  async delete(id: string): Promise<void> {
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      await db.updateTable("ai_access_token" as any).set({ deleted: true, updated_at: new Date().toISOString() }).where("id" as any, "=", id).execute()
    } else {
      const idx = MEMORY_STORE.findIndex((r) => r.id === id)
      if (idx !== -1) MEMORY_STORE[idx].deleted = true
    }
  },
}

export const aigwAccessTokenRepository = AigwAccessTokenRepository

