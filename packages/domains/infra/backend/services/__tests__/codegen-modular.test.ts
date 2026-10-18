import { describe, expect, it } from "vitest"
import { CodegenEngineService } from "../codegen-engine.service"
import type { CodegenConfig } from "../codegen-templates"

const testConfig: CodegenConfig = {
  moduleName: "wms",
  className: "WmsWarehouse",
  businessName: "智能仓库",
  parentMenuId: "wms-dir",
  permissionPrefix: "wms:warehouse",
  table: {
    name: "wms_warehouse",
    comment: "智能仓库实体表",
    columns: [
      { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "主键ID", isPk: true },
      { name: "code", type: "varchar", tsType: "string", nullable: false, comment: "仓库编码", formValidation: "required", queryType: "LIKE" },
      { name: "name", type: "varchar", tsType: "string", nullable: false, comment: "仓库名称", formValidation: "required", queryType: "LIKE" },
      { name: "capacity", type: "int", tsType: "number", nullable: true, comment: "库容量(m³)" },
      { name: "active", type: "boolean", tsType: "boolean", nullable: false, comment: "启用状态" },
      { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
      { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
    ],
  },
}

describe("Modular Codegen Engine with Templates", () => {
  it("generates full-stack modules-first outputs including multi-channel clients and RBAC SQL", () => {
    const outputs = CodegenEngineService.generateCodes(testConfig)
    expect(outputs.length).toBeGreaterThanOrEqual(14)

    // 1. Types
    const types = outputs.find((o) => o.path.endsWith("types/wms-warehouse.types.ts"))
    expect(types).toBeDefined()
    expect(types?.content).toContain("export interface WmsWarehouseDO")
    expect(types?.content).toContain("export interface WmsWarehouseVO")
    expect(types?.content).toContain("code: string")

    // 2. Validator
    const validator = outputs.find((o) => o.path.endsWith("validators/wms-warehouse.validator.ts"))
    expect(validator).toBeDefined()
    expect(validator?.content).toContain("wmsWarehouseCreateSchema")
    expect(validator?.content).toContain("wmsWarehousePageQuerySchema")

    // 3. Repository with global tenant context
    const repo = outputs.find((o) => o.path.endsWith("repositories/wms-warehouse.repository.ts"))
    expect(repo).toBeDefined()
    expect(repo?.content).toContain("getCurrentTenantId")
    expect(repo?.content).toContain("resolveScope")
    expect(repo?.content).toContain("export const wmsWarehouseRepository = WmsWarehouseRepository")

    // 4. Service
    const service = outputs.find((o) => o.path.endsWith("services/wms-warehouse.service.ts"))
    expect(service).toBeDefined()
    expect(service?.content).toContain("class WmsWarehouseService")

    // 5. Dual-mode RPC

    // 6. Contract Actions
    const actions = outputs.find((o) => o.path.endsWith("contract/wms-warehouse.actions.ts"))
    expect(actions?.content).toContain("cooliebase.cmd.wms.wmsWarehouse.page")
    expect(actions).toBeDefined()
    expect(actions?.content).toContain("wmsWarehouseActionSchemas")

    // 7. API Routes (Full Verbs)
    const route = outputs.find((o) => o.path.endsWith("api/v1/admin/wms/wms-warehouse/route.ts"))
    expect(route).toBeDefined()
    expect(route?.content).toContain("export const GET = withAdminRoute")
    expect(route?.content).toContain("export const POST = withAdminRoute")
    expect(route?.content).toContain("export const PUT = withAdminRoute")
    expect(route?.content).toContain("export const DELETE = withAdminRoute")

    // 8. RBAC & Menu Incremental SQL
    const rbacSql = outputs.find((o) => o.path.endsWith("contract/wms-warehouse.rbac.sql"))
    expect(rbacSql).toBeDefined()
    expect(rbacSql?.content).toContain("INSERT INTO system_menu")
    expect(rbacSql?.content).toContain("wms:warehouse:view")
    expect(rbacSql?.content).toContain("wms:warehouse:create")
    expect(rbacSql?.content).toContain("wms:warehouse:update")
    expect(rbacSql?.content).toContain("wms:warehouse:delete")
    expect(rbacSql?.content).toContain("INSERT INTO system_role_menu")
    expect(rbacSql?.content).toContain("INSERT INTO system_tenant_package_menu")

    // 9. Frontend UI with Pagination and single-line layout
    const listPage = outputs.find((o) => o.path.endsWith("pages/wms-warehouse-list.page.tsx"))
    expect(listPage).toBeDefined()
    expect(listPage?.content).toContain("WmsWarehouseListPage")
    expect(listPage?.content).toContain("<Pagination")
    expect(listPage?.content).toContain("编辑")
    expect(listPage?.content).toContain("删除")

    // 原「10. Multi-Channel Clients (H5, UniApp, Flutter)」断言已随这些客户端渠道一并移除 ——
    // 本仓只保留 clients/expo，代码生成器不再产出 h5/uniapp/flutter 目标。
  })

  it("supports preview and ZIP entry building", async () => {
    const preview = CodegenEngineService.preview(testConfig)
    expect(preview.length).toBeGreaterThanOrEqual(14)
    expect(preview[0]).toHaveProperty("lineCount")

    const zipEntries = await CodegenEngineService.buildZipEntries(testConfig)
    expect(zipEntries.length).toBeGreaterThanOrEqual(14)
    expect(zipEntries.some((e) => e.filename.endsWith(".rbac.sql"))).toBe(true)
  })
})
