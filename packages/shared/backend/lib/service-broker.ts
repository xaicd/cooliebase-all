/**
 * Moleculer-style ServiceBroker mapped onto Next.js domains.
 * NestJS NATS semantics (MessagePattern / EventPattern / queue group / headers)
 * stay in messaging-protocol; this broker owns registry, resilience and governance hooks.
 */
import { getTenantContext } from "./biz-tenant"
import {
  type BrokerCallOptions,
  type BrokerCallResult,
  type BrokerContext,
  currentNodeID,
  parseActionName,
} from "./broker-context"
import { invokeAction, resetServiceInvokers } from "./broker-invoke"
import { brokerCacher, loadThroughCacher } from "./broker-cache"
import { applyActionSchema, resetActionSchemas } from "./broker-validator"
import { natsSubscribe, resetNatsFabric } from "./nats-fabric"
import { grpcBindService, resetGrpcFabric } from "./grpc-fabric"
import { resetNatsStream } from "./nats-stream"
import { resetOutbox } from "./transactional-outbox"
import { eventBus } from "./event-bus"
import {
  assertKnownDomain,
  buildCommandEnvelope,
  commandRetryAttempts,
  encodeMessagingHeaders,
  queueGroupFor,
} from "./messaging-protocol"
import {
  hasService,
  heartbeat,
  listNodes,
  listServices,
  ping,
  registerLocalServices,
  registerRemoteService,
  resetBrokerRegistry,
  waitForServices,
} from "./broker-registry"
import {
  bulkheadAcquire,
  circuitAllow,
  circuitRecord,
  circuitStatus,
  resetBrokerResilience,
  retryDelayMs,
} from "./broker-resilience"
import { getDomainCatalogEntry, isFoundationModule } from "../constants/domain-catalog"
import { traceContext } from "./trace-context"
import { ensureContractActions, resetContractActions } from "./contract-actions"
import {
  decodeRpcPayload,
  encodeRpcPayload,
  resolveInvokeMode,
  resolveRemoteProtocol,
  withInvokeTimeout,
} from "./rpc-protocol"
import { dispatchRemoteAction } from "./rpc-transport"

type Middleware = {
  name: string
  before?: (ctx: BrokerContext) => void | Promise<void>
  after?: (ctx: BrokerContext, result: unknown) => void | Promise<void>
  error?: (ctx: BrokerContext, error: string) => void | Promise<void>
}

const middlewares: Middleware[] = []
const metrics = { calls: 0, errors: 0, fallbacks: 0, timeouts: 0, circuitOpen: 0, queueFull: 0 }
let started = false
let runtimeEnv: NodeJS.Dict<string> = process.env

function nextId(): string {
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useMiddleware(middleware: Middleware) {
  middlewares.push(middleware)
}

export function resetBroker() {
  middlewares.length = 0
  Object.assign(metrics, { calls: 0, errors: 0, fallbacks: 0, timeouts: 0, circuitOpen: 0, queueFull: 0 })
  started = false
  runtimeEnv = process.env
  resetBrokerRegistry()
  resetBrokerResilience()
  resetServiceInvokers()
  resetNatsFabric()
  resetGrpcFabric()
  resetNatsStream()
  resetOutbox()
  resetActionSchemas()
  resetContractActions()
  brokerCacher.clear()
}

function bindCommandResponders() {
  for (const service of listServices().filter((item) => item.local)) {
    const domain = service.name
    natsSubscribe(`cooliebase.cmd.${domain}.>`, async (message) => {
      const method = message.subject.split(".").pop() ?? ""
      return invokeAction(domain, method, message.data)
    }, { queue: queueGroupFor(domain) })
    grpcBindService(domain, async (method, data) => {
      const payload = decodeRpcPayload(data, "protobuf")
      const result = await invokeAction(domain, method, payload)
      return encodeRpcPayload(result, "protobuf")
    })
  }
}

export const broker = {
  get nodeID() {
    return currentNodeID()
  },
  get started() {
    return started
  },
  start(env: NodeJS.Dict<string> = process.env) {
    if (started) return broker
    runtimeEnv = env
    registerLocalServices(env)
    heartbeat(currentNodeID(env))
    bindCommandResponders()
    started = true
    return broker
  },
  stop() {
    started = false
    return broker
  },
  getRegistry() {
    return { nodeID: currentNodeID(), nodes: listNodes(), services: listServices() }
  },
  ping,
  waitForServices,
  registerRemoteService,
  getMetrics() {
    return { ...metrics }
  },
  getCircuitBreakerStatus: circuitStatus,
  useMiddleware,
  cacher: brokerCacher,

  async call<T = unknown, R = unknown>(action: string, params?: T, opts: BrokerCallOptions<T> = {}): Promise<BrokerCallResult<R>> {
    if (!started) broker.start()
    metrics.calls += 1
    const startedAt = Date.now()
    let ctx: BrokerContext<T> | undefined
    try {
      const { domain, method } = parseActionName(action)
      if (isFoundationModule(domain)) throw new Error(`Foundation module ${domain} is SDK-only and cannot be invoked over RPC`)
      assertKnownDomain(domain)
      if (!hasService(domain)) throw new Error(`ServiceNotAvailable: ${domain}`)
      await ensureContractActions(domain)
      const parsed = applyActionSchema(action, params, opts.schema) as T
      const tenant = getTenantContext()
      const envelope = buildCommandEnvelope({
        domain,
        method,
        payload: parsed,
        caller: opts.caller ?? "unknown",
        traceId: opts.traceId ?? opts.meta?.traceId ?? traceContext.current()?.traceId ?? nextId(),
        tenantId: opts.meta?.tenantId ?? tenant?.tenantId,
        actorId: opts.meta?.actorId ?? tenant?.actorId,
        idempotencyKey: opts.idempotencyKey ?? opts.meta?.idempotencyKey,
        timeoutMs: opts.timeout,
      })
      ctx = {
        id: nextId(),
        nodeID: currentNodeID(),
        action,
        domain,
        method,
        params: (parsed ?? {}) as T,
        meta: envelope.headers,
        timeoutMs: envelope.timeoutMs,
        retryCount: 0,
      }
      if (!circuitAllow(domain)) {
        metrics.circuitOpen += 1
        throw new Error(`Circuit breaker OPEN for service: ${domain}`)
      }
      for (const hook of middlewares) await hook.before?.(ctx)
      const catalog = getDomainCatalogEntry(domain)
      const retries = opts.retries ?? (catalog ? commandRetryAttempts(catalog, method, opts.idempotencyKey) : 0)
      const timeoutMs = envelope.timeoutMs
      let lastError = ""
      for (let attempt = 0; attempt <= retries; attempt++) {
        ctx.retryCount = attempt
        let release = () => {}
        try {
          release = await bulkheadAcquire(domain)
          const invokeMode = resolveInvokeMode(domain, runtimeEnv)
          const rpcProtocol = invokeMode === "sdk" ? "in-process" as const : resolveRemoteProtocol(runtimeEnv)
          const loaded = await loadThroughCacher(opts.cache, action, parsed, envelope.headers.tenantId, () => {
            if (invokeMode === "sdk") {
              return withInvokeTimeout(invokeAction(domain, method, parsed), timeoutMs)
            }
            return dispatchRemoteAction({
              domain,
              method,
              subject: envelope.subject,
              payload: parsed,
              headers: encodeMessagingHeaders(envelope.headers),
              timeoutMs,
              env: runtimeEnv,
            })
          })
          circuitRecord(domain, true)
          for (const hook of middlewares) await hook.after?.(ctx, loaded.data)
          return { success: true, data: loaded.data as R, duration: Date.now() - startedAt, traceId: envelope.headers.traceId, action, cached: loaded.cached, invokeMode, rpcProtocol }
        } catch (error: any) {
          lastError = error.message
          if (String(lastError).includes("QueueIsFull")) metrics.queueFull += 1
          if (String(lastError).includes("Timeout")) metrics.timeouts += 1
          circuitRecord(domain, false)
          if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt)))
        } finally {
          release()
        }
      }
      throw new Error(lastError || `Action ${action} failed`)
    } catch (error: any) {
      metrics.errors += 1
      const message = error.message as string
      if (ctx) for (const hook of middlewares) await hook.error?.(ctx, message)
      if (opts.fallbackResponse && ctx) {
        metrics.fallbacks += 1
        const data = await opts.fallbackResponse(message, ctx)
        return { success: true, data: data as R, duration: Date.now() - startedAt, traceId: ctx.meta.traceId, fallback: true, action }
      }
      return { success: false, error: message, duration: Date.now() - startedAt, traceId: ctx?.meta.traceId ?? opts.traceId ?? nextId(), action }
    }
  },

  async mcall<T = unknown>(calls: Array<{ action: string; params?: unknown; opts?: BrokerCallOptions }>) {
    return Promise.all(calls.map((item) => broker.call<T>(item.action, item.params, item.opts)))
  },

  async emit(type: string, payload: Record<string, unknown>, source = "system") {
    return eventBus.emit({ type, source, payload })
  },
  async broadcast(type: string, payload: Record<string, unknown>, source = "system") {
    return eventBus.broadcast({ type, source, payload })
  },
  async publishReliable(
    type: string,
    payload: Record<string, unknown>,
    source = "system",
    options: { dispatch?: boolean } = {},
  ) {
    return eventBus.publishReliable({ type, source, payload }, options)
  },
}
