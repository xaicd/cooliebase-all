# Quality Checklist & Acceptance Gate: 产物并存两种界面：业务管理 UI + dsh 对话 UI（通过 MCP 打通）

> **Spec-Kit 质量验收与门禁自检清单 (Verification Checklist)**
> 所属领域：`infra` | 规格标识：`dsh-product-integration` | 阶段：`PLAN_APPROVED`
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
- [ ] agent-profile.json 的 kind 仍是 workspace-bundle，且新增 productRuntime 段声明「产物可启用 dsh」
- [ ] check-harness-bundle.cjs 按作用域校验：模板禁 vendor，产物允许声明 dsh
- [ ] MCP server 能被 dsh 列为 18 个工具（接入后实测工具清单，未实测前不声称）
- [ ] 业务界面（/admin/**）与 dsh 界面都能访问（两个进程/两个端口或反代）
- [ ] 关闭 dsh 进程后，业务界面与 API 照常 200（AI 可关）
- [ ] pnpm run check exit=0 · pnpm run build exit=0
- [ ] 反向对照：在模板里 import Cordis → 门禁必须红（证明边界仍在守）
