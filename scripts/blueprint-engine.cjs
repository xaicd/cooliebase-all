#!/usr/bin/env node
/**
 * Coolie工坊 & 27B本地大模型 · 蓝图动态变量模板引擎 (scripts/blueprint-engine.cjs)
 * ============================================================================
 * 用途：
 * 1. `node scripts/blueprint-engine.cjs check`
 *    机检 `blueprint.template.json` 的 8 大变量域、所有 `.template` 文件中的 `{{VAR}}` 占位符闭合性，
 *    以及门面/门户页面是否残留特定垂直行业硬编码（如“电子书城/九夏书肆”）。
 * 2. `node scripts/blueprint-engine.cjs schema [--compact]`
 *    输出供 Coolie工坊或 27B 本地模型消费的精简变量字典与 Prompt 指引（<400 Tokens）。
 * 3. `node scripts/blueprint-engine.cjs render [--values <file.json>] [--preset <industry>] [--set K=V] [--dry-run]`
 *    将 `.template` 模板文件中的 `{{VAR}}` 占位符按变量字典渲染落盘至目标配置文件。
 */

const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const MANIFEST_PATH = path.join(ROOT, "blueprint.template.json")

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`[blueprint-engine] 缺失根级模板清单: ${MANIFEST_PATH}`)
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
}

function buildDefaultMap(manifest) {
  const defaults = {}
  for (const [key, meta] of Object.entries(manifest.variables || {})) {
    defaults[key] = meta.default
  }
  return defaults
}

function extractPlaceholdersFromText(text) {
  const found = new Set()
  const re = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g
  let m
  while ((m = re.exec(text)) !== null) {
    found.add(m[1])
  }
  return Array.from(found)
}

function renderTemplateText(text, values) {
  return text.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (full, name) => {
    if (Object.prototype.hasOwnProperty.call(values, name) && values[name] !== undefined) {
      return String(values[name])
    }
    return full
  })
}

function parseCliArgs(argv) {
  const cmd = argv[0] || "check"
  const opts = {
    cmd,
    compact: false,
    dryRun: false,
    valuesFile: null,
    preset: null,
    sets: {},
  }
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--compact") opts.compact = true
    else if (arg === "--dry-run") opts.dryRun = true
    else if (arg === "--values" && argv[i + 1]) opts.valuesFile = argv[++i]
    else if (arg.startsWith("--values=")) opts.valuesFile = arg.split("=")[1]
    else if (arg === "--preset" && argv[i + 1]) opts.preset = argv[++i]
    else if (arg.startsWith("--preset=")) opts.preset = arg.split("=")[1]
    else if (arg === "--set" && argv[i + 1]) {
      const pair = argv[++i]
      const eqIdx = pair.indexOf("=")
      if (eqIdx > 0) {
        opts.sets[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim()
      }
    } else if (arg.startsWith("--set=")) {
      const pair = arg.slice("--set=".length)
      const eqIdx = pair.indexOf("=")
      if (eqIdx > 0) {
        opts.sets[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim()
      }
    }
  }
  return opts
}

function runCheck() {
  const manifest = loadManifest()
  const vars = manifest.variables || {}
  const varKeys = Object.keys(vars)
  const errors = []

  const requiredGroups = [
    "engineering",
    "branding",
    "facade",
    "consumerPortal",
    "multiClient",
    "tenancyAndAuth",
    "infrastructure",
    "topologyAndDomains",
  ]
  const presentGroups = new Set(Object.values(vars).map((v) => v.group))
  for (const g of requiredGroups) {
    if (!presentGroups.has(g)) {
      errors.push(`缺失必须的变量域分组: ${g}`)
    }
  }

  for (const [k, meta] of Object.entries(vars)) {
    if (meta.default === undefined) {
      errors.push(`变量 ${k} 缺少 default 默认值`)
    }
  }

  for (const tpl of manifest.templateFiles || []) {
    const absTpl = path.join(ROOT, tpl.templatePath)
    if (!fs.existsSync(absTpl)) {
      errors.push(`模板文件不存在: ${tpl.templatePath}`)
      continue
    }
    const content = fs.readFileSync(absTpl, "utf8")
    const placeholders = extractPlaceholdersFromText(content)
    if (placeholders.length === 0) {
      errors.push(`模板文件 ${tpl.templatePath} 未包含任何 {{VAR}} 占位符`)
    }
    for (const p of placeholders) {
      if (!vars[p]) {
        errors.push(`模板文件 ${tpl.templatePath} 引用了未在 blueprint.template.json 登记的变量 {{${p}}}`)
      }
    }
  }

  // 检查门面与 C 端门户页面不得再出现旧电子书城硬编码泄漏
  const pageChecks = [
    "src/app/page.tsx",
    "src/app/(portal-pages)/portal/components/book-store-portal.tsx",
  ]
  const forbiddenLiterals = ["电子书城", "E-book Mall", "九夏书肆", "DIGITAL BOOKSTORE", "三体：死神永生"]
  for (const rel of pageChecks) {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) continue
    const src = fs.readFileSync(abs, "utf8")
    for (const word of forbiddenLiterals) {
      if (src.includes(word)) {
        errors.push(`${rel} 仍残留特定行业硬编码 "${word}"，未彻底抽离为模板变量`)
      }
    }
  }

  if (errors.length > 0) {
    console.error(`[blueprint-engine] FAIL (${errors.length} 项违规):`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  console.log(
    `[blueprint-engine] PASS: 8 大变量域 (${varKeys.length} 个动态变量) + ${(manifest.templateFiles || []).length} 份显式 {{VAR}} 模板文件全部闭环，门面/C端门户 0 硬编码泄漏`
  )
}

function runSchema(opts) {
  const manifest = loadManifest()
  if (opts.compact) {
    const compactOut = {
      templateId: manifest.templateId,
      syntax: manifest.syntax,
      llm27bQuickGuide: manifest.llm27bQuickGuide,
      variables: Object.fromEntries(
        Object.entries(manifest.variables || {}).map(([k, v]) => [
          k,
          { group: v.group, default: v.default, desc: v.description },
        ])
      ),
    }
    console.log(JSON.stringify(compactOut, null, 2))
    return
  }
  console.log(JSON.stringify(manifest, null, 2))
}

function runRender(opts) {
  const manifest = loadManifest()
  const merged = buildDefaultMap(manifest)

  if (opts.valuesFile) {
    const absValues = path.resolve(process.cwd(), opts.valuesFile)
    const userValues = JSON.parse(fs.readFileSync(absValues, "utf8"))
    Object.assign(merged, userValues)
  }
  if (opts.preset) {
    merged.INDUSTRY_PRESET = opts.preset
  }
  Object.assign(merged, opts.sets)

  // 自动派生衍生默认值并执行安全长度截断（防 Zod 校验自撞）
  if (opts.sets.PLATFORM_TITLE && !opts.sets.SHORT_NAME) {
    merged.SHORT_NAME = String(opts.sets.PLATFORM_TITLE).slice(0, 16)
  }
  if (opts.sets.PLATFORM_TITLE && !opts.sets.LOGIN_HEADLINE) {
    merged.LOGIN_HEADLINE = String(opts.sets.PLATFORM_TITLE).slice(0, 40)
  }
  if (typeof merged.SHORT_NAME === "string" && merged.SHORT_NAME.length > 16) {
    merged.SHORT_NAME = merged.SHORT_NAME.slice(0, 16).trim()
  }
  if (typeof merged.PLATFORM_TITLE === "string" && merged.PLATFORM_TITLE.length > 40) {
    merged.PLATFORM_TITLE = merged.PLATFORM_TITLE.slice(0, 40).trim()
  }
  if (typeof merged.BRAND_MARK === "string" && merged.BRAND_MARK.length > 2) {
    merged.BRAND_MARK = merged.BRAND_MARK.slice(0, 2)
  }

  const results = []
  for (const tpl of manifest.templateFiles || []) {
    const absTpl = path.join(ROOT, tpl.templatePath)
    const absTarget = path.join(ROOT, tpl.targetPath)
    const raw = fs.readFileSync(absTpl, "utf8")
    let rendered = renderTemplateText(raw, merged)

    if (tpl.format === "json") {
      const parsed = JSON.parse(rendered)
      if (tpl.targetPath.endsWith("project-profile.json")) {
        parsed.facade = parsed.facade || {}
        parsed.facade.telemetryEnabled = Boolean(
          merged.TELEMETRY_ENABLED === true || merged.TELEMETRY_ENABLED === "true"
        )
        parsed.facade.devPort = Number(merged.ADMIN_PORT) || 3210
      }
      rendered = JSON.stringify(parsed, null, 2) + "\n"
    }

    if (!opts.dryRun) {
      fs.writeFileSync(absTarget, rendered, "utf8")
    }
    results.push({ template: tpl.templatePath, target: tpl.targetPath, dryRun: opts.dryRun })
  }

  console.log(
    `[blueprint-engine] ${opts.dryRun ? "DRY-RUN" : "RENDERED"}: 已完成 ${results.length} 个模板目标渲染 (PLATFORM_TITLE="${merged.PLATFORM_TITLE}", INDUSTRY_PRESET="${merged.INDUSTRY_PRESET}")`
  )
}

if (require.main === module) {
  const opts = parseCliArgs(process.argv.slice(2))
  if (opts.cmd === "check") runCheck()
  else if (opts.cmd === "schema") runSchema(opts)
  else if (opts.cmd === "render") runRender(opts)
  else {
    console.log("用法: node scripts/blueprint-engine.cjs [check | schema --compact | render --values <json> --preset <industry> --set K=V]")
  }
}

module.exports = {
  loadManifest,
  buildDefaultMap,
  extractPlaceholdersFromText,
  renderTemplateText,
}
