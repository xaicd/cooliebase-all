# Requirements Specification: 统一包管理器调用：仓内 npx 全部改为 pnpm exec / pnpm dlx

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`refactor` | 所属领域：`infra` | 规格标识：`npx-to-pnpm`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

消除仓内 `npx` 调用：`npx <pkg>` 在包缺失时会**隐式安装**，绕过 `pnpm-lock.yaml` 这一锁文件真源。统一为 `pnpm exec <tool>`（已安装执行器）/ `pnpm dlx <pkg>`（一次性下载），并把它变成 0 容忍门禁。


### 架构债务与异味分析 (Debt Analysis)

实测（`git grep`）：
- **172 处 `npx`**，分布：`.md` 72 / `.ts` 78 / `.cjs` 20 / `.sh` 9（含 `.agents/`、`.commandcode/` 等隐藏目录，首轮 glob 曾漏掉点目录）。
- 形态：`vitest` 33 / `tsx` 14 / `degit` 12 / `tsc` 5 / `prisma` 5 / `create-cooliebase-app` 5 / `expo` 3 / `playwright` 1 / `@modelcontextprotocol/inspector` 1。
- **最严重的是 6 个脚本里的运行时调用**（`spawnSync("npx", …)`）：`build-feature` / `check-client-build` /
  `clone-project-base` / `deliver` / `load-test` / `mcp/cooliebase-mcp-server` —— 它们会**真的执行 npx**。
- 一处自相矛盾：`scripts/hatch.sh` 注释写「策略 2: pnpm dlx degit」，代码却用 `npx --yes degit`。

### 目标整洁架构形态 (Target Architecture)

- 文档 / 脚本 / 运行时**统一**：已安装工具 → `pnpm exec`；一次性远程工具 → `pnpm dlx`。
- 门禁 `no-new-npx`（`standards:check`）由**棘轮（冻结 37 文件）**升级为 **enforce（0 容忍）**，
  扫描面从 `.md/.sh` 扩到 `.ts/.cjs`（运行时真调用比文档更严重）；规则自身与历史日志豁免。
- AGENTS.md §2.1 新增第 7 条，把 `npx` 策略写进宪法（此前只约束了"安装与锁文件操作"）。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 统一包管理器调用：仓内 npx 全部改为 pnpm exec / pnpm dlx | npx-to-pnpm | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为业务研发工程师] 清点并**分类**所有 npx 形态（本地执行器 vs 一次性下载 vs 运行时调用）

2. **P0** [作为业务研发工程师] 文档与 `.sh` 层替换；**隐藏目录也要扫**（首轮 glob 漏了 `.agents/`）

3. **P0** [作为业务研发工程师] **运行时调用**替换为 `pnpm exec`（含 Windows `pnpm.cmd` 分支），并跑相关用例验证

4. **P1** [作为业务研发工程师] `no-new-npx` 升级为 enforce，并做反向对照（新增一处必须失败）

## 4. 关键业务不变量 (Key Business Invariants)

1. **行为等价** —— 替换后逐个跑受影响脚本的用例/门禁，确认输出与通过状态不变

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0（14 条规范规则全过）
2. **THE system SHALL** 验证：全量测试 0 失败（465 files / 938 tests 基线）
3. **THE system SHALL** 验证：`git grep '\bnpx '` 除规则文本与历史日志外**清零**
4. **THE system SHALL** 验证：改过运行时调用的脚本，其相关用例通过（MCP 22 条）
5. **THE system SHALL** 验证：反向对照：往文档里加一处 `npx …` → `standards:check` 必须 FAIL

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 功能等价：只改**调用方式**，不改命令语义与参数。
* **THE system SHALL COMPLY WITH**: 不得用 `AGENT_ROUTE_SKIP=1` 绕过门禁来达成目的。

### 明确不做与负向范围 (Non-Goals)
* 不在本次重构中增加未经评审的业务新功能
