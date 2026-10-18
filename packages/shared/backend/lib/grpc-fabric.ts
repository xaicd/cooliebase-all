/**
 * In-house gRPC unary fabric. No @grpc/grpc-js.
 * Paths: /cooliebase.<domain>.v1.<Domain>Service/<Method>
 */
import { withInvokeTimeout } from "./rpc-protocol"

export type GrpcMetadata = Record<string, string>
export type GrpcUnaryHandler = (method: string, data: unknown, metadata: GrpcMetadata) => Promise<unknown>

const services = new Map<string, GrpcUnaryHandler>()

export function resetGrpcFabric() {
  services.clear()
}

export function grpcMethodPath(domain: string, method: string): string {
  const service = `${domain.charAt(0).toUpperCase()}${domain.slice(1)}`
  const rpc = `${method.charAt(0).toUpperCase()}${method.slice(1)}`
  return `/cooliebase.${domain}.v1.${service}Service/${rpc}`
}

export function parseGrpcPath(path: string): { domain: string; method: string } {
  const matched = path.match(/^\/cooliebase\.([a-z][a-z0-9]*)\.v1\.[A-Z][A-Za-z0-9]*Service\/([A-Z][A-Za-z0-9]*)$/)
  if (!matched) throw new Error(`Invalid gRPC path: ${path}`)
  const rpc = matched[2]
  return { domain: matched[1], method: `${rpc.charAt(0).toLowerCase()}${rpc.slice(1)}` }
}

export function grpcBindService(domain: string, handler: GrpcUnaryHandler) {
  services.set(domain, handler)
}

export function grpcStatus() {
  return { driver: "in-house", serviceCount: services.size }
}

export async function grpcUnary<T = unknown>(
  path: string,
  data: unknown,
  options: { metadata?: GrpcMetadata; timeoutMs?: number } = {},
): Promise<T> {
  const { domain, method } = parseGrpcPath(path)
  const handler = services.get(domain)
  if (!handler) throw new Error(`UNAVAILABLE: NoResponders for ${path}`)
  const timeoutMs = options.timeoutMs ?? 5000
  try {
    return (await withInvokeTimeout(Promise.resolve().then(() => handler(method, data, options.metadata ?? {})), timeoutMs)) as T
  } catch (error: any) {
    const message = String(error.message ?? error)
    if (message.includes("Timeout")) throw new Error(`DEADLINE_EXCEEDED: ${message}`)
    throw error
  }
}
