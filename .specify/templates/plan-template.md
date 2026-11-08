# Technical Architecture & Implementation Plan: {{TITLE}}

> **Spec-Kit 架构与技术实施方案 (ADD: Architecture & Design Document)**
> 上游真源：`spec.md` (或 `requirements.md`)。技术方案严格支撑需求，严禁反向变更业务目标。
> 状态：`PLAN_APPROVED` | 所属领域：`{{DOMAIN}}` | 规格标识：`{{NAME}}`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0.2 模式复用 / Rule 0.6 真实测试驱动)

---

## 1. 关键不变量与防御性约束 (Key Invariants & Guards)

{{INVARIANTS_SECTION}}

## 2. 领域架构边界与调用拓扑 (Architecture Topology & Flows)

{{ARCHITECTURE_OVERVIEW}}

### 核心业务时序图 (Archify Mermaid Flow)
```mermaid
sequenceDiagram
    autonumber
    actor User as 客户端/Admin UI
    participant BFF as BFF Route (/api/v1/...)
    participant Facade as {{DOMAIN}} Domain Facade
    participant Service as {{NAME}} Core Service
    participant Repo as BaseMapper Repository
    participant DB as Real Database (PostgreSQL/SQLite)

    User->>BFF: 发起业务请求 (携带 Trace & TenantContext)
    BFF->>Facade: 参数校验通过并调用 Facade
    Facade->>Service: 状态机守卫与业务编排
    Service->>Repo: 执行持久化操作 (自动注入 tenant_id 与审计列)
    Repo->>DB: 事务提交与写操作落盘
    Service-->>Facade: 结构化领域响应
    Facade-->>BFF: 统一标准契约包装
    BFF-->>User: 成功响应
```

## 3. 数据模型与持久化契约 (Data Model & Tables)

实体结构严格遵循底座 8 大审计底座字段规范：
- `id` (主键)
- `tenant_id` (多租户标识)
- `creator` / `create_time` (创建人/时间)
- `updater` / `update_time` (更新人/时间)
- `deleted` (逻辑删除标识)
- `version` (乐观锁版本号)

### 涉及实体与变更说明
{{ENTITIES_SECTION}}

## 4. API 契约与权限体系 (API Contracts & Security)

{{API_CONTRACTS_SECTION}}

## 5. 状态机流转与边界守卫 (State Machine Transitions)

{{STATES_SECTION}}

## 6. 技术风险评估与缓解策略 (Technical Risks & Mitigations)

{{RISKS_SECTION}}

## 7. E2E 页面拟人操作运营配置与全链路自动化测试 (E2E Human-Like Ops & Automated Testing)

- **反 Seed 铁律（Rule 0.8）**：严禁通过 SQL 脚本或后台静默函数直接灌入商品、分类、优惠券、营销活动等业务运营数据；必须通过 Playwright 驱动真实浏览器页面拟人操作（登录 `/admin/login` -> 打开 `/admin/{{DOMAIN}}/...` 运营页 -> 点击 `createButton` -> 填写 `[data-testid="field-..."]` -> 点击 `formSubmit` -> 断言 `table` 新增行）完成运营配置。
- **B 端运营配置 → C 端消费体验 → B 端履约闭环**：通过 `pnpm run e2e:ops` 与 `pnpm run test:matrix` 执行端到端拟人配置与真实数据库状态机全链路验证。
