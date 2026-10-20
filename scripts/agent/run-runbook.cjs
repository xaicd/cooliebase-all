#!/usr/bin/env node
/**
 * 实施轨的可执行 runbook（割接 + 计时回滚）。
 *
 * 为什么要有: `deployment.md` 是**文档** —— 割接与回滚写在那里，但没人真的按它跑，
 * 也没人知道跑一遍要多久、哪一步失败该回滚到哪。实施轨占真实项目 40% 的风险，
 * 却常常是**唯一没有可执行形态**的一环。
 *
 * 这里把 runbook 变成**声明 + 可执行**:
 *   --check     校验 runbook 是否可执行（步骤有命令、不可逆步骤必须有回滚、有窗口）
 *   --dry-run   只打印计划与耗时预算
 *   --run       按序执行，**逐步计时**；失败即停并**执行回滚**，最后报告是否在窗口内
 *
 * 用法:
 *   node scripts/agent/run-runbook.cjs --feature points --check
 *   node scripts/agent/run-runbook.cjs --feature points --dry-run
 *   node scripts/agent/run-runbook.cjs --feature points --run [--no-rollback]
 */
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "../..")
const arg = (flag) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}
const feature = arg("--feature") ?? arg("--spec") ?? arg("--name")
if (!feature) {
  console.error("用法: node scripts/agent/run-runbook.cjs --spec <名> --check | --dry-run | --run")
  process.exit(2)
}

const { resolveSpecDir } = require("../lib/spec-resolver.cjs")
const specDir = resolveSpecDir(feature)
if (!specDir) {
  console.error(`[runbook] 找不到特性/规格: ${feature}`)
  process.exit(2)
}

const file = path.join(specDir, "runbook.json")
if (!fs.existsSync(file)) {
  console.error(`[runbook] 找不到 ${path.relative(ROOT, file)}（pnpm run spec:new 会给骨架）`)
  process.exit(2)
}
let runbook
try {
  runbook = JSON.parse(fs.readFileSync(file, "utf8"))
} catch (error) {
  console.error(`[runbook] runbook.json 不是合法 JSON —— ${error.message}`)
  process.exit(2)
}

const steps = runbook.steps ?? []
const rollback = runbook.rollback ?? []

if (process.argv.includes("--check")) {
  const problems = []
  if (steps.length === 0) problems.push("没有步骤 —— 空 runbook 等于没写")
  for (const step of steps) {
    for (const field of ["id", "name", "command"]) {
      if (!step[field]) problems.push(`${step.id ?? "?"} 缺 ${field}`)
    }
  }
  for (const step of rollback) {
    if (!step.id || !step.command) problems.push(`回滚步骤缺 id 或 command`)
  }
  // 占位符漏进命令 = 这条步骤跑起来必然失败（骨架不该被当成可执行方案）
  for (const step of [...steps, ...rollback]) {
    if (String(step.command ?? "").includes("待填") || String(step.name ?? "").includes("待填")) {
      problems.push(`${step.id ?? "?"} 的命令还是占位符（待填）—— 骨架不是可执行的割接方案`)
    }
  }
  // 不可逆的步骤（改数据/改状态）**必须**有回滚路径 —— 否则失败就卡死
  const irreversible = steps.filter((step) => step.irreversible)
  if (irreversible.length > 0 && rollback.length === 0) {
    problems.push(`有 ${irreversible.length} 个不可逆步骤（${irreversible.map((s) => s.id).join(", ")}）却没有 rollback —— 失败就卡死`)
  }
  if (!runbook.window?.minutes) problems.push("没有声明割接窗口 window.minutes —— 无法判断是否超时")
  if (problems.length > 0) {
    for (const problem of problems) console.log(`   ✗ ${problem}`)
    process.exit(1)
  }
  console.log(`[runbook] PASS: ${steps.length} 个步骤 / ${rollback.length} 个回滚步骤 / 窗口 ${runbook.window.minutes} 分钟`)
  process.exit(0)
}

if (process.argv.includes("--dry-run")) {
  console.log(`[runbook] ${feature} 割接计划（窗口 ${runbook.window?.minutes ?? "?"} 分钟）`)
  steps.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step.id} ${step.name}${step.irreversible ? "  [不可逆]" : ""}`)
    console.log(`      $ ${step.command}`)
  })
  if (rollback.length > 0) {
    console.log(`   ↺ 回滚路径:`)
    for (const step of rollback) console.log(`      ${step.id} ${step.name}  $ ${step.command}`)
  }
  process.exit(0)
}

if (!process.argv.includes("--run")) {
  console.error("需要 --check / --dry-run / --run 之一")
  process.exit(2)
}

const runOne = (step) => {
  const started = Date.now()
  const result = spawnSync(step.command, {
    cwd: ROOT, shell: true, encoding: "utf8",
    timeout: step.timeoutMs ?? 300000,
    env: { ...process.env, ...(step.env ?? {}) },
  })
  return { ok: result.status === 0, elapsedMs: Date.now() - started, output: `${result.stdout ?? ""}${result.stderr ?? ""}` }
}

const RESULT_PATH = path.join(specDir, "runbook-result.json")
const record = { feature, ranAt: new Date().toISOString(), windowMinutes: runbook.window?.minutes ?? null, steps: [], rolledBack: false, ok: false, totalMs: 0 }

/** 把运行**事实**写进 runbook-result.json，并把指针追加进 evidence.json 的 G5 证据。
 *  注意: 这里**只记录**，不替 agent 把 G5 判成 passed —— 判定权在 evidence.json，
 *  而检查器会要求「G5 说 passed ⇒ 必须存在一份全过的运行记录」。 */
function persist(resultOk) {
  record.ok = resultOk
  fs.writeFileSync(RESULT_PATH, JSON.stringify(record, null, 2) + "\n")
  const evidencePath = path.join(specDir, "evidence.json")
  if (!fs.existsSync(evidencePath)) return
  try {
    const ledger = JSON.parse(fs.readFileSync(evidencePath, "utf8"))
    const gate = ledger.gates?.G5_PRE
    if (!gate) return
    const pointer = `runbook-result.json: ${record.steps.length} 步，${resultOk ? "全过" : record.rolledBack ? "失败并已回滚" : "失败"}，用时 ${(record.totalMs / 1000).toFixed(1)}s`
    gate.evidence = [...(gate.evidence ?? []).filter((item) => !String(item).startsWith("runbook-result.json:")), pointer]
    fs.writeFileSync(evidencePath, JSON.stringify(ledger, null, 2) + "\n")
    console.log(`[runbook] 运行结果已落盘，并把指针写入 evidence.json 的 G5 证据`)
  } catch (error) {
    console.log(`[runbook] 运行结果已落盘（evidence.json 回写失败: ${error.message}）`)
  }
}

console.log(`[runbook] 开始割接 ${feature}（窗口 ${runbook.window?.minutes ?? "?"} 分钟）`)
const totalStart = Date.now()
let failed = null
for (const step of steps) {
  process.stdout.write(`   ▶ ${step.id} ${step.name} ... `)
  const result = runOne(step)
  record.steps.push({ id: step.id, name: step.name, ok: result.ok, elapsedMs: result.elapsedMs })
  if (result.ok) {
    console.log(`OK (${(result.elapsedMs / 1000).toFixed(1)}s)`)
    continue
  }
  console.log(`FAIL (${(result.elapsedMs / 1000).toFixed(1)}s)`)
  console.log(result.output.split("\n").slice(-5).map((line) => `      ${line}`).join("\n"))
  failed = step
  break
}

if (failed) {
  if (process.argv.includes("--no-rollback") || rollback.length === 0) {
    record.totalMs = Date.now() - totalStart
    persist(false)
    console.log(`[runbook] 失败于 ${failed.id}，未执行回滚（--no-rollback 或无回滚路径）`)
    process.exit(1)
  }
  console.log(`[runbook] 失败于 ${failed.id} → 执行回滚`)
  const rollbackStart = Date.now()
  for (const step of rollback) {
    process.stdout.write(`   ↺ ${step.id} ${step.name} ... `)
    const result = runOne(step)
    console.log(result.ok ? `OK (${(result.elapsedMs / 1000).toFixed(1)}s)` : `FAIL (${(result.elapsedMs / 1000).toFixed(1)}s)`)
    if (!result.ok) {
      record.totalMs = Date.now() - totalStart
      record.rolledBack = true
      persist(false)
      console.log(`[runbook] 回滚步骤失败 —— 需人工介入`)
      process.exit(2)
    }
  }
  record.totalMs = Date.now() - totalStart
  record.rolledBack = true
  record.rollbackMs = Date.now() - rollbackStart
  persist(false)
  console.log(`[runbook] 回滚完成，用时 ${(record.rollbackMs / 1000).toFixed(1)}s（这是实测的回滚耗时，不是声明值）`)
  process.exit(1)
}

const elapsed = (Date.now() - totalStart) / 1000
record.totalMs = Date.now() - totalStart
persist(elapsed <= (runbook.window?.minutes ?? 0) * 60)
const budget = (runbook.window?.minutes ?? 0) * 60
console.log(`[runbook] 割接完成，用时 ${elapsed.toFixed(1)}s / 窗口 ${budget}s ${elapsed <= budget ? "（在窗口内）" : "（**超出窗口**）"}`)
process.exit(elapsed <= budget ? 0 : 1)
