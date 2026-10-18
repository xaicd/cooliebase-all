import { describe, expect, it } from "vitest"
import { grpcMethodPath, grpcStatus, grpcUnary, parseGrpcPath, resetGrpcFabric, grpcBindService } from "../grpc-fabric"
import { decodeRpcPayload, encodeRpcPayload } from "../rpc-protocol"

describe("in-house gRPC unary fabric", () => {
  it("maps domain methods to gRPC paths", () => {
    expect(grpcMethodPath("pay", "createOrder")).toBe("/cooliebase.pay.v1.PayService/CreateOrder")
    expect(parseGrpcPath("/cooliebase.pay.v1.PayService/CreateOrder")).toEqual({ domain: "pay", method: "createOrder" })
    expect(grpcStatus().driver).toBe("in-house")
  })

  it("round-trips unary protobuf frames", async () => {
    resetGrpcFabric()
    grpcBindService("pay", async (method, data) => {
      const payload = decodeRpcPayload(data, "protobuf") as { amount: number }
      return encodeRpcPayload({ method, amount: payload.amount }, "protobuf")
    })
    const reply = await grpcUnary(
      grpcMethodPath("pay", "createOrder"),
      encodeRpcPayload({ amount: 9900 }, "protobuf"),
      { metadata: { "x-trace-id": "t-1" }, timeoutMs: 200 },
    )
    expect(decodeRpcPayload(reply, "protobuf")).toEqual({ method: "createOrder", amount: 9900 })
  })

  it("returns UNAVAILABLE when the service is not bound", async () => {
    resetGrpcFabric()
    await expect(grpcUnary(grpcMethodPath("mall", "ping"), new Uint8Array(), { timeoutMs: 50 })).rejects.toThrow(/UNAVAILABLE/)
  })
})
