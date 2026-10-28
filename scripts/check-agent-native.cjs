#!/usr/bin/env node
/**
 * Agent-Native 属性门禁。
 *
 * 约定（AGENTS §5.2 / agent 契约 `agentNative` 段）:
 *   1. 页面根节点: `data-agent-scope` + `data-agent-page-ready`（就绪信号）
 *   2. 交互元素（button/input/select/textarea）: `data-agent-target="模块:动作"`
 *   3. 元素状态: `data-agent-state`
 *   4. 多层弹窗: 基底容器打 `inert` 做节点剪枝
 *   5. 严禁让 agent 依赖无文本 CSS/坐标定位
 *
 * 为什么需要门禁: 这套属性不会让页面"看起来"有任何变化，漏了也不报错 ——
 * 直到 agent 去驱动时才发现点不到。所以必须机检，不能靠人记。
 *
 * 模式 `ratchet`: 既有欠债冻结在 baseline 里，**只拦新增**；修好后跑
 * `node scripts/check-agent-native.cjs --update-baseline` 收紧基线。
 *
 * 用法:
 *   node scripts/check-agent-native.cjs                    # 门禁
 *   node scripts/check-agent-native.cjs --audit            # 只看当前符合度，不失败
 *   node scripts/check-agent-native.cjs --update-baseline  # 收紧基线
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const BASELINE = path.join(ROOT, "docs", "architecture", "artifacts", "agent-native-baseline.json")
const auditOnly = process.argv.includes("--audit")
const updateBaseline = process.argv.includes("--update-baseline")

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(page\.tsx|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

/** 收集所有生成/手写的管理端页面与表单组件。 */
function targets() {
  const files = []
  for (const root of [path.join(ROOT, "packages", "plugins"), path.join(ROOT, "packages", "domains")]) {
    if (!fs.existsSync(root)) continue
    for (const domain of fs.readdirSync(root)) {
      for (const kind of ["pages", "components"]) {
        const dir = path.join(root, domain, "frontend", kind)
        for (const file of walk(dir)) files.push(path.relative(ROOT, file).replace(/\\/g, "/"))
      }
    }
  }
  return files.sort()
}

/** 逐文件判定: 返回缺失项数组（空 = 合格）。 */
function violations(rel) {
  const source = fs.readFileSync(path.join(ROOT, rel), "utf8")
  const missing = []
  const isPage = rel.endsWith(".page.tsx")
  const hasInteractive = /<(button|input|select|textarea)\b/.test(source)

  if (isPage) {
    if (!source.includes("data-agent-scope")) missing.push("data-agent-scope")
    if (!source.includes("data-agent-page-ready")) missing.push("data-agent-page-ready")
  }
  if (hasInteractive && !source.includes("data-agent-target")) missing.push("data-agent-target")
  // 有弹窗（Form 组件 / 页面里出现 Form）就有剪枝责任
  if ((isPage || rel.endsWith("Form.tsx")) && !source.includes("inert") && !rel.endsWith("Form.tsx")) {
    missing.push("inert(弹窗剪枝)")
  }
  return missing
}

function main() {
  const files = targets()
  const findings = {}
  for (const rel of files) {
    const missing = violations(rel)
    if (missing.length > 0) findings[rel] = missing
  }

  const offenders = Object.keys(findings)
  console.log(`[agent-native] 扫描 ${files.length} 个页面/组件，${offenders.length} 个待补齐`)

  if (auditOnly) {
    for (const rel of offenders.slice(0, 20)) console.log(`  · ${rel} — 缺 ${findings[rel].join(", ")}`)
    if (offenders.length > 20) console.log(`  … 其余 ${offenders.length - 20} 个`)
    return
  }

  if (updateBaseline) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true })
    fs.writeFileSync(BASELINE, JSON.stringify({ note: "Agent-Native 属性既有欠债（ratchet，只拦新增）", offenders }, null, 2) + "\n")
    console.log(`  已写入基线: ${path.relative(ROOT, BASELINE)}（${offenders.length} 个）`)
    return
  }

  const accepted = new Set(fs.existsSync(BASELINE) ? (JSON.parse(fs.readFileSync(BASELINE, "utf8")).offenders ?? []) : [])
  const added = offenders.filter((rel) => !accepted.has(rel))
  const fixed = [...accepted].filter((rel) => !findings[rel])

  if (added.length > 0) {
    console.error(`\n[agent-native] FAIL: ${added.length} 个新增页面/组件缺少 Agent-Native 属性`)
    for (const rel of added.slice(0, 15)) console.error(`  · ${rel} — 缺 ${findings[rel].join(", ")}`)
    if (added.length > 15) console.error(`  … 其余 ${added.length - 15} 个`)
    console.error("\n修复: 给交互元素加 data-agent-target=\"<模块>:<动作>\"，页面根加 data-agent-scope / data-agent-page-ready，弹窗打开时基底加 inert。")
    process.exit(1)
  }

  if (fixed.length > 0) {
    console.log(`[agent-native] 有 ${fixed.length} 个历史欠债已修好 —— 跑 --update-baseline 收紧基线`)
    for (const rel of fixed.slice(0, 10)) console.log(`  ✓ ${rel}`)
  }
  console.log(`[agent-native] PASS（基线内欠债 ${accepted.size} 个，新增 0 个）`)
}

main()
