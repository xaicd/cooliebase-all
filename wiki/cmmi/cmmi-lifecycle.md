# CMMI 百科：01~09 全生命周期工程规范与 7 类物理交付资产

> 对应标准：CMMI V2.0 / V3.0 (DEV + SVC 模型) / docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md

## 一、 全生命周期九大阶段真实基准资产

1. **01_management (立项与决策)**：
   - 项目立项与范围说明书：`docs/01_management/project-charter.md`
   - 风险登记册与缓解预案：`docs/01_management/risk-register.md`
   - 决策记录目录：`docs/01_management/dar-decision-records/` (保持留空待定制决策)
2. **02_requirements (需求工程)**：
   - 真实特性规格包：`docs/features/ecommerce/brief.json` (商城最小闭环)
   - 全域跨端契约：`packages/domains/*/contract/` (324 份契约)
   - 规范目录 `docs/02_requirements/` 保持留空，不伪造假需求
3. **03_design (系统与架构设计)**：
   - 架构决策记录：`docs/03_design/adr/ADR-0001-MULTI-TENANT-KYSELY-AST.md`、`ADR-0002-FIRST-PARTY-PLUGIN-ISOLATION.md`
   - 交互式架构图谱：`docs/03_design/diagrams/cooliebase-architecture.arch.json` / `.arch.html` (archify 技能)
   - 数据库底座与8大审计字段：`docs/03_design/database-design-erd.md`
4. **04_features / 04_implementation (构造与编码)**：
   - 第一方业务插件隔离：`packages/plugins/plugin-*/` (15 个业务域)
   - 泛型 BaseMapper/QueryWrapper 引擎：`packages/shared/backend/database/`
   - 极简 Brief 声明驱动：`docs/specs/<domain>/<name>/brief.json` 与 1 Task = 1 Commit
5. **05_verification (验证与打假)**：
   - 真实测试执行总结：`docs/05_verification/test-summary-report.md` (14 个测试套件，55 passed / 6 skipped，100% 真实 SQLite WAL)
   - 变异测试目录：`docs/05_verification/mutation/` (保持留空待实际 Stryker 工具集成)
6. **06_quality_assurance (质量与配置审计)**：
   - 功能与物理配置审计：`docs/06_quality_assurance/audit/PCA-FCA-COMPLIANCE-AUDIT-v1.1.0.md` (compliance-auditor 技能)
   - 20 道门禁数字凭证：`docs/06_quality_assurance/gate-evidence-trace.json` (Exit Code 0)
7. **07_release (发布与网关)**：
   - 版本发布说明书：`docs/07_release/RELEASE_NOTES_v1.1.0.md`
   - 生产安装部署 SOP：`docs/07_release/system-deployment-sop.md`
   - 故障秒级回滚预案：`docs/07_release/rollback-runbook.json`
8. **08_sre (站点可靠性与安全)**：
   - 生产容量护栏与 SLO 矩阵：`docs/08_sre/01_slo_sli_metrics/SLO-SLI-ERROR-BUDGET-MATRIX.md` (实测 26,877 RPS，p95 3.8ms)
   - 事故复盘目录：`docs/08_sre/06_incidents_postmortem/` (无故障保持留空)
   - 渗透测试目录：`docs/08_sre/security-reports/` (保持留空待实跑 Strix 容器)
9. **09_operations (持续运营与平账)**：
   - 本底座为开源工程模板，无真实资金交易与商户流水，`docs/09_operations/` 严格保持留空，绝不伪造虚假数据。

## 二、 交付哲学：No Artifact, No Done
严禁口头声明完工，每个工单与版本必须落地 7 类物理工程资产之一，并附带退出码为 0 的可核验凭证。
