# Requirements Specification: 依赖 CVE 门禁分层判据改为从 pnpm-lock.yaml 离线推导（消除多父级包导致的 5/5/6 不确定）

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`bugfix` | 所属领域：`infra` | 规格标识：`deps-audit-tier-determinism`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

修复 `check-deps-audit.cjs` 的分层（runtime / client-toolchain）判据：不再从 `pnpm audit` 的 findings[].paths 派生父级关系，改为从 `pnpm-lock.yaml` 离线推导依赖图，使分层结果**确定可复现**、可作精确数字引用。


### 缺陷现象 (Symptom)

同一仓库状态下，`node scripts/check-deps-audit.cjs` 报出的 runtime 分层计数连跑三次得到 **5 / 5 / 6**。实测定位：43 条中只有 `braces@GHSA-vfj7-8cjw-p6xm` 一条在翻 —— 它的 importer roots 时而只有 `clients__expo`、时而含 `.`。因此台账 `cooliebase-all-dependency-policy.md` 无法给出可信的分层数字，已在其内标注"该数字不可作精确值引用"。

### 根因分析 (Root Cause - 5-Whys)

5-Whys：① 分层为何在翻 → 因为 `tierOf()` 读的是 `advisory.findings[].paths`；② 为何该字段会变 → `pnpm audit` **对多父级包会截断 `paths` 列表**（人类可读输出里就写着 "Found 8 paths" 却只列出 3 条）；③ 为何截断会导致误判 → `braces` 确实有两个父级（`tailwindcss → chokidar` 与 `react-native → babel-jest → micromatch`），截断发生时只剩 expo 那条，于是被错误标成 client-toolchain；④ 为何当初选了该字段 → 它看起来是现成的父级信息，省事；⑤ 根本原因 → **用了一个"采样式"字段当判据**。pnpm 没有提供完整父级链的稳定接口，所以正确修法不是换个字段、而是**换数据源**：依赖图的真源就在锁文件里，离线可解析且确定。

### 保持既有行为 (Preserved Behavior)

① 棘轮判定语义**完全不变**：比对键仍是「包名 + GHSA」，与分层无关，故 PASS/FAIL 行为不变；② `--audit` 永不失败、`--json` 退出码、`--write-baseline` 行为不变；③ 基线内容除 `tier` 字段外逐条不变（总数与逐包计数不变）；④ 不新增任何依赖（不得为一个门禁脚本引入 YAML 解析库）；⑤ 门禁仍不得因拿不到审计结果而静默放行。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 依赖 CVE 门禁分层判据改为从 pnpm-lock.yaml 离线推导（消除多父级包导致的 5/5/6 不确定） | deps-audit-tier-determinism | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为基座维护者] 编写红灯复现单测 (Red Test)：同一状态下连续多次调用门禁，分层计数与逐条 tier **必须完全一致**（当前必然红）

2. **P0** [作为基座维护者] 在门禁脚本内实现从 `pnpm-lock.yaml` 离线推导：解析 importers（`.`、`packages/**` 为 host）与 snapshots 的依赖边，按包名做可达性遍历，得到 host 可达包名集合，据此判层

3. **P1** [作为基座维护者] 补已知锚点断言（braces / mysql2 / vitest 属 runtime；tar / @xmldom/xmldom / shell-quote 属 client-toolchain），用真实答案反向校验解析器不是乱解析

## 4. 关键业务不变量 (Key Business Invariants)

1. **分层确定性** —— 分层只由锁文件内容决定，不读任何采样字段；同一锁文件多次运行结果逐条相同（由回归测试断言）
2. **解析失败不静默** —— host 可达集合为空（或锁文件不可读）时直接报错退出，绝不返回一个全部 client-toolchain 的看似正常结果

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：确定性：同一状态下连续 ≥5 次运行，分层计数与逐条 tier 完全一致（当前为 5/5/6，修后须恒定）
3. **THE system SHALL** 验证：锚点正确性：`braces` / `mysql2` / `vitest` 判为 runtime；`tar` / `@xmldom/xmldom` / `shell-quote` 判为 client-toolchain（自主机依赖图与仅 expo 工具链两组真实样本）
4. **THE system SHALL** 验证：基线除 tier 外逐条不变（43 条，critical 2 / high 30 / moderate 11），且 `deps:audit` 仍 PASS

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 零新增依赖：不得为解析锁文件引入 js-yaml / yaml 等库（两者当前均未链接到根，属未声明的传递依赖，不可依赖）。
* **THE system SHALL COMPLY WITH**: 离线且确定：分层推导不得依赖网络，也不得依赖 `pnpm audit` 的父级采样字段。
* **THE system SHALL COMPLY WITH**: 判定面零变更：棘轮仍只拦新增，比对键不变；不得因本次改动放宽或收紧任何通过条件。
* **THE system SHALL COMPLY WITH**: 诚实边界：若锁文件缺失或结构无法解析，必须 fail-loud（或明确降级并标注），不得静默给出错误的层。

### 明确不做与负向范围 (Non-Goals)
* 不改变漏洞治理策略本身（哪些接受、哪些必修）
* 不修 Expo/CLI 那 37 条（属另一条已记录的工作线）
* 不引入锁文件解析的通用库或把该能力做成公共 SDK
