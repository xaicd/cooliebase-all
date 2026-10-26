# Requirements Specification: 测试之间通过仓库共享文件互相可见，导致 test:clean 间歇随机变红

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`bugfix` | 所属领域：`infra` | 规格标识：`test-shared-file-isolation`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让 `pnpm run test:clean` 成为**可信**的结果：全绿就是全绿，不再随机变红；同时把这次实测出来的每一种失败模式都变成可复现的判据。


### 缺陷现象 (Symptom)

同一份代码、同一台机器，`pnpm run test:clean` 时而全绿、时而红；红的文件**每次都不一样**（实测见过 route-update-arity-rule / vacuous-assertion-rule / frontend-api-url-shape-rule / harness-entry）。单跑那个文件又是绿的。另一条线索：全量跑完**立刻**单跑 `node scripts/check-harness-integrity.cjs` 是绿的、`git status` 也干净 —— 说明失败只发生在**套件运行期间**。

### 根因分析 (Root Cause - 5-Whys)

多个测试要临时改写仓库里的**共享文件**（`package.json` / `scripts/harness.cjs` / `docs/architecture/artifacts/*baseline*.json`），而另一些测试要**读**它们；`vitest.config.ts` 的 `fileParallelism: false` 只保证「文件之间不并行」，**挡不住「A 改动 → B 读到中间态」这类顺序耦合**。5-Whys 收敛到：测试用「就地改写真仓文件」来验证门禁行为，而门禁本身只接受真仓路径 —— 于是隔离性完全依赖调度顺序，而调度顺序不是契约。**已实测**：`git stash` 掉本规格全部改动后基线**本身就是红的**（3 failed / 476 passed），所以这是既有缺陷，不是某次改动引入的。

### 保持既有行为 (Preserved Behavior)

已有正常业务功能与数据保持严格兼容。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 测试之间通过仓库共享文件互相可见，导致 test:clean 间歇随机变红 | test-shared-file-isolation | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为开发者] 作为开发者，同一次提交连跑两遍 `test:clean` 必须得到同一个结论（都绿或都红且指向同一处）。

2. **P0** [作为开发者] 作为开发者，门禁类测试改共享文件时，不能污染到别的测试；被改的状态必须要么对别人不可见，要么改完立刻还原。

3. **P1** [作为开发者] 作为后来者，我需要看得见「哪些测试会改共享文件」，而不是靠 grep 猜。

## 4. 关键业务不变量 (Key Business Invariants)

1. **测试互不污染** —— 任一测试改写共享文件后，其它测试看到的必须是原状；由「连跑 3 次结果一致」与「跑完 git status 干净」共同守。
2. **门禁判定语义不变** —— 修复前后对同一份违规输入，门禁必须给出同样的结论（用一条固定 fixture 对照）。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：`pnpm run test:clean` **连续 3 次**都 exit=0（不是跑一次绿就算）
3. **THE system SHALL** 验证：红测试：修复前能稳定复现「读到中间态」；修复后该用例转绿
4. **THE system SHALL** 验证：反向对照：故意让一个测试留下污染，必须能被发现（否则这条验收是空的）
5. **THE system SHALL** 验证：`git status --porcelain` 在整套跑完后为空（不留下任何被改写的仓库文件）
6. **THE system SHALL** 验证：失败的测试文件集合在 3 次运行中**完全一致**（不再每次不同）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 多租户：业务表带 tenant_id，从全局上下文取，禁止调用方透传（§4.8）。
* **THE system SHALL COMPLY WITH**: 跨域：只走 Domain Facade，不 import 别的域 Service（§3.3）。
* **THE system SHALL COMPLY WITH**: 不改门禁的**判定语义** —— 只改它们「从哪读」，不能为了好测而放宽规则。
* **THE system SHALL COMPLY WITH**: 验证方式必须**确定性**：不接受「多跑几遍碰运气」当验收。
* **THE system SHALL COMPLY WITH**: 已否掉的方案要记进文档（`describe.sequential` 不存在、`singleFork` 更糟），避免后人重试。

### 明确不做与负向范围 (Non-Goals)
* 不引入测试框架替换（不换 vitest）。
* 不靠 `--no-verify`、不靠缩减测试范围来「变绿」。
* 不顺手清理与隔离无关的测试问题。
* 不为了隔离而把被测代码改成可注入路径 —— 除非证明没有更小代价的做法（候选里写清权衡）。
