---
description: CMMI 01~09 全生命周期工程过程资产创建、清单审计与反造假健康扫描 (Spec-Kit CMMI Engine)
---
请执行 CMMI 全生命周期标准资产管理或合规审计：

1. **新建过程资产**：
   `pnpm run speckit:cmmi new --phase <01~09> --type <type> --title "<标题>" [--slug "<标识>"]`
   - 覆盖 9 阶段：`01_management`（charter/risk/dar）、`02_requirements`（rtm/srs）、`03_design`（adr/contract）、`04_implementation`（ppqa/fca/pca）、`05_verification`（testplan/caseregister）、`06_quality_assurance`（mutation/redteam）、`07_release`（runbook/release）、`08_sre`（slo/postmortem）、`09_operations`（reconciliation/sop）。
   - 优先加载 `.specify/templates/cmmi/` 自定义模板。

2. **审计资产台账**：
   `pnpm run speckit:cmmi list`
   - 核查 01~09 目录拓扑与真实工程资产数，坚持零假 Demo 原则。

3. **反造假与健康守卫**：
   `pnpm run speckit:cmmi check`
   - 检查 docs/ 根目录 0 散落文件，0 伪造假业务数据。
