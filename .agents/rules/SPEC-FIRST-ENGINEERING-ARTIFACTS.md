# SPEC-FIRST-ENGINEERING-ARTIFACTS.md
# 0-1 软件工程交付资产与 Spec-First 实体产物硬规矩

> **生效对象**：所有接入 `cooliebase-all-base` 重型业务模板的 AI Agent、IDE 编程助手（Antigravity、Claude Code、Cursor、Copilot）及数字员工  
> **制定背景**：吸收 Coolie 核心工程教训——「CMMI 是项目交付过程管理，是这个项目从 0-1 的建设交付过程产物、文档、代码；不是项目上线运行后系统内容产物！」「任务、过程如果没有有效高质量的工程产物出现，还不如 Spec 驱动的结果！」  
> **核心宗旨**：彻底消灭大模型自动生成的套话废文档与形式主义假交付，全面推行 **`No Artifact, No Done`** 结项铁律。  
> **配套标准**：项目级与组织级 CMMI 过程资产目录划分与物理归档规范，详见 [docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md](file:///host-workspace/xaicd/cooliebase-all-base/docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md)。

---

## 一、 交付物两大阵营绝对物理隔离铁律

全体 Agent 与工程师在处理交付物 (Work Product / Artifact) 时，必须时刻保持两大阵营的绝对物理隔离：

```
                 【软件项目交付生命周期】
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
【0-1 软件工程交付资产】               【上线运行业务数据】
(Build-Time Engineering Assets)       (Runtime Business Outputs)
• 归宿：产物交付中心 / Git Repo / 门禁  • 归宿：业务本体域 (Domain) 数据库
• 受众：甲方技术总监、架构师、运维、审计 • 受众：企业管理员、业务员、终端消费者
• 包含：SRS/HLD/Swagger/源码/测试/SOP   • 包含：商城订单、支付流水、物料清单、打卡记录
• 目的：证明软件符合契约，可验收上线    • 目的：软件交付投产后为终端业务产生价值
```

### 🚫 严重违规红线：严禁将业务数据当工程产物
* **反面典型**：声称完成了“支付中心退款功能交付”，交付物却只是在数据库里手动插入了 2 条模拟退款记录，或者展示了一张 Postman 调用成功的截图。
* **正确交付**：交付《支付中心退款业务规格说明书 (SRS)》、OpenAPI 契约 (`packages/plugins/plugin-pay/contract/`)、编译 0 报错的代码实现、覆盖 4 态状态机真实入库退款的自动化集成测试用例，以及《退款回调异常秒级回滚 SOP》。

---

## 二、 G1-G5 标准工程交付资产标准

在 `cooliebase-all-base` 体系中，阶段性交付与结项必须产出以下 5 类合法实体工程资产：

### 1. G1 需求与规格基线 (Requirements Baseline)
* **《软件需求规格说明书 (SRS)》**：
  * 统一采用 **EARS 结构化句式**（`WHEN...THEN...SHALL`）精确定义业务响应；
  * 明确定义业务实体（Object）状态机迁移流转表与前置条件（Pre-conditions）。
* **《需求双向跟踪矩阵 (RTM)》**：
  * 每条需求（如 `REQ-PAY-REFUND-001`）100% 对应到具体的领域模型、API 契约与测试用例编号。

### 2. G2 架构与契约基线 (Architecture Baseline)
* **《系统架构与概要设计说明书 (HLD)》**：
  * 领域拓扑图、Domain Facade 边界声明、Seam Graph 扇入扇出分析。
* **《OpenAPI / Route Manifest 接口契约》**：
  * 强类型 Zod Schema、RPC Actions 声明（`rpc-actions.json`），直接用于前后端契约对账与跨域 RPC 调度。
* **《数据库 ER 图与物理 Migration 脚本》**：
  * Prisma Schema 变更、SQL DDL 脚本，必须包含多租户 `tenant_id` 与 8 大企业级审计底座字段。

### 3. G3 构造与实现基线 (Build & Construction)
* **完整工程源码仓库 (Source Code Commit)**：
  * 必须遵循模块化单体与第一方插件规范（`packages/plugins/plugin-*`）；
  * 编译必须 0 报错（`pnpm build` 退出码必须为 0）；
  * 代码复杂度硬约束：单函数圈复杂度 < 10，函数 < 50 行，单文件 < 500 行。
* **管理端/移动端端侧交互原型**：
  * 遵循极简两字按钮、单行工具栏、标准表格四态交互容器。

### 4. G4 验证与确认基线 (Verification & Validation)
* **真实数据库支撑的自动化测试套件 (Test Suite)**：
  * 覆盖正常流、边界值、逆向非法状态拦截与事务原子回滚；
  * **反假 Mock 铁律**：严禁无业务断言的空壳单测，必须真实断言数据库入库数据与状态机真值。
* **全生命周期冒烟与安全拦截报告**：
  * 跑通平台级登录冒烟（`npm run smoke:login`）；
  * 跑通 12 项安全穿透检查（`npm run security:scan`，含越权反证与未授权拦截）。

### 5. G5 交付与投产基线 (Release & Handover)
* **《生产环境部署与秒级回滚预案 (Deployment & Rollback SOP)》**：
  * 容器镜像构建指纹握手（`npm run fingerprint:verify`）；
  * 涵盖冷备还原、配置漂移纠偏、失败秒级回滚确定性执行步骤。
* **《用户与运维操作手册》**：
  * 面向系统管理员的操作指引与故障排查 Runbook。

### 6. G6 站点可靠性工程基线 (SRE & Reliability Baseline)
* **《IaaS/PaaS/应用全栈可观测性与 APM 规约》**：
  * OpenTelemetry 全链路 TraceID/SpanID 跨域穿透拓扑（`apm-tracing-topology.md`）；
  * 结构化业务日志 JSON 与不可变审计脱敏标准（`business-log-standards.md`）。
* **《分布式定时任务与容灾演练台账》**：
  * 定时任务排他锁机制、漏批补偿预案（`batch-job-registry.md`）；
  * 混沌工程与多活容灾切换演练记录、生产无指责故障根因复盘报告（`postmortem-reports/`）。

### 7. G7 持续业务运营基线 (Operations & Continuity Baseline)
* **《核心财务与业务对账平账报告》**：
  * 日终/月终长款短款清算对账凭据、统一指标语义层变更台账（`daily-reconciliation-ledger.md`）。
* **《租户准入与审批流治理台账》**：
  * 租户配额变更审批、BPM 审批流拓扑与 HITL 人工节点调整记录（`bpm-workflow-adjustments.md`）。
* **《AI 数字员工运营调度流水》**：
  * 数字员工自动化任务 Trace 流水与造数清数审计记录（`task-execution-records.jsonl`）。

---

## 三、 可验证结项准则：No Artifact, No Done

1. **无物理产物严禁关闭任务**：
   * 任何工单或阶段任务更新为完成状态时，必须挂载上述 7 类工程资产之一（Git Commit SHA、契约定义文件、测试报告结果、部署 Runbook、SRE 巡检台账、对账平账单）。
   * 严禁任何形式的口头宣称“开发完毕”、“已调通”。
2. **门禁自动化核验**：
   * 提交前必须通过 `npm run check`，10 项工程标准、契约同步、手写文件基线全部保持通过。
