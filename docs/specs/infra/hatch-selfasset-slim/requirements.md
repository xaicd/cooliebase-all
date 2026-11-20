# Requirements Specification: hatch裁剪清单补齐底座自留地

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`refactor` | 所属领域：`infra` | 规格标识：`hatch-selfasset-slim`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

hatch 派生（clone-project-base / project-init 双入口）不再把蓝图母仓自身资产带进派生工程：gen 存根树、scratch 脚手架、docs/agent 契约缓存、docs/wiki、llms-full.txt 一律在 hatch 第一道闸剥离，与工坊母仓（coolie）层 B 文档层瘦身清单同源对齐。


### 架构债务与异味分析 (Debt Analysis)

消除重复耦合代码

### 目标整洁架构形态 (Target Architecture)

整洁分层与 Facade 隔离


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| hatch裁剪清单补齐底座自留地 | hatch-selfasset-slim | 本规格所交付的真实业务与技术上下文，严格收敛于 `infra` 领域边界 |
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

1. **P0** [作为派生项目交付工程师] hatch-profile RETIRED_DIR_PREFIXES 增补 gen、scratch、docs/agent、docs/wiki；RETIRED_FILE_PREFIXES 增补 llms-full.txt

2. **P0** [作为派生项目交付工程师] hatch-profile 单测覆盖 5 类新剥离路径（含 gen/go/go.mod、docs/agent/contracts.json 实例断言）

3. **P1** [作为派生项目交付工程师] rtm-traceability-matrix 活跃规格计数改为真源命令引用，不再写死数字

## 5. 关键业务不变量 (Key Business Invariants)

1. **清单同源不变量** —— 本仓 RETIRED 清单与 coolie 工坊 blueprint-derivation.ts copyTreeSlim/scrubLeakedBlueprintDocs 的瘦身项保持逐项一致，任一侧增删必须双向同步

## 6. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm exec vitest run scripts/lib/__tests__/hatch-profile.test.ts scripts/lib/__tests__/hatch-profile-real-catalog.test.ts` 13/13 绿
2. **THE system SHALL** 验证：`pnpm run check` exit=0

## 7. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 前缀匹配语义必须是 rel === p || rel.startsWith(p + '/')，不得裸 startsWith（防误伤 docs/agents 类似名路径）。
* **THE system SHALL COMPLY WITH**: 只裁剪 hatch 复制层；母仓自身工作区资产不动（本仓开发仍依赖这些目录）。
* **THE system SHALL COMPLY WITH**: 与工坊母仓 layerb 派生瘦身清单（gen/scratch/docs/agent/docs/wiki/llms-full.txt）逐项同源。

### 明确不做与负向范围 (Non-Goals)
* 不在本规格内裁剪 docs/architecture、CMMI 01-09 基线资产、TESTING.md（v2 记账）
* 不改 clone-project-base.cjs 白标化替换引擎（盲替换源头收敛属 v2）
