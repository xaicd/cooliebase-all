#!/usr/bin/env node
/**
 * 收集全部域/实体的 **Agent 操作契约**，汇总成一份注册表。
 *
 * 契约由 codegen 随代码同步产出（`<插件根>/agent/<kebab>.agent.json`），
 * 这里只做汇总 —— 不重新推导，避免第二份真源。
 *
 * 用途:
 *   - `test/agent/agent-contract.spec.ts` 逐条驱动页面（L4）
 *   - `scripts/agent/run-ops.cjs` 逐条执行运营动作（agent-device 风格）
 *   - 人或 agent 直接读 `docs/agent/contracts.json` 了解"这个系统能自动化什么"
 *
 * 用法:
 *   node scripts/agent/collect-contracts.cjs            # 写入 docs/agent/contracts.json
 *   node scripts/agent/collect-contracts.cjs --check    # 只校验（CI 门禁用）
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..", "..")
const OUT = path.join(ROOT, "docs", "agent", "contracts.json")
const checkOnly = process.argv.includes("--check")

/** 域目录可能是 packages/domains/<域> 或 packages/plugins/plugin-<域>，两处都扫。 */
function collect() {
  const roots = [
    path.join(ROOT, "packages", "domains"),
    path.join(ROOT, "packages", "plugins"),
  ]
  const contracts = []
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const agentDir = path.join(root, entry.name, "agent")
      if (!fs.existsSync(agentDir)) continue
      for (const file of fs.readdirSync(agentDir)) {
        if (!file.endsWith(".agent.json")) continue
        const full = path.join(agentDir, file)
        try {
          const contract = JSON.parse(fs.readFileSync(full, "utf8"))
          contract.__source = path.relative(ROOT, full).replace(/\\/g, "/")
          contracts.push(contract)
        } catch (error) {
          throw new Error(`契约无法解析: ${path.relative(ROOT, full)} — ${error.message}`)
        }
      }
    }
  }
  contracts.sort((a, b) => `${a.domain}.${a.entity}`.localeCompare(`${b.domain}.${b.entity}`))
  return contracts
}

function main() {
  const contracts = collect()
  const byDomain = {}
  for (const contract of contracts) byDomain[contract.domain] = (byDomain[contract.domain] || 0) + 1

  const payload = {
    $schema: "cooliebase.agent.registry/v1",
    generatedBy: "scripts/agent/collect-contracts.cjs",
    total: contracts.length,
    domains: Object.entries(byDomain).map(([domain, count]) => ({ domain, count })),
    contracts,
  }

  if (checkOnly) {
    if (!fs.existsSync(OUT)) {
      console.error("[agent:contracts] docs/agent/contracts.json 不存在 —— 运行 node scripts/agent/collect-contracts.cjs")
      process.exit(1)
    }
    const current = JSON.parse(fs.readFileSync(OUT, "utf8"))
    if (current.total !== payload.total) {
      console.error(`[agent:contracts] 契约数量漂移: 注册表 ${current.total} vs 实际 ${payload.total}`)
      process.exit(1)
    }
    console.log(`[agent:contracts] PASS ${payload.total} 份契约，${payload.domains.length} 个域`)
    return
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n")
  console.log(`[agent:contracts] 已写 ${path.relative(ROOT, OUT)}`)
  console.log(`  ${payload.total} 份契约 / ${payload.domains.length} 个域`)
  for (const item of payload.domains) console.log(`    ${item.domain}: ${item.count}`)
}

main()
