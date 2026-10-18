---
name: architecture-design
description: 架构演进、单体与微服务拆分、前后端分离、网关与跨域通信。
---

# 架构设计与微服务演进规范

## 1. 适用场景
- 确定系统部署形态（单体/拆分）、网关路由与服务拓扑。
- 定义领域边界（Bounded Context）与跨域依赖关系。
- 实施阶段演进（阶段 A 单体 -> 阶段 B BFF 代理 -> 阶段 C 独立微服务）。

## 2. 权威依据
- `AGENTS.md` §1 (项目定位与复用基座)
- `AGENTS.md` §3 (架构总览、目录约束与可替换后端边界)
- `AGENTS.md` §6.1 (microservice-evolution 治理)
- `docs/architecture/cooliebase-all-architecture.md`
- `docs/architecture/cooliebase-all-microservice-governance.md`
- `packages/shared/backend/constants/domain-catalog.json`

## 3. 三阶段演化路径 (Evolution Stages)

```
[ 阶段 A: 模块化单体 (Modular Monolith) ]  <-- 当前主形态
    Next.js 同进程运行，各 Domain 通过 Domain Facade 内存互调 (零序列化开销)
          ↓ (流量增长 / 团队拆分)
[ 阶段 B: BFF 网关代理 (BFF + Split Upstream) ]
    Next.js 作为智能网关，按 Route Manifest 动态反向代理至独立域进程
          ↓ (独立数据所有权 / 多语言)
[ 阶段 C: 独立微服务 (Autonomous Microservices) ]
    域服务独立部署 (Node/Go)，分库分表，通过自研 NATS/gRPC 与 可靠事件总线交互
```

## 4. 跨域调用双模机制 (Dual-Mode Communication)

跨域必须且只能通过 **Domain Facade** 调用，底层由运行时自动切换通信载体：

```typescript
// 业务代码中统一写法 (透明双模):
const dictData = await systemPublicFacade.getDictDataByType("sys_user_sex")
```

- **单体模式（In-Process）**：Facade 直接调用本进程对应 Service 实例，零网络损耗。
- **微服务模式（Remote RPC）**：Facade 自动切入 `broker.call('cooliebase.cmd.system.getDictDataByType', payload)`，通过 HTTP/NATS 发送至远程服务。

## 5. 可靠事件总线 (Outbox + Inbox 模式)
- 跨域异步解耦禁止依赖单机内存 EventEmitter（防止进程重启丢失事件）。
- 生产跨域事件必须写入 **Outbox 事务表**，由发布者可靠发送至消息总线，消费端经 **Inbox 幂等表** 去重后执行。

## 6. 绝对禁止项
- 禁止任何业务域直接 import 另一个业务域的 Service 或 Repository。
- 禁止未经流量和数据边界论证，盲目为了“微服务”而将系统碎片化。
- 禁止使用用户前端 JWT 令牌作为微服务之间的内部调用凭证（必须走 `COOLIEBASE_RPC_TOKEN`）。
