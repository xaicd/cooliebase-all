# Requirements Specification: 生成校验器字段类型与表元数据相悖导致 HTTP 边界拒绝合法输入

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`bugfix` | 所属领域：`infra` | 规格标识：`validator-type-drift`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让生成的路由校验器与表元数据（`scripts/data/*-tables.ts`）的字段类型一致，恢复『文本列可以提交字符串』这一预期行为；并把该一致性变成机检，防止再次漂移。


### 缺陷现象 (Symptom)

校验器的 Zod 字段类型与表元数据不一致，**在真实消费路径上拒绝合法输入**。

已量化的漂移：比对 323 份 `*.validator.ts` 与元数据，**1117 处字段级不一致** —— 794 处「元数据为文本列、校验器却要求数字」、0 处反向、323 处 `id: bigint ↔ z.string()` 属**有意约定**（约 48% 的原始计数其实是这个约定）。

**已确证的实例**：`pay-order.status` —— 元数据/物理列与应用四层语义矛盾，真实库报 `invalid input syntax for type integer: "WAITING"`（已随 DAR `pay-order-status-column-type` 修复）。

**可达性（本规格立项时判错、已订正）**：初版写的是「HTTP 路由 400」，前提有误 —— 实测 `ai-api-key` 路由**既要求鉴权、又不调用校验器**（探针跑出 401 而非 400）。
查证后确认校验器有两条消费路径：① 路由直接 `.parse(`（全仓 62 处，wms 是最大面 32 处，而 **wms 实测漂移为 0**）；② `contract/*.actions.ts` 把 schema 映射到 broker 主题（`cooliebase.cmd.pay.payOrder.create` 等），**跨域调用会走它** —— 本规格的红灯用例即锚定这条路径。

794 处的**逐项可达性仍未证明**，故不可按该数字直接开工。

### 根因分析 (Root Cause - 5-Whys)

5-Whys：
1. 为什么合法输入被拒？校验器把文本字段声明成了数字。
2. 为什么是数字？它由元数据生成，而生成时的元数据类型已经变了。
3. 为什么没重新生成？元数据后来被修正（`fill-missing-columns` 补列、类型映射修复），但**没有机制推动生成物跟随**。
4. 为什么没人发现？**没有门禁比对「生成物字段类型 vs 元数据」**；且漂移只在真实库或 schema 消费点暴露，内存回退完全看不见。
5. 为什么门禁缺失？既有检查只覆盖「表定义存在性」与「路由存在性」，没有字段类型这一维度。

**同族**：与 `ai_chat_message` 仓储列未覆盖元数据同根 —— 元数据单向流动，生成物可能停在旧版本。

### 保持既有行为 (Preserved Behavior)

1. `z.coerce.number()` 对**数字列**的强制转换语义不变（且 `z.coerce` 仍接受数字字符串）；
2. `id` 类字段的 `z.string()` **保持不变** —— 那是有意约定，不是漂移；
3. 校验器的 `.optional()` / `.strict()` 等既有形态不变；
4. 不改任何业务 Service / Repository / 数据库结构。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 生成校验器字段类型与表元数据相悖导致 HTTP 边界拒绝合法输入 | validator-type-drift | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为受影响用户] 编写**红灯复现**：断言 `cooliebase.cmd.pay.payOrder.create` 的 action schema 接受非数字字符串状态；还原为 `z.coerce.number()` 时必须失败（已双向验证）

2. **P0** [作为受影响用户] 按元数据类型修正试点路径的校验器字段类型，红测转绿

3. **P1** [作为受影响用户] **可达性收敛**：按域枚举校验器消费路径，把 794 收敛为真实可达的字段集，再排优先级

4. **P2** [作为受影响用户] 补门禁 `validator:types:check`（带反向对照 + ID 约定白名单），逐域推广、未修域棘轮冻结

## 4. 关键业务不变量 (Key Business Invariants)

1. **校验器不得比元数据更严格（文本列必须接受字符串）** —— codemod 按元数据类型重写 + 门禁 `validator:types:check` 比对；ID 约定走显式白名单
2. **ID 字符串化属有意约定，不得被误改** —— codemod 与门禁都对 `id` 及元数据为数值型的 `*_id` 显式跳过，并在门禁输出中计数

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：红灯用例双向验证：修复后通过（Green）；还原为数值型则失败（Red）
3. **THE system SHALL** 验证：真实库域级测试保持 0 失败：`npm run verify:real-db -- packages`
4. **THE system SHALL** 验证：既有全量测试 0 回归（456 文件 / 889 用例基线）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 零破坏性变更：不得破坏已有对外 API 契约与历史数据兼容性。
* **THE system SHALL COMPLY WITH**: 反假 Mock：必须由真实测试数据库用例复现并验证修复。
* **THE system SHALL COMPLY WITH**: 防回归保证：修复不得引入次生故障或破坏既有正常流转。

### 明确不做与负向范围 (Non-Goals)
* 不在本轮一次性修完全部 794 处（先试点一个域，验证方法后再推广）
* 不改动 `id: bigint ↔ z.string()` 这一有意约定
* 不引入新的校验库（沿用既有 Zod）
