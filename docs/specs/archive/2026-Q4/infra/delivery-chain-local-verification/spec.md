# Requirements Specification: 交付链三件套用嵌入式真实 Postgres（embedded-postgres）本地验证

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`infra` | 规格标识：`delivery-chain-local-verification`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让 `smoke:login` / `security:scan`（并评估 `load:test`）在**嵌入式真实 PostgreSQL 二进制**上跑通，本机零容器、零 docker/colima 依赖，且保留**真实 Postgres 引擎**（多连接、真扩展、可代表容量）。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 两个事实叠加导致本机无法验证：① `smoke:login`/`security:scan`/`load:test` 只支持 docker 里的 Postgres（`docker exec psql` + 容器名 `cooliebase-dev-postgres-1` + 写死 5433）；② 本机 colima 转发器故障（lima 日志 `failed to set up forwarding tcp port 5433 … exit status 255`，随后按『negligible』忽略），宿主机 `lsof -iTCP:5433` 无监听 → `localhost:5433` 不可达。结果：G7 只能在 CI 验证。
- 目标指标 (Target): 本机**不启动任何容器**：`smoke:login` exit=0（建库→迁移→种子→登记插件→起服务→登录 200→受保护接口 200）、`security:scan` exit=0（20 项含两个阴性对照）；两条命令跑完进程/端口/数据目录零残留；数据库起不来必须非 0 退出。`load:test` 因是**真实 Postgres 多连接**，同机制下应可运行，但其数字仅代表本机、不代表生产容量。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 交付链三件套用嵌入式真实 Postgres（embedded-postgres）本地验证 | delivery-chain-local-verification | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为开发/SRE] 作为开发者，我执行 `npm run smoke:login` 时脚本自动起一个嵌入式 Postgres（PGlite），跑完自动销毁，全程不需要 docker。

2. **P0** [作为开发/SRE] 作为开发者，当 PGlite 起不来或迁移失败时，命令必须**非 0 退出**并说明原因，而不是回退到「跳过」或悄悄改用内存模式。

3. **P1** [作为开发/SRE] 作为 SRE，`security:scan` 也走同一套端点解析，避免两个脚本对数据库各有一套假设。

## 4. 关键业务不变量 (Key Business Invariants)

1. **引擎语义不可降级** —— 只允许真实 Postgres 或 PGlite（Postgres 的 WASM 编译）；禁止退回 SQLite/内存模式并报绿
2. **无残留** —— PGlite 进程与临时目录在 finally 中清理，轮询验证端口释放

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：本机无 docker 运行时，`npm run smoke:login` exit=0，输出含登录 200 与受保护接口 200
2. **THE system SHALL** 验证：本机无 docker 运行时，`npm run security:scan` exit=0，20 项全过且两个阴性对照仍会失败
3. **THE system SHALL** 验证：嵌入式 Postgres 的版本与 CI 使用的 PostgreSQL 主版本一致（避免两套语义）
4. **THE system SHALL** 验证：命令结束后：postgres 进程已退出、端口无监听、临时 dataDir 已删除
5. **THE system SHALL** 验证：反向对照：禁用嵌入式 Postgres 后，命令必须非 0 退出（不得回退内存模式并报绿）
6. **THE system SHALL** 验证：`npm run check` exit=0，全量测试 0 failed；`npm run deps:audit` 不新增高危

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 不得依赖 docker/colima：本机零容器必须可跑；CI 已有真实 Postgres 时用 `DATABASE_URL` 直连优先。
* **THE system SHALL COMPLY WITH**: 必须是**真实 Postgres 引擎**：不接受 SQLite（换了被测对象），也不接受 PGlite 这类单连接 WASM 实现来跑容量类检查。
* **THE system SHALL COMPLY WITH**: pnpm 下必须把 `embedded-postgres` 的 post-install 脚本登记进 `pnpm-workspace.yaml` 的 `allowBuilds` —— 否则符号链接不生成、服务起不来（§2.1 同类故障）。
* **THE system SHALL COMPLY WITH**: 版本必须**精确锁定**（当前为 `18.4.0-beta.17`），不得用 `^` 浮动；beta 状态须记入依赖策略与风险。
* **THE system SHALL COMPLY WITH**: 不得把「跳过」当「通过」：初始化/启动/迁移/登录任一步失败都必须非 0 退出并可诊断。
* **THE system SHALL COMPLY WITH**: 不得残留：postgres 进程与临时数据目录在 finally 中清理，并轮询确认端口释放。
* **THE system SHALL COMPLY WITH**: 不改变检查内容：登录断言、20 项渗透清单、两个阴性对照逐字保留。

### 明确不做与负向范围 (Non-Goals)
* 不把 `load:test` 的数字当作容量结论：即便改用真实 Postgres，本机压测仍受单机 CPU/磁盘限制，只作回归护栏
* 不改 docker compose、不重启 colima、不动用户现有容器
* 不调整渗透项与压测阈值
* 不把三件套并入 `npm run check`（它们要起服务，属发布期检查）
