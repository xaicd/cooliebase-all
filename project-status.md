# cooliebase-all — 项目当前阶段状态真源 (Source of Truth)

> **规范指引**：遵循 `AGENTS.md` §6.1。阶段定义与里程碑判据见 `docs/01_management/project-plan.md`。
> **最后更新**：2026-10-19

---

## 🚦 当前阶段生命周期矩阵

| 领域 | 当前状态 | 判据 | 证据 / 下一步 |
|---|---|---|---|
| **基座与域架构（R0）** | `TEST_PASSED` | 17 域登记、跨域只走 Facade、seam 图不漂移 | `npm run check` exit=0 |
| **Agent 消费面（R2）** | `TEST_PASSED` | MCP 工具不落盘、Skills 与代码一致、提示可重建 | `compat:check`（17 domains / 38 skills / 17 MCP tools / **28 gates**） |
| **供应链安全（M2）** | `TEST_PASSED` | 只拦新增漏洞；存量入台账 | `deps:audit`（43 → 9） |
| **客户端构建（M3）** | `TEST_PASSED` | 导出产物存在 + 零污染 + 裁剪跳过 | `clients:build:check` |
| **孵化与建域（R1）** | `TEST_PASSED` | degit 快照端到端（install→init→check→build→dev→登录）+ `domain:new` 连跑两次幂等 | ✅ 2026-10-19（`project:create` reactor/Postgres 路径未验） |
| **交付与发布（R3/M6）** | `DEV_READY` | `build`/`fingerprint` 已过；`smoke:login`/`security:scan`/`load:test` 需可达数据库 | 本机 Docker(colima) 发布端口不可达，待 CI 执行 |
| **SRE / 运营资产（R4）** | `PLAN_PENDING` | 资产真实存在且未发生项留空 | 待逐项核验 |

> 状态词只表达流程位置，**不表达"没问题"**。只有"判据 + 证据"都成立才可标 `TEST_PASSED`。

---

## ⚠️ 已知缺口

1. **版本策略已定但未机检**：`package.json.version` 与 `compat.templateVersion` 必须同步；
   git tag（可带语义后缀）是**渠道版本**，与模板版本刻意解耦（依据：`RELEASE_NOTES_v1.4.0-brand-shorthand.md` 的 R3/R11）。
   目前只有文档约定、没有门禁 → 登记为 RSK-006。
2. **CMMI 过程资产覆盖不均**：`docs/04_implementation/` 仅 1 个文件、`docs/01_management/` 原仅 3 个文件。
   已补 `project-plan.md`；其余阶段仍需补齐（见 `project-plan.md` §4 WS-H）。

---

## 📋 阶段状态枚举字典

- `PLAN_PENDING`：规划进行中
- `PLAN_APPROVED`：规划完成（`requirements.md` / `design.md` / `tasks.md` 冻结，可进入开发）
- `DEV_READY`：开发完成（候选 SHA 锁定，提供变更与自测记录，等待独立测试）
- `TEST_PASSED`：独立测试 100% 验收通过（PASS）
- `RELEASE_APPROVED`：人工/运维发布门禁审批通过（正式生效，同步至 `CURRENT.md`）
