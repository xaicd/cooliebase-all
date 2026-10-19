# 模块分层与双模调用（SDK / RPC）

更新时间：2026-08-20

## 1. 结论

1. **核心基础模块**只有 `shared`：它是每个进程都打包进去的运行时 SDK，**不是微服务**，禁止独立部署，禁止对它做 RPC。
2. **平台域**是 `system`、`infra`：可随 BFF 共置，必要时可拆，但默认不先拆。
3. **业务域**是其余原生域（pay / mall / crm 等）以及 `online`：可以独立打包、独立运行、独立部署。
4. 调用方永远只依赖 **Domain Facade**（application port），禁止 `import` 其他域 Service / Repository。
5. **同一个运行时**：Facade 走内存 SDK，不序列化。
6. **独立部署后**：同一 Facade 切到 RPC。默认协议是自研 NATS request-reply + JSON；阶段 C 跨语言 typed RPC 才用 gRPC + protobuf。
7. **不采用** Dubbo、Thrift、Hessian 作为默认真源。

权威清单：`packages/shared/backend/constants/domain-catalog.json` 的 `layers` 与 `rpc`。

## 2. 三层模块

| 层 | 模块 | 能否独立部署 | 如何被调用 |
|---|---|---|---|
| Foundation | `shared` | 否，永远随进程分发 | 直接 import SDK（auth、broker、outbox、cache） |
| Platform | `system`、`infra` | 可以，但默认与 BFF 共置 | 同进程 SDK；拆出后走 Facade/RPC |
| Business | bpm、pay、mall、crm、erp、wms、mes、ai、iot、im、mp、member、report、online | 可以 | 同进程 SDK；独立进程 RPC |

`shared` 不进 domain catalog 的 `domains` 列表，也不出现在 `broker` 的 service registry 里。

```
┌─────────────────────────────────────────────┐
│                 浏览器 / App                 │
│              只走 /api/v{n}/... HTTP         │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│              Next.js BFF / Gateway          │
│   shared SDK（永远同进程）                    │
│   system / infra（默认共置）                  │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┴────────────┐
          │ Domain Facade           │
          │ createDomainFacade()    │
          └────────────┬────────────┘
                       │
        ┌──────────────┴──────────────┐
        │ 同进程：SDK 内存调用          │ 跨进程：RPC
        │ invokeAction()              │ nats-rr + JSON
        │ serialization=none          │ 阶段 C：gRPC+protobuf
        └─────────────────────────────┘
```

## 3. 接口暴露面（四条，互不混用）

| 暴露给谁 | 形态 | 例子 | 禁止 |
|---|---|---|---|
| 浏览器 / 小程序 | 版本化 HTTP | `/api/v1/admin/pay/...` | 把 Service 类或 Prisma 类型泄漏给前端 |
| 同域内部 | 本地 application port | `PayOrderService.create` | Route 里写事务 |
| 跨域同步 | Facade 方法 = RPC action | 业务域调 `systemPublicFacade.getDictDataByType` / `getPermissionInfoByUser` | 把 system/infra 后台 CRUD 当公开 RPC；直接 import 其他域 |
| 跨域异步 | 可靠事件 | `cooliebase.evt.pay.order.paid` | 只靠内存 emit 做资金/库存 |

Facade **是强制的**。它就是 RPC 接口：

```ts
import { createDomainFacade } from "@/shared/backend/lib/rpc-facade"

const pay = createDomainFacade("pay", ["ping", "createOrder"] as const)
await pay.createOrder({ amount: 9900 }, { caller: "mall.order", idempotencyKey: "idem-1" })
```

同进程时 `broker.call` 的 `invokeMode=sdk`；`COOLIEBASE_PACK_DOMAIN=mall` 且 pay 在别的进程时，`invokeMode=rpc`。调用方代码不变。

## 4. 协议与序列化如何定

| 场景 | 协议 | 序列化 | 状态 |
|---|---|---|---|
| 同进程 | in-process SDK | none（对象直传） | 已落地 |
| 跨进程命令（TS↔TS，阶段 A/B） | HTTP `/api/internal/rpc`（信封 nats-rr） | JSON | 已落地 |
| 浏览器 | HTTP `/api/v1/...` | JSON | 已落地 |
| 跨语言 typed RPC（阶段 C 语义） | 自研 gRPC unary（无 `@grpc/grpc-js`） | protobuf frame（protojson 载荷） | 已落地；跨进程同样走 `/api/internal/rpc` |
| 可靠事件 | 自研 stream + outbox/inbox | JSON | 已落地 |

明确拒绝作为默认真源：

1. **Dubbo / Hessian**：Java 中心，和 TS/Go 演进冲突。
2. **Thrift**：多一套 IDL 与运行时，收益不足以覆盖现有 NATS subject 契约。
3. **Moleculer / NestJS transporter**：只对标治理能力，不引入运行时。

阶段 C 的 gRPC **只替换** Facade 后面的 remote adapter（`dispatchRemoteAction`）。方法名、DTO、权限与 tenant 语义保持不变；浏览器 HTTP 契约不变。当前实现是自研 unary：路径 `/cooliebase.<domain>.v1.<Domain>Service/<Method>`，5 字节帧 + protojson，不引入 grpc 运行时。每域 `.proto` 与 Go 客户端桩（`gen/go/<domain>/v1/service.go`）已生成；Go 侧通过 `Invoker` 对接传输，尚未接入官方 grpc-go。

## 5. 双模切换规则

```ts
import { broker } from "@/shared/backend/lib/service-broker"

broker.start()                              // all-in-one：全域 SDK
broker.start({ COOLIEBASE_DOMAIN_PAY_UPSTREAM: "http://pay:3100" })  // BFF：pay 走 RPC
broker.start({ COOLIEBASE_PACK_DOMAIN: "pay" })  // pay 进程：本域 SDK，外域 RPC
broker.start({ COOLIEBASE_PACK_DOMAIN: "pay", COOLIEBASE_RPC_PROTOCOL: "grpc" })
```

1. **一体进程**（不设 `COOLIEBASE_PACK_DOMAIN`，也不设该域 `COOLIEBASE_DOMAIN_*_UPSTREAM`）→ SDK，`invokeAction`，不序列化。
2. **拆出该域**（BFF 设置了该域 upstream，或本进程 `COOLIEBASE_PACK_DOMAIN` 不是该域）→ RPC。
3. 跨进程默认走 HTTP `POST /api/internal/rpc`（信封仍是 nats-rr + JSON；`COOLIEBASE_RPC_PROTOCOL=grpc` 时带 protobuf frame）。同测进程、没有 upstream 时仍用内存 fabric，方便单测。
4. 两种模式都经过 Facade、Zod、timeout、retry、bulkhead、circuit breaker。调用方代码不变。
5. 拆出的域进程只处理本域 action；其它域通过 `COOLIEBASE_RPC_GATEWAY`（通常是 BFF）回呼。

## 6. 代码入口

1. 分层与协议策略：`packages/shared/backend/constants/domain-catalog.json`
2. 双模与 codec：`packages/shared/backend/lib/rpc-protocol.ts`
3. Facade：`packages/shared/backend/lib/rpc-facade.ts`；参考域 `packages/domains/pay/contract/pay.facade.ts`
4. 远程 adapter：`packages/shared/backend/lib/rpc-transport.ts`
5. 自研 gRPC unary：`packages/shared/backend/lib/grpc-fabric.ts`
6. 契约 action schema：`packages/domains/<domain>/contract/actions.ts`（由 `rpc-actions.json` 生成）
7. 域 Facade：`packages/domains/<domain>/contract/<domain>.facade.ts`
8. Go proto：`packages/domains/<domain>/contract/<domain>.proto`（`npm run domain:contracts`）
9. Go 客户端桩：`gen/go/<domain>/v1/service.go`（无 grpc-go 运行时，注入 `Invoker`）
10. Broker 分发：`packages/shared/backend/lib/service-broker.ts`；`rpc-actions.json` 的 `service`/`module`/`target` 指定落到哪个 Service 文件
11. 跨进程 RPC：`packages/shared/backend/lib/rpc-http.ts`，入口 `POST /api/internal/rpc`
12. 门禁：`npm run microservice:check` 与 `npm run domain:check`
13. 低代码：Online 预览/下载走 `infraPlatformFacade.previewCodegen` / `generateCodegen`；字典走 `systemPublicFacade.getDictDataByType`；模板引擎 Facade 预置与 codegen ZIP / module-pack 输出 `createDomainFacade` 与 `*.rpc.ts`

## 7. 低代码模板与生成器

低代码产物必须能在一体进程和拆分进程里用同一套调用面：

1. **Online** 不得 `import` `CodegenEngineService` 或 `SystemDictService`。预览/下载走 `infraPlatformFacade`，字典走 `systemPublicFacade.getDictDataByType`；一体是 SDK，拆出后是 RPC。Codegen IR 类型走 `infra/contract/codegen.types.ts`。system/infra **不对业务域整体开放**，公开面只有字典与登录用户信息。
2. **模板引擎** `next-react-admin-service-facade` 生成 `createDomainFacade`；组合包同时输出 `*.rpc.ts`。
3. **Codegen ZIP / module-pack** 为生成 Service 附带 RPC binding，并写明跨域禁止 import Service。
4. 浏览器仍只走 `/api/v1/...`；生成器不会把 Next Service 类型泄漏给前端页面。
