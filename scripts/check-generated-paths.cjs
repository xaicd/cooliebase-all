/**
 * 生成物路径真实性门禁。
 *
 * 为什么只查**生成物**：全仓文档的路径引用里混着大量**合法**的"不存在的路径" ——
 * 反例语境（"严禁建立 `docs/skills/`"）、外部项目路径（DigitalStaff / Paperclip）、
 * 对标框架示例、历史记录。对全仓做这件事**误报率极高**，必然逼出无意义豁免。
 *
 * 但**生成物**不一样：`wiki/**` 由 `scripts/sync-openwiki.cjs` 产出，
 * 它**只应该引用真实存在的路径**。实测该范围 **95 处引用、0 处不存在**（零误报），
 * 因此可以、也应该作为门禁。
 *
 * 已实证它能抓到的真实缺陷（本门禁建立之前修掉的）：
 *   · 生成器给**每个**插件都硬写 `backend/repositories/`，而 `plugin-online` 并无该目录；
 *   · 生成器把 `packages/shared/backend/database/` 写成不存在的位置（真值为 `.../lib/database/`）；
 *   · 生成器引用已迁移的 `docs/features/ecommerce/brief.json`。
 *
 * Usage: node scripts/check-generated-paths.cjs [--json]
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")

/** 生成物范围（目前只有 wiki；新增生成式 markdown 时在此登记）。 */
const GENERATED_ROOTS = ["wiki"]

/**
 * 只检仓内路径（外部项目引用不在生成物里出现，若出现即为缺陷）。
 *
 * **两道口径缺一不可** —— 第二道是被实际漏检逼出来的：
 *  · 第一道：以目录开头的完整路径（`packages/...`）；
 *  · 第二道：**裸文件名**（`xxx.generated.json` 这种）。
 * 只做第一道时，`wiki/architecture/*.md` 里引用的 `agent-page-schemas.generated.json`
 * **整整溜了过去** —— 因为它是裸文件名、没有前导目录。而该文件**根本不存在**
 * （真值是 `packages/shared/contract/page-schemas.generated.ts`）。
 * 实测第二道在本仓 wiki 上 **339 处引用、0 处误报**（唯二命中的就是那个真缺陷）。
 */
const PATH_PATTERN = "`((?:packages|docs|src|scripts|clients|test|prisma|sql|deploy)/[A-Za-z0-9_@./[\\]-]+)`"
/** 裸文件名口径：带已知产物扩展名、且**不含斜杠**的反引号 token。 */
const BARE_NAME_PATTERN = "`([A-Za-z0-9_@.-]+\\.(?:json|ts|tsx|md|cjs|mjs|sql|yaml|yml))`"

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

const files = GENERATED_ROOTS.flatMap(collectMarkdown)
if (files.length === 0) {
  console.error(`[gen-paths] ✗ 未找到任何生成物（目录: ${GENERATED_ROOTS.join(", ")}）—— 拒绝在零命中时判定通过`)
  process.exit(1)
}

// 仓内所有**被跟踪文件**的 basename —— 裸文件名口径的判定集合。
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

for (const full of files) {
  const rel = path.relative(ROOT, full).split(path.sep).join("/")
  const text = fs.readFileSync(full, "utf8")
  text.split("\n").forEach((line, index) => {
    for (const match of line.matchAll(new RegExp(PATH_PATTERN, "g"))) {
      const target = match[1]
      // 通配/占位写法不是"具体路径声明"，不参与判定
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
    `[gen-paths] PASS: 生成物中的 ${checked} 处路径与 ${checkedBare} 处文件名引用全部真实存在`
    + `（跳过通配写法 ${skipped} 处）`,
  )
} else {
  for (const problem of problems) {
    const what = problem.kind === "bare-name" ? "引用了不存在的文件名" : "引用了不存在的路径"
    console.error(`[gen-paths] ✗ ${problem.file}:${problem.line} — ${what}: ${problem.target}`)
  }
  console.error(
    `\n[gen-paths] FAIL: ${problems.length} 处生成物引用了不存在的路径`
    + "\n  生成物只应引用真实存在的东西 —— 请修**生成器**（scripts/sync-openwiki.cjs），而不是改生成物"
    + "（生成物会在下次 pnpm run openwiki:sync 时被覆盖）。",
  )
}

process.exit(problems.length === 0 ? 0 : 1)
