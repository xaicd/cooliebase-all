export interface ApiResponse<T = unknown> {
  code?: number
  success?: boolean
  data?: T
  msg?: string
  error?: string
}

export interface AuthTokenBundle {
  accessToken: string
  refreshToken?: string
  expiresTime?: number
}

const ACCESS_TOKEN_KEY = "cb_miniapp_access_token"
const REFRESH_TOKEN_KEY = "cb_miniapp_refresh_token"

let refreshInFlight: Promise<string | null> | null = null

export function readStorage(key: string): string {
  try {
    if (typeof uni !== "undefined" && typeof uni.getStorageSync === "function") {
      return String(uni.getStorageSync(key) || "")
    }
    if (typeof localStorage !== "undefined") {
      return String(localStorage.getItem(key) || "")
    }
  } catch (_err) {
    /* 小程序隐私授权前或无痕模式下存储读取降级为空串 */
  }
  return ""
}

export function writeStorage(key: string, value: string): void {
  try {
    if (typeof uni !== "undefined" && typeof uni.setStorageSync === "function") {
      uni.setStorageSync(key, value)
      return
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value)
    }
  } catch (_err) {
    /* 无痕环境写存储失败时安全降级 */
  }
}

export function clearTokens(): void {
  try {
    if (typeof uni !== "undefined" && typeof uni.removeStorageSync === "function") {
      uni.removeStorageSync(ACCESS_TOKEN_KEY)
      uni.removeStorageSync(REFRESH_TOKEN_KEY)
      return
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  } catch (_err) {
    /* 清理失败不影响运行态 */
  }
}

export function getAccessToken(): string {
  return readStorage(ACCESS_TOKEN_KEY)
}

export function setTokenBundle(bundle: AuthTokenBundle): void {
  if (bundle.accessToken) writeStorage(ACCESS_TOKEN_KEY, bundle.accessToken)
  if (bundle.refreshToken) writeStorage(REFRESH_TOKEN_KEY, bundle.refreshToken)
}

/**
 * 动态解析 API 根路径：
 * 1. 显式配置 VITE_API_BASE_URL 优先；
 * 2. 若配置了 VITE_BASE_PATH（如 /my-app），拼接为 /my-app/api/v1/app；
 * 3. 若配置了非默认 VITE_APP_SLUG，拼接为 /${slug}/api/v1/app；
 * 4. 母本根路径回退至 /api/v1/app。
 */
export function resolveApiBaseUrl(): string {
  const explicit = (import.meta.env.VITE_API_BASE_URL || "").trim()
  if (explicit) return explicit.replace(/\/+$/, "")

  const basePath = (import.meta.env.VITE_BASE_PATH || "").trim().replace(/^\/+|\/+$/g, "")
  if (basePath) return `/${basePath}/api/v1/app`

  const slug = (import.meta.env.VITE_APP_SLUG || "").trim().replace(/^\/+|\/+$/g, "")
  if (slug && slug !== "cooliebase-all") return `/${slug}/api/v1/app`

  return "/api/v1/app"
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = resolveApiBaseUrl()
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${cleanPath}`
}

async function rawRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; body: ApiResponse<T> }> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Channel": "miniapp",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {}),
  }

  if (typeof uni !== "undefined" && typeof uni.request === "function") {
    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method,
        data,
        header: headers,
        timeout: 10000,
        success: (res) => {
          resolve({
            status: res.statusCode,
            body: (res.data || {}) as ApiResponse<T>,
          })
        },
        fail: (err) => reject(new Error(err.errMsg || "网络请求异常")),
      })
    })
  }

  const resp = await fetch(url, {
    method,
    headers,
    body: method === "GET" || data === undefined ? undefined : JSON.stringify(data),
  })
  let parsed: ApiResponse<T> = {}
  try {
    parsed = (await resp.json()) as ApiResponse<T>
  } catch (_err) {
    /* 非 JSON 响应体降级为空对象 */
  }
  return { status: resp.status, body: parsed }
}

/**
 * 微信静默授权登录（wx.login 换取 code -> 后端签发双 Token）
 */
export async function wxSilentLogin(): Promise<AuthTokenBundle | null> {
  if (typeof wx === "undefined" || typeof wx.login !== "function") {
    return null
  }
  const code = await new Promise<string>((resolve, reject) => {
    wx.login({
      success: (res) => (res.code ? resolve(res.code) : reject(new Error("wx.login 未返回凭证"))),
      fail: (err) => reject(new Error(err.errMsg || "wx.login 调用失败")),
    })
  })
  const { status, body } = await rawRequest<AuthTokenBundle>("POST", buildUrl("/member/auth/weixin-mini-app-login"), {
    code,
  })
  if (status >= 200 && status < 300 && body.data?.accessToken) {
    setTokenBundle(body.data)
    return body.data
  }
  return null
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const refreshToken = readStorage(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      const { status, body } = await rawRequest<AuthTokenBundle>(
        "POST",
        buildUrl(`/member/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`),
      )
      if (status >= 200 && status < 300 && body.data?.accessToken) {
        setTokenBundle(body.data)
        return body.data.accessToken
      }
    }
    const silent = await wxSilentLogin()
    return silent?.accessToken ?? null
  })().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

export async function request<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  const fullUrl = buildUrl(path)
  const first = await rawRequest<T>(method, fullUrl, data)
  if (first.status !== 401 && first.body.code !== 401) {
    return first.body
  }
  const nextToken = await tryRefreshAccessToken()
  if (!nextToken) {
    clearTokens()
    return first.body
  }
  const retried = await rawRequest<T>(method, fullUrl, data)
  return retried.body
}

export const http = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, data?: unknown) => request<T>("POST", path, data),
  put: <T = unknown>(path: string, data?: unknown) => request<T>("PUT", path, data),
  delete: <T = unknown>(path: string, data?: unknown) => request<T>("DELETE", path, data),
}
