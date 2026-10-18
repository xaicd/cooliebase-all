/**
 * 域业务能力盘点（只报告，不设门禁）。
 *
 * 为什么需要：本仓是 **cooliebase-vue-pro（业务功能）+ jeecgboot 在线表单（低代码）
 * + paperclip（插件架构）** 的综合基座，但长期只在 `system` / `infra` 上验证 ——
 * 其余域"是否真正习得原框架的业务能力"**没有证据**。
 *
 * 而本该回答这个问题的工具链是坏的: `check-cooliebase-capability-matrix` /
 * `scan-cooliebase-domain-evidence` 等脚本从未进仓（原本属于父级 monorepo），
 * 且 `run-root-tsx.cjs` 在脚本缺失时**静默 exit 0** —— 于是门禁常年空转却报绿。
 *
 * 本脚本给出一份**可核对的事实**: 每个域实际有多少表/仓储/服务/校验器/路由/页面/权限码/测试。
 * 薄弱的域一眼可见，再据此逐一对照原框架的模块清单。
 *
 * 用法:
 *   node scripts/scan-domain-capabilities.cjs            # 表格
 *   node scripts/scan-domain-capabilities.cjs --json      # JSON
 *   node scripts/scan-domain-capabilities.cjs --thin 3    # 只列"每类都少于 N"的域
 */
const fs = require("node:fs")
const path = require("node:path")

const { ROOT, loadCatalog, domainPathOf } = require("./lib/domain-catalog.cjs")

const argv = process.argv.slice(2)
const asJson = argv.includes("--json")
const thinThreshold = (() => {
  const index = argv.indexOf("--thin")
  return index >= 0 ? Number(argv[index + 1] ?? 3) : null
})()

function walkFiles(dir, predicate) {
  const out = []
  const walk = (current) => {
    if (!fs.existsSync(current)) return
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (predicate(entry.name, full)) out.push(full)
    }
  }
  walk(dir)
  return out
}

/**
 * 该域**实际引用的物理表**（从它自己的仓储/服务里提取）。
 *
 * 为什么不用"表名前缀 == 域名": 不少域的表不按域名为前缀（如 `mes-pro-work-order`
 * 对应的物理表），前缀匹配会把它们统计成 0，得出"这个域没有数据层"的错误结论。
 * 从代码里取才反映该域真正碰的数据。
 */
function referencedTables(dir) {
  const tables = new Set()
  for (const file of walkFiles(dir, (name) => name.endsWith(".repository.ts") || name.endsWith(".service.ts"))) {
    const source = fs.readFileSync(file, "utf8")
    const named = source.match(/const TABLE_NAME\s*=\s*"([a-z0-9_]+)"/)
    if (named) tables.add(named[1])
    for (const match of source.matchAll(/\.(?:selectFrom|insertInto|updateTable|deleteFrom|into)\("([a-z0-9_]+)"/g)) {
      tables.add(match[1])
    }
  }
  return [...tables].sort()
}

/** 该域在迁移/元数据里登记了几张表。 */
function countTables(domainName) {
  const sources = []
  const migrationsDir = path.join(ROOT, "prisma", "migrations")
  if (fs.existsSync(migrationsDir)) {
    for (const entry of fs.readdirSync(migrationsDir)) {
      const file = path.join(migrationsDir, entry, "migration.sql")
      if (fs.existsSync(file)) sources.push(fs.readFileSync(file, "utf8"))
    }
  }
  const dataDir = path.join(ROOT, "scripts", "data")
  if (fs.existsSync(dataDir)) {
    for (const entry of fs.readdirSync(dataDir)) {
      if (entry.endsWith(".ts")) sources.push(fs.readFileSync(path.join(dataDir, entry), "utf8"))
    }
  }
  const names = new Set()
  for (const source of sources) {
    for (const match of source.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"?([a-z0-9_]+)"?/gi)) {
      const table = match[1].toLowerCase()
      if (table.startsWith(`${domainName}_`) || table.startsWith(`plugin_${domainName}`)) names.add(table)
    }
    for (const match of source.matchAll(/table:\s*\{\s*name:\s*"([a-z0-9_]+)"/g)) {
      const table = match[1].toLowerCase()
      if (table.startsWith(`${domainName}_`)) names.add(table)
    }
  }
  return names.size
}

/** 该域声明了多少个权限码（`<domain>:...`）。 */
function countPermissions(domainName) {
  const file = path.join(ROOT, "packages", "shared", "backend", "constants", "permissions.ts")
  if (!fs.existsSync(file)) return 0
  const source = fs.readFileSync(file, "utf8")
  const codes = new Set(source.matchAll(/["']([a-z][a-z0-9_]*):[a-zA-Z0-9_:*.-]+["']/g))
  return [...codes].filter((match) => match[1] === domainName).length
}

function inspectDomain(domainName) {
  // domainPathOf 返回的**已经是绝对路径** —— 再 path.join(ROOT, …) 会拼成
  // `<ROOT>/Users/…`（join 不会因绝对路径重置），于是所有明细都统计成 0。
  const dir = domainPathOf(ROOT, domainName)
  const contract = walkFiles(path.join(dir, "contract"), (name) => name.endsWith(".ts")).length
  const repositories = walkFiles(path.join(dir, "backend", "repositories"), (name) => name.endsWith(".repository.ts")).length
  const services = walkFiles(path.join(dir, "backend", "services"), (name) => name.endsWith(".service.ts")).length
  const validators = walkFiles(path.join(dir, "backend", "validators"), (name) => name.endsWith(".ts")).length
  const routes = walkFiles(path.join(dir, "routes"), (name) => name === "route.ts").length
  const pages = walkFiles(path.join(dir, "frontend"), (name) => /\.(page|pages)\.tsx$/.test(name) || name.endsWith(".page.tsx")).length
  const frontendApi = walkFiles(path.join(dir, "frontend"), (name) => name.endsWith(".api.ts")).length
  const tests = walkFiles(dir, (name) => /\.test\.tsx?$/.test(name)).length
  const referenced = referencedTables(dir)
  return {
    domain: domainName,
    dir: domainPathOf(ROOT, domainName),
    tables: referenced.length,
    tableNames: referenced,
    declaredTables: countTables(domainName),
    contract,
    repositories,
    services,
    validators,
    routes,
    pages,
    frontendApi,
    permissions: countPermissions(domainName),
    tests,
  }
}

function main() {
  const catalog = loadCatalog()
  const pluginLayer = new Set((catalog.layers.plugin?.domains) || [])
  const rows = (catalog.domains || [])
    .map((entry) => ({
      ...inspectDomain(entry.name),
      kind: entry.kind,
      layer: (catalog.layers.platform?.domains || []).includes(entry.name)
        ? "platform"
        : pluginLayer.has(entry.name)
          ? "plugin"
          : "business",
    }))
    .sort((a, b) => a.layer.localeCompare(b.layer) || a.domain.localeCompare(b.domain))

  const flagged = thinThreshold === null
    ? rows
    : rows.filter((row) =>
        row.tables < thinThreshold && row.services < thinThreshold && row.routes < thinThreshold && row.pages < thinThreshold)

  if (asJson) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), threshold: thinThreshold, domains: flagged }, null, 2))
    return
  }

  console.log("[domain-capabilities] 各域业务能力盘点（只报告，不设门禁）")
  console.log("")
  console.log(
    "  " +
      ["域", "层", "表", "contract", "仓储", "服务", "校验", "路由", "页面", "前端API", "权限码", "测试"]
        .map((header, index) => header.padEnd(index === 0 ? 12 : 8))
        .join(""),
  )
  for (const row of flagged) {
    console.log(
      "  " +
        [
          row.domain,
          row.layer,
          String(row.tables),
          String(row.contract),
          String(row.repositories),
          String(row.services),
          String(row.validators),
          String(row.routes),
          String(row.pages),
          String(row.frontendApi),
          String(row.permissions),
          String(row.tests),
        ]
          .map((value, index) => value.padEnd(index === 0 ? 12 : 8))
          .join(""),
    )
  }
  console.log("")
  console.log(`  共 ${flagged.length} 个域${thinThreshold === null ? "" : `（每类都 < ${thinThreshold} 的"薄弱域"）`}`)
  console.log("  说明: 这只反映**代码规模**，不等于业务完整度 —— 但它能把'明显偏薄、值得逐一核对'的域挑出来，")
  console.log("        再对照 cooliebase-vue-pro / jeecgboot 的模块清单逐项确认。")
}

main()
