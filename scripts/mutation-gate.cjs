/**
 * 变异测试门禁（最小实现，零依赖）。
 *
 * 为什么不用 Stryker：那是完整变异引擎，会引入一批依赖并显著拖慢 CI；
 * 本仓要解决的只是"测试到底有没有杀死力"这一个问题。做法与既有「反向对照」一致：
 * 对关键模块施加**语义突变**，跑对应测试，**必须失败**（mutant killed）。
 * 若突变后测试仍绿 —— 说明这条路径的断言是空的，门禁失败。
 *
 * 安全约束（都会 fail-loud）：
 *   1. 突变文件必须是**干净的**（`git status --porcelain -- <file>` 为空），否则拒绝运行，
 *      避免覆盖别人的在途修改；
 *   2. 每个突变在 finally 中还原，并校验还原后的内容与原文逐字一致；
 *   3. 还原失败即中止（绝不留下被改过的源码）。
 *
 * Usage:
 *   node scripts/mutation-gate.cjs            # 跑全部突变
 *   node scripts/mutation-gate.cjs --json     # 机器可读
 *   node scripts/mutation-gate.cjs --only <id>
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const TEST_TIMEOUT_MS = 180000
const asJson = process.argv.includes("--json")
const onlyArg = (() => {
  const index = process.argv.indexOf("--only")
  return index >= 0 ? process.argv[index + 1] : null
})()

/**
 * 突变目录。每条都必须能被现有测试**杀死**：
 * 若某条存活，说明这块代码缺少有杀伤力的断言 —— 先补测试，而不是删掉这条突变。
 */
const MUTANTS = [
  {
    id: "hatch-drop-companion",
    file: "scripts/lib/hatch-profile.cjs",
    description: "从平台伴生域清单里丢掉 aigw（伴生域是地基的静态依赖，裁掉会让产物构建失败）",
    find: 'const PLATFORM_COMPANIONS = Object.freeze(["online", "ai", "aigw"])',
    replace: 'const PLATFORM_COMPANIONS = Object.freeze(["online", "ai"])',
    tests: ["scripts/lib/__tests__/hatch-profile.test.ts"],
  },
  {
    id: "hatch-domain-prefix-never-matches",
    file: "scripts/lib/hatch-profile.cjs",
    description: "让域路径前缀匹配永远返回 false（被裁域的文件将不再被裁剪）",
    find: "    if (rel === `${prefix}${needle}` || rel.startsWith(`${prefix}${needle}/`)) return true",
    replace: "    if (rel === `${prefix}${needle}` || rel.startsWith(`${prefix}${needle}/`)) return false",
    tests: ["scripts/lib/__tests__/hatch-profile.test.ts"],
  },
  {
    id: "hatch-base-keeps-clients",
    file: "scripts/lib/hatch-profile.cjs",
    description: "让 base profile 仍然包含 clients（裁剪不彻底）",
    find: "    selected = unique([...platform, ...companions])\n    includeClients = false\n  } else if (profile === \"minimal\") {",
    replace: "    selected = unique([...platform, ...companions])\n    includeClients = true\n  } else if (profile === \"minimal\") {",
    tests: ["scripts/lib/__tests__/hatch-profile.test.ts"],
  },
  // 说明：曾有第 4 条突变针对 `scripts/lib/spec-resolver.cjs`（把 domain 段丢掉）。
  // 它会**改变测试写盘的位置**，从而在仓库里留下 `docs/specs/__agent_test_spec__/` 残渣 ——
  // 有副作用的突变不适合放进本门禁（会污染工作区，且残渣会干扰后续判定）。
  // 该模块的“按域隔离”已由 `spec-driven-agent-workflow.test.ts` 直接断言覆盖。
]

/**
 * **存活探针**（仅在 `--self-check` 下使用）：只改注释，任何测试都不可能发现它，
 * 因此它**必然存活**。若门禁没报出"存活"，说明门禁的检出机制坏了 ——
 * 一个检不出存活的门禁等于一个永远绿的门禁，那才是真正的假门禁。
 */
const SURVIVAL_PROBE = {
  id: "__survival_probe__",
  file: "scripts/lib/hatch-profile.cjs",
  description: "仅改注释（必然存活）—— 用于自证门禁能检出存活突变",
  find: "const PLATFORM_COMPANIONS = Object.freeze(",
  replace: "/* noop */ const PLATFORM_COMPANIONS = Object.freeze(",
  tests: ["scripts/lib/__tests__/hatch-profile.test.ts"],
}

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

/** 文件必须干净：否则可能覆盖别人的在途修改。 */
function assertClean(rel) {
  const result = spawnSync("git", ["status", "--porcelain", "--", rel], {
    cwd: ROOT,
    encoding: "utf8",
  })
  const status = (result.stdout || "").trim()
  if (result.error || result.status !== 0) {
    throw new Error(`[mutation] 无法确认 ${rel} 的 git 状态，拒绝运行（避免覆盖在途修改）`)
  }
  if (status) {
    throw new Error(`[mutation] ${rel} 有未提交改动，拒绝运行（避免覆盖在途修改）:\n  ${status}`)
  }
}

function runTests(tests) {
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
  const result = spawnSync(pnpm, ["exec", "vitest", "run", ...tests], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: TEST_TIMEOUT_MS,
    env: (({ DATABASE_URL, DB_DRIVER, NODE_ENV, TENANT_MODE, ...rest }) => rest)(process.env),
  })
  return {
    status: result.status,
    timedOut: result.error?.code === "ETIMEDOUT",
    tail: `${result.stdout || ""}${result.stderr || ""}`.trim().slice(-1500),
  }
}

function runMutant(mutant) {
  const full = abs(mutant.file)
  if (!fs.existsSync(full)) {
    return { ...mutant, outcome: "error", detail: `文件不存在: ${mutant.file}` }
  }
  assertClean(mutant.file)

  const original = fs.readFileSync(full, "utf8")
  const occurrences = original.split(mutant.find).length - 1
  if (occurrences !== 1) {
    return { ...mutant, outcome: "error", detail: `突变锚点在 ${mutant.file} 命中 ${occurrences} 次（必须恰好 1 次）` }
  }

  try {
    fs.writeFileSync(full, original.replace(mutant.find, mutant.replace))
    const result = runTests(mutant.tests)
    if (result.timedOut) return { ...mutant, outcome: "error", detail: "测试超时" }
    // 测试失败 = 突变被杀死 = 测试有杀伤力，这是**期望**结果。
    if (result.status !== 0) return { ...mutant, outcome: "killed", detail: "测试失败（期望）" }
    return { ...mutant, outcome: "survived", detail: `突变后测试仍然通过 —— 这块断言缺少杀伤力\n${result.tail}` }
  } finally {
    fs.writeFileSync(full, original)
    const restored = fs.readFileSync(full, "utf8")
    if (restored !== original) {
      throw new Error(`[mutation] 还原 ${mutant.file} 失败，源码可能已被改动 —— 立即中止`)
    }
  }
}

function selfCheck() {
  const full = abs(SURVIVAL_PROBE.file)
  const before = fs.readFileSync(full, "utf8")
  const result = runMutant(SURVIVAL_PROBE)
  const restored = fs.readFileSync(full, "utf8") === before

  if (!restored) {
    console.error("[mutation:self-check] FAIL: 探针运行后源码未逐字还原")
    process.exit(1)
  }
  if (result.outcome !== "survived") {
    console.error(
      `[mutation:self-check] FAIL: 必然存活的探针被报成 "${result.outcome}" —— `
      + "门禁的检出机制坏了（它可能永远绿）",
    )
    process.exit(1)
  }
  console.log("[mutation:self-check] PASS: 探针被正确判定为存活，且源码已逐字还原")
  process.exit(0)
}

function main() {
  if (process.argv.includes("--self-check")) return selfCheck()
  const selected = onlyArg ? MUTANTS.filter((m) => m.id === onlyArg) : MUTANTS
  if (selected.length === 0) {
    console.error(`[mutation] 没有匹配的突变（--only ${onlyArg}）`)
    process.exit(2)
  }

  const results = []
  let aborted = null
  for (const mutant of selected) {
    if (asJson) {
      // 静默模式下不打印中间过程
      const result = runMutant(mutant)
      results.push(result)
      continue
    }
    process.stdout.write(`  … ${mutant.id}\n`)
    try {
      const result = runMutant(mutant)
      results.push(result)
      const mark = result.outcome === "killed" ? "✓" : result.outcome === "survived" ? "✗ 存活" : "✗ 错误"
      process.stdout.write(`  ${mark} ${mutant.id} — ${mutant.description}\n`)
    } catch (error) {
      aborted = error
      break
    }
  }

  if (aborted) {
    console.error(`[mutation] 中止: ${aborted.message}`)
    process.exit(1)
  }

  const survived = results.filter((r) => r.outcome === "survived")
  const errored = results.filter((r) => r.outcome === "error")
  const report = {
    kind: "mutation-gate-report",
    total: results.length,
    killed: results.filter((r) => r.outcome === "killed").length,
    survived: survived.map((r) => ({ id: r.id, detail: r.detail })),
    errored: errored.map((r) => ({ id: r.id, detail: r.detail })),
    results: results.map((r) => ({ id: r.id, file: r.file, outcome: r.outcome, detail: r.detail })),
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    for (const item of survived) console.error(`\n  ✗ ${item.id} 存活:\n${item.detail}`)
    for (const item of errored) console.error(`\n  ✗ ${item.id} 错误: ${item.detail}`)
  }

  if (survived.length > 0 || errored.length > 0) {
    console.error(
      `\n[mutation] FAIL: ${report.killed}/${report.total} killed`
      + `（存活 ${survived.length}，错误 ${errored.length}）`
      + `\n  存活 = 断言缺少杀伤力：先补测试，不要删掉这条突变。`,
    )
    process.exit(1)
  }

  console.log(`\n[mutation] PASS: ${report.killed}/${report.total} mutant killed（每条突变都被现有测试检出）`)
  process.exit(0)
}

main()
