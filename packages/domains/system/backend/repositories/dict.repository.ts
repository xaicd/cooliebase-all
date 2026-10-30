/**
 * SystemDict Repository - 字典类型 + 字典数据
 */

import { randomUUID } from "node:crypto"
import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import type { PageResult } from "@/modules/shared/backend/lib/database"
import { INIT_DICT_TYPES, INIT_DICT_DATA } from "@prisma/data"

// === 字典类型 ===
export type SystemDictTypeRow = { id: string; name: string; type: string; status: string; remark: string | null; createdAt: string; updatedAt: string }
export type CreateDictTypeData = { name: string; type: string; status?: string; remark?: string }

// === 字典数据 ===
export type SystemDictDataRow = { id: string; dictTypeId: string; label: string; value: string; sort: number; status: string; colorType: string | null; remark: string | null; createdAt: string; updatedAt: string }
export type CreateDictDataInput = { dictTypeId: string; label: string; value: string; sort?: number; status?: string; colorType?: string; remark?: string }

// === 内存存储（从种子数据加载） ===
const DICT_TYPES: SystemDictTypeRow[] = [...INIT_DICT_TYPES]

const DICT_DATA: SystemDictDataRow[] = [...INIT_DICT_DATA]

let typeIdSeq = 100
let dataIdSeq = 100

// === Dict Type Repository ===
export const SystemDictTypeRepository = {
  async findList(params: { page: number; pageSize: number; keyword?: string; status?: string }): Promise<PageResult<SystemDictTypeRow>> {
    if (hasRealDatabase()) return findTypesFromDb(params)
    let filtered = [...DICT_TYPES]
    if (params.keyword) { const kw = params.keyword.toLowerCase(); filtered = filtered.filter((t) => t.name.toLowerCase().includes(kw) || t.type.toLowerCase().includes(kw)) }
    if (params.status) filtered = filtered.filter((t) => t.status === params.status)
    const total = filtered.length
    const start = (params.page - 1) * params.pageSize
    return { items: filtered.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize }
  },

  async findById(id: string): Promise<SystemDictTypeRow | null> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const row = await db.selectFrom("system_dict_type").selectAll().where("id", "=", id).where("deleted", "=", false).executeTakeFirst(); return row ? mapTypeRow(row) : null }
    return DICT_TYPES.find((t) => t.id === id) ?? null
  },

  async findByType(type: string): Promise<SystemDictTypeRow | null> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const row = await db.selectFrom("system_dict_type").selectAll().where("type", "=", type).where("deleted", "=", false).executeTakeFirst(); return row ? mapTypeRow(row) : null }
    return DICT_TYPES.find((t) => t.type === type) ?? null
  },

  async create(data: CreateDictTypeData): Promise<SystemDictTypeRow> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const row = await db.insertInto("system_dict_type").values({ id: (data as any).id ?? randomUUID(), name: data.name, type: data.type, status: data.status ?? "ACTIVE", remark: data.remark ?? null, updated_at: new Date(), deleted: false } as any).returningAll().executeTakeFirstOrThrow(); return mapTypeRow(row) }
    const now = new Date().toISOString()
    const row: SystemDictTypeRow = { id: String(++typeIdSeq), name: data.name, type: data.type, status: data.status ?? "ACTIVE", remark: data.remark ?? null, createdAt: now, updatedAt: now }
    DICT_TYPES.push(row)
    return row
  },

  async update(id: string, data: Partial<CreateDictTypeData>): Promise<SystemDictTypeRow> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const u: Record<string, any> = { updated_at: new Date() }; if (data.name !== undefined) u.name = data.name; if (data.type !== undefined) u.type = data.type; if (data.status !== undefined) u.status = data.status; if (data.remark !== undefined) u.remark = data.remark; const row = await db.updateTable("system_dict_type").set(u).where("id", "=", id).where("deleted", "=", false).returningAll().executeTakeFirstOrThrow(); return mapTypeRow(row) }
    const idx = DICT_TYPES.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`字典类型不存在: ${id}`)
    const t = DICT_TYPES[idx]
    const updated = { ...t, name: data.name ?? t.name, type: data.type ?? t.type, status: data.status ?? t.status, remark: data.remark !== undefined ? (data.remark ?? null) : t.remark, updatedAt: new Date().toISOString() }
    DICT_TYPES[idx] = updated
    return updated
  },

  async delete(id: string): Promise<void> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); await db.updateTable("system_dict_type").set({ deleted: true, updated_at: new Date() }).where("id", "=", id).execute(); return }
    const idx = DICT_TYPES.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`字典类型不存在: ${id}`)
    DICT_TYPES.splice(idx, 1)
  },
}

// === Dict Data Repository ===
export const SystemDictDataRepository = {
  async findByDictTypeId(dictTypeId: string): Promise<SystemDictDataRow[]> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const rows = await db.selectFrom("system_dict_data").selectAll().where("dict_type_id", "=", dictTypeId).where("deleted", "=", false).orderBy("sort", "asc").execute(); return rows.map(mapDataRow) }
    return DICT_DATA.filter((d) => d.dictTypeId === dictTypeId).sort((a, b) => a.sort - b.sort)
  },

  async findByType(type: string): Promise<SystemDictDataRow[]> {
    const dictType = await SystemDictTypeRepository.findByType(type)
    if (!dictType) return []
    return this.findByDictTypeId(dictType.id)
  },

  async findById(id: string): Promise<SystemDictDataRow | null> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const row = await db.selectFrom("system_dict_data").selectAll().where("id", "=", id).where("deleted", "=", false).executeTakeFirst(); return row ? mapDataRow(row) : null }
    return DICT_DATA.find((d) => d.id === id) ?? null
  },

  async create(data: CreateDictDataInput): Promise<SystemDictDataRow> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const row = await db.insertInto("system_dict_data").values({ id: (data as any).id ?? randomUUID(), dict_type_id: data.dictTypeId, label: data.label, value: data.value, sort: data.sort ?? 0, status: data.status ?? "ACTIVE", color_type: data.colorType ?? null, remark: data.remark ?? null, updated_at: new Date(), deleted: false } as any).returningAll().executeTakeFirstOrThrow(); return mapDataRow(row) }
    const now = new Date().toISOString()
    const row: SystemDictDataRow = { id: String(++dataIdSeq), dictTypeId: data.dictTypeId, label: data.label, value: data.value, sort: data.sort ?? 0, status: data.status ?? "ACTIVE", colorType: data.colorType ?? null, remark: data.remark ?? null, createdAt: now, updatedAt: now }
    DICT_DATA.push(row)
    return row
  },

  async update(id: string, data: Partial<CreateDictDataInput>): Promise<SystemDictDataRow> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); const u: Record<string, any> = { updated_at: new Date() }; if (data.label !== undefined) u.label = data.label; if (data.value !== undefined) u.value = data.value; if (data.sort !== undefined) u.sort = data.sort; if (data.status !== undefined) u.status = data.status; if (data.colorType !== undefined) u.color_type = data.colorType; if (data.remark !== undefined) u.remark = data.remark; const row = await db.updateTable("system_dict_data").set(u).where("id", "=", id).where("deleted", "=", false).returningAll().executeTakeFirstOrThrow(); return mapDataRow(row) }
    const idx = DICT_DATA.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error(`字典数据不存在: ${id}`)
    const d = DICT_DATA[idx]
    const updated = { ...d, label: data.label ?? d.label, value: data.value ?? d.value, sort: data.sort ?? d.sort, status: data.status ?? d.status, colorType: data.colorType !== undefined ? (data.colorType ?? null) : d.colorType, remark: data.remark !== undefined ? (data.remark ?? null) : d.remark, updatedAt: new Date().toISOString() }
    DICT_DATA[idx] = updated
    return updated
  },

  async delete(id: string): Promise<void> {
    if (hasRealDatabase()) { const db = await getKyselyDb(); await db.updateTable("system_dict_data").set({ deleted: true, updated_at: new Date() }).where("id", "=", id).execute(); return }
    const idx = DICT_DATA.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error(`字典数据不存在: ${id}`)
    DICT_DATA.splice(idx, 1)
  },
}

// === DB mappers ===
async function findTypesFromDb(params: { page: number; pageSize: number; keyword?: string; status?: string }): Promise<PageResult<SystemDictTypeRow>> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_dict_type").where("deleted", "=", false)
  if (params.keyword) { const kw = `%${params.keyword}%`; query = query.where((eb) => eb.or([eb("name", "like", kw), eb("type", "like", kw)])) }
  if (params.status) query = query.where("status", "=", params.status)
  const countResult = await query.select((eb) => eb.fn.countAll<number>().as("count")).executeTakeFirst()
  const total = Number(countResult?.count ?? 0)
  const offset = (params.page - 1) * params.pageSize
  const rows = await query.selectAll().orderBy("created_at", "desc").offset(offset).limit(params.pageSize).execute()
  return { items: rows.map(mapTypeRow), total, page: params.page, pageSize: params.pageSize }
}

function mapTypeRow(row: any): SystemDictTypeRow {
  return { id: row.id, name: row.name, type: row.type, status: row.status, remark: row.remark, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at) }
}

function mapDataRow(row: any): SystemDictDataRow {
  return { id: row.id, dictTypeId: row.dict_type_id, label: row.label, value: row.value, sort: row.sort, status: row.status, colorType: row.color_type, remark: row.remark, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at) }
}
export const systemDictTypeRepository = SystemDictTypeRepository
export const systemDictDataRepository = SystemDictDataRepository
