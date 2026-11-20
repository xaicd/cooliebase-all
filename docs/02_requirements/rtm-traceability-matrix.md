# 需求双向跟踪矩阵 (Requirements Traceability Matrix - RTM)

- **归属规范**: CMMI 02_requirements (RDM) / `.agents/skills/spec-driven-development`
- **基线版本**: `v1.5.0`（2026-11-16）
- **编写原则**: 表中**每一条引用都必须是真实存在的路径**。严禁编造不存在的测试路径或悬空目录。

---

## 1. 如何回验本表

```bash
pnpm run check                      # 全量静态与契约治理门禁（退出码 0 才算通过）
pnpm run test:clean                 # 清洁环境全量测试（511 文件，0 failed）
pnpm run speckit:tasks -- --spec <名>   # 单份规格的真实完成度（从 git 历史推导）
```

## 2. 跨切面需求（治理 / 安全 / 交付链）

| 需求编号 | 需求简述 | 设计 | 实现（真源） | 测试/判据（**已核实存在**） | 状态 |
|---|---|---|---|---|---|
| REQ-G01 | 多租户数据隔离 | `ADR-0001-MULTI-TENANT-KYSELY-AST.md` | `packages/shared/backend/lib/biz-tenant.ts` | `packages/shared/backend/lib/database/__tests__/tenant-isolation-plugin.test.ts`、`test/integration/sqlite-rbac.integration.test.ts` | ✅ |
| REQ-G02 | RBAC 权限与菜单 | `database-design-erd.md` | `packages/shared/backend/constants/permissions.ts` | `test/integration/sqlite-rbac.integration.test.ts`、`packages/domains/system/backend/services/__tests__/tenant.service.test.ts` | ✅ |
| REQ-G03 | 插件挂载与声明一致 | `ADR-0002-FIRST-PARTY-PLUGIN-ISOLATION.md` | `packages/shared/backend/plugins/route-mount.ts` | `test/integration/plugin-lifecycle.integration.test.ts`、各域 `*.plugin.service.test.ts` | ✅ |
| REQ-G04 | 跨域调用只走 Facade / RPC | `ADR-0002` | `packages/shared/backend/lib/`（rpc-actions / messaging） | `packages/shared/backend/lib/__tests__/rpc-actions.test.ts` | ✅ |
| REQ-G05 | 库存等关键状态迁移原子性 | `database-design-erd.md` | `plugin-wms` 库存服务（CAS/条件更新） | `test/integration/inventory-atomic.integration.test.ts` | ✅ |
| REQ-G06 | 依赖漏洞准入（棘轮） | `cooliebase-all-dependency-policy.md` §2 | `scripts/check-deps-audit.cjs` | `pnpm run deps:audit` + `test/unit/deps-audit-gate.test.ts`（基线冻结既有 11 条，新增 0） | ✅ |
| REQ-G07 | 物料清单与锁文件一致 | `cooliebase-all-dependency-policy.md` §3.1 | `scripts/generate-sbom.cjs` | `test/unit/sbom-gate.test.ts`（含 3 条反向对照） | ✅ |
| REQ-G08 | 文档事实与真源一致 | 本表 §1 | `scripts/check-llms-sync.cjs` & `scripts/check-doc-claims.cjs` | `test/unit/llms-sync-gate.test.ts`、`test/unit/doc-claims-agent-contracts.test.ts` | ✅ |
| REQ-G09 | 断言必须具备杀伤力 | `HIGH-ORDER-INVERSE-THINKING.md` | `scripts/mutation-gate.cjs` | `pnpm run mutation:gate`（3/3 killed + `--self-check`） | ✅ |
| REQ-G10 | 禁止字面恒真断言 | 同上 | `standards:check` 规则 `no-vacuous-test-assertions` | `test/unit/vacuous-assertion-rule.test.ts` | ✅ |
| REQ-G11 | 版本一致性与发布说明 | `docs/07_release/release-notes.md` | `scripts/check-version-consistency.cjs` | `test/unit/version-consistency.test.ts`（含 3 条反向对照） | ✅ |
| REQ-G12 | 规格驱动交付与 `docs/` 单目录收敛 | `.agents/skills/spec-driven-development` | `scripts/speckit.ts` & `scripts/check-specs-health.cjs` | `test/unit/spec-driven-agent-workflow.test.ts`、`pnpm run specs:health` | ✅ |
| REQ-G13 | 四位一体客户端可构建 | `cooliebase-all-client-channels.md` | `scripts/check-client-build.cjs` | `pnpm run clients:build:check`（Expo Web 导出 + MiniApp H5 构建） | ✅ |

## 3. 域级需求（20 原生域 → 实现 → 测试）

| 域 | 形态 | 代表性测试（真实存在） |
|---|---|---|
| `system` | 平台地基 `packages/domains/system` | `packages/domains/system/backend/services/__tests__/tenant.service.test.ts` |
| `infra` | 平台地基 `packages/domains/infra` | `packages/domains/infra/backend/services/__tests__/codegen-engine.rpc.test.ts` |
| `shared` | 核心 SDK（非域） | `packages/shared/backend/lib/__tests__/rpc-actions.test.ts` |
| `ai` | 第一方插件 `packages/plugins/plugin-ai` | `packages/plugins/plugin-ai/backend/services/__tests__/ai-api-key.service.test.ts` |
| `bpm` | 第一方插件 `packages/plugins/plugin-bpm` | `packages/plugins/plugin-bpm/backend/services/__tests__/bpm-process-definition-info.service.test.ts` |
| `crm` | 第一方插件 `packages/plugins/plugin-crm` | `packages/plugins/plugin-crm/backend/services/__tests__/crm-customer.service.test.ts` |
| `erp` | 第一方插件 `packages/plugins/plugin-erp` | `packages/plugins/plugin-erp/backend/services/__tests__/erp-purchase-order.service.test.ts` |
| `fms` | 第一方插件 `packages/plugins/plugin-fms` | `packages/plugins/plugin-fms/backend/services/__tests__/fms-account.service.test.ts` |
| `hrm` | 第一方插件 `packages/plugins/plugin-hrm` | `packages/plugins/plugin-hrm/backend/services/__tests__/hrm-employee.service.test.ts` |
| `im` | 第一方插件 `packages/plugins/plugin-im` | `packages/plugins/plugin-im/backend/services/__tests__/im-private-message.service.test.ts` |
| `iot` | 第一方插件 `packages/plugins/plugin-iot` | `packages/plugins/plugin-iot/backend/services/__tests__/iot-scene-rule.service.test.ts` |
| `mall` | 第一方插件 `packages/plugins/plugin-mall` | `packages/plugins/plugin-mall/backend/services/__tests__/coupon-template.service.test.ts` |
| `member` | 第一方插件 `packages/plugins/plugin-member` | `packages/plugins/plugin-member/backend/services/__tests__/member-auth.service.test.ts` |
| `mes` | 第一方插件 `packages/plugins/plugin-mes` | `packages/plugins/plugin-mes/backend/services/__tests__/mes-qc-template-item.service.test.ts` |
| `mp` | 第一方插件 `packages/plugins/plugin-mp` | `packages/plugins/plugin-mp/backend/services/__tests__/mp-tag.service.test.ts` |
| `oa` | 第一方插件 `packages/plugins/plugin-oa` | `packages/plugins/plugin-oa/backend/services/__tests__/oa-notice.service.test.ts` |
| `online` | 第一方插件 `packages/plugins/plugin-online` | `packages/plugins/plugin-online/backend/services/__tests__/page-schema.service.test.ts` |
| `pay` | 第一方插件 `packages/plugins/plugin-pay` | `packages/plugins/plugin-pay/backend/services/__tests__/pay-order.service.test.ts` |
| `pms` | 第一方插件 `packages/plugins/plugin-pms` | `packages/plugins/plugin-pms/backend/services/__tests__/pms-project.service.test.ts` |
| `report` | 第一方插件 `packages/plugins/plugin-report` | `packages/plugins/plugin-report/backend/services/__tests__/go-view-project.service.test.ts` |
| `wms` | 第一方插件 `packages/plugins/plugin-wms` | `packages/plugins/plugin-wms/backend/services/__tests__/wms-item-sku.service.test.ts` |

全量测试文件合计请看生成物 [`docs/05_verification/test-summary-report.md`](../05_verification/test-summary-report.md)（由 `pnpm run test:summary` 自动生成，本表不重复硬编码文件计数）。

## 4. 活跃规格（数量以真源为准，`docs/specs/<域>/<名>/`）

> 复算：`ls docs/specs/*/*/brief.json 2>/dev/null | wc -l`

活跃规格以复算命令实测为准（当前含 `docs/specs/infra/stop-go-stubs/`、`docs/specs/infra/hatch-selfasset-slim/`，不在此写死数字）。新需求经 `pnpm run agent:route` 判定需立项后，通过 `pnpm run speckit:new` 创建并在投产后按 `pnpm run speckit:archive -- --name <名>` 归档。

## 5. 已知边界与诚实登记

1. **`online` 域侧重动态运行时 Schema 引擎** —— 实体由运行时动态定义，静态单测较少，建议随低代码特性迭代继续加厚。
2. **REQ-G06 的既有供应链通告为"冻结"而非"清零"** —— 11 条历史依赖通告在 `docs/architecture/artifacts/deps-audit-baseline.json` 棘轮守护中（新增 0）。
3. **`02_requirements` 的单体 SRS / URS 为「刻意不产出」（架构决策，非遗漏）** —— 需求真源是分散的 `docs/specs/<域>/<名>/brief.json`，避免第二真源漂移（见 `docs/01_management/project-plan.md` H1）。
