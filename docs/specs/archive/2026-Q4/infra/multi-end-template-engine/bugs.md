# Defect & Verification Ledger: 对标 PagePlug 与商业低代码平台：多端模版源头与响应式区块画布升级

> **Spec-Kit 缺陷台账与复现验证清单**
> 对应项目宪法：`.specify/memory/constitution.md` (Gate 4 真实入库测试与缺陷闭环)

---

## 缺陷清单台账 (Defect Tracking)
| ID | 严重级 | 现象描述 | 复现验证命令 | 修复状态 |
|---|---|---|---|---|
| B1 | P1 | `compile-domain` 默认生成区块 `surface: "both"` 与 `PageBlockSchema` 枚举 `all/pc/mobile` 不一致 | `pnpm exec vitest run test/unit/multi-end-template-engine.test.ts` | 已修 |
| B2 | P1 | `minimal` 形态裁剪 `clients/` 后，`blueprint-engine.cjs` 需按 `clients/expo/package.json` 存在性跳过客户端模板校验 | `pnpm exec vitest run test/unit/multi-end-template-engine.test.ts` | 已修 |
| B3 | P1 | 退役 `sync-openwiki.cjs` 后，`check-generated-paths.cjs` 需读取 `packages/shared/backend/constants/domain-catalog.json` 执行陈旧词条清理 | `pnpm exec vitest run test/unit/openwiki-stale.test.ts` | 已修 |
