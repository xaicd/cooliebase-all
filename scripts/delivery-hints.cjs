#!/usr/bin/env node
/**
 * 交付进度的**软提醒**（永不失败）。
 *
 * 为什么是软的: "骨架还没填"是**正常的中间状态**，不该阻断构建 —— 阻断交给门禁，
 * 提醒交给这里。它让 agent 每轮 `pnpm run check` 都能自己看到还差什么，
 * 而不是等人来问。
 */
const fs = require("node:fs")
const path = require("node:path")
const { execFileSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const { listAllSpecs } = require("./lib/spec-resolver.cjs")

const allSpecs = listAllSpecs().filter((s) => !s.isArchived)
if (allSpecs.length === 0) {
  console.log("[delivery] 尚未登记规格或特性（pnpm run spec:new -- --name <名> --domain <域>）")
  process.exit(0)
}

const features = allSpecs.map((s) => s.name)

for (const name of features) {
  let data
  try {
    data = JSON.parse(
      execFileSync("node", ["scripts/check-delivery.cjs", "--feature", name, "--json"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    )
  } catch (error) {
    // 不吞原因: 静默跳过会让"检查器坏了"看起来像"没问题"
    // execFileSync 的 message 只有 "Command failed"，真因在 stderr —— 取出来
    const stderr = error && error.stderr
    const raw = stderr ? String(stderr) : error instanceof Error ? error.message : String(error)
    const reason = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("[delivery]"))
      .map((line) => line.replace(/^\[delivery\]\s*/, ""))
      .join(" ") || raw.split("\n")[0]
    console.log(`[delivery] ${name}: 检查失败 —— ${reason}`)
    continue
  }
  const unfinished = data.phases.filter((phase) => phase.missing.length > 0 || phase.skeleton)
  if (unfinished.length === 0) {
    const bugs = data.bugs && data.bugs.present ? data.bugs : null
    console.log(`[delivery] ${name}: 9 个阶段产物已齐${bugs && bugs.open > 0 ? `；但未修缺陷 ${bugs.open} 条` : ""}`)
    continue
  }
  const reasons = unfinished.map((phase) => `${phase.name}${phase.skeleton ? "(骨架未填)" : "(缺产物)"}`)
  const bugs = data.bugs && data.bugs.present ? data.bugs : null
  const bugNote = bugs ? (bugs.open > 0 ? `；未修缺陷 ${bugs.open} 条` : "") : "；没有 bugs.md"
  const ev = data.evidence
  const gateNote = ev && ev.present ? `；gate ${ev.totals.passed ?? 0} 通过${ev.problems.length ? `（${ev.problems.length} 处证据问题）` : ""}` : "；无证据台账"
  console.log(`[delivery] ${name}: 待完成 ${unfinished.length} 个阶段 —— ${reasons.join("、")}${bugNote}${gateNote}`)
}
