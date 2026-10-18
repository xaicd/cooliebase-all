/**
 * Dual-mode invoke: same-process SDK vs cross-process RPC.
 * Protocol/serialization truth lives in domain-catalog.json `rpc`.
 */
import {
  isFoundationModule,
  rpcPolicy,
  type RpcInvokeMode,
  type RpcProtocol,
  type RpcSerialization,
} from "../constants/domain-catalog"
import { isLocalService } from "./broker-registry"

export function resolveInvokeMode(domain: string, env: NodeJS.Dict<string> = process.env): RpcInvokeMode {
  if (isFoundationModule(domain)) {
    throw new Error(`Foundation module ${domain} is SDK-only and cannot be invoked over RPC`)
  }
  return isLocalService(domain, env) ? "sdk" : "rpc"
}

export function assertSupportedRemoteProtocol(protocol: string) {
  const policy = rpcPolicy()
  if (policy.rejected.includes(protocol)) {
    throw new Error(`Rejected RPC protocol: ${protocol}`)
  }
  const allowed: RpcProtocol[] = [policy.remote.protocol, policy.stageC.protocol]
  if (!allowed.includes(protocol as RpcProtocol)) {
    throw new Error(`Unsupported RPC protocol: ${protocol}`)
  }
}

export function encodeRpcPayload(payload: unknown, serialization: RpcSerialization = rpcPolicy().remote.serialization): unknown {
  if (serialization === "none") return payload
  if (serialization === "json") {
    try {
      return JSON.parse(JSON.stringify(payload ?? null))
    } catch {
      throw new Error("RpcSerializationError: payload is not JSON-serializable")
    }
  }
  return encodeProtobufFrame(payload)
}

export function decodeRpcPayload(payload: unknown, serialization: RpcSerialization = rpcPolicy().remote.serialization): unknown {
  if (serialization === "none" || serialization === "json") return payload
  return decodeProtobufFrame(payload)
}

export function encodeProtobufFrame(payload: unknown): Uint8Array {
  const body = new TextEncoder().encode(JSON.stringify(payload ?? null))
  const frame = new Uint8Array(5 + body.length)
  frame[0] = 0
  new DataView(frame.buffer).setUint32(1, body.length)
  frame.set(body, 5)
  return frame
}

export function decodeProtobufFrame(payload: unknown): unknown {
  if (!(payload instanceof Uint8Array)) return payload
  if (payload.length < 5) throw new Error("RpcSerializationError: truncated protobuf frame")
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  if (payload[0] !== 0) throw new Error("RpcSerializationError: compressed protobuf is not supported")
  const length = view.getUint32(1)
  if (5 + length > payload.length) throw new Error("RpcSerializationError: truncated protobuf payload")
  return JSON.parse(new TextDecoder().decode(payload.subarray(5, 5 + length)))
}

export function resolveRemoteProtocol(env: NodeJS.Dict<string> = process.env): RpcProtocol {
  const raw = env.COOLIEBASE_RPC_PROTOCOL?.trim()
  if (raw === "grpc" || raw === "nats-rr") {
    assertSupportedRemoteProtocol(raw)
    return raw
  }
  return rpcPolicy().remote.protocol
}

export function resolveRemoteSerialization(protocol: RpcProtocol = resolveRemoteProtocol()): RpcSerialization {
  if (protocol === "grpc") return rpcPolicy().stageC.serialization
  if (protocol === "in-process") return rpcPolicy().local.serialization
  return rpcPolicy().remote.serialization
}

export async function withInvokeTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function describeInvoke(domain: string, env: NodeJS.Dict<string> = process.env) {
  const mode = resolveInvokeMode(domain, env)
  if (mode === "sdk") {
    return {
      mode,
      protocol: rpcPolicy().local.protocol,
      serialization: rpcPolicy().local.serialization,
      facadeRequired: rpcPolicy().local.facadeRequired,
    }
  }
  const protocol = resolveRemoteProtocol(env)
  return {
    mode,
    protocol,
    serialization: resolveRemoteSerialization(protocol),
    facadeRequired: rpcPolicy().remote.facadeRequired,
  }
}
