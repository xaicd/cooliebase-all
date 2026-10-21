#!/usr/bin/env node
/**
 * 文档声明机检（docs:claims:check）
 *
 * 为什么需要它：本仓已连续多轮栽在「文档写死的数字与真源脱节」上 ——
 *   「活跃规格 8 份」而实际 12、「静态交付门禁 13」而实际 20、
 *   「规范规则 11」而实际 17，NFR 甚至写着「这些数字由 llms:check 守着」
 *   而同一文件下一行又承认「本文件不在被检列表内」。
 *
 * 只改数字是治标（下次还会漂）。这个脚本把「可核验的声明」变成机检项。
 *
 * 设计约束（吸取 gen:paths:check 零误报的经验）：
 *   1. **只扫两个目录** —— `docs/01_management/` 与 `docs/02_requirements/`。
 *      范围窄是零误报的前提；全仓扫描含大量合法的"别的项目的数字"。
 *   2. **只认精确模式** —— 表格行 `| 标签 | 数字 |` 或固定短语，不做散文里的数字猜测。
 *   3. **对标不到真源的，一律不检查** —— 宁可漏，不可误报。
 *   4. **真源缺失即报错** —— 不允许"找不到真源 ⇒ 静默通过"。
 *
 * 用法：
 *   node scripts/check-doc-claims.cjs            # 检查，有漂移则 exit 1
 *   node scripts/check-doc-claims.cjs --audit    # 列出所有被检声明与各自真源
 *   node scripts/check-doc-claims.cjs --json     # 机器可读
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const SCAN_DIRS = ["docs/01_management", "docs/02_requirements"]
const SKIP_DIR_NAMES = new Set(["archive", "node_modules", ".git"])

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8")
}

// ── 真源读取（任一处读取失败都视为门禁失败，不静默降级）────────────
function truthSources() {
  const compatPath = "packages/shared/contract/compat-manifest.json"
  if (!fs.existsSync(path.join(ROOT, compatPath))) {
    throw new Error(`真源缺失: ${compatPath}（不允许"找不到真源 ⇒ 静默通过"）`)
  }
  const compat = JSON.parse(read(compatPath))
  const surface = compat.consumptionSurface || {}
  const gates = Array.isArray(surface.gates) ? surface.gates.length : null
  const mcpTools = surface.mcp && Array.isArray(surface.mcp.tools) ? surface.mcp.tools.length : null
  if (gates === null) throw new Error(`真源 ${compatPath} 缺少 consumptionSurface.gates`)
  if (mcpTools === null) throw new Error(`真源 ${compatPath} 缺少 consumptionSurface.mcp.tools`)

  const countDirs = (rel, predicate) => {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) throw new Error(`真源缺失: ${rel}/`)
    return fs.readdirSync(abs, { withFileTypes: true }).filter(predicate).length
  }

  const briefs = (() => {
    const abs = path.join(ROOT, "docs/specs")
    if (!fs.existsSync(abs)) throw new Error("真源缺失: docs/specs/")
    let n = 0
    for (const domain of fs.readdirSync(abs, { withFileTypes: true })) {
      if (!domain.isDirectory() || SKIP_DIR_NAMES.has(domain.name)) continue
      const dabs = path.join(abs, domain.name)
      for (const feat of fs.readdirSync(dabs, { withFileTypes: true })) {
        if (!feat.isDirectory()) continue
        if (fs.existsSync(path.join(dabs, feat.name, "brief.json"))) n += 1
      }
    }
    return n
  })()

  const sprintLogs = (() => {
    const abs = path.join(ROOT, "docs/features/sprint-prod")
    if (!fs.existsSync(abs)) throw new Error("真源缺失: docs/features/sprint-prod/")
    return fs.readdirSync(abs).filter((f) => f.endsWith(".md")).length
  })()

  const rules = (() => {
    const rel = "scripts/check-engineering-standards.cjs"
    if (!fs.existsSync(path.join(ROOT, rel))) throw new Error(`真源缺失: ${rel}`)
    const src = read(rel)
    const modes = src.match(/mode:\s*"(enforce|ratchet|report)"/g) || []
    const tally = { enforce: 0, ratchet: 0, report: 0 }
    for (const m of modes) tally[m.match(/"(enforce|ratchet|report)"/)[1]] += 1
    return { total: modes.length, ...tally }
  })()

  return {
    activeSpecs: briefs,
    sprintLogs,
    gates,
    mcpTools,
    firstPartyPlugins: countDirs("packages/plugins", (e) => e.isDirectory() && e.name.startsWith("plugin-")),
    skills: countDirs(".agents/skills", (e) => e.isDirectory() && fs.existsSync(path.join(ROOT, ".agents/skills", e.name, "SKILL.md"))),
    rules,
  }
}

// ── 声明定义 ────────────────────────────────────────────────────────
// kind: "tableRow" 只匹配 `| 标签 | 数字 ... |` 的**表格事实行**；"phrase" 匹配固定短语。
function buildClaims(T) {
  const TABLE_FILES = ["docs/02_requirements/non-functional-reqs.md"]
  return [
    {
      id: "active-specs",
      label: "活跃规格数",
      truth: T.activeSpecs,
      recount: "ls docs/specs/*/*/brief.json | wc -l",
      matchers: [
        { kind: "phrase", pattern: /活跃规格（(\d+)\s*份/g },
        { kind: "phrase", pattern: /活跃\s*\*\*(\d+)\s*条\*\*/g },
        { kind: "phrase", pattern: /(\d+)\s*份\s*`docs\/specs\/[^`]*brief\.json`/g },
      ],
    },
    {
      id: "sprint-logs",
      label: "需求日志数",
      truth: T.sprintLogs,
      recount: "ls docs/features/sprint-prod/*.md | wc -l",
      matchers: [{ kind: "phrase", pattern: /(\d+)\s*份需求日志/g }, { kind: "phrase", pattern: /(\d+)\s*份\s*`docs\/features\/sprint-prod/g }],
    },
    {
      id: "gates",
      label: "静态交付门禁数",
      truth: T.gates,
      recount: "pnpm run compat:check",
      matchers: [
        { kind: "tableRow", pattern: /^\|\s*静态交付门禁\s*\|\s*(\d+)\s*\|/gm },
        { kind: "phrase", pattern: /(\d+)\s*道门禁/g },
        { kind: "phrase", pattern: /\*\*(\d+) gates\*\*/g },
      ],
    },
    {
      id: "mcp-tools",
      label: "MCP 工具数",
      truth: T.mcpTools,
      recount: "pnpm run compat:check",
      matchers: [
        { kind: "phrase", pattern: /(\d+)\s*个 MCP 工具/g },
        { kind: "phrase", pattern: /\*\*(\d+) MCP tools\*\*/g },
        { kind: "phrase", pattern: /(\d+) MCP tools/g },
      ],
    },
    {
      id: "plugins",
      label: "第一方插件数",
      truth: T.firstPartyPlugins,
      recount: "ls -d packages/plugins/plugin-* | wc -l",
      matchers: [{ kind: "tableRow", pattern: /^\|\s*第一方插件\s*\|\s*(\d+)\s*\|/gm }],
    },
    {
      id: "skills",
      label: "Agent Skills 数",
      truth: T.skills,
      recount: "ls -d .agents/skills/*/SKILL.md | wc -l",
      matchers: [{ kind: "tableRow", pattern: /^\|\s*Agent Skills\s*\|\s*(\d+)\s*\|/gm }],
    },
    {
      id: "rules",
      label: "工程规范机检规则数",
      truth: T.rules.total,
      recount: "pnpm run standards:check --audit",
      matchers: [{ kind: "tableRow", pattern: /^\|\s*工程规范机检规则\s*\|\s*(\d+)\s*[（(]/gm }],
    },
  ]
}

function walk(dir, out = []) {
  const abs = path.join(ROOT, dir)
  if (!fs.existsSync(abs)) return out
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue
    const rel = path.posix.join(dir, entry.name)
    if (entry.isDirectory()) walk(rel, out)
    else if (entry.name.endsWith(".md")) out.push(rel)
  }
  return out
}

function main() {
  const argv = process.argv.slice(2)
  const audit = argv.includes("--audit")
  const asJson = argv.includes("--json")

  let T
  try {
    T = truthSources()
  } catch (error) {
    console.error(`[doc-claims] ✗ ${error.message}`)
    process.exit(1)
  }

  const claims = buildClaims(T)
  const files = SCAN_DIRS.flatMap((d) => walk(d))
  const findings = []
  let checked = 0

  for (const file of files) {
    const source = read(file)
    for (const claim of claims) {
      for (const m of claim.matchers) {
        m.pattern.lastIndex = 0
        let hit
        while ((hit = m.pattern.exec(source)) !== null) {
          checked += 1
          const claimed = Number(hit[1])
          const line = source.slice(0, hit.index).split("\n").length
          // 跳过「历史记录 / 修复叙述」行 —— 它们引用的是**旧值**，不是当前声明。
          // 实测动机：§6 不准确清单里写着「『20 道门禁』与实际不符」，那是**记录**，
          // 不是断言；误报会逼出无意义的豁免（本仓 gen:paths:check 的教训）。
          const lineText = source.split("\n")[line - 1] || ""
          if (/→|已修|此前|曾|历史|原为|旧值|不写死|写死过|与实际不符/.test(lineText)) continue
          if (claimed !== claim.truth) {
            findings.push({
              file,
              line,
              label: claim.label,
              claimed,
              truth: claim.truth,
              recount: claim.recount,
            })
          }
        }
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ truth: T, checked, findings }, null, 2))
    process.exit(findings.length ? 1 : 0)
  }

  if (audit) {
    console.log("[doc-claims] 被检声明与各自真源：")
    for (const c of claims) {
      console.log(`  · ${c.label.padEnd(18)} 真源实测 = ${String(c.truth).padStart(4)}   复算: ${c.recount}`)
    }
    console.log(`[doc-claims] 扫描目录: ${SCAN_DIRS.join(", ")}（${files.length} 个 md）`)
    console.log(`[doc-claims] 命中并核对的声明处数: ${checked}`)
  }

  if (findings.length) {
    console.error("")
    console.error(`[doc-claims] ✗ 发现 ${findings.length} 处声明与真源不符：`)
    for (const f of findings) {
      console.error(`  ${f.file}:${f.line}`)
      console.error(`    ${f.label}: 文档写 ${f.claimed}，真源实测 ${f.truth}`)
      console.error(`    复算: ${f.recount}`)
    }
    console.error("")
    console.error("[doc-claims] 请改为真源实测值，或改写为「见 <真源命令>」而不写死数字。")
    process.exit(1)
  }

  if (!audit) {
    console.log(`[doc-claims] ✓ ${files.length} 个文档、${checked} 处声明，全部与真源一致`)
    console.log(`  （真源: 活跃规格 ${T.activeSpecs} · 需求日志 ${T.sprintLogs} · 门禁 ${T.gates} · MCP ${T.mcpTools} · 插件 ${T.firstPartyPlugins} · Skills ${T.skills} · 规则 ${T.rules.total}）`)
  }
}

main()
