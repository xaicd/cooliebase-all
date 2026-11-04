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
 * 「不可审计」与「0 漏洞」是两件事（实测事故，不是假想）:
 *   私有 registry（如 https://xrobinai.cn/npm/）**没有 audit 端点**，
 *   `pnpm audit` 直接报 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`。
 *   那既不是「0 漏洞」，也不是「有漏洞」—— 它是**不可判定**。
 *   旧实现把它当成「审计失败」直接抛错 ⇒ 客户工作区 pre-commit 全量门禁**恒红**，
 *   任何提交只能靠 AGENT_ROUTE_SKIP=1 绕过 —— 这比放过真漏洞更坏（门禁被 habit 化）。
 *   现在：不可判定 → **记为不可判定并提示配置**（写状态工件 + 明确告警），
 *   默认**不**把环境缺失误判为供应链风险；要不要把「不可判定」也判红由环境显式决定。
 *
 * 模式（DEPS_AUDIT 环境变量，或同名命令行开关）:
 *   auto     （默认）不可判定 → 记工件 + 告警 + 退出 0；能审计 → 照常棘轮
 *   required 不可判定 → 判红（要求「必须可审计」，用于公共 registry 的 CI）
 *   skip     完全跳过审计（记工件 + 告警 + 退出 0）
 *
 * Usage:
 *   node scripts/check-deps-audit.cjs                 # 门禁（供 pnpm run check 调用）
 *   node scripts/check-deps-audit.cjs --json          # 机器可读
 *   node scripts/check-deps-audit.cjs --audit         # 打印全部，永不失败
 *   node scripts/check-deps-audit.cjs --write-baseline
 *   DEPS_AUDIT=required node scripts/check-deps-audit.cjs   # 不可判定即判红
 *   DEPS_AUDIT=skip    node scripts/check-deps-audit.cjs   # 完全跳过
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")
// 锁文件窄解析器已提取为共享 lib —— 依赖分层与 SBOM 用的是同一份真源。
const { LOCKFILE_REL, hostReachablePackageNames } = require("./lib/pnpm-lock.cjs")

const BASELINE_REL = "docs/architecture/artifacts/deps-audit-baseline.json"
// 「不可判定」也要留痕：状态工件是这次审计**能不能判定**的唯一可查证据。
const STATUS_REL = "docs/architecture/artifacts/deps-audit-status.json"
// pnpm audit 要联网查通告库，给足时间。
const AUDIT_TIMEOUT_MS = 180000

const asJson = process.argv.includes("--json")
const auditOnly = process.argv.includes("--audit")
const writeBaseline = process.argv.includes("--write-baseline")

const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

const TIER_RUNTIME = "runtime"
const TIER_CLIENT = "client-toolchain"

const MODE_AUTO = "auto"
const MODE_REQUIRED = "required"
const MODE_SKIP = "skip"

/**
 * 解析审计模式。优先级：命令行开关 > DEPS_AUDIT 环境变量 > 默认 auto。
 * 未知取值不静默 —— 判红并列出合法取值（拼错的环境变量名必须看得见）。
 */
function resolveMode() {
  if (process.argv.includes("--require-audit")) return MODE_REQUIRED
  if (process.argv.includes("--skip-audit")) return MODE_SKIP
  const raw = String(process.env.DEPS_AUDIT || "").trim().toLowerCase()
  if (!raw) return MODE_AUTO
  if (raw === MODE_AUTO || raw === MODE_REQUIRED || raw === MODE_SKIP) return raw
  fail(
    `unknown DEPS_AUDIT mode "${raw}". Expected one of: ${MODE_AUTO} | ${MODE_REQUIRED} | ${MODE_SKIP}.`,
  )
}

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function fail(message) {
  throw new Error(`[deps-audit] ${message}`)
}

/** 写「本次审计能不能判定」的状态工件（未纳入版本库 —— 它是每次运行的环境快照）。 */
function writeStatus(status) {
  const payload = {
    version: 1,
    kind: "deps-audit-status",
    mode: status.mode,
    status: status.status,
    reason: status.reason || null,
    detail: status.detail || null,
    registry: status.registry || null,
    checkedAt: new Date().toISOString(),
    note:
      "「undecidable」= 本次无法审计（registry 无 audit 端点等），"
      + "既不等于 0 漏洞也不等于有漏洞；解除办法：换用带 audit 端点的 registry，"
      + "或显式声明 DEPS_AUDIT=skip（接受不可审计）/ DEPS_AUDIT=required（不可判定即判红）。",
  }
  const full = abs(STATUS_REL)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `${JSON.stringify(payload, null, 2)}\n`)
  return full
}

/**
 * 跑 pnpm audit。
 *
 * 关键：**有漏洞时 pnpm 自己返回非 0**，那不是工具失败 —— 绝不能据此判定，
 * 但也绝不能因为"没拿到结果"就当作 0 漏洞通过（那是静默放行）。
 *
 * 返回两种结果：
 *   { ok: true, data }              审计成功，data 是 pnpm 的 JSON
 *   { ok: false, undecidable: true } **不可判定**（registry 没有 audit 端点）—— 只在
 *                                   明确识别到 ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS 时才这么判；
 *                                   其它失败（网络/工具坏了）仍然是硬失败，不许被降级成「不可判定」。
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
  const stderr = String(result.stderr || "").trim()
  const combined = `${stdout}\n${stderr}`

  // 私有 registry 没有 audit 端点 —— 这是**环境缺口**，不是供应链风险信号。
  if (
    combined.includes("ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS")
    || combined.includes("ERR_PNPM_NO_AUDIT_ENDPOINT")
    || /audit endpoint[\s\S]{0,120}(doesn't exist|not exist)/i.test(combined)
  ) {
    const endpoint = (combined.match(/https?:\/\/\S+/) || [null])[0]
    return {
      ok: false,
      undecidable: true,
      reason: "audit-endpoint-not-exists",
      registry: endpoint,
      detail: combined.replace(/\s+/g, " ").slice(0, 600),
    }
  }

  if (!stdout) {
    const detail = String(result.stderr || result.error?.message || "").trim().slice(0, 400)
    fail(`pnpm audit produced no JSON output (exit=${result.status}). Refusing to treat this as "0 vulnerabilities". ${detail}`)
  }
  try {
    return { ok: true, data: JSON.parse(stdout) }
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

function collectEntries(data) {
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

const MODE = resolveMode()

/**
 * 「不可判定」的统一出口。
 *
 * 纪律：**绝不把「没审计成」说成「0 漏洞」**（那是静默放行）；
 * 同时也**绝不把环境缺失误判成供应链风险**（那是恒红阻断 → 门禁被绕过）。
 * 正确姿势：显式记为 undecidable + 提示配置 + 由 DEPS_AUDIT 决定要不要判红。
 */
function exitUndecidable(audit) {
  writeStatus({
    mode: MODE,
    status: "undecidable",
    reason: audit.reason,
    detail: audit.detail,
    registry: audit.registry,
  })
  const message = [
    `[deps-audit] UNDECIDABLE: 本次无法完成依赖漏洞审计（${audit.reason}）。`,
    `  registry: ${audit.registry || "未知"}`,
    `  已记状态工件: ${STATUS_REL}`,
    `  这既不是「0 漏洞」也不是「有漏洞」—— 本次审计**不可判定**。`,
    `  解法：① 换用带 audit 端点的 registry；② DEPS_AUDIT=skip 显式接受不可审计；`,
    `        ③ DEPS_AUDIT=required 要求「不可判定」也判红（公共 registry 的 CI 用这条）。`,
  ].join("\n")
  if (asJson) {
    console.log(
      JSON.stringify(
        {
          kind: "deps-audit-report",
          status: "undecidable",
          mode: MODE,
          reason: audit.reason,
          registry: audit.registry || null,
          totals: { advisories: null, runtime: null, clientToolchain: null, bySeverity: null },
          advisories: [],
          newAdvisories: [],
          newRuntimeReachable: null,
          unfixable: [],
        },
        null,
        2,
      ),
    )
  }
  if (MODE === MODE_REQUIRED) {
    console.error(message)
    console.error("")
    console.error("  DEPS_AUDIT=required：不可判定即判红。")
    process.exit(1)
  }
  console.warn(message)
  process.exit(0)
}

if (MODE === MODE_SKIP) {
  writeStatus({
    mode: MODE,
    status: "skipped",
    reason: "explicit-skip",
    detail: "DEPS_AUDIT=skip —— 显式跳过依赖漏洞审计",
  })
  console.warn(
    `[deps-audit] SKIPPED: DEPS_AUDIT=skip —— 已跳过依赖漏洞审计（状态已记 ${STATUS_REL}）。`
    + `本次提交**未经**供应链 CVE 审计，自行承担该风险。`,
  )
  process.exit(0)
}

const audit = runAudit()
if (!audit.ok) {
  // runAudit 只在明确识别到「registry 没有 audit 端点」时返回不可判定；
  // 其它失败在上面已经 fail() 了（硬失败，不许降级）。
  exitUndecidable(audit)
}

const entries = collectEntries(audit.data)
const runtimeEntries = entries.filter((entry) => entry.tier === TIER_RUNTIME)

// 本次**可判定** —— 同样留痕，好让「上次到底审没审成」有据可查（工件不入版本库）。
writeStatus({
  mode: MODE,
  status: "decidable",
  reason: null,
  detail: `审计成功：${entries.length} 条通告（runtime 可达 ${runtimeEntries.length} 条）`,
})

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
  status: "decidable",
  mode: MODE,
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
