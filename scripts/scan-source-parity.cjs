/**
 * 与源框架的能力对账（只报告，不设门禁）。
 *
 * 背景：本仓 = **cooliebase-vue-pro（业务功能）+ jeecgboot 在线表单（低代码）+ paperclip（插件架构）**
 * 的综合基座，但长期只在 `system` / `infra` 上验证。其余域"是否真正习得原框架的业务能力"
 * 需要**拿源框架的模块清单逐项对账**，而不是靠感觉。
 *
 * 用法:
 *   # 1. 先把源框架克隆到本地（浅克隆即可）
 *   git clone --depth 1 --filter=blob:none --sparse \
 *     https://github.com/YunaiV/cooliebase-vue-pro.git /tmp/yudao
 *   cd /tmp/yudao && git sparse-checkout set --no-cone '/*.md' '/yudao-module-*'
 *
 *   # 2. 对账
 *   node scripts/scan-source-parity.cjs --source /tmp/yudao
 *   node scripts/scan-source-parity.cjs --source /tmp/yudao --json
 *
 * 产出: 每个源模块 vs 本仓对应域的规模对照 + 缺口标记。
 */
const fs = require("node:fs")
const path = require("node:path")

const { ROOT, loadCatalog, domainPathOf } = require("./lib/domain-catalog.cjs")

const argv = process.argv.slice(2)
const arg = (flag, fallback) => {
  const index = argv.indexOf(flag)
  return index >= 0 ? argv[index + 1] : fallback
}
const sourceRoot = arg("--source")
const asJson = argv.includes("--json")

if (!sourceRoot || !fs.existsSync(sourceRoot)) {
  console.error("用法: node scripts/scan-source-parity.cjs --source <cooliebase-vue-pro 克隆路径> [--json]")
  console.error("  （克隆命令见本文件头部注释）")
  process.exit(2)
}

const walk = (dir, predicate) => {
  const out = []
  const visit = (current) => {
    if (!fs.existsSync(current)) return
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (["node_modules", ".git", "target", "dist"].includes(entry.name)) continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (predicate(entry.name)) out.push(full)
    }
  }
  visit(dir)
  return out
}

/** 源框架每个模块的规模。 */
function measureSourceModule(moduleDir) {
  const java = walk(moduleDir, (name) => name.endsWith(".java"))
  let tables = 0
  let controllers = 0
  let services = 0
  let vo = 0
  for (const file of java) {
    const name = path.basename(file)
    if (name.endsWith("Controller.java")) controllers++
    else if (name.endsWith("Service.java") || name.endsWith("ServiceImpl.java")) services++
    else if (name.endsWith("VO.java")) vo++
    else if (name.endsWith("DO.java")) {
      const source = fs.readFileSync(file, "utf8")
      if (/@TableName\(/.test(source)) tables++
    }
  }
  return { tables, controllers, services, vo }
}

/** 本仓某个域实际碰的表（从仓储/服务代码提取，不靠表名前缀猜）。 */
function localTables(domainName) {
  const dir = domainPathOf(ROOT, domainName)
  const tables = new Set()
  for (const file of walk(dir, (name) => name.endsWith(".repository.ts") || name.endsWith(".service.ts"))) {
    const source = fs.readFileSync(file, "utf8")
    const named = source.match(/const TABLE_NAME\s*=\s*"([a-z0-9_]+)"/)
    if (named) tables.add(named[1])
    for (const match of source.matchAll(/\.(?:selectFrom|insertInto|updateTable|deleteFrom|into)\("([a-z0-9_]+)"/g)) {
      tables.add(match[1])
    }
  }
  return tables.size
}

function localServices(domainName) {
  return walk(domainPathOf(ROOT, domainName), (name) => name.endsWith(".service.ts")).length
}

function main() {
  const catalog = loadCatalog()
  const localNames = new Set((catalog.domains || []).map((entry) => entry.name))

  const sourceModules = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("yudao-module-"))
    .map((entry) => entry.name.replace(/^yudao-module-/, ""))
    .sort()

  const rows = sourceModules.map((name) => {
    const source = measureSourceModule(path.join(sourceRoot, `yudao-module-${name}`))
    const present = localNames.has(name)
    return {
      module: name,
      present,
      source,
      local: present ? { tables: localTables(name), services: localServices(name) } : null,
      verdict: !present
        ? "缺失（本仓没有该域）"
        : localTables(name) === 0 && source.tables > 0
          ? "只有代码骨架（0 数据层）"
          : localTables(name) >= source.tables * 0.5
            ? "基本对齐"
            : "偏薄",
    }
  })

  // 本仓有、源框架没有的（jeecgboot 在线表单 / 本仓自有）
  const extra = [...localNames].filter((name) => !sourceModules.includes(name)).sort()

  if (asJson) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), sourceRoot, rows, localOnly: extra }, null, 2))
    return
  }

  console.log("[source-parity] 与 cooliebase-vue-pro 的能力对账（只报告，不设门禁）")
  console.log("")
  console.log("  源模块      源:表  源:Controller  本仓:表  本仓:服务  判定")
  for (const row of rows) {
    const localTablesText = row.local ? String(row.local.tables) : "-"
    const localServicesText = row.local ? String(row.local.services) : "-"
    console.log(
      "  " +
        row.module.padEnd(11) +
        String(row.source.tables).padStart(6) +
        String(row.source.controllers).padStart(15) +
        localTablesText.padStart(9) +
        localServicesText.padStart(10) +
        "  " +
        row.verdict,
    )
  }
  console.log("")
  console.log(`  本仓独有（源框架没有）: ${extra.join(", ") || "无"}`)
  const missing = rows.filter((row) => !row.present).map((row) => row.module)
  const skeleton = rows.filter((row) => row.verdict.startsWith("只有代码骨架")).map((row) => row.module)
  console.log(`  整块缺失: ${missing.join(", ") || "无"}`)
  console.log(`  只有骨架: ${skeleton.join(", ") || "无"}`)
}

main()
