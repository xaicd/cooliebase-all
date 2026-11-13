# Requirements Specification: 类型检查纳入交付门禁：1268 个存量类型错误的分级治理

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`typecheck-gate`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让类型错误**不能新增**：`tsc --noEmit` 以棘轮方式进入 check 链，新增错误即失败，存量 1268 条冻结待逐步清偿。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 类型检查纳入交付门禁：1268 个存量类型错误的分级治理 | typecheck-gate | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为本仓 AI 员工 / 开发者] 作为开发者，我改完代码跑 `pnpm run check`，若新增类型错误则失败并点名文件与行号

2. **P0** [作为本仓 AI 员工 / 开发者] 作为交付负责人，我能用一条命令看到「当前错误数 vs 基线」，且基线只能被显式收紧

3. **P1** [作为本仓 AI 员工 / 开发者] 作为接手的 AI 员工，我能从基线里按目录看到债务分布，优先清自己能清的

## 4. 关键业务不变量 (Key Business Invariants)

1. **只拦新增** —— 当前错误集合 − 基线集合 = 新增；新增非空 → exit 1。反向对照：注入一处错误必须被拦。
2. **解析失败必须失败** —— tsc 输出解析不出任何 `error TS` 且退出码非 0 → 视为门禁故障，exit 2（不得当成「0 错误」静默通过）
3. **基线不可静默增长** —— 只有 `--write-baseline` 能改基线；CI 不自动写。基线增长会在 diff 里可见。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0（含新门禁）
2. **THE system SHALL** 验证：新增 1 个类型错误 → `pnpm run typecheck:check` exit=1，且输出点名 file(line,col) 与错误码
3. **THE system SHALL** 验证：修复 1 个存量错误 → 门禁仍 exit=0，且基线可被 `--write-baseline` 收紧（数字下降）
4. **THE system SHALL** 验证：基线文件包含**按目录聚合**的存量分布（便于排期）
5. **THE system SHALL** 验证：反向对照：把一个已知错误行改回来 → 必须被拦（防止门禁读不到输出而恒绿）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 本任务**不是**一次性修完 1268 个错误（见 nonGoals）。
* **THE system SHALL COMPLY WITH**: 棘轮语义：只拦新增；基线用显式命令收紧，不自动改写。
* **THE system SHALL COMPLY WITH**: 不允许用 `@ts-ignore` / `any` 批量压制来「降低数字」——那会把债务变成不可见。
* **THE system SHALL COMPLY WITH**: 不得放宽 check 链里任何既有门禁。

### 明确不做与负向范围 (Non-Goals)
* 一次性清零 1268 个类型错误（属多轮工程，本 spec 只建「不再变坏」的机制）
* 把 `tsc --noEmit` 变成逐步「全量强制」（那是清零之后的事）
* 修改业务逻辑以迁就类型（本 spec 只治理「门禁」，不改业务）
