/**
 * 元数据声明的列类型 vs 真实库里的列类型 —— 逐表比对，列出漂移。
 *
 * 为什么需要: `ADD COLUMN IF NOT EXISTS` 能补**缺列**，但**改不了已存在列的类型**。
 * 于是"元数据说 varchar、物理列是 integer"这种漂移会一直在，
 * 表现是生成的测试往整数列写字符串 -> `invalid input syntax for type integer`
 * （内存回退完全不校验类型，所以只有真实库才暴露）。
 *
 * 用法: DATABASE_URL=... pnpm exec tsx scripts/report-type-drift.ts
 */
import path from "node:path"
import { Client } from "pg"

const ROOT = path.resolve(__dirname, "..")
const DOMAINS = ["ai", "bpm", "crm", "erp", "im", "iot", "mall", "member", "mes", "mp", "pay", "report"]

/** 元数据类型 -> PostgreSQL 的 data_type（information_schema 的写法）。 */
function expectedPgType(type: string): string {
  switch (type) {
    case "int": return "integer"
    case "bigint": return "bigint"
    case "boolean": return "boolean"
    case "decimal": return "numeric"
    case "timestamp": return "timestamp without time zone"
    case "date": return "date"
    case "text": return "text"
    default: return "character varying"
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  let drift = 0
  let checked = 0
  const missingTables: string[] = []

  for (const domain of DOMAINS) {
    const mod = require(path.join(ROOT, "scripts", "data", `${domain}-source-tables.ts`)) as Record<string, unknown>
    const configs = mod[`${domain.toUpperCase()}_TABLES`] as Array<{ table: { name: string; columns: Array<{ name: string; type: string }> } }>
    if (!Array.isArray(configs)) continue
    for (const config of configs) {
      const actual = await client.query<{ column_name: string; data_type: string }>(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
        [config.table.name],
      )
      if (actual.rows.length === 0) { missingTables.push(config.table.name); continue }
      const byName = new Map(actual.rows.map((row) => [row.column_name, row.data_type]))
      for (const column of config.table.columns) {
        const real = byName.get(column.name)
        if (!real) continue
        checked += 1
        // DDL 里 `id` 被规则强制为 TEXT（见 column-type.ts 的 pgType）—— 比对时要按同一条规则，
        // 否则会把 334 个 id 列误报成漂移（实测: 修正前 334、修正后接近 0）。
        const expected = column.name === "id" || column.name.endsWith("_pk") ? "text" : expectedPgType(column.type)
        // 放宽: varchar 不限长度、numeric 与 integer 互认不算漂移（长度/精度差异不致命）
        if (real !== expected && !(expected === "character varying" && real === "text")) {
          drift += 1
          if (drift <= 25) console.log(`  ${config.table.name}.${column.name}: 元数据=${column.type}(${expected}) 实际=${real}`)
        }
      }
    }
  }
  console.log(`\n  检查 ${checked} 列，漂移 ${drift} 列；缺表 ${missingTables.length} 张${missingTables.length ? ` (${missingTables.slice(0, 5).join(", ")})` : ""}`)
  await client.end()
}

main().catch((error) => { console.error("[type-drift]", error.message); process.exit(1) })
