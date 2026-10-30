/**
 * SystemRole In-Memory Store & Fallback Operations
 */

import type { PageResult } from "@/modules/shared/backend/lib/database"
import { INIT_ROLES } from "@prisma/data"
import type { SystemRoleRow, CreateRoleData, UpdateRoleData, RoleListParams } from "./role.types"

const MEMORY_STORE: SystemRoleRow[] = [...INIT_ROLES]
let memoryIdSeq = 100

export function findRoleListFromMemory(params: RoleListParams, tenantId?: string): PageResult<SystemRoleRow> {
  let filtered = [...MEMORY_STORE]
  if (tenantId) filtered = filtered.filter((r) => r.tenantId === tenantId)
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter((r) => r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw))
  }
  if (params.status) filtered = filtered.filter((r) => r.status === params.status)
  filtered.sort((a, b) => a.sort - b.sort)

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  return { items: filtered.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize }
}

export function findRoleByIdFromMemory(id: string, tenantId?: string): SystemRoleRow | null {
  return MEMORY_STORE.find((r) => r.id === id && (!tenantId || r.tenantId === tenantId)) ?? null
}

export function findRoleByCodeFromMemory(code: string, tenantId?: string): SystemRoleRow | null {
  return MEMORY_STORE.find((r) => r.code === code && (!tenantId || r.tenantId === tenantId)) ?? null
}

export function createRoleInMemory(data: CreateRoleData, tenantId?: string): SystemRoleRow {
  const now = new Date().toISOString()
  const row: SystemRoleRow = {
    id: String(++memoryIdSeq),
    name: data.name,
    code: data.code,
    sort: data.sort ?? 0,
    status: data.status ?? "ACTIVE",
    dataScope: data.dataScope ?? "ALL",
    remark: data.remark ?? null,
    tenantId: tenantId ?? null,
    createdAt: now,
    updatedAt: now,
  }
  MEMORY_STORE.push(row)
  return row
}

export function updateRoleInMemory(id: string, data: UpdateRoleData, tenantId?: string): SystemRoleRow {
  const idx = MEMORY_STORE.findIndex((r) => r.id === id && (!tenantId || r.tenantId === tenantId))
  if (idx === -1) throw new Error(`角色不存在: ${id}`)
  const role = MEMORY_STORE[idx]
  const updated: SystemRoleRow = {
    ...role,
    name: data.name ?? role.name,
    code: data.code ?? role.code,
    sort: data.sort ?? role.sort,
    status: data.status ?? role.status,
    dataScope: data.dataScope ?? role.dataScope,
    remark: data.remark !== undefined ? (data.remark ?? null) : role.remark,
    updatedAt: new Date().toISOString(),
  }
  MEMORY_STORE[idx] = updated
  return updated
}

export function deleteRoleInMemory(id: string, tenantId?: string): void {
  const idx = MEMORY_STORE.findIndex((r) => r.id === id && (!tenantId || r.tenantId === tenantId))
  if (idx === -1) throw new Error(`角色不存在: ${id}`)
  if (MEMORY_STORE[idx].code === "super_admin") throw new Error("不允许删除超级管理员角色")
  MEMORY_STORE.splice(idx, 1)
}
