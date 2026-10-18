# 项目立项与范围说明书 (Project Charter)

- **项目全称**: CoolieBase-All-Next 企业级应用基座与演进底座
- **版本代号**: v1.1.0 Enterprise Baseline
- **生效日期**: 2026-10-09
- **归属规范**: CMMI 01_management (PLAN / MC)

---

## 1. 项目背景与战略目标

传统企业级后台框架在面对现代高并发、云原生容器化、多端协同以及 AI Agent 自主研发时，存在架构过于笨重、依赖重型中间件、代码样板冗余、测试缺乏真实数据库支撑等痛点。

本项目旨在打造面向未来的下一代全栈企业基座：
1. **模块化单体与第一方插件架构**：实现 15 个业务领域（Mall, CRM, ERP, WMS, MES, BPM, Pay 等）物理与逻辑解耦，随时按需以微服务形态独立拆分；
2. **Schema/DSL 极简驱动与 0 样板代码**：大模型输出压缩至 <500 Tokens，由泛型 `BaseMapper<T>` 与通用引擎动态展开；
3. **SpaceX 级真实数据库全链路测试**：杜绝伪造假 Mock，100% 由嵌入式 SQLite WAL 与真实数据库事务支撑；
4. **CMMI 过程资产全生命周期可追溯**：01_management 至 09_operations 全流程 Docs-as-Code，践行 "No Artifact, No Done"。

---

## 2. 项目范围与边界约定 (Scope & Boundaries)

### 2.1 包含范围 (In-Scope)
- **平台地基 (2 个)**：`system` (用户/角色/租户/部门/权限), `infra` (字典/配置/代码生成/审计日志)；
- **第一方业务插件 (15 个)**：`bpm`, `pay`, `report`, `mp`, `mall`, `member`, `crm`, `erp`, `wms`, `mes`, `ai`, `iot`, `im` 等；
- **核心公共 SDK (`@cooliebase/shared`)**：多租户 AST 过滤器、8 大底座审计字段、BaseMapper/QueryWrapper、统一 Domain Facade、自研 NATS 消息语义总线；
- **全端协同**：Expo 移动跨端客户端 (`clients/expo`)；
- **20 道自动化质量门禁**：覆盖分层架构、契约同步、RPC 验证、本体全息、代码防手写重复等；
- **全生命周期 CMMI 过程资产**：01 立项、02 需求 (EARS)、03 架构 (MADR/Archify)、05 变异测试打假、06 质量配置审计、07 发布回滚 SOP、08 SRE 稳定性 (SLO/Blameless Postmortem/Strix 渗透)、09 持续运营 (复式记账全链路对账)。

### 2.2 不包含范围 (Out-of-Scope)
- 严禁引入带传染性商业限制许可的开源库（GPL/AGPL）；
- 严禁在基座仓库内直接硬编码特定客户的非标定制私有代码（必须在衍生工程中以独立业务插件或扩展包交付）。

---

## 3. 核心干系人与角色职责 (RACI Matrix)

| 角色 | 负责人 | 核心职责 |
|---|---|---|
| **技术委员会 / 架构师** | @architect-team | 审核 ADR、架构治理门禁、跨域契约与技术路线决策 (DAR) |
| **领域开发工程师** | @domain-leads | 负责各插件业务逻辑实现、EARS 需求转化、1 Task = 1 Commit |
| **质量与合规保证 (PPQA)** | @qa-compliance | 负责 20 道门禁审计、FCA/PCA 配置审计、变异测试有效性核验 |
| **SRE 与稳定性运维** | @sre-team | 负责 SLO 错误预算治理、发布回滚 SOP 演练、Strix 红队攻防渗透演练 |
| **财务与业务持续运营** | @ops-team | 负责每日日终全链路对账、长短款差错冲正、租户结算凭证归档 |
