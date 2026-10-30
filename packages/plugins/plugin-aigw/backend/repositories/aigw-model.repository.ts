import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import { INIT_AI_MODELS } from "@prisma/data"

export type AigwModelRow = {
  id: string
  name: string
  modelKey: string
  provider: string
  inputRatio: number
  outputRatio: number
  status: "ACTIVE" | "DISABLED"
  sort: number
  description?: string | null
  tenantId?: string | null
  createdAt: string
  updatedAt?: string
  deleted?: boolean
}

const MEMORY_STORE: AigwModelRow[] = JSON.parse(JSON.stringify(INIT_AI_MODELS))
let memorySeq = 100

function mapFromDb(r: any): AigwModelRow {
  return {
    id: r.id,
    name: r.name,
    modelKey: r.model_key ?? r.modelKey,
    provider: r.provider,
    inputRatio: Number(r.input_ratio ?? r.inputRatio ?? 1.0),
    outputRatio: Number(r.output_ratio ?? r.outputRatio ?? 2.0),
    status: r.status ?? "ACTIVE",
    sort: Number(r.sort ?? 0),
    description: r.description,
    tenantId: r.tenant_id ?? r.tenantId,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    deleted: Boolean(r.deleted),
  }
}

export const AigwModelRepository = {
  async findAll(params?: { status?: string; keyword?: string }): Promise<AigwModelRow[]> {
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      let query = db.selectFrom("ai_model" as any).selectAll().where("deleted" as any, "=", false)
      if (params?.status) query = query.where("status" as any, "=", params.status)
      const rows = await query.execute()
      return rows.map(mapFromDb)
    }

    let list = [...MEMORY_STORE].filter((r) => !r.deleted)
    if (params?.status) list = list.filter((r) => r.status === params.status)
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(kw) || r.modelKey.toLowerCase().includes(kw))
    }
    return list.sort((a, b) => a.sort - b.sort)
  },

  async findById(id: string): Promise<AigwModelRow | null> {
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      const r = await db.selectFrom("ai_model" as any).selectAll().where("id" as any, "=", id).executeTakeFirst()
      if (!r) return null
      return mapFromDb(r)
    }
    return MEMORY_STORE.find((r) => r.id === id && !r.deleted) ?? null
  },

  async create(data: Omit<AigwModelRow, "id" | "createdAt">): Promise<AigwModelRow> {
    const now = new Date().toISOString()
    const id = `mod-${Date.now().toString(36)}-${(++memorySeq).toString(36)}`
    const row: AigwModelRow = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    }
    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      await db.insertInto("ai_model" as any).values({
        id,
        name: data.name,
        model_key: data.modelKey,
        provider: data.provider,
        input_ratio: data.inputRatio,
        output_ratio: data.outputRatio,
        status: data.status,
        sort: data.sort,
        description: data.description,
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
}

export const aigwModelRepository = AigwModelRepository

