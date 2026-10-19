/**
 * Agent 契约 ↔ 后端路由一致性门禁。
 *
 * 为什么需要：每份 `*.agent.json` 都声明了 `api.resource` 与 5 个 `methods[].path`，
 * 前端页面也确实在调 `/api/v1/admin/<域>/<resource>` —— 但**契约与页面都在、后端路由却没有**
 * 时，页面必然 404，而此前没有任何门禁能发现（`agent:selectors:check` 只查页面选择器）。
 *
 * 实测（2026-10-19，本门禁建立时）：
 *   · HTTP 方法不匹配 **0 处**（`export const GET = withAdminRoute(...)` 与 `methods[].http` 完全一致）；
 *   · 但 **48 个资源**（分布在 9 个域）**根本没有路由目录** —— 契约 + 页面存在、后端缺失。
 *     多为子实体（`*-item` / `*-log` / `*-detail`），git 历史显示**从未创建**而非被删。
 *
 * 因此本门禁分两种模式（与 `deps:audit` 同一套棘轮思路）：
 *   · **enforce**（必须为 0）：HTTP 方法不匹配；以及"资源目录存在、但某个方法路径文件缺失"
 *     —— 这两类是**回归**，一出现就是真错。
 *   · **ratchet**（冻结既有欠债，只拦新增）：整块缺失的资源目录，基线记录在
 *     `docs/architecture/artifacts/agent-route-coverage-baseline.json`。
 *     补齐后跑 `--write-baseline` 收紧基线。
 *
 * Usage:
 *   node scripts/check-agent-routes.cjs                  # 门禁
 *   node scripts/check-agent-routes.cjs --audit          # 列出全部缺口与既有欠债
 *   node scripts/check-agent-routes.cjs --write-baseline # 重写基线（补完路由后收紧）
 */

const fs = require("fs")
const path = require("path")
const { ROOT } = require("./lib/domain-catalog.cjs")

const BASELINE_REL = "docs/architecture/artifacts/agent-route-coverage-baseline.json"
const PLATFORM_DOMAINS = new Set(["system", "infra"])

const asJson = process.argv.includes("--json")
const auditOnly = process.argv.includes("--audit")
const writeBaseline = process.argv.includes("--write-baseline")

function fail(message) {
  console.error(`[agent-routes] ✗ ${message}`)
  process.exit(1)
}

const domainBase = (domain) =>
  PLATFORM_DOMAINS.has(domain) ? `packages/domains/${domain}` : `packages/plugins/plugin-${domain}`

/** 收集全部契约文件（按域递归，避免依赖 shell glob）。 */
function collectContracts(dir, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectContracts(full, out)
    else if (entry.name.endsWith(".agent.json")) out.push(full)
  }
  return out
}

const contracts = collectContracts(path.join(ROOT, "packages"))
if (contracts.length === 0) fail("未找到任何 *.agent.json 契约")

const verbMismatches = [] // enforce
const partialMissing = [] // enforce：资源目录在，但某方法路径的文件不在
const missingResources = [] // ratchet：整块资源目录缺失
let methodsChecked = 0

for (const full of contracts) {
  const rel = path.relative(ROOT, full).split(path.sep).join("/")
  let contract
  try {
    contract = JSON.parse(fs.readFileSync(full, "utf8"))
  } catch (error) {
    fail(`${rel} JSON 解析失败: ${error.message}`)
  }
  const api = contract.api || {}
  const domain = contract.domain
  const resource = api.resource
  const mount = api.bffMount || ""
  const surfaceMatch = mount.match(/^\/api\/v1\/([^/]+)/)
  if (!domain || !resource || !surfaceMatch) continue

  const surface = surfaceMatch[1]
  const resourceDir = path.join(ROOT, domainBase(domain), "routes", surface, resource)

  if (!fs.existsSync(resourceDir)) {
    missingResources.push({ contract: rel, domain, resource })
    continue
  }

  for (const [method, spec] of Object.entries(api.methods || {})) {
    const methodPath = (spec || {}).path
    if (!methodPath) continue
    methodsChecked += 1
    const segments = methodPath
      .replace(/^\//, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => (segment.startsWith(":") ? `[${segment.slice(1)}]` : segment))
    const routeFile = path.join(ROOT, domainBase(domain), "routes", surface, ...segments, "route.ts")
    if (!fs.existsSync(routeFile)) {
      partialMissing.push({
        contract: rel,
        method,
        path: methodPath,
        expected: path.relative(ROOT, routeFile).split(path.sep).join("/"),
      })
      continue
    }
    const http = (spec || {}).http || "GET"
    const body = fs.readFileSync(routeFile, "utf8")
    // 真实风格：`export const GET = withAdminRoute(...)`；也兼容 `export async function GET`
    if (!new RegExp(`export\\s+(const|async\\s+function|function)\\s+${http}\\b`).test(body)) {
      verbMismatches.push({
        contract: rel,
        method,
        http,
        file: path.relative(ROOT, routeFile).split(path.sep).join("/"),
      })
    }
  }
}

if (methodsChecked === 0) fail("实际校验了 0 个方法 —— 拒绝在零命中时判定通过（映射口径可能已失效）")

missingResources.sort((a, b) => a.contract.localeCompare(b.contract))

const baselinePath = path.join(ROOT, BASELINE_REL)

if (writeBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        note:
          "Agent 契约声明了资源、但后端没有任何路由的既有欠债（棘轮基线）。"
          + "补齐路由后重跑 --write-baseline 收紧；新增条目会被门禁拦下。",
        updatedAt: new Date().toISOString().split("T")[0],
        methodsChecked,
        missingResources: missingResources.map((item) => `${item.domain}/${item.resource}`),
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    `[agent-routes] ✓ 基线已写入 ${BASELINE_REL}（既有欠债 ${missingResources.length} 个资源，`
    + `已校验方法 ${methodsChecked} 个）`,
  )
  process.exit(0)
}

if (auditOnly) {
  console.log("[agent-routes] Agent 契约 ↔ 后端路由 全量盘点")
  console.log(`  契约 ${contracts.length} 份 · 已校验方法 ${methodsChecked} 个`)
  console.log(`  HTTP 方法不匹配（enforce，应为 0）: ${verbMismatches.length}`)
  console.log(`  资源目录在但方法文件缺失（enforce，应为 0）: ${partialMissing.length}`)
  console.log(`  整块资源目录缺失（ratchet 欠债）: ${missingResources.length}`)
  const byDomain = {}
  for (const item of missingResources) byDomain[item.domain] = (byDomain[item.domain] || 0) + 1
  console.log(`  按域: ${JSON.stringify(byDomain)}`)
  process.exit(verbMismatches.length + partialMissing.length > 0 ? 1 : 0)
}

if (verbMismatches.length > 0 || partialMissing.length > 0) {
  for (const item of verbMismatches) {
    console.error(`[agent-routes] ✗ ${item.contract} [${item.method}] http=${item.http} 在 ${item.file} 中没有对应导出`)
  }
  for (const item of partialMissing) {
    console.error(`[agent-routes] ✗ ${item.contract} [${item.method}] path=${item.path} 找不到文件 ${item.expected}`)
  }
  fail(`❌ ${verbMismatches.length + partialMissing.length} 处**回归**（这两类必须为 0）`)
}

let baseline = null
if (fs.existsSync(baselinePath)) {
  baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"))
} else {
  fail(`缺少基线 ${BASELINE_REL} —— 拒绝静默放行。首次请跑 \`node scripts/check-agent-routes.cjs --write-baseline\``)
}

const known = new Set(baseline.missingResources || [])
const current = new Set(missingResources.map((item) => `${item.domain}/${item.resource}`))
const added = [...current].filter((item) => !known.has(item))
const fixed = [...known].filter((item) => !current.has(item))

if (added.length > 0) {
  for (const item of added) console.error(`[agent-routes] ✗ 新增「契约有、后端无路由」的资源: ${item}`)
  fail(
    `❌ 新增 ${added.length} 个未覆盖资源（既有欠债 ${known.size} 个已冻结）`
    + "\n  修法：补齐后端路由，或（确属有意）在基线中显式登记 —— 但**不要**让它悄悄增长。",
  )
}

if (asJson) {
  console.log(JSON.stringify({ ok: true, methodsChecked, frozen: known.size, fixed }, null, 2))
} else {
  console.log(
    `[agent-routes] PASS: 契约方法 ${methodsChecked} 个全部有对应路由导出`
    + `（HTTP 方法 0 处不匹配）；既有欠债 ${known.size} 个资源已冻结，新增 0 个`,
  )
  if (fixed.length > 0) {
    console.log(
      `[agent-routes] ℹ 有 ${fixed.length} 个既有欠债已补齐（${fixed.slice(0, 6).join(", ")}`
      + `${fixed.length > 6 ? " …" : ""}）—— 请跑 \`--write-baseline\` 收紧基线`,
    )
  }
}
