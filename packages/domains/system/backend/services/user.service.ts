/**
 * System User Service
 *
 * 职责：业务编排、校验、日志审计
 * 数据访问：委托给 UserRepository（支持多数据库）
 */

import type {
  UserListQueryInput,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserPasswordInput,
} from "@/modules/system/backend/validators"
import { SystemUserRepository } from "@/modules/system/backend/repositories/user.repository"
import { SystemPermissionService } from "@/modules/system/backend/services/permission.service"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { getCurrentTenantId } from "@/modules/shared/backend/lib/biz-tenant"
import {
  requireCurrentTenantDept,
  requireCurrentTenantPosts,
  requireTenantAccountCapacity,
  assertUsernameAvailable,
  encodeUserPassword,
} from "./user-capacity.guard"

/** 对外返回的用户行：**剔除口令材料**（`password` 哈希与 `salt`），永不出口。 */
function sanitizeUser<T extends { password?: string; salt?: string }>(row: T): Omit<T, "password" | "salt"> {
  const { password: _password, salt: _salt, ...rest } = row
  return rest
}

export class SystemUserService {
  /** 分页列表 */
  static async list(input: UserListQueryInput) {
    const result = await SystemUserRepository.findList({
      page: input.page,
      pageSize: input.pageSize,
      keyword: input.keyword,
      status: input.status,
      deptId: input.deptId,
    })
    domainLog.event("system.user.list", { page: input.page, pageSize: input.pageSize, total: result.total })
    // **口令材料绝不出接口**：实测此前 `GET /api/v1/admin/system/users` 把
    // `password`（md5(md5(pwd)+salt)）和 `salt` 原样吐给前端。
    return { ...result, items: result.items.map(sanitizeUser) }
  }

  /** 获取用户详情 */
  static async getById(id: string) {
    const user = await SystemUserRepository.findById(id)
    if (!user) throw new Error(`用户不存在: ${id}`)

    const rest = sanitizeUser(user)
    const [roleIds, postIds] = await Promise.all([
      SystemPermissionService.getUserRoleIds(id),
      SystemUserRepository.findPostIdsByUserId(id),
    ])
    return { ...rest, roleIds, postIds }
  }

  /** 创建用户 */
  static async create(input: CreateUserInput) {
    await assertUsernameAvailable(input.username)
    const targetTenantId = getCurrentTenantId() ?? null
    await requireCurrentTenantDept(input.deptId, targetTenantId)
    await requireCurrentTenantPosts(input.postIds, targetTenantId)
    await requireTenantAccountCapacity()

    const { hashedPassword, salt } = encodeUserPassword(input.password)
    const user = await SystemUserRepository.create({
      username: input.username,
      nickname: input.nickname,
      password: hashedPassword,
      salt,
      phone: input.phone,
      email: input.email || undefined,
      deptId: input.deptId,
      status: input.status,
      remark: input.remark,
    })

    if (input.roleIds !== undefined) {
      await SystemPermissionService.assignUserRole({ userId: user.id, roleIds: input.roleIds })
    }
    if (input.postIds !== undefined) {
      await SystemUserRepository.replacePosts(user.id, input.postIds)
    }

    domainLog.event("system.user.create", { userId: user.id, username: user.username, postCount: input.postIds?.length ?? 0 })
    domainLog.audit("system.user.create", { targetType: "USER", targetId: user.id, username: user.username })
    return { id: user.id }
  }

  /** 更新用户 */
  static async update(input: UpdateUserInput) {
    const existing = await SystemUserRepository.findById(input.id)
    if (!existing) throw new Error(`用户不存在: ${input.id}`)

    if (input.username && input.username !== existing.username) {
      await assertUsernameAvailable(input.username, input.id)
    }

    await requireCurrentTenantDept(input.deptId, existing.tenantId)
    await requireCurrentTenantPosts(input.postIds, existing.tenantId)

    await SystemUserRepository.update(input.id, {
      username: input.username,
      nickname: input.nickname,
      phone: input.phone,
      email: input.email || undefined,
      deptId: input.deptId,
      status: input.status,
      remark: input.remark,
    })

    if (input.roleIds !== undefined) {
      await SystemPermissionService.assignUserRole({ userId: input.id, roleIds: input.roleIds })
    }
    if (input.postIds !== undefined) {
      await SystemUserRepository.replacePosts(input.id, input.postIds)
    }

    domainLog.event("system.user.update", { userId: input.id, postCount: input.postIds?.length })
    domainLog.audit("system.user.update", { targetType: "USER", targetId: input.id })
    return { id: input.id }
  }

  /** 重置密码 */
  static async resetPassword(input: UpdateUserPasswordInput) {
    const existing = await SystemUserRepository.findById(input.id)
    if (!existing) throw new Error(`用户不存在: ${input.id}`)

    const { hashedPassword, salt } = encodeUserPassword(input.password)
    await SystemUserRepository.update(input.id, { password: hashedPassword, salt })

    domainLog.event("system.user.resetPassword", { userId: input.id })
    domainLog.audit("system.user.resetPassword", { targetType: "USER", targetId: input.id })
    return { success: true }
  }

  /** 删除用户 */
  static async delete(id: string) {
    const existing = await SystemUserRepository.findById(id)
    if (!existing) throw new Error(`用户不存在: ${id}`)
    if (existing.username === "supervip" || existing.username === "admin") {
      throw new Error("不允许删除超级管理员")
    }

    await SystemUserRepository.delete(id)
    domainLog.event("system.user.delete", { userId: id })
    domainLog.audit("system.user.delete", { targetType: "USER", targetId: id })
    return { success: true }
  }

  /** 修改状态 */
  static async updateStatus(id: string, status: "ACTIVE" | "DISABLED") {
    const existing = await SystemUserRepository.findById(id)
    if (!existing) throw new Error(`用户不存在: ${id}`)

    await SystemUserRepository.update(id, { status })
    domainLog.event("system.user.updateStatus", { userId: id, status })
    domainLog.audit("system.user.updateStatus", { targetType: "USER", targetId: id, newStatus: status })
    return { success: true }
  }

  static async getUser(input: { id: string }) { return this.getById(input.id) }
  static async deleteUser(input: { id: string }) { return this.delete(input.id) }
  static async updateUserStatus(input: { id: string; status: "ACTIVE" | "DISABLED" }) { return this.updateStatus(input.id, input.status) }
}

// Alias for codegen-generated routes
export { SystemUserService as UserService }
