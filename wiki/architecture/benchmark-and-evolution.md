# 架构百科：对标顶级开源项目差距深度分析与持续演进大典

> 对应规则：AGENTS.md §23 / docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md

## 一、 对标全球顶尖项目矩阵
1. **Supabase (80k★)**: 极致的本地开发体验、Realtime CDC 变更广播、原生 pgvector 向量检索；
2. **MedusaJS v2 (27k★)**: TypeScript 原生可逆 DAG 工作流 (@medusajs/workflows-sdk) 与补偿长事务 (Saga)；
3. **yudao 系开源中后台模板 (25k★ 综合)**: 17 领域工业级模型聚合、Flowable BPMN 2.0 审批流设计器思路、严密的 @DataPermission 部门数据范围抽象；
4. **Directus (30k★) / Refine (29k★)**: 可视化 Low-Code 表单设计、TanStack Table v8 结合虚拟滚动支撑十万级数据；
5. **Strix (60k★)**: 多智能体自主红队渗透测试平台与真实 PoC 验证。

## 二、 核心差距与 7 大改进方向
- **差距 1：长流程编排**：缺少轻量级 TypeScript 原生 Saga / Workflow 工作流引擎与 BPMN 可视化设计；
- **差距 2：数据权限**：尚未在 Kysely AST 层面落地部门级/层级细粒度数据范围注入 (Data Scope ABAC)；
- **差距 3：前端交互**：缺少可视化 Low-Code 动态 Schema 设计面板，大表格缺少虚拟滚动；
- **差距 4：APM 可观测性**：应用缺少标准 OpenTelemetry (OTel) 链路跟踪与 Prometheus /api/metrics 探针；
- **差距 5：AI 知识库**：系统内部缺乏针对租户文档的多租户 RAG 向量检索与私有知识库问答；
- **差距 6：实时长连接**：缺少轻量级 Server-Sent Events (SSE) 实时通道，目前多采用短轮询；
- **差距 7：API 沙箱**：缺少类似 FastAPI / Scalar 在线可交互调试控制台 (/api/docs)。

## 三、 三阶段演进路线 (Phase A / B / C)
- **Phase A (短期必修)**: Kysely AST 数据权限插件、交互式 OpenAPI Scalar 调试沙箱 (/api/docs)、OpenTelemetry 自动埋点；
- **Phase B (中期突破)**: TS 原生可逆 Saga/Workflow 引擎、可视化 Low-Code Schema 设计器、SSE 实时流、TanStack 虚拟滚动；
- **Phase C (长期生态)**: 内置多租户 RAG 向量知识库 (sqlite-vec/pgvector)、动态第三方插件 WASM/Worker 沙箱、Expo 离线优先同步。

完整技术方案请参阅：[BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md](../../docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md)
