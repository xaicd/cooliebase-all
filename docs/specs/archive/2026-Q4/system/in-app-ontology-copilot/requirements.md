# Requirements Specification: 底座内嵌活体本体自省与AI Copilot抽屉

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`system` | 规格标识：`in-app-ontology-copilot`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

在 cooliebase-all 底座中落地内嵌活体本体自省路由 (/api/ontology)、只读 SQL 沙箱查询端点 (/api/copilot/query) 与前端 AI Copilot 抽屉组件，实现底座独立自治运行并满足层B G8 质检规范。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 底座内嵌活体本体自省与AI Copilot抽屉 | in-app-ontology-copilot | 本规格所交付的业务与技术上下文，严格收敛于 `system` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为企业系统操作员 (Business Operator)] 底座必须暴露 GET /api/ontology 端点，动态返回系统的实体、动词、规则与状态机元数据

2. **P0** [作为企业系统操作员 (Business Operator)] 底座必须提供 POST /api/copilot/query 端点，通过 AST 审计器强制仅限只读 SELECT 查询，并自动注入租户隔离

3. **P1** [作为企业系统操作员 (Business Operator)] 底座前端必须提供 <OntologyCopilotDrawer /> 侧边栏抽屉组件并在 layout.tsx 挂载，支持环境变量控制开关且无假按钮死穴

## 4. 关键业务不变量 (Key Business Invariants)

1. **SQL 只读不可变不变量** —— AST 语法解析强断言 statement.type === 'Select'，非 Select 立即抛出 403 异常拒绝。
2. **租户隔离守卫** —— SQL 解析后强制追加 tenant_id 过滤条件或在参数中绑定租户上下文。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm vitest run test/unit/ontology-copilot.test.ts` exit=0
2. **THE system SHALL** 验证：GET /api/ontology 返回 HTTP 200 及合法的 M1/M2/M3 元数据 JSON
3. **THE system SHALL** 验证：POST /api/copilot/query 对非 SELECT 写入语句拒绝执行并返回 403

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 只读安全沙箱：/api/copilot/query 严禁执行任何 UPDATE、DELETE、DROP、ALTER 等写操作，禁止访问系统敏感表。
* **THE system SHALL COMPLY WITH**: 多租户隔离：所有查询与元数据自省必须遵循租户隔离原则（从会话取 tenant_id）。
* **THE system SHALL COMPLY WITH**: MU 零死穴原则：前端抽屉所有操作按钮均有真实绑定的事件处理逻辑，杜绝空函数与假按钮。

### 明确不做与负向范围 (Non-Goals)
* 不引入重量级外部向量数据库或专用图数据库。
* 不破坏 cooliebase-all 现有的 15 域架构与路由契约。
