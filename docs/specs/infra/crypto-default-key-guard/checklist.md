# Quality Checklist & Acceptance Gate: 生产环境必须禁止使用硬编码默认 AES 密钥

> **Spec-Kit 质量验收与门禁自检清单 (Verification Checklist)**
> 所属领域：`infra` | 规格标识：`crypto-default-key-guard` | 阶段：`PLAN_APPROVED`
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
- [ ] `pnpm run check` exit=0
- [ ] 行为验证：`NODE_ENV=production` 且未设密钥 → `cryptoEngine.encrypt()` 抛错，且错误信息包含 `COOLIEBASE_SHARED_AES_KEY`
- [ ] 行为验证：`NODE_ENV=production` 且已设密钥 → 正常加解密；`cryptoVault` 同理（`COOLIEBASE_VAULT_AES_KEY`）
- [ ] 非生产（无 NODE_ENV）未设密钥 → 仍可用（不破坏测试与本地开发）
- [ ] 构建安全：模块**加载**不抛错（只有调用才抛）—— 用「import 后不调用不报错」验证
- [ ] 反向对照：把守卫去掉，上述行为验证必须失败（证明机检真的在测这件事）
