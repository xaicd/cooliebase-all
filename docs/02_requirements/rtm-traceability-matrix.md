# 需求双向跟踪矩阵 (Requirements Traceability Matrix - RTM)

- **归属规范**: CMMI 02_requirements (RDM) / `.agents/skills/spec-driven-development`
- **基线版本**: v1.2.0
- **编写原则**: 表中**每一条引用都必须是真实存在的路径**。此前脚手架模板里出现过
  `tests/specs/tenant-isolation.spec.ts` 这种**不存在的出处**（`tests/` 目录都不存在）——
  编造的出处比留空更糟：它会让追溯看起来成立，实际无法回验。

---

## 1. 如何回验本表

```bash
npm run check                      # 13 道静态门禁（退出码 0 才算通过）
pnpm exec vitest run                     # 全量测试（446 文件，0 failed）
npm run speckit:tasks -- --spec <名>   # 单份规格的真实完成度（从 git 历史推导）
```

## 2. 跨切面需求（治理 / 安全 / 交付链）

| 需求编号 | 需求简述 | 设计 | 实现（真源） | 测试/判据（**已核实存在**） | 状态 |
|---|---|---|---|---|---|
| REQ-G01 | 多租户数据隔离 | `ADR-0001-MULTI-TENANT-KYSELY-AST.md` | `packages/shared/backend/lib/biz-tenant.ts` | `packages/shared/backend/lib/database/__tests__/tenant-isolation-plugin.test.ts`、`test/integration/sqlite-rbac.integration.test.ts` | ✅ |
| REQ-G02 | RBAC 权限与菜单 | `database-design-erd.md` | `packages/shared/backend/constants/permissions.ts` | `test/integration/sqlite-rbac.integration.test.ts`、`packages/domains/system/backend/services/__tests__/tenant.service.test.ts` | ✅ |
| REQ-G03 | 插件挂载与声明一致 | `ADR-0002-FIRST-PARTY-PLUGIN-ISOLATION.md` | `packages/shared/backend/plugins/route-mount.ts` | `test/integration/plugin-lifecycle.integration.test.ts`、各域 `*.plugin.service.test.ts` | ✅ |
| REQ-G04 | 跨域调用只走 Facade / RPC | `ADR-0002` | `packages/shared/backend/lib/`（rpc-actions / messaging） | `packages/shared/backend/lib/__tests__/rpc-actions.test.ts` | ✅ |
| REQ-G05 | 库存等关键状态迁移原子性 | `database-design-erd.md` | `plugin-wms` 库存服务（CAS/条件更新） | `test/integration/inventory-atomic.integration.test.ts` | ✅ |
| REQ-G06 | 依赖漏洞准入（棘轮） | `cooliebase-all-dependency-policy.md` §2 | `scripts/check-deps-audit.cjs` | `npm run deps:audit`（基线冻结既有 9 条） | ✅ |
| REQ-G07 | 物料清单与锁文件一致 | `cooliebase-all-dependency-policy.md` §3.1 | `scripts/generate-sbom.cjs` | `test/unit/sbom-gate.test.ts`（含 3 条反向对照） | ✅ |
| REQ-G08 | 文档事实与真源一致 | 本表 §1 | `scripts/check-llms-sync.cjs` | `test/unit/llms-sync-gate.test.ts`（含 4 条反向对照） | ✅ |
| REQ-G09 | 断言必须具备杀伤力 | `HIGH-ORDER-INVERSE-THINKING.md` | `scripts/mutation-gate.cjs` | `npm run mutation:gate`（3/3 killed + `--self-check`） | ✅ |
| REQ-G10 | 禁止字面恒真断言 | 同上 | `standards:check` 规则 `no-vacuous-test-assertions` | `test/unit/vacuous-assertion-rule.test.ts` | ✅ |
| REQ-G11 | 版本一致性与发布说明 | `RELEASE_NOTES_v1.4.0-brand-shorthand.md` R3/R11 | `scripts/check-version-consistency.cjs` | `test/unit/version-consistency.test.ts`（含 2 条反向对照） | ✅ |
| REQ-G12 | 规格驱动交付闭环 | `.agents/skills/spec-driven-development` | `scripts/speckit.ts` | `test/unit/spec-driven-agent-workflow.test.ts` | ✅ |
| REQ-G13 | 客户端可构建 | `cooliebase-all-client-channels.md` | `scripts/check-client-build.cjs` | `npm run clients:build:check`（Expo web 导出） | ✅ |

## 3. 域级需求（17 原生域 → 实现 → 测试）

| 域 | 形态 | 测试文件数（实测） | 代表性测试（真实存在） |
|---|---|---|---|
| `system` | 平台地基 `packages/domains/system` | 8 | `backend/services/__tests__/tenant.service.test.ts` |
| `infra` | 平台地基 `packages/domains/infra` | 7 | `backend/services/__tests__/codegen-engine.rpc.test.ts` |
| `shared` | 核心 SDK（非域） | 36 | `packages/shared/backend/lib/__tests__/rpc-actions.test.ts` |
| `ai` | 插件 | 15 | `plugin-ai/backend/services/__tests__/ai-api-key.service.test.ts` |
| `aigw` | 插件 | 2 | `plugin-aigw/backend/services/__tests__/aigw-usage.service.test.ts` |
| `bpm` | 插件 | 9 | `plugin-bpm/backend/services/__tests__/bpm-process-definition-info.service.test.ts` |
| `crm` | 插件 | 22 | `plugin-crm/backend/services/__tests__/crm-customer.service.test.ts` |
| `erp` | 插件 | 35 | `plugin-erp/backend/services/__tests__/erp-purchase-order.service.test.ts` |
| `im` | 插件 | 18 | `plugin-im/backend/services/__tests__/im-private-message.service.test.ts` |
| `iot` | 插件 | 16 | `plugin-iot/backend/services/__tests__/iot-scene-rule.service.test.ts` |
| `mall` | 插件 | 50 | `plugin-mall/backend/services/__tests__/coupon-template.service.test.ts` |
| `member` | 插件 | 12 | `plugin-member/backend/services/__tests__/member-auth.service.test.ts` |
| `mes` | 插件 | 135 | `plugin-mes/backend/services/__tests__/mes-qc-template-item.service.test.ts` |
| `mp` | 插件 | 9 | `plugin-mp/backend/services/__tests__/mp-tag.service.test.ts` |
| `online` | 插件 | 1 | `plugin-online/backend/services/__tests__/page-schema.service.test.ts` |
| `pay` | 插件 | 16 | `plugin-pay/backend/services/__tests__/pay-order.service.test.ts` |
| `report` | 插件 | 3 | `plugin-report/backend/services/__tests__/go-view-project.service.test.ts` |
| `wms` | 插件 | 19 | `plugin-wms/backend/services/__tests__/wms-item-sku.service.test.ts` |

合计测试文件 **446**（15 个插件域合计 362；其余在 `shared` / `system` / `infra` / `test/`）。

## 4. 活跃规格（8 份，`docs/specs/<域>/<名>/`）

| 域 | 规格 | 完成度判据 |
|---|---|---|
| infra | `mcp-write-tools` | `npm run speckit:tasks -- --spec mcp-write-tools` → 5/5 |
| infra | `deps-vuln-remediation` | 7/7 |
| infra | `deps-audit-tier-determinism` | 3/3 |
| infra | `client-build-gate` | 3/3 |
| infra | `stale-test-repair` | 3/3 |
| infra | `expo-sdk-upgrade` | 6/6 |
| infra | `archify-strix-integration` | 见其 `tasks.md` |
| system | `cmmi-governance` | 见其 `tasks.md` |

投产后按 `npm run speckit:archive -- --name <名>` 归档至 `docs/specs/archive/<YYYY-Qx>/`。

## 5. 已知缺口（诚实登记，不要当成已完成）

1. **`online` 域仅 1 个测试文件** —— 作为低代码核心域，测试厚度与其重要性不匹配。
2. **`aigw`（2）与 `report`（3）** 同样偏薄。
3. **L3 契约层无独立 npm 入口** —— 契约测试存在但随全量套件跑（见项目计划 E1）。
4. **REQ-G06 的运行时漏洞为"冻结"而非"清零"** —— 9 条已接受风险仍在，
   台账见依赖策略文档；"冻结"≠"无漏洞"。
5. **`02_requirements` 的 SRS / URS 尚未落地** —— 本表与 NFR 已落，SRS/URS 仍是待填。
6. **跨切面需求的"反向对照"密度不均** —— G07/G08/G11 有反向对照测试，
   G06/G09 靠门禁自证（`--self-check`），其余依赖常规断言。
