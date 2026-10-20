#!/usr/bin/env node
/**
 * Foundation 本体扫描 CLI。
 *   node scripts/foundation-ontology.cjs           → 回写 catalog 的 fanIn/state/dependents（进化时刷新）
 *   node scripts/foundation-ontology.cjs --check    → 只对账不写；漂移则退出码 2（门禁用）
 */
const { writeOntology, checkOntology } = require("./lib/foundation-ontology.cjs")

const isCheck = process.argv.includes("--check")

if (isCheck) {
  const { ok, drifts, measured } = checkOntology()
  if (ok) {
    console.log(`[foundation-ontology] ✓ ${measured.length} 能力 fanIn/state 与真实代码一致（无漂移）`)
    process.exit(0)
  }
  console.error(`[foundation-ontology] ✗ 检测到 ${drifts.length} 处漂移（catalog 与真实代码不一致）：`)
  for (const d of drifts) {
    const hint = d.hint ? `  → ${d.hint}` : ""
    console.error(`  - ${d.id}.${d.field}: ${JSON.stringify(d.from)} → ${JSON.stringify(d.to)}${hint}`)
  }
  console.error(`\n修复：运行 pnpm run foundation:ontology 刷新真源，并同步导航总纲 §3 能力表后提交。`)
  process.exit(2)
} else {
  const { updated, rel } = writeOntology()
  console.log(`[foundation-ontology] wrote ${updated} 能力 fanIn/state/dependents → ${rel}`)
}
