/**
 * 批量重生成 **Agent 契约**（`<插件根>/agent/<kebab>.agent.json`）。
 *
 * 为什么需要：契约本来是 codegen 随代码产出的，但**没有批量重生成入口** ——
 * 只有 admin 页面里逐表操作，或 `inject-codegen-output.cjs`（那是往仓里注入，
 * 不是原地刷新）。于是改一次契约模板，全仓 340 份契约**没法同步**，
 * 只能靠"下次有人用 codegen 生成新表"时顺带更新 —— 也就是**永远不会更新**。
 *
 * 实测动机（2026-10-21）：给元数据加了列枚举（`enumValues`），
 * 要让这个词汇进到契约里，才发现**没有可用的重生成命令**。
 *
 * 用法:
 *   pnpm exec tsx scripts/agent/regenerate-contracts.ts --domain bpm            # dry-run
 *   pnpm exec tsx scripts/agent/regenerate-contracts.ts --domain bpm --write    # 落盘
 *   pnpm exec tsx scripts/agent/regenerate-contracts.ts --all --write           # 全仓
 */
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ROOT, domainDirOf } = require("../lib/domain-catalog.cjs") as {
  ROOT: string
  domainDirOf: (root: string, domain: string) => string
}


const argv = process.argv.slice(2)
const write = argv.includes("--write")
const all = argv.includes("--all")
const domainArg = argv.indexOf("--domain") >= 0 ? argv[argv.indexOf("--domain") + 1] : ""

function listDataFiles(): string[] {
  const dir = path.join(ROOT, "scripts", "data")
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith("-source-tables.ts"))
    .map((name) => path.join(dir, name))
}

function domainOfDataFile(file: string): string {
  return path.basename(file).replace("-source-tables.ts", "")
}

async function main() {
  // 动态 import 必须在函数内：本仓的 tsx 走 CJS 输出，**顶层 await 不被支持**（实测 TransformError）。
  const { generateAgentContract } = await import(
    "../../packages/domains/infra/backend/services/codegen-templates/index"
  )

  const files = listDataFiles().filter((file) => all || domainOfDataFile(file) === domainArg)
  if (files.length === 0) {
    console.error(`[contracts] 找不到元数据：--domain ${domainArg || "(空)"}${all ? " / --all" : ""}`)
    process.exit(2)
  }

  let written = 0
  let skipped = 0
  for (const file of files) {
    const domain = domainOfDataFile(file)
        // **必须走 file:// URL**：Windows 上裸路径 `C:\...` 让 ESM 加载器报
    // `ERR_UNSUPPORTED_ESM_URL_SCHEME`（CI 的 windows job 实测，同一天在三个脚本里各犯一次）。
    // macOS/Linux 恰好容忍裸路径 —— 这就是它只在 CI 暴露的原因。
const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>
    const tablesKey = Object.keys(mod).find((key) => key.endsWith("_TABLES"))
    const tables = tablesKey ? (mod[tablesKey] as unknown[]) : []
    if (!Array.isArray(tables) || tables.length === 0) {
      console.error(`[contracts] ${domain}: 元数据里没有 *_TABLES 导出`)
      continue
    }

    const agentDir = path.join(ROOT, domainDirOf(ROOT, domain), "agent")
    if (!fs.existsSync(agentDir)) {
      console.error(`[contracts] ${domain}: 没有 agent/ 目录（${path.relative(ROOT, agentDir)}）`)
      continue
    }

    for (const config of tables) {
      const output = generateAgentContract(config as never)
      const target = path.join(agentDir, path.basename(output.path))
      const next = `${output.content.trimEnd()}\n`
      const prev = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null
      if (prev === next) {
        skipped += 1
        continue
      }
      if (!write) {
        console.log(`[contracts] would update ${path.relative(ROOT, target)}`)
        written += 1
        continue
      }
      fs.writeFileSync(target, next, "utf8")
      console.log(`[contracts] ${prev === null ? "created" : "updated"} ${path.relative(ROOT, target)}`)
      written += 1
    }
  }

  console.log(`\n[contracts] ${write ? "已写入" : "待写入"} ${written} 份，未变化 ${skipped} 份`)
  if (!write && written > 0) console.log("[contracts] 加 --write 落盘")
}

main().catch((error) => {
  console.error(`[contracts] 失败: ${error?.message ?? error}`)
  process.exit(1)
})
