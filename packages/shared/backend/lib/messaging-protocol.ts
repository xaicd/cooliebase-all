/**
 * Cross-domain messaging constraints.
 *
 * Inspired by NestJS microservices (MessagePattern / EventPattern / queue groups)
 * but the wire format is protocol-owned, not Nest transporter-owned, so Go/NATS
 * can speak the same subjects and headers later.
 */
import {
  DOMAIN_CATALOG,
  getDomainCatalogEntry,
  requireDomainCatalogEntry,
  type DomainCatalogEntry,
  type MessagingTransport,
} from "../constants/domain-catalog"

export type MessageKind = "command" | "event"

export type MessagingHeaders = {
  contractVersion: string
  traceId: string
  tenantId?: string
  actorId?: string
  idempotencyKey?: string
  sourceDomain: string
}

export type CommandEnvelope<T = unknown> = {
  kind: "command"
  subject: string
  domain: string
  method: string
  queueGroup: string
  timeoutMs: number
  headers: MessagingHeaders
  payload: T
}

export type EventEnvelope<T = Record<string, unknown>> = {
  kind: "event"
  subject: string
  type: string
  source: string
  queueGroup: string
  headers: MessagingHeaders
  payload: T
}

const METHOD_RE = /^[a-zA-Z][a-zA-Z0-9]*$/
const CALLER_RE = /^[a-zA-Z0-9._-]+$/
const EVENT_TYPE_RE = /^[a-z0-9]+(\.[a-z0-9]+)+$/i
const SAFE_COMMAND_RE = /^(get|list|query|find|page|count|exists)/i

export function messagingCatalog() {
  return DOMAIN_CATALOG.messaging
}

export function resolveMessagingTransport(env: NodeJS.Dict<string> = process.env): MessagingTransport {
  const raw = env.RUOYI_MESSAGING_TRANSPORT?.trim()
  if (raw === "nats" || raw === "in-process") return raw
  return messagingCatalog().defaultTransport
}

export function commandSubject(domain: string, method: string): string {
  return `${messagingCatalog().commandSubjectPrefix}.${domain}.${method}`
}

export function eventSubject(type: string): string {
  const prefix = messagingCatalog().eventSubjectPrefix
  const normalized = type.trim()
  return `${prefix}.${normalized}`
}

export function eventTypeFromSubject(subject: string): string {
  const prefix = `${messagingCatalog().eventSubjectPrefix}.`
  return subject.startsWith(prefix) ? subject.slice(prefix.length) : subject
}

export function queueGroupFor(domain: string): string {
  return `cooliebase.${domain}`
}

export function assertKnownDomain(domain: string): DomainCatalogEntry {
  return requireDomainCatalogEntry(domain)
}

export function assertCommandMethod(method: string): string {
  if (!METHOD_RE.test(method)) throw new Error(`Invalid command method: ${method}`)
  return method
}

export function isSafeCommandMethod(method: string): boolean {
  return SAFE_COMMAND_RE.test(method)
}

export function matchSubject(subject: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) return pattern.test(subject)
  if (pattern === subject) return true
  const source = `^${pattern
    .replace(/>/g, "__GT__")
    .replace(/\*/g, "__STAR__")
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/__STAR__/g, "[^.]+")
    .replace(/__GT__/g, ".*")}$`
  return new RegExp(source).test(subject)
}

export function eventSubjectAliases(type: string): string[] {
  const canonical = eventSubject(type)
  return Array.from(new Set([type, canonical, eventTypeFromSubject(canonical)]))
}

export function buildCommandEnvelope<T>(input: {
  domain: string
  method: string
  payload: T
  caller: string
  traceId: string
  tenantId?: string
  actorId?: string
  idempotencyKey?: string
  timeoutMs?: number
}): CommandEnvelope<T> {
  const domain = assertKnownDomain(input.domain)
  const method = assertCommandMethod(input.method)
  if (!CALLER_RE.test(input.caller)) throw new Error(`Invalid command caller: ${input.caller}`)
  return {
    kind: "command",
    subject: commandSubject(domain.name, method),
    domain: domain.name,
    method,
    queueGroup: queueGroupFor(domain.name),
    timeoutMs: input.timeoutMs ?? domain.resilience.timeoutMs,
    headers: {
      contractVersion: domain.contractVersion,
      traceId: input.traceId,
      tenantId: input.tenantId,
      actorId: input.actorId,
      idempotencyKey: input.idempotencyKey,
      sourceDomain: input.caller.split(".")[0] || input.caller,
    },
    payload: input.payload,
  }
}

export function buildEventEnvelope<T extends Record<string, unknown>>(input: {
  type: string
  source: string
  payload: T
  traceId: string
  tenantId?: string
  actorId?: string
}): EventEnvelope<T> {
  const source = getDomainCatalogEntry(input.source)
  if (!source) throw new Error(`Unknown event source domain: ${input.source}`)
  if (!EVENT_TYPE_RE.test(input.type) && !EVENT_TYPE_RE.test(eventTypeFromSubject(eventSubject(input.type)))) {
    throw new Error(`Invalid event type: ${input.type}`)
  }
  return {
    kind: "event",
    subject: eventSubject(input.type),
    type: eventTypeFromSubject(eventSubject(input.type)),
    source: source.name,
    queueGroup: queueGroupFor(source.name),
    headers: {
      contractVersion: source.contractVersion,
      traceId: input.traceId,
      tenantId: input.tenantId,
      actorId: input.actorId,
      sourceDomain: source.name,
    },
    payload: input.payload,
  }
}

export function commandRetryAttempts(domain: DomainCatalogEntry, method: string, idempotencyKey?: string): number {
  if (idempotencyKey) return Math.max(domain.resilience.retryMaxAttempts, 1)
  if (domain.resilience.safeMethodsOnly && !isSafeCommandMethod(method)) return 0
  return domain.resilience.retryMaxAttempts
}

export function encodeMessagingHeaders(headers: MessagingHeaders): Record<string, string> {
  const keys = messagingCatalog().headerKeys
  const encoded: Record<string, string> = {
    [keys.contractVersion]: headers.contractVersion,
    [keys.traceId]: headers.traceId,
    [keys.sourceDomain]: headers.sourceDomain,
  }
  if (headers.tenantId) encoded[keys.tenantId] = headers.tenantId
  if (headers.actorId) encoded[keys.actorId] = headers.actorId
  if (headers.idempotencyKey) encoded[keys.idempotencyKey] = headers.idempotencyKey
  return encoded
}
