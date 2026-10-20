/**
 * 把元数据的 `nullable` 与**真实库**对齐（逐列）。
 *
 * 与 `fill-missing-columns.ts` 同一动机: 导入的元数据来自源框架，而表由更早的迁移建 ——
 * 两边会分叉，表现为"表里 NOT NULL、元数据说可空"，于是生成的测试不填它，
 * 真实库报 `null value in column "..." violates not-null constraint`。
 *
 * 逐列手改会没完没了（每次跑测试才暴露一个）——这里一次收敛全部。
 *
 * 用法: DATABASE_URL=... pnpm exec tsx scripts/sync-nullability.ts [--write]
 */
import fs from "node:fs"
import path from "node:path"
import { Client } from "pg"

const ROOT = path.resolve(__dirname, "..")
const write = process.argv.includes("--write")
const DOMAINS = ["ai", "bpm", "crm", "erp", "im", "iot", "mall", "member", "mes", "mp", "pay", "report"]

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  let changed = 0

  for (const domain of DOMAINS) {
    const file = path.join(ROOT, "scripts", "data", `${domain}-source-tables.ts`)
    if (!fs.existsSync(file)) continue
    const mod = require(file) as Record<string, Array<{ table: { name: string } }>>
    const configs = mod[`${domain.toUpperCase()}_TABLES`]
    if (!Array.isArray(configs)) continue

    for (const config of configs) {
      const rows = await client.query<{ column_name: string; is_nullable: string }>(
        `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = $1`,
        [config.table.name],
      )
      if (rows.rows.length === 0) continue
      const notNull = new Set(rows.rows.filter((r) => r.is_nullable === "NO").map((r) => r.column_name))
      if (notNull.size === 0) continue

      const lines = fs.readFileSync(file, "utf8").split("\n")
      const tbl = lines.findIndex((l) => l === `      "name": "${config.table.name}",`)
      if (tbl < 0) continue
      let touched = false
      for (let i = tbl + 1; i < lines.length; i++) {
        if (lines[i] === "      ]") break
        const m = lines[i].match(/^          "name": "([a-z0-9_]+)",$/)
        if (!m) continue
        const column = m[1]
        // 该列的 nullable 行（紧随其后）
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          if (lines[j].startsWith('          "name":')) break
          if (lines[j].trim() === '"nullable": true,' && notNull.has(column)) {
            lines[j] = lines[j].replace('"nullable": true,', '"nullable": false,')
            changed += 1
            touched = true
            break
          }
        }
      }
      if (touched && write) fs.writeFileSync(file, lines.join("\n"))
    }
  }
  console.log(`  ${write ? "已对齐" : "可对齐"} ${changed} 列的可空性`)
  await client.end()
}

main().catch((error) => { console.error("[sync-nullability]", error.message); process.exit(1) })
