/**
 * 迁移所有旧 import 路径到新的 modules 结构
 * 不使用 PowerShell，直接 Node.js 读写确保 UTF-8
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", "src")
let fixed = 0

const REPLACEMENTS = [
  // Relative paths to backend/lib
  ["../../../../backend/lib/domain-log", "@/modules/shared/backend/lib/domain-log"],
  ["../../../backend/lib/domain-log", "@/modules/shared/backend/lib/domain-log"],
  ["../../backend/lib/domain-log", "@/modules/shared/backend/lib/domain-log"],
  ["../../../../backend/lib/audit-log", "@/modules/shared/backend/lib/audit-log"],
  ["../../../../backend/lib/permission-guard", "@/modules/shared/backend/lib/permission-guard"],
  ["../../../../backend/lib/platform-monitor", "@/modules/shared/backend/lib/platform-monitor"],
  // @/backend paths
  ["@/backend/lib/domain-log", "@/modules/shared/backend/lib/domain-log"],
  ["@/backend/lib/audit-log", "@/modules/shared/backend/lib/audit-log"],
  ["@/backend/lib/permission-guard", "@/modules/shared/backend/lib/permission-guard"],
  ["@/backend/lib/platform-monitor", "@/modules/shared/backend/lib/platform-monitor"],
  ["@/backend/constants/permissions", "@/modules/shared/backend/constants/permissions"],
  ["@/backend/constants/admin-menu", "@/modules/shared/backend/constants/admin-menu"],
  // @/lib paths
  ["@/lib/crypto", "@/modules/shared/backend/lib/crypto"],
  ["@/lib/rbac-registry/role-permissions", "@/modules/shared/backend/lib/rbac-registry/role-permissions"],
  // Relative validator paths
  ["../../../../backend/validators/system.validator", "@/modules/system/backend/validators"],
  ["../../../../backend/validators/system-module.validator", "@/modules/system/backend/validators"],
  ["../../../../backend/validators/infra.validator", "@/modules/infra/backend/validators"],
  ["../../../../backend/validators/bpm.validator", "@/modules/bpm/backend/validators"],
  // Shared prisma
  ["../../../shared/backend/prisma", "@/modules/shared/backend/prisma"],
  ["../../shared/backend/prisma", "@/modules/shared/backend/prisma"],
  // Frontend templates
  ["@/frontend/templates/admin-list-page.template", "@/modules/shared/frontend/templates/admin-list-page.template"],
  // Components
  ["@/components/ui/", "@/modules/shared/frontend/components/ui/"],
]

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next-cooliebase") continue
      walk(full)
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      let content = fs.readFileSync(full, "utf-8")
      const original = content

      for (const [from, to] of REPLACEMENTS) {
        if (content.includes(from)) {
          content = content.split(from).join(to)
        }
      }

      if (content !== original) {
        fs.writeFileSync(full, content, "utf-8")
        fixed++
      }
    }
  }
}

console.log("=== Migrating import paths ===")
walk(ROOT)
console.log("Done. Fixed " + fixed + " files.")
console.log("You can now delete src/backend/ and src/lib/ directories.")
