# Requirements Specification: 产物并存两种界面：业务管理 UI + dsh 对话 UI（通过 MCP 打通）

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`dsh-product-integration`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让交付产物同时具备两种界面：客户原来的业务管理界面（768 个页面，不动），以及一个可对话的 dsh 界面；dsh 通过 MCP 调用业务能力。模板仍是模板，产物可显式启用 dsh。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 产物并存两种界面：业务管理 UI + dsh 对话 UI（通过 MCP 打通） | dsh-product-integration | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为客户业务用户] 作为业务用户，我打开 /admin 看到的还是原来的业务界面，没有任何变化

2. **P0** [作为客户业务用户] 作为 AI 使用者，我打开 dsh 界面能列出本仓的 18 个 MCP 工具，并能问出真实业务数据

3. **P0** [作为客户业务用户] 作为交付工程师，我关掉 dsh 后业务界面照常可访问（AI 必须是可选项）

4. **P1** [作为客户业务用户] 作为维护者，模板的 kind 仍是 workspace-bundle，doNotVendor 只对模板生效、对产物按声明放开

## 4. 关键业务不变量 (Key Business Invariants)

1. **模板不含运行时** —— agent-profile.kind 仍为 workspace-bundle；反向对照：模板 import Cordis 必须红。
2. **AI 可关** —— 关闭 dsh 进程后业务界面与 API 仍然 200；用既有 delivery:boundary:check + 一条冒烟守。
3. **能力单一真源** —— dsh 的业务能力全部来自 MCP server，不在 dsh 侧重复实现业务逻辑。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：agent-profile.json 的 kind 仍是 workspace-bundle，且新增 productRuntime 段声明「产物可启用 dsh」
2. **THE system SHALL** 验证：check-harness-bundle.cjs 按作用域校验：模板禁 vendor，产物允许声明 dsh
3. **THE system SHALL** 验证：MCP server 能被 dsh 列为 18 个工具（接入后实测工具清单，未实测前不声称）
4. **THE system SHALL** 验证：业务界面（/admin/**）与 dsh 界面都能访问（两个进程/两个端口或反代）
5. **THE system SHALL** 验证：关闭 dsh 进程后，业务界面与 API 照常 200（AI 可关）
6. **THE system SHALL** 验证：pnpm run check exit=0 · pnpm run build exit=0
7. **THE system SHALL** 验证：反向对照：在模板里 import Cordis → 门禁必须红（证明边界仍在守）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 模板（本仓）不实现 agent loop，不 vendor Cordis / dsh-agent-loop —— 这条不变。
* **THE system SHALL COMPLY WITH**: 产物可以显式声明启用外部 agent 运行时（dsh），启用方式是配置 + 进程，不是把 loop 写进业务代码。
* **THE system SHALL COMPLY WITH**: 768 个 admin 页面、973 个 service、342 份契约一个字都不改。
* **THE system SHALL COMPLY WITH**: AI 关闭时业务界面必须完全可用（已有事实：admin 页面 0 处依赖 agent）。

### 明确不做与负向范围 (Non-Goals)
* 不 fork dsh 源码，不把 23,934 个上游提交拉进本仓
* 不把 768 个 admin 页面改写成 dsh 的 client plugin
* 不把 973 个 service 改写成 Cordis 服务
* 不改业务数据模型与对外 API 契约
