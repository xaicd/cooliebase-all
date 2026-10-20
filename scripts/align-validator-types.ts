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
 *   npx tsx scripts/align-validator-types.ts --domain ai            # dry-run（默认）
 *   npx tsx scripts/align-validator-types.ts --domain ai --write
 *   npx tsx scripts/align-validator-types.ts --domain ai --repo-columns   # 同时对齐仓储列集合
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
  console.error("用法: npx tsx scripts/align-validator-types.ts (--domain <域> | --all) [--write]")
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

  console.log(`[align-validators] 域 ${domain}${write ? "" : "（dry-run，加 --write 落盘）"}`)
  console.log(`  PageQuerySchema 补 keyword: ${keywordFixed} 处`)
  for (const detail of details) console.log(`  ${detail}`)
  console.log(`  需改: ${changed} 处 · 有意约定跳过: ${convention} 处`)
}

main().catch((error) => {
  console.error(`[align-validators] 执行失败: ${String(error?.stack ?? error)}`)
  process.exit(1)
})
