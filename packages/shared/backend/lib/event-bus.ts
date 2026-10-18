/**
 * Event Bus - 跨域异步事件（NestJS EventPattern / NATS pub-sub + queue group 语义）
 *
 * - 阶段 A：in-process fan-out
 * - 可靠跨域：必须 outbox，禁止只靠本内存总线
 * - 阶段 C：同一 subject 接到 NATS JetStream（at-least-once），禁止 Nest transporter 信封
 */

import {
  buildEventEnvelope,
  eventSubjectAliases,
  matchSubject,
} from "./messaging-protocol"
import { natsPublish } from "./nats-fabric"
import { natsStreamPublish } from "./nats-stream"
import { getTenantContext, isTenantRequired } from "./biz-tenant"
import { traceContext } from "./trace-context"
import { resetOutbox, runUnitOfWork, subscribeOutboxConsumer } from "./transactional-outbox"

// ============ Types ============

export type DomainEvent = {
  /** 事件类型，格式：domain.entity.action，如 pay.order.created */
  type: string
  /** NATS-style subject，如 cooliebase.evt.pay.order.created */
  subject?: string
  /** 事件负载 */
  payload: Record<string, unknown>
  /** 事件来源域 */
  source: string
  /** 事件 ID（幂等标识） */
  eventId: string
  /** 发布时间 */
  timestamp: string
  /** 关联追踪 ID */
  traceId?: string
  /** Immutable owner scope copied from the verified execution context. */
  tenantId?: string
}

export type EventHandler = (event: DomainEvent) => Promise<void>

type Subscription = {
  pattern: string | RegExp
  handler: EventHandler
  subscriber: string
}

// ============ State ============

const subscriptions: Subscription[] = []
const eventLog: DomainEvent[] = []
const MAX_EVENT_LOG = 1000
const deadLetterQueue: { event: DomainEvent; error: string; failedAt: string }[] = []

// ============ Core ============

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function eventMatches(event: DomainEvent, pattern: string | RegExp): boolean {
  return eventSubjectAliases(event.type).some((alias) => matchSubject(alias, pattern))
    || (event.subject ? matchSubject(event.subject, pattern) : false)
}

async function dispatch(
  event: Omit<DomainEvent, "eventId" | "timestamp" | "tenantId" | "subject">,
  mode: "broadcast" | "emit",
): Promise<string> {
  const context = getTenantContext()
  if (isTenantRequired() && !context) throw new Error("发布租户事件缺少租户上下文")
  const envelope = buildEventEnvelope({
    type: event.type,
    source: event.source,
    payload: event.payload,
    traceId: event.traceId ?? context?.traceId ?? traceContext.current()?.traceId ?? generateEventId(),
    tenantId: context?.tenantId,
    actorId: context?.actorId,
  })
  const fullEvent: DomainEvent = {
    ...event,
    type: envelope.type,
    subject: envelope.subject,
    tenantId: envelope.headers.tenantId,
    traceId: envelope.headers.traceId,
    eventId: generateEventId(),
    timestamp: new Date().toISOString(),
  }
  eventLog.push(fullEvent)
  if (eventLog.length > MAX_EVENT_LOG) eventLog.shift()
  const matched = subscriptions.filter((item) => eventMatches(fullEvent, item.pattern))
  const selected = mode === "emit" ? pickOnePerGroup(matched) : matched
  for (const sub of selected) {
    try {
      await sub.handler(fullEvent)
    } catch (error: any) {
      deadLetterQueue.push({ event: fullEvent, error: error.message, failedAt: new Date().toISOString() })
    }
  }
  natsStreamPublish(envelope.subject, fullEvent, { "x-trace-id": envelope.headers.traceId ?? "" })
  await natsPublish(envelope.subject, fullEvent, { "x-trace-id": envelope.headers.traceId ?? "" })
  return fullEvent.eventId
}

let emitCursor = 0

function pickOnePerGroup(items: Subscription[]): Subscription[] {
  const groups = new Map<string, Subscription[]>()
  for (const item of items) {
    const key = item.subscriber.split(".")[0] || item.subscriber
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }
  const selected: Subscription[] = []
  for (const list of groups.values()) {
    selected.push(list[emitCursor % list.length])
    emitCursor += 1
  }
  return selected
}

export const eventBus = {
  /** Moleculer broadcast / NestJS fan-out EventPattern */
  broadcast(event: Omit<DomainEvent, "eventId" | "timestamp" | "tenantId" | "subject">) {
    return dispatch(event, "broadcast")
  },
  /** Moleculer emit / NATS queue group: one handler per subscriber group */
  emit(event: Omit<DomainEvent, "eventId" | "timestamp" | "tenantId" | "subject">) {
    return dispatch(event, "emit")
  },
  publish(event: Omit<DomainEvent, "eventId" | "timestamp" | "tenantId" | "subject">) {
    return eventBus.broadcast(event)
  },
  /** Transactional outbox path. Best-effort emit/broadcast must not be used for money/stock/approval. */
  publishReliable(
    event: Omit<DomainEvent, "eventId" | "timestamp" | "subject">,
    options: { dispatch?: boolean } = {},
  ) {
    return runUnitOfWork(async (uow) => uow.appendOutbox({
      type: event.type,
      source: event.source,
      payload: event.payload,
      traceId: event.traceId,
      tenantId: event.tenantId,
    }), options)
  },
  subscribe(opts: { pattern: string | RegExp; subscriber: string; handler: EventHandler }) {
    subscriptions.push(opts)
  },
  subscribeReliable(opts: {
    pattern: string | RegExp
    subscriber: string
    handler: EventHandler
    mode?: "broadcast" | "emit"
  }) {
    return subscribeOutboxConsumer(opts)
  },
  unsubscribe(subscriber: string) {
    const idx = subscriptions.findIndex((item) => item.subscriber === subscriber)
    if (idx !== -1) subscriptions.splice(idx, 1)
  },
  getEventLog(limit = 50): DomainEvent[] {
    return eventLog.slice(-limit)
  },
  getDeadLetterQueue() {
    return [...deadLetterQueue]
  },
  async retryDeadLetter(eventId: string): Promise<boolean> {
    const idx = deadLetterQueue.findIndex((item) => item.event.eventId === eventId)
    if (idx === -1) return false
    const { event } = deadLetterQueue[idx]
    deadLetterQueue.splice(idx, 1)
    await eventBus.broadcast({ type: event.type, source: event.source, payload: event.payload, traceId: event.traceId })
    return true
  },
  clear() {
    subscriptions.length = 0
    eventLog.length = 0
    deadLetterQueue.length = 0
    emitCursor = 0
    resetOutbox()
  },
}
