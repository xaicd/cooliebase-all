/**
 * Expo 端**唯一**的请求封装，按请求/响应/拦截/重试四象限组织。
 *
 * 为什么要有它（而不是每次调用各拼 fetch）:
 *   1. **UI 反馈策略声明在 API 层** —— 调用点写 `custom: { loadingMsg: "登录中" }`，
 *      组件不必重复写 loading / 成功提示 / 错误提示（上游就是这么做的）
 *   2. token / 租户 / 终端标识 / 超时 / 错误归一，只在这里一处
 *   3. 业务错误（`{success:false}`）与网络错误统一成同一个 Error，调用方只 catch 一次
 *
 * RN 没有全局 toast，所以「反馈」做成**可插拔 presenter**:
 * api 层声明意图，App 启动时注入实现（见 setPresenter）。未注入时静默降级为 no-op，
 * 这样 api 模块与单测都不依赖任何 UI。
 */

import Constants from "expo-constants"

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase ||
  "http://localhost:3200"

/** 调用方可声明的 UI 反馈策略（对齐上游的 custom 块）。 */
export interface RequestFeedback {
  /** 显示 loading 与其文案 */
  showLoading?: boolean
  loadingMsg?: string
  /** 成功后提示 */
  showSuccess?: boolean
  successMsg?: string
  /** 失败时提示（默认 true） */
  showError?: boolean
  /** 该调用需要登录；未登录时由 presenter 统一处理（如弹登录） */
  auth?: boolean
}

export interface RequestOptions extends RequestFeedback {
  url: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  data?: unknown
  /** 覆盖默认反馈（如列表接口不想每页都弹 loading） */
  custom?: RequestFeedback
  timeoutMs?: number
}

/**
 * 反馈呈现器 —— 由 App 注入。api 层只声明意图，不引 UI 依赖。
 */
export interface RequestPresenter {
  showLoading(message?: string): void
  hideLoading(): void
  showSuccess(message: string): void
  showError(message: string): void
  /** 需要登录但拿不到凭据时的统一处理 */
  onUnauthenticated?(): void
}

const noopPresenter: RequestPresenter = {
  showLoading: () => {},
  hideLoading: () => {},
  showSuccess: () => {},
  showError: () => {},
}

let presenter: RequestPresenter = noopPresenter
let token: string | null = null
let tenantId: string | null = null

export function setPresenter(next: RequestPresenter): void {
  presenter = next
}

export function setToken(value: string | null): void {
  token = value
}

export function getToken(): string | null {
  return token
}

export function setTenantId(value: string | null): void {
  tenantId = value
}

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: "business" | "network" | "timeout" | "unauthenticated",
  ) {
    super(message)
    this.name = "RequestError"
  }
}

/** 发起请求。成功返回 `data`（后端统一 `{success,data}` 契约，这里替调用方拆掉外壳）。 */
export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const feedback: RequestFeedback = { showError: true, showLoading: true, ...options, ...options.custom }
  const method = options.method ?? "GET"

  if (feedback.auth && !token) {
    presenter.onUnauthenticated?.()
    throw new RequestError("需要登录", 401, "unauthenticated")
  }

  if (feedback.showLoading) presenter.showLoading(feedback.loadingMsg ?? "加载中")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000)

  try {
    const response = await fetch(`${API_BASE}${options.url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
      },
      body: options.data === undefined ? undefined : JSON.stringify(options.data),
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean
      data?: T
      error?: string
      message?: string
      code?: string
    }

    if (!response.ok || payload?.success === false) {
      const message = payload?.error || payload?.message || `请求失败(${response.status})`
      // 401 归一成 unauthenticated，调用方据此跳登录，而不是去比对状态码
      const kind = response.status === 401 ? "unauthenticated" : "business"
      if (kind === "unauthenticated") presenter.onUnauthenticated?.()
      throw new RequestError(message, response.status, kind)
    }

    if (feedback.showSuccess && feedback.successMsg) presenter.showSuccess(feedback.successMsg)
    return payload.data as T
  } catch (error) {
    if (error instanceof RequestError) {
      if (feedback.showError) presenter.showError(error.message)
      throw error
    }
    const aborted = (error as { name?: string }).name === "AbortError"
    const wrapped = new RequestError(
      aborted ? "请求超时" : "网络异常，请稍后重试",
      0,
      aborted ? "timeout" : "network",
    )
    if (feedback.showError) presenter.showError(wrapped.message)
    throw wrapped
  } finally {
    clearTimeout(timer)
    if (feedback.showLoading) presenter.hideLoading()
  }
}

export function getApiBase(): string {
  return API_BASE
}
