import { traceContext } from "./trace-context"

export type LogLevel = "debug" | "info" | "warn" | "error"
export type StructuredLog = { timestamp: string; level: LogLevel; event: string; traceId: string; fields?: Record<string, unknown> }
export type LogSink = (record: StructuredLog) => void | Promise<void>
export type ApiAccessOutcome = "SUCCESS" | "AUTHENTICATION_FAILED" | "ACCOUNT_DISABLED" | "AUTHORIZATION_DENIED" | "VALIDATION_FAILED" | "DEPENDENCY_UNAVAILABLE" | "FAILED"
export type ApiAccessLogFields = { method: string; path: string; status: number; durationMs: number; outcome?: ApiAccessOutcome; errorCode?: string; resultMessage?: string; userId?: string; tenantId?: string }
type ErrorLike = Error & { code?: string; cause?: unknown; errors?: unknown[] }
type CompactError = { name: string; code?: string; message: string; location?: string }

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|credential|api[-_]?key/i
const sinks = new Set<LogSink>()
const errorWindows = new Map<string, { startedAt: number; suppressed: number }>()
const ERROR_WINDOW_MS = 60_000

function redactText(value: string): string {
  return value.replace(/:\/\/([^:\s]+):([^@\s]+)@/g, "://$1:***@").replace(/(password|token|secret)=([^\s&]+)/gi, "$1=***")
}

export function redact(value: unknown): unknown {
  if (typeof value === "string") return redactText(value)
  if (Array.isArray(value)) return value.map(redact)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? "***" : redact(item)]))
}

function asError(value: unknown): ErrorLike | undefined {
  return value instanceof Error ? value as ErrorLike : undefined
}

function errorCandidates(error: unknown): ErrorLike[] {
  const queue = [error]
  const result: ErrorLike[] = []
  const seen = new Set<unknown>()
  while (queue.length && result.length < 12) {
    const item = queue.shift()
    if (!item || seen.has(item)) continue
    seen.add(item)
    const current = asError(item)
    if (!current) continue
    result.push(current)
    if (current.cause) queue.push(current.cause)
    if (Array.isArray(current.errors)) queue.push(...current.errors)
  }
  return result
}

export function summarizeError(error: unknown): CompactError {
  const candidates = errorCandidates(error)
  const root: ErrorLike = candidates.find((item) => item.code || item.message) ?? (new Error("Unknown error") as ErrorLike)
  const stack = candidates.map((item) => item.stack).find(Boolean)
  const location = stack?.split("\n").map((line) => line.trim()).find((line) => line.startsWith("at ") && !line.includes("node_modules") && !line.includes(".next-cooliebase"))
  return { name: root.name || "Error", code: root.code, message: root.message || `${root.name || "Error"}${root.code ? ` (${root.code})` : ""}`, location }
}

/** Register a non-blocking sink, e.g. a database, queue, or OpenTelemetry exporter. */
export function registerLogSink(sink: LogSink): () => void {
  sinks.add(sink)
  return () => sinks.delete(sink)
}

export function writeStructuredLog(level: LogLevel, event: string, fields?: Record<string, unknown>): void {
  const record: StructuredLog = { timestamp: new Date().toISOString(), level, event, traceId: traceContext.getTraceId(), fields: fields ? redact(fields) as Record<string, unknown> : undefined }
  const line = JSON.stringify(record)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.info(line)
  for (const sink of sinks) Promise.resolve(sink(record)).catch((error) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", event: "observability.sink.failed", traceId: record.traceId, fields: { error: summarizeError(error) } })))
}

/** Emits one compact error per fingerprint per minute and reports suppressed duplicates on the next emission. */
export function writeCompactError(event: string, error: unknown, fields?: Record<string, unknown>): CompactError {
  const summary = summarizeError(error)
  const fingerprint = `${event}:${summary.code ?? summary.name}:${String(fields?.stage ?? "")}:${String(fields?.path ?? "")}`
  const now = Date.now()
  const window = errorWindows.get(fingerprint)
  if (window && now - window.startedAt < ERROR_WINDOW_MS) {
    window.suppressed += 1
    return summary
  }
  const suppressedCount = window?.suppressed ?? 0
  errorWindows.set(fingerprint, { startedAt: now, suppressed: 0 })
  writeStructuredLog("error", event, { ...fields, error: summary, ...(suppressedCount ? { suppressedCount, aggregationWindowSeconds: ERROR_WINDOW_MS / 1000 } : {}) })
  return summary
}

export function resolveApiAccessOutcome(status: number, errorCode?: string): ApiAccessOutcome {
  if (status < 400) return "SUCCESS"
  if (errorCode === "AUTHENTICATION_FAILED" || errorCode === "UNAUTHENTICATED" || status === 401) return "AUTHENTICATION_FAILED"
  if (errorCode === "ACCOUNT_DISABLED") return "ACCOUNT_DISABLED"
  if (errorCode === "FORBIDDEN" || status === 403) return "AUTHORIZATION_DENIED"
  if (errorCode === "VALIDATION_ERROR" || errorCode === "INVALID_JSON" || status === 400) return "VALIDATION_FAILED"
  if (errorCode === "DEPENDENCY_UNAVAILABLE" || status === 503) return "DEPENDENCY_UNAVAILABLE"
  return "FAILED"
}

export function recordApiAccess(fields: ApiAccessLogFields): void {
  writeStructuredLog(fields.status >= 500 ? "error" : fields.status >= 400 ? "warn" : "info", "api.request.completed", fields)
}
