# Requirements Specification: Expo 客户端 SDK 逐级升级（52→54→55→56→57→58）以消除构建工具链 CVE

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`infra` | 规格标识：`expo-sdk-upgrade`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

把 `clients/expo` 的 Expo SDK 从 52 逐级升到 58，消掉经 `@expo/cli` / `react-devtools-core` 进来的客户端构建工具链已知漏洞（当前 33 条 client-toolchain 中的绝大部分）；每级一次原子提交、失败即回滚该级。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 升前现状（实测）：`pnpm audit` 43 条 = runtime 10 + client-toolchain 33（critical 2 / high 30 / moderate 11）。客户端 expo ~52 + react-native 0.76.5 + React 18.3.1。
- 目标指标 (Target): 预期：client-toolchain 大幅下降（间接证据：SDK 58 的 @expo/cli 已不再直接依赖 tar/xmldom/postcss/image-size/uuid/shell-quote）。**目标数值以升级后 `pnpm run deps:audit --audit` 实测为准**，不预先编数。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| Expo 客户端 SDK 逐级升级（52→54→55→56→57→58）以消除构建工具链 CVE | expo-sdk-upgrade | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为基座维护者] 逐级升级：54 → 55 → 56 → 57 → 58，每级跑 `clients:build:check` + 全量 `check` + 全量测试，通过才提交

2. **P0** [作为基座维护者] 每级用 `deps:audit --audit` 实测漏洞消减并刷新基线；数值以实测为准

3. **P0** [作为基座维护者] 任一级失败即 `git checkout` 回滚该级改动，不带病前进（仓库必须始终保持绿态）

4. **P1** [作为基座维护者] 完成后更新依赖治理台账 §3.2 / §3.2.1 的实测结论

## 4. 关键业务不变量 (Key Business Invariants)

1. **每级可回滚** —— 每级只改 package.json 与锁文件，提交前必须具备全绿证据；失败直接 git checkout 回退，不保留中间态
2. **可验证性优先** —— 每级都必须通过客户端构建门禁 —— 该门禁正是本升级的前置条件，缺它不做升级

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：`npm run clients:build:check` exit=0（每级都要）
3. **THE system SHALL** 验证：全量 `npx vitest run` 0 failed（每级都要）
4. **THE system SHALL** 验证：`npm run deps:audit --audit` 实测消减被记录，基线经复核后刷新

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 必须逐级推进，禁止直接跳 58（跨 6 级失败时无法定位是哪一级引入的破坏）。
* **THE system SHALL COMPLY WITH**: 每级提交前必须全绿：`clients:build:check`、`npm run check`、全量测试。
* **THE system SHALL COMPLY WITH**: 失败即回滚该级：宁可停在较低版本，也不留下半升级的半坏状态。
* **THE system SHALL COMPLY WITH**: 不得为了让门禁通过而放宽任何判据（含 deps:audit 基线、构建门禁的产物断言）。

### 明确不做与负向范围 (Non-Goals)
* 不做 iOS/Android 原生构建（需 Xcode/Android SDK，超出本仓可验证范围）
* 不重构客户端业务代码（除非某级升级明确要求且改动最小）
* 不引入 EAS Build 等云端服务
