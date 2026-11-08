# Quality Checklist & Acceptance Gate: 对标 PagePlug 与商业低代码平台：多端模版源头与响应式区块画布升级

> **Spec-Kit 质量验收与门禁自检清单 (Verification Checklist)**
> 所属领域：`infra` | 规格标识：`multi-end-template-engine` | 阶段：`PLAN_APPROVED`
> 对应项目宪法：`.specify/memory/constitution.md` (Gate 1~6 物理门禁全覆盖)

---

## 1. 宪法与架构合规自检 (Constitutional & Architecture Compliance)
- [ ] **Rule 0.1 零 Token 浪费**：业务模型采用 Schema/DSL 驱动展开，无冗余手写样板代码。
- [ ] **Rule 0.2 模式极致复用**：已复用 `BaseMapper<T>`、`QueryWrapper<T>`，自动继承 8 大审计列。
- [ ] **Rule 0.4 真实数据库驱动**：100% 跑通真实 PostgreSQL/SQLite 状态机测试，0 内存伪造 Mock。
- [ ] **Rule 0.5 契约第一切入**：对外暴露版本化 API 契约，跨域调用 100% 走 Domain Facade。
- [ ] **Rule 0.7 权限与租户隔离**：接口配置权限码，全局行级租户隔离自动注入。
- [ ] **Rule 0.8 反 Seed 与 E2E 页面拟人运营配置**：严禁直接 Seed 数据库灌入业务运营配置数据，100% 通过 B 端后台页面拟人操作（点击新建 -> 填写表单 -> 提交落库）完成运营配置与 C 端联动验证（`pnpm run e2e:ops:check`）。

## 2. 11 阶段交付物齐全性自检 (11-Phase Artifacts Health)
- [ ] **选型与研判 (G0_DAR)**：`research.md` (或 `selection.md`) 包含竞品选型与加权评分结论。
- [ ] **需求规格 (G4_DS)**：`spec.md` (或 `requirements.md`) 包含 P0/P1/P2 用户故事，0 占位符。
- [ ] **架构设计 (G1_FDA)**：`plan.md` (或 `design.md`) 包含关键业务不变量与 Archify Mermaid 时序图。
- [ ] **任务拆解 (G2_CoreSWE)**：`tasks.md` 包含波次图、无孤儿任务、文件白名单完备。
- [ ] **实施轨回滚演练 (G5_PRE)**：`runbook.json` 包含 S1~S6 步骤（含 E2E 页面拟人运营配置核验与自动化测试矩阵）与 R1~R3 回滚演练预案。

## 3. 验收标准逐项核验 (Acceptance Criteria Status)
- [ ] `pnpm vitest run test/unit/multi-end-template-engine.test.ts` exit=0（覆盖表达式沙箱求值、安全拦截、PageBlockDSL v2 校验、客户端布局与孵化裁剪）
- [ ] `collectClientPackageLayoutErrors(ROOT)` 返回空数组 `[]`，且 `client-channels.json` 中 `expo` 已移除 `requiredSourceDirs: ["shared"]` 特批豁免
- [ ] `resolveHatchPlan` 在 `--profile vertical --bundle member` 下自动排除 `clients/expo/src/modules/mall`，实现前后端按域同步裁剪
- [ ] `pnpm run clients:build:check` exit=0（Expo Web 导出构建包含重构后的模块化与区块渲染产物）
- [ ] `pnpm run check` exit=0（全量静态、契约、路由、门禁 100% 通过）
