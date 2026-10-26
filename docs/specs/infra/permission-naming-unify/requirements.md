# Requirements Specification: 统一权限码命名：契约 kebab 化 + 路由静态取键 + 全量重生成

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`refactor` | 所属领域：`infra` | 规格标识：`permission-naming-unify`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让权限码只有一种命名 domain:kebab:action。契约、路由、菜单三者对齐后，路由可静态取键（未登记即编译失败），并消掉 112 条 PermissionCode 类型错误与 338 条未登记欠债。


### 架构债务与异味分析 (Debt Analysis)

消除重复耦合代码

### 目标整洁架构形态 (Target Architecture)

整洁分层与 Facade 隔离


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 统一权限码命名：契约 kebab 化 + 路由静态取键 + 全量重生成 | permission-naming-unify | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为后端/网关开发者] 作为开发者，路由里的权限是静态取键（PERMISSIONS.WMS_WAREHOUSE_QUERY），没登记就编译不过

2. **P0** [作为后端/网关开发者] 作为开发者，契约的 permissionPrefix 是 wms:warehouse（kebab，不重复域），与菜单种子一致

3. **P1** [作为后端/网关开发者] 作为交付负责人，contracts:governance 的 338 条欠债被清空而不是继续冻结

## 4. 关键业务不变量 (Key Business Invariants)

1. **未登记即编译失败** —— 路由静态取键 PERMISSIONS.X；X 不存在 → TS2339。反向对照：删一个键必须让构建红。
2. **三种命名收敛为一** —— 契约 permissionPrefix、路由键、菜单种子三者的映射关系写在 brief 与测试里，且 contracts:governance 覆盖检查能发现不一致。
3. **对外契约不变** —— API path、DTO、错误码不动；用 agent:routes:check + build + 契约测试守。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：pnpm run typecheck:check exit=0，且那 112 条 PermissionCode 错误归零
2. **THE system SHALL** 验证：pnpm run contracts:governance:check exit=0，且棘轮基线从 338 收紧到 0
3. **THE system SHALL** 验证：pnpm run build exit=0
4. **THE system SHALL** 验证：pnpm run check exit=0
5. **THE system SHALL** 验证：反向对照：删掉一个已登记的权限码 → 对应路由编译失败（证明静态取键真的在起作用）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 这是重构不是新增：对外 API 路径、DTO、错误契约一律不变（§6.1 兼容性）。
* **THE system SHALL COMPLY WITH**: 权限码的值（domain:kebab:query 等）保持现有菜单种子的形式 —— 那是真正生效的那套。
* **THE system SHALL COMPLY WITH**: 路由文件的行为不变，只改权限的取法（动态 → 静态）。
* **THE system SHALL COMPLY WITH**: 每一批都必须 pnpm run build 通过 —— 前端/路由改动以构建为准，不以类型数下降为准。

### 明确不做与负向范围 (Non-Goals)
* 不改权限的粒度或语义（仍是 query/create/update/delete 四动作）
* 不改菜单种子结构、不改 RBAC 判定逻辑
* 不动 system/infra 已登记的老权限码（只统一业务域那批）
