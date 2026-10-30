/**
 * SystemMenu Repository - 树形菜单/权限
 */

import { randomUUID } from "node:crypto"
import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import { withCompanionMenuCatalogs, withCompanionPackageMenuIds } from "@/modules/shared/backend/constants/companion-menu"
import { INIT_MENUS } from "@prisma/data"

import {
  type SystemMenuRow,
  type CreateMenuData,
  type UpdateMenuData,
  LEGACY_PURGE_IDS,
} from "./menu.types"

export type { SystemMenuRow, CreateMenuData, UpdateMenuData }

// === 内存存储（由 CoolieBase 原始 SQL 全量生成 + Online 扩展 + AIGW 模型中台 + AI 应用） ===
const MEMORY_STORE: SystemMenuRow[] = withCompanionMenuCatalogs(INIT_MENUS)

let memoryIdSeq = 5000

export const SystemMenuRepository = {
  async findAll(params?: { status?: string }): Promise<SystemMenuRow[]> {
    const raw = hasRealDatabase() ? await findAllFromDb(params) : [...MEMORY_STORE]
    let filtered = raw.filter((m) => !LEGACY_PURGE_IDS.has(m.id) && (!m.parentId || !LEGACY_PURGE_IDS.has(m.parentId)))
    if (params?.status) filtered = filtered.filter((m) => m.status === params.status)
    return filtered.sort((a, b) => a.sort - b.sort)
  },

  async findById(id: string): Promise<SystemMenuRow | null> {
    if (LEGACY_PURGE_IDS.has(id)) return null
    if (hasRealDatabase()) return findByIdFromDb(id)
    return MEMORY_STORE.find((m) => m.id === id) ?? null
  },

  async create(data: CreateMenuData): Promise<SystemMenuRow> {
    if (hasRealDatabase()) return createInDb(data)
    const now = new Date().toISOString()
    const row: SystemMenuRow = {
      id: String(++memoryIdSeq),
      name: data.name,
      permission: data.permission ?? null,
      type: data.type,
      parentId: data.parentId ?? null,
      path: data.path ?? null,
      component: data.component ?? null,
      icon: data.icon ?? null,
      sort: data.sort ?? 0,
      status: data.status ?? "ACTIVE",
      visible: data.visible ?? true,
      keepAlive: data.keepAlive ?? true,
      createdAt: now,
      updatedAt: now,
    }
    MEMORY_STORE.push(row)
    return row
  },

  async update(id: string, data: UpdateMenuData): Promise<SystemMenuRow> {
    if (hasRealDatabase()) return updateInDb(id, data)
    const idx = MEMORY_STORE.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error(`菜单不存在: ${id}`)
    const menu = MEMORY_STORE[idx]
    const updated: SystemMenuRow = {
      ...menu,
      name: data.name ?? menu.name,
      permission: data.permission !== undefined ? (data.permission ?? null) : menu.permission,
      type: data.type ?? menu.type,
      parentId: data.parentId !== undefined ? (data.parentId ?? null) : menu.parentId,
      path: data.path !== undefined ? (data.path ?? null) : menu.path,
      component: data.component !== undefined ? (data.component ?? null) : menu.component,
      icon: data.icon !== undefined ? (data.icon ?? null) : menu.icon,
      sort: data.sort ?? menu.sort,
      status: data.status ?? menu.status,
      visible: data.visible ?? menu.visible,
      keepAlive: data.keepAlive ?? menu.keepAlive,
      updatedAt: new Date().toISOString(),
    }
    MEMORY_STORE[idx] = updated
    return updated
  },

  async delete(id: string): Promise<void> {
    if (hasRealDatabase()) return deleteInDb(id)
    const hasChildren = MEMORY_STORE.some((m) => m.parentId === id)
    if (hasChildren) throw new Error("该菜单下存在子菜单，无法删除")
    const idx = MEMORY_STORE.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error(`菜单不存在: ${id}`)
    MEMORY_STORE.splice(idx, 1)
  },
}

// === Kysely 实现 ===
async function findAllFromDb(params?: { status?: string }): Promise<SystemMenuRow[]> {
  const db = await getKyselyDb()
  let query = db.selectFrom("system_menu").where("deleted", "=", false)
  if (params?.status) query = query.where("status", "=", params.status)
  const rows = await query.selectAll().orderBy("sort", "asc").execute()
  return rows.map(mapDbRow)
}

async function findByIdFromDb(id: string): Promise<SystemMenuRow | null> {
  const db = await getKyselyDb()
  const row = await db.selectFrom("system_menu").selectAll().where("id", "=", id).where("deleted", "=", false).executeTakeFirst()
  return row ? mapDbRow(row) : null
}

async function createInDb(data: CreateMenuData): Promise<SystemMenuRow> {
  const db = await getKyselyDb()
  const row = await db.insertInto("system_menu").values({
    id: (data as any).id ?? randomUUID(),
    name: data.name,
    permission: data.permission ?? null,
    type: data.type,
    parent_id: data.parentId ?? null,
    path: data.path ?? null,
    component: data.component ?? null,
    icon: data.icon ?? null,
    sort: data.sort ?? 0,
    status: data.status ?? "ACTIVE",
    visible: data.visible ?? true,
    keep_alive: data.keepAlive ?? true,
    updated_at: new Date(),
    deleted: false,
  } as any).returningAll().executeTakeFirstOrThrow()
  return mapDbRow(row)
}

async function updateInDb(id: string, data: UpdateMenuData): Promise<SystemMenuRow> {
  const db = await getKyselyDb()
  const updateData: Record<string, any> = { updated_at: new Date() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.permission !== undefined) updateData.permission = data.permission
  if (data.type !== undefined) updateData.type = data.type
  if (data.parentId !== undefined) updateData.parent_id = data.parentId
  if (data.path !== undefined) updateData.path = data.path
  if (data.component !== undefined) updateData.component = data.component
  if (data.icon !== undefined) updateData.icon = data.icon
  if (data.sort !== undefined) updateData.sort = data.sort
  if (data.status !== undefined) updateData.status = data.status
  if (data.visible !== undefined) updateData.visible = data.visible
  if (data.keepAlive !== undefined) updateData.keep_alive = data.keepAlive

  const row = await db.updateTable("system_menu").set(updateData).where("id", "=", id).where("deleted", "=", false).returningAll().executeTakeFirstOrThrow()
  return mapDbRow(row)
}

async function deleteInDb(id: string): Promise<void> {
  const db = await getKyselyDb()
  const children = await db.selectFrom("system_menu").select("id").where("parent_id", "=", id).where("deleted", "=", false).execute()
  if (children.length > 0) throw new Error("该菜单下存在子菜单，无法删除")
  await db.updateTable("system_menu").set({ deleted: true, updated_at: new Date() }).where("id", "=", id).execute()
}

function mapDbRow(row: any): SystemMenuRow {
  return {
    id: row.id,
    name: row.name,
    permission: row.permission,
    type: row.type,
    parentId: row.parent_id,
    path: row.path,
    component: row.component,
    icon: row.icon,
    sort: row.sort,
    status: row.status,
    visible: Boolean(row.visible),
    keepAlive: Boolean(row.keep_alive),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}
export const systemMenuRepository = SystemMenuRepository
