# Requirements Specification: G1 需求门禁 · EARS 需求基线（Spec-Kit SRS）

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`system` | 规格标识：`g1-requirements-baseline`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

以 EARS 五态句式（普遍/事件/状态/异常/可选）标准化底座全部规格的用户故事与验收准则，经 speckit 流水线（brief.json → requirements.md）固化需求基线，使每条需求可追溯、可测试、无二义性，通过 gate_g1_spec 需求门禁。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 未明确
- 目标指标 (Target): 未明确


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| G1 需求门禁 · EARS 需求基线（Spec-Kit SRS） | g1-requirements-baseline | 本规格所交付的业务与技术上下文，严格收敛于 `system` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为产品 / 业务 Owner] The system shall 将每条用户故事标准化为 EARS 五态句式之一（普遍/事件/状态/异常/可选），主语恒为『THE system』，消除『应当/可能/大概』类二义性措辞。

2. **P0** [作为产品 / 业务 Owner] WHEN 开发者执行 `pnpm harness speckit new` 创建新规格, the system shall 生成 brief.json、evidence.json 与 spec.json 骨架并将规格置为 PLAN_APPROVED 基线状态。

3. **P0** [作为产品 / 业务 Owner] WHILE 执行 `pnpm harness speckit build`, the system shall 以 brief.json 为唯一真源渲染 requirements.md、design.md、plan.md、tasks.md 等阶段文档，禁止手写渲染产物。

4. **P0** [作为产品 / 业务 Owner] WHEN 执行 `pnpm harness speckit check --spec <名> --phase requirement --strict`, the system shall 逐一校验规格 requirements.md 存在且零『待填』占位注释（HTML 注释形式的未填标记），任一缺陷即以非零退出码阻断。

5. **P1** [作为产品 / 业务 Owner] IF 规格 brief.json 缺失 title/domain/goal、角色少于 2、用户故事少于 3、验收准则少于 2、不变量少于 1 或任务少于 3, THEN the system shall 以退出码 2 拒绝 build 并逐项打印缺失清单。

6. **P1** [作为产品 / 业务 Owner] WHERE 规格声明非功能需求（性能/可用性/租户隔离）, the system shall 为每一个数字指标标注度量方式与实测日期，无实测数据的指标保持留空而非臆造。

## 4. 关键业务不变量 (Key Business Invariants)

1. **无占位符基线** —— 任何进入门禁的规格 requirements.md 必须零『待填』占位注释；check-delivery.cjs inspectFeatureDocs 以占位注释计数一票否决
2. **单一真源防漂移** —— 需求变更只允许修改 brief.json 后重新 build 渲染；直接改渲染产物即视为基线漂移，check 阶段判红
3. **数字可追溯** —— 每条性能/可用性数字（如 26,877 RPS 容量护栏、P95 ≤ 20ms）必须标注度量方式与实测日期，无实测则留空

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm harness speckit build --name g1-requirements-baseline` 成功渲染 requirements.md，其中每条用户故事均为 EARS 五态句式、每条验收准则以『THE system SHALL 验证』开头
2. **THE system SHALL** 验证：`node scripts/check-delivery.cjs --spec g1-requirements-baseline --phase requirement --strict` 返回退出码 0，requirements.md 零『待填』占位注释
3. **THE system SHALL** 验证：`pnpm harness speckit list` 中 g1-requirements-baseline 显示为 system 域、enhancement 型、PLAN_APPROVED、活跃施工
4. **THE system SHALL** 验证：requirements.md 的验收准则条数与 brief.json acceptance 数组一一对应（≥2 条，含真实可执行命令与预期退出码）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 单一真源：brief.json 是需求唯一真源，requirements.md 是渲染产物；严禁绕过 brief.json 另建单体 SRS 第二真源或手写 requirements.md 骨架。
* **THE system SHALL COMPLY WITH**: 门禁纪律：G1（gate_g1_spec）必须经 `pnpm harness speckit check --phase requirement --strict` 真实退出码 0 方可通过，严禁口头声明通过。
* **THE system SHALL COMPLY WITH**: 波次纪律：tasks 表必须为 T1 → T2 → T3 波次结构（渲染层硬编码波次顺序），父任务必须是 main 或已存在任务 ID。

### 明确不做与负向范围 (Non-Goals)
* 不实现新业务功能代码，不改动任何既有规格（如 multi-end-template-engine、cmmi-governance）的 brief.json
* 不建立绕过 per-spec brief.json 的单体 SRS 文档作为第二真源（docs/02_requirements/software-requirements.md 定位为收敛入口，非真源）
