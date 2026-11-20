/**
 * 表清单对账报告（只报告，不设门禁）。
 *
 * 为什么需要：本仓有三份"表定义"来源，互相矛盾 ——
 *   prisma/schema.prisma 的 @@map
 *   prisma/migrations/__/migration.sql 的 CREATE TABLE
 *   scripts/bootstrap-sqlite.ts 的 CREATE TABLE
 * 在没有公认真源之前，任何"表归属 / namespace 隔离"的治理物都会是部分正确的假象
 * （module→plugin 迁移的 P2b 正卡在这里）。
 *
 * 本脚本只把差异摊开，供人决定哪份是真相；不判定、不阻断 —— 与 AGENTS.md §6.4
 * 的「报告 vs 门禁」分工一致（待真相确定后，再考虑升级为 ratchet 门禁）。
 *
 * 用法：node scripts/report-table-inventory.cjs [--json]
 */
const fs = require("fs")
const path = require("path")

const { ROOT, readMetadataTables, readMigrationTables, readSqliteBootstrapTables, readPrismaTables, readQueriedTables } = require("./lib/table-definitions.cjs")

const onlyIn = (a, ...others) => [...a].filter((item) => others.every((set) => !set.has(item))).sort()

function main() {
  const prisma = readPrismaTables()
  const migrations = readMigrationTables()
  const sqlite = readSqliteBootstrapTables()
  const metadata = readMetadataTables()
  const repositories = readQueriedTables()
  // "表在哪儿被建"的三个来源（元数据是**真源**，另两个是它的落地产物）。
  const union = new Set([...prisma, ...migrations, ...sqlite, ...metadata])

  const report = {
    generatedAt: new Date().toISOString(),
    note: "只报告不设门禁：三份来源互相矛盾，需先确定权威真源，再谈表归属/namespace 隔离。",
    counts: {
      prisma: prisma.size,
      migrations: migrations.size,
      sqliteBootstrap: sqlite.size,
      metadata: metadata.size,
      repositories: repositories.size,
      union: union.size,
    },
    // 仓储在查、但三份建表来源里一张都没定义 —— 这些表在真实库里**永远不存在**。
    queriedButNeverCreated: [...repositories].filter((t) => !union.has(t)).sort(),
    onlyIn: {
      prisma: onlyIn(prisma, migrations, sqlite),
      migrations: onlyIn(migrations, prisma, sqlite),
      sqliteBootstrap: onlyIn(sqlite, prisma, migrations),
    },
    inAllThree: [...union].filter((t) => prisma.has(t) && migrations.has(t) && sqlite.has(t)).sort(),
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log("[table-inventory] 表定义来源对账（只报告，不阻断）")
  console.log(`  prisma/schema.prisma @@map : ${report.counts.prisma}`)
  console.log(`  prisma/migrations          : ${report.counts.migrations}`)
  console.log(`  scripts/bootstrap-sqlite.ts: ${report.counts.sqliteBootstrap}`)
  console.log(`  并集（非"真相"）           : ${report.counts.union}`)
  console.log(`  三份都有                   : ${report.inAllThree.length}`)
  const { prisma: p, migrations: m, sqliteBootstrap: s } = report.onlyIn
  console.log(`  仅 prisma 有               : ${p.length}`)
  console.log(`  仅 migrations 有           : ${m.length}`)
  console.log(`  仅 sqlite bootstrap 有     : ${s.length}`)
  if (m.length > 0) console.log(`    e.g. ${m.slice(0, 8).join(", ")}`)
  if (p.length > 0) console.log(`    prisma 独有 e.g. ${p.slice(0, 8).join(", ")}`)

  // 最要命的一栏：仓储在查、却没有任何地方建它 —— 真实库里必然 relation does not exist。
  const q = report.queriedButNeverCreated
  console.log("")
  console.log(`  仓储声明的物理表           : ${report.counts.repositories}`)
  console.log(`  ⚠ 仓储在查但**无处创建**   : ${q.length}`)
  if (q.length > 0) {
    console.log(`    ${q.slice(0, 10).join(", ")}${q.length > 10 ? ` …(共 ${q.length})` : ""}`)
    console.log("    这些表只在内存回退下可用。一旦配了 DATABASE_URL 走真实库，")
    console.log("    查它们必然报 relation does not exist —— 且是静默陷阱：按常规\"先配库\"反而全红。")
  }

  const target = path.join(ROOT, "packages", "shared", "contract", "gate-assets", "table-inventory-report.json")
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`[table-inventory] wrote ${path.relative(ROOT, target).replace(/\\/g, "/")}`)
}

main()
