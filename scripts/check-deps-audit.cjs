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
 *   node scripts/check-deps-audit.cjs                 # 门禁（供 npm run check 调用）
 *   node scripts/check-deps-audit.cjs --json          # 机器可读
 *   node scripts/check-deps-audit.cjs --audit         # 打印全部，永不失败
 *   node scripts/check-deps-audit.cjs --write-baseline
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const BASELINE_REL = "docs/architecture/artifacts/deps-audit-baseline.json"
// 分层的真源：依赖图在锁文件里，离线可解析且确定。
const LOCKFILE_REL = "pnpm-lock.yaml"
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
    shell: false,
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

/**
 * 分层：**从锁文件离线推导**「本仓依赖图可达的包名集合」。
 *
 * 为什么不从 `pnpm audit` 的 `findings[].paths` 推导（曾这么做过，是个缺陷）：
 * pnpm **对多父级包会截断 `paths` 列表**（人类可读输出里就写着 "Found 8 paths" 却只列 3 条）。
 * `braces` 恰好有两个父级（tailwindcss→chokidar 与 react-native→…→micromatch），
 * 截断发生时只剩 expo 那条 → 被误标成 client-toolchain，同一状态连跑三次得到 5/5/6。
 * 判据不该建立在一个"采样式"字段上，故改用依赖图的真源：pnpm-lock.yaml。
 *
 * 解析策略刻意做得极窄，只认三个缩进层（不追求解析完整 YAML）：
 *   importers:  项目键 2 空格 / 依赖段键 4 空格 / 包名 6 空格
 *   snapshots:  快照键 2 空格 / 依赖段键 4 空格 / `name: version` 6 空格
 * 认不出的行一律忽略（不猜）。锁文件缺失或推导出空集合时 **fail-loud** ——
 * 否则会退化成"全部 client-toolchain"这种看起来正常、实际全错的答案。
 */
function packageNameOfSnapshot(key) {
  // 快照键形如 `@scope/name@1.2.3(peer@4.5.6)`：先去 peer 后缀，再按最后一个 @ 切版本。
  const withoutPeers = key.replace(/\(.*$/, "")
  const at = withoutPeers.lastIndexOf("@")
  return at > 0 ? withoutPeers.slice(0, at) : withoutPeers
}

const DEP_SECTION_KEYS = new Set(["dependencies", "devDependencies", "optionalDependencies"])

function hostReachablePackageNames() {
  const full = path.join(ROOT, LOCKFILE_REL)
  if (!fs.existsSync(full)) {
    fail(`lockfile missing: ${LOCKFILE_REL}; cannot derive tiers deterministically`)
  }
  const raw = fs.readFileSync(full, "utf8")
  // 多文档 YAML：第一份是 pnpm 自身的 packageManagerDependencies 段，真正的 workspace 锁在最后一份。
  const documents = raw.split(/^---\s*$/m)
  const doc = documents[documents.length - 1]
  if (!doc || !/^importers:/m.test(doc)) {
    fail(`${LOCKFILE_REL}: could not locate the workspace document (multi-document split failed)`)
  }

  const declaredByProject = new Map()
  const edgesByName = new Map()
  const unquote = (value) => value.replace(/^['"]|['"]$/g, "")

  let section = null
  let project = null
  let snapshotName = null
  let inDependencySection = false

  for (const line of doc.split("\n")) {
    if (!line.trim()) continue
    const indent = line.length - line.trimStart().length
    const text = line.trim()

    if (indent === 0) {
      section = text === "importers:" || text === "snapshots:" ? text.replace(":", "") : null
      project = null
      snapshotName = null
      inDependencySection = false
      continue
    }
    if (!section) continue

    if (section === "importers") {
      if (indent === 2 && text.endsWith(":")) {
        project = unquote(text.slice(0, -1))
        inDependencySection = false
      } else if (indent === 4 && text.endsWith(":")) {
        inDependencySection = DEP_SECTION_KEYS.has(text.slice(0, -1))
      } else if (indent === 6 && inDependencySection && project) {
        const name = unquote(text.split(":")[0])
        if (!name) continue
        if (!declaredByProject.has(project)) declaredByProject.set(project, new Set())
        declaredByProject.get(project).add(name)
      }
      continue
    }

    if (indent === 2 && text.endsWith(":")) {
      snapshotName = packageNameOfSnapshot(unquote(text.slice(0, -1)))
      inDependencySection = false
      if (snapshotName && !edgesByName.has(snapshotName)) edgesByName.set(snapshotName, new Set())
    } else if (indent === 4 && text.endsWith(":")) {
      inDependencySection = DEP_SECTION_KEYS.has(text.slice(0, -1))
    } else if (indent === 6 && inDependencySection && snapshotName) {
      const name = unquote(text.split(":")[0])
      if (name) edgesByName.get(snapshotName).add(name)
    }
  }

  // host = 本仓自己的项目（根 `.` 与 packages/**）；clients/** 属客户端，不计入。
  const roots = []
  for (const [name, declared] of declaredByProject) {
    if (name === "." || name.startsWith("packages/")) roots.push(...declared)
  }

  const reachable = new Set()
  const queue = [...roots]
  while (queue.length > 0) {
    const name = queue.pop()
    if (reachable.has(name)) continue
    reachable.add(name)
    for (const dep of edgesByName.get(name) || []) if (!reachable.has(dep)) queue.push(dep)
  }

  if (reachable.size === 0) {
    fail(`${LOCKFILE_REL}: derived an empty host-reachable set — refusing to label everything client-toolchain`)
  }
  return reachable
}

const HOST_REACHABLE = hostReachablePackageNames()

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
      + "用 `npm run deps:audit:baseline` 刷新，并逐条复核增量后再提交 —— 刷新基线等于接受这些洞。",
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
console.error("  修掉它们，或（确认可接受后）用 `npm run deps:audit:baseline` 刷新基线并复核增量。")
process.exit(1)
