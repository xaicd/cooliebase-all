# Requirements Specification: compat-manifest 单一真源：把 deployment/apiPartitions/harness 声明并入真源并加机检堵住静默丢失

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`bugfix` | 所属领域：`infra` | 规格标识：`compat-manifest-single-source`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

恢复『compat-manifest 的声明只有一个真源』这一行为：COO-64 补的 deployment / apiPartitions / harness 共 35 行声明回到真源 packages/shared/contract/compat-manifest.json 并随派生进入下游工作区；此后任何『只改生成物』或『真源丢声明』都变成红灯，而不是被下一次回写静默吃掉。


### 缺陷现象 (Symptom)

母本仓同时存在两份 compat-manifest：真源 packages/shared/contract/compat-manifest.json 与生成物 compat-manifest.json（根）/ public/compat-manifest.json（由 pnpm surface:sync 从真源单向回写）。77dda012 只改了根生成物、补了 deployment / apiPartitions / harness 共 35 行，真源未同步 ⇒ 两份分叉。2026-11-04 14:28 真源副本被回写进根文件，那 35 行声明被整段抹掉，母本工作树自此长期 dirty；而 compat:check 全绿 —— 它只校验真源里『已经声明』的东西，既不校验『必须有哪些节』，也不比对镜像与真源是否一致。派生侧同样受害：本客户工作区的两份 manifest 均无这三节 ⇒ COO-64 的部署双模与三类 API 分区声明没有随派生进入客户工作区。复现：cd 母本仓 && git diff 77dda012^ HEAD -- compat-manifest.json && git diff HEAD:compat-manifest.json -- packages/shared/contract/compat-manifest.json

### 根因分析 (Root Cause - 5-Whys)

5-Whys：① 为什么 35 行声明会消失？—— 被 surface:sync 按真源整段覆盖；② 为什么会被覆盖？因为声明只写在生成物里，真源没有；③ 为什么声明会只写在生成物里？因为根 compat-manifest.json 与真源同名同格式、躺在最显眼的仓库根目录，看起来才是『入口文件』，而 AGENTS/CLAUDE 里『真源在 packages/shared/contract/』的说明不足以让人不去手改它；④ 为什么没人拦住？因为 compat:check 只校验『已声明项的正确性』，从不断言『必须有哪些节』，也不比对镜像与真源；⑤ 为什么没人发现？因为 check 链把 contracts:sync（含 surface:sync）排在 surface:check 之前 —— 漂移被自动『治好』，人的错误改动被吃掉且不报错。根因=缺少『必备声明』的机检 + 回写路径不区分『生成物比真源旧』（该同步）与『生成物比真源多』（会吃掉内容，不该同步）。

### 保持既有行为 (Preserved Behavior)

真源路径不变（packages/shared/contract/compat-manifest.json），其余所有引用点（check-compat-manifest / check-llms-sync / sync-openwiki / agent-runtime / harness / clone-project-base）继续指向它；surface:sync 仍会把『生成物比真源旧』的正常漂移同步过去；对外 API、数据库、运行时行为零变更；既有 28 道门禁、18 个 MCP 工具、17 域 / 38 技能等计数声明不变；派生流程 project:init 的正常同步路径不受影响（--force 为逃生阀）。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| compat-manifest 单一真源：把 deployment/apiPartitions/harness 声明并入真源并加机检堵住静默丢失 | compat-manifest-single-source | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为下游契约消费方（派生工程 / 外部 Agent）] 编写红灯复现单测：真源删掉 deployment / apiPartitions / harness 任一节 ⇒ 校验器必须抛错；生成物持有真源没有的顶层键 ⇒ surface:sync 必须拒绝写入并保留原内容

2. **P0** [作为下游契约消费方（派生工程 / 外部 Agent）] 把三节声明并入真源 packages/shared/contract/compat-manifest.json，并同步生成物；新增 scripts/lib/compat-manifest-sections.cjs 承载『必备声明 + 悬空命令』校验，由 compat:check 调用；compat:check 增加镜像与真源逐字节比对；surface:sync 增加『生成物持有真源没有的顶层键 ⇒ 拒绝写入（--force 放行）』护栏

3. **P1** [作为下游契约消费方（派生工程 / 外部 Agent）] 补充回归测试套件 test/unit/compat-manifest-single-source.test.ts 并验证红灯变绿：真源三节齐全、镜像与真源逐字节一致、删除声明报错、悬空命令报错、回写拒绝丢弃、--force 才放行

## 4. 关键业务不变量 (Key Business Invariants)

1. **生成物与真源逐字节一致** —— compat:check 逐字节比对真源与两个生成物；surface:sync 在回写前拒绝丢弃真源没有的内容
2. **必备声明不会静默消失** —— 三节声明的存在性由 scripts/lib/compat-manifest-sections.cjs 断言，缺失即红；单测提供反向对照
3. **声明不许悬空** —— harness.checkCommand / doctorCommand 指向的 npm script 必须在 package.json 里存在，否则判红

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：缺陷复现用例从 Red 变绿：test/unit/compat-manifest-single-source.test.ts 7/7 PASS（含『删声明报错』『悬空命令报错』『回写拒绝丢弃』『--force 才放行』四条红灯对照）
3. **THE system SHALL** 验证：`node scripts/check-compat-manifest.cjs` 与 `node scripts/sync-agent-surface.cjs --check` 均 PASS，且根 compat-manifest.json / public/compat-manifest.json 与真源逐字节一致
4. **THE system SHALL** 验证：既有核心回归测试套件全部通过（0 Regression）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 零破坏性变更：不得改变 compat-manifest 的对外结构语义，只补齐缺失的声明节并固定其真源归属。
* **THE system SHALL COMPLY WITH**: 单真源：同一份声明不允许在两处各写一遍；生成物只允许由脚本回写产生。
* **THE system SHALL COMPLY WITH**: 不降级：不为了通过门禁把必备声明改成可选或加开关绕过。
* **THE system SHALL COMPLY WITH**: 防回归保证：修复不得让正常同步路径（生成物比真源旧）失败。

### 明确不做与负向范围 (Non-Goals)
* 不重构 compat-manifest 的整体结构，也不迁移其它契约文件的真源归属
* 不新增与本缺陷无关的功能或门禁
* 不改动对外 API 契约与历史数据兼容性
