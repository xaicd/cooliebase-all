/**
 * Transactional outbox + consumer inbox.
 * Same-store transaction as domain writes; dispatcher publishes after commit.
 */
import { getTenantContext } from "./biz-tenant"
import {
  buildEventEnvelope,
  encodeMessagingHeaders,
  eventSubjectAliases,
  matchSubject,
  messagingCatalog,
} from "./messaging-protocol"
import { natsPublish, natsSubscribe } from "./nats-fabric"
import { natsStreamPublish } from "./nats-stream"
import { getOutboxStore, resetOutboxStore, type OutboxDbHandle } from "./outbox-store"
import { traceContext } from "./trace-context"

export type OutboxEventInput = {
  type: string
  source: string
  payload: Record<string, unknown>
  traceId?: string
  tenantId?: string
}

export type OutboxRecord = {
  id: string
  eventId: string
  subject: string
  type: string
  source: string
  payload: Record<string, unknown>
  headers: Record<string, string>
  status: "pending" | "published" | "failed"
  attempts: number
  createdAt: string
  publishedAt?: string
}

export type OutboxConsumerEvent = {
  type: string
  subject?: string
  source: string
  payload: Record<string, unknown>
  eventId: string
  timestamp: string
  tenantId?: string
  traceId?: string
}

let seq = 0
let remainingPublishFailures = 0

export function resetOutbox(): void | Promise<void> {
  seq = 0
  remainingPublishFailures = 0
  // 真实库模式下这一步会 DELETE，需要调用方 await（测试的 afterEach 已改）
  return resetOutboxStore()
}

export function failNextOutboxPublishes(count: number) {
  remainingPublishFailures = count
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${++seq}`
}

export function resolveOutboxOwnerDomain(source: string): string {
  const [domain] = source.split(".")
  return domain || source
}

/** Stage C will return the writing domain's store. Stage A/B still share one outbox. */
export function getOutboxStoreForDomain(_domain: string) {
  return getOutboxStore()
}

function eventMatches(event: { type: string; subject?: string }, pattern: string | RegExp) {
  return eventSubjectAliases(event.type).some((alias) => matchSubject(alias, pattern))
    || (event.subject ? matchSubject(event.subject, pattern) : false)
}

function buildRecord(input: OutboxEventInput): OutboxRecord {
  const context = getTenantContext()
  const envelope = buildEventEnvelope({
    type: input.type,
    source: input.source,
    payload: input.payload,
    traceId: input.traceId ?? context?.traceId ?? traceContext.current()?.traceId ?? nextId("trace"),
    tenantId: input.tenantId ?? context?.tenantId,
  })
  const eventId = nextId("evt")
  return {
    id: nextId("outbox"),
    eventId,
    subject: envelope.subject,
    type: envelope.type,
    source: envelope.source,
    payload: envelope.payload,
    headers: encodeMessagingHeaders({ ...envelope.headers, idempotencyKey: eventId }),
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
  }
}

export type UnitOfWork = {
  appendOutbox: (input: OutboxEventInput) => string
  /** Same transaction as outbox inserts. Kysely Transaction when a real DB is bound. */
  db?: OutboxDbHandle
}

export async function runUnitOfWork<T>(
  work: (uow: UnitOfWork) => Promise<T>,
  options: { dispatch?: boolean; domain?: string } = {},
): Promise<{ result: T; eventIds: string[] }> {
  const store = getOutboxStoreForDomain(options.domain ?? "shared")
  const staged: OutboxRecord[] = []
  const result = await store.runInTransaction(async (tx) => {
    const value = await work({
      db: tx.db,
      appendOutbox(input) {
        const record = buildRecord(input)
        staged.push(record)
        return record.eventId
      },
    })
    for (const record of staged) await tx.insertOutbox(record)
    return value
  })
  if (options.dispatch !== false) await outboxDispatch()
  return { result, eventIds: staged.map((item) => item.eventId) }
}

function toConsumerEvent(record: OutboxRecord): OutboxConsumerEvent {
  const keys = messagingCatalog().headerKeys
  return {
    type: record.type,
    subject: record.subject,
    source: record.source,
    payload: record.payload,
    eventId: record.eventId,
    timestamp: record.createdAt,
    tenantId: record.headers[keys.tenantId],
    traceId: record.headers[keys.traceId],
  }
}

export async function outboxDispatch(limit = 50): Promise<number> {
  const store = getOutboxStore()
  const pending = await store.listPending(limit)
  let published = 0
  for (const record of pending) {
    record.attempts += 1
    try {
      if (remainingPublishFailures > 0) {
        remainingPublishFailures -= 1
        throw new Error("simulated outbox publish failure")
      }
      const data = toConsumerEvent(record)
      await natsPublish(record.subject, data, record.headers)
      natsStreamPublish(record.subject, data, record.headers)
      record.status = "published"
      record.publishedAt = new Date().toISOString()
      published += 1
    } catch {
      record.status = record.attempts >= 5 ? "failed" : "pending"
    }
    await store.save(record)
  }
  return published
}

export async function listOutbox(status?: OutboxRecord["status"]) {
  return getOutboxStore().list(status)
}

export async function inboxAlreadyProcessed(consumer: string, eventId: string) {
  return getOutboxStore().inboxHas(consumer, eventId)
}

export async function inboxMarkProcessed(consumer: string, eventId: string) {
  return getOutboxStore().inboxMark(consumer, eventId)
}

export function subscribeOutboxConsumer(opts: {
  pattern: string | RegExp
  subscriber: string
  handler: (event: OutboxConsumerEvent) => Promise<void>
  mode?: "broadcast" | "emit"
}) {
  const queue = opts.mode === "emit" ? (opts.subscriber.split(".")[0] || opts.subscriber) : undefined
  return natsSubscribe("cooliebase.evt.>", async (message) => {
    const event = message.data as OutboxConsumerEvent
    if (!event?.eventId || !eventMatches(event, opts.pattern)) return
    if (await inboxAlreadyProcessed(opts.subscriber, event.eventId)) return
    await opts.handler(event)
    await inboxMarkProcessed(opts.subscriber, event.eventId)
  }, { queue })
}
