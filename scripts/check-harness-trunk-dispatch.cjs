#!/usr/bin/env node
/**
 * `harness-trunk-dispatch` —— `pnpm harness` 的主干「**表**」与「**分派**」必须一致。
 *
 * ## 为什么需要这条
 *
 * 用户定过规矩：**`pnpm harness` 是唯一主干**。但只有「表里印了什么」和「实际能跑什么」
 * 对得上，这条规矩才不是散文。两类裂缝都是**静的、后果隐蔽的**：
 *
 *   · **表里有、分派里没有** → **假广告**：用户照表敲一条，得到 unknown command；
 *   · **分派里有、表里没有** → **隐藏能力**：能力存在但没人知道，等于没做。
 *
 * 我实测栽过：给新能力配平行 npm script（`agent:runtime:*`）而主干没同步 ——
 * 那正是"入口多了一条"的裂缝，而当时**没有任何门禁看得见**。
 *
 * ## 为什么不用「同一脚本多个名字」当规则（试过了，误报 37 组）
 *
 * `speckit.ts` 被 20 个名字调（`speckit:new` / `spec:new` / `feature:new` …）是**有意的别名**，
 * `typecheck` 与 `typecheck:check` 跑的是**不同脚本**（全量 vs 棘轮）。
 * 拿它当规则只会逼出 37 条无意义豁免。**规则必须贴合条款本意。**
 *
 * ## 判据（全部静态，不跑命令）
 *
 * 1. 主干表解析出 0 条 → **失败**（不许"解析不到就算通过"）；
 * 2. 表里的主干在 `switch` 里没有 `case` → **失败**；
 * 3. `switch` 里的 `case` 不在表里、也不在 `ASSIST` 白名单里 → **失败**。
 *
 * exit 1 = 有裂缝；exit 0 = 表与分派一致。
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const HARNESS = path.join(ROOT, "scripts/harness.cjs")

/** 辅助命令：**故意不出现在主干表**（它们不是流程主干，不需要在人眼前占位） */
const ASSIST = new Set(["help", "--help", "-h", "doctor"])

function readHarness() {
  if (!fs.existsSync(HARNESS)) return null
  return fs.readFileSync(HARNESS, "utf8")
}

/** 主干表：`["route", "pnpm harness route ...", "说明"]`（表在 TRUNKS 数组里，用行首缩进的 [ " 识别） */
function parseTrunks(src) {
  const out = []
  // usage 里可能有转义引号（如 `-- \"<需求>\"`），所以用 (?:[^"\\]|\\.)* 而不是 [^"]*
  const re = /^\s*\["([a-z][a-z0-9-]*)",\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\]/gm
  let m
  while ((m = re.exec(src))) out.push({ name: m[1], usage: m[2], desc: m[3] })
  return out
}

/** switch 分派：`case "route":` */
function parseCases(src) {
  const out = []
  const re = /^\s*case\s+"([a-zA-Z0-9_-]+)"\s*:/gm
  let m
  while ((m = re.exec(src))) out.push(m[1])
  return [...new Set(out)]
}

function check() {
  const src = readHarness()
  if (src === null) {
    console.error(`✗ 找不到 ${path.relative(ROOT, HARNESS)} —— 主干真源不存在，不能算通过`)
    return 1
  }
  const trunks = parseTrunks(src)
  const cases = parseCases(src)

  if (trunks.length === 0) {
    console.error("✗ 主干表解析出 0 条 —— 要么表被删了，要么格式变了；不允许静默通过")
    return 1
  }

  const problems = []

  // ① 假广告：表里有、分派里没有
  for (const t of trunks) {
    if (!cases.includes(t.name)) {
      problems.push(`  ✗ 假广告: 主干表印了 "${t.name}"（${t.usage}），但 switch 里没有对应 case`)
    }
  }

  // ② 隐藏能力：分派里有、表里没有（且不是辅助命令）
  const trunkNames = trunks.map((t) => t.name)
  for (const c of cases) {
    if (!trunkNames.includes(c) && !ASSIST.has(c)) {
      problems.push(`  ✗ 隐藏能力: switch 能跑 "${c}"，但主干表里没有 —— 没人知道它存在`)
    }
  }

  if (problems.length) {
    console.error("harness-trunk-dispatch 失败：")
    for (const p of problems) console.error(p)
    console.error("\n修法：主干表（TRUNKS）与 switch 分派必须**同时**改。只改一边就是裂缝。")
    return 1
  }

  console.log(`harness-trunk-dispatch 通过：主干 ${trunks.length} 条 —— ${trunkNames.join(" / ")}`)
  console.log(`  分派 case ${cases.length} 个（含辅助 ${cases.filter((c) => ASSIST.has(c)).join(" / ") || "无"}），表与分派一致`)
  return 0
}

if (require.main === module) process.exit(check())
module.exports = { parseTrunks, parseCases, check, ASSIST }
