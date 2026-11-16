# cooliebase-all — 项目当前阶段状态真源 (Source of Truth)

> **规范指引**：遵循 `AGENTS.md` §6.1。实时待办见 [`docs/01_management/pmo-dashboard.md`](docs/01_management/pmo-dashboard.md)，里程碑判据见 [`docs/01_management/project-plan.md`](docs/01_management/project-plan.md)。
> **最后更新**：2026-11-16（`v1.5.0`）

---

## 🚦 当前阶段生命周期矩阵

| 领域 | 当前状态 | 判据 | 证据 / 下一步 |
|---|---|---|---|
| **基座与域架构（R0）** | `RELEASE_APPROVED` | 20 域登记（2 平台地基 + 18 第一方插件，含 `oa/hrm/fms/pms`）、跨域只走 Facade、seam 图零漂移 | `pnpm run check` exit=0 |
| **Agent 消费面（R2）** | `RELEASE_APPROVED` | MCP 工具、Skills、354 份契约与代码一致，发现表面镜像同步 | `compat:check`（20 domains / 38 skills / 18 MCP tools / **28 gates**） |
| **供应链安全（M2）** | `TEST_PASSED` | 棘轮只拦新增漏洞；既有 11 项冻结入基线 | `deps:audit` exit=0（新增 0） |
| **四端客户端构建（M3）** | `RELEASE_APPROVED` | Admin + 2C 门户 + `clients/expo` + `clients/miniapp` 四位一体构建零污染 | `clients:build:check` & `build` exit=0 |
| **孵化与建域（R1）** | `RELEASE_APPROVED` | 四端白标沙箱派生（`project:init`）+ `<500 Tokens` 建域（`domain:new`）幂等 | `project:init` & `gates:23:static` exit=0 |
| **交付与发布（R3/M6）** | `RELEASE_APPROVED` | `v1.5.0` 标签、发布说明（`docs/07_release/releases/v1.5.0.md`）、骨架包与 SHA-256 指纹就绪 | `version:check` & `release:package` exit=0 |
| **文档单目录与准确性（R4）** | `TEST_PASSED` | 全量文档、规格、Wiki、发布说明与审计报告收敛于 `docs/`，五维准确性审计清零 | `docs/audit/2026-11-16-core-docs-accuracy-audit.md` |

---

## 📋 阶段状态枚举字典

- `PLAN_PENDING`：规划进行中
- `PLAN_APPROVED`：规划完成（`requirements.md` / `design.md` / `tasks.md` 冻结，可进入开发）
- `DEV_READY`：开发完成（候选 SHA 锁定，提供变更与自测记录，等待独立测试）
- `TEST_PASSED`：独立测试 100% 验收通过（PASS）
- `RELEASE_APPROVED`：发布门禁审批通过（正式生效，同步至 `CURRENT.md`）
