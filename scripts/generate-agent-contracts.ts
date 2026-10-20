/**
 * 从**权威表元数据**只生成 Agent 契约（`<插件根>/agent/<kebab>.agent.json`）。
 *
 * 为什么需要单独一个入口：
 *   · 契约必须由 codegen 产出（业务名、权限码、字段都来自表元数据）；
 *     **手写等于编造**，`collect-contracts.cjs` 也明确写着"不重新推导，避免第二份真源"。
 *   · 但现成的 `scripts/scaffold-wms-domain.ts` 会**无条件覆盖全部全栈文件** ——
 *     而 wms 的路由等代码已被手工调整过（例如 4 参数的 `update(data.id, data, auth.userId, auth.tenantId)`），
 *     跑它会把改动冲掉。所以需要一个**只写契约、不碰其它文件**的入口。
 *
 * 行为：
 *   · 默认**跳过已存在的契约文件**（不覆盖手工修正过的契约）；`--force` 才覆盖。
 *   · `--dry-run` 只打印将写哪些文件。
 *
 * Usage:
 *   pnpm exec tsx scripts/generate-agent-contracts.ts --module wms --dry-run
 *   pnpm exec tsx scripts/generate-agent-contracts.ts --module wms
 *   pnpm exec tsx scripts/generate-agent-contracts.ts --module wms --force
 */

import fs from "node:fs"
import path from "node:path"

import { CodegenEngineService } from "../packages/domains/infra/backend/services/codegen-engine.service"

type Options = { module: string; dryRun: boolean; force: boolean }

function parseArgs(argv: string[]): Options {
  const moduleIndex = argv.indexOf("--module")
  const moduleName = moduleIndex >= 0 ? argv[moduleIndex + 1] : ""
  if (!moduleName) {
    console.error("[agent-contracts] 用法: pnpm exec tsx scripts/generate-agent-contracts.ts --module <域> [--dry-run] [--force]")
    process.exit(2)
  }
  return { module: moduleName, dryRun: argv.includes("--dry-run"), force: argv.includes("--force") }
}

/** 每个域的表元数据模块（真源）。新增域时在此登记 —— 没有元数据的域无法产出契约。 */
const TABLE_MODULES: Record<string, () => Promise<{ [key: string]: unknown }>> = {
  wms: () => import("./data/wms-tables"),
}

const EXPORT_BY_MODULE: Record<string, string> = {
  wms: "WMS_TABLES",
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const loader = TABLE_MODULES[options.module]
  if (!loader) {
    console.error(
      `[agent-contracts] 域 "${options.module}" 没有表元数据（scripts/data/<域>-tables.ts）。`
      + " 没有元数据就无法产出契约 —— 请不要手写契约（业务名/权限码/字段手写即编造）。",
    )
    process.exit(2)
  }

  const exported = await loader()
  const tables = exported[EXPORT_BY_MODULE[options.module]] as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(tables) || tables.length === 0) {
    console.error(`[agent-contracts] ${EXPORT_BY_MODULE[options.module]} 为空或不可读 —— 拒绝在零输入时产出`)
    process.exit(1)
  }

  let written = 0
  let skipped = 0

  for (const config of tables) {
    const outputs = CodegenEngineService.generateCodes(config as never, { includeClients: false })
    const contract = outputs.find((output) => output.path.endsWith(".agent.json"))
    if (!contract) {
      console.error(`[agent-contracts] ✗ ${String(config.className)} 未产出契约 —— 模板可能已变更`)
      process.exit(1)
    }

    const full = path.resolve(process.cwd(), contract.path)
    if (fs.existsSync(full) && !options.force) {
      skipped += 1
      continue
    }
    if (options.dryRun) {
      console.log(`  [dry-run] 将写入 ${contract.path}`)
      written += 1
      continue
    }
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, contract.content, "utf-8")
    written += 1
  }

  console.log(
    `[agent-contracts] ${options.dryRun ? "[dry-run] " : ""}${options.module}: `
    + `写入 ${written} 份${skipped > 0 ? `，跳过已存在 ${skipped} 份（--force 可覆盖）` : ""}`,
  )
}

main().catch((error) => {
  console.error(`[agent-contracts] ✗ ${(error as Error).message}`)
  process.exit(1)
})
