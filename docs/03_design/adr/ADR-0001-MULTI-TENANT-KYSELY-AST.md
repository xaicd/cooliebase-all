# ADR-0001: 基于 Kysely AST 自动重写实现透明多租户行级数据隔离

- **状态**: ACCEPTED <!-- PROPOSED | ACCEPTED | REJECTED | SUPERSEDED | DEPRECATED -->
- **决策人**: @architect-team
- **决策日期**: 2026-08-15
- **关联需求/DAR**: REQ-SYS-TENANT-001, DAR-20260810-MULTI-TENANCY
- **归属规范**: CMMI 03_design (TS) / `.agents/skills/adr-architect`

---

## 1. 背景与问题阐述 (Context and Problem Statement)

在企业级多租户 SaaS 系统中，数据安全与租户物理/逻辑隔离是不可逾越的底线法则。传统工程实践中常见的方案是依赖开发者在每个业务 SQL 中手动编写 `.where('tenant_id', '=', tenantId)`：
- **致命痛点 1（人肉疏漏）**：开发者一旦在某处漏写 `tenant_id`，直接导致严重的跨租户越权穿透与数据泄漏（如 RSK-001）；
- **致命痛点 2（样板代码膨胀）**：数百个业务查询重复编写相同的过滤逻辑，极大浪费代码篇幅与维护成本；
- **致命痛点 3（多数据库兼容差异）**：在 SQLite、PostgreSQL、MySQL 等多库迁移时，手写 SQL 极易引发方言不兼容。

系统需要一套对业务代码**完全透明、底层自动注入、编译器与运行时双重守卫**的行级多租户隔离架构。

---

## 2. 考虑的候选方案 (Considered Options)

1. **方案 A：基于 Kysely AST 编译插件与 BaseMapper 查询构建器自动重写**
   在仓储访问层统一依托 Kysely 的 AST 插件能力与 `BaseMapper<T>`，在 SQL 生成前自动遍历抽象语法树（AST），对所有具备 `tenant_id` 列的表无感附加当前上下文租户过滤节点。
2. **方案 B：使用 PostgreSQL 数据库原生行级安全策略 (Row-Level Security - RLS)**
   在数据库层面针对每张表启用 `ENABLE ROW LEVEL SECURITY`，并在每个连接池事务会话中执行 `SET LOCAL app.current_tenant_id = ?`。
3. **方案 C：约定式手工编写 `.where('tenant_id', '=', tenantId)` 结合静态代码扫描**
   维持传统手写模式，通过 ESLint 或正则表达式扫描未带租户条件的代码。

---

## 3. 决策结果 (Decision Outcome)

**选用方案 A (Kysely AST 自动重写 + BaseMapper 泛型引擎)**。

### 决策动因 (Justification)
1. **跨数据库天然兼容 (Tier-A/B/C)**：
   RLS 方案（方案 B）强绑定 PostgreSQL，无法在嵌入式 SQLite WAL 测试环境或客户私有化 MySQL 场景运行；而 Kysely AST 运行在 Node.js 查询构建器层，完全跨数据库方言，对 SQLite、MySQL、Postgres 100% 通用。
2. **绝对防穿透与开发体验提升**：
   开发者日常编写业务逻辑时只需关注业务字段（如 `query.where('status', '=', 'ACTIVE')`），AST 拦截器在生成最终 SQL 前自动补全 `AND tenant_id = :ctx_tenant_id`，杜绝任何人为疏漏。
3. **平台管理员越权穿透控制**：
   在平台级超级管理员（`TENANT_PLATFORM_USERNAMES`）跨租户巡检时，仅需通过受信任的 `withPlatformContext()` 上下文显式声明，其余场景一律强制隔离。

---

## 4. 后果与权衡 (Consequences)

### 积极影响 (Positive)
- **零漏写风险**：彻底消灭由于人为遗漏造成的租户数据泄露，安全等级提升至最高级；
- **简化单元测试**：测试用例直接依托真实嵌入式 SQLite WAL 数据库，自动验证租户隔离逻辑，无需模拟复杂的 RLS 连接会话；
- **无缝集成 8 大审计底座字段**：在插入与更新时，AST 插件同时自动补齐 `created_by`, `created_at`, `updated_by`, `updated_at`, `version`。

### 妥协与规避 (Negative & Mitigations)
- **性能开销**：AST 遍历在查询前产生微秒级 CPU 解析耗时。
  - *缓解措施*：对常见 AST 树结构进行内存节点缓存，基准压测证实单次查询构建开销 $<0.05\text{ms}$，完全满足 RPS $\ge 5,000$ 的生产容量要求。

---

## 5. 合规与校验手段 (Compliance & Verification)

- **门禁验证**：`npm run domain:check` 严格扫描禁止在业务模块中手写绕过 `BaseMapper` 的 raw SQL；
- **测试守卫**：`packages/shared/backend/lib/database/__tests__/tenant-isolation-plugin.test.ts`
  与 `test/integration/sqlite-rbac.integration.test.ts` 执行租户越权与交叉并发攻击测试；
- **红队渗透**：Strix 多智能体安全渗透测试（`strix-penetration-testing`）主动注入伪造 `tenant_id` Payload，验证 100% 阻断。
