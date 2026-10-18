import { afterEach, describe, expect, it } from "vitest"
import { eventBus } from "../event-bus"
import {
  buildCommandEnvelope,
  buildEventEnvelope,
  commandSubject,
  encodeMessagingHeaders,
  eventSubject,
  matchSubject,
  queueGroupFor,
} from "../messaging-protocol"
import { serviceBus } from "../service-bus"

describe("messaging protocol constraints", () => {
  it("builds Nest-style command subjects and queue groups", () => {
    const envelope = buildCommandEnvelope({
      domain: "pay",
      method: "createOrder",
      payload: { amount: 100 },
      caller: "mall.order",
      traceId: "trace-1",
      tenantId: "t-1",
      idempotencyKey: "idemp-1",
    })
    expect(envelope.subject).toBe(commandSubject("pay", "createOrder"))
    expect(envelope.subject).toBe("cooliebase.cmd.pay.createOrder")
    expect(envelope.queueGroup).toBe(queueGroupFor("pay"))
    expect(envelope.timeoutMs).toBe(5000)
    expect(encodeMessagingHeaders(envelope.headers)["x-idempotency-key"]).toBe("idemp-1")
  })

  it("rejects unknown command domains", () => {
    expect(() =>
      buildCommandEnvelope({
        domain: "unknown",
        method: "ping",
        payload: {},
        caller: "mall",
        traceId: "t",
      }),
    ).toThrow(/Unknown domain/)
  })

  it("canonicalizes event subjects and keeps wildcard matching", () => {
    const envelope = buildEventEnvelope({
      type: "pay.order.paid",
      source: "pay",
      payload: { orderId: "1" },
      traceId: "trace-2",
    })
    expect(envelope.subject).toBe(eventSubject("pay.order.paid"))
    expect(envelope.subject).toBe("cooliebase.evt.pay.order.paid")
    expect(matchSubject(envelope.subject, "cooliebase.evt.pay.>")).toBe(true)
    expect(matchSubject(envelope.type, "pay.order.*")).toBe(true)
    expect(matchSubject(envelope.subject, "cooliebase.evt.mall.>")).toBe(false)
  })
})

describe("service and event buses honor the protocol", () => {
  afterEach(() => {
    eventBus.clear()
  })

  it("serviceBus.call rejects domains outside the catalog", async () => {
    const result = await serviceBus.call({ service: "unknown", method: "ping", caller: "mall" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unknown domain/)
  })

  it("eventBus.publish fans out to both legacy and subject patterns", async () => {
    const seen: string[] = []
    eventBus.subscribe({
      pattern: "pay.order.paid",
      subscriber: "mall.legacy",
      handler: async () => {
        seen.push("legacy")
      },
    })
    eventBus.subscribe({
      pattern: "cooliebase.evt.pay.>",
      subscriber: "mall.nats",
      handler: async () => {
        seen.push("subject")
      },
    })
    const eventId = await eventBus.publish({
      type: "pay.order.paid",
      source: "pay",
      payload: { orderId: "pay-001" },
    })
    expect(eventId).toMatch(/^evt-/)
    expect(seen).toEqual(["legacy", "subject"])
    expect(eventBus.getEventLog(1)[0].subject).toBe("cooliebase.evt.pay.order.paid")
  })
})
