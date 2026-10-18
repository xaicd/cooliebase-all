# DigitalStaff — 项目当前阶段状态真源 (Source of Truth)

> **规范指引**：严格遵循 `AGENTS.md` Rule 17《多模型三阶段协作与阶段门禁铁律》。
> **最后更新**：2026-09-02

---

## 🚦 当前阶段生命周期矩阵

| 项目/模块 | 当前生命周期状态 | 负责模型/Agent | 候选 Commit SHA | 交付物/门禁说明 | 下一阶段入口 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **主平台 Coding 引擎 (`NativeCodingEngine`)** | `TEST_PASSED` | NativeEngine + Vitest | `f1abfd0d` | Google AI Studio 级预热引擎与提示词防呆已全量就绪 | 等待人工发布审批 (`RELEASE_APPROVED`) |
| **顶级全栈模板 (`cooliebase-all`)** | `TEST_PASSED` | Kysely + TestingKit | `bc1eb2b` | 内置零配置 SQLite + 4层测试金字塔 + Playwright 探针 | 等待生产环境部署演进 |
| **多仓一键级联同步工作流 (`git:sync`)** | `TEST_PASSED` | GitSync Tooling | `f1abfd0d` | 子模块与主仓双远端（GitHub/Gitee）单命令原子同步通过 | 投入日常生产使用 |

---

## 📋 阶段状态枚举字典

- `PLAN_PENDING`：规划阶段进行中
- `PLAN_APPROVED`：规划完成（`requirements.md` / `design.md` / `tasks.md` 冻结，可进入开发）
- `DEV_READY`：开发完成（候选 SHA 锁定，提供变更与自测记录，等待独立测试）
- `TEST_PASSED`：独立测试 100% 验收通过（PASS）
- `RELEASE_APPROVED`：人工/运维发布门禁审批通过（正式生效，同步至 `CURRENT.md`）
