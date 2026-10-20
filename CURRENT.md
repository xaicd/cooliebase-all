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

## 3. 版本策略：两个解耦的概念（勿混为一谈）

本仓**刻意区分**两个"版本"，这不是漂移：

| 概念 | 载体 | 含义 |
|---|---|---|
| **发布/渠道版本** | git tag（可带语义后缀，如 `v1.4.0-brand-shorthand`） | 一次对外发布或一次品牌里程碑的身份 |
| **模板版本** | `package.json.version` 与 `compat.framework.templateVersion` | hatch 出的下游工程继承的模板基线；**两者必须同步** |

**依据**：`docs/07_release/RELEASE_NOTES_v1.4.0-brand-shorthand.md` 的 R3 / R11 ——
`v1.4.0-brand-shorthand` 是**显式命名的渠道 tag**；当时**刻意不 bump** `package.json.version`
（保持 `1.2.0`），`templateVersion` 同理（它跟踪"模板"，而非"发布"）。

**当前门禁缺口**：上述策略只写在发布说明里，**没有机检**。若
`package.json.version` 与 `compat.templateVersion` 不同步，或打了一个没有发布说明的 tag，
目前无人拦截。→ 已在 `risk-register.md` 登记为 RSK-006。

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
| 全量测试 | `pnpm run test:clean`（自动剔除 `DATABASE_URL` / `DB_DRIVER` / **`NODE_ENV`**；手写 `env -u` 漏一个就会误红） |
| 生产构建 | `npm run build` |
| 登录冒烟 / 安全扫描 / 压测 | `smoke:login` / `security:scan` / `load:test`（**本机零容器可跑**：自起嵌入式 Postgres；压测 rps 受机器负载影响，不代表容量） |
| 环境指纹 | `npm run fingerprint` → `fingerprint:verify` |
