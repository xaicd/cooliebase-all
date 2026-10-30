#!/usr/bin/env node
/**
 * `align:validators` —— 让生成的 `*CreateSchema` 的**必填集合**与**物理 schema** 一致。
 *
 * ## 为什么
 *
 * 本仓的校验器是 codegen 生成物，而生成它的 `codegen import payload` **不在本仓树内**
 * （无 codegen 表、无 metadata JSON，`table-metadata-draft.md` 只是缺失报告）。
 * 于是「生成物无可对账的真源」——本轮实测 `313/342` 的 create 接受空 `{}`，
 * 其中 `ai_api_key.name` 是物理 NOT NULL，直插数据库直接 **500**。
 *
 * 这里把**物理 schema 作为真源**（离线可读：`prisma/migrations/**\/*.sql`），
 * 与插件路由/侧栏导航同一范式：**物理真值 → 生成 → `--check` 棘轮**。
 *
 * ## 判定（与 `codegen-templates/validator.template.ts` 同口径）
 *   必填 ⇔ 列 `NOT NULL` 且**无默认值** 且**非托管列**
 *   （托管列 = id / tenant_id / created_by / creator / updated_by / updater /
 *     created_at / create_time / updated_at / update_time / deleted）
 *
 * ## 保守原则
 * 只改写三种可识别的 zod 表达式（string / number / boolean）；其他形态（JSON、enum、
 * 自定义 preprocess）**原样保留并报告跳过** —— 宁可少改，不可改错。
 *
 * ## 用法
 *   node scripts/align-validators-to-schema.mjs --check    # CI 棘轮
 *   node scripts/align-validators-to-schema.mjs --write    # 落盘
 *   node scripts/align-validators-to-schema.mjs            # dry-run 打印漂移
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MIGRATIONS = path.join(ROOT, "prisma", "migrations")

/** 与 codegen-templates/common.ts 的 MANAGED_COLUMNS 保持一致。 */
const MANAGED_COLUMNS = new Set([
  "id", "tenant_id", "created_by", "creator", "updated_by", "updater",
  "created_at", "create_time", "updated_at", "update_time", "deleted",
])

function parseSchema() {
  const tables = new Map() // table -> Map(col -> { notNull, hasDefault })
  if (!fs.existsSync(MIGRATIONS)) return tables
  const files = fs
    .readdirSync(MIGRATIONS)
    .filter((name) => fs.existsSync(path.join(MIGRATIONS, name, "migration.sql")))
    .sort()

  const readColumnLine = (line) => {
    const m = /^\s*"?([a-zA-Z0-9_]+)"?\s+([A-Z][A-Z0-9_ ()[\]0-9,]*)/.exec(line)
    if (!m) return null
    const [, name, rest] = m
    if (["CONSTRAINT", "PRIMARY", "UNIQUE", "FOREIGN", "INDEX", "CHECK"].includes(name.toUpperCase())) return null
    return {
      name,
      notNull: /\bNOT\s+NULL\b/i.test(rest),
      hasDefault: /\bDEFAULT\b/i.test(rest),
    }
  }

  const addColumn = (table, column) => {
    if (!tables.has(table)) tables.set(table, new Map())
    tables.get(table).set(column.name, column)
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, file, "migration.sql"), "utf8")
    // CREATE TABLE [IF NOT EXISTS] "<t>" ( ... );
    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"\s*\(([\s\S]*?)\n\);/gi
    let m
    while ((m = createRe.exec(sql)) !== null) {
      for (const line of m[2].split("\n")) {
        const column = readColumnLine(line)
        if (column) addColumn(m[1], column)
      }
    }
    // ALTER TABLE "<t>" ADD COLUMN [IF NOT EXISTS] "<col>" ...;
    const alterRe = /ALTER\s+TABLE\s+"([^"]+)"\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"([^;]*);/gi
    while ((m = alterRe.exec(sql)) !== null) {
      addColumn(m[1], {
        name: m[2],
        notNull: /\bNOT\s+NULL\b/i.test(m[3]),
        hasDefault: /\bDEFAULT\b/i.test(m[3]),
      })
    }
  }
  return tables
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue
      walk(full, out)
    } else if (entry.name.endsWith(".validator.ts")) {
      out.push(full)
    }
  }
  return out
}

/** 校验器 ↔ 表：同域仓储目录里同名 `.repository.ts` 的 `const TABLE_NAME = "..."`。 */
function tableForValidator(file) {
  // validators/ 与 repositories/ 是**并列目录**（不是在同一个目录里）
  const repo = file
    .replace(`${path.sep}validators${path.sep}`, `${path.sep}repositories${path.sep}`)
    .replace(/\.validator\.ts$/, ".repository.ts")
  if (!fs.existsSync(repo)) return null
  const matched = /const TABLE_NAME = "([^"]+)"/.exec(fs.readFileSync(repo, "utf8"))
  return matched ? matched[1] : null
}

/** 保守重写单个别名字段；返回 null 表示"形态不认识，跳过"。 */
function rewriteField(expr, required, columnName) {
  const trimmed = expr.trim()
  const isOptional = trimmed.endsWith(".optional()")
  const base = isOptional ? trimmed.slice(0, -".optional()".length) : trimmed

  if (base.startsWith("z.unknown(")) return null // JSON 列不参与
  if (!/^z\.(string\(\)\.trim\(\)|coerce\.number\(\)\.finite\(\)|preprocess\()/.test(base)) return null

  if (!required) return `${base}.optional()`
  if (base.startsWith("z.string().trim()")) {
    // **幂等**：已经带 `.min(1, …)` 的不再追加（否则每跑一次就多一层）
    if (/z\.string\(\)\.trim\(\)\.min\(1,/.test(base)) return base
    return base.replace("z.string().trim()", `z.string().trim().min(1, "${columnName} 不能为空")`)
  }
  return base // number / boolean：去掉 optional 即可
}

function alignFile(file, tables) {
  const table = tableForValidator(file)
  if (!table || !tables.has(table)) return { file, table, changes: [], skipped: [], unknownTable: true }
  const columns = tables.get(table)
  const source = fs.readFileSync(file, "utf8")
  const blockRe = /(export const \w+CreateSchema = z\.object\(\{)([\s\S]*?)(\n\}\)\.strict\(\))/
  const matched = blockRe.exec(source)
  if (!matched) return { file, table, changes: [], skipped: [], noBlock: true }

  const changes = []
  const skipped = []
  const body = matched[2]
    .split("\n")
    .map((line) => {
      const field = /^(\s+)([a-zA-Z0-9_]+):\s*(.+?),\s*$/.exec(line)
      if (!field) return line
      const [, indent, name, expr] = field
      const column = columns.get(name)
      if (!column) {
        skipped.push(`${name}(列不存在)`)
        return line
      }
      const required = column.notNull && !column.hasDefault && !MANAGED_COLUMNS.has(name.toLowerCase())
      const next = rewriteField(expr, required, name)
      if (next === null) {
        skipped.push(`${name}(形态不识别)`)
        return line
      }
      if (next !== expr.trim()) changes.push(`${name}: ${required ? "→ 必填" : "→ 可选"}`)
      return `${indent}${name}: ${next},`
    })
    .join("\n")

  const nextSource = source.slice(0, matched.index) + matched[1] + body + matched[3] + source.slice(matched.index + matched[0].length)
  return { file, table, changes, skipped, nextSource, changed: nextSource !== source }
}

function main() {
  const write = process.argv.includes("--write")
  const check = process.argv.includes("--check")
  const tables = parseSchema()
  if (tables.size === 0) {
    console.error("[align-validators] ✗ 没解析出任何物理表 —— 判据失效，拒绝静默通过")
    process.exit(2)
  }

  const files = walk(path.join(ROOT, "packages"), [])
  let changedFiles = 0
  let totalChanges = 0
  const unknown = []
  const skippedAll = []

  for (const file of files) {
    const result = alignFile(file, tables)
    if (result.unknownTable) unknown.push(path.relative(ROOT, file))
    if (result.skipped?.length) skippedAll.push(...result.skipped.map((s) => `${path.basename(file)}:${s}`))
    if (!result.changed) continue
    changedFiles += 1
    totalChanges += result.changes.length
    if (write) {
      fs.writeFileSync(file, result.nextSource, "utf8")
    } else if (!check) {
      console.log(`[align-validators] ${path.relative(ROOT, file)} (${result.table}): ${result.changes.join(", ")}`)
    }
  }

  console.log(`\n[align-validators] 物理表 ${tables.size} 张 · 校验器 ${files.length} 个 · 漂移文件 ${changedFiles} · 字段改写 ${totalChanges}`)
  if (unknown.length) console.log(`[align-validators] 未映射到物理表的校验器 ${unknown.length} 个（跳过）`)
  if (skippedAll.length) console.log(`[align-validators] 形态不识别/列缺失而跳过 ${skippedAll.length} 处`)

  if (write) {
    console.log(`[align-validators] ✅ 已写入 ${changedFiles} 个文件`)
    return 0
  }
  if (check) {
    if (changedFiles === 0) {
      console.log("[align-validators] PASS: 生成的 create 校验器与物理 schema 一致")
      return 0
    }
    console.error(`[align-validators] ✗ ${changedFiles} 个校验器与物理 schema 不一致 —— 跑 \`pnpm run align:validators\``)
    return 1
  }
  return 0
}

process.exit(main())
