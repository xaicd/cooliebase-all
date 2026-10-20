#!/usr/bin/env node
/**
 * 孵化端到端（hatch E2E）：**产物自身能不能跑通它自己的门禁**。
 *
 * 为什么必须真跑，而不是靠别的门禁间接保证：
 * 本仓的 `check` 只保证**基座自己**是绿的。孵化会「克隆 → 裁剪 → 改身份 → 建库 → 种子」，
 * 每一步都可能留下**只在新工程里才暴露**的残留。实测（2026-10-20）就抓到：
 *   · `project:create` 的产物 `pnpm run check` **exit=1** —— 374 处悬空引用，
 *     来自被裁域的 wiki 词条（生成物只写不删）与 llms/README 里的「17 域 / 342 契约」声明；
 *   · 而基座自己的 `check` **完全看不到**这些 —— 因为基座 17 个域都在。
 * 所以这条判据只能靠**真造一个工程再跑它的门禁**来守。
 *
 * 两条入口都要跑（它们走的不是同一段代码）：
 *   · `project:init --target`：SQLite、零外部依赖；
 *   · `project:create`      ：reactor 克隆 + hatch 裁剪 + **真实 Postgres**（这里用嵌入式，零 Docker）。
 *
 * 用法:
 *   npm run hatch:e2e                    # 两条入口 × minimal
 *   npm run hatch:e2e -- --profile base  # 指定 profile
 *   npm run hatch:e2e -- --only init     # 只跑一条
 *   npm run hatch:e2e -- --skip-install  # 迭代用（产物复用已装依赖会失败，谨慎）
 *   npm run hatch:e2e -- --keep          # 保留产物目录便于排查
 *
 * 退出码：任一环节非 0 即非 0（**不做任何降级**）。
 */
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(`--${name}`)
const valueOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const profile = valueOf("profile", "minimal")
const only = valueOf("only", "both")
const skipInstall = hasFlag("skip-install")
const keep = hasFlag("keep")
const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "hatch-e2e-"))

const failures = []

function step(label, cmd, args, cwd, env = {}) {
  process.stdout.write(`\n[hatch-e2e] === ${label} ===\n`)
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env, HATCH_E2E: "1" },
  })
  const code = result.status ?? 1
  process.stdout.write(`[hatch-e2e] ${label} → exit=${code}\n`)
  return code
}

/** 跑一条入口：造工程 → 装依赖 → **跑工程自己的 check**。 */
async function runEntry(kind) {
  const target = path.join(baseDir, kind)
  const env = {}

  process.stdout.write(`\n${"=".repeat(64)}\n[hatch-e2e] 入口: ${kind}  profile=${profile}\n${"=".repeat(64)}\n`)

  if (kind === "create") {
    // `project:create` 需要一台真实 Postgres。这里用**嵌入式**（零容器）——
    // 与 verify:real-db / smoke:login 等入口同一条路，不为 E2E 引入 Docker 依赖。
    const { resolveDatabaseEndpoint } = require("./lib/ephemeral-pg.cjs")
    const endpoint = await resolveDatabaseEndpoint()
    env.PROJECT_PG_ADMIN_URL = endpoint.url
    process.stdout.write(`[hatch-e2e] 嵌入式 Postgres: ${endpoint.url}\n`)
  }

  const initCode = kind === "init"
    ? step("project:init --target", "node",
        [path.join(ROOT, "scripts", "project-init.cjs"), "--target", target, "--name", `e2e-${kind}`, "--title", "E2E Probe", "--profile", profile],
        ROOT, env)
    : step("project:create", "node",
        [path.join(ROOT, "scripts", "clone-project-base.cjs"), target, "--profile", profile],
        ROOT, env)

  if (initCode !== 0) {
    failures.push(`${kind}: 孵化本身失败 (exit=${initCode})`)
    return
  }

  if (!skipInstall) {
    const installCode = step("产物依赖安装", "pnpm", ["install", "--frozen-lockfile"], target)
    if (installCode !== 0) {
      failures.push(`${kind}: 产物 pnpm install 失败 (exit=${installCode})`)
      return
    }
  }

  const checkCode = step("产物自身 check（关键判据）", "pnpm", ["run", "check"], target)
  if (checkCode !== 0) {
    failures.push(`${kind}: 产物自身 check 失败 (exit=${checkCode}) —— 孵化出的是**坏工程**`)
  }
}

async function main() {
  const kinds = only === "both" ? ["init", "create"] : [only]
  for (const kind of kinds) await runEntry(kind)

  process.stdout.write(`\n${"=".repeat(64)}\n`)
  if (failures.length > 0) {
    for (const line of failures) process.stdout.write(`[hatch-e2e] ✗ ${line}\n`)
    process.stdout.write(`[hatch-e2e] 结论: FAIL（${failures.length} 项）\n`)
  } else {
    process.stdout.write(`[hatch-e2e] 结论: PASS —— ${kinds.join(" + ")} 的产物均通过自身门禁\n`)
  }
  process.stdout.write(`[hatch-e2e] 产物目录: ${baseDir}${keep ? "（--keep 保留）" : "（将清理）"}\n`)

  if (!keep) fs.rmSync(baseDir, { recursive: true, force: true })
  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((error) => {
  process.stdout.write(`[hatch-e2e] ✗ 异常: ${error?.message ?? error}\n`)
  if (!keep) fs.rmSync(baseDir, { recursive: true, force: true })
  process.exit(1)
})
