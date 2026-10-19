# Requirements Specification: 交付链三件套用嵌入式 Postgres（PGlite）本地验证，去除容器依赖

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`infra` | 规格标识：`delivery-chain-local-verification`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让 `smoke:login` 与 `security:scan` 在**嵌入式 PGlite**（Postgres 编译为 WASM）上跑通，从而本机零容器即可验证交付链；不再依赖 docker/colima 的端口转发。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 两个事实叠加，导致本机无法验证：① `smoke:login`/`security:scan`/`load:test` 全部**只支持 docker 里的 Postgres**（`docker exec psql` + 容器名 `cooliebase-dev-postgres-1` + 写死端口 5433）；② 本机 colima 的转发器故障（lima 日志 `failed to set up forwarding tcp port 5433 … exit status 255`，随后按「negligible」忽略），宿主机 `lsof -iTCP:5433` 无任何监听 → `localhost:5433` 不可达。结果：G7 只能在 CI 验证。
- 目标指标 (Target): 本机**不启动任何容器**的前提下：`smoke:login` exit=0（建库→迁移→种子→登记插件→起服务→登录 200→受保护接口 200）、`security:scan` exit=0（12 项含两个阴性对照）；两条命令跑完端口与临时数据零残留；数据库不可用时必须非 0 退出。`load:test` 的 PGlite 适用性单独评估（见 nonGoals）。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 交付链三件套用嵌入式 Postgres（PGlite）本地验证，去除容器依赖 | delivery-chain-local-verification | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
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
2. **THE system SHALL** 验证：本机无 docker 运行时，`npm run security:scan` exit=0，12 项全过且两个阴性对照仍会失败
3. **THE system SHALL** 验证：PGlite 上的迁移与真实 Postgres 一致（`prisma migrate deploy` 全部应用，已在 spike 中验证）
4. **THE system SHALL** 验证：命令结束后：PGlite 端口无监听、无残留 node 进程、临时数据已删除
5. **THE system SHALL** 验证：反向对照：把 PGlite 启动禁用后，两条命令**必须非 0 退出**（不得回退成内存模式并报绿）
6. **THE system SHALL** 验证：`npm run check` exit=0，全量测试 0 failed

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 不得依赖 docker/colima：本机零容器必须可跑；CI 若已有 Postgres 仍可直接用（环境变量优先）。
* **THE system SHALL COMPLY WITH**: 不得换成 SQLite：SQLite 不是 Postgres 语义，等于换了被测对象（PGlite 才是 Postgres 的 WASM 编译）。
* **THE system SHALL COMPLY WITH**: 不得把「跳过」当「通过」：PGlite 启动失败、迁移失败、登录失败都必须非 0 退出并可诊断。
* **THE system SHALL COMPLY WITH**: 不得残留：PGlite 进程与临时数据目录在 finally 中清理，并轮询确认端口释放。
* **THE system SHALL COMPLY WITH**: 不改变检查内容：登录链路的断言、12 项渗透清单、两个阴性对照必须逐字保留。

### 明确不做与负向范围 (Non-Goals)
* `load:test` 不在本次改用 PGlite 的范围内 —— PGlite 是**单连接数据库**，多连接靠复用器，README 明确「不保证所有用法可用」，用它压出来的 rps/p95 **不能代表容量**；该脚本继续要求真实 Postgres（CI 或本机容器），并在帮助信息里写明这一点。
* 不改 docker compose、不重启 colima、不动用户现有容器
* 不调整渗透项与压测阈值
* 不把三件套并入 `npm run check`（它们要起服务，属发布期检查）
