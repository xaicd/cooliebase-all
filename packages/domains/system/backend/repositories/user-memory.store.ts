/**
 * SystemUser In-Memory Store & Fallback Operations
 */

import type { PageResult } from "@/modules/shared/backend/lib/database"
import { overlayUserNickname } from "@/modules/shared/contract/project-profile-overlay"
import { projectProfile } from "@/modules/shared/contract/project-profile"
import { hashPassword } from "@/modules/shared/backend/lib/crypto"
import { INIT_USERS } from "@prisma/data"
import type { SystemUserRow, CreateUserData, UpdateUserData, UserListParams } from "./user.types"

/**
 * 内存模式引导管理员的固定 id。
 * `permission.repository.ts` 的内存 RBAC 绑定要引用它（否则登录后侧栏为空）。
 */
export const MEMORY_BOOTSTRAP_ADMIN_ID = "0"

/**
 * 内存模式（无真实库）下也必须存在**引导管理员**。
 *
 * 否则 `.env.local` 预填的 `ADMIN_BOOTSTRAP_USERNAME/PASSWORD` 在登录时查无此人，
 * 永远报「用户名或密码错误」—— 交付物在内存模式下根本进不去（实测 supervip 即如此）。
 * 取值与 PostgreSQL 种子 `scripts/seed-postgresql.ts` 同源同规则；有真实库时不会走到这里。
 */
function bootstrapAdminFromEnv(): SystemUserRow | null {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD
  const salt = process.env.ADMIN_BOOTSTRAP_SALT
  if (!username || !password || !salt) return null
  const template = INIT_USERS[0]
  const now = "2026-01-01T00:00:00.000Z"
  return {
    id: MEMORY_BOOTSTRAP_ADMIN_ID,
    username,
    nickname: overlayUserNickname(username, projectProfile.bootstrapAdmin.nickname),
    password: hashPassword(password, salt),
    salt,
    phone: template?.phone ?? null,
    email: template?.email ?? null,
    avatar: null,
    status: "ACTIVE",
    deptId: template?.deptId ?? null,
    remark: "内存模式引导管理员（与 PostgreSQL 种子同源）",
    tenantId: template?.tenantId ?? "1",
    createdAt: now,
    updatedAt: now,
  }
}

const BOOTSTRAP_ADMIN = bootstrapAdminFromEnv()
const MEMORY_STORE: SystemUserRow[] = [
  ...INIT_USERS.map((user) => ({
    ...user,
    nickname: overlayUserNickname(user.username, user.nickname),
  })),
  ...(BOOTSTRAP_ADMIN ? [BOOTSTRAP_ADMIN] : []),
]
const MEMORY_USER_POSTS = new Map<string, Set<string>>()
let memoryIdSeq = 100

function generateId(): string {
  return String(++memoryIdSeq)
}

export function findUserListFromMemory(params: UserListParams): PageResult<SystemUserRow> {
  let filtered = [...MEMORY_STORE]

  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(kw) ||
        u.nickname.toLowerCase().includes(kw) ||
        (u.phone ?? "").includes(kw) ||
        (u.email ?? "").toLowerCase().includes(kw),
    )
  }
  if (params.status) filtered = filtered.filter((u) => u.status === params.status)
  if (params.deptId) filtered = filtered.filter((u) => u.deptId === params.deptId)
  if (params.tenantId) filtered = filtered.filter((u) => u.tenantId === params.tenantId)

  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const items = filtered.slice(start, start + params.pageSize)

  return { items, total, page: params.page, pageSize: params.pageSize }
}

export function findUserByIdFromMemory(id: string, tenantId?: string): SystemUserRow | null {
  return MEMORY_STORE.find((u) => u.id === id && (!tenantId || u.tenantId === tenantId)) ?? null
}

export function findUserByUsernameFromMemory(username: string, tenantId?: string): SystemUserRow | null {
  return MEMORY_STORE.find((u) => u.username === username && (!tenantId || u.tenantId === tenantId)) ?? null
}

export function createUserDataInMemory(data: CreateUserData): SystemUserRow {
  const now = new Date().toISOString()
  const row: SystemUserRow = {
    id: generateId(),
    username: data.username,
    nickname: data.nickname,
    password: data.password,
    salt: data.salt,
    phone: data.phone ?? null,
    email: data.email ?? null,
    avatar: null,
    status: data.status ?? "ACTIVE",
    deptId: data.deptId ?? null,
    remark: data.remark ?? null,
    tenantId: data.tenantId ?? null,
    createdAt: now,
    updatedAt: now,
  }
  MEMORY_STORE.push(row)
  return row
}

export function updateUserDataInMemory(id: string, data: UpdateUserData, tenantId?: string): SystemUserRow {
  const idx = MEMORY_STORE.findIndex((u) => u.id === id && (!tenantId || u.tenantId === tenantId))
  if (idx === -1) throw new Error(`用户不存在: ${id}`)

  const user = MEMORY_STORE[idx]
  const updated: SystemUserRow = {
    ...user,
    username: data.username ?? user.username,
    nickname: data.nickname ?? user.nickname,
    password: data.password ?? user.password,
    salt: data.salt ?? user.salt,
    phone: data.phone !== undefined ? (data.phone ?? null) : user.phone,
    email: data.email !== undefined ? (data.email ?? null) : user.email,
    deptId: data.deptId !== undefined ? (data.deptId ?? null) : user.deptId,
    status: data.status ?? user.status,
    remark: data.remark !== undefined ? (data.remark ?? null) : user.remark,
    updatedAt: new Date().toISOString(),
  }
  MEMORY_STORE[idx] = updated
  return updated
}

export function deleteUserDataInMemory(id: string, tenantId?: string): void {
  const idx = MEMORY_STORE.findIndex((u) => u.id === id && (!tenantId || u.tenantId === tenantId))
  if (idx === -1) throw new Error(`用户不存在: ${id}`)
  MEMORY_STORE.splice(idx, 1)
  MEMORY_USER_POSTS.delete(id)
}

export function countUsersFromMemory(params?: { status?: string; tenantId?: string }): number {
  let filtered = [...MEMORY_STORE]
  if (params?.status) filtered = filtered.filter((u) => u.status === params.status)
  if (params?.tenantId) filtered = filtered.filter((u) => u.tenantId === params.tenantId)
  return filtered.length
}

export function getMemoryUserPostIds(userId: string): string[] {
  return [...(MEMORY_USER_POSTS.get(userId) ?? [])]
}

export function setMemoryUserPostIds(userId: string, postIds: string[]): void {
  MEMORY_USER_POSTS.set(userId, new Set(postIds))
}
