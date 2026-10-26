#!/usr/bin/env node
/**
 * 交付边界机检（`delivery:boundary:check`）
 *
 * 背景（用户 2026-10-26 的原话）：
 *   「底座是为了一个个真实项目框架用的，跟 DigitalStaff / coolie 工坊本身没关系才对。
 *     客户上线运行都是自己独立的服务器，只是交付环节在数字员工工厂环境。」
 *
 * 也就是说：**AI 是交付环节的工具，不是产物的依赖**。
 * 这两条一直只是口头共识 —— 本脚本把它们变成可失败的检查。
 *
 * ## 检查 ①：产物不得依赖 agent / LLM 运行时
 *   产物的 `dependencies` 里出现 `openai` / `@anthropic-ai/*` / `langchain*` /
 *   `@modelcontextprotocol/*` / `@deepseek-ai/*` / `puppeteer` / `playwright` 等 →
 *   说明"AI 能力被塞进了客户要部署的包"。**它们只应出现在 devDependencies 或工具脚本里。**
 *
 * ## 检查 ②：前端页面不得 import agent / MCP 模块
 *   `packages/{domains,plugins}/*​/frontend/**` 里 import 了 `agent` / `mcp` / `llm` 相关模块 →
 *   说明"关掉 AI 页面就跑不起来"。
 *
 * 用法：
 *   node scripts/check-delivery-boundary.cjs            # 检查
 *   node scripts/check-delivery-boundary.cjs --audit    # 打印扫描范围与命中数
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")

/** 这些包属于「交付工具链」，不是「产物依赖」 */
const AGENT_RUNTIME_PACKAGES = [
  "openai",
  "@anthropic-ai/sdk",
  "@google/generative-ai",
  "@modelcontextprotocol/sdk",
  "@deepseek-ai/dsh",
  "langchain",
  "@langchain/core",
  "llamaindex",
  "puppeteer",
  "playwright",
  "@playwright/test",
  "cheerio",
]

/** 前端不应直接引用的模块前缀 */
const AGENT_MODULE_PATTERNS = [
  /from\s+["'][^"']*\/(agent|agents|llm|mcp)[^"']*["']/,
  /from\s+["']@\/shared\/backend\/plugins[^"']*["']/,
  /require\(\s*["'][^"']*\/(agent|llm|mcp)[^"']*["']\s*\)/,
]

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))
}

function walk(dir, predicate, out = []) {
  const abs = path.join(ROOT, dir)
  if (!fs.existsSync(abs)) return out
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const rel = path.posix.join(dir, entry.name)
    if (entry.isDirectory()) walk(rel, predicate, out)
    else if (predicate(entry.name)) out.push(rel)
  }
  return out
}

function main() {
  const audit = process.argv.includes("--audit")
  const violations = []

  // ── ① 产物依赖 ──────────────────────────────────────────────────
  const pkg = readJson("package.json")
  const prodDeps = Object.keys(pkg.dependencies || {})
  const toolDeps = Object.keys(pkg.devDependencies || {})
  const leaked = prodDeps.filter((name) =>
    AGENT_RUNTIME_PACKAGES.some((p) => name === p || name.startsWith(p + "/") || name.startsWith(p)),
  )
  for (const name of leaked) {
    violations.push(
      `package.json 的 dependencies 里有 agent/LLM 运行时包 "${name}" —— ` +
        `它会被装进客户要部署的产物。交付环节的工具应放 devDependencies 或独立脚本。`,
    )
  }
  // 反查：这些包**不该**在产物依赖里，但也别悄悄出现在 devDeps 又被人当运行时用
  const inDev = toolDeps.filter((name) => AGENT_RUNTIME_PACKAGES.some((p) => name.startsWith(p)))

  // ── ② 前端不得依赖 agent 模块 ──────────────────────────────────
  const feFiles = [
    ...walk("packages/plugins", (n) => /\.(ts|tsx)$/.test(n)),
    ...walk("packages/domains", (n) => /\.(ts|tsx)$/.test(n)),
  ].filter((f) => f.includes("/frontend/"))

  let frontendChecked = 0
  for (const rel of feFiles) {
    frontendChecked += 1
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    for (const pattern of AGENT_MODULE_PATTERNS) {
      const m = pattern.exec(src)
      if (!m) continue
      const line = src.slice(0, m.index).split("\n").length
      violations.push(
        `${rel}:${line} 前端页面引用了 agent/MCP 模块 —— 关掉 AI 后这个页面会起不来：${m[0].slice(0, 80)}`,
      )
      break
    }
  }

  if (audit) {
    console.log("[delivery-boundary] 扫描范围")
    console.log(`  产物 dependencies ${prodDeps.length} 个（其中 agent/LLM 运行时 ${leaked.length} 个）`)
    console.log(`  devDependencies 里的 agent/LLM 包 ${inDev.length} 个（允许；属交付工具链）${inDev.length ? "：" + inDev.join(", ") : ""}`)
    console.log(`  前端文件 ${frontendChecked} 个（packages/{domains,plugins}/*/frontend/**）`)
  }

  if (violations.length) {
    console.error("")
    console.error(`[delivery-boundary] ✗ ${violations.length} 处违反交付边界：`)
    for (const v of violations.slice(0, 20)) console.error(`  · ${v}`)
    if (violations.length > 20) console.error(`  … 另有 ${violations.length - 20} 处`)
    process.exit(1)
  }

  console.log(
    `[delivery-boundary] ✓ 产物依赖无 agent/LLM 运行时 · ${frontendChecked} 个前端文件均不依赖 agent/MCP`,
  )
}

main()
