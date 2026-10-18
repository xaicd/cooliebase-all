import { randomUUID } from "node:crypto"
import { getKyselyDb, hasRealDatabase } from "./database"
import { redact, writeCompactError } from "./observability"

export type ApiAccessLogInput = {
  traceId: string
  method: string
  path: string
  status: number
  durationMs: number
  outcome?: string
  errorCode?: string
  resultMessage?: string
  userId?: string
  tenantId?: string
  userIp?: string
  userAgent?: string
  operation?: string
}
export type ApiErrorLogInput = ApiAccessLogInput & { errorName: string; errorMessage: string; errorCode?: string; stack?: string; rootCause?: string }
export type LoginAuditLogInput = { userId?: string; username: string; userIp?: string; userAgent?: string; result: "SUCCESS" | "FAIL"; remark?: string; tenantId?: string }
export type OperateAuditLogInput = { userId?: string; tenantId?: string; module: string; name: string; type: "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "IMPORT" | "OTHER"; method: string; path: string; status: number; durationMs: number; userIp?: string }

function encode(value: unknown): string | null {
  if (value === undefined) return null
  return JSON.stringify(redact(value))
}

/** Best-effort persistence: logging failures must never change the business response. */
export async function persistApiAccessLog(input: ApiAccessLogInput): Promise<void> {
  if (!hasRealDatabase()) return
  try {
    const db = await getKyselyDb()
    await db.insertInto("infra_api_access_log").values({
      id: randomUUID(), trace_id: input.traceId, user_id: input.userId ?? null, tenant_id: input.tenantId ?? null,
      application_name: "cooliebase-all-base", request_method: input.method, request_url: input.path,
      request_params: encode({ outcome: input.outcome, errorCode: input.errorCode, resultMessage: input.resultMessage }),
      response_body: null, result_code: input.status, duration: input.durationMs, user_ip: input.userIp ?? null,
      user_agent: input.userAgent ?? null, operation: input.operation ?? null, created_at: new Date(),
    }).execute()
  } catch (error) {
    writeCompactError("audit.api_access.persist_failed", error, { traceId: input.traceId })
  }
}

export async function persistApiErrorLog(input: ApiErrorLogInput): Promise<void> {
  if (!hasRealDatabase()) return
  try {
    const db = await getKyselyDb()
    await db.insertInto("infra_api_error_log").values({
      id: randomUUID(), trace_id: input.traceId, user_id: input.userId ?? null, tenant_id: input.tenantId ?? null,
      application_name: "cooliebase-all-base", request_method: input.method, request_url: input.path,
      request_params: encode({ operation: input.operation }), exception_name: input.errorName,
      exception_message: String(redact(input.errorMessage)), exception_stack: input.stack ? String(redact(input.stack)) : null,
      error_code: input.errorCode ?? null, root_cause: input.rootCause ? String(redact(input.rootCause)) : null,
      status: "UNPROCESSED", processed_at: null, processed_by: null, process_note: null,
      user_ip: input.userIp ?? null, user_agent: input.userAgent ?? null, created_at: new Date(),
    }).execute()
  } catch (error) {
    writeCompactError("audit.api_error.persist_failed", error, { traceId: input.traceId })
  }
}

/** Login auditing is deliberately separate from API access logs and never records credentials. */
export async function persistLoginAuditLog(input: LoginAuditLogInput): Promise<void> {
  if (!hasRealDatabase()) return
  try {
    const db = await getKyselyDb()
    await db.insertInto("system_login_log").values({
      id: randomUUID(), user_id: input.userId ?? null, username: input.username, user_ip: input.userIp ?? "unknown",
      user_agent: input.userAgent ?? null, result: input.result, remark: input.remark ?? null,
      tenant_id: input.tenantId ?? null, created_at: new Date(),
    }).execute()
  } catch (error) {
    writeCompactError("audit.login.persist_failed", error, { username: input.username })
  }
}

/** Operation auditing records protected mutations only; request bodies are never persisted by this cross-cutting hook. */
export async function persistOperateAuditLog(input: OperateAuditLogInput): Promise<void> {
  if (!hasRealDatabase()) return
  try {
    const db = await getKyselyDb()
    await db.insertInto("system_operate_log").values({
      id: randomUUID(), user_id: input.userId ?? null, module: input.module, name: input.name, type: input.type,
      request_method: input.method, request_url: input.path, content: null, result_code: input.status,
      duration: input.durationMs, user_ip: input.userIp ?? null, tenant_id: input.tenantId ?? null, created_at: new Date(),
    }).execute()
  } catch (error) {
    writeCompactError("audit.operate.persist_failed", error, { method: input.method, path: input.path })
  }
}
