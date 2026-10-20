/**
 * 文档命令真实性门禁。
 *
 * 为什么需要：文档里写着 `pnpm run xxx`，而 `xxx` **根本不在 package.json 里** —— 这类
 * 漂移不会让任何现有门禁变红，但会直接误导照着文档操作的人和 AI Agent（照着跑就是报错）。
 * 已实证的样本：
 *   · `AGENTS.md` §10.3 发布门禁让人跑 `pnpm run docs:sync-context`（不存在）；
 *   · `.kiro/steering/feature-scaffold.md` 让人跑 `pnpm run feature:generate`（真名是 `scaffold`）；
 *   · 归档上游调研文档里的一批 `cooliebase:*` 脚本（当时存在，现已改名）。
 * 与"编造出处"同族：**指向不存在的东西**。
 *
 * 检查范围（刻意排除这些）：
 *   · `docs/specs/**`、`docs/features/**` —— 施工区与历史日志，记录的是"当时"的状态；
 *   · `docs/architecture/archive/**` —— 归档的上游调研，按惯例不改写历史；
 *   · `.kiro/specs/**` —— 同上。
 * 这些目录里的命令**不参与判定**，但会在输出里提示它们未受检（避免误以为全仓都被覆盖）。
 *
 * 约定：无法执行的名字必须进 `ALLOWLIST` 并写明理由。宁可显式豁免，也不要"看起来通过"。
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")

/** 不参与判定的目录（历史/施工区）。 */
const SKIP_PREFIXES = [
  "docs/specs/",
  "docs/features/",
  "docs/architecture/archive/",
  ".kiro/specs/",
  ".claude/",
  "node_modules/",
]

/**
 * 显式豁免：仅供**确属历史记录**的引用使用（例如缺陷台账里"曾经存在但已移除"的脚本名）。
 * 加豁免必须写明理由 —— 宁可显式豁免，也不要为了通过而放宽判定。
 *
 * **当前为空**：此前以为需要豁免的两处（`api:guard` / `git:sync`）实为 `pnpm run` 写法，
 * 已被 `(?<![pP])` 前瞻正确排除。
 * 更好的做法通常是**改写措辞**：让失效名字不紧跟 `npm run`，它就不再是可执行指引。
 */
const ALLOWLIST = []


/**
 * 按文档所在目录**就近**解析 package.json。
 * `clients/expo/README.md` 里的 `pnpm run export:web` 属于该子包的 package.json ——
 * 若一律用根包判定，会产生误报，而误报会逼出无意义的豁免（本仓明确反对）。
 */
const scriptCache = new Map()
function knownScriptsFor(relFile) {
  let dir = path.dirname(path.join(ROOT, relFile))
  while (true) {
    const candidate = path.join(dir, "package.json")
    if (scriptCache.has(candidate)) return scriptCache.get(candidate)
    if (fs.existsSync(candidate)) {
      let scripts = new Set()
      try {
        scripts = new Set(Object.keys(JSON.parse(fs.readFileSync(candidate, "utf8")).scripts || {}))
      } catch {
        scripts = new Set()
      }
      scriptCache.set(candidate, scripts)
      return scripts
    }
    const parent = path.dirname(dir)
    if (parent === dir || !dir.startsWith(ROOT)) break
    dir = parent
  }
  const fallback = new Set()
  scriptCache.set(path.join(ROOT, "package.json"), fallback)
  return fallback
}

function trackedFiles() {
  const result = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  if (result.status !== 0) {
    console.error("[docs-cmd] ✗ 无法列出 git 跟踪文件（拒绝在未知文件集上判定）")
    process.exit(1)
  }
  return (result.stdout || "").split("\n").filter(Boolean)
}

const isDoc = (rel) => rel.endsWith(".md") || rel.endsWith(".txt")
const isSkipped = (rel) => SKIP_PREFIXES.some((prefix) => rel.startsWith(prefix))
const allowed = (rel, script) => ALLOWLIST.some((entry) => entry.file === rel && entry.script === script)

// `(?<![pP])` 排除 `pnpm run`：否则会把 pnpm 的调用误判成 npm 的。
const NPM_PATTERN = /(?<![pP])npm run ([A-Za-z0-9:_*-]+)/g
const NODE_PATTERN = /node (scripts\/[A-Za-z0-9_./-]+\.(?:cjs|ts|mjs))/g

const files = trackedFiles()
const problems = []
const skippedHits = []
let checked = 0

for (const rel of files) {
  if (!isDoc(rel)) continue
  let text
  try {
    text = fs.readFileSync(path.join(ROOT, rel), "utf8")
  } catch {
    continue
  }
  const lines = text.split("\n")
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    for (const match of line.matchAll(NPM_PATTERN)) {
      const script = match[1]
      if (script.includes("*")) continue // 通配写法（如 `pnpm run cooliebase:*:check`）不是具体命令
      const record = { file: rel, line: i + 1, script }
      if (isSkipped(rel)) {
        if (!knownScriptsFor(rel).has(script)) skippedHits.push(record)
        continue
      }
      checked += 1
      if (!knownScriptsFor(rel).has(script) && !allowed(rel, script)) {
        problems.push({ ...record, kind: "npm-run", detail: `package.json 里没有脚本 "${script}"` })
      }
    }
    for (const match of line.matchAll(NODE_PATTERN)) {
      const target = match[1]
      const record = { file: rel, line: i + 1, script: target }
      if (isSkipped(rel)) {
        if (!fs.existsSync(path.join(ROOT, target))) skippedHits.push(record)
        continue
      }
      checked += 1
      if (!fs.existsSync(path.join(ROOT, target))) {
        problems.push({ ...record, kind: "node-script", detail: `文件不存在: ${target}` })
      }
    }
  }
}

if (checked === 0) {
  console.error("[docs-cmd] ✗ 未检查到任何命令引用 —— 拒绝在'零命中'时判定通过（检查器可能已失效）")
  process.exit(1)
}

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, checked, problems, skippedFilesWithStaleRefs: skippedHits.length }, null, 2))
} else if (problems.length === 0) {
  console.log(
    `[docs-cmd] PASS: 受检文档中的 ${checked} 处命令引用全部真实存在`
    + `（另有 ${skippedHits.length} 处位于历史/施工区，未参与判定）`,
  )
} else {
  for (const problem of problems) {
    console.error(`[docs-cmd] ✗ ${problem.file}:${problem.line} — ${problem.detail}`)
  }
  console.error(
    `\n[docs-cmd] FAIL: ${problems.length} 处命令引用指向不存在的东西`
    + `\n  修法：改正文档，或（确属历史记录时）加入 scripts/check-docs-commands.cjs 的 ALLOWLIST 并写明理由。`,
  )
}

process.exit(problems.length === 0 ? 0 : 1)
