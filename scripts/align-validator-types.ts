/**
 * 按表元数据对齐生成校验器的字段类型（codemod，支持 dry-run）。
 *
 * 为什么需要：`*.validator.ts` 是**生成物**，而元数据（`scripts/data/*.ts`）会被后续修正
 * （补列、改类型映射…），生成物却可能停在旧版本。实测全仓 1117 处字段级类型不一致，
 * 其中「元数据是文本列、校验器却要求数字」会让**合法字符串输入被 schema 拒绝**。
 *
 * 为什么不能逐处手改：量大且会再漂移 —— 必须让"对齐"本身是个可重跑的动作。
 *
 * **有意约定不改**：`id`（主键）与元数据为数值型的 `*_id`（外键）保持 `z.string()`
 * —— ID 在 API 边界以字符串传输是本仓约定，不是漂移。它们会被计数但不改写。
 *
 * 用法:
 *   pnpm exec tsx scripts/align-validator-types.ts --domain ai            # dry-run（默认）
 *   pnpm exec tsx scripts/align-validator-types.ts --domain ai --write
 *   pnpm exec tsx scripts/align-validator-types.ts --domain ai --repo-columns   # 同时对齐仓储列集合
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const arg = (name: string) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : undefined
}
const domain = arg("--domain")
const write = argv.includes("--write")

/** 不参与类型对齐的列：审计底座字段（由框架统一处理） */
const NUMERIC_TYPES = new Set(["int", "bigint", "smallint", "decimal", "numeric", "float", "double", "double precision", "real"])

if (!domain && !argv.includes("--all")) {
  console.error("用法: pnpm exec tsx scripts/align-validator-types.ts (--domain <域> | --all) [--write]")
  process.exit(2)
}

/** 从元数据载入 表 -> 列 -> 类型 */
async function loadMetadata(): Promise<Map<string, Map<string, string>>> {
  const meta = new Map<string, Map<string, string>>()
  const dir = path.join(ROOT, "scripts", "data")
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".ts")) continue
    const mod = (await import(path.join(dir, file))) as Record<string, unknown>
    const list = Object.values(mod).find((value) => Array.isArray(value)) as
      | Array<{ table?: { name?: string; columns?: Array<{ name?: string; type?: string }> } }>
      | undefined
    for (const config of list ?? []) {
      const table = config?.table
      if (!table?.name) continue
      const columns = meta.get(table.name) ?? new Map<string, string>()
      for (const column of table.columns ?? []) if (column?.name) columns.set(column.name, column.type ?? "")
      meta.set(table.name, columns)
    }
  }
  return meta
}

/** 该域的表 -> 列 -> 类型（按插件目录定位表名） */
function domainTables(meta: Map<string, Map<string, string>>, pluginDir: string) {
  const tables = new Map<string, Map<string, string>>()
  const repoDir = path.join(pluginDir, "backend", "repositories")
  if (!fs.existsSync(repoDir)) return tables
  for (const file of fs.readdirSync(repoDir)) {
    if (!file.endsWith(".repository.ts")) continue
    const source = fs.readFileSync(path.join(repoDir, file), "utf8")
    const table = source.match(/const TABLE_NAME = "([^"]+)"/)?.[1]
    if (!table) continue
    const columns = meta.get(table)
    if (columns) tables.set(file.replace(".repository.ts", ""), columns)
  }
  return tables
}

/**
 * 给 PageQuerySchema 补上 `keyword`。
 *
 * 为什么：通用列表模板 `packages/shared/frontend/templates/admin-list-page.template.tsx`
 * 会发 `keyword`，而生成的 page schema 是 `.strict()` 且只含 `page/pageSize/筛选列` ——
 * 缺 `keyword` 会让**列表搜索框一打字就 400**。实测 339 份 page schema **全部**如此，
 * 已接线的 wms 正踩这个坑（`{"code":"unrecognized_keys","keys":["keyword"]}`）。
 */
function alignPageQueryKeyword(pluginDir: string, apply: boolean): number {
  const dir = path.join(pluginDir, "backend", "validators")
  if (!fs.existsSync(dir)) return 0
  let fixed = 0
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".validator.ts")) continue
    const full = path.join(dir, file)
    const source = fs.readFileSync(full, "utf8")
    const match = source.match(/export const (\w+PageQuerySchema) = z\.object\(\{([\s\S]*?)\}\)\.strict\(\)/)
    if (!match || match[2].includes("keyword")) continue
    const injected = `export const ${match[1]} = z.object({${match[2]}  keyword: z.string().trim().max(200).optional(),\n}).strict()`
    if (apply) fs.writeFileSync(full, source.replace(match[0], injected))
    fixed += 1
  }
  return fixed
}

async function main() {
  const meta = await loadMetadata()
  const pluginDir = path.join(ROOT, "packages", "plugins", `plugin-${domain}`)
  const validatorDir = path.join(pluginDir, "backend", "validators")
  if (!argv.includes("--all") && !fs.existsSync(validatorDir)) {
    console.error(`域 ${domain} 没有校验器目录: ${validatorDir}`)
    process.exit(2)
  }

  const all = argv.includes("--all")
  const targets = all
    ? [
        ...fs.readdirSync(path.join(ROOT, "packages", "plugins"))
          .filter((name) => name.startsWith("plugin-"))
          .map((name) => path.join(ROOT, "packages", "plugins", name)),
        ...fs.readdirSync(path.join(ROOT, "packages", "domains")).map((name) => path.join(ROOT, "packages", "domains", name)),
      ].filter((dir) => fs.existsSync(path.join(dir, "backend", "validators")))
    : [pluginDir]
  const tables = domainTables(meta, pluginDir)
  let changed = 0
  let convention = 0
  const details: string[] = []

  for (const targetDir of targets) {
  const dir = path.join(targetDir, "backend", "validators")
  if (!fs.existsSync(dir)) continue
  const domainTablesForDir = domainTables(meta, targetDir)
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".validator.ts")) continue
    const full = path.join(dir, file)
    const resource = file.replace(".validator.ts", "")
    const columns = domainTablesForDir.get(resource)
    if (!columns) continue

    let source = fs.readFileSync(full, "utf8")
    const original = source

    for (const match of source.matchAll(/^(\s{2})(\w+): (z\.coerce\.number\(\)(?:\.finite\(\))?|z\.string\(\)(?:\.trim\(\))?|z\.boolean\(\))/gm)) {
      const [, indent, column, current] = match
      const declared = columns.get(column)
      if (!declared || declared === "timestamp" || declared === "boolean") continue
      const expectsNumber = NUMERIC_TYPES.has(declared)
      const isNumber = current.startsWith("z.coerce.number")
      const isBoolean = current.startsWith("z.boolean")

      // 有意约定：ID 在 API 边界以字符串传输
      if (column === "id" || (column.endsWith("_id") && expectsNumber)) {
        convention += 1
        continue
      }
      if (isBoolean) continue // 布尔列不在本次对齐范围
      if (expectsNumber === isNumber) continue

      const replacement = expectsNumber ? "z.coerce.number().finite()" : "z.string().trim()"
      source = source.replace(`${indent}${column}: ${current}`, `${indent}${column}: ${replacement}`)
      changed += 1
      details.push(`${resource}.${column}: ${current.split("(")[0]} → 元数据 ${declared}（${replacement}）`)
    }

    if (source !== original && write) fs.writeFileSync(full, source)
  }
  }

  const keywordFixed = targets.reduce((sum, dir) => sum + alignPageQueryKeyword(dir, write), 0)
  const dtoFixed = targets.reduce((sum, dir) => sum + alignDtoTypes(dir, write, meta), 0)
  const formFixed = targets.reduce((sum, dir) => sum + alignFrontendForms(dir, write, meta), 0)
  const createFixed = targets.reduce((sum, dir) => sum + alignCreateSchemaColumns(dir, write, meta), 0)

  console.log(`[align-validators] 域 ${domain}${write ? "" : "（dry-run，加 --write 落盘）"}`)
  console.log(`  PageQuerySchema 补 keyword: ${keywordFixed} 处`)
  console.log(`  DTO 类型对齐: ${dtoFixed} 处`)
  console.log(`  前端表单对齐: ${formFixed} 处`)
  console.log(`  create schema 补可写列: ${createFixed} 处`)
  for (const detail of details) console.log(`  ${detail}`)
  console.log(`  需改: ${changed} 处 · 有意约定跳过: ${convention} 处`)
}

main().catch((error) => {
  console.error(`[align-validators] 执行失败: ${String(error?.stack ?? error)}`)
  process.exit(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// 产物链的其余环节：DTO 类型与前端表单（RSK-013）
//
// 与校验器同根：元数据单向流动、生成物停在旧版本。只对齐校验器而不同时处理这两者，
// 会出现「接线的一瞬间，今天能跑的数字输入变成 400」——因为表单仍发 number，
// 而 PG 的 text 列此前正是靠隐式转换兜住的。
//
// 两者必须**同时**对齐：只改 DTO 会让表单那行 `Number(...)` 变成 TS 类型错误。
// ─────────────────────────────────────────────────────────────────────────────

/** DTO 类型：文本列不得声明为 number */
function alignDtoTypes(targetDir: string, apply: boolean, meta: Map<string, Map<string, string>>): number {
  const typeDir = path.join(targetDir, "backend", "types")
  const repoDir = path.join(targetDir, "backend", "repositories")
  if (!fs.existsSync(typeDir) || !fs.existsSync(repoDir)) return 0

  const tableOf = new Map<string, string>()
  for (const file of fs.readdirSync(repoDir)) {
    if (!file.endsWith(".repository.ts")) continue
    const table = fs.readFileSync(path.join(repoDir, file), "utf8").match(/const TABLE_NAME = "([^"]+)"/)?.[1]
    if (table) tableOf.set(file.replace(".repository.ts", ""), table)
  }

  let changed = 0
  for (const file of fs.readdirSync(typeDir)) {
    if (!file.endsWith(".types.ts")) continue
    const columns = meta.get(tableOf.get(file.replace(".types.ts", "")) ?? "")
    if (!columns) continue
    const full = path.join(typeDir, file)
    const source = fs.readFileSync(full, "utf8")
    let next = source
    for (const match of source.matchAll(/^(\s{2})(\w+)(\??): (number|string)(;?)\s*$/gm)) {
      const [whole, indent, column, optional, current, semi] = match
      const declared = columns.get(column)
      if (!declared || declared === "timestamp" || declared === "boolean") continue
      if (column === "id" || (column.endsWith("_id") && NUMERIC_TYPES.has(declared))) continue
      const wantsNumber = NUMERIC_TYPES.has(declared)
      if (wantsNumber === (current === "number")) continue
      next = next.replace(whole, `${indent}${column}${optional}: ${wantsNumber ? "number" : "string"}${semi}`)
      changed += 1
    }
    if (next !== source && apply) fs.writeFileSync(full, next)
  }
  return changed
}

/** 前端表单：文本列不得用 number 输入与 Number() 转换 */
function alignFrontendForms(targetDir: string, apply: boolean, meta: Map<string, Map<string, string>>): number {
  const componentDir = path.join(targetDir, "frontend", "components")
  const repoDir = path.join(targetDir, "backend", "repositories")
  if (!fs.existsSync(componentDir) || !fs.existsSync(repoDir)) return 0

  const tableOf = new Map<string, string>()
  for (const file of fs.readdirSync(repoDir)) {
    if (!file.endsWith(".repository.ts")) continue
    const table = fs.readFileSync(path.join(repoDir, file), "utf8").match(/const TABLE_NAME = "([^"]+)"/)?.[1]
    if (table) tableOf.set(file.replace(".repository.ts", ""), table)
  }

  let changed = 0
  for (const file of fs.readdirSync(componentDir)) {
    if (!file.endsWith("Form.tsx")) continue
    const resource = file.replace("Form.tsx", "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
    const columns = meta.get(tableOf.get(resource) ?? "")
    if (!columns) continue
    const full = path.join(componentDir, file)
    let source = fs.readFileSync(full, "utf8")
    const original = source

    for (const [column, declared] of columns) {
      if (declared === "timestamp" || declared === "boolean") continue
      if (NUMERIC_TYPES.has(declared)) continue // 真数值列，保持原样
      if (column === "id" || (column.endsWith("_id") && NUMERIC_TYPES.has(declared))) continue

      const conversions = [
        // ① 输入控件类型
        [`            type="number"\n            id="${resource}-${column}"`, `            type="text"\n            id="${resource}-${column}"`],
        // ② 取值：String(...) → 原值
        [`value={formData.${column} != null ? String(formData.${column}) : ""}`, `value={formData.${column} ?? ""}`],
        // ③ 赋值：Number(...) → 原值
        [
          `{ ...prev, ${column}: e.target.value === "" ? undefined : Number(e.target.value) }`,
          `{ ...prev, ${column}: e.target.value }`,
        ],
      ]
      for (const [old, replacement] of conversions) {
        if (source.includes(old)) {
          source = source.replace(old, replacement)
          changed += 1
        }
      }
    }

    if (source !== original && apply) fs.writeFileSync(full, source)
  }
  return changed
}

// ─────────────────────────────────────────────────────────────────────────────
// 第四类缺口：create schema 必须覆盖仓储的「可写列」
//
// 校验器的 create schema 原先只按**表单列**生成，而仓储的可写列是**全部非审计列**。
// 于是不在表单里的列（如 ai_model.model_key / provider）API 根本传不进来 ——
// 而表要求它们非空，接线后创建必然失败。实测正是这一步把 ai-model 的路由测试打红。
// 真源取**仓储的 WRITABLE_COLUMNS**，与 `npm run repo:columns:check` 的口径一致。
// ─────────────────────────────────────────────────────────────────────────────

/** 按元数据类型给出 Zod 字段构造器（与生成器模板保持一致） */
function zodForType(declared: string): string {
  if (NUMERIC_TYPES.has(declared)) return "z.coerce.number().finite()"
  if (declared === "boolean") return "z.boolean()"
  return "z.string().trim()"
}

function alignCreateSchemaColumns(targetDir: string, apply: boolean, meta: Map<string, Map<string, string>>): number {
  const validatorDir = path.join(targetDir, "backend", "validators")
  const repoDir = path.join(targetDir, "backend", "repositories")
  if (!fs.existsSync(validatorDir) || !fs.existsSync(repoDir)) return 0

  let changed = 0
  for (const file of fs.readdirSync(validatorDir)) {
    if (!file.endsWith(".validator.ts")) continue
    const resource = file.replace(".validator.ts", "")
    const repoFile = path.join(repoDir, `${resource}.repository.ts`)
    if (!fs.existsSync(repoFile)) continue
    const repoSource = fs.readFileSync(repoFile, "utf8")
    const table = repoSource.match(/const TABLE_NAME = "([^"]+)"/)?.[1]
    const columns = table ? meta.get(table) : undefined
    if (!columns) continue
    const writable = (repoSource.match(/const WRITABLE_COLUMNS = \[([^\]]*)\]/)?.[1] ?? "")
      .split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean)
    if (writable.length === 0) continue

    const full = path.join(validatorDir, file)
    const source = fs.readFileSync(full, "utf8")
    const match = source.match(/export const (\w+CreateSchema) = z\.object\(\{([\s\S]*?)\n\}\)\.strict\(\)/)
    if (!match) continue
    const present = new Set([...match[2].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]))
    const missing = writable.filter((column) => !present.has(column))
    if (missing.length === 0) continue

    const injected = missing
      .map((column) => `  ${column}: ${zodForType(columns.get(column) ?? "varchar")}.optional(),`)
      .join("\n")
    const replacement = `export const ${match[1]} = z.object({${match[2]}\n${injected}\n}).strict()`
    if (apply) fs.writeFileSync(full, source.replace(match[0], replacement))
    changed += missing.length
  }
  return changed
}
