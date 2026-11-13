# Requirements Specification: 客户端构建门禁（Expo 导出）+ Expo SDK 升级路径评估

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`client-build-gate`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

补上仓内**完全缺失**的客户端构建验证：新增 `npm run clients:build:check`，跑一次 Expo 导出并断言产物，使「客户端还能不能被打包」从无人验证变成有门禁；并据此给出 Expo SDK 升级路径的评估结论（升级本身不在本次范围内）。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 客户端构建门禁（Expo 导出）+ Expo SDK 升级路径评估 | client-build-gate | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为基座维护者] 新增门禁：跑一次 Expo 导出到**临时目录**（不污染工作区），断言退出码为 0 且产物含 index.html 与至少一个 bundle

2. **P0** [作为基座维护者] 在 `clients/expo` 缺席或依赖未安装时**跳过并说明原因**，而不是失败 —— 裁剪过的工程（profile base/minimal）不含客户端，硬要求会让门禁在那些工程里必定红

3. **P1** [作为基座维护者] 接线：npm script + `npm run check` 链 + 轨迹 gates + compat 声明（check 已在 CI 的 gates job 里跑，故无需另加 CI 步骤）；并配反向对照证明门禁会 fire

4. **P1** [作为基座维护者] 把 Expo SDK 升级路径评估（含本次实测证据）写入依赖治理台账 §3.2，替换原先「无可验证手段」的表述

## 4. 关键业务不变量 (Key Business Invariants)

1. **零污染** —— 导出始终指向临时目录，且 finally 中清理；调用前后 git status 必须一致
2. **裁剪不失败** —— clients/** 缺席即跳过（exit 0 + 原因），保证 profile base/minimal 孵化的工程不会因缺少客户端而红

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：`npm run clients:build:check` exit=0，且断言产物存在（index.html + 至少 1 个 bundle 文件）
3. **THE system SHALL** 验证：零污染：调用后 `git status --porcelain` 与调用前一致（导出产物已清理）
4. **THE system SHALL** 验证：反向对照：人为破坏客户端入口后门禁必须失败（证明它会 fire，不是装饰）
5. **THE system SHALL** 验证：裁剪场景：临时移开 `clients/expo` 时门禁跳过并打印原因，退出码为 0 而非失败

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 零污染：导出产物必须落到临时目录并在结束时清理，调用后 `git status --porcelain` 不得出现新条目。
* **THE system SHALL COMPLY WITH**: 离线可跑：不得依赖网络（除已安装依赖外）；实测 `expo export` 走本地 Metro 打包。
* **THE system SHALL COMPLY WITH**: 裁剪安全：`clients/**` 缺席的工程必须跳过关禁而不是失败（基座要能被裁剪孵化）。
* **THE system SHALL COMPLY WITH**: 不得绕过 `npm run check`：门禁只报事实与退出码，不自判通过。

### 明确不做与负向范围 (Non-Goals)
* 本次**不**升级 Expo SDK（只补门禁 + 出评估结论）
* 不做 iOS/Android 原生构建（需要 Xcode/Android SDK，超出本仓可验证范围）；只做 web 导出这条可在 CI 跑的链
* 不改动客户端应用代码或 Expo 依赖版本
