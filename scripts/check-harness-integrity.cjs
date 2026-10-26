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
  const writeBaseline = process.argv.includes("--write-reachability-baseline")
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
  const forwarded = new Set([...harnessSrc.matchAll(/pnpmRun\("([a-z][a-z0-9:_-]+)"/g)].map((m) => m[1]))
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
      const cmds = new Set([...executed.matchAll(/(?:n?pm) run ([a-z][a-z0-9:_-]+)/g)].map((m) => m[1]))
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


  // ── ⑥ D4：`@` 导入环检测 ───────────────────────────────────────
  // 动机（来自 wenlv-next 的 pointer-cycle-guard）：记忆文件用 `@path.md` 内联引用，
  // 一旦形成环，加载会**递归内联** → 上下文无限放大（而且症状是"越用越慢"，很难归因）。
  // 本仓当前没有 `@` 导入（实测 0 处），但一旦有人加，必须当场发现。
  {
    const roots = ["CLAUDE.md", "AGENTS.md"]
    const scanDirs = [".agents"]
    const files = new Set()
    for (const r of roots) if (fs.existsSync(path.join(ROOT, r))) files.add(r)
    const walkMd = (rel) => {
      const abs = path.join(ROOT, rel)
      if (!fs.existsSync(abs)) return
      for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
        const child = path.posix.join(rel, e.name)
        if (e.isDirectory()) {
          if (!e.name.startsWith(".") || e.name === ".agents") walkMd(child)
        } else if (e.name.endsWith(".md")) files.add(child)
      }
    }
    for (const d of scanDirs) walkMd(d)

    const IMP = /(?:^|\s)@([A-Za-z0-9_./-]+\.md)\b/g
    const graph = new Map()
    for (const rel of files) {
      const abs = path.join(ROOT, rel)
      if (!fs.existsSync(abs)) continue
      const text = fs.readFileSync(abs, "utf8")
      const targets = []
      for (const m of text.matchAll(IMP)) {
        const raw = m[1]
        // 相对当前文件目录 与 相对仓库根，两种写法都接受
        for (const cand of [path.posix.normalize(path.posix.join(path.posix.dirname(rel), raw)), raw]) {
          if (fs.existsSync(path.join(ROOT, cand))) { targets.push(cand); break }
        }
      }
      graph.set(rel, targets)
    }

    const WHITE = 0, GRAY = 1, BLACK = 2
    const color = new Map([...graph.keys()].map((k) => [k, WHITE]))
    const stack = []
    const cycles = []
    const dfs = (node) => {
      color.set(node, GRAY)
      stack.push(node)
      for (const next of graph.get(node) || []) {
        const c = color.get(next)
        if (c === GRAY) {
          const i = stack.indexOf(next)
          cycles.push([...stack.slice(i), next].join(" → "))
        } else if (c === WHITE || c === undefined) {
          if (!color.has(next)) color.set(next, WHITE)
          dfs(next)
        }
      }
      stack.pop()
      color.set(node, BLACK)
    }
    for (const n of graph.keys()) if (color.get(n) === WHITE) dfs(n)

    for (const c of cycles) violations.push(`「@」导入成环（会递归内联放大上下文）: ${c}`)
  }

  // ── ⑦ 脚本自环（enforce）──────────────────────────────────────
  // 动机：用脚本批量改字符串时**误伤了 package.json 的脚本值**，把
  //   speckit:tasks: "pnpm harness spec tasks"
  // 变成 `harness → speckit:tasks → harness` 的**自环**，`pnpm harness spec tasks`
  // **跑满 600s 超时**（一天内实测两次）。静态门禁当时查不出它 —— 因为它只是慢，不报错。
  {
    const edges = new Map()
    for (const [k, v] of Object.entries(scripts)) {
      const deps = new Set([...String(v).matchAll(/(?:pnpm|npm) run ([a-zA-Z0-9:_-]+)/g)].map((m) => m[1]))
      edges.set(k, deps)
    }
    const cycles = []
    const color = new Map()
    const stack = []
    const dfs = (node) => {
      color.set(node, 1)
      stack.push(node)
      for (const next of edges.get(node) || []) {
        if (!edges.has(next)) continue
        if (color.get(next) === 1) cycles.push([...stack.slice(stack.indexOf(next)), next].join(" → "))
        else if (!color.has(next)) dfs(next)
      }
      stack.pop()
      color.set(node, 2)
    }
    for (const n of edges.keys()) if (!color.has(n)) dfs(n)
    for (const c of [...new Set(cycles)]) {
      violations.push(`npm 脚本成环（会无限自调 → 命令挂死）: ${c}`)
    }
  }

  // ── ⑧ 脚本可达性（ratchet）──────────────────────────────────────
  // 动机（用户要求）：**所有流程与操作都必须能从 `pnpm harness` 进**。
  // 判据：一个 npm script 要么是主干 / 分组映射目标 / check 链步骤 / 被别的脚本调用，
  //       要么就必须登记在基线里（已知欠债，**只减不增**）。
  const REACH_BASE = "docs/architecture/artifacts/harness-unreachable-scripts.json"
  {
    const harnessSource = fs.readFileSync(path.join(ROOT, "scripts/harness.cjs"), "utf8")
    const reachable = new Set(["harness"]) // 入口脚本自己就是入口
    for (const [k, v] of Object.entries(scripts)) {
      for (const m of String(v).matchAll(/(?:pnpm|npm) run ([a-zA-Z0-9:_-]+)/g)) reachable.add(m[1])
    }
    // harness 里出现过的任何 npm script 名（主干表 / GROUPS 映射 / pnpmRun 调用）
    for (const m of harnessSource.matchAll(/pnpmRun\([^)]*?"([a-z][a-z0-9:_-]+)"/g)) reachable.add(m[1])
    // GROUPS 的键**不带引号**（`migrate: "db:migrate",`），所以结尾的引号必须是可选的 ——
    // 写成必选就会漏掉全部分组映射（实测：128 项"不可达"里大半其实早已可达）。
    for (const m of harnessSource.matchAll(/^\s*"?([a-z][a-z0-9:_-]*)"?:\s*"([a-z][a-z0-9:_-]+)",$/gm)) reachable.add(m[2])
    // **别名族**（`harness.cjs` 的 `ALIASES`）：显式声明「这些 npm script 是某主干的旧写法」。
    // 门禁无法从字符串推断 `test:clean` 就等于 `harness test` 的那一步，只能靠声明。
    const aliasBlock = harnessSource.slice(
      harnessSource.indexOf("const ALIASES"),
      harnessSource.indexOf("function help()"),
    )
    if (!aliasBlock) {
      violations.push("scripts/harness.cjs 里找不到 ALIASES 声明（解析可能已失效，不允许静默通过）")
    }
    let aliasCount = 0
    for (const m of aliasBlock.matchAll(/^\s*([a-z][a-z0-9-]*):\s*\[([^\]]*)\]/gm)) {
      for (const q of m[2].matchAll(/"([a-z][a-z0-9:_-]+)"/g)) {
        reachable.add(q[1])
        aliasCount++
      }
    }
    if (aliasCount === 0) {
      violations.push("harness.cjs 的 ALIASES 解析出 0 条别名（格式变了？不允许静默通过）")
    }

    // 主干表里列出的名字本身
    const trunks = [...harnessSource.matchAll(/^\s*\["([a-z][a-z0-9-]*)",\s*"pnpm harness/gm)].map((m) => m[1])
    for (const t of trunks) reachable.add(t)
    // `case "x":` 里直接 return pnpmRun(sub) 的单值主干
    for (const m of harnessSource.matchAll(/case "([a-z][a-z0-9-]*)":/g)) reachable.add(m[1])

    const unreachable = Object.keys(scripts).filter((k) => !reachable.has(k)).sort()

    // 显式写基线就**先写再说**（不能等下面的"基线缺失"分支 —— 那会把写入路径挡死，实测踩到）
    if (writeBaseline) {
      fs.mkdirSync(path.dirname(path.join(ROOT, REACH_BASE)), { recursive: true })
      fs.writeFileSync(
        path.join(ROOT, REACH_BASE),
        JSON.stringify(
          { note: "从 pnpm harness 到不了的 npm script（已知欠债，只减不增）。收紧：pnpm harness baseline", unreachable },
          null,
          2,
        ) + "\n",
      )
      console.log(`[harness-integrity] 已写入 ${REACH_BASE}（${unreachable.length} 项）`)
      process.exit(0)
    }
    {
      // 基线文件**始终必须有**（哪怕是空数组）：它本身就是"可达性被检查过"的凭证。
      // 缺了它一律失败 —— 否则删掉文件就能让这条检查静默失效（"找不到真源 ⇒ 静默通过"是本仓明令禁止的）。
      if (!fs.existsSync(path.join(ROOT, REACH_BASE))) {
        violations.push(
          `缺少可达性基线 ${REACH_BASE}（当前有 ${unreachable.length} 个脚本不可达）—— ` +
            `不允许"找不到基线 ⇒ 静默通过"。生成：pnpm harness baseline`,
        )
      } else {
        const base = readJson(REACH_BASE)
        const accepted = new Set(base.unreachable || [])
        if (!Array.isArray(base.unreachable)) {
          violations.push(`${REACH_BASE} 缺少 unreachable 数组（格式失效，不允许静默通过）`)
        } else {
          for (const s of unreachable) {
            if (!accepted.has(s)) {
              violations.push(
                `npm script "${s}" 从 \`pnpm harness\` 到不了，也没登记为已知欠债 —— ` +
                  `要么加进 harness 主干/分组，要么说明为什么必须独立`,
              )
            }
          }
          if (audit) {
            const fixed = [...accepted].filter((s) => !unreachable.includes(s))
            if (fixed.length) console.log(`[harness-integrity] 可达性基线里有 ${fixed.length} 项已可达，建议收紧基线`)
          }
          if (writeBaseline) {
            fs.writeFileSync(
              path.join(ROOT, REACH_BASE),
              JSON.stringify({ note: "从 pnpm harness 到不了的 npm script（已知欠债，只减不增）", unreachable }, null, 2) + "\n",
            )
            console.log(`[harness-integrity] 已写入 ${REACH_BASE}（${unreachable.length} 项）`)
            process.exit(0)
          }
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
