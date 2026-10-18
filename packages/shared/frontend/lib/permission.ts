import React, { useEffect, useState } from "react"

const ALL_PERMISSION = "*:*:*"

/**
 * 获取当前登录用户的权限码列表
 */
export function getUserPermissions(): string[] {
  if (typeof window === "undefined") return [ALL_PERMISSION]
  try {
    const raw = localStorage.getItem("cooliebase_permissions")
    if (raw) return JSON.parse(raw)
    const userRaw = localStorage.getItem("cooliebase_user")
    if (userRaw) {
      const user = JSON.parse(userRaw)
      if (Array.isArray(user.permissions)) return user.permissions
      if (user.role === "SUPER_ADMIN" || user.id === "1") return [ALL_PERMISSION]
    }
  } catch {}
  return [ALL_PERMISSION] // 开发模式与超管默认放行
}

/**
 * 校验是否具备指定权限码 (对标 CoolieBase v-hasPermi)
 */
export function hasPermission(permission: string | string[]): boolean {
  const permissions = getUserPermissions()
  if (permissions.includes(ALL_PERMISSION)) return true

  if (Array.isArray(permission)) {
    return permission.some((p) => permissions.includes(p))
  }
  return permissions.includes(permission)
}

/**
 * 前端 React Hook: usePermission
 */
export function usePermission() {
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    setPermissions(getUserPermissions())
  }, [])

  const check = (permission: string | string[]) => {
    if (permissions.includes(ALL_PERMISSION)) return true
    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.includes(p))
    }
    return permissions.includes(permission)
  }

  return { permissions, hasPermission: check }
}

/**
 * 权限包装组件
 */
export function HasPermission({
  permission,
  children,
  fallback = null,
}: {
  permission: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}): React.ReactElement | null {
  if (!hasPermission(permission)) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null
  }
  return React.createElement(React.Fragment, null, children)
}

