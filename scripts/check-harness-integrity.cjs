#!/usr/bin/env node
/**
 * Harness 完整性机检（D3 + D5 的整改）
 *
 * 背景（来自 `docs/specs/system/harness-mutual-audit/audit-report.md`）：
 *  - **维度 2**：29 条 AGENTS 条款里，只有 1 条有 rule 文件回引 → "哪条铁律有机检守"**无人能答**；
 *  - **维度 4**：五层×三元组没有"配齐"门禁 → 某层有脚本没门禁，没人知道；
 *  - **维度 5**：`scripts/` 下有**孤儿脚本**（`agent-autopilot-daemon.ts` 实测无任何入口引用）。
 *
 * 本脚本把这三件事变成**可失败**的检查：
 *
 *  ## ① 条款 ↔ 机制（D5）
 *   `docs/architecture/artifacts/clause-mechanism-map.json` 登记每条 `## N.` 条款对应的 npm script。
 *   - AGENTS 里**每条**编号条款都必须在登记表里（新增条款不登记 → 失败）；
 *   - 登记的每个 script 必须**真实存在**于 package.json（防"编造出处"）；
 *   - 登记表不得引用 AGENTS 里**已删除**的条款。
 *
 *  ## ② 孤儿脚本（D3）
 *   `scripts/check-*.cjs` / `scripts/audit-*.cjs` 家族必须被某个 npm script、`check` 链、
 *   harness 子命令、或条款登记表**引用** —— 否则它就是"写了但没人跑"的门禁。
 *
 *  ## ③ harness 子命令一致性（D3）
 *   `scripts/harness.cjs` 里转发到的每个 npm script 必须真实存在。
 *
 * 用法：
 *   node scripts/check-harness-integrity.cjs            # 检查
 *   node scripts/check-harness-integrity.cjs --audit    # 打印覆盖统计
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const MAP_REL = "docs/architecture/artifacts/clause-mechanism-map.json"

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))
}

function main() {
  const audit = process.argv.includes("--audit")
  const violations = []

  const pkg = readJson("package.json")
  const scripts = pkg.scripts || {}
  const agents = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8")

  // ── ① 条款 ↔ 机制 ────────────────────────────────────────────────
  const mapAbs = path.join(ROOT, MAP_REL)
  if (!fs.existsSync(mapAbs)) {
    console.error(`[harness-integrity] ✗ 真源缺失: ${MAP_REL}（不允许"找不到登记表 ⇒ 静默通过"）`)
    process.exit(1)
  }
  const map = readJson(MAP_REL)
  if (!Array.isArray(map.clauses) || map.clauses.length === 0) {
    console.error(`[harness-integrity] ✗ ${MAP_REL} 里没有 clauses（解析可能已失效）`)
    process.exit(1)
  }

  // AGENTS 里的编号条款（兼容 `## 2. 标题` 与 `## 2.1 标题`）
  const clauseIds = [...agents.matchAll(/^## (\d+(?:\.\d+)*)\.?\s+(.+)$/gm)].map((m) => ({ id: m[1], title: m[2].trim() }))
  if (clauseIds.length === 0) {
    console.error("[harness-integrity] ✗ AGENTS.md 里解析出 0 条编号条款（解析可能已失效）")
    process.exit(1)
  }

  const mapped = new Map(map.clauses.map((c) => [c.clause, c]))
  for (const { id } of clauseIds) {
    if (!mapped.has(id)) {
      violations.push(`AGENTS §${id} 是编号条款，但没有在 ${MAP_REL} 登记对应机制 —— 新增条款必须同时给出机检`)
    }
  }
  for (const entry of map.clauses) {
    if (!clauseIds.some((c) => c.id === entry.clause)) {
      violations.push(`${MAP_REL} 引用了 AGENTS 里不存在的条款 §${entry.clause}（条款已删除？请同步登记表）`)
    }
    if (!entry.mechanisms || entry.mechanisms.length === 0) {
      violations.push(`§${entry.clause} 没有任何机制 —— 本仓规矩：禁止口头规范`)
    }
    for (const m of entry.mechanisms || []) {
      if (!scripts[m]) {
        violations.push(`§${entry.clause} 登记的机制 "${m}" 在 package.json 里不存在（编造出处）`)
      }
    }
  }

  // ── ② 孤儿门禁脚本 ──────────────────────────────────────────────
  const checkChain = scripts.check || ""
  const harnessSrc = fs.readFileSync(path.join(ROOT, "scripts/harness.cjs"), "utf8")
  const mapCmds = new Set(map.clauses.flatMap((c) => c.mechanisms || []))
  const scriptValues = Object.values(scripts).join("\n")

  const gateScripts = fs
    .readdirSync(path.join(ROOT, "scripts"))
    .filter((f) => /^(check|audit)-.*\.cjs$/.test(f))

  for (const file of gateScripts) {
    // 某条 npm script 的值里提到了它，或 check 链提到它，或 harness 里提到它
    const referenced =
      scriptValues.includes(file) || checkChain.includes(file) || harnessSrc.includes(file)
    if (!referenced) {
      violations.push(
        `scripts/${file} 是门禁/审计脚本，但没有任何 npm script、check 链或 harness 子命令引用它 —— 写了但没人跑`,
      )
    }
  }

  // ── ③ harness 子命令一致性 ──────────────────────────────────────
  const forwarded = new Set([...harnessSrc.matchAll(/pnpmRun\("([a-z][a-z:_-]+)"/g)].map((m) => m[1]))
  for (const s of forwarded) {
    if (!scripts[s]) violations.push(`scripts/harness.cjs 转发到不存在的 npm script: "${s}"`)
  }


  // ── ④ D2：装配表路由列的 order 必须真实存在 ─────────────────────
  {
    const asm = fs.readFileSync(path.join(ROOT, ".agents/context/ASSEMBLY.md"), "utf8")
    const mainOrders = new Set([...asm.matchAll(/^\|\s*(-?\d+)\s*\|/gm)].map((m) => m[1]))
    if (mainOrders.size === 0) {
      violations.push(".agents/context/ASSEMBLY.md 主表里解析出 0 个 order（解析可能已失效）")
    }
    const routingStart = asm.indexOf("## 任务路由")
    if (routingStart === -1) {
      violations.push(".agents/context/ASSEMBLY.md 缺少「## 任务路由」小节（审计维度 1：缺的不是文件大小，是路由）")
    } else {
      const routing = asm.slice(routingStart)
      const refs = new Set([...routing.matchAll(/(-?\d+)\s+[a-z][a-z-]+/g)].map((m) => m[1]))
      for (const r of refs) {
        if (!mainOrders.has(r)) {
          violations.push(`ASSEMBLY 路由表引用了不存在的 order: ${r}（主表里没有这一段）`)
        }
      }
    }
  }

  // ── ⑤ D6：pre-commit 里不允许有"只存在于这里"的检查 ─────────────
  // 动机：`git commit --no-verify` 能绕过 pre-commit。若某条检查**只**在 pre-commit 里，
  // 绕过它 = 完全没跑（`plan:freshness` 曾经就是这样，直到本轮把它补进 CI）。
  {
    const hookPath = path.join(ROOT, ".githooks/pre-commit")
    if (fs.existsSync(hookPath)) {
      const hook = fs.readFileSync(hookPath, "utf8")
      // **只认真正执行的**：排除 `echo` 行（那是给用户的提示文案，不是 hook 会跑的东西）。
      // 实测踩到：`echo "先跑：<包管理器> run agent:route …"` 这类提示文案被误判为"pre-commit 执行了它"。
      const executed = hook
        .split("\n")
        .filter((l) => !/^\s*#/.test(l) && !/\becho\b/.test(l))
        .join("\n")
      const cmds = new Set([...executed.matchAll(/(?:n?pm) run ([a-z][a-z:_-]+)/g)].map((m) => m[1]))
      const checkChain = scripts.check || ""
      const ciFiles = fs.existsSync(path.join(ROOT, ".github/workflows"))
        ? fs.readdirSync(path.join(ROOT, ".github/workflows")).map((f) => fs.readFileSync(path.join(ROOT, ".github/workflows", f), "utf8")).join("\n")
        : ""
      for (const c of cmds) {
        // 提示文案里出现的命令不算"执行"——只认 `run <cmd>` 形式出现在 check 链或 CI 中
        const inCheck = checkChain.includes(`run ${c}`)
        const inCi = ciFiles.includes(`run ${c}`) || ciFiles.includes(`${c} --`) || ciFiles.includes(` ${c} `)
        if (!inCheck && !inCi) {
          violations.push(
            `pre-commit 执行 \`${c}\`，但 check 链与 CI 都没有它 —— \`--no-verify\` 会完全绕过（D6）`,
          )
        }
      }
    }
  }

  if (audit) {
    console.log("[harness-integrity] 覆盖统计")
    console.log(`  AGENTS 编号条款 ${clauseIds.length} 条 · 登记表 ${map.clauses.length} 条`)
    console.log(`  登记机制（去重） ${mapCmds.size} 个 · package.json scripts ${Object.keys(scripts).length} 个`)
    console.log(`  门禁/审计脚本 ${gateScripts.length} 个 · harness 转发 ${forwarded.size} 个`)
  }

  if (violations.length) {
    console.error("")
    console.error(`[harness-integrity] ✗ ${violations.length} 处不一致：`)
    for (const v of violations.slice(0, 30)) console.error(`  · ${v}`)
    if (violations.length > 30) console.error(`  … 另有 ${violations.length - 30} 处`)
    process.exit(1)
  }

  console.log(
    `[harness-integrity] ✓ ${clauseIds.length} 条条款全部有机制 · ${gateScripts.length} 个门禁脚本均被引用 · harness 转发 ${forwarded.size} 个均存在`,
  )
}

main()
