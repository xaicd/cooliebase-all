import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { PERMISSIONS } from "../../packages/shared/backend/constants/permissions"
import { generateRoute } from "../../packages/domains/infra/backend/services/codegen-templates/route.template"

describe("permission-naming-unify: kebab permissionPrefix, zero governance debt, and static key compile guard", () => {
  const root = process.cwd()

  it("tightens contract-governance-baseline.json from 338 to 0 and enforces kebab permissionPrefix across all 340 plugin contracts", () => {
    const baseline = JSON.parse(
      fs.readFileSync(path.join(root, "docs/architecture/artifacts/contract-governance-baseline.json"), "utf8"),
    )
    expect(baseline.count).toBe(0)
    expect(baseline.entries).toEqual([])

    const permValues = new Set<string>(Object.values(PERMISSIONS))
    const pluginsDir = path.join(root, "packages/plugins")
    let totalContracts = 0

    for (const pEntry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!pEntry.isDirectory()) continue
      const agentDir = path.join(pluginsDir, pEntry.name, "agent")
      if (!fs.existsSync(agentDir)) continue
      for (const fname of fs.readdirSync(agentDir)) {
        if (!fname.endsWith(".agent.json")) continue
        totalContracts++
        const contract = JSON.parse(fs.readFileSync(path.join(agentDir, fname), "utf8"))
        const expectedSlug = contract.kebab.startsWith(`${contract.domain}-`)
          ? contract.kebab.slice(contract.domain.length + 1)
          : contract.kebab
        expect(contract.permissionPrefix).toBe(`${contract.domain}:${expectedSlug}`)
        expect(contract.permissionPrefix).not.toContain("_")
        expect(permValues.has(`${contract.permissionPrefix}:query`) || permValues.has(`${contract.permissionPrefix}:view`)).toBe(true)
        expect(permValues.has(`${contract.permissionPrefix}:create`)).toBe(true)
        expect(permValues.has(`${contract.permissionPrefix}:update`)).toBe(true)
        expect(permValues.has(`${contract.permissionPrefix}:delete`)).toBe(true)
      }
    }

    expect(totalContracts).toBe(340)
  })

  it("route.template.ts and WMS routes use static PERMISSIONS.<KEY> lookup without Record<string, string> erasure", () => {
    const generated = generateRoute({
      moduleName: "wms",
      className: "WmsItemBrand",
      businessName: "商品品牌",
      parentMenuId: "wms-dir",
      permissionPrefix: "wms:item-brand",
      table: {
        name: "wms_item_brand",
        comment: "商品品牌表",
        columns: [
          { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "ID", isPk: true },
          { name: "name", type: "varchar", tsType: "string", nullable: false, comment: "品牌名" },
        ],
      },
    })

    expect(generated.content).toContain("const VIEW_PERM = PERMISSIONS.WMS_ITEM_BRAND_VIEW")
    expect(generated.content).toContain("const CREATE_PERM = PERMISSIONS.WMS_ITEM_BRAND_CREATE")
    expect(generated.content).toContain("const UPDATE_PERM = PERMISSIONS.WMS_ITEM_BRAND_UPDATE")
    expect(generated.content).toContain("const DELETE_PERM = PERMISSIONS.WMS_ITEM_BRAND_DELETE")
    expect(generated.content).not.toContain("Record<string, string>")
    expect(generated.content).not.toContain("as PermissionCode")

    const wmsRoute = fs.readFileSync(
      path.join(root, "packages/plugins/plugin-wms/routes/admin/wms-inventory-history/route.ts"),
      "utf8",
    )
    expect(wmsRoute).toContain("PERMISSIONS.WMS_INVENTORY_HISTORY_VIEW")
    expect(wmsRoute).not.toContain("Record<string, string>")
  })

  it("negative control: removing a registered PERMISSIONS key triggers TypeScript TS2339 compile error on static route lookup", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cb-perm-static-"))
    try {
      const compileSnippet = (permissionsSource: string) => {
        const permFile = path.join(tmpDir, "permissions.ts")
        const routeFile = path.join(tmpDir, "route.ts")
        fs.writeFileSync(permFile, permissionsSource, "utf8")
        fs.writeFileSync(
          routeFile,
          `import { PERMISSIONS, type PermissionCode } from "./permissions"\nfunction guard(code: PermissionCode) { return code }\nexport const VIEW = guard(PERMISSIONS.WMS_ITEM_BRAND_VIEW)\n`,
          "utf8",
        )
        const program = ts.createProgram([permFile, routeFile], {
          noEmit: true,
          strict: true,
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          skipLibCheck: true,
        })
        return ts.getPreEmitDiagnostics(program)
      }

      const okDiags = compileSnippet(
        `export const PERMISSIONS = {\n  WMS_ITEM_BRAND_VIEW: "wms:item-brand:query",\n} as const\nexport type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]\n`,
      )
      expect(okDiags.map((d) => d.code)).toEqual([])

      const failDiags = compileSnippet(
        `export const PERMISSIONS = {\n  OTHER_PERM_VIEW: "other:perm:query",\n} as const\nexport type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]\n`,
      )
      expect(failDiags.map((d) => d.code)).toContain(2339)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
