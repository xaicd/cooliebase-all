#!/usr/bin/env node
/**
 * 客户工作区 · 公开脚本可执行性冒烟 (Public Script Executability Smoke)
 * ============================================================================
 * 为什么需要它（真实事故，不是假想）:
 *   平台对**客户工作区**执行 de-leak 清洗时，会删除「母港私有规约机文件族」
 *   （PRIVATE_SPEC_ENGINE_FILES，见平台 server/src/services/harness-delivery-engine.ts）:
 *     scripts/speckit.cjs、scripts/check-contracts.mjs、scripts/lib/spec-resolver.cjs、
 *     scripts/lib/spec-ontology-driver.cjs、scripts/lib/speckit-issue-verifier.cjs、
 *     scripts/lib/ontology-callchain-engine.cjs
 *   而底座母本派发到客户工作区的**公开**脚本曾经硬依赖其中的
 *   `require("./lib/spec-resolver.cjs")`
 *   ⇒ 派生完成后，客户工作区的整条 speckit 校验链
 *     （speckit.ts check / specs:health / verify-task-commit / speckit:check / MCP server）
 *     **必然 MODULE_NOT_FOUND**，pre-commit 全量门禁恒红，客户侧自证链完全不可用。
 *
 *   根因是**母本与清洗策略耦合断裂**：母本发了会被清洗的文件，公开脚本又依赖它。
 *   光修一次不够 —— 下次派生还会复发。所以要有这道**派生后自检**：
 *   红了就说明「清洗策略 × 母本公开脚本」又耦合上了，必须回母本修，而不是绕过。
 *
 * 判据（分两层）:
 *   ① 静态层（默认，纯离线、毫秒级）:
 *      扫 scripts/** 下所有公开脚本的**相对 require / import**，
 *      逐条解析到磁盘文件 —— 解析不到 = MODULE_NOT_FOUND 的确定性前兆；
 *      另外，任何公开脚本**依赖被清洗文件**直接判红（这才是真正的根因）。
 *   ② 运行层（--run）: 真跑三条代表性公开命令，确认它们**能启动**。
 *      判红只认「模块解析失败」；业务断言不成立（如某个规格没写完）记 WARN 不判红
 *      —— 本门禁管的是「可执行性」，不是「业务正确性」。要连业务一起卡，用 --strict。
 *
 * 用法:
 *   node scripts/check-workspace-executability.cjs           # 静态层（门禁用）
 *   node scripts/check-workspace-executability.cjs --run     # 静态层 + 运行层冒烟
 *   node scripts/check-workspace-executability.cjs --strict  # 运行层也要求退出码为 0
 *   node scripts/check-workspace-executability.cjs --json    # 机器可读
 *
 * 退出码: 0 = 通过；1 = 有公开脚本不可执行 / 依赖了会被清洗的文件。
 */

const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const asJson = process.argv.includes("--json")
const runLayer = process.argv.includes("--run")
const strict = process.argv.includes("--strict")

/**
 * 平台 de-leak 清洗的文件族（母港私有规约机）。
 *
 * 口径来源: 平台 server/src/services/harness-delivery-engine.ts 的 PRIVATE_SPEC_ENGINE_FILES。
 * 母本**不得**下发这些文件，公开脚本**不得**依赖它们 —— 本表是这两条纪律的机检真源。
 * 若平台增删了文件族，用环境变量 DE_LEAK_PRIVATE_FILES（逗号分隔）覆盖。
 */
const DEFAULT_PRIVATE_FILES = [
  "scripts/speckit.cjs",
  "scripts/check-contracts.mjs",
  "scripts/lib/spec-resolver.cjs",
  "scripts/lib/spec-ontology-driver.cjs",
  "scripts/lib/speckit-issue-verifier.cjs",
  "scripts/lib/ontology-callchain-engine.cjs",
]

function privateFiles() {
  const override = String(process.env.DE_LEAK_PRIVATE_FILES || "").trim()
  const list = override ? override.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_PRIVATE_FILES
  return new Set(list.map((rel) => rel.replace(/\\/g, "/")))
}

/** 公开脚本的代表性入口（派生后必须能跑起来的那几条）。 */
const PUBLIC_ENTRYPOINTS = [
  "scripts/speckit.ts",
  "scripts/check-specs-health.cjs",
  "scripts/verify-task-commit.cjs",
  "scripts/check-delivery.cjs",
  "scripts/archive-spec.cjs",
  "scripts/delivery-hints.cjs",
  "scripts/mcp/cooliebase-mcp-server.cjs",
  "scripts/agent/run-runbook.cjs",
]

const SCAN_EXTENSIONS = new Set([".cjs", ".mjs", ".js", ".ts"])
const SKIP_DIRS = new Set(["node_modules", ".git", "__tests__", "data", "seed-output"])

/**
 * 去掉注释与模板字符串后再扫依赖。
 *
 * 为什么必须去噪（实测踩到）:
 *   ① 注释里出现的 `require("./lib/spec-resolver.cjs")` 只是说明文字，不是依赖；
 *   ② **代码生成器**把待生成的源码写在模板字符串里（scripts/lib/rpc-contracts.cjs、
 *      scripts/generate-admin-pages.cjs、scripts/inject-seed-to-repositories.cjs …），
 *      里面的 `from "../backend/validators"` 是**产物**的依赖，不是本脚本的依赖 ——
 *      不去掉模板字符串会把它们全判成「公开脚本不可执行」的假红。
 */
function stripNoise(source) {
  const blank = (match) => match.replace(/[^\n]/g, " ")
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank)
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, blank)
}

/** node / tsx 的相对 require 解析：精确命中 → 补扩展名 → 目录 index。 */
function resolveRelative(fromFile, request) {
  const base = path.resolve(path.dirname(fromFile), request)
  const candidates = [
    base,
    `${base}.js`,
    `${base}.cjs`,
    `${base}.mjs`,
    `${base}.json`,
    `${base}.ts`,
    path.join(base, "index.js"),
    path.join(base, "index.cjs"),
    path.join(base, "index.mjs"),
    path.join(base, "index.ts"),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}

/** 抽出源码里的相对 require / import / 动态 import。 */
function extractRelativeRequests(source) {
  const cleaned = stripNoise(source)
  const patterns = [
    /require\(\s*["'](\.[^"']+)["']\s*\)/g,
    /\bfrom\s+["'](\.[^"']+)["']/g,
    /\bimport\(\s*["'](\.[^"']+)["']\s*\)/g,
  ]
  const found = []
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(cleaned)) !== null) {
      found.push({ request: match[1], index: match.index })
    }
  }
  return found
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length
}

function collectScriptFiles(dir) {
  const abs = path.join(ROOT, dir)
  if (!fs.existsSync(abs)) return []
  const out = []
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue
    const full = path.join(abs, entry.name)
    if (entry.isDirectory()) {
      out.push(...collectScriptFiles(path.join(dir, entry.name)))
      continue
    }
    if (!SCAN_EXTENSIONS.has(path.extname(entry.name))) continue
    out.push({ rel: path.relative(ROOT, full).replace(/\\/g, "/"), full })
  }
  return out
}

/* ------------------------------------------------------------------ 静态层 */

function staticLayer() {
  const failures = []
  const warnings = []
  const privateSet = privateFiles()
  const entrypoints = new Set(PUBLIC_ENTRYPOINTS)
  const scanned = collectScriptFiles("scripts")

  for (const file of scanned) {
    const source = fs.readFileSync(file.full, "utf8")
    for (const { request, index } of extractRelativeRequests(source)) {
      const target = resolveRelative(file.full, request)
      if (!target) {
        const problem = {
          kind: "unresolvable-require",
          file: file.rel,
          line: lineOf(source, index),
          detail: `相对依赖 "${request}" 在本工作区解析不到 —— 运行必 MODULE_NOT_FOUND`,
        }
        // 公开入口的依赖解析不到 = 断链（判红）；其它脚本可能是**可选/生成期**依赖
        // （例如 seed 数据文件、运行期才生成的产物），记 WARN 不阻断。
        if (entrypoints.has(file.rel)) failures.push(problem)
        else warnings.push(`${file.rel}:${problem.line} ${problem.detail}`)
        continue
      }
      const targetRel = path.relative(ROOT, target).replace(/\\/g, "/")
      if (privateSet.has(targetRel)) {
        failures.push({
          kind: "depends-on-de-leaked-file",
          file: file.rel,
          line: lineOf(source, index),
          detail:
            `依赖了平台 de-leak 会删除的母港私有文件 "${targetRel}" —— `
            + `派生后必然 MODULE_NOT_FOUND；必须改依赖公开等价物（或把该脚本一并移出母本）`,
        })
      }
    }
  }

  // 母本自身也不该下发会被清洗的文件 —— 否则每次派生都会「删自己的文件」。
  for (const rel of privateSet) {
    if (fs.existsSync(path.join(ROOT, rel))) {
      failures.push({
        kind: "ships-de-leaked-file",
        file: rel,
        line: 0,
        detail:
          `工作区里带着平台 de-leak 会删除的母港私有文件 "${rel}" —— `
          + `派生时会被删掉，公开脚本依赖它就会断链；母本不应下发该文件`,
      })
    }
  }

  // 代表性公开入口必须存在。
  for (const rel of PUBLIC_ENTRYPOINTS) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      failures.push({
        kind: "missing-public-entrypoint",
        file: rel,
        line: 0,
        detail: `公开入口 "${rel}" 不存在 —— 派生后的 speckit 校验链缺一环`,
      })
    }
  }

  return { failures, warnings, scannedCount: scanned.length }
}

/* ------------------------------------------------------------------ 运行层 */

/** 模块解析失败的特征 —— 只有这种失败才算「公开脚本不可执行」。 */
function isModuleResolutionFailure(text) {
  return /MODULE_NOT_FOUND|Cannot find module|Cannot find package|ERR_MODULE_NOT_FOUND/i.test(text)
}

function firstSpecName() {
  try {
    const { listAllSpecs } = require("./lib/spec-path-resolver.cjs")
    const specs = listAllSpecs().filter((spec) => !spec.isArchived)
    return specs.length > 0 ? specs[0].name : null
  } catch {
    // 说明: 解析器本身不可用时不能把「找不到规格」当成失败 —— 静态层已经会报真正的根因。
    return null
  }
}

function runProbe(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
    shell: process.platform === "win32",
  })
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim()
  const moduleFailure = isModuleResolutionFailure(output)
  return {
    label,
    command: `${command} ${args.join(" ")}`.trim(),
    exitCode: result.status,
    moduleFailure,
    output: output.slice(0, 1200),
  }
}

function runLayerProbes() {
  const spec = firstSpecName()
  const probes = [
    runProbe("check-specs-health", process.execPath, ["scripts/check-specs-health.cjs"]),
    runProbe("speckit-list", process.execPath, ["-r", "tsx", "scripts/speckit.ts", "list"]),
  ]
  if (spec) {
    probes.push(
      runProbe("speckit-check", process.execPath, ["-r", "tsx", "scripts/speckit.ts", "check", "--spec", spec]),
      runProbe("verify-task-commit", process.execPath, ["scripts/verify-task-commit.cjs", "--spec", spec, "--summary"]),
    )
  } else {
    probes.push({
      label: "spec-probe",
      command: "-",
      exitCode: null,
      moduleFailure: false,
      output: "本工作区没有规格包，跳过依赖具体规格的两条探针",
    })
  }
  return probes
}

/* -------------------------------------------------------------------- 主流程 */

const staticResult = staticLayer()
const probes = runLayer ? runLayerProbes() : []

const failures = [...staticResult.failures]
for (const probe of probes) {
  if (probe.moduleFailure) {
    failures.push({
      kind: "public-script-not-runnable",
      file: probe.command,
      line: 0,
      detail: `公开命令启动失败（模块解析错误）：${probe.output.slice(0, 300)}`,
    })
  }
}

const warnings = [...staticResult.warnings]
for (const probe of probes) {
  if (!probe.moduleFailure && probe.exitCode !== 0) {
    warnings.push(
      `${probe.label}: 退出码 ${probe.exitCode}（模块可解析，属业务断言未过 —— 本门禁不管业务，只管可执行性）`,
    )
  }
}

const report = {
  kind: "workspace-executability-report",
  root: ROOT,
  scannedScripts: staticResult.scannedCount,
  privateFileGuard: [...privateFiles()],
  failures,
  warnings,
  probes,
  status: failures.length === 0 ? "pass" : "fail",
}

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(failures.length === 0 ? 0 : 1)
}

if (failures.length === 0) {
  console.log(
    `[executability] PASS: ${staticResult.scannedCount} 个公开脚本的相对依赖全部可解析，`
    + `且无一依赖会被 de-leak 清洗的母港私有文件。`,
  )
  if (probes.length > 0) {
    console.log(`[executability] 运行层冒烟: ${probes.length} 条探针全部可启动（无模块解析错误）。`)
  }
  for (const warning of warnings) console.log(`[executability] WARN: ${warning}`)
  process.exit(0)
}

console.error(`[executability] FAIL: ${failures.length} 处「公开脚本不可执行 / 依赖会被清洗的文件」：`)
for (const failure of failures) {
  const where = failure.line ? `${failure.file}:${failure.line}` : failure.file
  console.error(`  - [${failure.kind}] ${where}`)
  console.error(`      ${failure.detail}`)
}
console.error("")
console.error(
  "  修法：把公开脚本的依赖改到**公开**等价物（例如 scripts/lib/spec-path-resolver.cjs），"
  + "或在母本里停止下发会被清洗的文件 —— 不要靠 AGENT_ROUTE_SKIP 绕过。",
)
process.exit(1)
