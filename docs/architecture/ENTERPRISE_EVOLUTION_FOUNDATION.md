# cooliebase-all-base 企业级六大高阶能力基座与自演进体系大典

> **定位**：本文档定义了 `cooliebase-all-base` 顶级全栈模板的六大企业级演进基座（微服务治理、全链路追踪、接口风控、日志监控、数据分析、AI 智能报表）。
> **核心原则**：新孵化项目开箱即拥有全部六大能力，底层由 `shared` 与 `infra` 模块托管，业务开发无需重新造轮子，零 Token 冗余消耗！

---

## 🏛️ 六大企业级高阶能力全景矩阵

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. 微服务治理与韧性 (Microservice Governance & Resilience)                 │
│     ├── 服务自发现与就绪探测：`runtime-readiness.ts`, `service-broker.ts`   │
│     ├── 熔断降级与隔离舱：`broker-resilience.ts` (CircuitBreaker, Bulkhead)  │
│     └── 双模 RPC 通信：同进程内存 SDK + 跨进程 NATS/gRPC Facade              │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. 全链路追踪与可观测性 (Distributed Tracing & Telemetry)                  │
│     ├── W3C TraceContext：`trace-context.ts` (traceId, spanId 自动贯穿)      │
│     ├── 跨边界透传：HTTP Header ➔ RPC Payload ➔ EventBus 消息体            │
│     └── 耗时与慢调用捕获：`observability.ts` 毫秒级性能画像                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. 接口风控与安全防御 (API Risk Control & Protection)                      │
│     ├── 高性能滑动窗口限流：`rate-limiter.ts` (基于内存/Redis 令牌桶)        │
│     ├── 接口防篡改与防重放：`protection-signature.ts` (Timestamp + Nonce)   │
│     └── 声明式幂等锁与 XSS 防护：`protection-idempotent.ts`, `web-xss.ts`    │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. 日志监控与审计追溯 (Structured Logging & Audit Center)                  │
│     ├── 结构化 JSON 语义日志：`domain-log.ts` (关联 TraceId)                │
│     ├── 操作与合规审计：`audit-log.ts`, `packages/domains/monitor/`               │
│     └── 审计归档与保留策略：`scripts/run-audit-log-retention.ts`             │
├─────────────────────────────────────────────────────────────────────────────┤
│  5. 数据分析与运营大盘 (Data Analytics Engine)                              │
│     ├── 统一数据分析引擎：`packages/domains/report/`                              │
│     ├── 多维指标聚合：租户业务统计、活跃度大盘、交易/工单趋势分析            │
│     └── 动态报表设计器：支持拖拽配置图表与 SQL 数据集绑定                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  6. AI 智能报表与数据洞察 (AI Intelligent NL-to-Chart BI)                   │
│     ├── 自然语言转 SQL/DSL (ChatBI)：`packages/domains/ai/`                       │
│     ├── 智能图表自动渲染：折线图、柱状图、饼图、漏斗图自适应生成             │
│     └── AI 业务洞察与异常诊断：自动提取指标波动原因并输出摘要研报            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 业务领域接入指引（零 Token 冗余）

当为新业务（如 WMS/CRM/MES）开发接口或服务时：

1. **自动继承微服务熔断与 RPC**：
   - 跨域调用直接通过 `broker.call('cooliebase.cmd.pay.createOrder', params)`，自动享受超时重试与熔断降级。
2. **自动注入全链路追踪与日志**：
   - `withAdminRoute` 自动从 HTTP 请求解析 `traceparent`，并在日志中自动打上 `[traceId]` 标签。
3. **声明式接口风控**：
   - 在 API 路由中简单挂载 `rateLimiter({ limit: 100, windowMs: 60000 })` 即可开启高精度滑动窗口限流。
4. **AI 智能报表联动**：
   - 业务数据表自动注册到 `ai/report` 目录，AI 对话助手可直接通过自然语言生成该业务域的实时图表！
