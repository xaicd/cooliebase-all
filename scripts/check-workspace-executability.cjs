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
 * 口径来源（COO-55-1-3 起：**平台 cleanWorkspaceLeaks 全量清洗面**，不再是只认
 * PRIVATE_SPEC_ENGINE_FILES 那 6 条）:
 *
 *   | 平台行为                                                        | 平台位置 | 本门禁覆盖 |
 *   | ---------------------------------------------------------------- | -------- | ---------- |
 *   | 删 scripts/harness.sh（无条件）                                   | L378-382 | ✓          |
 *   | 删 4 个母港独有规约机文件（无条件）                               | L385-390 | ✓          |
 *   | 删 scripts/lib/spec-resolver.cjs / scripts/speckit.cjs              | L385-390 | ✓ 保守口径 |
 *   | 删 server/src/services/{blueprint-profiles,harness-project-provisioner}.ts | L393-399 | ✓ |
 *   | 递归删 .agents/skills/{fda,core-swe,fdse,ds,pre-sre,cmmi-gatekeeper,local-team-toolchain,coolie-boss-decision-log} | L401-419 | ✓ |
 *   | **改写 package.json：整键删掉 harness / pre-commit / triage / doctor / gate:fast / gate:release / speckit / spc:audit** | L422-445 | ✓ package.json 维度 |
 *   | **任何值里引用了 scripts/harness.sh 的 script 键也会被删**          | L422-445 | ✓ package.json 维度 |
 *
 *   平台位置对应 server/src/services/harness-delivery-engine.ts 的 cleanWorkspaceLeaks；
 *   来源鉴别真源对应 packages/harness/src/delivery/spec-engine-provenance.ts。
 *
 *   **保守口径说明（必须写清，否则下一个维护者会照着过期事实做决策）**:
 *     `scripts/lib/spec-resolver.cjs` 与 `scripts/speckit.cjs` 自平台 COOA-789 起
 *     **改为按来源鉴别** —— 只有带母港独有标记的 fork 版才删，
 *     **底座原生同名资产平台会保留**。本门禁仍把这两条列进「会被清洗」，
 *     属**偏严**：偏严只多红、不产生假绿；底座母本当前不含这两个文件，偏严在本仓无假红。
 *
 * 判据（分三层）:
 *   ① 静态层 · 文件依赖（默认，纯离线、毫秒级）:
 *      扫 scripts/** 下所有公开脚本的**相对 require / import**，
 *      逐条解析到磁盘文件 —— 解析不到 = MODULE_NOT_FOUND 的确定性前兆；
 *      另外，任何公开脚本**依赖被清洗文件**直接判红（这才是真正的根因）。
 *   ② 静态层 · package.json（COO-55-1-3 新增）:
 *      旧门禁**从不读 package.json** ⇒ 平台「把 script 键整个删掉」这条路径底座看不见，
 *      客户侧自证链**静默消失**（不是报错）。现在断言两条:
 *        · 某个 script 的命令值引用了会被清洗掉的文件 ⇒ 判红（平台会把这个键删掉）；
 *        · 必须留存的公开 script 键（harness / speckit）不在 package.json ⇒ 判红
 *          （说明它已经被平台清洗删掉了 —— 派生后自检当场变红，不留给客户去踩）。
 *      判定口径（平台清洗面的机检镜像）: scripts/lib/workspace-executability-scope.cjs。
 *   ③ 运行层（--run）: 真跑三条代表性公开命令，确认它们**能启动**。
 *      判红只认「模块解析失败」；业务断言不成立（如某个规格没写完）记 WARN 不判红
 *      —— 本门禁管的是「可执行性」，不是「业务正确性」。要连业务一起卡，用 --strict。
 *
 * 用法:
 *   node scripts/check-workspace-executability.cjs           # 静态层（门禁用）
 *   node scripts/check-workspace-executability.cjs --run     # 静态层 + 运行层冒烟
 *   node scripts/check-workspace-executability.cjs --strict  # 运行层也要求退出码为 0
 *   node scripts/check-workspace-executability.cjs --json    # 机器可读
 *
 * 环境变量:
 *   DE_LEAK_PRIVATE_FILES   逗号分隔，**整表替换**生效的清洗口径。
 *                           替换后的口径必须**覆盖**平台已知清洗面，否则门禁自判红
 *                           「口径比平台实际清洗面窄」—— 口径收窄 = 门禁变弱 = 假绿。
 *
 * 退出码: 0 = 通过；1 = 有公开脚本不可执行 / 依赖了会被清洗的文件 / package.json 口径被清洗破坏。
 */

const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const asJson = process.argv.includes("--json")
const runLayer = process.argv.includes("--run")
const strict = process.argv.includes("--strict")

/**
 * 平台 de-leak 清洗面（COO-55-1-3 起 = `cleanWorkspaceLeaks` **全量清洗面**）。
 *
 * 口径真源: scripts/lib/workspace-executability-scope.cjs —— 那里逐条标了平台源码位置，
 * 并把「无条件删除」与「按来源鉴别删除」分成两档。
 *
 * 母本**不得**下发这些文件，公开脚本**不得**依赖它们 —— 本表是这两条纪律的机检真源。
 * 若平台增删了清洗面，用环境变量 DE_LEAK_PRIVATE_FILES（逗号分隔）整表替换；
 * 但替换后的口径必须覆盖平台已知清洗面（否则门禁自判红「口径比平台实际清洗面窄」）。
 */
const {
  PLATFORM_CLEAN_SURFACE,
  REQUIRED_PUBLIC_SCRIPT_KEYS,
  resolvePurgeTargets,
  auditPackageJson,
} = require("./lib/workspace-executability-scope.cjs")

/** 生效的清洗口径（默认 = 平台全量清洗面；可被 DE_LEAK_PRIVATE_FILES 整表替换）。 */
function purgeTargets() {
  const { targets } = resolvePurgeTargets(process.env)
  return new Set(targets)
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
 * 口径定义文件本身必然含有那些路径字面量 —— 那是**定义**，不是**依赖** —— 豁免。
 * （scripts/lib/workspace-executability-scope.cjs 就是这份清单的定义处。）
 */
const PURGE_SCOPE_DEFINITION_FILES = new Set(["scripts/lib/workspace-executability-scope.cjs"])

/** 只有**文件**才可能被脚本依赖（目录不会被 require/exec）。 */
const FILE_LIKE_PATH = /\.(cjs|mjs|js|ts|tsx|json|sh)$/

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

/**
 * 只去掉注释（**保留**模板字符串）—— 扫「路径字面量依赖」时用这个。
 *
 * 与 stripNoise 的差别：模板字符串里的路径字面量**要**被看见 ——
 * 比如 `execFileSync("bash", [\`scripts/${name}.sh\`])` 这类写法，
 * 去掉模板字符串就等于放过一条真实依赖。
 */
function stripComments(source) {
  const blank = (match) => match.replace(/[^\n]/g, " ")
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank)
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
  const privateSet = purgeTargets()
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
            `依赖了平台 de-leak 会删除的文件 "${targetRel}" —— `
            + `派生后必然 MODULE_NOT_FOUND；必须改依赖公开等价物（或把该脚本一并移出母本）`,
        })
      }
    }

    // 路径**字面量**依赖（require/import 之外的形态：exec / spawn / readFile …）。
    // 为什么必须补这一层：旧门禁只认 require/import ⇒ `execFileSync("bash", ["scripts/harness.sh"])`
    // 这类**真实依赖**根本看不见（实测反例），派生后照样断链。
    if (PURGE_SCOPE_DEFINITION_FILES.has(file.rel)) continue
    const literalSource = stripComments(source)
    for (const target of privateSet) {
      if (!FILE_LIKE_PATH.test(target)) continue
      const needles = target.startsWith("scripts/")
        ? [target, `./${target.slice("scripts/".length)}`]
        : [target]
      const needle = needles.find((n) => literalSource.includes(n))
      if (!needle) continue
      failures.push({
        kind: "references-purged-file",
        file: file.rel,
        line: lineOf(source, literalSource.indexOf(needle)),
        detail:
          `源码里出现了会被平台清洗掉的路径字面量 "${needle}"（指向 "${target}"）—— `
          + `这不是 require/import，旧的依赖扫描看不见它，但派生清洗后它就是**断链**；`
          + `必须改指向公开等价物（或把该脚本一并移出母本）`,
      })
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
          `工作区里带着平台 de-leak 会删除的文件 "${rel}" —— `
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

  /* ------------------------------------------------ package.json 维度 */
  // 为什么必须单独有一层：平台清洗**会改写 package.json**（把 script 键整个删掉），
  // 而旧门禁只扫 scripts/** 的文件依赖、**从不读 package.json** ⇒ 这条路径底座看不见，
  // 客户侧自证链**静默消失**（不是报错，是键没了）。
  const { coverageGaps } = resolvePurgeTargets(process.env)
  if (coverageGaps.length > 0) {
    failures.push({
      kind: "purge-scope-narrower-than-platform",
      file: "package.json",
      line: 0,
      detail:
        `生效的清洗口径比平台 cleanWorkspaceLeaks 的实际清洗面**窄**，缺 ${coverageGaps.length} 条：`
        + `${coverageGaps.join(" / ")} —— 口径收窄 = 门禁变弱 = 假绿（本单要消灭的正是这种静默）；`
        + `要么列出完整口径（平台全量清洗面 + 新增项），要么改 scripts/lib/workspace-executability-scope.cjs 的常量`,
    })
  }

  const pkgPath = path.join(ROOT, "package.json")
  if (fs.existsSync(pkgPath)) {
    let pkg = null
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    } catch (error) {
      failures.push({
        kind: "package-json-unreadable",
        file: "package.json",
        line: 0,
        detail: `package.json 解析失败：${error.message} —— 公开入口清单读不出来，等于没法判定`,
      })
    }
    if (pkg) {
      for (const failure of auditPackageJson(pkg, {
        targets: [...privateSet],
        requiredKeys: REQUIRED_PUBLIC_SCRIPT_KEYS,
      })) {
        failures.push({
          kind: failure.kind,
          file: `package.json:scripts.${failure.key}`,
          line: 0,
          detail: failure.detail,
        })
      }
    }
  } else {
    failures.push({
      kind: "missing-public-entrypoint",
      file: "package.json",
      line: 0,
      detail: "package.json 不存在 —— 公开脚本入口清单读不出来",
    })
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
  purgeSurface: [...purgeTargets()],
  platformCleanSurface: PLATFORM_CLEAN_SURFACE,
  requiredPublicScriptKeys: REQUIRED_PUBLIC_SCRIPT_KEYS,
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
    + `且无一依赖会被 de-leak 清洗的文件；package.json 的公开 script 键`
    + `（${REQUIRED_PUBLIC_SCRIPT_KEYS.join(" / ")}）完好、也无引用被清洗文件。`,
  )
  if (probes.length > 0) {
    console.log(`[executability] 运行层冒烟: ${probes.length} 条探针全部可启动（无模块解析错误）。`)
  }
  for (const warning of warnings) console.log(`[executability] WARN: ${warning}`)
  process.exit(0)
}

console.error(`[executability] FAIL: ${failures.length} 处「公开脚本不可执行 / 依赖会被清洗的文件 / package.json 公开入口被清洗」：`)
for (const failure of failures) {
  const where = failure.line ? `${failure.file}:${failure.line}` : failure.file
  console.error(`  - [${failure.kind}] ${where}`)
  console.error(`      ${failure.detail}`)
}
console.error("")
console.error(
  "  修法：把公开脚本的依赖改到**公开**等价物（例如 scripts/lib/spec-path-resolver.cjs），"
  + "或在母本里停止下发会被清洗的文件；package.json 的 script 值不得引用会被清洗的文件 —— "
  + "不要靠 AGENT_ROUTE_SKIP 绕过。",
)
process.exit(1)
