/**
 * Agent 契约 ↔ 页面选择器一致性门禁。
 *
 * 为什么需要：每份 `*.agent.json` 都声明 `page.route` 与 `page.titleSelector`，
 * 而 `test/agent/agent-contract.spec.ts` 会用后者做**无头探针**：
 *   `await expect(page.locator(contract.selectors.title)).toBeVisible()`
 * 若页面里根本没有那个 `data-testid`，探针必然失败 —— 但此前**没有任何门禁覆盖这一项**，
 * 所以它是"契约说存在、页面里却不存在"的典型盲区（本门禁建立前实测确有 2 处：
 * `infra/config` 与 `system/user` 两个平台域页面完全没有 `data-testid`）。
 *
 * 判定口径（**路由即真源，不做文件名猜测**）：
 *   `page.route` → 生成的页面注册表（`admin-page-registry.ts`）→ 页面模块 → 检查选择器字面量是否出现。
 * 早期版本用"文件名含 kebab"的 glob 去猜页面，**产生过误报**
 * （把 `config` 猜到了 `file-configs.page.tsx` 上）—— 这正是要避免的：误报会逼出无意义豁免。
 *
 * 若某页用**变量**构造 testid（如 `data-testid={someVar}`），字面量匹配会失败：
 * 请加入 `ALLOWLIST` 并写明理由，不要放宽判定。
 *
 * Usage: node scripts/check-agent-selectors.cjs [--json]
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")

const REGISTRY_REL = "src/app/(admin-pages)/admin/_generated/admin-page-registry.ts"

/** 平台地基域在 `packages/domains/`，其余业务域在 `packages/plugins/plugin-<域>/`（AGENTS §3.2）。 */
const PLATFORM_DOMAINS = new Set(["system", "infra"])

/**
 * 显式豁免：仅供**用变量构造 testid**等无法做字面量匹配的情形，且必须写明理由。
 * 当前为空 —— 全仓 326 份契约均可解析且选择器均在页面中找到（0 误报）。
 */
const ALLOWLIST = []

function fail(message) {
  console.error(`[agent-selectors] ✗ ${message}`)
  process.exit(1)
}

function tracked(pattern) {
  const result = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
  if (result.status !== 0) fail("无法列出 git 跟踪文件（拒绝在未知文件集上判定）")
  return (result.stdout || "").split("\n").filter((f) => f && pattern.test(f))
}

/** `@/modules/<域>/...` → 真实文件路径前缀。 */
function resolveModule(specifier) {
  const parts = specifier.split("/")
  if (parts[0] !== "modules") return specifier
  const domain = parts[1]
  const base = PLATFORM_DOMAINS.has(domain)
    ? `packages/domains/${domain}`
    : `packages/plugins/plugin-${domain}`
  return `${base}/${parts.slice(2).join("/")}`
}

function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(ROOT, candidate))) return candidate
  }
  return null
}

const registryPath = path.join(ROOT, REGISTRY_REL)
if (!fs.existsSync(registryPath)) {
  fail(`页面注册表不存在: ${REGISTRY_REL}（生成物；检查构建流程是否被破坏）`)
}

const registry = fs.readFileSync(registryPath, "utf8")
const routeToModule = new Map()
for (const match of registry.matchAll(/"([^"]+)":\s*\{\s*kind:\s*"page",\s*load:\s*\(\)\s*=>\s*import\("@\/([^"]+)"\)/g)) {
  routeToModule.set(match[1], match[2])
}
if (routeToModule.size === 0) {
  fail(`未能从 ${REGISTRY_REL} 解析出任何 page 条目 —— 拒绝在零命中时判定通过（解析口径可能已失效）`)
}

const contracts = tracked(/\.agent\.json$/)
if (contracts.length === 0) fail("未找到任何 *.agent.json 契约")

const problems = []
let checked = 0

for (const rel of contracts) {
  let contract
  try {
    contract = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))
  } catch (error) {
    problems.push({ file: rel, kind: "parse", detail: `JSON 解析失败: ${error.message}` })
    continue
  }

  const page = contract.page || {}
  const route = page.route
  const selector = page.titleSelector
  if (!route || !selector) continue

  const key = route.replace(/^\/admin\//, "").replace(/\/$/, "")
  const module_ = routeToModule.get(key) || routeToModule.get(key.split("/").slice(0, 2).join("/"))
  if (!module_) {
    problems.push({ file: rel, kind: "route", detail: `page.route "${route}" 在页面注册表里找不到对应页面` })
    continue
  }

  const pageFile = firstExisting([
    resolveModule(module_),
    `${resolveModule(module_)}.tsx`,
    `${resolveModule(module_)}.ts`,
  ])
  if (!pageFile) {
    problems.push({ file: rel, kind: "page-file", detail: `页面模块不存在: ${resolveModule(module_)}` })
    continue
  }

  if (ALLOWLIST.some((entry) => entry.file === rel)) continue

  checked += 1
  const body = fs.readFileSync(path.join(ROOT, pageFile), "utf8")
  const testIdMatch = selector.match(/^\[data-testid=["']([^"']+)["']\]$/)
  const testId = testIdMatch ? testIdMatch[1] : null
  const present = (testId && body.includes(testId)) || body.includes(selector)
  if (!present) {
    problems.push({
      file: rel,
      kind: "selector",
      detail: `titleSelector ${selector} 在页面 ${pageFile} 中找不到`
        + "（无头探针会因此失败）",
    })
  }
}

if (checked === 0) {
  fail("实际校验了 0 份契约 —— 拒绝在零命中时判定通过（检查器可能已失效）")
}

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, checked, contracts: contracts.length, problems }, null, 2))
} else if (problems.length === 0) {
  console.log(
    `[agent-selectors] PASS: ${checked} 份契约的 titleSelector 均存在于对应页面`
    + `（路由经页面注册表解析，共 ${contracts.length} 份契约）`,
  )
} else {
  for (const problem of problems) {
    console.error(`[agent-selectors] ✗ ${problem.file} — ${problem.detail}`)
  }
  console.error(
    `\n[agent-selectors] FAIL: ${problems.length} 处契约与页面不一致`
    + "\n  两条路都成立：① 页面补上该 data-testid（多数情况 —— 契约声明的是接口，页面须实现），"
    + "或 ② 契约的选择器写错了。"
    + "若页面用变量构造 testid，请加入 ALLOWLIST 并写明理由，不要放宽判定。",
  )
}

process.exit(problems.length === 0 ? 0 : 1)
