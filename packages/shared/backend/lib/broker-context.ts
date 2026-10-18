export type BrokerMeta = {
  contractVersion?: string
  traceId: string
  tenantId?: string
  actorId?: string
  idempotencyKey?: string
  sourceDomain: string
}

export type BrokerContext<T = unknown> = {
  id: string
  nodeID: string
  action: string
  domain: string
  method: string
  params: T
  meta: BrokerMeta
  timeoutMs: number
  retryCount: number
}

export type BrokerCallOptions<T = unknown> = {
  timeout?: number
  retries?: number
  idempotencyKey?: string
  caller?: string
  traceId?: string
  cache?: boolean | { ttlMs?: number }
  schema?: { parse: (input: unknown) => unknown }
  meta?: Partial<BrokerMeta>
  fallbackResponse?: (error: string, ctx: BrokerContext<T>) => unknown | Promise<unknown>
}

export type BrokerCallResult<R = unknown> = {
  success: boolean
  data?: R
  error?: string
  duration: number
  traceId: string
  fallback?: boolean
  cached?: boolean
  action?: string
  invokeMode?: "sdk" | "rpc"
  rpcProtocol?: "in-process" | "nats-rr" | "grpc"
}

export function parseActionName(action: string): { domain: string; method: string } {
  const trimmed = action.trim()
  const dot = trimmed.indexOf(".")
  if (dot <= 0 || dot === trimmed.length - 1) throw new Error(`Invalid action name: ${action}`)
  return { domain: trimmed.slice(0, dot), method: trimmed.slice(dot + 1) }
}

export function currentNodeID(env: NodeJS.Dict<string> = process.env): string {
  return env.COOLIEBASE_PACK_DOMAIN?.trim() || "all-next"
}
