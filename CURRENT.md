# cooliebase-all — 已发布能力真源 (Release Source of Truth)

> **规范指引**：遵循 `AGENTS.md` §6.1 —— 仅通过发布门禁（`RELEASE_APPROVED`）的能力方可登记于此。
> **实时进度与待办大盘**请看 `docs/01_management/pmo-dashboard.md`；**计划与路线图**请看 `docs/01_management/project-plan.md`。
> **最后更新**：2026-11-16

---

## 1. 本文的边界

- 本文件只登记**本仓（cooliebase-all 基座/模板）**的已发布能力。
- **DigitalStaff（Agent Runtime / Harness）的发布真源不在本仓** —— 其位置由
  `packages/shared/contract/agent-profile.json` 的 `harnessPartners.runtimePath` 指向。
  本仓只提供 Harness 所需的工作区契约与环境，不复制其发布记录。
- 未通过发布门禁的能力一律不在此登记，只在 `docs/01_management/pmo-dashboard.md` 中标注阶段。

---

## 2. 发布标签历史

| 标签 | 日期 | 说明 |
|---|---|---|
| `v1.0.0` | 2026-10-09 | 首个基线 |
| `v1.1.0` | 2026-10-09 | — |
| `v1.2.0` | 2026-10-10 | 模板基线（`compat.framework.releasedAt` 记录此日） |
| `v1.3.0-ruoyi-removed` | 2026-10-18 | 品牌 2.0：去上游品牌 |
| `v1.4.0-brand-shorthand` | 2026-10-18 | 品牌 2.1：标识缩短 |
| `v1.5.0` | 2026-11-16 | 四位一体终端 (`clients/miniapp`) + 20 原生域 (`2` 平台地基 + `18` 第一方插件，`oa/hrm/fms/pms` 补齐、定制插件剥离) + `docs/` 单目录治理与 CLI 对齐 |

> **注意**：以上标签只记录版本节点，**尚未逐能力建立 tag → 能力映射**。
> 在补齐映射前，本文不宣称任何"已发布能力"。

---

## 3. 版本策略：两个解耦的概念（勿混为一谈）

本仓**刻意区分**两个"版本"，这不是漂移：

| 概念 | 载体 | 含义 |
|---|---|---|
| **发布/渠道版本** | git tag（可带语义后缀，如 `v1.4.0-brand-shorthand`） | 一次对外发布或一次品牌里程碑的身份 |
| **模板版本** | `package.json.version` 与 `compat.framework.templateVersion` | hatch 出的下游工程继承的模板基线；**两者必须同步** |

**依据**：`docs/07_release/release-notes.md` 的版本与渠道标签策略台账 ——
渠道后缀标签（如历史 `v1.4.0-brand-shorthand`）可与模板版本解耦；而正式模板里程碑 `v1.5.0` 已将 `package.json.version` 与 `compat.framework.templateVersion` 统一升级并对齐至 **`1.5.0`**。

**机检保障（RSK-006 已闭环）**：`scripts/check-version-consistency.cjs`（`pnpm run version:check`，已挂入 `pnpm run check`）持续校验：① `package.json.version === compat.framework.templateVersion`；② 最新 Git Tag 具备对应发布说明；③ 若渠道 Tag 与模板版本不同，发布说明必须显式声明 `templateVersion` 策略。

---

## 4. 已验证能力面（非发布声明）

以下是**当前代码状态下可以复跑验证**的能力面，仅供判断"现在能不能用"，
**不构成发布声明**（发布需 `RELEASE_APPROVED`）：

| 能力面 | 验证入口 |
|---|---|
| 契约与治理门禁 | `pnpm run check` |
| 消费面一致性（工具/技能/门禁） | `pnpm run compat:check` |
| 依赖漏洞棘轮 | `pnpm run deps:audit` |
| 客户端构建 | `pnpm run clients:build:check` |
| 全量测试 | `pnpm run test:clean`（自动剔除 `DATABASE_URL` / `DB_DRIVER` / **`NODE_ENV`**；手写 `env -u` 漏一个就会误红） |
| 生产构建 | `pnpm run build` |
| 登录冒烟 / 安全扫描 / 压测 | `smoke:login` / `security:scan` / `load:test`（**本机零容器可跑**：自起嵌入式 Postgres；压测 rps 受机器负载影响，不代表容量） |
| 环境指纹 | `pnpm run fingerprint` → `fingerprint:verify` |
