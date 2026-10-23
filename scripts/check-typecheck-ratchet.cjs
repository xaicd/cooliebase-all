#!/usr/bin/env node
/**
 * 类型检查棘轮（T1：基线快照 + 按目录聚合）
 *
 * 背景：`pnpm exec tsc --noEmit` 在本仓有 **1268 个**存量类型错误，
 * 而 `check` 链里**从来没有类型检查** —— 也就是说「类型安全」这条从未被真正执行过。
 *
 * 本 spec（`docs/specs/infra/typecheck-gate/`）的判断是：**不追求一次清零**，
 * 只建「不再变坏」的机制 —— 棘轮：
 *
 *   当前错误集合 − 基线集合 = 新增 → 非空即失败
 *
 * 基线键用 **`file:line:code`**，不用错误消息全文 ——
 * 否则改一行代码让消息变化就会被误判为「新增」。
 * 同时**接受「行号漂移 = 新增」的保守语义**（宁可多报，不可漏报）。
 *
 * 用法（T1 阶段只做基线）：
 *   node scripts/check-typecheck-ratchet.cjs --write-baseline   # 生成/收紧基线
 *   node scripts/check-typecheck-ratchet.cjs --audit            # 打印分布（不比对）
 */
const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const BASELINE_REL = "docs/architecture/artifacts/typecheck-baseline.json"

/** 跑 tsc 并解析出错误集合 */
function collectTypeErrors() {
  const started = Date.now()
  // **不要传 `--incremental false`**：实测它与 `--noEmit` 组合会**丢掉 2 条错误**（1268 → 1266），
  // 而 tsc 本身是确定的（连跑 4 次都是 1268）。基线必须建立在**同一条命令**上。
  const result = spawnSync("node", ["node_modules/typescript/bin/tsc", "--noEmit"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
  const output = `${result.stdout || ""}${result.stderr || ""}`
  const durationMs = Date.now() - started

  // `packages/x/y.ts(12,34): error TS2339: ...`
  const errors = []
  for (const line of output.split("\n")) {
    const m = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/.exec(line.trim())
    if (!m) continue
    errors.push({ file: m[1], line: Number(m[2]), column: Number(m[3]), code: m[4], message: m[5], key: `${m[1]}:${m[2]}:${m[4]}` })
  }

  return { errors, output, exitCode: result.status ?? -1, durationMs }
}

/** 按目录（前两段）聚合，便于排期 */
function aggregateByDir(errors) {
  const byDir = {}
  for (const e of errors) {
    const parts = e.file.split("/")
    const dir = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0]
    byDir[dir] = (byDir[dir] || 0) + 1
  }
  return Object.fromEntries(Object.entries(byDir).sort((a, b) => b[1] - a[1]))
}

function main() {
  const writeBaseline = process.argv.includes("--write-baseline")
  const audit = process.argv.includes("--audit")

  const { errors, exitCode, durationMs, output } = collectTypeErrors()

  // **解析失败必须失败**：tsc 非零退出、却一条 `error TS` 都解析不出来 →
  // 说明输出格式变了或 tsc 根本没跑起来。绝不能当成「0 错误」静默通过。
  if (errors.length === 0 && exitCode !== 0) {
    console.error(`[typecheck] ✗ tsc exit=${exitCode} 但解析出 0 条 error TS —— 拒绝当作「0 错误」`)
    console.error(output.split("\n").slice(0, 5).join("\n"))
    process.exit(2)
  }

  const byDir = aggregateByDir(errors)
  const snapshot = {
    note: "类型检查棘轮基线。键 = file:line:code（不用错误消息全文，避免「改一行就误判为新增」）。只拦新增。",
    generatedBy: "scripts/check-typecheck-ratchet.cjs --write-baseline",
    command: "node node_modules/typescript/bin/tsc --noEmit",
    count: errors.length,           // 诊断条数（含同一位置的重复诊断）
    uniqueKeys: new Set(errors.map((e) => e.key)).size,   // 唯一键数（棘轮实际比对的口径）
    durationMs,
    byDir,
    keys: errors.map((e) => e.key).sort(),
  }

  if (writeBaseline) {
    fs.mkdirSync(path.dirname(path.join(ROOT, BASELINE_REL)), { recursive: true })
    fs.writeFileSync(path.join(ROOT, BASELINE_REL), `${JSON.stringify(snapshot, null, 2)}\n`)
    console.log(
      `[typecheck] ✓ 基线已写入 ${BASELINE_REL}（诊断 ${errors.length} 条 / 唯一键 ${new Set(errors.map((e) => e.key)).size} 个，${durationMs}ms）`,
    )
    const top = Object.entries(byDir).slice(0, 8)
    console.log(`[typecheck] 债务分布（Top 8）：`)
    for (const [dir, n] of top) console.log(`  ${String(n).padStart(5)}  ${dir}`)
    return
  }

  if (audit) {
    console.log(`[typecheck] 当前 ${errors.length} 条类型错误（${durationMs}ms）`)
    for (const [dir, n] of Object.entries(byDir).slice(0, 12)) console.log(`  ${String(n).padStart(5)}  ${dir}`)
    return
  }

  // ── T2：棘轮比对 ────────────────────────────────────────────────
  // 语义：`当前 − 基线 = 新增`。新增非空 → **失败**（这是本 spec 的核心判据）。
  // 反向（`基线 − 当前`）= 已修复，只报告、不失败（修复不需要审批）。
  const baselineAbs = path.join(ROOT, BASELINE_REL)
  if (!fs.existsSync(baselineAbs)) {
    console.error(`[typecheck] ✗ 基线缺失: ${BASELINE_REL} —— 不允许「找不到基线 ⇒ 静默通过」`)
    console.error(`  修法: node scripts/check-typecheck-ratchet.cjs --write-baseline`)
    process.exit(2)
  }
  const baseline = JSON.parse(fs.readFileSync(baselineAbs, "utf8"))
  const baseKeys = new Set(baseline.keys || [])
  const curKeys = new Set(errors.map((e) => e.key))

  const added = [...curKeys].filter((k) => !baseKeys.has(k)).sort()
  const fixed = [...baseKeys].filter((k) => !curKeys.has(k)).sort()

  if (audit) {
    console.log(`[typecheck] 基线 ${baseKeys.size} · 当前 ${curKeys.size} · 新增 ${added.length} · 已修复 ${fixed.length}`)
  }

  if (added.length > 0) {
    console.error("")
    console.error(`[typecheck] ✗ 新增 ${added.length} 个类型错误（基线 ${baseKeys.size} 条）：`)
    const byKey = new Map(errors.map((e) => [e.key, e]))
    for (const k of added.slice(0, 20)) {
      const e = byKey.get(k)
      console.error(`  · ${e.file}(${e.line},${e.column}): ${e.code} ${e.message.slice(0, 100)}`)
    }
    if (added.length > 20) console.error(`  … 另有 ${added.length - 20} 个`)
    console.error("")
    console.error("[typecheck] 修法：修掉这些错误；确认属于既有债务时用 --write-baseline 收紧基线（会在 diff 里可见）")
    process.exit(1)
  }

  // 口径说明：这里比对的是**唯一键**（file:line:code）。tsc 会在同一位置报多条诊断时
  // 产生相同的键 —— 那对棘轮而言是同一个错误，去重是正确语义。
  console.log(
    `[typecheck] ✓ 无新增类型错误（当前唯一键 ${curKeys.size} / 基线唯一键 ${baseKeys.size}` +
      (fixed.length ? ` · 已修复 ${fixed.length} 条，可跑 --write-baseline 收紧` : "") +
      `）`,
  )

}

main()
