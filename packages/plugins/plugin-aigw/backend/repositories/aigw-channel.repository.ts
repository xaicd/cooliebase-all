import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import { INIT_AI_CHANNELS } from "@prisma/data"

export type AigwChannelRow = {
  id: string
  name: string
  provider: string
  baseUrl: string
  apiKey: string
  models: string[]
  modelMap: Record<string, string>
  weight: number
  priority: number
  status: "ACTIVE" | "DISABLED"
  autoDisable: boolean
  failCount: number
  protocol: "openai"
  tenantId?: string | null
  createdAt: string
  updatedAt?: string
  deleted?: boolean
}

const MEMORY_STORE: AigwChannelRow[] = JSON.parse(JSON.stringify(INIT_AI_CHANNELS))
let memorySeq = 100

function mapFromDb(r: any): AigwChannelRow {
  return {
    id: r.id,
    name: r.name,
    provider: r.provider,
    baseUrl: r.base_url ?? "",
    apiKey: r.api_key ?? "",
    models: typeof r.models === "string" ? JSON.parse(r.models) : (r.models ?? []),
    modelMap: typeof r.model_map === "string" ? JSON.parse(r.model_map) : (r.model_map ?? {}),
    weight: Number(r.weight ?? 100),
    priority: Number(r.priority ?? 1),
    status: r.status ?? "ACTIVE",
    autoDisable: Boolean(r.auto_disable ?? true),
    failCount: Number(r.fail_count ?? 0),
    protocol: r.protocol ?? "openai",
    tenantId: r.tenant_id,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    deleted: Boolean(r.deleted),
  }
}

export const AigwChannelRepository = {
  async findAll(params?: { status?: string; keyword?: string }): Promise<AigwChannelRow[]> {
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      let query = db.selectFrom("ai_channel" as any).selectAll().where("deleted" as any, "=", false)
      if (params?.status) query = query.where("status" as any, "=", params.status)
      const rows = await query.execute()
      return rows.map(mapFromDb)
    }

    let list = [...MEMORY_STORE].filter((r) => !r.deleted)
    if (params?.status) list = list.filter((r) => r.status === params.status)
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(kw) || r.provider.toLowerCase().includes(kw))
    }
    return list.sort((a, b) => b.priority - a.priority || b.weight - a.weight)
  },

  async findById(id: string): Promise<AigwChannelRow | null> {
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      const r = await db.selectFrom("ai_channel" as any).selectAll().where("id" as any, "=", id).executeTakeFirst()
      if (!r) return null
      return mapFromDb(r)
    }
    return MEMORY_STORE.find((r) => r.id === id && !r.deleted) ?? null
  },

  async create(data: Omit<AigwChannelRow, "id" | "createdAt">): Promise<AigwChannelRow> {
    const now = new Date().toISOString()
    const id = `ch-${Date.now().toString(36)}-${(++memorySeq).toString(36)}`
    const row: AigwChannelRow = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    }
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      await db.insertInto("ai_channel" as any).values({
        id,
        name: data.name,
        provider: data.provider,
        base_url: data.baseUrl,
        api_key: data.apiKey,
        models: JSON.stringify(data.models),
        model_map: JSON.stringify(data.modelMap ?? {}),
        weight: data.weight,
        priority: data.priority,
        status: data.status,
        auto_disable: data.autoDisable,
        fail_count: data.failCount ?? 0,
        protocol: data.protocol,
        tenant_id: data.tenantId ?? "1",
        created_at: now,
        updated_at: now,
        deleted: false,
      }).execute()
    } else {
      MEMORY_STORE.push(row)
    }
    return row
  },

  async update(id: string, data: Partial<AigwChannelRow>): Promise<AigwChannelRow> {
    const existing = await this.findById(id)
    if (!existing) throw new Error(`渠道不存在: ${id}`)
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      const updateData: any = { updated_at: updated.updatedAt }
      if (data.name !== undefined) updateData.name = data.name
      if (data.provider !== undefined) updateData.provider = data.provider
      if (data.baseUrl !== undefined) updateData.base_url = data.baseUrl
      if (data.apiKey !== undefined) updateData.api_key = data.apiKey
      if (data.models !== undefined) updateData.models = JSON.stringify(data.models)
      if (data.modelMap !== undefined) updateData.model_map = JSON.stringify(data.modelMap)
      if (data.weight !== undefined) updateData.weight = data.weight
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.status !== undefined) updateData.status = data.status
      if (data.failCount !== undefined) updateData.fail_count = data.failCount
      await db.updateTable("ai_channel" as any).set(updateData).where("id" as any, "=", id).execute()
    } else {
      const idx = MEMORY_STORE.findIndex((r) => r.id === id)
      if (idx !== -1) MEMORY_STORE[idx] = updated
    }
    return updated
  },

  async delete(id: string): Promise<void> {
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      await db.updateTable("ai_channel" as any).set({ deleted: true, updated_at: new Date().toISOString() }).where("id" as any, "=", id).execute()
    } else {
      const idx = MEMORY_STORE.findIndex((r) => r.id === id)
      if (idx !== -1) MEMORY_STORE[idx].deleted = true
    }
  },
}

export const aigwChannelRepository = AigwChannelRepository

