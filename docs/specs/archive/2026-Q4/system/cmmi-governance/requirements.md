# Requirements Specification: CMMI 全生命周期交付治理与 8 大工程技能体系

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`system` | 规格标识：`cmmi-governance`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

在底座中建立 CMMI 01_management 至 09_operations 全生命周期交付规范，集成 8 大 CMMI 原生技能，落地真实工程交付资产，确立实事求是与无真实数据留空铁律。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 未明确
- 目标指标 (Target): 未明确


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| CMMI 全生命周期交付治理与 8 大工程技能体系 | cmmi-governance | 本规格所交付的真实业务与技术上下文，严格收敛于 `system` 领域边界 |
| 领域门面契约 | Domain Facade | 业务模块对外暴露的标准契约接口，跨域通信单向调用，内部实现自闭环 |
| 数据隔离策略 | Data Isolation Policy | 依据客户交付形态按需选择（单租户物理独立库 / 多租户行级租户隔离可选特性） |

## 3. 业务需求立项与多端建设交付范围 (Business Intake & Multi-Terminal Scope)

### 3.1 真实业务立项背景
- **交付目标**: 面向客户真实业务场景，消灭手工低效流程与断点。
- **服务对象**: 涵盖 B 端业务操作员、管理员及终端客户角色，杜绝无主需求。

### 3.2 多端建设覆盖边界
- **B端管理中台**: 负责业务运营配置、流程审核、数据对账与大盘监控。
- **C端用户门户/移动端**: 负责业务直接录入、消费结算与进度查询（按需）。
- **多端协议对齐**: 多端统一遵循 OpenAPI/REST 契约规范，共享领域状态机。

## 4. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为系统架构师 / 研发工程师] 在 .agents/skills/ 沉淀 8 大 CMMI 原生技能，并通过 pnpm run skills:check 实行单一真源强制校验。

2. **P0** [作为系统架构师 / 研发工程师] 在 docs/01_management 至 09_operations 建立两级过程资产库，落地立项书、风险册、真实 ADR、测试总结与门禁凭证。

3. **P1** [作为系统架构师 / 研发工程师] 确立『真实证据驱动、零假 Demo』交付铁律，未发生生产故障与无真实运营流水的目录保持严格留空。

## 5. 关键业务不变量 (Key Business Invariants)

1. **No Artifact, No Done** —— 每个阶段必须交付真实物理工程资产，严禁口头声明完工
2. **实事求是留空准则** —— 无真实生产事故与流水账单的目录保持严格留空，杜绝伪造假 Demo 糊弄

## 6. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0，20 道门禁全部通过
2. **THE system SHALL** 验证：`pnpm run skills:check` 验证 36 项技能规范且无重复目录
3. **THE system SHALL** 验证：`pnpm run test:matrix` 真实数据库测试 100% 通过（55 passed / 6 skipped）

## 7. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 单一真源：技能唯一真源为 .agents/skills/<name>/SKILL.md，严禁建立重复副本。
* **THE system SHALL COMPLY WITH**: 零假 Demo：严禁伪造虚假事故复盘与虚假财务流水，无真实数据保持留空。
* **THE system SHALL COMPLY WITH**: No Artifact, No Done：每个工单必须产出真实物理工程资产之一，并附带退出码为 0 的可核验凭证。

### 明确不做与负向范围 (Non-Goals)
* 不在底座模板中硬编码虚构的业务生产故障事故或虚假的线上对账流水
