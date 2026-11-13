#!/usr/bin/env node
"use strict"

/**
 * UI Design Tokens 门禁 (AGENTS §5.2 可执行化)
 * --------------------------------------------------------------------------
 * 扫描 `packages/<pkg>/frontend` 与 `src/app` 下的 `.tsx` 文件，禁止在 `<td>` / `<th>`
 * 上继续裸写 Tailwind 水平/垂直间距类 (`px-*` / `py-*`)；新页面与生成器模板统一引用
 * `@/modules/shared/frontend/lib/design-tokens` 导出的 `UI` 常量，历史存量经棘轮冻结。
 *
 * 用法:
 *   node scripts/check-design-tokens.cjs                  # 校验（新增违规 exit 1）
 *   node scripts/check-design-tokens.cjs --write-baseline # 刷新冻结棘轮基线
 *   node scripts/check-design-tokens.cjs --audit          # 输出分布统计
 */

const fs = require("node:fs")
const path = require("node:path")

const DEFAULT_ROOT = path.resolve(__dirname, "..")
const BASELINE_REL = "docs/architecture/artifacts/design-tokens-baseline.json"
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".next-cooliebase", "dist", "coverage", "__tests__"])

const TABLE_CELL_TAG_RE = /<(td|th)\b([\s\S]*?)>/g
const BARE_PADDING_TOKEN_RE = /\bp[xy]-(?:\d+(?:\.\d+)?|\[[^\]]+\])\b/g

function walkTsxFiles(dirAbs, out = []) {
  if (!fs.existsSync(dirAbs)) return out
  let entries = []
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true })
  } catch (err) {
    console.warn(`[design-tokens] 读取目录失败 (${dirAbs}): ${String(err)}`)
    return out
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink() || SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dirAbs, entry.name)
    if (entry.isDirectory()) {
      walkTsxFiles(full, out)
    } else if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
      out.push(full)
    }
  }
  return out
}

function collectCandidateFiles(rootDir) {
  const files = []
  const packagesDir = path.join(rootDir, "packages")
  if (fs.existsSync(packagesDir)) {
    for (const pkgEntry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (!pkgEntry.isDirectory() || SKIP_DIRS.has(pkgEntry.name)) continue
      const pkgAbs = path.join(packagesDir, pkgEntry.name)
      const directFrontend = path.join(pkgAbs, "frontend")
      if (fs.existsSync(directFrontend)) {
        walkTsxFiles(directFrontend, files)
      }
      for (const subEntry of fs.readdirSync(pkgAbs, { withFileTypes: true })) {
        if (!subEntry.isDirectory() || SKIP_DIRS.has(subEntry.name)) continue
        const nestedFrontend = path.join(pkgAbs, subEntry.name, "frontend")
        if (fs.existsSync(nestedFrontend)) {
          walkTsxFiles(nestedFrontend, files)
        }
      }
    }
  }
  const srcAppDir = path.join(rootDir, "src", "app")
  if (fs.existsSync(srcAppDir)) {
    walkTsxFiles(srcAppDir, files)
  }
  return [...new Set(files)].sort()
}

/**
 * 扫描单个 TSX 文件源码，返回所有在 <td>/<th> className 中裸写 px-* / py-* 的条目
 */
function scanFileForBareTableSpacing(content) {
  const hits = []
  TABLE_CELL_TAG_RE.lastIndex = 0
  let match
  while ((match = TABLE_CELL_TAG_RE.exec(content)) !== null) {
    const tag = match[1]
    const attrs = match[2] || ""
    if (!/\bclassName\s*=/.test(attrs)) continue
    // 若已使用 UI.table.* token 且未混写裸 px-/py-，自然不会命中 BARE_PADDING_TOKEN_RE
    const tokens = attrs.match(BARE_PADDING_TOKEN_RE)
    if (tokens && tokens.length > 0) {
      const line = content.slice(0, match.index).split("\n").length
      const normalizedTokens = [...new Set(tokens)].sort()
      hits.push({
        tag,
        line,
        tokens: normalizedTokens,
        signature: `<${tag}>:${normalizedTokens.join("+")}`,
      })
    }
  }
  return hits
}

function runDesignTokensCheck(options = {}) {
  const rootDir = options.rootDir || process.env.DESIGN_TOKENS_ROOT || DEFAULT_ROOT
  const writeBaseline = Boolean(options.writeBaseline)
  const audit = Boolean(options.audit)
  const baselineAbs = path.join(rootDir, BASELINE_REL)

  const files = collectCandidateFiles(rootDir)
  const entryCounts = new Map()
  const details = []

  for (const absFile of files) {
    const relFile = path.relative(rootDir, absFile).split(path.sep).join("/")
    const content = fs.readFileSync(absFile, "utf8")
    const fileHits = scanFileForBareTableSpacing(content)
    for (const hit of fileHits) {
      const key = `${relFile} -> ${hit.signature}`
      entryCounts.set(key, (entryCounts.get(key) || 0) + 1)
      details.push({ relFile, ...hit, key })
    }
  }

  const currentEntries = Object.fromEntries([...entryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])))
  const totalOccurrences = details.length

  if (writeBaseline) {
    fs.mkdirSync(path.dirname(baselineAbs), { recursive: true })
    const payload = {
      note: "AGENTS §5.2 表格单元格裸 px-*/py-* 历史冻结基线（棘轮只减不增；新页面请统一引用 @/modules/shared/frontend/lib/design-tokens 的 UI.table.*）",
      scannedFiles: files.length,
      uniqueKeys: Object.keys(currentEntries).length,
      totalOccurrences,
      entries: currentEntries,
    }
    fs.writeFileSync(baselineAbs, JSON.stringify(payload, null, 2) + "\n", "utf8")
    return {
      ok: true,
      wroteBaseline: true,
      scannedFiles: files.length,
      uniqueKeys: Object.keys(currentEntries).length,
      totalOccurrences,
      regressions: [],
    }
  }

  let baselineEntries = {}
  if (fs.existsSync(baselineAbs)) {
    try {
      const raw = JSON.parse(fs.readFileSync(baselineAbs, "utf8"))
      baselineEntries = raw && typeof raw.entries === "object" && raw.entries ? raw.entries : {}
    } catch (err) {
      return {
        ok: false,
        scannedFiles: files.length,
        uniqueKeys: Object.keys(currentEntries).length,
        totalOccurrences,
        regressions: [`基线文件解析失败 (${BASELINE_REL}): ${String(err)}`],
      }
    }
  }

  const regressions = []
  for (const [key, count] of Object.entries(currentEntries)) {
    const allowed = Number(baselineEntries[key] || 0)
    if (count > allowed) {
      const sample = details.find((d) => d.key === key)
      const loc = sample ? `${sample.relFile}:${sample.line}` : key
      regressions.push(`${loc} 发现新增裸表格间距 (${key}，当前 ${count} > 基线 ${allowed})`)
    }
  }

  if (audit) {
    console.log(`[design-tokens] 扫描 ${files.length} 个 TSX 文件，存量键 ${Object.keys(currentEntries).length} 项（共 ${totalOccurrences} 处）`)
  }

  return {
    ok: regressions.length === 0,
    scannedFiles: files.length,
    uniqueKeys: Object.keys(currentEntries).length,
    totalOccurrences,
    baselineKeys: Object.keys(baselineEntries).length,
    regressions,
  }
}

if (require.main === module) {
  const argv = process.argv.slice(2)
  const writeBaseline = argv.includes("--write-baseline")
  const audit = argv.includes("--audit")
  const result = runDesignTokensCheck({ writeBaseline, audit })

  if (result.wroteBaseline) {
    console.log(
      `[design-tokens] 已刷新冻结基线 ${BASELINE_REL}（扫描 ${result.scannedFiles} 个文件，${result.uniqueKeys} 个键 / ${result.totalOccurrences} 处存量）`,
    )
    process.exit(0)
  }

  if (!result.ok) {
    console.error(`[design-tokens] ✗ 发现 ${result.regressions.length} 项违反 UI.table.* 设计规范的新增裸 px-*/py-*：`)
    for (const item of result.regressions.slice(0, 20)) {
      console.error(`  - ${item}`)
    }
    if (result.regressions.length > 20) {
      console.error(`  ... 另有 ${result.regressions.length - 20} 项`)
    }
    console.error("修复方式：导入 `@/modules/shared/frontend/lib/design-tokens` 并改用 `UI.table.th` / `UI.table.td` / `UI.table.actions`。")
    process.exit(1)
  }

  console.log(
    `[design-tokens] ✓ 通过（扫描 ${result.scannedFiles} 个 TSX 文件，新增裸表格 px/py 违规 0；冻结存量键 ${result.uniqueKeys}/${result.baselineKeys}）`,
  )
  process.exit(0)
}

module.exports = {
  scanFileForBareTableSpacing,
  runDesignTokensCheck,
}
