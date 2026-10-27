// 观测探针：套件运行期间，谁在改真仓的共享文件？
// 用法：node scratch/watch-shared.cjs <日志路径>
// 另一个终端跑 pnpm run test:clean，结束后看日志。
const fs = require("node:fs")
const crypto = require("node:crypto")
const path = require("node:path")

const ROOT = process.cwd()
const LOG = process.argv[2] || "/tmp/watch-shared.log"
const WATCH = [
  "package.json",
  "scripts/harness.cjs",
  "docs/architecture/artifacts/harness-unreachable-scripts.json",
  "docs/architecture/artifacts/typecheck-baseline.json",
  "docs/architecture/artifacts/engineering-standards-baseline.json",
  "docs/architecture/artifacts/deps-audit-baseline.json",
  "AGENTS.md",
  "docs/01_management/project-plan.md",
  "llms.txt",
  "README.md",
  "docs/07_release/RELEASE_NOTES_v1.4.0-brand-shorthand.md",
  "docs/02_requirements/rtm-traceability-matrix.md",
]

const hash = (f) => {
  try {
    return crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, f))).digest("hex").slice(0, 12)
  } catch {
    return "MISSING"
  }
}

const state = new Map(WATCH.map((f) => [f, hash(f)]))
const out = fs.createWriteStream(LOG, { flags: "a" })
const t0 = Date.now()

setInterval(() => {
  for (const f of WATCH) {
    const h = hash(f)
    if (h !== state.get(f)) {
      const line = `[+${String(Date.now() - t0).padStart(6)}ms] ${f}  ${state.get(f)} → ${h}`
      out.write(line + "\n")
      console.log(line)
      state.set(f, h)
    }
  }
}, 50)

process.on("SIGINT", () => { out.end(); process.exit(0) })
