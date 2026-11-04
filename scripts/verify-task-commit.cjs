#!/usr/bin/env node
/**
 * 核对「1 Task = 1 Commit」与「文件白名单」（对齐 CMMI）。
 *
 * 为什么要这个: `tasks.md` 的"状态"列是**自报**，谁都能改成"已完成"。
 * 这里的判据来自 **git 本身** —— commit message 里带 `T<ID>`，且改动文件必须落在
 * 该任务声明的白名单内。**证据不来自声明，来自历史。**
 *
 * 用法:
 *   node scripts/verify-task-commit.cjs --feature ecommerce --task T2 [--commit HEAD]
 *   node scripts/verify-task-commit.cjs --feature ecommerce --summary
 */
const { execFileSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const arg = (flag) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}
const feature = arg("--feature") ?? arg("--spec") ?? arg("--name")
const only = arg("--task")
const commit = arg("--commit") ?? "HEAD"
if (!feature) {
  console.error("用法: node scripts/verify-task-commit.cjs --spec <名> [--task T1] [--commit HEAD]")
  process.exit(2)
}

const { resolveSpecDir } = require("./lib/spec-path-resolver.cjs")
const specDir = resolveSpecDir(feature)
if (!specDir) {
  console.error(`[task] 找不到特性/规格: ${feature}（在 docs/specs 与 docs/features 中均未找到）`)
  process.exit(2)
}

const tasksFile = path.join(specDir, "tasks.md")
if (!fs.existsSync(tasksFile)) {
  console.error(`[task] 找不到 ${path.relative(ROOT, tasksFile)}`)
  process.exit(2)
}

const cellsOf = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim())
const tasks = fs
  .readFileSync(tasksFile, "utf8")
  .split("\n")
  .filter((line) => line.trim().startsWith("|"))
  .filter((line) => !cellsOf(line).includes("ID"))
  .filter((line) => !cellsOf(line).every((cell) => /^:?-+:?$/.test(cell)))
  .map(cellsOf)
  .filter((cells) => cells.length >= 4 && /^T\d/.test(cells[0]))
  .map((cells) => ({ id: cells[0], parent: cells[1], title: cells[2], whitelist: cells[3] }))

/** glob → RegExp（只支持 ** 与 *，够用且不引依赖）。 */
function toRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\//g, "\u0000").replace(/\*\*/g, "\u0001").replace(/\*/g, "[^/]*")
  return new RegExp("^" + escaped.replace(/\u0000/g, "(?:.*/)?").replace(/\u0001/g, ".*") + "$")
}

/**
 * 跑一条 git 命令。**不是 git 仓库时必须给清晰信息** ——
 * 整套治理（任务痕迹、指纹里的 commit）都建立在 git 上，没有仓库就无从取证。
 * 早先这里直接抛出 execFileSync 的栈（实测在刚孵化的工程里踩到）。
 */
const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim()
  } catch (error) {
    if (!fs.existsSync(path.join(ROOT, ".git"))) {
      console.error("[task] 这不是 git 仓库 —— 任务痕迹与指纹都建立在 git 上，请先 `git init` 并提交")
      process.exit(2)
    }
    throw error
  }
}

if (process.argv.includes("--summary")) {
  const log = git(["log", "--pretty=%H%x09%s", "-n", "300"])
  let touched = 0
  for (const task of tasks) {
    const hits = log.split("\n").filter((line) => (line.split("\t")[1] ?? "").includes(`[${task.id}]`))
    if (hits.length > 0) touched += 1
    console.log(`  ${task.id}  ${hits.length === 0 ? "无提交（未开始）" : `${hits.length} 个提交`}  ${task.title}`)
  }
  console.log(`\n[task] ${tasks.length} 条任务，${touched} 条有提交痕迹（从 git 推导，不看"状态"列）`)
  process.exit(0)
}

const task = tasks.find((item) => item.id === only)
if (!task) {
  console.error(`[task] 找不到任务 ${only}（可选: ${tasks.map((item) => item.id).join(", ")}）`)
  process.exit(2)
}

const message = git(["log", "-1", "--pretty=%s%n%b", commit])
const files = git(["show", "--name-only", "--pretty=format:", commit]).split("\n").filter(Boolean)
const problems = []

// 必须用**结构化标记** `[T1]` —— 裸 `T10` 会匹配到"顺口提到 T10"的提交，
// 那等于把证据变成噪音（实测踩到: 一条讲 T10 的文档提交被当成了任务痕迹）。
if (!message.includes(`[${task.id}]`)) {
  problems.push(`commit message 里没有 [${task.id}] —— 「1 Task = 1 Commit」要求提交能追溯到任务（用方括号标记，裸 ${task.id} 会误匹配）`)
}
if (task.whitelist !== "-") {
  const patterns = task.whitelist.split(",").map((item) => item.trim()).filter(Boolean).map(toRegExp)
  const outside = files.filter((file) => !patterns.some((regex) => regex.test(file)))
  if (outside.length > 0) problems.push(`改了白名单之外的文件: ${outside.slice(0, 5).join(", ")}${outside.length > 5 ? ` 等 ${outside.length} 个` : ""}`)
}

console.log(`[task] ${task.id} ${task.title}  (commit ${commit}, ${files.length} 个文件)`)
for (const file of files.slice(0, 8)) console.log(`   ${file}`)
if (files.length > 8) console.log(`   … 还有 ${files.length - 8} 个`)
if (problems.length === 0) {
  console.log("\n[task] PASS: 提交可追溯到该任务，且改动都在白名单内")
  process.exit(0)
}
for (const problem of problems) console.log(`   ✗ ${problem}`)
process.exit(1)
