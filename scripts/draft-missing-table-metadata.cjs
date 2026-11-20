/**
 * 为"有仓储查询、却没有元数据"的表导出**待评审**的元数据草稿。
 *
 * ⚠️ 本工具的输出**不会**、也**不得**直接进 `scripts/data/` —— 那是表定义真源，
 * 直接落进去等于凭空造 schema 并自动生成迁移。正确姿势是: 人看草稿、改对类型、
 * 再手工写进 `scripts/data/<x>-tables.ts`。
 *
 * 草稿的依据是**代码里已有的声明**，不是猜测：
 *   1. 仓储导出的行接口（`export interface XxxRow { ... }`）—— 列名 + TS 类型；
 *   2. Kysely 调用里出现的 snake_case 列引用（`where("tenant_id", ...)`）。
 * 但 TS 类型不足以确定 PG 类型（`number` 可能是 int 也可能是 decimal；
 * `createdAt: string` 语义上是 timestamp）—— 所以这些地方标 `?` 交给人判断。
 *
 * 用法：node scripts/draft-missing-table-metadata.cjs
 */
const fs = require("fs")
const path = require("path")

const { ROOT, readMetadataTables, readMigrationTables, readSqliteBootstrapTables, readPrismaTables, readQueriedTables } =
  require("./lib/table-definitions.cjs")

const ARTIFACT = path.join(ROOT, "packages", "shared", "contract", "gate-assets", "table-metadata-draft.md")

/** 已知欠债（与 check-engineering-standards 的 table-definition-coverage 规则保持一致）。 */
const KNOWN_DEBT = [
  // 当前为空 —— 见 check-engineering-standards.cjs 的 table-definition-coverage 规则注释。
]

/** 找出查询该表的仓储文件。 */
function findRepositories(table) {
  const hits = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.name.endsWith(".repository.ts")) continue
      const source = fs.readFileSync(full, "utf8")
      if (source.includes(`"${table}"`) || source.includes(`'${table}'`)) hits.push(full)
    }
  }
  walk(path.join(ROOT, "packages"))
  return hits
}

/** camelCase 推断 snake_case（与 codegen 的列名约定一致）。 */
const toSnake = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()

/** TS 类型 → PG 类型的**建议**（不确定的加 ? 让人复核）。 */
function suggestPgType(fieldName, tsType) {
  const snake = toSnake(fieldName)
  if (snake === "id") return "TEXT"
  if (tsType === "boolean") return "BOOLEAN"
  if (tsType === "number") {
    // 计数/额度类几乎都是整数；比率/金额类通常是小数 —— 这里只能给建议。
    return /ratio|rate|price|amount|balance|commission/.test(snake) ? "DECIMAL(18,4) ?" : "INTEGER ?"
  }
  if (snake.endsWith("_at") || snake.endsWith("_time")) return "TIMESTAMP(3) ?"
  return "VARCHAR(255)"
}

function draftForTable(table) {
  const repos = findRepositories(table)
  if (repos.length === 0) return { table, columns: [], note: "找不到查询该表的仓储（可能只在 service 里出现）" }

  const source = repos.map((file) => fs.readFileSync(file, "utf8")).join("\n")

  // 行接口: export interface XxxRow { field: type ... }
  const iface = source.match(/export interface \w+Row\s*\{([\s\S]*?)\n\}/)
  const columns = []
  if (iface) {
    for (const line of iface[1].split("\n")) {
      const match = line.match(/^\s*(\w+)\??:\s*([^;]+);?/)
      if (!match) continue
      const [, field, rawType] = match
      // `"A" | "B"` 这类字面量联合是 VARCHAR；其余取基础类型。
      const tsType = rawType.includes("|")
        ? "string"
        : rawType.trim().replace(/\[\]$/, "").replace(/\s/g, "")
      columns.push({ column: toSnake(field), pg: suggestPgType(field, tsType), ts: tsType })
    }
  }

  // 接口没覆盖到的列（Kysely 里显式引用过）
  const referenced = new Set()
  for (const match of source.matchAll(/\.(?:where|set|orderBy)\("([a-z0-9_]+)"/g)) referenced.add(match[1])
  const known = new Set(columns.map((column) => column.column))
  for (const column of referenced) {
    if (!known.has(column) && column !== "id") columns.push({ column, pg: "? 需确认", ts: "未知（仅查询里出现）" })
  }
  return { table, columns, repos: repos.map((file) => path.relative(ROOT, file).replace(/\\/g, "/")) }
}

function main() {
  const created = new Set([
    ...readMetadataTables(),
    ...readMigrationTables(),
    ...readSqliteBootstrapTables(),
    ...readPrismaTables(),
  ])
  const missing = [...readQueriedTables()].filter((table) => !created.has(table)).sort()
  const unknown = missing.filter((table) => !KNOWN_DEBT.includes(table))

  const lines = [
    "# 表元数据草稿（待评审，**未接入**）",
    "",
    "> 由 `node scripts/draft-missing-table-metadata.cjs` 生成，**请勿直接使用**。",
    "> 本仓表定义真源是低代码元数据（AGENTS §9.5）：评审通过后手工写入",
    "> `scripts/data/<x>-tables.ts`，再用 `scripts/generate-table-migration.ts` 生成迁移。",
    "> 之所以只是草稿: TS 类型不足以确定 PG 类型（`number` 可能是 int 也可能是 decimal；",
    "> `createdAt: string` 语义上是 timestamp），标 `?` 处需人工判断。",
    "",
    `生成时间: ${new Date().toISOString()}`,
    "",
  ]

  for (const table of missing) {
    const draft = draftForTable(table)
    const debt = KNOWN_DEBT.includes(table) ? "（已在门禁的已知欠债列表中）" : "（**新增缺口**）"
    lines.push(`## ${table} ${debt}`, "")
    if (draft.note) {
      lines.push(`- ${draft.note}`, "")
      continue
    }
    lines.push(`来源仓储: ${draft.repos.map((file) => `\`${file}\``).join(", ")}`, "")
    lines.push("| 列 | 建议 PG 类型 | 依据 |", "|---|---|---|")
    for (const column of draft.columns) lines.push(`| \`${column.column}\` | \`${column.pg}\` | ${column.ts} |`)
    lines.push("", "待确认: 主键、NOT NULL 约束、默认值、索引、审计底座字段是否齐全。", "")
  }

  fs.mkdirSync(path.dirname(ARTIFACT), { recursive: true })
  fs.writeFileSync(ARTIFACT, lines.join("\n"))
  console.log(`[table-metadata-draft] ${missing.length} 张表 -> ${path.relative(ROOT, ARTIFACT)}`)
  if (unknown.length > 0) console.log(`  ⚠ 其中 ${unknown.length} 张**不在**已知欠债列表: ${unknown.join(", ")}`)
}

main()
