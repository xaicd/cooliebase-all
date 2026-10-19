/**
 * 生成仓储的列集合 vs 元数据 —— 逐表比对，缺列即失败（门禁）。
 *
 * 为什么需要（两类实测踩过的坑，内存模式全都看不见）：
 *
 * 1. **元数据加了列，生成物没跟上**
 *    `ai_chat_message` 的 `role` / `tokens` 早已补进元数据（注释写着"表里已有、元数据此前未登记"），
 *    但 `TABLE_COLUMNS` 还是旧的 → 真实库 `null value in column "role" violates not-null constraint`。
 *    同一批还有 `ai_model`（缺 model_key/provider/input_ratio/output_ratio/description）、
 *    `ai_chat_conversation`（缺 system_prompt）。
 *
 * 2. **可写列不在表列里 = 写入被静默丢弃**
 *    `persistable()` 按 `WRITABLE_COLUMNS` 收字段，`dbValues()` 又按 `TABLE_COLUMNS` **二次过滤**。
 *    若某列只在 `WRITABLE_COLUMNS` 而不在 `TABLE_COLUMNS`，入库前会被悄悄删掉 ——
 *    实测补 `role` 到 `WRITABLE_COLUMNS` 后仍然报 NULL，就是因为漏了另一半。
 *    这种"收下了但写不进去"比直接报错更难查，故单列一条断言。
 *
 * 与 `scripts/report-type-drift.ts` 的分工：那个连真实库比**列类型**（需 DB、只报告）；
 * 本脚本纯离线比**列集合**（进 `npm run check`，缺列即失败）。
 *
 * 用法: npx tsx scripts/check-repository-column-coverage.ts [--audit]
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "..")
const audit = process.argv.includes("--audit")
const DOMAINS = ["ai", "bpm", "crm", "erp", "im", "iot", "mall", "member", "mes", "mp", "pay", "report", "system"]

/** 从元数据导出表 -> 列名集合 */
async function loadMetadata(): Promise<Map<string, Set<string>>> {
  const meta = new Map<string, Set<string>>()
  for (const domain of DOMAINS) {
    const file = path.join(ROOT, "scripts", "data", `${domain}-source-tables.ts`)
    if (!fs.existsSync(file)) continue
    const mod = (await import(file)) as Record<string, unknown>
    const list = Object.values(mod).find((value) => Array.isArray(value)) as
      | Array<{ table?: { name?: string; columns?: Array<{ name?: string }> } }>
      | undefined
    for (const config of list ?? []) {
      const table = config?.table
      if (!table?.name) continue
      const columns = meta.get(table.name) ?? new Set<string>()
      for (const column of table.columns ?? []) if (column?.name) columns.add(column.name)
      meta.set(table.name, columns)
    }
  }
  return meta
}

function parseList(source: string, name: string): string[] | null {
  const match = source.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))
  if (!match) return null
  return match[1]
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue
      walk(full, out)
    } else if (entry.name.endsWith(".repository.ts")) {
      out.push(full)
    }
  }
  return out
}

async function main() {
  const meta = await loadMetadata()
  const repos = walk(path.join(ROOT, "packages"))
  const missingColumns: string[] = []
  const droppedWritable: string[] = []
  let comparable = 0

  for (const file of repos) {
    const source = fs.readFileSync(file, "utf8")
    const tableName = source.match(/const TABLE_NAME = "([^"]+)"/)?.[1]
    const tableColumns = parseList(source, "TABLE_COLUMNS")
    const writableColumns = parseList(source, "WRITABLE_COLUMNS")
    if (!tableName || !tableColumns) continue

    const rel = path.relative(ROOT, file)

    // ② 可写列必须真能落库（否则写入被 dbValues() 静默丢弃）
    for (const column of writableColumns ?? []) {
      if (!tableColumns.includes(column)) {
        droppedWritable.push(`  ${rel}\n     可写列 "${column}" 不在 TABLE_COLUMNS 里 —— 写入会在入库前被丢弃`)
      }
    }

    // ① 元数据有的列，生成物也得有（不然服务永远写不进去）
    const declared = meta.get(tableName)
    if (!declared) continue
    comparable++
    const missing = [...declared].filter((column) => !tableColumns.includes(column))
    if (missing.length > 0) {
      missingColumns.push(`  ${tableName} (${rel})\n     缺: ${missing.join(", ")}`)
    }
  }

  if (audit) {
    console.log(`[repo-columns] 审计: 元数据 ${meta.size} 张表 · 可比对仓储 ${comparable} / ${repos.length}`)
    console.log(`[repo-columns] 缺列: ${missingColumns.length} · 可写列被丢弃: ${droppedWritable.length}`)
    for (const item of [...missingColumns, ...droppedWritable]) console.log(item)
    return
  }

  if (missingColumns.length > 0 || droppedWritable.length > 0) {
    console.error(
      `[repo-columns] FAIL: 生成仓储与元数据不一致 —— ${missingColumns.length} 张表缺列、` +
        `${droppedWritable.length} 处可写列会被丢弃\n`,
    )
    for (const item of [...missingColumns, ...droppedWritable]) console.error(item)
    console.error(
      "\n修法: 让仓储的 TABLE_COLUMNS 覆盖元数据声明的全部列（列真源是 scripts/data/*-tables.ts），" +
        "并确保 WRITABLE_COLUMNS ⊆ TABLE_COLUMNS。\n" +
        "这类缺陷在内存回退下**完全不可见**（不校验列与约束），只在真实库上暴露。\n",
    )
    process.exit(1)
  }

  console.log(
    `[repo-columns] PASS: ${comparable} 个生成仓储的列集合均覆盖元数据，` +
      `且所有可写列都能落库（元数据 ${meta.size} 张表）`,
  )
}

main().catch((error) => {
  console.error(`[repo-columns] 执行失败: ${String(error?.stack ?? error)}`)
  process.exit(1)
})
