/**
 * InfraConfig Repository - 系统配置
 */

import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import type { PageResult } from "@/modules/shared/backend/lib/database"

export type InfraConfigRow = {
  id: string
  category: string
  name: string
  configKey: string
  value: string
  visible: boolean
  remark: string | null
  createdAt: string
  updatedAt: string
}

export type CreateConfigData = { category?: string; name: string; configKey: string; value: string; visible?: boolean; remark?: string }
export type UpdateConfigData = Partial<Omit<CreateConfigData, "configKey">> & { value?: string }
export type ConfigListParams = { page: number; pageSize: number; keyword?: string; category?: string }

// === 内存存储 ===
/**
 * infra 默认配置。
 *
 * **导出**是因为它同时是内存回退的初值**和**数据库种子的真源 ——
 * 此前只在内存侧有，于是同一批用例在内存模式全绿、连真实库必挂
 * （`配置项不存在: sys.application.name`）。两条路径必须来自同一份数据。
 */
export const INFRA_CONFIG_DEFAULTS: InfraConfigRow[] = [
  { id: "1", category: "DEFAULT", name: "系统名称", configKey: "sys.application.name", value: "cooliebase-all-base", visible: true, remark: "系统应用名称", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "2", category: "DEFAULT", name: "系统版本", configKey: "sys.application.version", value: "0.1.0", visible: true, remark: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "3", category: "AUTH", name: "Token 有效期(秒)", configKey: "sys.auth.token.expire", value: "86400", visible: true, remark: "JWT 令牌有效期", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "4", category: "AUTH", name: "验证码开关", configKey: "sys.auth.captcha.enable", value: "true", visible: true, remark: "登录验证码是否开启", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "5", category: "FILE", name: "文件上传大小限制(MB)", configKey: "sys.file.maxSize", value: "50", visible: true, remark: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
]
const MEMORY_STORE: InfraConfigRow[] = [...INFRA_CONFIG_DEFAULTS]
let memoryIdSeq = 100

export const InfraConfigRepository = {
  async findList(params: ConfigListParams): Promise<PageResult<InfraConfigRow>> {
    if (hasRealDatabase()) return findListFromDb(params)
    let filtered = [...MEMORY_STORE]
    if (params.keyword) { const kw = params.keyword.toLowerCase(); filtered = filtered.filter((c) => c.name.toLowerCase().includes(kw) || c.configKey.toLowerCase().includes(kw)) }
    if (params.category) filtered = filtered.filter((c) => c.category === params.category)
    const total = filtered.length
    const start = (params.page - 1) * params.pageSize
    return { items: filtered.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize }
  },

  async findById(id: string): Promise<InfraConfigRow | null> {
    if (hasRealDatabase()) return findByIdFromDb(id)
    return MEMORY_STORE.find((c) => c.id === id) ?? null
  },

  async findByKey(key: string): Promise<InfraConfigRow | null> {
    if (hasRealDatabase()) return findByKeyFromDb(key)
    return MEMORY_STORE.find((c) => c.configKey === key) ?? null
  },

  async create(data: CreateConfigData): Promise<InfraConfigRow> {
    if (hasRealDatabase()) return createInDb(data)
    const now = new Date().toISOString()
    const row: InfraConfigRow = { id: String(++memoryIdSeq), category: data.category ?? "DEFAULT", name: data.name, configKey: data.configKey, value: data.value, visible: data.visible ?? true, remark: data.remark ?? null, createdAt: now, updatedAt: now }
    MEMORY_STORE.push(row)
    return row
  },

  async update(id: string, data: UpdateConfigData): Promise<InfraConfigRow> {
    if (hasRealDatabase()) return updateInDb(id, data)
    const idx = MEMORY_STORE.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`配置不存在: ${id}`)
    const config = MEMORY_STORE[idx]
    const updated: InfraConfigRow = { ...config, name: data.name ?? config.name, category: data.category ?? config.category, value: data.value ?? config.value, visible: data.visible ?? config.visible, remark: data.remark !== undefined ? (data.remark ?? null) : config.remark, updatedAt: new Date().toISOString() }
    MEMORY_STORE[idx] = updated
    return updated
  },

  async delete(id: string): Promise<void> {
    if (hasRealDatabase()) return deleteInDb(id)
    const idx = MEMORY_STORE.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`配置不存在: ${id}`)
    MEMORY_STORE.splice(idx, 1)
  },

  /** 通过 key 获取 value（运行时配置读取） */
  async getValue(key: string): Promise<string | null> {
    const row = await this.findByKey(key)
    return row?.value ?? null
  },
}

// === Kysely ===
async function findListFromDb(params: ConfigListParams): Promise<PageResult<InfraConfigRow>> {
  const db = await getKyselyDb()
  let query = db.selectFrom("infra_config").where("deleted", "=", false)
  if (params.keyword) { const kw = `%${params.keyword}%`; query = query.where((eb) => eb.or([eb("name", "like", kw), eb("config_key", "like", kw)])) }
  if (params.category) query = query.where("category", "=", params.category)
  const countResult = await query.select((eb) => eb.fn.countAll<number>().as("count")).executeTakeFirst()
  const total = Number(countResult?.count ?? 0)
  const offset = (params.page - 1) * params.pageSize
  const rows = await query.selectAll().orderBy("created_at", "desc").offset(offset).limit(params.pageSize).execute()
  return { items: rows.map(mapRow), total, page: params.page, pageSize: params.pageSize }
}

async function findByIdFromDb(id: string): Promise<InfraConfigRow | null> {
  const db = await getKyselyDb()
  const row = await db.selectFrom("infra_config").selectAll().where("id", "=", id).where("deleted", "=", false).executeTakeFirst()
  return row ? mapRow(row) : null
}

async function findByKeyFromDb(key: string): Promise<InfraConfigRow | null> {
  const db = await getKyselyDb()
  const row = await db.selectFrom("infra_config").selectAll().where("config_key", "=", key).where("deleted", "=", false).executeTakeFirst()
  return row ? mapRow(row) : null
}

async function createInDb(data: CreateConfigData): Promise<InfraConfigRow> {
  const db = await getKyselyDb()
  const id = `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const row = await db.insertInto("infra_config").values({ id, category: data.category ?? "DEFAULT", name: data.name, config_key: data.configKey, value: data.value, visible: data.visible ?? true, remark: data.remark ?? null, updated_at: new Date(), deleted: false } as any).returningAll().executeTakeFirstOrThrow()
  return mapRow(row)
}

async function updateInDb(id: string, data: UpdateConfigData): Promise<InfraConfigRow> {
  const db = await getKyselyDb()
  const u: Record<string, any> = { updated_at: new Date() }
  if (data.name !== undefined) u.name = data.name
  if (data.category !== undefined) u.category = data.category
  if (data.value !== undefined) u.value = data.value
  if (data.visible !== undefined) u.visible = data.visible
  if (data.remark !== undefined) u.remark = data.remark
  const row = await db.updateTable("infra_config").set(u).where("id", "=", id).where("deleted", "=", false).returningAll().executeTakeFirstOrThrow()
  return mapRow(row)
}

async function deleteInDb(id: string): Promise<void> {
  const db = await getKyselyDb()
  await db.updateTable("infra_config").set({ deleted: true, updated_at: new Date() }).where("id", "=", id).execute()
}

function mapRow(row: any): InfraConfigRow {
  return { id: row.id, category: row.category, name: row.name, configKey: row.config_key, value: row.value, visible: Boolean(row.visible), remark: row.remark, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at) }
}
export const infraConfigRepository = InfraConfigRepository
