# cooliebase-all — 已发布能力真源 (Release Source of Truth)

> **规范指引**：遵循 `AGENTS.md` §6.1 —— 仅通过发布门禁（`RELEASE_APPROVED`）的能力方可登记于此。
> **阶段状态**请看 `project-status.md`；**计划与路线图**请看 `docs/01_management/project-plan.md`。
> **最后更新**：2026-10-19

---

## 1. 本文的边界

- 本文件只登记**本仓（cooliebase-all 基座/模板）**的已发布能力。
- **DigitalStaff（Agent Runtime / Harness）的发布真源不在本仓** —— 其位置由
  `packages/shared/contract/agent-profile.json` 的 `harnessPartners.runtimePath` 指向。
  本仓只提供 Harness 所需的工作区契约与环境，不复制其发布记录。
- 未通过发布门禁的能力一律不在此登记，只在 `project-status.md` 中标注阶段。

---

## 2. 发布标签历史

| 标签 | 日期 | 说明 |
|---|---|---|
| `v1.0.0` | 2026-10-09 | 首个基线 |
| `v1.1.0` | 2026-10-09 | — |
| `v1.2.0` | 2026-10-10 | 模板基线（`compat.framework.releasedAt` 记录此日） |
| `v1.3.0-ruoyi-removed` | 2026-10-18 | 品牌 2.0：去上游品牌 |
| `v1.4.0-brand-shorthand` | 2026-10-18 | 品牌 2.1：标识缩短 |

> **注意**：以上标签只记录版本节点，**尚未逐能力建立 tag → 能力映射**。
> 在补齐映射前，本文不宣称任何"已发布能力"。

---

## 3. ⚠️ 当前阻断项：版本源不一致

| 版本源 | 当前值 |
|---|---|
| 最新 git tag | `v1.4.0-brand-shorthand`（2026-10-18） |
| `package.json.version` | `1.2.0` |
| `compat-manifest.framework.templateVersion` | `1.2.0` |

两者相差 52 个提交，且**当前没有版本一致性门禁**。
→ **在补齐版本一致性检查并重新对齐之前，不得发布、不得对外声明版本。**

---

## 4. 已验证能力面（非发布声明）

以下是**当前代码状态下可以复跑验证**的能力面，仅供判断"现在能不能用"，
**不构成发布声明**（发布需 `RELEASE_APPROVED`）：

| 能力面 | 验证入口 |
|---|---|
| 契约与治理门禁 | `npm run check` |
| 消费面一致性（工具/技能/门禁） | `npm run compat:check` |
| 依赖漏洞棘轮 | `npm run deps:audit` |
| 客户端构建 | `npm run clients:build:check` |
| 全量测试 | `env -u DATABASE_URL -u DB_DRIVER npx vitest run` |
| 生产构建 | `npm run build` |
| 登录冒烟 / 安全扫描 / 压测 | `smoke:login` / `security:scan` / `load:test` |
| 环境指纹 | `npm run fingerprint` → `fingerprint:verify` |
