/**
 * RSK-011 可达性收敛（**只报告，不改代码、不作门禁**）。
 *
 * 背景：比对 323 份生成校验器与表元数据，得到 1117 处字段级类型不一致
 * （794 处「元数据是文本列、校验器却要求数字」+ 323 处 `id` 字符串化有意约定）。
 * 但**漂移不等于会被触发** —— 必须先回答「这些校验器到底会不会被调用」，否则会拿着
 * 一个吓人的数字盲改 794 处（本仓已两次踩过"过头结论"的亏，见 RSK-011 订正记录）。
 *
 * 本脚本枚举校验器的**真实消费路径**，输出三桶：
 *
 *   A. **broker 可达**：该校验器导出的 schema 出现在 `rpc-actions.json` 的 action 里
 *      —— 跨域调用会经 broker 用它校验，真实可达；
 *   B. **路由可达**：被某个路由文件 import **且该文件真的调用 `.parse(` / `safeParse(`**；
 *   C. **当前不可达**：既不在 broker 目录里，也没有路由在 parse —— 属生成但未被接线的产物。
 *
 * 另有**有意约定**单列（`id` / 数值型 `*_id`），不计入缺陷。
 *
 * 用法: pnpm exec tsx scripts/report-validator-reachability.ts
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "..")
const NUMERIC = new Set(["int", "bigint", "smallint", "decimal", "numeric", "float", "double"])

/** 表 -> 列 -> 元数据类型 */
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

function walk(dir: string, filter: (name: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue
      walk(full, filter, out)
    } else if (filter(entry.name)) {
      out.push(full)
    }
  }
  return out
}

/** 收集 rpc-actions.json 里所有 action 用到的 schema 名 */
function brokerSchemas(): Set<string> {
  const file = path.join(ROOT, "packages", "shared", "backend", "constants", "rpc-actions.json")
  const catalog = JSON.parse(fs.readFileSync(file, "utf8")) as {
    domains?: Record<string, { actions?: Array<{ schema?: string }> }>
  }
  const names = new Set<string>()
  for (const domain of Object.values(catalog.domains ?? {})) {
    for (const action of domain.actions ?? []) if (action.schema) names.add(action.schema)
  }
  return names
}

/** 导出且被路由 parse 的文件集合 */
function routeParsingFiles(): Set<string> {
  const files = [
    ...walk(path.join(ROOT, "src"), (n) => n.endsWith(".ts") || n.endsWith(".tsx")),
    ...walk(path.join(ROOT, "packages", "plugins"), (n) => n.endsWith(".ts") || n.endsWith(".tsx")),
  ]
  const result = new Set<string>()
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8")
    if (/\.safe?Parse\(|\.parse\(/.test(source)) result.add(path.relative(ROOT, file))
  }
  return result
}

async function main() {
  const meta = await loadMetadata()
  const broker = brokerSchemas()
  const parsers = routeParsingFiles()
  const validators = walk(path.join(ROOT, "packages"), (n) => n.endsWith(".validator.ts"))

  const buckets: Record<string, string[]> = {
    "broker 可达（真实）": [],
    "路由可达（真实）": [],
    "当前不可达（生成但未接线）": [],
    "有意约定（id 字符串化，非缺陷）": [],
  }
  let driftedTotal = 0

  for (const file of validators) {
    const source = fs.readFileSync(file, "utf8")
    const rel = path.relative(ROOT, file)
    const repoPath = file.replace("/validators/", "/repositories/").replace(".validator.ts", ".repository.ts")
    const table = fs.existsSync(repoPath)
      ? fs.readFileSync(repoPath, "utf8").match(/const TABLE_NAME = "([^"]+)"/)?.[1]
      : undefined
    const columns = table ? meta.get(table) : undefined
    if (!columns) continue

    // 漂移字段
    const drifted: Array<{ column: string; declared: string; zod: string }> = []
    for (const match of source.matchAll(/^\s{2}(\w+): (z\.coerce\.number\(\)|z\.string\(\))/gm)) {
      const [, column, zod] = match
      const declared = columns.get(column)
      if (!declared || declared === "timestamp" || declared === "boolean") continue
      if (NUMERIC.has(declared) !== (zod === "z.coerce.number()")) drifted.push({ column, declared, zod })
    }
    if (drifted.length === 0) continue
    driftedTotal += drifted.length

    // 可达性判定
    const exported = [...source.matchAll(/export const (\w+) =/g)].map((m) => m[1])
    const isBroker = exported.some((name) => broker.has(name))
    const isRoute = [...parsers].some((consumer) => {
      if (!fs.existsSync(path.join(ROOT, consumer))) return false
      return fs.readFileSync(path.join(ROOT, consumer), "utf8").includes(path.basename(file).replace(".ts", ""))
    })

    for (const item of drifted) {
      const idLike = item.column === "id" || (item.column.endsWith("_id") && NUMERIC.has(item.declared))
      const label = `${table}.${item.column} (元数据 ${item.declared} ↔ ${item.zod})`
      if (idLike) buckets["有意约定（id 字符串化，非缺陷）"].push(label)
      else if (isBroker) buckets["broker 可达（真实）"].push(label)
      else if (isRoute) buckets["路由可达（真实）"].push(label)
      else buckets["当前不可达（生成但未接线）"].push(label)
    }
  }

  console.log("[validator-reachability] RSK-011 可达性收敛（报告，非门禁）")
  console.log(`  漂移字段总数: ${driftedTotal}`)
  for (const [name, items] of Object.entries(buckets)) {
    console.log(`  ${name}: ${items.length}`)
  }
  console.log("\n  真实可达 = broker + 路由 =", buckets["broker 可达（真实）"].length + buckets["路由可达（真实）"].length)
  for (const name of ["broker 可达（真实）", "路由可达（真实）"]) {
    const items = buckets[name]
    if (items.length > 0) {
      console.log(`\n  ${name} 样例:`)
      for (const item of items) console.log(`    ${item}`)
    }
  }

  await reportArtifactChain(meta)
}

main().catch((error) => {
  console.error(`[validator-reachability] 执行失败: ${String(error?.stack ?? error)}`)
  process.exit(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// 附：产物链的其余环节（同一根源、同样会漂移）
//
// RSK-011 最初只看校验器，但同一条"元数据单向流动、生成物停在旧版本"的根因还污染了：
//   · `backend/types/*.types.ts` 的 DTO 类型（前端据此决定是否转数字）
//   · 前端弹窗表单的 `Number(e.target.value)` 转换（由 tsType 驱动）
// 只对齐校验器而不同时对齐这两者，会在**接线的一瞬间**把数字输入变成 400 —— 即把
// "今天能跑"变成"明天不能跑"。故此处一并报告，避免又一次只看一环就动手。
// ─────────────────────────────────────────────────────────────────────────────

async function reportArtifactChain(meta: Map<string, Map<string, string>>) {
  const NUMERIC = new Set(["int", "bigint", "smallint", "decimal", "numeric", "float", "double", "double precision", "real"])
  const dtoDrift: string[] = []
  let formConversions = 0

  const plugins = path.join(ROOT, "packages", "plugins")
  for (const plugin of fs.readdirSync(plugins).filter((n) => n.startsWith("plugin-"))) {
    const base = path.join(plugins, plugin)
    const repoDir = path.join(base, "backend", "repositories")
    const typeDir = path.join(base, "backend", "types")
    if (!fs.existsSync(repoDir)) continue

    const tableOf = new Map<string, string>()
    for (const file of fs.readdirSync(repoDir)) {
      if (!file.endsWith(".repository.ts")) continue
      const table = fs.readFileSync(path.join(repoDir, file), "utf8").match(/const TABLE_NAME = "([^"]+)"/)?.[1]
      if (table) tableOf.set(file.replace(".repository.ts", ""), table)
    }

    if (fs.existsSync(typeDir)) {
      for (const file of fs.readdirSync(typeDir)) {
        if (!file.endsWith(".types.ts")) continue
        const columns = meta.get(tableOf.get(file.replace(".types.ts", "")) ?? "")
        if (!columns) continue
        const source = fs.readFileSync(path.join(typeDir, file), "utf8")
        for (const match of source.matchAll(/^\s{2}(\w+)\?: (number|string);?\s*$/gm)) {
          const [, column, ts] = match
          const declared = columns.get(column)
          if (!declared || declared === "timestamp" || declared === "boolean") continue
          if (column === "id" || (column.endsWith("_id") && NUMERIC.has(declared))) continue
          if (NUMERIC.has(declared) !== (ts === "number")) {
            dtoDrift.push(`${tableOf.get(file.replace(".types.ts", ""))}.${column}: DTO ${ts} ↔ 元数据 ${declared}`)
          }
        }
      }
    }

    const componentDir = path.join(base, "frontend", "components")
    if (fs.existsSync(componentDir)) {
      for (const file of fs.readdirSync(componentDir)) {
        const source = fs.readFileSync(path.join(componentDir, file), "utf8")
        formConversions += (source.match(/Number\(e\.target\.value\)/g) ?? []).length
      }
    }
  }

  console.log("\n  ── 同一根源的其余产物 ──")
  console.log(`  DTO 类型漂移 (*.types.ts): ${dtoDrift.length}`)
  console.log(`  前端表单数字转换 (Number(...)): ${formConversions}`)
  if (dtoDrift.length > 0) {
    console.log(`  样例: ${dtoDrift.slice(0, 4).join(" · ")}`)
    console.log("  ⚠ 只对齐校验器而不同时处理这两者，接线会把「今天能跑」变成 400")
  }
}
