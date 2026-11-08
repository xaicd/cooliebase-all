/**
 * Wiki 与生成物路径真实性及陈旧词条门禁。
 *
 * 职责：
 * 1. 检查 `wiki/**` 中引用的仓内路径（`packages/...` 等）与裸文件名是否真实存在；
 * 2. 检查 `wiki/domains/*.md` 是否存在已被裁剪或无对应 `domain-catalog.json` 元数据的陈旧词条；
 * 3. 支持 `--prune` / `--write`：在新项目孵化裁剪（`project:create` / `project:init`）后，
 *    自动清理被裁域的 `wiki/domains/<domain>.md`、`wiki/index.md` 对应行及已清理归档目录的引用，
 *    无需再用臃肿的脚本全量覆盖重写静态 Markdown。
 *
 * Usage:
 *   node scripts/check-generated-paths.cjs [--check] [--json]
 *   node scripts/check-generated-paths.cjs --prune | --write
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")
const isPrune = process.argv.includes("--prune") || process.argv.includes("--write")

/** 受检文档目录 */
const GENERATED_ROOTS = ["wiki"]

const PATH_PATTERN = "`((?:packages|docs|src|scripts|clients|test|prisma|sql|deploy)/[A-Za-z0-9_@./[\\]-]+)`"
const BARE_NAME_PATTERN = "`([A-Za-z0-9_@.-]+\\.(?:json|ts|tsx|md|cjs|mjs|sql|yaml|yml))`"

function loadActiveDomainNames() {
  const catalogPath = path.join(ROOT, "packages/shared/backend/constants/domain-catalog.json")
  if (!fs.existsSync(catalogPath)) return new Set()
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
  return new Set((catalog.domains || []).map((d) => d.name))
}

function pruneStaleWikiArtifacts(activeDomains) {
  const domainsDir = path.join(ROOT, "wiki", "domains")
  const removed = []
  if (fs.existsSync(domainsDir)) {
    for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue
      const domainName = entry.name.replace(/\.md$/, "")
      if (!activeDomains.has(domainName)) {
        const full = path.join(domainsDir, entry.name)
        fs.unlinkSync(full)
        removed.push(`wiki/domains/${entry.name}`)
        console.log(`[wiki:prune] 已删除陈旧词条: wiki/domains/${entry.name}`)
      }
    }
  }

  // 同步过滤 wiki/index.md 中已被裁剪的领域行
  const indexMdPath = path.join(ROOT, "wiki", "index.md")
  if (fs.existsSync(indexMdPath)) {
    const raw = fs.readFileSync(indexMdPath, "utf8")
    const filtered = raw
      .split("\n")
      .filter((line) => {
        const m = line.match(/^\|\s*\[([a-z0-9_-]+)\]\(domains\/[a-z0-9_-]+\.md\)\s*\|/)
        if (!m) return true
        return activeDomains.has(m[1])
      })
      .join("\n")
    if (filtered !== raw) {
      fs.writeFileSync(indexMdPath, filtered, "utf8")
    }
  }

  // 若派生项目已清理 docs/specs/archive，同步清理 wiki/cmmi/cmmi-lifecycle.md 中的归档示例路径引用
  const cmmiPath = path.join(ROOT, "wiki", "cmmi", "cmmi-lifecycle.md")
  const archiveSampleDir = path.join(ROOT, "docs/specs/archive/2026-Q4/shop/ecommerce")
  if (fs.existsSync(cmmiPath) && !fs.existsSync(archiveSampleDir)) {
    const raw = fs.readFileSync(cmmiPath, "utf8")
    const next = raw.replace(
      /.*docs\/specs\/archive\/2026-Q4\/shop\/ecommerce\/.*/g,
      "   - 历史规格归档区：详见项目各季度迭代归档目录（新孵化项目默认已清空基座历史）",
    )
    if (next !== raw) {
      fs.writeFileSync(cmmiPath, next, "utf8")
    }
  }

  return removed
}

function collectMarkdown(dir) {
  const out = []
  const walk = (current) => {
    let entries
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
        walk(full)
      } else if (entry.name.endsWith(".md")) {
        out.push(full)
      }
    }
  }
  walk(path.join(ROOT, dir))
  return out
}

const activeDomains = loadActiveDomainNames()
if (isPrune) {
  pruneStaleWikiArtifacts(activeDomains)
  console.log("[wiki:prune] PASS: Wiki 词条已与当前域目录对齐")
  process.exit(0)
}

const files = GENERATED_ROOTS.flatMap(collectMarkdown)
if (files.length === 0) {
  console.error(`[gen-paths] ✗ 未找到任何 Wiki 文档（目录: ${GENERATED_ROOTS.join(", ")}）—— 拒绝在零命中时判定通过`)
  process.exit(1)
}

const trackedBasenames = (() => {
  const result = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  if (result.status !== 0) {
    console.error("[gen-paths] ✗ 无法列出 git 跟踪文件（拒绝在未知文件集上判定）")
    process.exit(1)
  }
  return new Set((result.stdout || "").split("\n").filter(Boolean).map((p) => path.basename(p)))
})()

let checked = 0
let checkedBare = 0
let skipped = 0
const problems = []

// 检查 wiki/domains/*.md 是否有陈旧词条
const domainsDir = path.join(ROOT, "wiki", "domains")
if (fs.existsSync(domainsDir)) {
  for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue
    const domainName = entry.name.replace(/\.md$/, "")
    if (!activeDomains.has(domainName)) {
      problems.push({
        file: `wiki/domains/${entry.name}`,
        line: 1,
        target: `wiki/domains/${entry.name}`,
        kind: "stale-domain",
      })
    }
  }
}

for (const full of files) {
  const rel = path.relative(ROOT, full).split(path.sep).join("/")
  const text = fs.readFileSync(full, "utf8")
  text.split("\n").forEach((line, index) => {
    for (const match of line.matchAll(new RegExp(PATH_PATTERN, "g"))) {
      const target = match[1]
      if (target.includes("*") || target.includes("...")) {
        skipped += 1
        continue
      }
      checked += 1
      if (!fs.existsSync(path.join(ROOT, target))) {
        problems.push({ file: rel, line: index + 1, target, kind: "path" })
      }
    }
    for (const match of line.matchAll(new RegExp(BARE_NAME_PATTERN, "g"))) {
      const name = match[1]
      checkedBare += 1
      if (!trackedBasenames.has(name)) {
        problems.push({ file: rel, line: index + 1, target: name, kind: "bare-name" })
      }
    }
  })
}

if (checked === 0 || checkedBare === 0) {
  console.error(
    `[gen-paths] ✗ 命中数异常（完整路径 ${checked} / 裸文件名 ${checkedBare}）`
    + " —— 拒绝在零命中时判定通过（检查器可能已失效）",
  )
  process.exit(1)
}

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, checked, skipped, problems }, null, 2))
} else if (problems.length === 0) {
  console.log(
    `[gen-paths] PASS: Wiki 中的 ${checked} 处路径与 ${checkedBare} 处文件名引用全部真实存在`
    + `（跳过通配写法 ${skipped} 处）`,
  )
} else {
  for (const problem of problems) {
    if (problem.kind === "stale-domain") {
      console.error(`[gen-paths] 陈旧词条（已无对应元数据，应删除）: ${problem.file}`)
    } else {
      const what = problem.kind === "bare-name" ? "引用了不存在的文件名" : "引用了不存在的路径"
      console.error(`[gen-paths] ✗ ${problem.file}:${problem.line} — ${what}: ${problem.target}`)
    }
  }
  console.error(
    `\n[gen-paths] FAIL: ${problems.length} 处 Wiki 引用了不存在的路径或存在陈旧词条`
    + "\n  请修正对应 Wiki 文档，或运行 `node scripts/check-generated-paths.cjs --prune` 清理被裁域词条。",
  )
}

process.exit(problems.length === 0 ? 0 : 1)
