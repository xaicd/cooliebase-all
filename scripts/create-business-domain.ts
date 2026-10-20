/**
 * 新建业务域 → 第一方插件（一条命令走完）。
 *
 * 这是 `new-business-plugin` 技能的可执行版本：把此前**已逐个实测**的步骤串起来，
 * 让"对话里说要做什么业务"到"插件跑起来"之间没有需要人记的手工步骤。
 *
 * 它做什么（每一步都幂等，可重复运行）:
 *   1. 校验表元数据（`scripts/data/<域>-tables.ts`）—— 表定义的**唯一真源**
 *   2. 生成建表迁移（`generate-table-migration.ts`）
 *   3. 按表跑 codegen，产出全栈代码（contract/backend/frontend/路由/迁移）
 *   4. 注册为第一方插件（`migrate-domain-to-plugin.cjs`，含新域自动登记）
 *   5. 重生成契约与清单（**顺序固定**: contracts -> seams -> manifests -> admin routes）
 *   6. 门禁自检（`npm run check`）
 *
 * 它**不做**（需要人或 CI 决定）:
 *   - 不写表元数据 —— 业务字段的类型/可空/默认值必须由人定（这是产品决策）
 *   - 不执行迁移到具体库（`prisma migrate deploy`）—— 目标库由部署决定
 *   - 不提交、不推送
 *
 * 用法:
 *   pnpm exec tsx scripts/create-business-domain.ts <域> [--export SHOP_TABLES] [--tables scripts/data/shop-tables.ts] [--dry-run]
 */
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeGeneratedFile } = require("./lib/generated-file.cjs") as {
  writeGeneratedFile: (file: string, content: string, options?: { force?: boolean }) => "written" | "skipped-handwritten"
}

import { CodegenEngineService } from "../packages/domains/infra/backend/services/codegen-engine.service"
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const arg = (flag: string) => {
  const index = argv.indexOf(flag)
  return index >= 0 ? argv[index + 1] : undefined
}

const domain = argv.find((item) => !item.startsWith("--") && argv[argv.indexOf(item) - 1]?.startsWith("--") !== true)
const dryRun = argv.includes("--dry-run")

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

function step(n: number, message: string) {
  console.log(`\n[${n}/6] ${message}`)
}

function run(command: string, args: string[]) {
  execFileSync(command, args, { cwd: ROOT, stdio: "inherit" })
}

function main() {
  if (!domain || domain.startsWith("--")) {
    fail("用法: pnpm exec tsx scripts/create-business-domain.ts <域> [--tables <元数据文件>] [--export <导出名>] [--dry-run]")
  }

  const tablesFile = arg("--tables") ?? `scripts/data/${domain}-tables.ts`
  const exportName = arg("--export") ?? `${domain.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_TABLES`
  const tablesAbs = path.join(ROOT, tablesFile)

  step(1, `校验表元数据 ${tablesFile}`)
  if (!fs.existsSync(tablesAbs)) {
    fail(
      `表元数据不存在: ${tablesFile}\n` +
        `  本仓以**低代码元数据**为表定义唯一真源（AGENTS §9.5）。\n` +
        `  请先写这份文件: 导出 \`${exportName}: CodegenConfig[]\`，每列带 type/tsType/nullable/comment。\n` +
        `  元数据决定字段类型与约束，属**产品决策** —— 工具不代写。`,
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tables = (require(tablesAbs) as Record<string, CodegenConfig[]>)[exportName]
  if (!Array.isArray(tables) || tables.length === 0) fail(`${tablesFile} 未导出非空数组 \`${exportName}\``)
  console.log(`  ✓ ${tables.length} 张表`)

  if (dryRun) {
    console.log("\n(dry-run: 仅校验元数据，未执行后续步骤)")
    for (const config of tables) console.log(`  · ${config.table.name} -> ${config.className}`)
    return
  }

  step(2, "生成建表迁移")
  run("pnpm", ["exec", "tsx", "scripts/generate-table-migration.ts", "--tables", tablesFile, "--export", exportName, "--name", `add_${domain}_tables`, "--write"])

  step(3, "按表生成全栈代码")
  // 默认**不覆盖**已有文件（AGENTS §14.6: 生成器禁止覆盖已有 Service/Repository/Page）。
  // 本仓已有手写代码的域（wms 等）与已迁移的骨架域都靠这道保护。
  const force = argv.includes("--force")
  let written = 0
  let skipped = 0
  for (const config of tables) {
    const outputs = CodegenEngineService.generateCodes(config, { includeClients: false })
    // 每张表一份独立迁移（带时间戳）会与第 2 步的**合并迁移**重复，只留一份；
    // codegen-manifest.json 是本次生成的临时清单，也不落地。
    const kept = outputs.filter((output) => {
      const normalized = output.path.replace(/\\/g, "/")
      return !normalized.startsWith("prisma/migrations/") && normalized !== "codegen-manifest.json"
    })
    for (const output of kept) {
      const full = path.resolve(ROOT, output.path)
      // 安全写入: 目标存在且**没有生成标记** => 那是手写文件，默认**拒绝覆盖**
      // （member 的手写仓储被批量重生成覆盖过两次，见 scripts/lib/generated-file.cjs）
      const result = writeGeneratedFile(full, output.content, { force })
      if (result === "skipped-handwritten") {
        skipped++
        continue
      }
      if (fs.existsSync(full) && !force && !result) {
        skipped++
        continue
      }
      written++
    }
    console.log(`  ✓ ${config.className} -> 新写 ${kept.length - skipped} / 跳过 ${skipped}（已存在或手写）`)
  }
  console.log(`  合计: 新写 ${written} 个文件（跳过 ${skipped} 个已存在；--force 可覆盖）`)

  step(4, "注册为第一方插件")
  run("node", ["scripts/migrate-domain-to-plugin.cjs", domain, "--write"])

  step(5, "重生成契约与清单（顺序固定）")
  // rpc-actions.json 与 domain-service-loaders.ts 是**两个**派生物（后者由前者派生），
  // 少跑一个就会让 domain-loaders:check 失败 —— 实测在全新工程上踩到过。
  // rpc-actions.json 是**上游**（loader 等由它派生），先单独生成
  run("pnpm", ["exec", "tsx", "scripts/generate-rpc-actions.ts", "--write"])
  // 其余派生物清单**共用**（scripts/lib/derived-artifacts.cjs）—— 与孵化器同一份。
  // 少跑一个就会让门禁失败（这轮漏过两次: loader、agent 契约注册表）。
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DERIVED_ARTIFACTS } = require("./lib/derived-artifacts.cjs") as {
    DERIVED_ARTIFACTS: Array<{ script: string; args: string[]; label: string }>
  }
  for (const { script, args, label } of DERIVED_ARTIFACTS) {
    if (!fs.existsSync(path.join(ROOT, script))) continue
    if (script.endsWith(".cjs")) run("node", [script, ...args])
    else run("pnpm", ["exec", "tsx", script, ...args])
    console.log(`  已重建${label}`)
  }
  // contracts 会重写 module.manifest.json，必须跑在 manifests **之前** —— 反了会一直报漂移。
  run("pnpm", ["run", "domain:contracts"])
  run("pnpm", ["run", "domain:seams"])
  run("pnpm", ["run", "domain:manifests"])
  run("pnpm", ["run", "admin:routes:manifest"])

  step(6, "门禁自检")
  console.log("  下一步请手动执行（工具不替你决定部署与提交）:")
  console.log(`    pnpm install                 # 新插件进了工作区`)
  console.log(`    pnpm run check               # 门禁（含表定义覆盖）`)
  console.log(`    pnpm run build               # 编译`)
  console.log(`    pnpm run domain:pack ${domain}   # 打包`)
  console.log(`    pnpm exec prisma migrate deploy    # 建表到目标库（库由部署决定）`)
  console.log(`    pnpm run dev                 # 运行；首次需 POST /api/v1/admin/plugins 登记插件`)
  console.log(`\n✓ ${domain} 已生成并注册。接口面是插件挂载点 /api/v1/plugins/cooliebase.${domain}/api/**`)
}

main()
