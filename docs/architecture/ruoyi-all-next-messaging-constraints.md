# 跨域消息约束（NATS 语义 / 非 NestJS 运行时）

更新时间：2026-08-20

## 1. 结论

**不引入 NestJS，也不引入 nats.io。** 自研 NATS 语义：subject、inbox request-reply、queue group、header、至少一次流。

原因：

1. 当前真源是 Next.js BFF + `packages/domains/<domain>`，再叠加一套 Nest 模块/DI，会变成双框架。
2. NestJS NATS transporter **不使用 NATS 原生 Request-Reply**，而是自研 publish + inbox。Go 服务无法直接对接，除非复刻 Nest 信封。
3. 项目演进目标是 TS adapter 可替换为 Go。跨语言总线必须是 **NATS subject + 自有 header**，不能绑在 `@nestjs/microservices` 上。
4. Nest 真正有价值的是约束：`MessagePattern`（同步命令）、`EventPattern`（异步事件）、Queue Group、Header、通配符。这些已经落到 `serviceBus` / `eventBus` / `messaging-protocol.ts`。

## 2. 完整约束

| 通道 | 对标 Nest | Subject | 投递 | 阶段 A/B | 阶段 C |
|---|---|---|---|---|---|
| 浏览器 HTTP | Controller | `/api/v{n}/...` | 请求/响应 | Next Route / 域独立镜像 | 不变，只换 upstream |
| 跨域同步命令 | `@MessagePattern` | `cooliebase.cmd.<domain>.<method>` | 请求/响应，Queue Group=`cooliebase.<domain>` | 自研 fabric inbox | 同一套 subject，可换传输实现 |
| 跨域异步事件 | `@EventPattern` | `cooliebase.evt.<domain>.<entity>.<action>` | pub-sub + 自研 stream ack | 同库同事务 outbox（Kysely / 内存事务） | 跨库拆分仍属阶段 C |
| 同域内部 | Provider 私有调用 | 无 | 进程内 import | 允许 | 允许 |

强制规则：

1. 跨域禁止 `import` 其他域 Service / Repository；必须走 Domain Facade。
2. 同进程走 SDK（不序列化）；跨进程走 RPC（默认 JSON + nats-rr）。
3. 写命令默认不重试；有 `idempotencyKey` 或安全读方法才允许重试。
4. Header 必须携带：`x-trace-id`、`x-source-domain`、`x-contract-version`；租户开启时还要 `x-tenant-id`。
5. 不信任客户端伪造的身份 header；域服务独立做权限与 tenant 校验。
6. `COOLIEBASE_MESSAGING_TRANSPORT` 只表示语义配置；总线是自研 fabric，不连接 nats.io。
7. 资金、库存、审批等可靠跨域流程必须走 `runUnitOfWork` / `broker.publishReliable` + `subscribeReliable`（inbox 按 consumer+eventId 去重）。`emit` / `broadcast` 只是尽力投递。
8. `runUnitOfWork` 与业务写共用同一 store 事务：有真实库时为 Kysely transaction（表 `infra_message_outbox` / `infra_message_inbox`）；无真实库时为可回滚内存事务。跨库拆分仍属阶段 C。

## 3. 为什么阶段 C 选 NATS 而不是先上 Kafka

1. 同时覆盖命令（request-reply）和事件（pub-sub + queue group），与 Nest 文档模型一致。
2. NATS 服务端是 Go，和后续域迁 Go 同一运行时家族。
3. Kafka 更适合超高吞吐日志流，不适合作为默认同步命令总线。
4. 浏览器流量继续走 HTTP；服务间走自研 NATS 语义总线。

## 4. 代码入口

1. 协议：`packages/shared/backend/lib/messaging-protocol.ts`
2. 命令：`packages/shared/backend/lib/service-bus.ts`
3. 事件：`packages/shared/backend/lib/event-bus.ts`
4. 目录：`packages/shared/backend/constants/domain-catalog.json` 的 `messaging` 段
5. 每域声明：`packages/domains/<domain>/contract/route.manifest.yaml` 的 `messaging` 段
6. Broker 与治理清单：`docs/architecture/cooliebase-all-base-microservice-governance.md`
7. 自研 NATS 语义：`packages/shared/backend/lib/nats-fabric.ts`、`nats-stream.ts`
8. 可靠事件：`packages/shared/backend/lib/transactional-outbox.ts`、`outbox-store.ts`、`outbox-kysely-store.ts`
9. 模块分层与 SDK/RPC 双模：`docs/architecture/cooliebase-all-base-plugin-rpc.md`
