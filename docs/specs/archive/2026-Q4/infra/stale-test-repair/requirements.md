# Requirements Specification: 修复 6 条既存测试失败：退役脚本引用 + 过期断言

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`bugfix` | 所属领域：`infra` | 规格标识：`stale-test-repair`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

修好仓内长期挂着的 6 条既存测试失败（2 个文件），使全量测试只剩 0 条失败；并把其中一处断言改成耐增长且有真实约束的形式（声明的 Skill 必须真实存在），避免同类失效再犯。


### 缺陷现象 (Symptom)

`env -u DATABASE_URL -u DB_DRIVER -u NODE_ENV pnpm exec vitest run` 长期为 2 failed files / 6 failed tests。明细：`test/unit/spec-driven-agent-workflow.test.ts` 5 条，报 `Command failed: pnpm exec tsx scripts/spec-ops.ts new|build|archive …`；`scripts/lib/__tests__/agent-profile.test.ts` 1 条，报 `expected ['coding','automated-testing',…(2)] to deeply equal ['coding','automated-testing',…(1)]`。该 6 条在本次之前的多轮改动中都做过同环境前后对照，确认非新增，一直被当作 known pre-existing 记录。

### 根因分析 (Root Cause - 5-Whys)

两条独立根因：① 5 条（spec 闭环测试）：`scripts/spec-ops.ts` 已在提交 `d158d1f1` 被退役，统一收敛到 `scripts/speckit.ts`（`new` / `build` / `archive` 子命令齐备），但测试未跟改，仍在调已不存在的脚本 —— 属「改了生产侧、漏改测试侧」。5-Whys 到根因：服务入口改名/收敛后缺少「测试引用的脚本是否真实存在」这一层校验，于是断裂只能靠跑测试才发现，且被发现后又被记成「独立 ticket」搁置。② 第 6 条（agent-profile 测试）：该用例用 `toEqual` 精确断言 `npc.layers.L0.skills`，而 `agent-profile.json` 后来给 L0 补了 `project-init`（第 4 项）—— 测试编码的是改动前的世界。5-Whys 到根因：用「精确全等」断言一个会随能力增长而增长的列表，于是每次往角色里加技能都会把这条测试打红，而它红的意义（这几个核心技能必须在）与它断言的严格度（只能有这几个）并不一致。

### 保持既有行为 (Preserved Behavior)

① 生产侧一行不改：`scripts/speckit.ts`、`scripts/archive-spec.cjs`、`agent-profile.json`、生成器模板全部保持现状 —— 本次只修测试侧（对齐仓库既有原则：根因在测试假设时，改测试而不是弱化产品行为）。② 被修用例仍须覆盖原有意图：spec 闭环仍要验证「按域隔离落盘 / brief 特化字段 / 声明式展开产物齐备 / delivery 门禁可识别 / 归档可追溯」；agent-profile 仍要验证「workspace-bundle 身份 + 不托管 agent loop」。③ 测试对工作区保持零残留（活跃区与归档区都要清干净）。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 修复 6 条既存测试失败：退役脚本引用 + 过期断言 | stale-test-repair | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为基座维护者] 红灯复现 (Red Test)：跑这两个文件，确认 6 条失败可稳定复现并定位到具体断言（已完成诊断，见 rootCause）

2. **P0** [作为基座维护者] 把 spec 闭环测试的 3 处 `scripts/spec-ops.ts` 改为 `scripts/speckit.ts`，并把过期的 `根因分析 (Root Cause)` 断言改为能匹配生成器实际标题（`### 根因分析 (Root Cause - 5-Whys)`）的锚定正则

3. **P0** [作为基座维护者] 把 agent-profile 的 L0/L4 精确全等断言改为「必须包含核心技能」+「每一层声明的技能都必须在 .agents/skills/<name>/SKILL.md 真实存在」，使其耐增长且有真实约束

4. **P1** [作为基座维护者] 全量回归：确认 6 条转绿且不引入任何新失败，并确认测试未留下目录残留

## 4. 关键业务不变量 (Key Business Invariants)

1. **声明的技能必须真实存在** —— agent-profile 测试遍历全部分层，逐项校验 .agents/skills/<name>/SKILL.md 存在，缺失即失败并列出具体项
2. **测试零残留** —— beforeAll/afterAll 清理活跃区与归档区；用跑前跑后 git status 一致作为客观判据

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：`pnpm exec vitest run test/unit/spec-driven-agent-workflow.test.ts scripts/lib/__tests__/agent-profile.test.ts` exit=0（6 条由 Red 变绿）
3. **THE system SHALL** 验证：全量 `pnpm exec vitest run` 的 failed tests = 0（此前恒为 6，且要求新增失败也为 0）
4. **THE system SHALL** 验证：零残留：跑完两个测试文件后 `git status --porcelain` 与跑之前一致

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 只改测试：不得为了通过而改动 `speckit.ts` / `archive-spec.cjs` / `agent-profile.json` 或生成器模板。
* **THE system SHALL COMPLY WITH**: 不得用放宽断言的方式消灭失败：被修断言必须仍然验证原意图（spec 闭环的五项语义、workspace-bundle 身份）。
* **THE system SHALL COMPLY WITH**: 不得写死会随组合变化的常量（如技能总数、层内技能精确条数）—— 那是本次失效的成因。
* **THE system SHALL COMPLY WITH**: 零残留：测试自建目录（活跃区与归档区）必须在 afterAll 清干净，调用后 `git status --porcelain` 不得新增条目。

### 明确不做与负向范围 (Non-Goals)
* 不把 `spec-ops.ts` 作为兼容别名加回来（正确做法是让引用方跟改，而不是维持已退役入口）
* 不重构 speckit 引擎或生成器模板
* 不新增测试框架依赖或改变测试运行方式
