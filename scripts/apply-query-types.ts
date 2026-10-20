/**
 * 把"可查字段"的推导**应用到已有元数据**（无需重拉源框架 —— 从列名即可推导）。
 *
 * 为什么需要: 生成器产的仓储 FILTERS 来自元数据的 queryType。此前没标，
 * 于是**过滤参数被静默忽略**（实测在 erp_stock 上踩到）。这里补齐，
 * 推导规则与 `import-source-tables.ts` **共用同一份实现**（不重复一套）。
 *
 * 用法: pnpm exec tsx scripts/apply-query-types.ts --tables scripts/data/erp-source-tables.ts --export ERP_TABLES [--write]
 */
import fs from "node:fs"
import path from "node:path"
import { deriveQueryType } from "./lib/query-types"

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const arg = (flag: string) => {
  const index = argv.indexOf(flag)
  return index >= 0 ? argv[index + 1] : undefined
}
const write = argv.includes("--write")
const tablesModule = arg("--tables")
const exportName = arg("--export") ?? "default"
if (!tablesModule) {
  console.error("用法: --tables <模块> --export <导出名> [--write]")
  process.exit(2)
}

const LIMIT = 5

function applyToConfigs(configs: Array<Record<string, unknown>>): number {
  let changed = 0
  for (const config of configs) {
    const table = config.table as { columns: Array<Record<string, unknown>> }
    const columns = table.columns ?? []
    let remaining = LIMIT
    for (const column of columns) {
      const name = String(column.name)
      const derived = deriveQueryType(name)
      if (!derived) {
        if (column.queryType) delete column.queryType
        continue
      }
      if (remaining <= 0) {
        delete column.queryType
        continue
      }
      if (column.queryType !== derived) {
        column.queryType = derived
        changed += 1
      }
      remaining -= 1
    }
  }
  return changed
}

const mod = require(path.join(ROOT, tablesModule)) as Record<string, Array<Record<string, unknown>>>
const configs = mod[exportName]
if (!Array.isArray(configs)) {
  console.error(`导出 "${exportName}" 不是数组`)
  process.exit(2)
}
const changed = applyToConfigs(configs)
const withQuery = configs.reduce(
  (total, config) => total + ((config.table as { columns: Array<Record<string, unknown>> }).columns ?? []).filter((c) => c.queryType).length,
  0,
)
console.log(`[query-types] ${tablesModule}: ${changed} 处更新，当前可查字段 ${withQuery} 个`)

if (write) {
  // 只改内存对象是不够的 —— 元数据才是真源，必须回写。这里用固定序列化保证可重复。
  const serialized = `// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const ${exportName}: CodegenConfig[] = ${JSON.stringify(configs, null, 2)}
`
  fs.writeFileSync(path.join(ROOT, tablesModule), serialized)
  console.log(`  ✓ 已回写 ${tablesModule}`)
} else {
  console.log("  (dry-run: 加 --write 回写)")
}
