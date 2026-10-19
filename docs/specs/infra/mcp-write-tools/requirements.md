# Requirements Specification: 低代码 MCP 写类工具（B1 二期）：scaffold.plan / codegen.preview

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`infra` | 规格标识：`mcp-write-tools`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

把 MCP 消费面从 14 个只读工具扩展到含 plan/preview 语义的写类工具，使外部 Agent（Claude Code / Cursor / DSH / hermes）无需记忆 npm 命令顺序即可自行规划域脚手架与低代码生成；落盘仍是显式的人工/后续批次动作。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): MCP 工具 14 个，全部只读或只跑白名单门禁（compat-manifest additive 明写只收 read-only 工具）。写动作 domain:new / speckit:new|build / tables:migration / codegen-inject 仅存在于 package.json npm scripts，需人工记住命令与先后顺序。B1 一期代码内自注『写类工具（codegen.preview / scaffold.plan）需耦合 codegen service，留待 B1 二期』。
- 目标指标 (Target): 新增 3 个 plan/preview 工具（cooliebase_scaffold_plan / cooliebase_codegen_preview / cooliebase_table_migration_plan），自动落盘工具 0 个；每个工具返回 { plannedWrites, followUpGates, manualSteps } 三段结构化结果；每条工具各配 1 条正向 + 1 条反向测试，并含『调用后 git status 无变化』的不落盘断言。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 低代码 MCP 写类工具（B1 二期）：scaffold.plan / codegen.preview | mcp-write-tools | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为外部 Agent（驱动者）] 只做 plan/preview：新增工具一律不落盘，落盘仍由 npm scripts 显式执行

2. **P0** [作为外部 Agent（驱动者）] 实现 scaffold.plan（薄封装 create-business-domain.ts 的 dry-run 路径）与 codegen.preview（复用 cooliebase_codegen_targets 的域目录解析 + inject-codegen-output.cjs --dry-run）

3. **P0** [作为外部 Agent（驱动者）] 实现 tables.migration.plan（薄封装 generate-table-migration.ts，且强制不传 --write）

4. **P1** [作为外部 Agent（驱动者）] 同步 compat-manifest 的 additive 策略与 compat:check 交叉校验，确保工具清单与服务无第二真源

5. **P1** [作为外部 Agent（驱动者）] 在 AGENTS.md §3.4 交付链与 harness 演进规范中登记本批次，避免工具落地后无人知晓

## 4. 关键业务不变量 (Key Business Invariants)

1. **不落盘不变量** —— 所有新增工具走 dry-run 分支；测试断言调用后 git status 无变化，且工具签名不接受 write 类入参
2. **白名单域不变量** —— 域名一律经 scripts/lib/domain-catalog.cjs 解析并校验 catalog 登记状态，未登记域直接拒绝而非兜底生成

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：`npm run compat:check` exit=0（工具清单与 MCP 服务交叉校验一致）
3. **THE system SHALL** 验证：每条新工具正反向测试通过：正常调用返回完整 plannedWrites/followUpGates/manualSteps；对未登记域或越权路径调用被拒
4. **THE system SHALL** 验证：不落盘断言通过：调用全部新工具后 `git status --porcelain` 输出为空

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 零落盘：新增工具一律 plan/preview 语义，禁止写盘；--write 仍由显式命令或后续独立批次承担。
* **THE system SHALL COMPLY WITH**: 不得绕过 npm run check：工具只返回『应跑哪条门禁』，绝不自判通过（维持 AGENTS.md §3 明确不引入第 5 条）。
* **THE system SHALL COMPLY WITH**: 零破坏性变更：既有 14 个只读工具的名称、入参、返回结构不变；compat-manifest 的 frozen 项不动。
* **THE system SHALL COMPLY WITH**: 复用优先：薄封装既有 scripts/lib 与脚本，禁止重写领域逻辑（延续 B1 一期做法）。
* **THE system SHALL COMPLY WITH**: 工具白名单限定 catalog 已登记域，禁止对任意路径或未登记域生成计划（沿用 cooliebase_gate_run 的白名单先例）。

### 明确不做与负向范围 (Non-Goals)
* 不实现自动落盘（--write）工具，落盘通道本次不开放给 MCP
* 不把 Agent Loop / Cordis 引入本仓（维持 agent-profile.json.forbidden 与 harness 演进规范 §3）
* 不打包 Skill Pack（属 B2 独立批次）
* 不改 speckit 的 enhancement 骨架模板：该模板文案偏性能/容量优化，本规格按『能力增量』语义填写，偏离处在 brief 与 sprint-prod 记录中显式说明
