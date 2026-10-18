import { afterEach, describe, expect, it } from "vitest"
import {
  natsPublish,
  natsRequest,
  natsStatus,
  natsSubscribe,
  resetNatsFabric,
} from "../nats-fabric"
import {
  natsStreamAck,
  natsStreamConsume,
  natsStreamPending,
  natsStreamPublish,
  resetNatsStream,
} from "../nats-stream"

describe("in-house NATS fabric", () => {
  afterEach(() => {
    resetNatsFabric()
    resetNatsStream()
  })

  it("does native request-reply through an inbox", async () => {
    natsSubscribe("cooliebase.cmd.pay.>", async (message) => {
      expect(message.headers["x-trace-id"]).toBe("t-1")
      return { pong: message.data }
    }, { queue: "cooliebase.pay" })
    const result = await natsRequest("cooliebase.cmd.pay.ping", { n: 1 }, { headers: { "x-trace-id": "t-1" }, timeoutMs: 500 })
    expect(result).toEqual({ pong: { n: 1 } })
    expect(natsStatus().driver).toBe("in-house")
  })

  it("load-balances queue groups and fans out independent subscribers", async () => {
    const seen: string[] = []
    natsSubscribe("cooliebase.evt.pay.>", async () => { seen.push("q1") }, { queue: "mall" })
    natsSubscribe("cooliebase.evt.pay.>", async () => { seen.push("q2") }, { queue: "mall" })
    natsSubscribe("cooliebase.evt.pay.>", async () => { seen.push("audit") })
    await natsPublish("cooliebase.evt.pay.order.paid", { id: 1 })
    expect(seen.filter((item) => item === "audit")).toHaveLength(1)
    expect(seen.filter((item) => item === "q1" || item === "q2")).toHaveLength(1)
  })

  it("rejects requests when no responders exist", async () => {
    await expect(natsRequest("cooliebase.cmd.pay.missing", {}, { timeoutMs: 50 })).rejects.toThrow(/NoResponders/)
  })

  it("redelivers unacked stream records", async () => {
    const seqNo = natsStreamPublish("cooliebase.evt.pay.order.paid", { id: 7 })
    expect(natsStreamPending("cooliebase.evt.pay.>")).toBe(1)
    await natsStreamConsume("cooliebase.evt.pay.>", async (record) => {
      expect(record.seq).toBe(seqNo)
    }, { redeliverUnacked: true })
    expect(natsStreamPending()).toBe(1)
    natsStreamAck(seqNo)
    expect(natsStreamPending()).toBe(0)
  })
})
