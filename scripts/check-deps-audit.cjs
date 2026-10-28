/**
 * Dependency-vulnerability gate (供应链 CVE).
 *
 * 为什么需要：本仓曾同时存在 4 critical / 31 high 的依赖漏洞，而**没有任何门禁看得见它们**
 * —— `scripts/security-scan.cjs` 的 12 项全是运行时检查（能不能被打），不含 CVE
 * （带的组件有没有已知洞）。两者职责不同，都要有。
 *
 * 判据：与冻结基线逐条比对，**只拦新增**（ratchet）。基线内的既有欠债如实展示、不阻断，
 * 以免门禁长期红着然后被绕过。
 *
 * 分层按**锁文件离线推导**的依赖图判定（不写死包名、也不读审计输出的采样字段）：
 *   runtime          可从本仓项目（`.` 与 packages/**）的依赖图走到（含 devDependencies 链）
 *   client-toolchain 其余（当前即 clients/expo 的 @expo/cli / react-devtools-core 链）
 * runtime 是全体子集，故本门禁只实现「全树不新增」一条 enforce 规则：
 * 它严格强于「runtime 层不新增」，再拆一条只是重复计数。
 * 分层只用于**展示影响半径**，不作为第二套判据。
 *
 * Usage:
 *   node scripts/check-deps-audit.cjs                 # 门禁（供 pnpm run check 调用）
 *   node scripts/check-deps-audit.cjs --json          # 机器可读
 *   node scripts/check-deps-audit.cjs --audit         # 打印全部，永不失败
 *   node scripts/check-deps-audit.cjs --write-baseline
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")
// 锁文件窄解析器已提取为共享 lib —— 依赖分层与 SBOM 用的是同一份真源。
const { LOCKFILE_REL, hostReachablePackageNames } = require("./lib/pnpm-lock.cjs")

const BASELINE_REL = "docs/architecture/artifacts/deps-audit-baseline.json"
// pnpm audit 要联网查通告库，给足时间。
const AUDIT_TIMEOUT_MS = 180000

const asJson = process.argv.includes("--json")
const auditOnly = process.argv.includes("--audit")
const writeBaseline = process.argv.includes("--write-baseline")

const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

const TIER_RUNTIME = "runtime"
const TIER_CLIENT = "client-toolchain"

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function fail(message) {
  throw new Error(`[deps-audit] ${message}`)
}

/**
 * 跑 pnpm audit。
 *
 * 关键：**有漏洞时 pnpm 自己返回非 0**，那不是工具失败 —— 绝不能据此判定，
 * 但也绝不能因为"没拿到结果"就当作 0 漏洞通过（那是静默放行）。
 */
function runAudit() {
  const result = spawnSync(PNPM, ["audit", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: AUDIT_TIMEOUT_MS,
      // **Windows 必须开 shell**：`pnpm.cmd` 不能被直接 exec（与 crypto-key-guard 同坑）。
      // POSIX 上仍是 false —— 行为完全不变。
      shell: process.platform === "win32",
  })
  const stdout = (result.stdout || "").trim()
  if (!stdout) {
    const detail = String(result.stderr || result.error?.message || "").trim().slice(0, 400)
    fail(`pnpm audit produced no JSON output (exit=${result.status}). Refusing to treat this as "0 vulnerabilities". ${detail}`)
  }
  try {
    return JSON.parse(stdout)
  } catch (error) {
    fail(`pnpm audit output is not JSON: ${error.message}`)
  }
}

const HOST_REACHABLE = (() => {
  try {
    return hostReachablePackageNames(ROOT)
  } catch (error) {
    fail(error.message)
  }
})()

/** 分层改为纯查表：包名在 host 可达集合内即 runtime。确定性来自锁文件，不再依赖采样字段。 */
function tierOf(advisory) {
  return HOST_REACHABLE.has(advisory.module_name) ? TIER_RUNTIME : TIER_CLIENT
}

function collectEntries() {
  const data = runAudit()
  return Object.values(data.advisories || {})
    .map((advisory) => ({
      key: `${advisory.module_name}@${advisory.github_advisory_id || advisory.id}`,
      package: advisory.module_name,
      severity: advisory.severity,
      ghsa: advisory.github_advisory_id || advisory.id,
      tier: tierOf(advisory),
      title: String(advisory.title || "").slice(0, 140),
      vulnerableVersions: advisory.vulnerable_versions,
      patchedVersions: String(advisory.patched_versions || "").trim(),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

function countBySeverity(entries) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 }
  for (const entry of entries) counts[entry.severity] = (counts[entry.severity] || 0) + 1
  return counts
}

function loadBaseline() {
  const full = abs(BASELINE_REL)
  if (!fs.existsSync(full)) return { version: 1, kind: "deps-audit-baseline", entries: [] }
  return JSON.parse(fs.readFileSync(full, "utf8"))
}

const entries = collectEntries()
const runtimeEntries = entries.filter((entry) => entry.tier === TIER_RUNTIME)

if (writeBaseline) {
  const baseline = {
    version: 1,
    kind: "deps-audit-baseline",
    note:
      "冻结的依赖漏洞欠债（ratchet）。门禁只拦**新增**；基线内的既有项如实展示、不阻断。"
      + "用 `pnpm run deps:audit:baseline` 刷新，并逐条复核增量后再提交 —— 刷新基线等于接受这些洞。",
    counts: { total: entries.length, runtime: runtimeEntries.length, bySeverity: countBySeverity(entries) },
    entries: entries.map(({ key, package: pkg, severity, ghsa, tier, patchedVersions }) => ({
      key,
      package: pkg,
      severity,
      ghsa,
      tier,
      patchedVersions,
    })),
  }
  fs.mkdirSync(path.dirname(abs(BASELINE_REL)), { recursive: true })
  fs.writeFileSync(abs(BASELINE_REL), `${JSON.stringify(baseline, null, 2)}\n`)
  console.log(
    `[deps-audit] wrote ${BASELINE_REL}: froze ${entries.length} advisory(ies)`
    + ` (runtime ${runtimeEntries.length} / client-toolchain ${entries.length - runtimeEntries.length})`,
  )
  process.exit(0)
}

const baseline = loadBaseline()
const known = new Set((baseline.entries || []).map((entry) => entry.key))
const newEntries = entries.filter((entry) => !known.has(entry.key))
const newRuntime = newEntries.filter((entry) => entry.tier === TIER_RUNTIME)

const report = {
  kind: "deps-audit-report",
  baselineExists: fs.existsSync(abs(BASELINE_REL)),
  tierSource: LOCKFILE_REL,
  totals: {
    advisories: entries.length,
    runtime: runtimeEntries.length,
    clientToolchain: entries.length - runtimeEntries.length,
    bySeverity: countBySeverity(entries),
  },
  // 全量清单（含 tier）。--audit 的价值就在这里：能把"逐条分层"当事实核对，
  // 而不是只看一个总数（那正是本次修的那个缺陷：总数在翻却看不出是哪条）。
  advisories: entries.map((entry) => ({
    key: entry.key,
    severity: entry.severity,
    tier: entry.tier,
    patchedVersions: entry.patchedVersions || null,
  })),
  newAdvisories: newEntries.map((entry) => ({
    key: entry.key,
    severity: entry.severity,
    tier: entry.tier,
    title: entry.title,
    patchedVersions: entry.patchedVersions || null,
  })),
  newRuntimeReachable: newRuntime.length,
  // 无补丁版本可用 = 升级解决不了，只能移除依赖或记已接受风险。
  unfixable: entries.filter((entry) => !entry.patchedVersions).map((entry) => entry.key),
}

if (auditOnly) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(newEntries.length === 0 ? 0 : 1)
}

if (newEntries.length === 0) {
  console.log(
    `[deps-audit] PASS: ${entries.length} advisory(ies) frozen in baseline`
    + ` (runtime-reachable ${runtimeEntries.length}), no NEW advisory.`
    + ` bySeverity=${JSON.stringify(report.totals.bySeverity)}`,
  )
  if (report.unfixable.length > 0) {
    console.log(`[deps-audit] no patch available (accepted-risk candidates): ${report.unfixable.join(", ")}`)
  }
  process.exit(0)
}

console.error(`[deps-audit] FAIL: ${newEntries.length} NEW dependency advisory(ies) not in ${BASELINE_REL}`)
for (const entry of newEntries) {
  const marker = entry.tier === TIER_RUNTIME ? "RUNTIME-REACHABLE" : "client-toolchain"
  console.error(`  - [${entry.severity}][${marker}] ${entry.key}${entry.patchedVersions ? "" : " (no patch available)"}`)
  console.error(`      ${entry.title}`)
  if (entry.patchedVersions) console.error(`      patched: ${entry.patchedVersions}`)
}
console.error("")
console.error("  修掉它们，或（确认可接受后）用 `pnpm run deps:audit:baseline` 刷新基线并复核增量。")
process.exit(1)
