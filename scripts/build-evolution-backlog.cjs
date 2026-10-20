/**
 * Evolution backlog — closes the "trace -> refinement -> candidate work -> gated merge" loop.
 *
 * This repository does NOT host an agent loop (AGENTS.md §18). What it does instead is turn the
 * signals the gates already produce into one prioritised, evidence-linked, machine-readable
 * backlog that an external agent (Claude Code / Cursor / Command Code / DSH) can pick up.
 *
 * Every item is derived from a real artifact and carries the exact command to verify a fix.
 * Nothing here is invented, and nothing here fails the build — debt is surfaced, not hidden.
 *
 * Usage:
 *   node scripts/build-evolution-backlog.cjs            # write artifact + print digest
 *   node scripts/build-evolution-backlog.cjs --json     # machine-readable to stdout (for MCP)
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT, loadCatalog, domainDirOf } = require("./lib/domain-catalog.cjs")

const ARTIFACT_REL = "docs/architecture/artifacts/evolution-backlog.json"
const TRACE_REL = "docs/architecture/artifacts/harness-trace-latest.json"

const SEVERITY_ORDER = { blocker: 0, high: 1, medium: 2, low: 3 }
const SRC_MODULES = "packages/domains"
const OVERSIZED_FILE_LINES = 200
const MIN_DOMAIN_TESTS = 2

const asJson = process.argv.includes("--json")

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function readJsonSafe(rel) {
  const full = abs(rel)
  if (!fs.existsSync(full)) return null
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"))
  } catch {
    return null
  }
}

function walk(dirRel, predicate) {
  const root = abs(dirRel)
  if (!fs.existsSync(root)) return []
  const out = []
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        visit(full)
      } else if (predicate(entry.name)) {
        out.push(full)
      }
    }
  }
  visit(root)
  return out
}

function toRel(full) {
  return path.relative(ROOT, full).replace(/\\/g, "/")
}

function gitHead() {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" })
  return result.status === 0 ? result.stdout.trim() : null
}

// --- signal collectors -------------------------------------------------------

function collectGateStatus() {
  const trace = readJsonSafe(TRACE_REL)
  if (!trace) {
    return [
      {
        id: "gate-trace-missing",
        severity: "medium",
        section: "AGENTS.md §6",
        title: "No gate trace stamp found",
        files: [TRACE_REL],
        evidence: `${TRACE_REL} does not exist, so no gate run has been recorded`,
        command: "pnpm run check",
        action: "Run the gate chain to record a trace stamp.",
      },
    ]
  }

  const items = []
  if (trace.status !== "pass") {
    items.push({
      id: "gate-failing",
      severity: "blocker",
      section: "AGENTS.md §6",
      title: `Gate chain last stamped ${trace.status}`,
      files: [TRACE_REL],
      evidence: `harness-trace status=${trace.status} at ${trace.at}`,
      command: "pnpm run check",
      action: "Fix the failing gate before any other work.",
    })
  }

  const head = gitHead()
  if (head && trace.head && head !== trace.head) {
    items.push({
      id: "gate-trace-stale",
      severity: "low",
      section: "AGENTS.md §6",
      title: "Gate trace is older than HEAD",
      files: [TRACE_REL],
      evidence: `trace.head=${trace.head}, current HEAD=${head}`,
      command: "pnpm run check",
      action: "Re-run the gates so the recorded evidence matches the current revision.",
    })
  }
  return items
}

function standardsReport() {
  const result = spawnSync(
    process.execPath,
    [abs("scripts/check-engineering-standards.cjs"), "--json"],
    { cwd: ROOT, encoding: "utf8" },
  )
  const stdout = (result.stdout || "").trim()
  if (!stdout) return null
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

function collectStandards(report) {
  if (!report) return []
  const items = []

  const byRule = new Map()
  for (const entry of report.reportOnly || []) {
    if (!byRule.has(entry.rule)) byRule.set(entry.rule, [])
    byRule.get(entry.rule).push(entry)
  }
  for (const [rule, entries] of byRule) {
    const ruleMeta = (report.rules || []).find((item) => item.id === rule)
    items.push({
      id: `standards-report-${rule}`,
      severity: "medium",
      section: ruleMeta?.section || "AGENTS.md",
      title: `${rule}: ${entries.length} item(s) need human judgement`,
      files: entries.map((entry) => entry.file),
      evidence: (ruleMeta?.description || "") + ` — e.g. ${entries
        .slice(0, 3)
        .map((entry) => `${entry.file} (${entry.detail})`)
        .join("; ")}${entries.length > 3 ? `; +${entries.length - 3} more` : ""}`,
      command: "node scripts/check-engineering-standards.cjs --audit",
      action: "Decide per file whether it is a real gap or an accepted exception; if the rule needs a documented exemption, add it to the rule rather than the code.",
    })
  }

  for (const entry of report.rules || []) {
    if (entry.mode !== "ratchet" || !entry.acceptedFiles) continue
    items.push({
      id: `standards-debt-${entry.id}`,
      severity: "low",
      section: entry.section,
      title: `${entry.id}: ${entry.acceptedFiles} file(s) carry frozen debt`,
      files: [],
      evidence: `baseline accepts debt in ${entry.acceptedFiles} file(s); new debt is already blocked`,
      command: "pnpm run standards:baseline",
      action: "Burn the frozen debt down, then re-baseline so the rule can move from ratchet to enforce.",
    })
  }
  return items
}

function collectThinDomainTests() {
  const domains = loadCatalog().domains
  const items = []
  for (const domain of domains) {
    // 域可能是第一方插件(目录在 packages/plugins/plugin-*)，用共享解析器
    const dir = domainDirOf(ROOT, domain.name)
    if (!fs.existsSync(abs(dir))) continue
    const tests = walk(dir, (name) => /\.test\.ts$/.test(name))
    if (tests.length >= MIN_DOMAIN_TESTS) continue
    items.push({
      id: `thin-tests-${domain.name}`,
      severity: "medium",
      section: "AGENTS.md §8",
      title: `${domain.name}: only ${tests.length} test file(s)`,
      files: tests.map(toRel),
      evidence: `stage=${domain.stage}, kind=${domain.kind}; §8 requires at least one key-path automated test per domain`,
      command: `npm test -- --run ${domainDirOf(ROOT, domain.name)}`,
      action: "Add key-path, permission-denial and transaction-rollback tests for this domain.",
    })
  }
  return items
}

function collectOversizedFiles() {
  const files = walk(`${SRC_MODULES}`, (name) => /\.(service|repository)\.ts$/.test(name)).filter((file) =>
    toRel(file).includes("/backend/"),
  )
  const items = []
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split("\n").length
    if (lines <= OVERSIZED_FILE_LINES) continue
    items.push({
      id: `oversized-${toRel(file)}`,
      severity: "low",
      section: "AGENTS.md §11",
      title: `${path.basename(toRel(file))}: ${lines} lines`,
      files: [toRel(file)],
      evidence: `§11.2 asks for files over ${OVERSIZED_FILE_LINES} lines to be split into sub-services behind the facade`,
      command: "pnpm run standards:check",
      action: "Split into sub-services, keeping the domain facade as the single entry point.",
    })
  }
  return items
}

function collectTodoMarkers() {
  const files = walk(SRC_MODULES, (name) => /\.tsx?$/.test(name)).filter(
    (file) => !toRel(file).includes("__tests__"),
  )
  const hits = []
  for (const file of files) {
    fs.readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        if (/\b(TODO|FIXME)\b/.test(line)) {
          hits.push({ file: toRel(file), detail: `line ${index + 1}: ${line.trim().slice(0, 120)}` })
        }
      })
  }
  if (hits.length === 0) return []
  return [
    {
      id: "todo-markers",
      severity: "low",
      section: "AGENTS.md §12",
      title: `${hits.length} TODO/FIXME marker(s) in src`,
      files: hits.map((hit) => hit.file),
      evidence: hits
        .slice(0, 5)
        .map((hit) => `${hit.file} — ${hit.detail}`)
        .join("; "),
      command: "grep -rn 'TODO\\|FIXME' src --include=*.ts",
      action: "Resolve each marker or convert it into a tracked backlog item.",
    },
  ]
}

const report = standardsReport()
const items = [
  ...collectGateStatus(),
  ...collectStandards(report),
  ...collectThinDomainTests(),
  ...collectOversizedFiles(),
  ...collectTodoMarkers(),
].sort((left, right) => {
  const bySeverity = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
  return bySeverity !== 0 ? bySeverity : left.id.localeCompare(right.id)
})

const summary = items.reduce(
  (acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1
    acc.total += 1
    return acc
  },
  { blocker: 0, high: 0, medium: 0, low: 0, total: 0 },
)

const backlog = {
  version: 1,
  kind: "evolution-backlog",
  generatedAt: new Date().toISOString(),
  head: gitHead(),
  note: "Aggregated from real gate artifacts. Read-only signal for external agents; no agent loop runs in this repository (AGENTS.md §18).",
  summary,
  items,
}

if (asJson) {
  console.log(JSON.stringify(backlog, null, 2))
  process.exit(0)
}

const full = abs(ARTIFACT_REL)
fs.mkdirSync(path.dirname(full), { recursive: true })
fs.writeFileSync(full, `${JSON.stringify(backlog, null, 2)}\n`)

console.log(`[evolution] wrote ${ARTIFACT_REL}`)
console.log(
  `[evolution] ${summary.total} item(s): ${summary.blocker} blocker / ${summary.high} high / ${summary.medium} medium / ${summary.low} low`,
)
for (const item of items.slice(0, 12)) {
  console.log(`  ${item.severity.padEnd(7)} ${item.section.padEnd(16)} ${item.title}`)
}
if (items.length > 12) console.log(`  … +${items.length - 12} more (see ${ARTIFACT_REL})`)
