/**
 * System Auth Service
 *
 * 登录/鉴权/权限信息
 * 使用 Repository 模式，不直接依赖 Prisma Client
 */

import type { LoginInput } from "@/modules/system/backend/validators"
import { SystemUserRepository } from "@/modules/system/backend/repositories/user.repository"
import { SystemMenuRepository } from "@/modules/system/backend/repositories/menu.repository"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { issueJwt, verifyJwt, type JwtPayload } from "@/modules/shared/backend/auth/jwt"
import { registerAdminSession, revokeAdminSession, revokeAdminSessionsForUser } from "@/modules/shared/backend/auth/session-registry"
import { getPlatformRole, isPlatformUsername } from "@/modules/shared/backend/lib/biz-tenant"
import { isDependencyUnavailable } from "@/modules/shared/backend/http/api-error"
import { summarizeError } from "@/modules/shared/backend/lib/observability"
import {
  verifyPasswordCheck,
  resolveLoginRoles,
  resolveLoginTenantId,
  requireUsableTenant,
  getEffectivePermissions,
  buildMenuTree,
} from "./auth-permission.helper"

type TokenPayload = JwtPayload

export class SystemAuthService {
  /** 登录 */
  static async login(input: LoginInput) {
    domainLog.event("system.auth.login.attempt", { username: input.username })

    let stage = "tenant_lookup"
    try {
      const tenantId = await resolveLoginTenantId(input.tenantCode)
      if (!tenantId && !isPlatformUsername(input.username)) throw new Error("租户账号登录必须填写租户标识")
      stage = "user_lookup"
      const user = await SystemUserRepository.findByUsername(input.username, tenantId)
      if (!user) {
        domainLog.audit("system.auth.login.fail", { targetType: "USER", targetId: input.username, reason: "not_found" })
        throw new Error("用户名或密码错误")
      }

      if (user.status !== "ACTIVE") {
        domainLog.audit("system.auth.login.fail", { targetType: "USER", targetId: user.id, reason: "disabled" })
        throw new Error("账号已禁用，请联系管理员")
      }

      const valid = verifyPasswordCheck(input.password, user.password, user.salt)
      if (!valid) {
        domainLog.audit("system.auth.login.fail", { targetType: "USER", targetId: user.id, reason: "wrong_password" })
        throw new Error("用户名或密码错误")
      }

      stage = "permission_load"
      const roles = resolveLoginRoles(user.username)
      const { permissions } = await getEffectivePermissions(user, roles)

      // Full CoolieBase menu catalogs can contain thousands of button permissions. A platform
      // administrator is already explicitly authorized by role, so store one wildcard in
      // the JWT instead of an oversized Authorization header that proxies reject with 431.
      const jwtPermissions = roles.includes(getPlatformRole()) ? ["*"] : permissions
      if (process.env.TENANT_MODE === "required" && !roles.includes(getPlatformRole()) && !user.tenantId) {
        throw new Error("账号未绑定租户")
      }

      // 签发 JWT
      const { token, expiresIn, jti } = issueJwt({
        sub: user.id,
        username: user.username,
        permissions: jwtPermissions,
        roles,
        tenantId: user.tenantId ?? undefined,
        type: "admin",
      })
      registerAdminSession({
        sessionId: jti,
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        userIp: "unknown",
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      })

      domainLog.audit("system.auth.login.success", { targetType: "USER", targetId: user.id })

      return {
        token,
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
        },
      }
    } catch (error) {
      if (isDependencyUnavailable(error)) {
        const diagnostic = summarizeError(error)
        domainLog.audit("system.auth.login.error", { targetType: "USER", targetId: input.username, reason: "dependency_unavailable", stage, errorCode: diagnostic.code ?? "DEPENDENCY_UNAVAILABLE" })
      }
      throw error
    }
  }

  /** 获取当前用户权限信息 */
  static async getPermissionInfo(userId: string) {
    const user = await SystemUserRepository.findById(userId)
    if (!user) throw new Error("用户不存在")

    const roles = resolveLoginRoles(user.username)
    const { menuIds, permissions } = await getEffectivePermissions(user, roles)
    const allowedMenus = (await SystemMenuRepository.findAll({ status: "ACTIVE" }))
      .filter((menu) => menuIds.has(menu.id))

    // 菜单树
    const menus = buildMenuTree(allowedMenus)

    domainLog.event("system.auth.permissionInfo", { userId })

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      roles,
      permissions,
      menus,
    }
  }

  /** 验证 token 并返回用户信息 */
  static async verifyToken(token: string): Promise<TokenPayload> {
    return verifyJwt(token, "admin")
  }

  /** 刷新 token */
  static async refreshToken(token: string) {
    const payload = verifyJwt(token, "admin")
    const user = await SystemUserRepository.findById(payload.sub)
    if (!user) throw new Error("用户不存在")
    await requireUsableTenant(user, payload.roles.includes(getPlatformRole()))
    if (payload.jti) revokeAdminSession(payload.jti)
    const issued = issueJwt({
      sub: payload.sub,
      username: payload.username,
      permissions: payload.permissions,
      roles: payload.roles,
      tenantId: payload.tenantId,
      type: "admin",
    })
    registerAdminSession({
      sessionId: issued.jti,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      userIp: "unknown",
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + issued.expiresIn * 1000).toISOString(),
    })
    return issued
  }

  static async getPermissionInfoByUser(input: { userId: string }) {
    return this.getPermissionInfo(input.userId)
  }

  static async refreshAccessToken(input: { token: string }) {
    return this.refreshToken(input.token)
  }

  static async logout(input: { jti?: string; userId?: string } = {}) {
    if (input.jti) revokeAdminSession(input.jti)
    else if (input.userId) revokeAdminSessionsForUser(input.userId)
    return { message: "已退出" }
  }
}

export const systemAuthService = SystemAuthService
