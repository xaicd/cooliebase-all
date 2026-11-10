# 🧭 cooliebase-all 项目 PMO 待办与全息状态大盘 (Project PMO Dashboard)

> **实时刷新命令**: `pnpm run pmo`（或 `node scripts/cmmi-01-management.cjs pmo [--write|--json]`）
> **项目坐标**: `cooliebase-all@1.2.0` | **分支**: `main` | **HEAD**: `65c22e63 docs(harness): unify 30s AI agent playbook and multi-IDE entry files across blueprint bases (55 minutes ago)` | **工作区净度**: ⚠️ 24 处未提交变更

## 一、Spec-Kit 规格漏斗与 WBS 原子任务进度

- **活跃规格总数**: `25` 个 ｜ 🔥 **施工中 (WIP)**: `17` 个 ｜ 📋 **已立项待开工**: `0` 个 ｜ 📝 **待填骨架**: `0` 个 ｜ 📦 **已完结待归档**: `8` 个

### 🔥 1.1 正在施工规格 (WIP — 优先接续推进)
| 规格标识 (`domain/spec`) | 进度 | 下一步待办任务 (`Next Task`) | 白名单范围 | 核验命令 |
| :--- | :--- | :--- | :--- | :--- |
| `system/g1-requirements-baseline` | **0/3** | **T1**: speckit new 创建 g1-requirements-baseline 规格骨架并编写 EARS 用户故事/ *(文件已落盘，待核验标签)* | `docs/specs/system/g1-requirements-baseline/br` | `node scripts/cmmi-04-implementation.cjs tasks --spec g1-requirements-baseline` |
| `infra/workspace-executability-purge-scope` | **0/4** | **T1**: 新增口径真源模块 scripts/lib/workspace-executability-scope.cjs（平台  *(文件已落盘，待核验标签)* | `scripts/lib/workspace-executability-scope.cjs` | `node scripts/cmmi-04-implementation.cjs tasks --spec workspace-executability-purge-scope` |
| `infra/compat-manifest-single-source` | **0/3** | **T1**: 编写红灯复现测试用例 (Red Test) *(文件已落盘，待核验标签)* | `test/unit/compat-manifest-single-source.test.` | `node scripts/cmmi-04-implementation.cjs tasks --spec compat-manifest-single-source` |
| `infra/dsh-product-integration` | **2/3** | **T3**: 验收：两界面可达 + 关闭 dsh 业务照常 + 反向对照 + 计划同步 *(文件已落盘，待核验标签)* | `scripts/check-delivery-boundary.cjs, docs/01_` | `node scripts/cmmi-04-implementation.cjs tasks --spec dsh-product-integration` |
| `infra/ui-design-tokens` | **1/3** | **T2**: codegen 模板改用 token *(文件已落盘，待核验标签)* | `packages/domains/infra/backend/services/codeg` | `node scripts/cmmi-04-implementation.cjs tasks --spec ui-design-tokens` |
| `infra/permission-naming-unify` | **2/4** | **T2**: 权限表按新键重写（生成段） *(文件已落盘，待核验标签)* | `packages/shared/backend/constants/permissions` | `node scripts/cmmi-04-implementation.cjs tasks --spec permission-naming-unify` |
| `infra/fullstack-launcher-caddy` | **0/3** | **T1**: 收编三个产物并修正端口回退（拉起器 ↔ 网关端口一致） *(文件已落盘，待核验标签)* | `scripts/run-all.cjs, scripts/deploy-caddy.sh,` | `node scripts/cmmi-04-implementation.cjs tasks --spec fullstack-launcher-caddy` |
| `infra/hatch-e2e` | **0/3** | **T1**: 实现 hatch:e2e harness（两条入口 × install × 产物 check；嵌入式 PG；清理与  *(文件已落盘，待核验标签)* | `scripts/hatch-e2e.cjs, package.json` | `node scripts/cmmi-04-implementation.cjs tasks --spec hatch-e2e` |
| `infra/delivery-chain-local-verification` | **6/7** | **T6**: 回写 AGENTS/计划 R3,G7/日志 *(文件已落盘，待核验标签)* | `AGENTS.md, docs/01_management/project-plan.md` | `node scripts/cmmi-04-implementation.cjs tasks --spec delivery-chain-local-verification` |
| `infra/mcp-write-tools` | **4/5** | **T3**: 同步 compat-manifest additive 策略与交叉校验 *(文件已落盘，待核验标签)* | `packages/shared/contract/compat-manifest.json` | `node scripts/cmmi-04-implementation.cjs tasks --spec mcp-write-tools` |

### 📦 1.3 代码与任务已完结规格 (Ready for Gate Evidence / Archive: 共 8 个)
- **代表规格**: `infra/multi-end-template-engine` (15/15)、`infra/test-shared-file-isolation` (4/4)、`infra/crypto-default-key-guard` (4/4)、`system/in-app-ontology-copilot` (3/3)、`infra/sdd-write-path-discipline` (5/5)、`infra/validator-type-drift` (4/4)、`infra/example-plugin-shipping` (4/4)、`infra/typecheck-gate` (3/3)
- **收口动作**: 核对 `evidence.json` 门禁证据后执行 `node scripts/cmmi-09-operations.cjs archive --name <spec>` 归档至 `docs/specs/archive/`。

## 二、工程门禁、路线图与技术债待办池 (Engineering & Tech-Debt Backlog)

| 优先级 | 领域 / 门禁维度 | 待办事项描述 | 核验 / 执行命令 |
| :--- | :--- | :--- | :--- |
| **P2** | Evolution Backlog | Gate trace is older than HEAD | `pnpm run standards:check` |
| **P2** | Evolution Backlog | no-new-npm-run: 181 file(s) carry frozen debt | `pnpm run standards:check` |
| **P2** | Evolution Backlog | no-silent-catch: 17 file(s) carry frozen debt | `pnpm run standards:check` |
| **P1** | EVOLUTION-ROADMAP (Ring 4) | **Docker 容器独立运行编排演示**： | `pnpm run domain:pack pay` |
| **P2** | Agent-Native 语义选择器基线消减 | 存量 470 个管理端页面/组件待补齐 data-agent-id (基线棘轮守护中，新增 0) | `pnpm run agent:native:check` |
| **P2** | 插件层 TypeScript 类型与权限码基线消减 | packages/plugins 存量 190 项唯一类型键与 338 项权限码常量登记收敛 | `pnpm run typecheck:check && pnpm run contracts:governance:check` |

## 三、🎯 本项目 PMO 接下来的待办工作队列 (Prioritized Next Actions)

| 序 | 优先级 | 归属范围 | 接下来的具体待办工作 | 立即执行命令 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **P0** | `system/g1-requirements-baseline (0/3)` | 推进 T1: speckit new 创建 g1-requirements-baseline 规格骨架并编写 EARS 用户故事/验收准则/不变量 b (目标文件已在磁盘，请核验并带标签提交) | `node scripts/cmmi-04-implementation.cjs tasks --spec g1-requirements-baseline` |
| 2 | **P0** | `infra/workspace-executability-purge-scope (0/4)` | 推进 T1: 新增口径真源模块 scripts/lib/workspace-executability-scope.cjs（平台 cleanWorks (目标文件已在磁盘，请核验并带标签提交) | `node scripts/cmmi-04-implementation.cjs tasks --spec workspace-executability-purge-scope` |
| 3 | **P0** | `infra/compat-manifest-single-source (0/3)` | 推进 T1: 编写红灯复现测试用例 (Red Test) (目标文件已在磁盘，请核验并带标签提交) | `node scripts/cmmi-04-implementation.cjs tasks --spec compat-manifest-single-source` |
| 4 | **P0** | `infra/dsh-product-integration (2/3)` | 推进 T3: 验收：两界面可达 + 关闭 dsh 业务照常 + 反向对照 + 计划同步 (目标文件已在磁盘，请核验并带标签提交) | `node scripts/cmmi-04-implementation.cjs tasks --spec dsh-product-integration` |
| 5 | **P0** | `infra/ui-design-tokens (1/3)` | 推进 T2: codegen 模板改用 token (目标文件已在磁盘，请核验并带标签提交) | `node scripts/cmmi-04-implementation.cjs tasks --spec ui-design-tokens` |
| 6 | **P0** | `infra/permission-naming-unify (2/4)` | 推进 T2: 权限表按新键重写（生成段） (目标文件已在磁盘，请核验并带标签提交) | `node scripts/cmmi-04-implementation.cjs tasks --spec permission-naming-unify` |
| 7 | **P1** | `已完结规格归档池 (8 个)` | 对已完成全部任务的规格 (如 infra/multi-end-template-engine) 核销门禁证据并归档 | `node scripts/cmmi-09-operations.cjs archive --name multi-end-template-engine` |
| 8 | **P2** | `Evolution Backlog` | Gate trace is older than HEAD | `pnpm run standards:check` |
| 9 | **P2** | `Evolution Backlog` | no-new-npm-run: 181 file(s) carry frozen debt | `pnpm run standards:check` |
| 10 | **P2** | `Evolution Backlog` | no-silent-catch: 17 file(s) carry frozen debt | `pnpm run standards:check` |
| 11 | **P1** | `EVOLUTION-ROADMAP (Ring 4)` | **Docker 容器独立运行编排演示**： | `pnpm run domain:pack pay` |
| 12 | **P2** | `Agent-Native 语义选择器基线消减` | 存量 470 个管理端页面/组件待补齐 data-agent-id (基线棘轮守护中，新增 0) | `pnpm run agent:native:check` |
| 13 | **P2** | `插件层 TypeScript 类型与权限码基线消减` | packages/plugins 存量 190 项唯一类型键与 338 项权限码常量登记收敛 | `pnpm run typecheck:check && pnpm run contracts:governance:check` |
