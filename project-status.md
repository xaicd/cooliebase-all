# cooliebase-all — 项目当前阶段状态真源 (Source of Truth)

> **规范指引**：遵循 `AGENTS.md` §6.1。阶段定义与里程碑判据见 `docs/01_management/project-plan.md`。
> **最后更新**：2026-10-19

---

## 🚦 当前阶段生命周期矩阵

| 领域 | 当前状态 | 判据 | 证据 / 下一步 |
|---|---|---|---|
| **基座与域架构（R0）** | `TEST_PASSED` | 17 域登记、跨域只走 Facade、seam 图不漂移 | `npm run check` exit=0 |
| **Agent 消费面（R2）** | `TEST_PASSED` | MCP 工具不落盘、Skills 与代码一致、提示可重建 | `compat:check`（17 domains / 38 skills / 17 MCP tools / 10 gates） |
| **供应链安全（M2）** | `TEST_PASSED` | 只拦新增漏洞；存量入台账 | `deps:audit`（43 → 9） |
| **客户端构建（M3）** | `TEST_PASSED` | 导出产物存在 + 零污染 + 裁剪跳过 | `clients:build:check` |
| **孵化与建域（R1）** | `DEV_READY` | 最小 profile 产物自身可 check/build/启动；`domain:new` 幂等 | **待逐仓复验**（历史出现过"门禁绿但起不来"） |
| **交付与发布（R3/M6）** | `PLAN_APPROVED` | 七项交付门禁 + 版本一致性 | 见下节"已知不一致" |
| **SRE / 运营资产（R4）** | `PLAN_PENDING` | 资产真实存在且未发生项留空 | 待逐项核验 |

> 状态词只表达流程位置，**不表达"没问题"**。只有"判据 + 证据"都成立才可标 `TEST_PASSED`。

---

## ⚠️ 已知不一致（当前阻断发布）

1. **版本源漂移**：最新 tag 为 `v1.4.0-brand-shorthand`（2026-10-18），但
   `package.json.version` 与 `compat-manifest.framework.templateVersion` 仍为 `1.2.0`。
   二者相差 52 个提交，且**当前没有版本一致性门禁**（无 `version:check` 类脚本）。
   → 在补齐版本一致性检查前，不得声明任何"已发布"能力。
2. **CMMI 过程资产覆盖不均**：`docs/04_implementation/` 仅 1 个文件、`docs/01_management/` 原仅 3 个文件。
   已补 `project-plan.md`；其余阶段仍需补齐（见 `project-plan.md` §4 WS-H）。

---

## 📋 阶段状态枚举字典

- `PLAN_PENDING`：规划进行中
- `PLAN_APPROVED`：规划完成（`requirements.md` / `design.md` / `tasks.md` 冻结，可进入开发）
- `DEV_READY`：开发完成（候选 SHA 锁定，提供变更与自测记录，等待独立测试）
- `TEST_PASSED`：独立测试 100% 验收通过（PASS）
- `RELEASE_APPROVED`：人工/运维发布门禁审批通过（正式生效，同步至 `CURRENT.md`）
