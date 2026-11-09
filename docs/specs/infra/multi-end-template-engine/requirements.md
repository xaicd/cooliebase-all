# Requirements Specification: 对标 PagePlug 与商业低代码平台：多端模版源头与响应式区块画布升级

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`multi-end-template-engine`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

对标 cloudtogo/pageplug (Appsmith+Formily+ECharts+Taro) 与百度 Amis/NocoBase，将当前仅支持单表 7 种字段的简陋画布升级为支持多区块 (指标卡/图表/看板/主子表/C端瀑布流)、{{表达式}} 响应式联动、PC+移动双视口设计器、以及按业务域同步裁剪的『商业级多端模版源头』。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 对标 PagePlug 与商业低代码平台：多端模版源头与响应式区块画布升级 | multi-end-template-engine | 本规格所交付的真实业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 领域门面契约 | Domain Facade | 业务模块对外暴露的标准契约接口，跨域通信单向调用，内部实现自闭环 |
| 数据隔离策略 | Data Isolation Policy | 依据客户交付形态按需选择（单租户物理独立库 / 多租户行级租户隔离可选特性） |

## 3. 业务需求立项与多端建设交付范围 (Business Intake & Multi-Terminal Scope)

### 3.1 真实业务立项背景
- **交付目标**: 面向客户真实业务场景，消灭手工低效流程与断点。
- **服务对象**: 涵盖 B 端业务操作员、管理员及终端客户角色，杜绝无主需求。

### 3.2 多端建设覆盖边界
- **B端管理中台**: 负责业务运营配置、流程审核、数据对账与大盘监控。
- **C端用户门户/移动端**: 负责业务直接录入、消费结算与进度查询（按需）。
- **多端协议对齐**: 多端统一遵循 OpenAPI/REST 契约规范，共享领域状态机。

## 4. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为业务应用搭建者 / 实施工程师] 系统必须提供零 eval 风险的安全沙箱表达式引擎 (expression-engine.ts)，支持 {{ $form.xxx }}、{{ $state.xxx }}、{{ $row.xxx }} 动态求值，驱动字段 visibleOn / disabledOn / requiredOn 实时联动（对标 PagePlug + Formily）

2. **P0** [作为业务应用搭建者 / 实施工程师] PageSchema 协议必须向后兼容升级为 PageBlockDSL v2，支持 20+ 种字段控件与多区块拼装（指标统计卡 StatMetrics、可视化图表 Chart、状态看板 Kanban、表格 ProTable 及 C 端轮播/宫格/商品流区块）

3. **P0** [作为业务应用搭建者 / 实施工程师] clients/expo 必须重构为严格的 app/ + shared/ + modules/<domain>/ 标准模块化结构，升级移动端区块与高级控件渲染器，且 hatch-profile.cjs 支持按 --bundle 与 --clients 同步裁剪客户端域模块

4. **P1** [作为业务应用搭建者 / 实施工程师] online-definition-designer 必须提供『左区块组件库 + 中间 PC/375px 移动双视口实时预览画布 + 右侧联动表达式配置』的可视化设计体验（对标 PagePlug 双端画布）

## 5. 关键业务不变量 (Key Business Invariants)

1. **表达式沙箱零代码执行注入 (Zero-Eval Sandbox)** —— 表达式求值器仅解析标识符、字面量、算术/比较/逻辑/三元运算符与安全白名单方法，访问 __proto__/constructor/process/window 立即拦截并返回 undefined。
2. **存量 342 份 PageSchema 100% 向下兼容** —— blocks、queries、visibleOn 等全部声明为 optional，当未配置 blocks 时 UniversalSchemaCanvas 自动根据字段推导默认统计摘要与增强视图。
3. **前后端业务域同源裁剪一致性** —— DOMAIN_PATH_PREFIXES 包含 clients/expo/src/modules/，被排除的业务域在客户端源码中同步物理剔除，且客户端模块注册表支持优雅降级。

## 6. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm vitest run test/unit/multi-end-template-engine.test.ts` exit=0（覆盖表达式沙箱求值、安全拦截、PageBlockDSL v2 校验、客户端布局与孵化裁剪）
2. **THE system SHALL** 验证：`collectClientPackageLayoutErrors(ROOT)` 返回空数组 `[]`，且 `client-channels.json` 中 `expo` 已移除 `requiredSourceDirs: ["shared"]` 特批豁免
3. **THE system SHALL** 验证：`resolveHatchPlan` 在 `--profile vertical --bundle member` 下自动排除 `clients/expo/src/modules/mall`，实现前后端按域同步裁剪
4. **THE system SHALL** 验证：`pnpm run clients:build:check` exit=0（Expo Web 导出构建包含重构后的模块化与区块渲染产物）
5. **THE system SHALL** 验证：`pnpm run check` exit=0（全量静态、契约、路由、门禁 100% 通过）

## 7. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 100% 向后兼容：现有的 342 份 PageSchema (entity + title + fields[]) 必须零修改正常解析与渲染，blocks[] 与联动表达式作为渐进增强字段。
* **THE system SHALL COMPLY WITH**: 零 eval 安全红线：表达式引擎严禁使用 eval() 或 new Function()，必须采用受控词法/语法 AST 求值器，彻底阻断原型链污染与代码注入。
* **THE system SHALL COMPLY WITH**: 多端包结构铁律：独立客户端必须通过 collectClientPackageLayoutErrors 的 app/ + shared/ + modules/<domain>/{api,models,pages,components} 校验，不再保留豁免后门。
* **THE system SHALL COMPLY WITH**: 多租户与真实数据库：PageSchema 存储继续复用 system_config 与真实 SQLite/Postgres，严禁引入 MongoDB 等外部重型异构数据库。

### 明确不做与负向范围 (Non-Goals)
* 不引入 PagePlug/Appsmith 的 Java Spring WebFlux + MongoDB 重型后端，保持本仓 Next.js + TypeScript + Kysely 单一技术栈。
* 不破坏现有 15 个业务域插件的后端 API 路由契约。
