import { getTenantContext } from "./biz-tenant"

type DomainEventRecord = {
  name: string
  payload?: Record<string, unknown>
  createdAt: string
}

type DomainAuditRecord = {
  action: string
  payload?: Record<string, unknown>
  createdAt: string
}

const EVENT_BUFFER: DomainEventRecord[] = []
const AUDIT_BUFFER: DomainAuditRecord[] = []

/**
 * cooliebase-all 最小日志门面。
 * 通过 event/audit 语义保持与后续日志中心对接的一致接口。
 */
export const domainLog = {
  event(name: string, payload?: Record<string, unknown>) {
    const context = getTenantContext()
    EVENT_BUFFER.push({ name, payload: { ...payload, tenantId: context?.tenantId }, createdAt: new Date().toISOString() })
  },
  audit(action: string, payload?: Record<string, unknown>) {
    const context = getTenantContext()
    AUDIT_BUFFER.push({ action, payload: { ...payload, tenantId: context?.tenantId, actorId: context?.actorId }, createdAt: new Date().toISOString() })
  },
}

export function getDomainEventBuffer() {
  return EVENT_BUFFER
}

export function getDomainAuditBuffer() {
  return AUDIT_BUFFER
}

export function clearDomainLogBuffer() {
  EVENT_BUFFER.length = 0
  AUDIT_BUFFER.length = 0
}
