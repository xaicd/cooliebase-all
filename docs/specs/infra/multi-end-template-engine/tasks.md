# Tasks Breakdown & WBS: 对标 PagePlug 与商业低代码平台：多端模版源头与响应式区块画布升级

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`multi-end-template-engine`
> 对应项目宪法：`.specify/memory/constitution.md` (Gate 3 任务原子性 / Gate 4 真实入库测试)

---

## 1. 任务依赖波次图 (Task Dependency Waves)

```json
{
  "waves": [
    {
      "id": "wave-1",
      "title": "地基与契约准备",
      "tasks": [
        "T1"
      ],
      "dependsOn": []
    },
    {
      "id": "wave-2",
      "title": "核心服务与数据流落地",
      "tasks": [
        "T2"
      ],
      "dependsOn": [
        "wave-1"
      ]
    },
    {
      "id": "wave-3",
      "title": "E2E 页面拟人操作运营配置（严禁直接 Seed 数据库）",
      "tasks": [
        "T3"
      ],
      "dependsOn": [
        "wave-2"
      ]
    },
    {
      "id": "wave-4",
      "title": "端到端自动化测试与集成验证",
      "tasks": [
        "T4"
      ],
      "dependsOn": [
        "wave-3"
      ]
    }
  ]
}
```

## 2. 交互式任务清单 (Interactive Execution Tasks)

- [ ] **T1**: PageBlockDSL v2 契约、零 eval 表达式沙箱与 UniversalSchemaCanvas 多区块/看板/联动升级
  - 归属: `main`
  - 文件白名单: `packages/plugins/plugin-online/backend/validators/page-schema.validators.ts, packages/plugins/plugin-online/backend/services/page-schema.service.ts, packages/shared/frontend/lib/expression-engine.ts, packages/shared/frontend/components/universal-schema-canvas.tsx`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 多端客户端 app+shared+modules/<domain> 模块化重构、移动端区块渲染器升级与 ProjectReactor 多端联动裁剪
  - 归属: `T1`
  - 文件白名单: `packages/shared/contract/client-channels.json, clients/expo/src/shared/types.ts, clients/expo/src/App.tsx, clients/expo/src/SchemaFieldRenderer.tsx, clients/expo/src/app/AppShell.tsx, clients/expo/src/modules/index.ts, clients/expo/src/modules/member/api/index.ts, clients/expo/src/modules/member/models/index.ts, clients/expo/src/modules/member/pages/MemberCenterPage.tsx, clients/expo/src/modules/member/components/MemberProfileCard.tsx, clients/expo/src/modules/mall/api/index.ts, clients/expo/src/modules/mall/models/index.ts, clients/expo/src/modules/mall/pages/MallHomePage.tsx, clients/expo/src/modules/mall/components/ProductWaterfallCard.tsx, scripts/lib/hatch-profile.cjs, scripts/clone-project-base.cjs`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 对标 PagePlug 升级 Online 双视口 (PC 1440px / 手机小程序 375px) 可视化区块与联动设计器
  - 归属: `T2`
  - 文件白名单: `packages/plugins/plugin-online/frontend/pages/online-definition-designer.page.tsx`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 多端模板源头与表达式画布全链路单元测试及门禁核销
  - 归属: `T3`
  - 文件白名单: `test/unit/multi-end-template-engine.test.ts, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/bugs.md`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: 面向 Coolie工坊与 27B 本地模型的全栈动态变量抽离 (blueprint.template.json + 8大变量域 + 双态占位符解析 + 低代码使用说明)
  - 归属: `T4`
  - 文件白名单: `blueprint.template.json, .env.template, clients/expo/app.template.json, packages/shared/contract/project-profile.template.json, packages/shared/contract/blueprint-vars.ts, packages/shared/contract/project-profile.ts, packages/shared/contract/facade.ts, src/app/page.tsx, src/app/(portal-pages)/portal/components/book-store-portal.tsx, scripts/blueprint-engine.cjs, docs/04_implementation/lowcode-system-dev-manual.md, .agents/skills/project-init/SKILL.md, .agents/skills/new-business-plugin/SKILL.md, .agents/skills/compliance-auditor/SKILL.md, wiki/index.md, wiki/cmmi/cmmi-lifecycle.md, package.json, AGENTS.md, README.md, llms.txt, docs/architecture/artifacts/clause-mechanism-map.json, scripts/harness.cjs, scripts/clone-project-base.cjs, scripts/project-init.cjs, scripts/check-generated-paths.cjs, test/unit/openwiki-stale.test.ts, docs/01_management/project-plan.md, docs/features/sprint-prod/1108.md`
  - 验收要求: 必须携带提交标识 `[T5]` 并附带真实测试验证

- [ ] **T6**: 新业务注入全场景穿透：门户精选卡片行业预设、B端指挥大屏自适应、移动端模块派生与组织租户种子动态化
  - 归属: `T5`
  - 文件白名单: `blueprint.template.json, packages/shared/contract/project-profile.template.json, packages/shared/contract/project-profile.json, packages/shared/contract/blueprint-vars.ts, packages/domains/infra/backend/validators/appearance.validators.ts, packages/plugins/plugin-report/frontend/pages/report-boards.page.tsx, packages/domains/system/frontend/pages/login.page.tsx, packages/plugins/plugin-member/frontend/pages/portal-profile.page.tsx, packages/plugins/plugin-online/frontend/pages/online-definition-create.page.tsx, packages/plugins/plugin-online/frontend/pages/online-definition-designer.page.tsx, packages/plugins/plugin-online/frontend/pages/online-definitions-list.page.tsx, clients/expo/src/modules/mall/models/index.ts, clients/expo/src/modules/mall/pages/MallHomePage.tsx, scripts/blueprint-engine.cjs, scripts/bootstrap-sqlite.cjs, scripts/seed-postgresql.ts, docs/04_implementation/lowcode-system-dev-manual.md, test/unit/multi-end-template-engine.test.ts, next.config.mjs, src/app/layout.tsx, src/app/(portal-pages)/components/portal-shell.tsx, src/app/(portal-pages)/portal/components/book-store-portal.tsx, start.sh, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/deployment.md, docs/specs/infra/multi-end-template-engine/prototype.md, docs/specs/infra/multi-end-template-engine/research.md, docs/specs/infra/multi-end-template-engine/selection.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/specs/infra/multi-end-template-engine/bugs.md, docs/features/sprint-prod/1108.md`
  - 验收要求: 必须携带提交标识 `[T6]` 并附带真实测试验证

- [ ] **T7**: 对标芋道电商解决方案：100%数据库动态驱动的商品SPU/SKU、优惠券/秒杀/满减营销引擎、购物车结算算价、收银台支付与B端订单发货/售后工作台全闭环
  - 归属: `T6`
  - 文件白名单: `packages/plugins/plugin-mall/backend/services/mall-solution.service.ts, packages/plugins/plugin-mall/routes/app/products/route.ts, packages/plugins/plugin-mall/routes/admin/trade-order/route.ts, packages/plugins/plugin-mall/routes/admin/trade-order/[id]/route.ts, packages/plugins/plugin-mall/frontend/api/trade-order.api.ts, packages/plugins/plugin-mall/frontend/pages/trade-order-list.page.tsx, packages/plugins/plugin-mall/plugin.manifest.json, packages/plugins/plugin-mall/plugin-entry.ts, packages/plugins/plugin-pay/routes/app/cashier/route.ts, packages/plugins/plugin-pay/plugin-entry.ts, packages/plugins/plugin-member/routes/app/profile/route.ts, packages/shared/backend/plugins/route-mount.ts, src/app/api/v1/plugins/[pluginKey]/api/[...path]/route.ts, src/app/(portal-pages)/portal/components/book-store-portal.tsx, test/unit/multi-end-template-engine.test.ts, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/deployment.md, docs/specs/infra/multi-end-template-engine/prototype.md, docs/specs/infra/multi-end-template-engine/research.md, docs/specs/infra/multi-end-template-engine/selection.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/specs/infra/multi-end-template-engine/bugs.md`
  - 验收要求: 必须携带提交标识 `[T7]` 并附带真实测试验证

- [ ] **T8**: Speckit 自动化测试与 E2E 页面拟人运营配置体系（严禁 DB Seed，全量通过 B 端页面拟人点击填表完成运营配置与 C 端联动验证）
  - 归属: `T7`
  - 文件白名单: `packages/plugins/plugin-mall/backend/services/mall-solution.service.ts, scripts/speckit.ts, scripts/harness.cjs, scripts/agent/run-e2e-ops.cjs, test/agent/e2e-human-ops.spec.ts, test/unit/multi-end-template-engine.test.ts, .specify/templates/runbook-template.json, .specify/templates/checklist-template.md, .specify/templates/plan-template.md, .agents/workflows/feature-delivery.workflow.json, package.json, docs/01_management/project-plan.md, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/features/sprint-prod/1108.md`
  - 验收要求: 必须携带提交标识 `[T8]` 并附带真实测试验证

- [ ] **T9**: 审计待办全量闭环：数据库设计规范v1四项机检挂载、活跃规格阶段100%对齐、互审欠债闭环率度量、对标芋道Kysely AST数据权限DataScope拦截与OpenAPI 3.1在线沙箱
  - 归属: `T8`
  - 文件白名单: `scripts/speckit.ts, scripts/check-engineering-standards.cjs, scripts/build-evolution-backlog.cjs, packages/domains/infra/backend/services/codegen-templates/column-type.ts, packages/shared/backend/lib/database/data-scope-plugin.ts, packages/shared/backend/lib/database/kysely-client.ts, packages/shared/backend/lib/database/index.ts, src/app/api/docs/route.ts, test/unit/multi-end-template-engine.test.ts, docs/architecture/database-design-standard-v1.md, docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md, docs/architecture/artifacts/evolution-backlog.json, docs/01_management/project-plan.md, docs/02_requirements/non-functional-reqs.md, docs/specs/system/harness-mutual-audit/self-portrait.md, docs/specs/infra/crypto-default-key-guard/brief.json, docs/specs/infra/crypto-default-key-guard/bugs.md, docs/specs/infra/crypto-default-key-guard/tasks.md, docs/specs/infra/crypto-default-key-guard/evidence.json, docs/specs/infra/crypto-default-key-guard/spec.json, docs/specs/infra/crypto-default-key-guard/feature.json, docs/specs/infra/crypto-default-key-guard/plan.md, docs/specs/infra/crypto-default-key-guard/design.md, docs/specs/infra/crypto-default-key-guard/requirements.md, docs/specs/infra/crypto-default-key-guard/spec.md, docs/specs/infra/crypto-default-key-guard/checklist.md, docs/specs/infra/crypto-default-key-guard/deployment.md, docs/specs/infra/crypto-default-key-guard/prototype.md, docs/specs/infra/crypto-default-key-guard/research.md, docs/specs/infra/crypto-default-key-guard/selection.md, docs/specs/infra/crypto-default-key-guard/runbook.json, docs/specs/infra/test-shared-file-isolation/brief.json, docs/specs/infra/test-shared-file-isolation/bugs.md, docs/specs/infra/test-shared-file-isolation/tasks.md, docs/specs/infra/test-shared-file-isolation/evidence.json, docs/specs/infra/test-shared-file-isolation/spec.json, docs/specs/infra/test-shared-file-isolation/feature.json, docs/specs/infra/test-shared-file-isolation/plan.md, docs/specs/infra/test-shared-file-isolation/design.md, docs/specs/infra/test-shared-file-isolation/requirements.md, docs/specs/infra/test-shared-file-isolation/spec.md, docs/specs/infra/test-shared-file-isolation/checklist.md, docs/specs/infra/test-shared-file-isolation/deployment.md, docs/specs/infra/test-shared-file-isolation/prototype.md, docs/specs/infra/test-shared-file-isolation/research.md, docs/specs/infra/test-shared-file-isolation/selection.md, docs/specs/infra/test-shared-file-isolation/runbook.json, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/features/sprint-prod/1109.md`
  - 验收要求: 必须携带提交标识 `[T9]` 并附带真实测试验证

- [ ] **T10**: 通用蓝图底座编译器与Codegen模板引擎升级：面向应届生与27B模型的通用状态机全栈展开、跨单据一键转化原语、表格/看板双视图与KPI指标卡自动生成、同义词防呆自愈诊断器
  - 归属: `T9`
  - 文件白名单: `scripts/blueprint-engine.cjs, packages/domains/infra/backend/services/codegen-templates/common.ts, packages/domains/infra/backend/services/codegen-templates/service.template.ts, packages/domains/infra/backend/services/codegen-templates/route.template.ts, packages/domains/infra/backend/services/codegen-templates/frontend-api.template.ts, packages/domains/infra/backend/services/codegen-templates/frontend-list.template.ts, packages/domains/infra/backend/services/__tests__/codegen-modular.test.ts, test/unit/multi-end-template-engine.test.ts, docs/04_implementation/lowcode-system-dev-manual.md, docs/01_management/project-plan.md, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/features/sprint-prod/1109.md`
  - 验收要求: 必须携带提交标识 `[T10]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`pnpm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | PageBlockDSL v2 契约、零 eval 表达式沙箱与 UniversalSchemaCanvas 多区块/看板/联动升级 | packages/plugins/plugin-online/backend/validators/page-schema.validators.ts, packages/plugins/plugin-online/backend/services/page-schema.service.ts, packages/shared/frontend/lib/expression-engine.ts, packages/shared/frontend/components/universal-schema-canvas.tsx | 未开始 |
| T2 | T1 | 多端客户端 app+shared+modules/<domain> 模块化重构、移动端区块渲染器升级与 ProjectReactor 多端联动裁剪 | packages/shared/contract/client-channels.json, clients/expo/src/shared/types.ts, clients/expo/src/App.tsx, clients/expo/src/SchemaFieldRenderer.tsx, clients/expo/src/app/AppShell.tsx, clients/expo/src/modules/index.ts, clients/expo/src/modules/member/api/index.ts, clients/expo/src/modules/member/models/index.ts, clients/expo/src/modules/member/pages/MemberCenterPage.tsx, clients/expo/src/modules/member/components/MemberProfileCard.tsx, clients/expo/src/modules/mall/api/index.ts, clients/expo/src/modules/mall/models/index.ts, clients/expo/src/modules/mall/pages/MallHomePage.tsx, clients/expo/src/modules/mall/components/ProductWaterfallCard.tsx, scripts/lib/hatch-profile.cjs, scripts/clone-project-base.cjs | 未开始 |
| T3 | T2 | 对标 PagePlug 升级 Online 双视口 (PC 1440px / 手机小程序 375px) 可视化区块与联动设计器 | packages/plugins/plugin-online/frontend/pages/online-definition-designer.page.tsx | 未开始 |
| T4 | T3 | 多端模板源头与表达式画布全链路单元测试及门禁核销 | test/unit/multi-end-template-engine.test.ts, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/bugs.md | 未开始 |
| T5 | T4 | 面向 Coolie工坊与 27B 本地模型的全栈动态变量抽离 (blueprint.template.json + 8大变量域 + 双态占位符解析 + 低代码使用说明) | blueprint.template.json, .env.template, clients/expo/app.template.json, packages/shared/contract/project-profile.template.json, packages/shared/contract/blueprint-vars.ts, packages/shared/contract/project-profile.ts, packages/shared/contract/facade.ts, src/app/page.tsx, src/app/(portal-pages)/portal/components/book-store-portal.tsx, scripts/blueprint-engine.cjs, docs/04_implementation/lowcode-system-dev-manual.md, .agents/skills/project-init/SKILL.md, .agents/skills/new-business-plugin/SKILL.md, .agents/skills/compliance-auditor/SKILL.md, wiki/index.md, wiki/cmmi/cmmi-lifecycle.md, package.json, AGENTS.md, README.md, llms.txt, docs/architecture/artifacts/clause-mechanism-map.json, scripts/harness.cjs, scripts/clone-project-base.cjs, scripts/project-init.cjs, scripts/check-generated-paths.cjs, test/unit/openwiki-stale.test.ts, docs/01_management/project-plan.md, docs/features/sprint-prod/1108.md | 未开始 |
| T6 | T5 | 新业务注入全场景穿透：门户精选卡片行业预设、B端指挥大屏自适应、移动端模块派生与组织租户种子动态化 | blueprint.template.json, packages/shared/contract/project-profile.template.json, packages/shared/contract/project-profile.json, packages/shared/contract/blueprint-vars.ts, packages/domains/infra/backend/validators/appearance.validators.ts, packages/plugins/plugin-report/frontend/pages/report-boards.page.tsx, packages/domains/system/frontend/pages/login.page.tsx, packages/plugins/plugin-member/frontend/pages/portal-profile.page.tsx, packages/plugins/plugin-online/frontend/pages/online-definition-create.page.tsx, packages/plugins/plugin-online/frontend/pages/online-definition-designer.page.tsx, packages/plugins/plugin-online/frontend/pages/online-definitions-list.page.tsx, clients/expo/src/modules/mall/models/index.ts, clients/expo/src/modules/mall/pages/MallHomePage.tsx, scripts/blueprint-engine.cjs, scripts/bootstrap-sqlite.cjs, scripts/seed-postgresql.ts, docs/04_implementation/lowcode-system-dev-manual.md, test/unit/multi-end-template-engine.test.ts, next.config.mjs, src/app/layout.tsx, src/app/(portal-pages)/components/portal-shell.tsx, src/app/(portal-pages)/portal/components/book-store-portal.tsx, start.sh, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/deployment.md, docs/specs/infra/multi-end-template-engine/prototype.md, docs/specs/infra/multi-end-template-engine/research.md, docs/specs/infra/multi-end-template-engine/selection.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/specs/infra/multi-end-template-engine/bugs.md, docs/features/sprint-prod/1108.md | 未开始 |
| T7 | T6 | 对标芋道电商解决方案：100%数据库动态驱动的商品SPU/SKU、优惠券/秒杀/满减营销引擎、购物车结算算价、收银台支付与B端订单发货/售后工作台全闭环 | packages/plugins/plugin-mall/backend/services/mall-solution.service.ts, packages/plugins/plugin-mall/routes/app/products/route.ts, packages/plugins/plugin-mall/routes/admin/trade-order/route.ts, packages/plugins/plugin-mall/routes/admin/trade-order/[id]/route.ts, packages/plugins/plugin-mall/frontend/api/trade-order.api.ts, packages/plugins/plugin-mall/frontend/pages/trade-order-list.page.tsx, packages/plugins/plugin-mall/plugin.manifest.json, packages/plugins/plugin-mall/plugin-entry.ts, packages/plugins/plugin-pay/routes/app/cashier/route.ts, packages/plugins/plugin-pay/plugin-entry.ts, packages/plugins/plugin-member/routes/app/profile/route.ts, packages/shared/backend/plugins/route-mount.ts, src/app/api/v1/plugins/[pluginKey]/api/[...path]/route.ts, src/app/(portal-pages)/portal/components/book-store-portal.tsx, test/unit/multi-end-template-engine.test.ts, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/deployment.md, docs/specs/infra/multi-end-template-engine/prototype.md, docs/specs/infra/multi-end-template-engine/research.md, docs/specs/infra/multi-end-template-engine/selection.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/specs/infra/multi-end-template-engine/bugs.md | 未开始 |
| T8 | T7 | Speckit 自动化测试与 E2E 页面拟人运营配置体系（严禁 DB Seed，全量通过 B 端页面拟人点击填表完成运营配置与 C 端联动验证） | packages/plugins/plugin-mall/backend/services/mall-solution.service.ts, scripts/speckit.ts, scripts/harness.cjs, scripts/agent/run-e2e-ops.cjs, test/agent/e2e-human-ops.spec.ts, test/unit/multi-end-template-engine.test.ts, .specify/templates/runbook-template.json, .specify/templates/checklist-template.md, .specify/templates/plan-template.md, .agents/workflows/feature-delivery.workflow.json, package.json, docs/01_management/project-plan.md, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/features/sprint-prod/1108.md | 未开始 |
| T9 | T8 | 审计待办全量闭环：数据库设计规范v1四项机检挂载、活跃规格阶段100%对齐、互审欠债闭环率度量、对标芋道Kysely AST数据权限DataScope拦截与OpenAPI 3.1在线沙箱 | scripts/speckit.ts, scripts/check-engineering-standards.cjs, scripts/build-evolution-backlog.cjs, packages/domains/infra/backend/services/codegen-templates/column-type.ts, packages/shared/backend/lib/database/data-scope-plugin.ts, packages/shared/backend/lib/database/kysely-client.ts, packages/shared/backend/lib/database/index.ts, src/app/api/docs/route.ts, test/unit/multi-end-template-engine.test.ts, docs/architecture/database-design-standard-v1.md, docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md, docs/architecture/artifacts/evolution-backlog.json, docs/01_management/project-plan.md, docs/02_requirements/non-functional-reqs.md, docs/specs/system/harness-mutual-audit/self-portrait.md, docs/specs/infra/crypto-default-key-guard/brief.json, docs/specs/infra/crypto-default-key-guard/bugs.md, docs/specs/infra/crypto-default-key-guard/tasks.md, docs/specs/infra/crypto-default-key-guard/evidence.json, docs/specs/infra/crypto-default-key-guard/spec.json, docs/specs/infra/crypto-default-key-guard/feature.json, docs/specs/infra/crypto-default-key-guard/plan.md, docs/specs/infra/crypto-default-key-guard/design.md, docs/specs/infra/crypto-default-key-guard/requirements.md, docs/specs/infra/crypto-default-key-guard/spec.md, docs/specs/infra/crypto-default-key-guard/checklist.md, docs/specs/infra/crypto-default-key-guard/deployment.md, docs/specs/infra/crypto-default-key-guard/prototype.md, docs/specs/infra/crypto-default-key-guard/research.md, docs/specs/infra/crypto-default-key-guard/selection.md, docs/specs/infra/crypto-default-key-guard/runbook.json, docs/specs/infra/test-shared-file-isolation/brief.json, docs/specs/infra/test-shared-file-isolation/bugs.md, docs/specs/infra/test-shared-file-isolation/tasks.md, docs/specs/infra/test-shared-file-isolation/evidence.json, docs/specs/infra/test-shared-file-isolation/spec.json, docs/specs/infra/test-shared-file-isolation/feature.json, docs/specs/infra/test-shared-file-isolation/plan.md, docs/specs/infra/test-shared-file-isolation/design.md, docs/specs/infra/test-shared-file-isolation/requirements.md, docs/specs/infra/test-shared-file-isolation/spec.md, docs/specs/infra/test-shared-file-isolation/checklist.md, docs/specs/infra/test-shared-file-isolation/deployment.md, docs/specs/infra/test-shared-file-isolation/prototype.md, docs/specs/infra/test-shared-file-isolation/research.md, docs/specs/infra/test-shared-file-isolation/selection.md, docs/specs/infra/test-shared-file-isolation/runbook.json, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/features/sprint-prod/1109.md | 未开始 |
| T10 | T9 | 通用蓝图底座编译器与Codegen模板引擎升级：面向应届生与27B模型的通用状态机全栈展开、跨单据一键转化原语、表格/看板双视图与KPI指标卡自动生成、同义词防呆自愈诊断器 | scripts/blueprint-engine.cjs, packages/domains/infra/backend/services/codegen-templates/common.ts, packages/domains/infra/backend/services/codegen-templates/service.template.ts, packages/domains/infra/backend/services/codegen-templates/route.template.ts, packages/domains/infra/backend/services/codegen-templates/frontend-api.template.ts, packages/domains/infra/backend/services/codegen-templates/frontend-list.template.ts, packages/domains/infra/backend/services/__tests__/codegen-modular.test.ts, test/unit/multi-end-template-engine.test.ts, docs/04_implementation/lowcode-system-dev-manual.md, docs/01_management/project-plan.md, docs/specs/infra/multi-end-template-engine/brief.json, docs/specs/infra/multi-end-template-engine/tasks.md, docs/specs/infra/multi-end-template-engine/evidence.json, docs/specs/infra/multi-end-template-engine/spec.json, docs/specs/infra/multi-end-template-engine/feature.json, docs/specs/infra/multi-end-template-engine/plan.md, docs/specs/infra/multi-end-template-engine/design.md, docs/specs/infra/multi-end-template-engine/requirements.md, docs/specs/infra/multi-end-template-engine/spec.md, docs/specs/infra/multi-end-template-engine/checklist.md, docs/specs/infra/multi-end-template-engine/runbook.json, docs/features/sprint-prod/1109.md | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
