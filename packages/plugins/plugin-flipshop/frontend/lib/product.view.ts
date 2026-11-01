/**
 * 翻牌小店 (flipshop) · 商品页面的**纯视图逻辑**。
 *
 * 与 React 解耦，便于在 node 环境下直接单测（`*.test.ts`）：
 *   - 金额格式化（分 → 元）
 *   - 列表 / 详情极端态推导（loading / empty / not-found / error / ready）
 *   - 契约错误码判定（409 CONFLICT / 404 NOT_FOUND）
 *
 * 说明：接口统一信封为 `{ success, data }` / `{ success, error, code }`（见 admin-route.ts），
 * 因此 409 与 404 只能靠 `code` 区分 —— 这里是唯一的判定收敛点。
 */
import type { ProductStatus } from "@/modules/flipshop/backend/types/product.types"

export type ListAgentState = "loading" | "error" | "empty" | "ready"
export type DetailAgentState = "loading" | "not-found" | "error" | "ready"

export type EnvelopeError = {
  code?: string
  error?: string
  message?: string
} | null | undefined

/** 分 → 人类可读金额（保留两位小数，杜绝浮点误差）。 */
export function formatPriceCents(cents: number | null | undefined): string {
  const value = typeof cents === "number" && Number.isFinite(cents) ? Math.trunc(cents) : 0
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  const yuan = Math.floor(abs / 100)
  const fen = String(abs % 100).padStart(2, "0")
  return `${sign}¥${yuan}.${fen}`
}

/** 列表极端态推导：loading 优先，其次 error，再次空态，最后 ready。 */
export function deriveListState(input: { loading: boolean; hasError: boolean; count: number }): ListAgentState {
  if (input.loading) return "loading"
  if (input.hasError) return "error"
  if (!Number.isFinite(input.count) || input.count <= 0) return "empty"
  return "ready"
}

/** 详情极端态推导：loading → 404 → 网络异常 → ready。 */
export function deriveDetailState(input: {
  loading: boolean
  notFound: boolean
  hasError: boolean
  hasData: boolean
}): DetailAgentState {
  if (input.loading) return "loading"
  if (input.notFound) return "not-found"
  if (input.hasError) return "error"
  return input.hasData ? "ready" : "not-found"
}

/** 409（同租户 SKU 冲突）判定 —— 契约码 CONFLICT，或文案含 SKU/已存在/冲突。 */
export function isSkuConflict(error: EnvelopeError): boolean {
  if (!error) return false
  if ((error.code ?? "").toUpperCase().includes("CONFLICT")) return true
  return /SKU|已存在|冲突|重复/i.test(`${error.error ?? ""} ${error.message ?? ""}`)
}

/** 404（不存在 / 跨租户不可见）判定。 */
export function isNotFoundError(error: EnvelopeError): boolean {
  if (!error) return false
  if ((error.code ?? "").toUpperCase().includes("NOT_FOUND")) return true
  return /不存在|未找到|not found/i.test(`${error.error ?? ""} ${error.message ?? ""}`)
}

/** 状态归一化：非法值一律回落 off_shelf，避免脏数据渲染出未定义 UI。 */
export function normalizeProductStatus(status: string | null | undefined): ProductStatus {
  return status === "on_shelf" ? "on_shelf" : "off_shelf"
}

export function statusLabel(status: ProductStatus | string | null | undefined): string {
  return normalizeProductStatus(status) === "on_shelf" ? "已上架" : "已下架"
}

/** 长文本截断（配合 CSS truncate + title 兜底）。 */
export function truncateText(text: string | null | undefined, max = 40): string {
  const value = text ?? ""
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/** 幂等键：优先 crypto.randomUUID，降级为时间戳 + 随机串。 */
export function createIdempotencyKey(): string {
  const maybeCrypto = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined
  if (maybeCrypto && typeof maybeCrypto.randomUUID === "function") {
    return maybeCrypto.randomUUID()
  }
  return `flipshop-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
