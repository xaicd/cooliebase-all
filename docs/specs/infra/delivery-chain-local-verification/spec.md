# Requirements Specification: 交付链三件套本地可验证（smoke/security/load）

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`infra` | 规格标识：`delivery-chain-local-verification`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让 `smoke:login` / `security:scan` / `load:test` 三件套在**本机自管理**跑通（当前只能在 CI），从而真正验证交付链而不是把它长期列为「受阻」。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 本机三件套**从未跑通**。实测：容器 `cooliebase-dev-postgres-1` 已发布 `0.0.0.0:5433->5432/tcp`，但 macOS 侧 `localhost:5433` **不可达**（colima 为 Linux VM，端口未转发到宿主机）；仓库无 `host-exec` 兜底；三个脚本又把端口 **5433 写死**（仅 `PGHOST` 可配）。→ G7 只能在 CI 验证。
- 目标指标 (Target): 三条命令在本机各自 exit=0，且**真实完成**：`smoke:login` 登录 200 + 受保护接口 200；`security:scan` 12 项全过（含两个阴性对照）；`load:test` 产出 rps/p95/失败率并对阈值。跑完**零残留**（进程/端口/临时库）；数据库不可达时**显式失败**，不得把 SKIP 当 PASS。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 交付链三件套本地可验证（smoke/security/load） | delivery-chain-local-verification | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为开发/SRE] 作为开发者，我在本机执行 `npm run smoke:login` 就能完成建库→迁移→种子→起服务→登录→受保护接口，无需手工起容器或改环境变量。

2. **P0** [作为开发/SRE] 作为开发者，当本机数据库不可达时，命令必须**大声失败**并说明缺什么（colima 未起 / 隧道端口占用），而不是静默跳过。

3. **P1** [作为开发/SRE] 作为 SRE，我要求三件套共用同一套「数据库端点解析」逻辑，避免三个脚本各写一份 5433。

## 4. 关键业务不变量 (Key Business Invariants)

1. **检查集不可被静默降级** —— 不可达必须非 0 退出；SKIP 只能由显式环境开关触发，且输出必须可见
2. **无残留** —— 隧道进程与临时数据库在 finally 中清理，并轮询验证端口释放

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：本机 `npm run smoke:login` exit=0，且输出含登录 200 与受保护接口 200
2. **THE system SHALL** 验证：本机 `npm run security:scan` exit=0，12 项全过（两个阴性对照必须仍然会失败）
3. **THE system SHALL** 验证：本机 `npm run load:test` exit=0，产出 rps/p95/失败率并对阈值
4. **THE system SHALL** 验证：三条命令结束后：隧道端口无监听、无残留 next/node 进程、临时库已清理
5. **THE system SHALL** 验证：反向对照：数据库不可达时三条命令**必须非 0 退出**（不得 skip 成 0）
6. **THE system SHALL** 验证：`npm run check` exit=0 且全量测试 0 failed

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 不得改变 CI 行为：CI 中 `localhost:5433` 本就可达，应走「直接连接」分支而非隧道。
* **THE system SHALL COMPLY WITH**: 不得把「跳过」当「通过」：任何不可达/未就绪都必须非 0 退出并给出可执行指引。
* **THE system SHALL COMPLY WITH**: 不得引入常驻依赖：隧道随命令生命周期建立与销毁，命令结束不得残留进程或占用端口。
* **THE system SHALL COMPLY WITH**: 不改变三件套的检查内容（登录链路/12 项渗透/压测阈值），本次只解决「连不上库」。

### 明确不做与负向范围 (Non-Goals)
* 不调整压测阈值，也不新增渗透检查项（阈值与检查集的变更应有独立规格）
* 不改造 docker compose / 不引入 docker-in-docker
* 不把三件套并入 `npm run check`（它们依赖真实库与起服务，属发布期检查）
* 不承诺跨平台（Windows/WSL）一致体验，本次只覆盖当前开发机形态（macOS + colima）
