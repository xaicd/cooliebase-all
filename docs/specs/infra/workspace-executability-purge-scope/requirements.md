# Requirements Specification: 派生后可执行性门禁口径对齐平台 cleanWorkspaceLeaks 全量清洗面（补 package.json 维度）

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`workspace-executability-purge-scope`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

母本侧派生自检门禁 scripts/check-workspace-executability.cjs 的『清洗口径』必须与平台 cleanWorkspaceLeaks 的**全量清洗面**一致（不再只认 6 条母港规约机路径），并补上 package.json 维度：平台清洗会**整键删掉** harness / speckit 等公开 script 键 ⇒ 命令变成『不存在』（静默消失，不是报错），这条路径底座原先完全看不见。现在口径收窄 / 键被删 / 公开脚本引用被清洗文件（含 exec 形态）都在派生后当场变红，而不是留给客户踩。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 派生后可执行性门禁口径对齐平台 cleanWorkspaceLeaks 全量清洗面（补 package.json 维度） | workspace-executability-purge-scope | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为平台派生流水线（SRE / Core SWE）] 新增 scripts/lib/workspace-executability-scope.cjs 作为清洗口径**单一真源**：把平台 cleanWorkspaceLeaks 的全量清洗面镜像成机检常量，拆成『无条件删除』（scripts/harness.sh、8 个 .agents/skills/<role> 内部角色包、母港 server/src/services 两文件）与『按来源鉴别删除』（母港规约机 6 条，保守口径全列）；同时声明必须留存的公开 script 键（harness / speckit）

2. **P0** [作为平台派生流水线（SRE / Core SWE）] 升级 scripts/check-workspace-executability.cjs：① 静态层口径换成平台全量清洗面；② 新增 package.json 维度（script 值引用被清洗文件 ⇒ 判红 / 必须留存的公开键缺失 ⇒ 判红 / 生效口径比平台已知清洗面窄 ⇒ 自判红）；③ 新增『路径字面量依赖』扫描（exec / spawn / readFile 形态的真实依赖，旧门禁看不见）

3. **P0** [作为平台派生流水线（SRE / Core SWE）] 本规格随 COO-55-1-2-1 落到**母本仓 main**：新版门禁（脚本 + 口径真源 + 反向对照单测）推到母本远端，并刷新平台母本快照 /opt/coolie/blueprints/cooliebase-all，使派生工作区能直接跑 workspace:executability:smoke

4. **P1** [作为平台派生流水线（SRE / Core SWE）] 补 test/unit/workspace-executability-purge-scope.test.ts：13 条断言，每条正面断言都配反向对照（探针键引用被清洗文件 / 公开键被删 / exec 形态依赖 / 口径被收窄，四条必红对照）

## 4. 关键业务不变量 (Key Business Invariants)

1. **口径不得比平台清洗面窄** —— resolvePurgeTargets() 比对生效口径与 PLATFORM_CLEAN_SURFACE，缺条目即以 purge-scope-narrower-than-platform 判红（口径收窄 = 门禁变弱 = 假绿）
2. **公开 script 键不得被清洗后静默消失** —— auditPackageJson() 断言 harness / speckit 必须在 package.json 中；缺失即 public-script-key-missing 判红
3. **公开脚本不得依赖任何会被清洗的文件** —— 静态层同时扫 require/import 依赖与路径字面量依赖（exec / spawn / readFile 形态），命中清洗面即判红
4. **偏严只多红、不假绿** —— 按来源鉴别的条目（scripts/speckit.cjs、scripts/lib/spec-resolver.cjs 等）保守全列；底座母本当前不含这 6 个文件 ⇒ 本仓无假红

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0（母本仓全量静态门禁链全绿）
2. **THE system SHALL** 验证：`node scripts/check-workspace-executability.cjs` exit=0 且输出 PASS；`node scripts/check-workspace-executability.cjs --run` exit=0（运行层 4 条探针全部可启动）
3. **THE system SHALL** 验证：`pnpm exec vitest run test/unit/workspace-executability-purge-scope.test.ts` 13/13 PASS（含四条必红反向对照）
4. **THE system SHALL** 验证：母本仓 main 上存在 scripts/check-workspace-executability.cjs 与 scripts/lib/workspace-executability-scope.cjs，git log 能看到等价于 b45a3a6 的改动；package.json 含 workspace:executability:check / workspace:executability:smoke 两个键
5. **THE system SHALL** 验证：刷新后 /opt/coolie/blueprints/cooliebase-all/scripts/check-workspace-executability.cjs 存在；派生工作区跑平台侧 runWorkspaceExecutabilitySmoke ⇒ source=workspace-gate（不再走 platform-static 兜底）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 不改平台侧接线：COO-55-1-2 已在平台仓完成（coolie @ f3ef139d10），本规格只管底座侧产物与快照刷新。
* **THE system SHALL COMPLY WITH**: 不改判定口径的『语义』：若新版门禁在派生侧误报红（例如依赖未安装被判断链），回单平台侧 SRE 处置，不在本规格内私改口径。
* **THE system SHALL COMPLY WITH**: 偏严不假绿：口径取『平台全量清洗面』的保守并集，宁可多红，不允许口径收窄（口径收窄 = 门禁变弱 = 假绿）。
* **THE system SHALL COMPLY WITH**: 不降级：不为了通过门禁把必填口径改成可选、加开关或用 AGENT_ROUTE_SKIP 绕过。
* **THE system SHALL COMPLY WITH**: 零对外契约变更：不改对外 API、数据库结构与运行时行为；只补门禁静态判定与文档口径。

### 明确不做与负向范围 (Non-Goals)
* 不改平台仓的派生流水线接线（cleanWorkspaceLeaks 之后自动跑冒烟）—— 已由 COO-55-1-2 完成。
* 不新增或删除任何 npm script，不新增域，不改 compat-manifest 门禁集合（能力面零变化）。
* 不把母本自身的公开脚本迁移到新路径 —— 本次只改门禁的判定口径与覆盖面。
* 不处理平台 cleanWorkspaceLeaks 本身的实现缺陷（若有，另开工单）。
