# Quality Checklist & Acceptance Gate: 底座内嵌活体本体自省与AI Copilot抽屉

> **Spec-Kit 质量验收与门禁自检清单 (Verification Checklist)**
> 所属领域：`system` | 规格标识：`in-app-ontology-copilot` | 阶段：`PLAN_APPROVED`
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
- [ ] `pnpm vitest run test/unit/ontology-copilot.test.ts` exit=0
- [ ] GET /api/ontology 返回 HTTP 200 及合法的 M1/M2/M3 元数据 JSON
- [ ] POST /api/copilot/query 对非 SELECT 写入语句拒绝执行并返回 403
