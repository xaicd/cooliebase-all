-- 删除 system_tenant_package_ai_* 三张表。
--
-- 依据（AGENTS §17.3「基座只建原生域，定制业务不得进基座」）:
--   1. 它们是**定制业务**（租户套餐里的 AI 配额/坐席/资费），不属于 CoolieBase 原生能力；
--   2. **概念声明了但从未实现** —— 三张表只在
--      packages/shared/backend/lib/database/schema.ts 有类型声明，
--      全仓没有任何代码查询/写入它们（`node scripts/report-table-inventory.cjs` 可复现）;
--   3. 删除前已实测为**空表**（0 行），所以 DROP 不丢数据。
--
-- 对应地从 schema.ts 移除了三个 Table 接口与注册（接口数 52 -> 49）。
DROP TABLE IF EXISTS "system_tenant_package_ai_quota";
DROP TABLE IF EXISTS "system_tenant_package_ai_seat";
DROP TABLE IF EXISTS "system_tenant_package_ai_tariff";
