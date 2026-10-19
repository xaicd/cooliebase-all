# 微服务架构与治理规范（Moleculer + NestJS NATS）

更新时间：2026-08-20

## 1. 原则

对标 [Moleculer](https://github.com/moleculerjs/moleculer) 与 [NestJS NATS](https://docs.nestjs.com/microservices/nats) 的**架构与治理能力**，不引入它们的 Node 运行时。

1. Next.js 仍是 Gateway / BFF。
2. `packages/domains/<domain>` 仍是 Service。
3. `broker` 承担 Moleculer ServiceBroker。
4. 阶段 C 的 Transporter **语义**对齐 NATS（subject、inbox request-reply、queue group、header、至少一次投递），由本仓库自研，不引入 nats.io 服务端或客户端。
5. `shared` 是核心基础 SDK，不是 Service。业务域跨进程才走 RPC；同进程走 Facade 内存调用。

## 2. 能力映射

| Moleculer | NestJS NATS | cooliebase-all |
|---|---|---|
| Node | microservice instance | `COOLIEBASE_PACK_DOMAIN` 或 `all-next` |
| Service | handler module | `packages/domains/<domain>` |
| ServiceBroker | ClientProxy + microservice | `broker` |
| API Gateway | HTTP 应用 | Next Route + domain pack / upstream |
| Transporter | `Transport.NATS` | 自研 `nats-fabric` / `nats-stream`（无 nats.io） |
| `broker.call` / actions | `@MessagePattern` | `cooliebase.cmd.<domain>.<method>` |
| `emit` / `broadcast` | `@EventPattern` + queue group | `eventBus.emit` / `broadcast` |
| transactional outbox | at-least-once + inbox | `runUnitOfWork` / `broker.publishReliable` |
| cacher | n/a | `broker.cacher` / `cache-store` |
| validator | pipes | `registerActionSchema`（Zod） |
| `ctx.meta` | NATS headers | `x-trace-id` 等 |
| registry / ping / waitForServices | status stream | `broker-registry` |
| circuitBreaker / retry / timeout / bulkhead / fallback | 超时与错误映射 | `broker-resilience` + `broker.call` |
| middlewares / metrics / tracer | interceptor + context | `useMiddleware` / `getMetrics` / `trace-context` |
| local action | in-process provider | 同进程 `invokeMode=sdk` |
| remote ClientProxy | gRPC / NATS client | 跨进程 `invokeMode=rpc` + Domain Facade |
| generated actions | generated message patterns | 低代码模板 / codegen ZIP 输出 Facade + `*.rpc.ts` |

权威清单：`packages/shared/backend/constants/microservice-governance.json`  
分层与协议：`docs/architecture/cooliebase-all-plugin-rpc.md`  
门禁：`npm run microservice:check`

## 3. 调用约定

```ts
import { broker } from "@/shared/backend/lib/service-broker"
import { createDomainFacade } from "@/shared/backend/lib/rpc-facade"

await broker.start()
await broker.waitForServices(["pay"])
const pay = createDomainFacade("pay", ["createOrder", "ping"] as const)
await pay.createOrder({ amount: 9900 }, { caller: "mall.order", idempotencyKey: "idem-1" })
await broker.call("pay.ping", { n: 1 }, { cache: true })
await broker.emit("pay.order.paid", { orderId: "pay-001" }, "pay")      // 每组一个消费者
await broker.broadcast("pay.order.paid", { orderId: "pay-001" }, "pay") // 全部消费者
await broker.publishReliable("pay.order.paid", { orderId: "pay-001" }, "pay") // outbox + inbox
```

浏览器继续只走 `/api/v1/...`。同进程 Facade 走 SDK；跨服务走 RPC。NATS subject 只用于服务间。

## 4. 尚未完成

1. 跨库（每域独立数据库）时的 outbox 表归属与投递；`getOutboxStoreForDomain` 已预留，当前仍共用一个 store
2. 其余业务域 Facade 目前只覆盖 `rpc-actions.json` 门面方法，不是该域全部 HTTP 路由。门面列表查询已与 HTTP 共用 `ACTION_SCHEMAS`。**system/infra 不对业务域整体开放**：公开面只有数据字典 `getDictDataByType` 与登录用户信息 `getPermissionInfoByUser`。后台 CRUD 是 BFF 同域 HTTP。infra 无公开业务 RPC；Online 预览/下载与报表数据源走平台面。
3. Go 客户端目前通过 `Invoker` 回调对接；尚未接入官方 `protoc` + grpc-go 运行时
