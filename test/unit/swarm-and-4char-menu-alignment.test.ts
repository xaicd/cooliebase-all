import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"

const require = createRequire(import.meta.url)
const ROOT = path.resolve(__dirname, "../..")

const {
  visibleCharCount,
  compactMenuTitle,
  validateMenuTitle,
  checkNavMenuLengths,
  validateBlueprintMenuTitles,
} = require("../../scripts/lib/menu-title-guard.cjs")

const {
  diagnoseAndHealBlueprint,
  compileBlueprintDomain,
} = require("../../scripts/blueprint-engine.cjs")

describe("infra/swarm-and-4char-menu-alignment", () => {
  describe("T1: Root SWARM.md environment-agnostic multi-agent constitution & hatch preservation", () => {
    it("provides an environment-agnostic SWARM.md (<25KB) with zero container paths and zero bare npm/npx", () => {
      const swarmPath = path.join(ROOT, "SWARM.md")
      expect(fs.existsSync(swarmPath)).toBe(true)

      const content = fs.readFileSync(swarmPath, "utf8")
      expect(Buffer.byteLength(content, "utf8")).toBeGreaterThan(1500)
      expect(Buffer.byteLength(content, "utf8")).toBeLessThan(25 * 1024)

      // 严禁容器绝对路径硬编码
      const forbiddenMountLiteral = "/" + "host-" + "workspace"
      expect(content.includes(forbiddenMountLiteral)).toBe(false)
      expect(content).toContain("${COOLIE_HOME:-/opt/coolie}/blueprints/cooliebase-all")

      // 严禁裸包管理调用或临时包执行器
      expect(/(?<![pP])npm\s+(?:run|install)\b/.test(content)).toBe(false)
      expect(/\bnpx\s+[a-z@]/i.test(content)).toBe(false)

      // 关键多智能体不变量齐备：Wave 0~4、Domain Facade、Embedded PG 18.4、[SEALED]、GOAL 字节一致、<=4 字菜单
      expect(content).toContain("Domain Facade")
      expect(content).toContain("ephemeral-pg.cjs")
      expect(content).toContain("Wave 0")
      expect(content).toContain("Wave 4")
      expect(content).toContain("[SEALED]")
      expect(content).toContain("GOAL.md")
      expect(content).toContain("docs/GOAL.md")
      expect(content).toContain("<= 4")
    })

    it("protects SWARM.md and GOAL.md in clone-project-base.cjs and preserves base blueprint path", () => {
      const cloneScript = fs.readFileSync(path.join(ROOT, "scripts/clone-project-base.cjs"), "utf8")
      expect(cloneScript).toContain('"SWARM.md"')
      expect(cloneScript).toContain('"GOAL.md"')
      expect(cloneScript).toContain("__COOLIE_BLUEPRINT_BASE_SNAPSHOT__")
    })
  })

  describe("T2: Standard 8-verb service.sh and deploy/service.sh contract", () => {
    it("exposes executable scripts/service.sh and deploy/service.sh supporting all 8 verbs and --help", () => {
      const rootService = path.join(ROOT, "scripts/service.sh")
      const deployService = path.join(ROOT, "deploy/service.sh")
      expect(fs.existsSync(rootService)).toBe(true)
      expect(fs.existsSync(deployService)).toBe(true)

      const rootMode = fs.statSync(rootService).mode
      const deployMode = fs.statSync(deployService).mode
      expect(rootMode & 0o111).toBeGreaterThan(0)
      expect(deployMode & 0o111).toBeGreaterThan(0)

      const helpRoot = spawnSync("bash", [rootService, "--help"], { cwd: ROOT, encoding: "utf8" })
      expect(helpRoot.status).toBe(0)
      for (const verb of ["install", "build", "start", "stop", "restart", "status", "health", "logs"]) {
        expect(helpRoot.stdout).toContain(verb)
      }

      const helpDeploy = spawnSync("bash", [deployService, "--help"], { cwd: ROOT, encoding: "utf8" })
      expect(helpDeploy.status).toBe(0)
      expect(helpDeploy.stdout).toContain("标准 8 动词服务控制契约")
    })

    it("honors PORT / GATEWAY_PORT from environment in status output without starting processes", () => {
      const statusRes = spawnSync("bash", [path.join(ROOT, "scripts/service.sh"), "status"], {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, PORT: "59991" },
      })
      expect(statusRes.status).toBe(0)
      expect(statusRes.stdout).toContain("59991")
    })
  })

  describe("T3: <=4 visible char menu title guard, ratchet baseline & blueprint compiler integration", () => {
    it("validates visible menu character counts and compacts verbose entity names to <=4 chars", () => {
      expect(visibleCharCount("采购订单")).toBe(4)
      expect(visibleCharCount("请假审批单")).toBe(5)
      expect(validateMenuTitle("采购订单").ok).toBe(true)
      expect(validateMenuTitle("请假审批单").ok).toBe(false)
      expect(compactMenuTitle("请假审批单")).toBe("请假审批")
      expect(compactMenuTitle("电子图书管理")).toBe("电子图书")
      expect(compactMenuTitle("紧急采购物料明细记录表")).toBe("紧急采购")
      expect(visibleCharCount(compactMenuTitle("超长多端协同数字资产配置中心"))).toBeLessThanOrEqual(4)
    })

    it("passes current ADMIN_NAV ratchet baseline and deterministically blocks new >4-char menus (negative control)", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cb-menu-guard-"))
      try {
        const baselineFile = path.join(tmpDir, "menu-baseline.json")
        const sampleNav = [
          {
            id: "crm",
            title: "客户关系",
            items: [
              { id: "crm/legacy", href: "/admin/crm/legacy", label: "历史遗留超长菜单管理" },
              { id: "crm/lead", href: "/admin/crm/lead", label: "销售线索" },
            ],
          },
        ]

        // 1. 冻结存量基线
        const written = checkNavMenuLengths(sampleNav, { baselinePath: baselineFile, writeBaseline: true })
        expect(written.ok).toBe(true)
        expect(written.frozenCount).toBe(1)

        // 2. 无新增超长项时 PASS
        const cleanCheck = checkNavMenuLengths(sampleNav, { baselinePath: baselineFile })
        expect(cleanCheck.ok).toBe(true)
        expect(cleanCheck.violations).toHaveLength(0)

        // 3. 反向对照：新增一个 5 字菜单项 -> 确定性拦截
        const mutatedNav = [
          ...sampleNav,
          {
            id: "erp",
            title: "进销存",
            items: [{ id: "erp/overlong", href: "/admin/erp/overlong", label: "采购入库单" }],
          },
        ]
        const blocked = checkNavMenuLengths(mutatedNav, { baselinePath: baselineFile })
        expect(blocked.ok).toBe(false)
        expect(blocked.violations).toHaveLength(1)
        expect(blocked.violations[0].label).toBe("采购入库单")
        expect(blocked.violations[0].suggested).toBe("采购入库")
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })

    it("auto-heals implicit >4-char entity titles into <=4-char menuTitle while rejecting explicit >4-char menuTitle", () => {
      // 1. 未显式声明 menuTitle 时自动自愈精简至 <=4 字（兼容存量蓝图）
      const compiled = compileBlueprintDomain({
        domain: "oa",
        entities: [
          {
            table: "leave_request",
            title: "请假审批单",
            fields: [{ name: "reason", label: "事由", widget: "text", required: true }],
          },
        ],
      })
      expect(compiled.codegenTables[0].menuTitle).toBe("请假审批")
      expect(visibleCharCount(compiled.codegenTables[0].menuTitle)).toBeLessThanOrEqual(4)

      const healed = diagnoseAndHealBlueprint({
        domain: "oa",
        entities: [{ table: "oa_leave", title: "员工外出公干申请单", fields: [] }],
      })
      expect(validateBlueprintMenuTitles(healed.healedSpec).ok).toBe(true)

      // 2. 反向对照：显式传入 >4 字 menuTitle 时编译直接拒绝
      expect(() =>
        compileBlueprintDomain({
          domain: "oa",
          entities: [
            {
              table: "oa_leave",
              title: "请假单",
              menuTitle: "超长五个字",
              fields: [{ name: "reason", label: "事由", widget: "text" }],
            },
          ],
        }),
      ).toThrow(/超过 <=4 字上限/)
    })
  })
})
