/**
 * 补齐「**表里有、元数据里没有**」的列。
 *
 * 为什么需要: 导入的元数据来自源框架，而库里的表由**更早的迁移**建 —— 两边会分叉:
 * 表里某些 NOT NULL 列，元数据里根本没登记。生成的测试自然不会填它们，
 * 真实库就 `null value in column "..." violates not-null constraint`。
 *
 * 逐列手补会没完没了（每次跑测试才暴露一个）。这里一次枚举全部：
 * 连真实库、逐表比对 information_schema 与元数据，把缺的列补进元数据。
 *
 * 用法: DATABASE_URL=... pnpm exec tsx scripts/fill-missing-columns.ts [--write]
 */
import fs from "node:fs"
import path from "node:path"
import { Client } from "pg"

const ROOT = path.resolve(__dirname, "..")
const write = process.argv.includes("--write")
const DOMAINS = ["ai", "bpm", "crm", "erp", "im", "iot", "mall", "member", "mes", "mp", "pay", "report"]

/** PG data_type -> 元数据类型 */
function toMetaType(dataType: string): { type: string; tsType: string } {
  if (dataType === "integer" || dataType === "smallint") return { type: "int", tsType: "number" }
  if (dataType === "bigint") return { type: "bigint", tsType: "number" }
  if (dataType === "boolean") return { type: "boolean", tsType: "boolean" }
  if (dataType.startsWith("timestamp")) return { type: "timestamp", tsType: "string" }
  if (dataType === "numeric" || dataType.startsWith("numeric")) return { type: "decimal", tsType: "number" }
  // `double precision` / `real` 曾落到默认分支被当成 varchar —— 于是元数据说字符串、
  // 物理列是浮点，生成的值写进去真实库直接 `invalid input syntax for type double precision`
  // （实测 ai_model.input_ratio / output_ratio）。内存回退不校验类型，所以只有真实库暴露。
  if (dataType === "double precision" || dataType === "real") return { type: "decimal", tsType: "number" }
  if (dataType === "text") return { type: "text", tsType: "string" }
  return { type: "varchar", tsType: "string" }
}

const MANAGED = new Set(["tenant_id", "created_by", "created_at", "updated_by", "updated_at", "deleted"])

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  let added = 0

  for (const domain of DOMAINS) {
    const file = path.join(ROOT, "scripts", "data", `${domain}-source-tables.ts`)
    if (!fs.existsSync(file)) continue
    const mod = require(file) as Record<string, Array<{ className: string; table: { name: string; columns: Array<{ name: string }> } }>>
    const configs = mod[`${domain.toUpperCase()}_TABLES`]
    if (!Array.isArray(configs)) continue

    for (const config of configs) {
      const rows = await client.query<{ column_name: string; data_type: string; is_nullable: string; character_maximum_length: number | null }>(
        `SELECT column_name, data_type, is_nullable, character_maximum_length FROM information_schema.columns WHERE table_name = $1`,
        [config.table.name],
      )
      if (rows.rows.length === 0) continue
      const declared = new Set(config.table.columns.map((column) => column.name))
      const missing = rows.rows.filter((row) => !declared.has(row.column_name))
      if (missing.length === 0) continue
      console.log(`  ${config.table.name}: 缺 ${missing.length} 列 (${missing.map((m) => m.column_name).join(", ")})`)
      if (!write) continue
      // 直接改文件: 在该表 columns 数组结束的 "]" 前插入这些列
      const lines = fs.readFileSync(file, "utf8").split("\n")
      const tbl = lines.findIndex((l) => l === `      "name": "${config.table.name}",`)
      if (tbl < 0) continue
      const end = lines.findIndex((l, i) => i > tbl && l === "      ]")
      if (end < 0) continue
      const block: string[] = []
      for (const row of missing) {
        const mapped = toMetaType(row.data_type)
        // 托管列不写进元数据（由平台统一处理），其余原样登记
        block.push("        {", `          "name": "${row.column_name}",`, `          "type": "${mapped.type}",`,
          `          "tsType": "${mapped.tsType}",`, `          "nullable": ${row.is_nullable === "NO" ? "false" : "true"},`,
          // 记下长度上限：生成器要按它生成"塞得进去"的测试值，
          // 漏掉它就会生成超长字符串，真实库报 `value too long for type character varying(N)`。
          ...(row.character_maximum_length ? [`          "maxLength": ${row.character_maximum_length},`] : []),
          `          "comment": "表里已有、元数据此前未登记",`, "          \"nullableInferred\": true", "        },")
      }
      lines.splice(end, 0, ...block)
      fs.writeFileSync(file, lines.join("\n"))
      added += missing.length
    }
  }
  console.log(`\n  ${write ? "已补" : "可补"} ${added} 列`)
  await client.end()
}

main().catch((error) => { console.error("[fill-columns]", error.message); process.exit(1) })
