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
    if (tpl.templatePath.startsWith("clients/") && !fs.existsSync(path.join(ROOT, "clients/expo/package.json"))) continue
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

  // 检查门面与 C 端门户页面不得再出现旧电子书城硬编码泄漏或平台母版品牌串味
  const pageChecks = [
    "src/app/page.tsx",
    "src/app/(portal-pages)/portal/components/book-store-portal.tsx",
    "src/app/(portal-pages)/components/portal-shell.tsx",
    "packages/domains/infra/backend/validators/appearance.validators.ts",
    "packages/shared/contract/blueprint-vars.ts",
    "packages/domains/system/frontend/pages/login.page.tsx",
  ]
  const forbiddenLiterals = [
    "电子书城",
    "E-book Mall",
    "九夏书肆",
    "DIGITAL BOOKSTORE",
    "三体：死神永生",
    "CoolieBase Next 商城",
    "CoolieBase 商业中台团队",
    "CoolieBase AI 实验室",
    "CoolieBase 工业互联团队",
    "CoolieBase 平台工程组",
    "CoolieBase-All-Next Sovereign Mesh",
    "CoolieBase Enterprise Portal",
  ]
  for (const rel of pageChecks) {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) continue
    const src = fs.readFileSync(abs, "utf8")
    for (const word of forbiddenLiterals) {
      if (src.includes(word)) {
        errors.push(`${rel} 仍残留特定行业或母版硬编码 "${word}"，未彻底抽离为模板变量`)
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
    if (tpl.templatePath.startsWith("clients/") && !fs.existsSync(path.join(ROOT, "clients/expo/package.json"))) continue
    const absTpl = path.join(ROOT, tpl.templatePath)
    if (!fs.existsSync(absTpl)) continue
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

/**
 * 控件类型 -> 数据库列类型与 TS 类型自动映射表
 * 让 27B 模型与初级开发者只需写业务字段与控件名，无需手写底层 SQL 类型与 6 大审计底座列。
 */
const WIDGET_TO_COLUMN_TYPE = {
  text: { type: "varchar", tsType: "string" },
  textarea: { type: "text", tsType: "string" },
  rich_text: { type: "text", tsType: "string" },
  number: { type: "int", tsType: "number" },
  currency: { type: "int", tsType: "number" },
  percent: { type: "int", tsType: "number" },
  rate: { type: "int", tsType: "number" },
  slider: { type: "int", tsType: "number" },
  select: { type: "varchar", tsType: "string" },
  radio: { type: "varchar", tsType: "string" },
  checkbox: { type: "varchar", tsType: "string" },
  switch: { type: "int", tsType: "number" },
  date: { type: "timestamp", tsType: "string" },
  datetime: { type: "timestamp", tsType: "string" },
  image: { type: "varchar", tsType: "string" },
  file: { type: "varchar", tsType: "string" },
  color: { type: "varchar", tsType: "string" },
  cascader: { type: "varchar", tsType: "string" },
  tree_select: { type: "varchar", tsType: "string" },
  user_picker: { type: "varchar", tsType: "string" },
  dept_picker: { type: "varchar", tsType: "string" },
  signature: { type: "text", tsType: "string" },
  sub_table: { type: "text", tsType: "string" },
  json: { type: "text", tsType: "string" },
}

/**
 * 将 27B 模型或初级开发者编写的极简业务域蓝图 (`domainSpec`) 编译为：
 * 1. 标准 `CodegenConfig[]` 表元数据（自动补齐 id 主键与 6 大多租户审计列）；
 * 2. 标准 `PageBlockDSL v2` 多端画布 Schema（含 blocks、layoutMode 与 visibleOn/requiredOn 联动）；
 * 3. 标准 `defineStateMachine` 状态机代码片段（若声明了 stateMachine）。
 */
function compileBlueprintDomain(domainSpec) {
  if (!domainSpec || !domainSpec.domain || !Array.isArray(domainSpec.entities)) {
    throw new Error("[blueprint-engine] domainSpec 必须包含 domain 与 entities[] 数组")
  }
  const domain = String(domainSpec.domain).trim().toLowerCase()
  const exportName = `${domain.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_TABLES`

  const codegenTables = []
  const pageSchemas = {}
  const stateMachines = {}

  for (const ent of domainSpec.entities) {
    const tableName = ent.table || `${domain}_${String(ent.className || "item").toLowerCase()}`
    const className =
      ent.className ||
      tableName
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("")
    const title = ent.title || className
    const permEntity = tableName.startsWith(`${domain}_`)
      ? tableName.slice(domain.length + 1)
      : tableName

    const userColumns = (ent.fields || []).map((f) => {
      const widget = f.widget || "text"
      const mapped = WIDGET_TO_COLUMN_TYPE[widget] || WIDGET_TO_COLUMN_TYPE.text
      const colType = f.type || mapped.type
      const tsType = f.tsType || (colType === "int" || colType === "bigint" ? "number" : mapped.tsType)
      const col = {
        name: f.name,
        type: colType,
        tsType,
        nullable: f.required ? false : true,
        comment: f.label || f.name,
        nullableInferred: !f.required,
      }
      if (f.query) col.queryType = f.query
      return col
    })

    // 自动拼装主键 id + 业务字段 + 6 大强制多租户与审计底座列
    const fullColumns = [
      {
        name: "id",
        type: "bigint",
        tsType: "number",
        nullable: false,
        comment: "主键编号",
        isPk: true,
        nullableInferred: true,
      },
      ...userColumns,
      {
        name: "tenant_id",
        type: "varchar",
        tsType: "string",
        nullable: false,
        comment: "租户ID",
        nullableInferred: false,
      },
      {
        name: "created_by",
        type: "varchar",
        tsType: "string",
        nullable: true,
        comment: "创建者",
        nullableInferred: true,
      },
      {
        name: "created_at",
        type: "timestamp",
        tsType: "string",
        nullable: false,
        comment: "创建时间",
        nullableInferred: true,
      },
      {
        name: "updated_by",
        type: "varchar",
        tsType: "string",
        nullable: true,
        comment: "更新者",
        nullableInferred: true,
      },
      {
        name: "updated_at",
        type: "timestamp",
        tsType: "string",
        nullable: false,
        comment: "更新时间",
        nullableInferred: true,
      },
      {
        name: "deleted_at",
        type: "timestamp",
        tsType: "string",
        nullable: true,
        comment: "逻辑删除时间",
        nullableInferred: true,
      },
    ]

    codegenTables.push({
      moduleName: domain,
      className,
      businessName: title,
      parentMenuId: `${domain}-dir`,
      permissionPrefix: `${domain}:${permEntity}`,
      table: {
        name: tableName,
        comment: title,
        columns: fullColumns,
      },
    })

    // 同步产出 PageBlockDSL v2 多端画布配置
    pageSchemas[tableName] = {
      entity: tableName,
      title,
      layoutMode: ent.layoutMode || "table",
      fields: (ent.fields || []).map((f, idx) => ({
        code: f.name,
        label: f.label || f.name,
        type: f.widget || "text",
        required: Boolean(f.required),
        showInList: f.showInList !== false,
        showInForm: f.showInForm !== false,
        sort: (idx + 1) * 10,
        ...(Array.isArray(f.options)
          ? {
              options: f.options.map((opt) =>
                typeof opt === "string" ? { label: opt, value: opt } : opt
              ),
            }
          : {}),
        ...(f.visibleOn ? { visibleOn: f.visibleOn } : {}),
        ...(f.disabledOn ? { disabledOn: f.disabledOn } : {}),
        ...(f.requiredOn ? { requiredOn: f.requiredOn } : {}),
      })),
      blocks: (
        ent.blocks || [
          {
            id: `${tableName}_kpi`,
            type: "stat_metrics",
            title: `${title}核心指标`,
            surface: "all",
          },
        ]
      ).map((b) => ({
        ...b,
        surface: b.surface === "both" ? "all" : b.surface || "all",
      })),
    }

    if (ent.stateMachine && Array.isArray(ent.stateMachine.transitions)) {
      stateMachines[tableName] = {
        name: `${tableName}.status`,
        initial: ent.stateMachine.initial,
        transitions: ent.stateMachine.transitions,
      }
    }
  }

  const tablesTsCode =
    `// 由 scripts/blueprint-engine.cjs compile-domain 自动从极简业务蓝图展开生成\n` +
    `import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"\n\n` +
    `export const ${exportName}: CodegenConfig[] = ${JSON.stringify(codegenTables, null, 2)}\n`

  return {
    domain,
    exportName,
    tablesFileRel: `scripts/data/${domain}-tables.ts`,
    codegenTables,
    tablesTsCode,
    pageSchemas,
    stateMachines,
  }
}

function runCompileDomain(argv) {
  const fileIdx = argv.indexOf("--file")
  const fileArg = fileIdx >= 0 ? argv[fileIdx + 1] : argv[1]
  const write = argv.includes("--write")
  if (!fileArg) {
    throw new Error("用法: node scripts/blueprint-engine.cjs compile-domain --file <domain-blueprint.json> [--write]")
  }
  const spec = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), fileArg), "utf8"))
  if (spec.variables) {
    runRender({
      cmd: "render",
      compact: false,
      dryRun: !write,
      valuesFile: null,
      preset: spec.variables.INDUSTRY_PRESET || null,
      sets: spec.variables,
    })
  }
  const compiled = compileBlueprintDomain(spec)
  if (write) {
    const absTables = path.join(ROOT, compiled.tablesFileRel)
    fs.writeFileSync(absTables, compiled.tablesTsCode, "utf8")
    console.log(`[blueprint-engine] ✓ 已生成表元数据真源: ${compiled.tablesFileRel} (${compiled.codegenTables.length} 张表)`)
    console.log(`[blueprint-engine] 下一步执行: pnpm run domain:new ${compiled.domain}`)
  } else {
    console.log(
      JSON.stringify(
        {
          domain: compiled.domain,
          tablesFileRel: compiled.tablesFileRel,
          tableCount: compiled.codegenTables.length,
          pageSchemas: compiled.pageSchemas,
          stateMachines: compiled.stateMachines,
        },
        null,
        2
      )
    )
  }
}

if (require.main === module) {
  const rawArgv = process.argv.slice(2)
  const opts = parseCliArgs(rawArgv)
  if (opts.cmd === "check") runCheck()
  else if (opts.cmd === "schema") runSchema(opts)
  else if (opts.cmd === "render") runRender(opts)
  else if (opts.cmd === "compile-domain") runCompileDomain(rawArgv)
  else {
    console.log("用法: node scripts/blueprint-engine.cjs [check | schema --compact | render --values <json> --preset <industry> --set K=V | compile-domain --file <spec.json> --write]")
  }
}

module.exports = {
  loadManifest,
  buildDefaultMap,
  extractPlaceholdersFromText,
  renderTemplateText,
  compileBlueprintDomain,
}
