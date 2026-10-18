const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const ARTIFACT_REL = "docs/architecture/artifacts/harness-trace-latest.json"
const BACKLOG_REL = "docs/architecture/artifacts/evolution-backlog.json"

function tryGit(command) {
  try {
    return execSync(command, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim()
  } catch {
    return null
  }
}

function latestSprintLog() {
  const dir = path.join(ROOT, "docs/features/sprint-prod")
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter((name) => /^\d{4}\.md$/.test(name)).sort()
  if (!files.length) return null
  return `docs/features/sprint-prod/${files[files.length - 1]}`
}

function hatchSnapshot() {
  const rel = "packages/shared/contract/hatch-manifest.json"
  const full = path.join(ROOT, ...rel.split("/"))
  if (!fs.existsSync(full)) return null
  const hatch = JSON.parse(fs.readFileSync(full, "utf8"))
  return {
    path: rel,
    profile: hatch.profile || null,
    pruned: Boolean(hatch.pruned),
    domains: hatch.domains || [],
  }
}

function buildTrace(status = "pass") {
  const dirty = Boolean(tryGit("git status --porcelain"))
  return {
    version: 1,
    kind: "harness-gate-trace",
    at: new Date().toISOString(),
    status,
    head: tryGit("git rev-parse --short HEAD"),
    dirty,
    gates: [
      "domain:check",
      "microservice:check",
      "harness:check",
      "admin:routes:check",
      "foundation:ontology:check",
      "skills:check",
      "compat:check",
      "standards:check",
      "cooliebase:matrix:check",
      "cooliebase:governance:check",
    ],
    sprintProd: latestSprintLog(),
    seamGraph: "packages/shared/contract/seam-graph.json",
    backlog: BACKLOG_REL,
    hatch: hatchSnapshot(),
    note: "Last successful npm run check stamp. Session events stay in DigitalStaff Native.",
  }
}

function writeHarnessTrace(status = "pass") {
  const rel = ARTIFACT_REL
  const target = path.join(ROOT, ...rel.split("/"))
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(buildTrace(status), null, 2)}\n`, "utf8")
  return rel
}

if (require.main === module) {
  const written = writeHarnessTrace("pass")
  console.log(`[harness-trace] wrote ${written}`)
}

module.exports = { ARTIFACT_REL, buildTrace, writeHarnessTrace }
