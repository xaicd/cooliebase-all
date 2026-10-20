# cooliebase-all Skill 注册表

权威入口。Agent 接到跨阶段需求时先读本文件，再只加载相关阶段 Skill。  
Skill 编写规范见 [skill-authoring/SKILL.md](./skill-authoring/SKILL.md)。

冲突时：**本仓库 Skill + AGENTS.md + 本仓库文档 > 外部 GitHub Skill**。

真源：`.agents/skills/<name>/SKILL.md`（`agent-profile.json` 的 `npc.skillsDir`）。
**本目录为全仓唯一真源，严禁在 `docs/` 或其他位置建立重复、镜像或副本目录！**

---

## 1. 交付管道与 CMMI 01~09 全生命周期

按阶段推进，不允许跳过门禁宣称完成。

| CMMI 阶段 | 交付阶段 | 核心 Skill | 产物 | 未过门禁不得进入 |
|---|---|---|---|---|
| **00** | 规范与元编程 | skill-authoring、skill-creator | 合法 SKILL.md、技能测评 | 乱写 Skill |
| **01_management** | 决策分析与项目管理 | dar-decision-matrix、agent-harness、project-init | DAR 权衡矩阵、Brief 项目立项 | 拍脑袋盲目选型 |
| **02_requirements** | 需求工程与规格 | ears-spec-writer、product-requirements、spec-driven-development | EARS 5态需求、Kiro 多类型规格包、验收标准 | 口语化伪需求直接编码 |
| **03_design** | 架构设计与决策记录 | architecture-design、adr-architect、microservice-evolution、archify | MADR 架构决策记录、拓扑图、交互式架构全景 HTML、A/B/C演进图 | 跨域直接 import Service |
| **03_design** | API 契约设计 | api-design | OpenAPI 3.1、RPC action 契约 | 先手写 Route |
| **03_design** | 数据库与多租户 | database-design、database-compatibility | Prisma Schema、Kysely AST、Tier-A/B/C声明 | 手写无租户 Raw SQL |
| **03_design** | UI 与多端设计 | ui-design、ui-framework-governance、frontend-design、canvas-design、theme-factory、brand-guidelines | 响应式后台原型、页面模板、设计 Token | 杂乱拼凑 UI |
| **04_implementation** | 编码实现与插件化 | coding、new-feature、new-business-plugin、plugin-authoring、mcp-builder | 第一方业务插件、BaseMapper CRUD、RPC 路由 | 跳过 Validator 直调 |
| **05_verification** | 变异测试与反假Mock | automated-testing、mutation-tester、webapp-testing | 变异杀灭报告(MSI>=85%)、真实数据库测试矩阵 | 假 Mock、空断言绿牌 |
| **06_quality_assurance** | 质量门禁与配置审计 | compliance-auditor | 全量门禁 0 债务通过、FCA/PCA 审计单、RTM | 门禁未跑通声明完工 |
| **07_release** | 容器交付与网关发布 | devops | Traefik 网关配置、Docker 镜像、自动回滚预案 | 手改生产容器与配置 |
| **08_sre** | 可靠性与事故复盘 | sre-slo-manager、postmortem-analyzer、service-governance、security、strix-penetration-testing | SLI/SLO矩阵、多燃烧率告警、免责5-Whys复盘、自主红队 PoC 渗透报告 | 盲目裸跑发版、事故甩锅 |
| **09_operations** | 持续运营与对账平账 | financial-reconciliation-agent | 三方对账单、长短款平账凭据、轧差流水 | 账实不符/违规提现抹账 |
| **01~09** | CMMI 标准资产创建与治理 | cmmi-asset-authoring | 标准 01~09 过程资产、合规防造假扫描 | 散落孤儿文档、造假 Demo |

---

## 2. 启用矩阵

| 用户在做 | 必开 |
|---|---|
| 新增/修改/评审 Skill | skill-authoring、skill-creator |
| 架构方案选型、竞品横评、技术路线决策打分 | dar-decision-matrix |
| 编写需求规格、消除需求二义性、定义业务不变量 | ears-spec-writer、product-requirements |
| Kiro 规范驱动开发 (SDD)、多类型规格创建 (feature/bugfix/enhancement/refactor/security)、任务波次编排 | spec-driven-development、ears-spec-writer |
| 新业务项目孵化、DigitalStaff NPC 模板、DeepSeek Harness 进化 | agent-harness、project-init、product-requirements |
| 新功能一站式交付（RBAC + 全动词 API + 页面 + 权限 + 测试） | new-feature |
| 新业务域/新平台（起底座 -> 建表 -> codegen -> 注册插件 -> 编译/打包/预览） | new-business-plugin |
| 架构设计、ADR 决策记录撰写、破坏性变更评估 | adr-architect、architecture-design |
| 绘制交互式架构图、时序图、BPM流程图、状态机图、全景可视化 | archify、architecture-design |
| 模块化单体向插件/微服务演进（A/B/C 阶段） | microservice-evolution、architecture-design |
| 新 HTTP/RPC 接口设计、改 DTO 契约 | api-design |
| 表结构、迁移、多租户隔离、多数据库兼容 | database-design、database-compatibility |
| 管理端/C 端页面、信息架构与视觉交互 | ui-design、ui-framework-governance、frontend-design |
| 品牌规范、视觉设计稿、主题生成 | brand-guidelines、canvas-design、theme-factory |
| 写业务代码、分层落地、事务状态机 | coding |
| 第一方插件开发、manifest 契约、worker stdio 协议 | plugin-authoring |
| MCP 服务器与协议工具开发 | mcp-builder |
| 编写测试用例、CI 测试、端到端测试 | automated-testing、webapp-testing |
| 验证测试充分性、杀灭假 Mock、变异测试打假 | mutation-tester |
| 质量门禁体检、CMMI 合规审计、FCA/PCA 配置审计 | compliance-auditor |
| 身份鉴权、SQL 防注入、脱敏、限流防刷、安全防护 | security |
| 自主红队渗透测试、真实漏洞 PoC 验证、安全补丁修复 | strix-penetration-testing、security |
| 服务熔断、超时重试、舱壁隔离、链路追踪 | service-governance |
| SRE 稳定性设计、SLO/SLI 目标制定、错误预算、压测护栏 | sre-slo-manager、devops |
| 线上故障免责复盘、5-Whys 根因分析、CAPA 改进措施 | postmortem-analyzer |
| 容器编排、Traefik 边缘网关、SSL 证书自动签发轮换、发版实施 | devops |
| 财务业务对账、资金轧差平账、长短款差错处置、日终结算 | financial-reconciliation-agent |
| CMMI 01~09 全生命周期标准资产创建、过程资产脚手架、健康合规防造假扫描 | cmmi-asset-authoring |

---

## 3. 分层

1. **通用层（可选参考）**：格式 [agentskills.io](https://agentskills.io)；目录 [skills.sh](https://skills.sh)。UI：[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)、[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)。API/架构用社区 REST 与 ADR Skill，细节以本仓库为准。
2. **项目层（强制）**：本目录 + `AGENTS.md` + `docs/guides` + `docs/architecture`。
3. **证据层**：扫描产物、测试、`pnpm run check`。未落地不得标 DONE。

---

## 4. 已有治理与原生 Skill（保持）

| 文件 | 场景 |
|---|---|
| spec-driven-development/SKILL.md | CMMI 02 Kiro 规范驱动开发 (SDD) 与全类型规格创建 (feature/bugfix/enhancement/refactor/security) |
| cmmi-asset-authoring/SKILL.md | CMMI 01~09 标准资产创作与生命周期脚手架治理 |
| dar-decision-matrix/SKILL.md | CMMI 01 决策分析与加权权衡打分 |
| ears-spec-writer/SKILL.md | CMMI 02 IEEE 29148 / EARS 5 态无歧义需求规格 |
| adr-architect/SKILL.md | CMMI 03 MADR 架构决策记录与生命周期追踪 |
| archify/SKILL.md | CMMI 03 可交互、可验证架构图生成 (tt-a1i/archify 47k★) |
| database-compatibility/SKILL.md | 数据库兼容等级 (Tier-A/B/C) 与降级 |
| ui-framework-governance/SKILL.md | 管理端模板结构与四区交互治理 |
| microservice-evolution/SKILL.md | A/B/C 拆分演进判定 |
| plugin-authoring/SKILL.md | 可安装插件：包结构 / manifest / capability / worker 协议 |
| agent-harness/SKILL.md | NPC 工作区模板与 Harness 思想进化 |
| project-init/SKILL.md | 业务项目初始化与原地重构 |
| mutation-tester/SKILL.md | CMMI 05 变异测试反假 Mock (Stryker/PIT/SpaceX) |
| compliance-auditor/SKILL.md | CMMI 06 过程质量审计、FCA/PCA 配置审计 |
| sre-slo-manager/SKILL.md | CMMI 08 Google SRE SLI/SLO 与多窗口燃烧率告警 |
| postmortem-analyzer/SKILL.md | CMMI 08 免责 5-Whys 故障复盘与 CAPA 闭环 |
| strix-penetration-testing/SKILL.md | CMMI 08 多智能体自主红队渗透与 PoC 验证 (usestrix/strix 60k★) |
| financial-reconciliation-agent/SKILL.md | CMMI 09 持续运营财务业务三方对账与轧差平账 |

---

## 5. 客户端

H5 / uni-app / Flutter / desktop-pc 走同一管道。渠道契约：`packages/shared/contract/client-channels.json`。  
目录：`clients/<channel>/{app,shared,modules/<domain>}`。禁止为客户端另开 API 前缀。

---

## 6. 引入的上游 Skill（Anthropic 官方，Apache-2.0）

来源 `github.com/anthropics/skills`。**从属于本仓库规范**：本 README 开头那句
「本仓库 Skill + AGENTS.md + 本仓库文档 > 外部 GitHub Skill」对它们同样适用 —— 冲突时以本仓为准。

| Skill | 用途 |
|---|---|
| mcp-builder | 编写 MCP 服务器（本仓有 MCP 工具面） |
| skill-creator | 编写技能本身 |
| webapp-testing | 浏览器/E2E 测试 |
| frontend-design | 前端设计与实现 |
| canvas-design | 视觉稿与画布设计 |
| theme-factory | 主题生成 |
| brand-guidelines | 品牌规范 |

**未引入**（不是开源，或未声明许可）：`docx` / `pdf` / `pptx` / `xlsx`（Proprietary，
© Anthropic PBC, All rights reserved）、`doc-coauthoring`（无 LICENSE.txt）。
判据与记录见 [./UPSTREAM-NOTICE.md](./UPSTREAM-NOTICE.md) —— 逐个读 LICENSE.txt 得出，
不靠仓库首页「Many skills are Apache 2.0」那句话推断。

---

## 7. 压测与渗透

执行层的现状与技能联动:
* **渗透扫描** —— `pnpm run security:scan`（20 项自动化基础安全基线扫描，接进 CI + G5；本机零容器可跑），高阶自主红队渗透演练遵循 `strix-penetration-testing/SKILL.md`（60k★ usestrix/strix 多智能体验证 PoC 确证与自动修补）。
* **压测护栏** —— `pnpm run load:test` 容量回归护栏，与 `sre-slo-manager/SKILL.md` 联动对齐。
