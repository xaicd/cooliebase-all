/**
 * Agent 契约的**域级覆盖度**门禁。
 *
 * 为什么需要：契约（`*.agent.json`）是 `test/agent/agent-contract.spec.ts` 的 L4 驱动源、
 * `agent:ops` 的运营对象、以及 wiki 实体表格的数据源。**某域一份契约都没有**时，
 * 这个域在 Agent 面上等于**不存在** —— 而全仓测试与门禁都不会因此变红。
 *
 * 实测（2026-10-19）：
 *   · 3 个域 **0 契约**：`online`(4 页) / `wms`(33 页) / `aigw`(8 页)；
 *   · 整体 326 份契约 vs 780 个页面 —— 覆盖是**部分**的（多数页面是仪表盘/设计器，不是 CRUD 实体）。
 *
 * 判定分两种：
 *   · **enforce（棘轮）**：`domain-catalog.json` 里**每个域至少 1 份契约**；
 *     3 个已知零覆盖域冻结在基线里（`--write-baseline` 更新），**新增零覆盖域会直接失败**。
 *   · **report（不作门禁）**：每域的「契约数 / 页面数」比例 —— 只打印，供人判断，
 *     因为低比例不等于缺陷（设计器/仪表盘页面本就不是 CRUD 实体）。
 *
 * **绝不代生成契约**：契约由 codegen 随代码同步产出；手写等于编造业务语义
 * （业务名、权限码、字段），`collect-contracts.cjs` 也明确写着"不重新推导，避免第二份真源"。
 *
 * Usage:
 *   node scripts/check-agent-contract-coverage.cjs                  # 门禁
 *   node scripts/check-agent-contract-coverage.cjs --audit          # 全量盘点
 *   node scripts/check-agent-contract-coverage.cjs --write-baseline # 更新冻结基线
 */

const fs = require("fs")
const path = require("path")
const { ROOT } = require("./lib/domain-catalog.cjs")

const BASELINE_REL = "docs/architecture/artifacts/agent-contract-coverage-baseline.json"
const CATALOG_REL = "packages/shared/backend/constants/domain-catalog.json"
const PLATFORM_DOMAINS = new Set(["system", "infra"])

const asJson = process.argv.includes("--json")
const auditOnly = process.argv.includes("--audit")
const writeBaseline = process.argv.includes("--write-baseline")

function fail(message) {
  console.error(`[agent-contract-coverage] ✗ ${message}`)
  process.exit(1)
}

const catalogPath = path.join(ROOT, CATALOG_REL)
if (!fs.existsSync(catalogPath)) fail(`缺少域清单 ${CATALOG_REL}`)
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
const domains = (catalog.domains || []).map((item) => (typeof item === "string" ? item : item.name)).filter(Boolean)
if (domains.length === 0) fail("域清单为空 —— 拒绝在零命中时判定通过")

const domainBase = (domain) =>
  PLATFORM_DOMAINS.has(domain) ? `packages/domains/${domain}` : `packages/plugins/plugin-${domain}`

const countFiles = (dir, predicate) => {
  try {
    return fs.readdirSync(dir).filter(predicate).length
  } catch {
    return 0
  }
}

const report = domains.map((domain) => {
  const base = path.join(ROOT, domainBase(domain))
  const contracts = countFiles(path.join(base, "agent"), (name) => name.endsWith(".agent.json"))
  const pages = countFiles(path.join(base, "frontend", "pages"), (name) => name.endsWith(".page.tsx"))
  return { domain, contracts, pages }
})

const zeroCoverage = report.filter((item) => item.contracts === 0).map((item) => item.domain)
const domainsWithPages = report.filter((item) => item.pages > 0).length

if (writeBaseline) {
  const baselinePath = path.join(ROOT, BASELINE_REL)
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        note:
          "域级 Agent 契约覆盖的**已知零覆盖域**（棘轮基线）。契约由 codegen 产出，不可手写。"
          + "某域补齐契约后跑 --write-baseline 收紧；新增零覆盖域会被门禁拦下。",
        updatedAt: new Date().toISOString().split("T")[0],
        knownZeroCoverageDomains: zeroCoverage,
        snapshot: report.map((item) => `${item.domain}: ${item.contracts} 契约 / ${item.pages} 页面`),
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    `[agent-contract-coverage] ✓ 基线已写入 ${BASELINE_REL}`
    + `（已知零覆盖域 ${zeroCoverage.length} 个: ${zeroCoverage.join(", ") || "无"}）`,
  )
  process.exit(0)
}

if (auditOnly) {
  console.log("[agent-contract-coverage] Agent 契约域级覆盖盘点")
  for (const item of report) {
    const ratio = item.pages === 0 ? "-" : `${Math.round((item.contracts / item.pages) * 100)}%`
    const mark = item.contracts === 0 ? "  ← 零覆盖" : ""
    console.log(`  ${item.domain.padEnd(9)} 契约 ${String(item.contracts).padStart(3)} / 页面 ${String(item.pages).padStart(3)}  比例 ${ratio}${mark}`)
  }
  console.log(`  合计：${report.reduce((sum, item) => sum + item.contracts, 0)} 契约 / `
    + `${report.reduce((sum, item) => sum + item.pages, 0)} 页面；有页面的域 ${domainsWithPages}/${domains.length}`)
  console.log("  注：比例低不等于缺陷 —— 仪表盘/设计器页面不是 CRUD 实体。")
  process.exit(0)
}

// 比例只报告，不作门禁（避免逼出无意义豁免）
if (!asJson) {
  console.log("[agent-contract-coverage] 各域覆盖（report-only，仅供参考）")
  for (const item of report) {
    if (item.pages === 0) continue
    console.log(`  ${item.domain.padEnd(9)} ${String(item.contracts).padStart(3)} 契约 / ${String(item.pages).padStart(3)} 页面`)
  }
}

const baselinePath = path.join(ROOT, BASELINE_REL)
if (!fs.existsSync(baselinePath)) {
  fail(`缺少基线 ${BASELINE_REL} —— 拒绝静默放行。首次请跑 --write-baseline`)
}
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"))
const known = new Set(baseline.knownZeroCoverageDomains || [])

const added = zeroCoverage.filter((domain) => !known.has(domain))
const fixed = [...known].filter((domain) => !zeroCoverage.includes(domain))

if (added.length > 0) {
  for (const domain of added) console.error(`[agent-contract-coverage] ✗ 域 "${domain}" 一份契约都没有（Agent 面上等于不存在）`)
  fail(
    `❌ 新增 ${added.length} 个零覆盖域（既有已知缺口 ${known.size} 个已冻结）`
    + "\n  修法：让该域走 codegen 产出 agent 契约；**不要手写**（业务名/权限码/字段手写即编造）。",
  )
}

if (asJson) {
  console.log(JSON.stringify({ ok: true, zeroCoverage, known: [...known], fixed }, null, 2))
} else {
  console.log(
    `[agent-contract-coverage] PASS: ${domains.length} 个域中，`
    + `零覆盖 ${zeroCoverage.length} 个（均为已冻结的已知缺口：${[...known].join(", ") || "无"}）`,
  )
  if (fixed.length > 0) {
    console.log(
      `[agent-contract-coverage] ℹ 有 ${fixed.length} 个域已补齐契约（${fixed.join(", ")}）—— 请跑 --write-baseline 收紧基线`,
    )
  }
}
