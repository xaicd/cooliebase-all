/**
 * `llms.txt` / `llms-full.txt` 事实同步门禁。
 *
 * 为什么需要：这两个文件是**手写**的（没有生成器），而它们面向的是正要下载本仓的
 * AI Agent —— 里面的数字就是 Agent 对仓库的第一印象。它此前已经漂移：
 *   「12+ 确定性工具」实际 17；「8 层交付 Gate」实际 11；「26 个 Agent 技能」实际 38；
 *   profile 只列了 2 个（实际 5 个）。
 * 这类"目录看着有、内容是否真"的漂移不会让任何现有门禁变红，所以必须单独机检。
 *
 * 真源（不复制数字，一律现算）：
 *   · MCP 工具数 / 门禁数 ← packages/shared/contract/compat-manifest.json
 *   · 原生域数           ← packages/shared/backend/constants/domain-catalog.json
 *   · 技能数             ← .agents/skills/<name>/SKILL.md 实际个数
 *   · profile 清单       ← scripts/lib/hatch-profile.cjs 的 PROFILES
 *
 * 约定：每个断言必须在 `llms.txt` 里**至少命中一次**。若你删掉了某句声明，
 * 必须**在同一个提交里删掉对应断言** —— 否则"删掉声明"就成了绕过门禁的手段。
 */

const fs = require("fs")
const path = require("path")
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")

function fail(message) {
  if (asJson) console.error(JSON.stringify({ ok: false, error: message }, null, 2))
  else console.error(`[llms:check] ✗ ${message}`)
  process.exit(1)
}

function countFiles(dir, filter) {
  if (!fs.existsSync(dir)) return 0
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!filter(path.join(dir, entry.name), entry)) continue
    count += 1
  }
  return count
}

const compatPath = path.join(ROOT, "packages", "shared", "contract", "compat-manifest.json")
const catalogPath = path.join(ROOT, "packages", "shared", "backend", "constants", "domain-catalog.json")
const hatchPath = path.join(ROOT, "scripts", "lib", "hatch-profile.cjs")

if (!fs.existsSync(compatPath)) fail(`缺少真源 ${path.relative(ROOT, compatPath)}`)
if (!fs.existsSync(catalogPath)) fail(`缺少真源 ${path.relative(ROOT, catalogPath)}`)

const compat = JSON.parse(fs.readFileSync(compatPath, "utf8"))
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
const mcpToolCount = (compat.consumptionSurface?.mcp?.tools || []).length
const gateCount = (compat.consumptionSurface?.gates || []).length
const domainCount = (catalog.domains || []).length
const agentContractCount = (() => {
  // Agent 契约的**真源是文件本身**（`packages/**/agent/*.agent.json`），不是任何文档里的数字。
  const found = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
        walk(full)
      } else if (entry.name.endsWith(".agent.json")) {
        found.push(full)
      }
    }
  }
  walk(path.join(ROOT, "packages"))
  return found.length
})()

const skillCount = countFiles(path.join(ROOT, ".agents", "skills"), (full, entry) => {
  if (!entry.isDirectory()) return false
  return fs.existsSync(path.join(full, "SKILL.md"))
})

let profiles = []
try {
  profiles = require(hatchPath).PROFILES || []
} catch {
  profiles = []
}
if (profiles.length === 0) {
  const source = fs.readFileSync(hatchPath, "utf8")
  const match = source.match(/PROFILES\s*=\s*Object\.freeze\(\[([^\]]+)\]/)
  profiles = match ? match[1].split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : []
}
if (profiles.length === 0) fail("无法从 scripts/lib/hatch-profile.cjs 解析出 PROFILES")

for (const [label, value] of [
  ["MCP 工具数", mcpToolCount],
  ["门禁数", gateCount],
  ["原生域数", domainCount],
  ["技能数", skillCount],
  ["Agent 契约数", agentContractCount],
]) {
  if (!Number.isInteger(value) || value <= 0) fail(`真源异常：${label} = ${value}（拒绝在真源不可信时判定同步）`)
}

/**
 * 每条断言：所有命中都必须等于真值；且必须在 `requiredIn` 列出的文件里**至少命中一次**。
 * 为什么要求"至少命中一次"：否则把句子删掉就成了绕过门禁的手段。
 */
const ASSERTIONS = [
  {
    id: "mcp-tool-count",
    // 「12+ 确定性工具」「12 项 MCP 工具」「12 大内置 MCP 工具定义」
    pattern: /(\d+)\s*(?:\+|项|个|大)?\s*(?:内置\s*)?(?:确定性\s*)?(?:MCP\s*)?工具/g,
    expected: mcpToolCount,
    label: "MCP 工具数",
    requiredIn: ["llms.txt", "README.md"],
  },
  {
    id: "gate-count",
    // 「8 层交付 Gate」「11 道质量门禁」。注意排除 `G0~G7 质量门禁`：
    // 那是 spec-kit 的 8 个阶段（0..7），与本清单的门禁数是**两个不同概念**。
    // 同样地，**裸「质量门禁」也排除**：AGENTS.md 的「20 道质量门禁」是 CMMI 06_quality_assurance
    // 的口径，与 compat 交付门禁清单不是一回事 —— 两处都曾产生误报。
    pattern: /(?<!G0~G)(\d+)\s*(?:层|道|项)?\s*(?:交付 Gate|交付门禁)/g,
    expected: gateCount,
    label: "门禁数",
    requiredIn: ["llms.txt"],
  },
  {
    id: "domain-count",
    pattern: /(\d+)\s*(?:个)?\s*原生业务域/g,
    expected: domainCount,
    label: "原生域数",
    requiredIn: ["llms.txt"],
  },
  {
    id: "agent-contract-count",
    // 「324 份机器可读契约」—— 实测已漂到 326（文档全线滞后）。
    pattern: /(\d+)\s*(?:份|个)\s*(?:Agent\s*)?(?:机器可读\s*)?(?:强类型\s*)?(?:跨端\s*)?契约/g,
    expected: agentContractCount,
    label: "Agent 契约数",
    requiredIn: ["AGENTS.md", "README.md"],
  },
  {
    id: "skill-count-agent",
    // 中英两种写法：`38 个专业 Agent Skills` / `38 个 Agent 专属技能`。
    // 早期只写 `技能`，英文写法漏检（实测：把数字改成 99 门禁仍然绿）。
    pattern: /(\d+)\s*个\s*(?:专业\s*)?Agent\s*(?:专属\s*)?(?:技能|Skills)/g,
    expected: skillCount,
    label: "技能数",
    requiredIn: ["llms.txt"],
  },
  {
    id: "skill-count-bare",
    // 裸写法：AGENTS.md 的「共 26 个技能」、README 的「36 个技能」。
    pattern: /(\d+)\s*个技能/g,
    expected: skillCount,
    label: "技能数",
    requiredIn: ["AGENTS.md", "README.md"],
  },
]

const FILES = ["llms.txt", "llms-full.txt", "AGENTS.md", "README.md"]
const contents = new Map()
for (const rel of FILES) {
  const full = path.join(ROOT, rel)
  contents.set(rel, fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null)
}

/**
 * 自引用章节号自洽：文档里写 `§3.2` 时，**必须真的存在 `3.2` 这个标题**。
 * 零误报 —— 章节号只有"存在/不存在"两种状态。实测 AGENTS.md 曾有 1 处断裂（`§11.2`，
 * 而 §11 下没有子小节，它是列表第 2 条）。
 */
function sectionRefProblems(file, text) {
  const headings = new Set()
  for (const line of text.split("\n")) {
    const match = line.match(/^#{1,4}\s+(\d+(?:\.\d+)*)[.\s]/)
    if (match) headings.add(match[1])
  }
  const out = []
  const seen = new Set()
  for (const match of text.matchAll(/§\s*(\d+(?:\.\d+)*)/g)) {
    const ref = match[1]
    if (seen.has(ref)) continue
    seen.add(ref)
    if (!headings.has(ref)) out.push(`${file}: 引用了不存在的章节 §${ref}（该文只有 ${headings.size} 个带编号的标题）`)
  }
  return out
}

const problems = []
const results = []

for (const assertion of ASSERTIONS) {
  const hitsByFile = new Map()
  let total = 0
  for (const rel of FILES) {
    const text = contents.get(rel)
    if (!text) continue
    let fileHits = 0
    for (const match of text.matchAll(assertion.pattern)) {
      fileHits += 1
      total += 1
      const found = Number(match[1])
      if (found !== assertion.expected) {
        problems.push(
          `${rel}: 「${match[0].trim()}」= ${found}，真值 ${assertion.expected}（${assertion.label}）`,
        )
      }
    }
    hitsByFile.set(rel, fileHits)
  }
  for (const rel of assertion.requiredIn) {
    if (!contents.get(rel)) {
      problems.push(`缺少被检文件 ${rel}（断言 ${assertion.id} 要求它声明${assertion.label}）`)
      continue
    }
    if ((hitsByFile.get(rel) || 0) === 0) {
      problems.push(
        `${rel} 里找不到「${assertion.label}」的声明 —— 若确实删掉了这句，`
        + `请在同一个提交里删除 scripts/check-llms-sync.cjs 的断言 ${assertion.id}（否则等于绕过门禁）`,
      )
    }
  }
  results.push({ id: assertion.id, expected: assertion.expected, total, hitsByFile: Object.fromEntries(hitsByFile) })
}

// 自引用章节号（仅对含编号标题的文档有意义；README/llms.txt 也可受益）
for (const rel of FILES) {
  const text = contents.get(rel)
  if (!text) continue
  if (!/^#{1,4}\s+\d/m.test(text)) continue
  problems.push(...sectionRefProblems(rel, text))
}

// profile 清单：只要 llms.txt 提到 --profile，就必须把 5 个 profile 全部列出
const llmsText = contents.get("llms.txt")
if (llmsText && /--profile/.test(llmsText)) {
  const missing = profiles.filter((name) => !new RegExp(`\\b${name}\\b`).test(llmsText))
  if (missing.length > 0) {
    problems.push(`llms.txt 提到 --profile 但未列出全部 profile，缺少: ${missing.join(", ")}（真值: ${profiles.join("/")}）`)
  }
  results.push({ id: "profile-list", expected: profiles.join("/"), hits: profiles.length - missing.length, hitsInCanonical: profiles.length - missing.length })
}

const truth = { mcpToolCount, gateCount, domainCount, skillCount, agentContractCount, profiles }

if (problems.length > 0) {
  if (asJson) {
    console.log(JSON.stringify({ ok: false, truth, results, problems }, null, 2))
  } else {
    for (const problem of problems) console.error(`[llms:check] ✗ ${problem}`)
  }
  fail(`❌ ${problems.length} 处与真源不一致`)
}

if (asJson) {
  console.log(JSON.stringify({ ok: true, truth, results }, null, 2))
} else {
  console.log(
    `[llms:check] PASS: llms.txt / llms-full.txt 与真源一致`
    + `（MCP ${mcpToolCount} 工具 / ${gateCount} 门禁 / ${domainCount} 域 / ${skillCount} 技能 / ${agentContractCount} 契约 / ${profiles.length} profile）`,
  )
}
