# `.kiro/specs/` —— 历史规划规格（**请勿当作进度真源**）

本目录是 **Kiro 格式**的规划规格，来自本仓较早的阶段。它们**不被任何门禁或流程消费**
（`docs:commands:check` 只是把它们列为"历史区、不参与命令真实性判定"）。

---

## 1. 最重要的两点（否则极易误判）

### ① 任务清单**没有维护**，请勿把 `0/N` 读成"没开工"
四份规格的 `tasks.md` 里勾选数都是 **0**，但**它们描述的产出已经在代码里存在**（逐项核实于 2026-10-19）：

| 规格 | 描述的目标 | 代码里的证据（**已核实存在**） |
|---|---|---|
| `online-low-code-engine` | 自研 Online 低代码引擎 | `packages/plugins/plugin-online/`（含 `online-definitions-list` / `online-definition-designer` / `online-definition-create` / `online-form-runtime` 四个页面） |
| `go-microservice-evolution` | 单体 → 可按域独立发布 | `docs/architecture/cooliebase-all-microservice-governance.md` |
| `frontend-cu-form-codegen-sync` | 表单收敛到统一目录与契约 | `packages/**/frontend/components/*Form.tsx`（实测 **340** 个） |
| `cpc-user-and-appearance` | C 端用户模块 + 站点/主题可配置化 | `packages/domains/infra/backend/services/appearance.service.ts` + `appearance.validators.ts` + `appearance.service.test.ts` |

> 结论：**规格的规划信息仍有参考价值，但它的"完成度"字段是失效的** ——
> 不要用 `tasks.md` 的勾选数判断任何事。

### ② 里面的**路径大多已过期**（迁移前结构）
典型例子：

- `packages/domains/member/...` → 已迁移为 `packages/plugins/plugin-member/...`（全量 15 个业务域都已插件化）；
- `clients/h5`、`clients/uniapp`、`clients/flutter`、`clients/desktop-pc` → **已删除**，本仓只保留 `clients/expo`；
- 早期写法的目录分层（`src/backend`、`src/frontend`）→ 现由 `AGENTS.md` §3.2 明确禁止。

**照抄这些路径会直接产出违反当前规范的结构。**

---

## 2. 那该以什么为准

| 想知道 | 去看 |
|---|---|
| 代码结构与目录约束 | `AGENTS.md`（§3.2 / §3.2.1） |
| 域清单与插件身份 | `packages/shared/backend/constants/domain-catalog.json` |
| 当前规格真源 | `docs/specs/<域>/<名>/`（Spec-Kit 格式，有门禁与任务追溯） |
| 已完成/进行中的规划 | `docs/01_management/project-plan.md` |

## 3. 为什么不直接删掉

- 四份规格的**设计推演**（取舍理由、备选方案）在别处没有完整留存，删掉等于丢上下文；
- 它们**不被任何流程消费**，误用风险主要来自"没标注清楚"，而不是"存在"本身。

若将来确认这些设计推演已被 `docs/architecture/` 完整吸收，可整体删除（git 历史仍可恢复）。
届时请一并从 `scripts/check-docs-commands.cjs` 的 `SKIP_PREFIXES` 中移除本目录条目。
