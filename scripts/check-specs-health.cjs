#!/usr/bin/env node
/**
 * 规格与文档防污染健康扫描器 (Specs & Docs Anti-Pollution Health Check)
 *
 * 检查标准:
 * 1. docs/specs/ 根目录下严禁散落松散的单个 .md 文件（所有规格必须按域独立成包）。
 * 2. 严禁出现历史遗留的单复数混淆目录（如 docs/spec/ 必须不存在）。
 * 3. 严禁存在空置悬挂目录（empty dangling folders）。
 * 4. docs/specs/<domain>/<name> 下每个规格包必须具备合法元数据（brief.json 或 spec.json）。
 * 5. 跨 IDE 规则入口（CLAUDE.md, .cursorrules, .windsurfrules, .clinerules, AGENTS.md）保持无缝同步。
 */
const fs = require("node:fs")
const path = require("node:path")
const { ROOT, listAllSpecs } = require("./lib/spec-resolver.cjs")

function checkHealth() {
  const errors = []
  const warnings = []

  // 1. 检查是否存在单数形式遗留目录 docs/spec
  const legacySingular = path.join(ROOT, "docs", "spec")
  if (fs.existsSync(legacySingular)) {
    errors.push(`发现历史遗留单数目录: docs/spec/ —— 规范要求统一为 docs/specs/`)
  }

  // 2. 检查 docs/specs 根目录下是否有散落的松散文件
  const specsRoot = path.join(ROOT, "docs", "specs")
  if (fs.existsSync(specsRoot)) {
    const entries = fs.readdirSync(specsRoot, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        errors.push(`docs/specs 根目录下发现松散文件: ${entry.name} —— 规格必须封装在 docs/specs/<domain>/<name>/ 中`)
      } else if (entry.name !== "archive" && entry.name !== "_baseline") {
        // 检查域目录下是否为空
        const domainDir = path.join(specsRoot, entry.name)
        const subEntries = fs.readdirSync(domainDir)
        if (subEntries.length === 0) {
          warnings.push(`发现空域目录: docs/specs/${entry.name}/（建议自动清理）`)
        }
      }
    }
  }

  // 3. 检查每个规格包的自洽性
  const allSpecs = listAllSpecs()
  for (const spec of allSpecs) {
    const hasBrief = fs.existsSync(path.join(spec.path, "brief.json"))
    const hasSpecJson = fs.existsSync(path.join(spec.path, "spec.json")) || fs.existsSync(path.join(spec.path, "feature.json"))
    if (!hasBrief && !hasSpecJson) {
      errors.push(`规格包损坏: ${path.relative(ROOT, spec.path)} 缺少 brief.json 或 spec.json`)
    }
  }

  // 4. 检查多 IDE 规则转发器存在性
  const requiredIdes = [
    "CLAUDE.md",
    ".cursorrules",
    ".windsurfrules",
    ".clinerules",
    "AGENTS.md",
    ".github/copilot-instructions.md",
  ]
  for (const ideFile of requiredIdes) {
    const filePath = path.join(ROOT, ideFile)
    if (!fs.existsSync(filePath)) {
      errors.push(`缺少多 IDE 规则入口文件: ${ideFile}`)
    } else {
      const content = fs.readFileSync(filePath, "utf8")
      if (!content.includes("FEATURE-SPEC-AND-PROTOTYPE-STANDARD") && !content.includes("spec:new")) {
        warnings.push(`${ideFile} 未直接索引规格标准或 spec:new 指令`)
      }
      // **必须**指明第一步是需求分诊 —— 否则"要不要立规格"又回到模型自由心证。
      // 这条从 warning 提到 error：它是流程能否自动触发的唯一开关。
      if (!content.includes("agent:route")) {
        errors.push(
          `${ideFile} 未指明需求分诊入口（应在文件里出现 \`npm run agent:route\`）—— ` +
            `否则 agent 不会先判定"要不要立规格"，流程又回到靠自觉`,
        )
      }
    }
  }

  // 5. 检查是否存在重复的 skills 目录（原则：全仓只有 .agents/skills，严禁 docs/skills 镜像或副本）
  const duplicateSkills = path.join(ROOT, "docs", "skills")
  if (fs.existsSync(duplicateSkills)) {
    errors.push(`发现重复/镜像 skills 目录: docs/skills/ —— 铁律要求唯一真源为 .agents/skills/，严禁多份目录造成认知与维护污染`)
  }

  return { errors, warnings, specCount: allSpecs.length }
}

const { errors, warnings, specCount } = checkHealth()

console.log(`=== [specs:health] 规格体系与文档健康防污染扫描 ===`)
console.log(`已检测到有效规格包总数: ${specCount} 个`)

if (warnings.length > 0) {
  console.log(`\n⚠️ 发现轻微待优化项 (${warnings.length} 项):`)
  for (const w of warnings) console.log(`   - ${w}`)
}

if (errors.length > 0) {
  console.log(`\n❌ 发现目录或规则污染问题 (${errors.length} 项):`)
  for (const e of errors) console.log(`   - ${e}`)
  process.exit(1)
}

console.log(`\n✅ 全盘扫描通过: 0 污染、0 散落文件、多 IDE 规则同步完好！`)
process.exit(0)
