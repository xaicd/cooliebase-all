# Requirements Specification: RPC 契约默认不再生成 Go 客户端桩

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`refactor` | 所属领域：`infra` | 规格标识：`stop-go-stubs`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

<!-- 待填: 一句话说清『重构目标：消除哪些技术债，达到何种架构整洁度』 -->


### 架构债务与异味分析 (Debt Analysis)

<!-- 待填: 现有架构痛点、耦合点与坏味道 (Code Smells) -->

### 目标整洁架构形态 (Target Architecture)

<!-- 待填: 重构后的领域边界、分层与交互契约 -->


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| RPC 契约默认不再生成 Go 客户端桩 | stop-go-stubs | 本规格所交付的真实业务与技术上下文，严格收敛于 `infra` 领域边界 |
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

1. **P0** [作为业务研发工程师] <!-- 待填: 确立业务等价性安全网单测 (Parity Tests) -->

2. **P0** [作为业务研发工程师] <!-- 待填: 运用绞杀者模式 (Strangler Fig) 逐步迁移模块 -->

3. **P1** [作为业务研发工程师] <!-- 待填: 清除冗余遗留样板并验证全部门禁 -->

## 5. 关键业务不变量 (Key Business Invariants)

1. **业务数据零破坏** —— 重构不涉及数据库表物理结构的破坏性变更

## 6. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：`pnpm run test:matrix` exit=0 (真实 SQLite 矩阵 100% 通过)
3. **THE system SHALL** 验证：<!-- 待填: 业务等价性单测全部通过 -->

## 7. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 功能等价性：重构前后外部对外 API 行为与返回值 100% 等价保持。
* **THE system SHALL COMPLY WITH**: 跨域通信：必须经过 Domain Facade，禁止违规侵入内部私有服务。

### 明确不做与负向范围 (Non-Goals)
* 不在本次重构中增加未经评审的业务新功能
