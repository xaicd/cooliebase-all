# Quality Checklist & Acceptance Gate: 派生后可执行性门禁口径对齐平台 cleanWorkspaceLeaks 全量清洗面（补 package.json 维度）

> **Spec-Kit 质量验收与门禁自检清单 (Verification Checklist)**
> 所属领域：`infra` | 规格标识：`workspace-executability-purge-scope` | 阶段：`PLAN_APPROVED`
> 对应项目宪法：`.specify/memory/constitution.md` (Gate 1~6 物理门禁全覆盖)

---

## 1. 宪法与架构合规自检 (Constitutional & Architecture Compliance)
- [ ] **Rule 0.1 零 Token 浪费**：业务模型采用 Schema/DSL 驱动展开，无冗余手写样板代码。
- [ ] **Rule 0.2 模式极致复用**：已复用 `BaseMapper<T>`、`QueryWrapper<T>`，自动继承 8 大审计列。
- [ ] **Rule 0.4 真实数据库驱动**：100% 跑通真实 PostgreSQL/SQLite 状态机测试，0 内存伪造 Mock。
- [ ] **Rule 0.5 契约第一切入**：对外暴露版本化 API 契约，跨域调用 100% 走 Domain Facade。
- [ ] **Rule 0.7 权限与租户隔离**：接口配置权限码，全局行级租户隔离自动注入。

## 2. 11 阶段交付物齐全性自检 (11-Phase Artifacts Health)
- [ ] **选型与研判 (G0_DAR)**：`research.md` (或 `selection.md`) 包含竞品选型与加权评分结论。
- [ ] **需求规格 (G4_DS)**：`spec.md` (或 `requirements.md`) 包含 P0/P1/P2 用户故事，0 占位符。
- [ ] **架构设计 (G1_FDA)**：`plan.md` (或 `design.md`) 包含关键业务不变量与 Archify Mermaid 时序图。
- [ ] **任务拆解 (G2_CoreSWE)**：`tasks.md` 包含波次图、无孤儿任务、文件白名单完备。
- [ ] **实施轨回滚演练 (G5_PRE)**：`runbook.json` 包含 S1~S5 步骤与 R1~R3 回滚演练预案。

## 3. 验收标准逐项核验 (Acceptance Criteria Status)
- [ ] `pnpm run check` exit=0（母本仓全量静态门禁链全绿）
- [ ] `node scripts/check-workspace-executability.cjs` exit=0 且输出 PASS；`node scripts/check-workspace-executability.cjs --run` exit=0（运行层 4 条探针全部可启动）
- [ ] `pnpm exec vitest run test/unit/workspace-executability-purge-scope.test.ts` 13/13 PASS（含四条必红反向对照）
- [ ] 母本仓 main 上存在 scripts/check-workspace-executability.cjs 与 scripts/lib/workspace-executability-scope.cjs，git log 能看到等价于 b45a3a6 的改动；package.json 含 workspace:executability:check / workspace:executability:smoke 两个键
- [ ] 刷新后 /opt/coolie/blueprints/cooliebase-all/scripts/check-workspace-executability.cjs 存在；派生工作区跑平台侧 runWorkspaceExecutabilitySmoke ⇒ source=workspace-gate（不再走 platform-static 兜底）
