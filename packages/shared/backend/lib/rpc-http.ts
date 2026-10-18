/**
 * Cross-process RPC over HTTP. Same Facade; no nats.io / grpc-js.
 * All-in-one skips this path (SDK). Split uses RUOYI_DOMAIN_*_UPSTREAM or RUOYI_RPC_GATEWAY.
 */
import { getDomainCatalogEntry, rpcPolicy } from "../constants/domain-catalog"
import { applyActionSchema } from "./broker-validator"
import { invokeAction } from "./broker-invoke"
import { isLocalService, readDomainUpstream } from "./broker-registry"
import { ensureContractActions } from "./contract-actions"
import {
  decodeRpcPayload,
  encodeRpcPayload,
  resolveRemoteProtocol,
  resolveRemoteSerialization,
} from "./rpc-protocol"

export const RPC_TOKEN_HEADER = "x-cooliebase-rpc-token"

export type RpcHttpEnvelope = {
  domain: string
  method: string
  protocol?: string
  payload: unknown
}

export type RpcHttpResult =
  | { success: true; data: unknown }
  | { success: false; error: string; status: number }

export function rpcHttpPath(): string {
  return rpcPolicy().remote.httpPath || "/api/internal/rpc"
}

export function resolveRpcBaseUrl(domain: string, env: NodeJS.Dict<string> = process.env): string | undefined {
  const specific = readDomainUpstream(domain, env)
  if (specific) return specific
  const packed = env.RUOYI_PACK_DOMAIN?.trim()
  if (packed && packed !== domain) {
    const gateway = env.RUOYI_RPC_GATEWAY?.trim()
    return gateway ? gateway.replace(/\/+$/, "") : undefined
  }
  return undefined
}

export function assertRpcToken(headers: Record<string, string | undefined>, env: NodeJS.Dict<string> = process.env) {
  const expected = env.RUOYI_RPC_TOKEN?.trim()
  if (!expected) {
    if (env.NODE_ENV === "production") throw new Error("RUOYI_RPC_TOKEN is required in production")
    return
  }
  const got = headers[RPC_TOKEN_HEADER] ?? headers[RPC_TOKEN_HEADER.toUpperCase()]
  if (got !== expected) throw new Error("Unauthorized RPC")
}

function asHeaderMap(headers: HeadersInit | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  if (!headers) return result
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value
    })
    return result
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) result[key.toLowerCase()] = value
    return result
  }
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") result[key.toLowerCase()] = value
  }
  return result
}

function toWirePayload(payload: unknown, serialization: "json" | "protobuf" | "none"): unknown {
  const encoded = encodeRpcPayload(payload, serialization === "none" ? "json" : serialization)
  if (encoded instanceof Uint8Array) return { frame: Array.from(encoded) }
  return encoded
}

function fromWirePayload(payload: unknown, protocol?: string): unknown {
  if (payload && typeof payload === "object" && Array.isArray((payload as { frame?: unknown }).frame)) {
    return decodeRpcPayload(Uint8Array.from((payload as { frame: number[] }).frame), "protobuf")
  }
  if (protocol === "grpc") return decodeRpcPayload(payload, "protobuf")
  return payload
}

export async function handleInternalRpc(
  input: RpcHttpEnvelope & { headers?: Record<string, string | undefined>; env?: NodeJS.Dict<string> },
): Promise<RpcHttpResult> {
  const env = input.env ?? process.env
  try {
    const headers = Object.fromEntries(
      Object.entries(input.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
    )
    assertRpcToken(headers, env)
    const domain = String(input.domain ?? "").trim()
    const method = String(input.method ?? "").trim()
    if (!domain || !method) return { success: false, error: "domain and method are required", status: 400 }
    if (!getDomainCatalogEntry(domain)) return { success: false, error: `Unknown domain: ${domain}`, status: 404 }
    if (!isLocalService(domain, env)) return { success: false, error: `ServiceNotLocal: ${domain}`, status: 404 }
    const payload = fromWirePayload(input.payload, input.protocol)
    await ensureContractActions(domain)
    const parsed = applyActionSchema(`${domain}.${method}`, payload)
    const data = await invokeAction(domain, method, parsed)
    return { success: true, data }
  } catch (error: any) {
    const message = String(error?.message ?? "rpc failed")
    const status = message.includes("Unauthorized") ? 401 : message.includes("ValidationError") ? 400 : 500
    return { success: false, error: message, status }
  }
}

export async function httpRpcCall(input: {
  domain: string
  method: string
  payload: unknown
  headers: Record<string, string>
  timeoutMs: number
  env?: NodeJS.Dict<string>
}): Promise<unknown> {
  const env = input.env ?? process.env
  const base = resolveRpcBaseUrl(input.domain, env)
  if (!base) throw new Error(`NoResponders for ${input.domain}: missing upstream or RUOYI_RPC_GATEWAY`)
  const protocol = resolveRemoteProtocol(env)
  const serialization = resolveRemoteSerialization(protocol)
  const token = env.RUOYI_RPC_TOKEN?.trim()
  const response = await fetch(`${base}${rpcHttpPath()}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...input.headers,
      ...(token ? { [RPC_TOKEN_HEADER]: token } : {}),
    },
    body: JSON.stringify({
      domain: input.domain,
      method: input.method,
      protocol,
      payload: toWirePayload(input.payload, serialization),
    } satisfies RpcHttpEnvelope),
    signal: AbortSignal.timeout(input.timeoutMs),
  })
  const json = (await response.json()) as { success?: boolean; data?: unknown; error?: string }
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `RPC HTTP ${response.status} for ${input.domain}.${input.method}`)
  }
  return json.data
}

export function headersFromRequest(request: { headers: Headers }): Record<string, string> {
  return asHeaderMap(request.headers)
}
