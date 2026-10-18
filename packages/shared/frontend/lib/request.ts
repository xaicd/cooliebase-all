/**
 * 统一请求客户端 (支持 Axios 函数式与 RequestClient 对象式双模调用)
 *
 * 功能：
 * - 自动附加 Authorization header
 * - Token 过期自动跳转登录
 * - 统一响应解析
 * - 兼容 request({ url, method, params, data }) 与 request.get(url, config) 双重语法
 */

type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  messageKey?: string
  retryable?: boolean
  traceId?: string
  details?: Array<{ field: string; code: string; messageKey: string; message: string }>
}

type RequestOptions = {
  url?: string
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "get" | "post" | "put" | "delete" | "patch"
  params?: any
  data?: any
  body?: any
  headers?: Record<string, string>
  noAuth?: boolean
}

/**
 * 预览子路径前缀（B2：同域名 path 前缀预览）。
 *
 * 由 next.config.mjs 通过 NEXT_PUBLIC_BASE_PATH 注入。Next.js 的 basePath 会自动给
 * Link/router/_next/API routes 加前缀，但**不会**改写代码里手写的 `fetch("/api/...")` 字符串，
 * 因此这些手写请求必须用 apiPath() 拼上前缀。未配置时返回原路径，行为不变。
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "")

/** 给以 / 开头的同源路径拼上预览子路径前缀（幂等：已带前缀则不重复拼） */
export function apiPath(path: string): string {
  if (!BASE_PATH) return path
  if (typeof path !== "string" || !path.startsWith("/")) return path
  if (path === BASE_PATH || path.startsWith(BASE_PATH + "/")) return path
  return BASE_PATH + path
}

class RequestClient {
  private baseUrl = BASE_PATH

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("cooliebase_token")
  }

  private handleUnauthorized() {
    if (typeof window === "undefined") return
    localStorage.removeItem("cooliebase_token")
    localStorage.removeItem("cooliebase_user")
    const current = window.location.pathname
    const loginPath = apiPath("/login")
    if (current !== loginPath) {
      window.location.href = loginPath + "?redirect=" + encodeURIComponent(current)
    }
  }

  async request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, noAuth = false } = options

    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    }

    if (!noAuth) {
      const token = this.getToken()
      if (token) {
        finalHeaders["Authorization"] = `Bearer ${token}`
      }
    }

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: finalHeaders,
    }

    if (body && method.toUpperCase() !== "GET") {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(this.baseUrl + url, fetchOptions)

      if (response.status === 401 && !noAuth) {
        this.handleUnauthorized()
        return { success: false, error: "登录已过期，请重新登录" }
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      return { success: false, error: error?.message ?? "网络异常" }
    }
  }
}

const clientInstance = new RequestClient()

/** 兼容双模调用的请求主入口 */
function requestCore<T = any>(
  urlOrConfig: string | (RequestOptions & { url: string }),
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  if (typeof urlOrConfig === "string") {
    let finalUrl = urlOrConfig
    if (options?.params) {
      const sp = new URLSearchParams()
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
      })
      const qs = sp.toString()
      if (qs) finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs
    }
    return clientInstance.request<T>(finalUrl, options)
  }

  const { url, method = "GET", params, data, body, ...rest } = urlOrConfig
  let finalUrl = url
  if (params) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
    })
    const qs = sp.toString()
    if (qs) finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs
  }

  return clientInstance.request<T>(finalUrl, {
    method: method as any,
    body: data ?? body,
    ...rest,
  })
}

requestCore.get = function <T = any>(url: string, config?: any) {
  const params = config?.params ?? (config && !config.headers && !config.noAuth ? config : undefined)
  return requestCore<T>({ url, method: "GET", params, ...(config?.headers ? { headers: config.headers } : {}) })
}

requestCore.post = function <T = any>(url: string, data?: any, config?: any) {
  return requestCore<T>({ url, method: "POST", data, ...config })
}

requestCore.put = function <T = any>(url: string, data?: any, config?: any) {
  return requestCore<T>({ url, method: "PUT", data, ...config })
}

requestCore.patch = function <T = any>(url: string, data?: any, config?: any) {
  return requestCore<T>({ url, method: "PATCH", data, ...config })
}

requestCore.delete = function <T = any>(url: string, config?: any) {
  return requestCore<T>({ url, method: "DELETE", ...config })
}

export interface RequestInstance {
  <T = any>(config: RequestOptions): Promise<ApiResponse<T>>
  get<T = any>(url: string, config?: any): Promise<ApiResponse<T>>
  post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>
  put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>
  patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>
  delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>>
}

/** 全局请求实例 (双模支持: request({ url, method }) 或 request.get(url, params)) */
export const request: RequestInstance = requestCore as unknown as RequestInstance

/** API 路径常量 */
export const API = {
  // System
  AUTH: "/api/v1/admin/system/auth",
  USERS: "/api/v1/admin/system/users",
  ROLES: "/api/v1/admin/system/roles",
  DEPTS: "/api/v1/admin/system/depts",
  MENUS: "/api/v1/admin/system/menus",
  POSTS: "/api/v1/admin/system/posts",
  DICTS: "/api/v1/admin/system/dicts",
  ROLE_MENU_IDS: "/api/v1/admin/system/permissions/role-menus",
  ROLE_ASSIGNABLE_MENUS: "/api/v1/admin/system/menus?mode=role-assign",
  TENANT_PACKAGE_MENUS: "/api/v1/admin/system/menus?mode=tenant-package",
  ASSIGN_ROLE_MENU: "/api/v1/admin/system/permissions/assign-role-menu",
  USER_PROFILE: "/api/v1/admin/system/user-profile",
  TENANTS: "/api/v1/admin/system/tenants",
  TENANT_SUBSCRIPTIONS: "/api/v1/admin/system/tenants",
  TENANT_PACKAGES: "/api/v1/admin/system/tenant-packages",

  // Infra
  CONFIGS: "/api/v1/admin/infra/configs",
  JOBS: "/api/v1/admin/infra/jobs",
  FILES: "/api/v1/admin/infra/files",
  DATA_SOURCE_CONFIG: "/api/v1/admin/infra/data-source-config",
  CODEGEN: "/api/v1/admin/infra/codegen",
  REPORT_CUSTOM_SQL: "/api/v1/admin/report/custom-sql",
  API_ACCESS_LOGS: "/api/v1/admin/infra/api-access-log",
  API_ERROR_LOGS: "/api/v1/admin/infra/api-error-logs",

  // Pay
  PAY_ORDERS: "/api/v1/admin/pay/orders",
  PAY_REFUNDS: "/api/v1/admin/pay/refunds",

  // CRM
  CRM_CUSTOMERS: "/api/v1/admin/crm/customers",
} as const
