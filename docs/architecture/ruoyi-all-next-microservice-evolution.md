# cooliebase-all-base 微服务演进蓝图（Spring Cloud 对标）

更新时间：2026-08-19

## 1. 目标

使 cooliebase-all-base 在保持当前开发效率的同时，具备向 Spring Cloud 类似架构平滑升级的能力。

## 2. 演进阶段

## 2.1 阶段 A：模块化单体

1. 统一代码库
2. 按域分层（system/infra/bpm/mall 等）
3. Domain Service + Repository Port 先行

## 2.2 阶段 B：可拆分单体

1. 对外 API 全部版本化
2. 事件总线统一（发布/订阅）
3. 读写链路可观察（traceId）
4. 模块具备独立配置、独立打包与独立进程运行
5. BFF 可按 route manifest / `COOLIEBASE_DOMAIN_*_UPSTREAM` 把单域 API 切到独立镜像

独立打包命令与切流约定见 `docs/architecture/cooliebase-all-base-domain-pack.md`。跨域命令/事件约束见 `docs/architecture/cooliebase-all-base-messaging-constraints.md`。模块分层与 SDK/RPC 双模见 `docs/architecture/cooliebase-all-base-plugin-rpc.md`。

## 2.3 阶段 C：微服务化

1. 按域拆分独立服务
2. 每服务独立数据库或独立 schema
3. 网关统一入口
4. 配置中心统一管理
5. 服务注册与发现

## 3. Spring Cloud 能力映射

| 目标能力 | cooliebase-all-base 对应方案 |
|---|---|
| Gateway | Traefik / API Gateway 层 |
| Config Server | 配置中心（Setting + 配置服务） |
| Service Discovery | K8s Service + DNS / 注册中心 |
| Circuit Breaker | 并发治理中的熔断器组件 |
| Distributed Trace | requestId + trace 链路日志 |
| Event Bus | 现有 event-bus 抽象；阶段 C 默认 NATS JetStream |

## 4. 拆分优先级建议

第一优先级（先拆）：

1. pay
2. bpm
3. iot
4. im

第二优先级（按业务量）：

1. mall
2. member
3. crm

## 5. 拆分触发条件

满足任意两项即可进入拆分评估：

1. 单域发布频率显著高于其他域
2. 数据库或中间件依赖与主应用冲突
3. 峰值负载导致整体扩容成本过高
4. 团队协作需要独立发布节奏

## 6. 服务治理硬约束

1. 不允许跨服务直连数据库
2. 不允许跳过网关暴露内部接口
3. 同步调用必须定义超时、重试、熔断
4. 异步事件必须幂等并可重放
5. 服务间契约必须版本化

## 7. Agent 交付要求

当新增核心域或重构核心链路时，Agent 必须同时输出：

1. 当前阶段归属（A/B/C）
2. 是否满足拆分触发条件
3. 若拆分，给出服务边界与数据边界
4. 迁移顺序与回滚策略
