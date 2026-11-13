# Requirements Specification: 全栈拉起器与 Caddy 网关部署片段

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`fullstack-launcher-caddy`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

一条命令拉起全栈（后端 + 前端）并就绪自验，同时产出可直接部署的 Caddy 网关片段；多项目同机时不撞端口。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 全栈拉起器与 Caddy 网关部署片段 | fullstack-launcher-caddy | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为开发者] 作为开发者，我跑一条命令就能拉起全栈并看到资产/端口就绪情况。

2. **P0** [作为开发者] 作为运维，我在宿主机上部署本项目的网关规则，校验通过才热重载、失败保留原配置。

3. **P1** [作为开发者] 作为多项目同机的使用者，我希望端口按项目隔离，避免 EADDRINUSE。

## 4. 关键业务不变量 (Key Business Invariants)

1. **拉起器与网关指向同一端口** —— 端口回退读 `package.json` 的 `dev` 脚本；`run-all.cjs --check` 输出必须为 3200 且与 caddy 片段一致。
2. **部署脚本不擅自改系统** —— 缺 `/etc/caddy/services.d` 或缺 caddy 时只打印指引（本机实测路径）。
3. **失败保留原配置** —— `caddy validate` 不过则 `exit 1` 且不覆盖已有片段。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：`node scripts/run-all.cjs --check` exit=0，且**解析出的端口 = 3200**（与 `deploy/caddy/cooliebase-all.caddy` 的 reverse_proxy 一致）
3. **THE system SHALL** 验证：`bash scripts/deploy-caddy.sh` 在**无 `/etc/caddy/services.d` 且未装 caddy** 的环境下只打印部署指引、**不改动系统**（本机实测）
4. **THE system SHALL** 验证：反向对照（本特性自己制造过的缺陷）：把端口回退改回 `3000 + offset`，应重新出现「拉起器 3000 ↔ 网关 3200」的不一致

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: **不引入新依赖**：拉起器只用 Node 内置模块；部署脚本只用 bash + caddy（缺 caddy 时降级为打印指引）。
* **THE system SHALL COMPLY WITH**: **不擅自改系统**：`deploy-caddy.sh` 仅在 `/etc/caddy/services.d` 存在且装了 caddy 时才动手，否则**只打印部署指引**。
* **THE system SHALL COMPLY WITH**: **端口必须与本仓约定一致**：真源是 `package.json` 的 `dev` 脚本（`next dev -p 3200`）与 `deploy/caddy/*.caddy` 的 reverse_proxy 目标。
* **THE system SHALL COMPLY WITH**: 沿用本仓既有门禁（`pnpm run check`），不为本特性新增门禁。

### 明确不做与负向范围 (Non-Goals)
* **不做实际部署**：本特性只产出规则与脚本，不替任何人执行生产变更。
* **不移植 yudao 血统的其余部分**：`run-all.cjs` 里 `apps/backend/yudao-server`、`apps/admin` 等分支在本仓不存在（实测），保留为无害死分支，不为其补桩。
* 不引入 Caddy 作为本仓依赖。
