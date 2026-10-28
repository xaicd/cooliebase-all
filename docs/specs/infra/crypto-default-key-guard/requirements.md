# Requirements Specification: 生产环境必须禁止使用硬编码默认 AES 密钥

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`security` | 所属领域：`infra` | 规格标识：`crypto-default-key-guard`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让『生产环境复用公开默认密钥』从『静默可用』变成『启动/调用即失败』，并落成一条会失败的行为级机检。


### 漏洞评级与威胁攻击面 (Vulnerability Advisory & Attack Surface)

- 漏洞概述与 PoC: 安全防御加固
- 攻击面削减: 最小权限原则


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 生产环境必须禁止使用硬编码默认 AES 密钥 | crypto-default-key-guard | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为安全负责人] 作为安全负责人，生产环境若没有设置密钥，加密调用必须直接失败并点名环境变量，绝不能回退到仓库里可见的默认值。

2. **P0** [作为安全负责人] 作为开发者，本地与测试环境（未设 NODE_ENV=production）不应被打断，仍可用默认值跑测试。

3. **P1** [作为安全负责人] 作为构建维护者，`next build`（NODE_ENV=production）**不能**因为缺密钥而失败 —— 守卫必须在**调用时**而不是模块加载时触发。

## 4. 关键业务不变量 (Key Business Invariants)

1. **生产不许静默降级** —— NODE_ENV=production 且缺密钥 → 抛错；由子进程行为测试守。
2. **构建不被破坏** —— 守卫只在调用时触发；由「import 不调用不报错」守。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：行为验证：`NODE_ENV=production` 且未设密钥 → `cryptoEngine.encrypt()` 抛错，且错误信息包含 `COOLIEBASE_SHARED_AES_KEY`
3. **THE system SHALL** 验证：行为验证：`NODE_ENV=production` 且已设密钥 → 正常加解密；`cryptoVault` 同理（`COOLIEBASE_VAULT_AES_KEY`）
4. **THE system SHALL** 验证：非生产（无 NODE_ENV）未设密钥 → 仍可用（不破坏测试与本地开发）
5. **THE system SHALL** 验证：构建安全：模块**加载**不抛错（只有调用才抛）—— 用「import 后不调用不报错」验证
6. **THE system SHALL** 验证：反向对照：把守卫去掉，上述行为验证必须失败（证明机检真的在测这件事）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: **必须行为级机检**：不是 grep 源码找 `|| "..."`（太脆），而是起子进程带 NODE_ENV=production 断言抛错。
* **THE system SHALL COMPLY WITH**: **不能影响构建**：`next build` 会以 NODE_ENV=production 运行；守卫放模块加载时会炸掉构建 → 必须放调用时。
* **THE system SHALL COMPLY WITH**: **不能影响测试**：`test:clean` 会 unset NODE_ENV，默认值仍可用。
* **THE system SHALL COMPLY WITH**: 不改加密算法本身（那是独立决策）；本规格只解决『缺密钥不许静默降级』。

### 明确不做与负向范围 (Non-Goals)
* 不把 AES-CBC 换成 GCM（独立决策：`crypto-vault` 已实现 GCM 但无人使用，是否迁移另议）。
* 不动 `hashPassword`（它是 HMAC-SHA256，本就不适合存密码；且当前无人使用）。
* 不引入传输层加密信封。
* 不在本规格里补 `.env.example` 之外的分发流程（KMS/密钥轮换另议）。
