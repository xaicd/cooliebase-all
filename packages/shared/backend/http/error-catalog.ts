import { configCenterErrorMessageResolver } from "./error-message-config"

export type ErrorCategory = "AUTH" | "VALIDATION" | "RESOURCE" | "DEPENDENCY" | "SYSTEM" | "THROTTLING"

export type ErrorDefinition = {
  status: number
  messageKey: string
  defaultMessage: string
  category: ErrorCategory
  retryable: boolean
  description: string
}

/**
 * Stable public error contract. Codes are versioned API identifiers: do not rename
 * or change their meaning after publishing them to REST, OpenAPI, or MCP clients.
 */
export const ERROR_CATALOG = {
  AUTHENTICATION_FAILED: { status: 401, messageKey: "auth.authentication_failed", defaultMessage: "用户名或密码错误", category: "AUTH", retryable: false, description: "Credentials or tenant login identity could not be verified." },
  UNAUTHENTICATED: { status: 401, messageKey: "auth.unauthenticated", defaultMessage: "未登录或登录已过期", category: "AUTH", retryable: false, description: "Authentication token is missing, invalid, or expired." },
  ACCOUNT_DISABLED: { status: 403, messageKey: "auth.account_disabled", defaultMessage: "账号已禁用，请联系管理员", category: "AUTH", retryable: false, description: "The authenticated account is disabled." },
  FORBIDDEN: { status: 403, messageKey: "auth.forbidden", defaultMessage: "没有权限执行此操作", category: "AUTH", retryable: false, description: "The authenticated caller lacks the required permission." },
  VALIDATION_ERROR: { status: 400, messageKey: "validation.request_invalid", defaultMessage: "请求参数不正确", category: "VALIDATION", retryable: false, description: "One or more request fields are invalid." },
  INVALID_JSON: { status: 400, messageKey: "validation.invalid_json", defaultMessage: "请求 JSON 格式不正确", category: "VALIDATION", retryable: false, description: "The request body is not valid JSON." },
  NOT_FOUND: { status: 404, messageKey: "resource.not_found", defaultMessage: "请求的资源不存在", category: "RESOURCE", retryable: false, description: "The requested resource does not exist or is not visible to the caller." },
  CONFLICT: { status: 409, messageKey: "resource.conflict", defaultMessage: "资源状态冲突，请刷新后重试", category: "RESOURCE", retryable: false, description: "The request conflicts with the current resource state." },
  RATE_LIMITED: { status: 429, messageKey: "throttling.rate_limited", defaultMessage: "请求过于频繁，请稍后重试", category: "THROTTLING", retryable: true, description: "The caller exceeded a configured rate limit." },
  DEPENDENCY_UNAVAILABLE: { status: 503, messageKey: "dependency.unavailable", defaultMessage: "服务暂时不可用，请稍后重试", category: "DEPENDENCY", retryable: true, description: "A required dependency such as a database, cache, or upstream service is unavailable." },
  NOT_IMPLEMENTED: { status: 501, messageKey: "system.not_implemented", defaultMessage: "该接口尚未实现，请勿依赖其返回", category: "SYSTEM", retryable: false, description: "The endpoint exists but has no implementation yet. It must NOT be treated as success." },
  INTERNAL_ERROR: { status: 500, messageKey: "system.internal_error", defaultMessage: "系统异常，请稍后重试", category: "SYSTEM", retryable: false, description: "An unexpected server error occurred. Do not retry non-idempotent writes automatically." },
} as const satisfies Record<string, ErrorDefinition>

export type ErrorCode = keyof typeof ERROR_CATALOG
export type ErrorMessageResolver = (definition: ErrorDefinition, code: ErrorCode) => string | undefined

let messageResolver: ErrorMessageResolver | undefined = configCenterErrorMessageResolver

/** Registers an optional i18n/config-center resolver; code, status, and retry policy remain immutable. */
export function registerErrorMessageResolver(resolver?: ErrorMessageResolver): () => void {
  messageResolver = resolver
    return () => { if (messageResolver === resolver) messageResolver = configCenterErrorMessageResolver }
}

export function getErrorDefinition(code: ErrorCode): ErrorDefinition {
  return ERROR_CATALOG[code]
}

export function resolveErrorMessage(code: ErrorCode): string {
  const definition = getErrorDefinition(code)
  return messageResolver?.(definition, code) || definition.defaultMessage
}

export function getPublicErrorCatalog() {
  return Object.entries(ERROR_CATALOG).map(([code, definition]) => ({ code, ...definition }))
}
