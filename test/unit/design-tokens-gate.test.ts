import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"
import { UI } from "../../packages/shared/frontend/lib/design-tokens"
import { generateListPage } from "../../packages/domains/infra/backend/services/codegen-templates/frontend-list.template"

const requireCjs = createRequire(import.meta.url)
const { scanFileForBareTableSpacing } = requireCjs("../../scripts/check-design-tokens.cjs")

describe("ui-design-tokens: executable UI tokens & bare table spacing ratchet", () => {
  it("exports page, search, table, button, badge and card groups from design-tokens.ts", () => {
    expect(UI.page.header).toContain("justify-between")
    expect(UI.search.container).toContain("rounded-xl")
    expect(UI.table.th).toContain("px-5 py-3")
    expect(UI.table.td).toContain("px-5 py-3")
    expect(UI.button.primary).toContain("bg-blue-600")
    expect(UI.badge.base).toContain("inline-flex")
    expect(UI.card.base).toContain("rounded-xl")
  })

  it("codegen frontend-list.template.ts uses UI tokens and emits zero bare px-*/py-* on <th>/<td>", () => {
    const out = generateListPage({
      moduleName: "wms",
      className: "WmsWarehouse",
      businessName: "智能仓库",
      parentMenuId: "wms-dir",
      permissionPrefix: "wms:warehouse",
      table: {
        name: "wms_warehouse",
        comment: "智能仓库表",
        columns: [
          { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "ID", isPk: true },
          { name: "code", type: "varchar", tsType: "string", nullable: false, comment: "编码", queryType: "LIKE" },
          { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "状态", enumValues: ["ACTIVE", "DISABLED"] },
        ],
      },
    })

    expect(out.content).toContain('import { UI } from "@/modules/shared/frontend/lib/design-tokens"')
    expect(out.content).toContain("UI.table.th")
    expect(out.content).toContain("UI.table.td")
    expect(out.content).toContain("UI.table.actions")
    expect(scanFileForBareTableSpacing(out.content)).toEqual([])
  })

  it("negative control: check-design-tokens.cjs fails (exit=1) on bare <td>/<th> px-*/py-* and passes (exit=0) with UI.table.*", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cb-design-tokens-"))
    try {
      const pageDir = path.join(tmpRoot, "packages", "domains", "demo", "frontend", "pages")
      const artifactDir = path.join(tmpRoot, "docs", "architecture", "artifacts")
      fs.mkdirSync(pageDir, { recursive: true })
      fs.mkdirSync(artifactDir, { recursive: true })
      fs.writeFileSync(
        path.join(artifactDir, "design-tokens-baseline.json"),
        JSON.stringify({ entries: {} }, null, 2) + "\n",
        "utf8",
      )

      const pageFile = path.join(pageDir, "demo-list.page.tsx")
      fs.writeFileSync(
        pageFile,
        `import { UI } from "@/modules/shared/frontend/lib/design-tokens"\nexport function Demo() {\n  return <table><thead><tr><th className="px-4 py-2.5">名称</th></tr></thead><tbody><tr><td className="px-4 py-2.5">A</td></tr></tbody></table>\n}\n`,
        "utf8",
      )

      const gateScript = path.resolve(process.cwd(), "scripts/check-design-tokens.cjs")
      const failRun = spawnSync(process.execPath, [gateScript], {
        cwd: process.cwd(),
        env: { ...process.env, DESIGN_TOKENS_ROOT: tmpRoot },
        encoding: "utf8",
      })
      expect(failRun.status).toBe(1)
      expect(failRun.stderr).toContain("px-4+py-2.5")

      fs.writeFileSync(
        pageFile,
        `import { UI } from "@/modules/shared/frontend/lib/design-tokens"\nexport function Demo() {\n  return <table><thead><tr><th className={UI.table.th}>名称</th></tr></thead><tbody><tr><td className={UI.table.td}>A</td></tr></tbody></table>\n}\n`,
        "utf8",
      )

      const passRun = spawnSync(process.execPath, [gateScript], {
        cwd: process.cwd(),
        env: { ...process.env, DESIGN_TOKENS_ROOT: tmpRoot },
        encoding: "utf8",
      })
      expect(passRun.status).toBe(0)
      expect(passRun.stdout).toContain("通过")
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})
