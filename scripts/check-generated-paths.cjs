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
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")

/** 生成物范围（目前只有 wiki；新增生成式 markdown 时在此登记）。 */
const GENERATED_ROOTS = ["wiki"]

/** 只检仓内路径（外部项目引用不在生成物里出现，若出现即为缺陷）。 */
const PATH_PATTERN = "`((?:packages|docs|src|scripts|clients|test|prisma|sql|deploy)/[A-Za-z0-9_@./[\\]-]+)`"

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

let checked = 0
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
        problems.push({ file: rel, line: index + 1, target })
      }
    }
  })
}

if (checked === 0) {
  console.error("[gen-paths] ✗ 未检查到任何路径引用 —— 拒绝在零命中时判定通过（检查器可能已失效）")
  process.exit(1)
}

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, checked, skipped, problems }, null, 2))
} else if (problems.length === 0) {
  console.log(
    `[gen-paths] PASS: 生成物中的 ${checked} 处路径引用全部真实存在（跳过通配写法 ${skipped} 处）`,
  )
} else {
  for (const problem of problems) {
    console.error(`[gen-paths] ✗ ${problem.file}:${problem.line} — 引用了不存在的路径: ${problem.target}`)
  }
  console.error(
    `\n[gen-paths] FAIL: ${problems.length} 处生成物引用了不存在的路径`
    + "\n  生成物只应引用真实存在的路径 —— 请修**生成器**（scripts/sync-openwiki.cjs），而不是改生成物"
    + "（生成物会在下次 npm run openwiki:sync 时被覆盖）。",
  )
}

process.exit(problems.length === 0 ? 0 : 1)
