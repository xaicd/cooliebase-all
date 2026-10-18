# 架构百科：跨域通信、微服务解耦与韧性治理

> 对应规则：AGENTS.md §3.3 / §6

## 一、 通信三原则
1. **同域业务调用**：直接调用本地 Service / Application Port；
2. **跨域同步调用**：必须走 **Domain Facade** 或 `broker.call('cooliebase.cmd.<domain>.<method>')`，严禁直连对方数据库或 import Service；
3. **跨域异步通知**：必须走 `broker.publishReliable()` 经 Outbox 发送领域事件。

## 二、 韧性治理策略 (Resilience)
- **超时与重试**：写请求必须带 `Idempotency-Key`，重试只允许在只读或幂等接口上生效；
- **熔断降级**：服务降级时提供安全的默认值或内存兜底；
- **追踪传递**：所有内部调用必须透传 `traceId`、`tenantId` 与 `actorId` 上下文。
