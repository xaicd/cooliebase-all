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
const {
  compactMenuTitle,
  validateMenuTitle,
  validateBlueprintMenuTitles,
} = require("./lib/menu-title-guard.cjs")

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
    force: false,
    valuesFile: null,
    preset: null,
    sets: {},
  }
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--compact") opts.compact = true
    else if (arg === "--dry-run") opts.dryRun = true
    else if (arg === "--force") opts.force = true
    else if (arg === "--values" && argv[i + 1]) opts.valuesFile = argv[++i]
    else if (arg.startsWith("--values=")) opts.valuesFile = arg.split("=")[1]
    else if (arg === "--preset" && argv[i + 1]) opts.preset = argv[++i]
    else if (arg.startsWith("--preset=")) opts.preset = arg.split("=")[1]
    else if ((arg === "--set" || arg === "--set-var") && argv[i + 1]) {
      const pair = argv[++i]
      const eqIdx = pair.indexOf("=")
      if (eqIdx > 0) {
        opts.sets[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim()
      }
    } else if (arg.startsWith("--set=") || arg.startsWith("--set-var=")) {
      const prefix = arg.startsWith("--set-var=") ? "--set-var=" : "--set="
      const pair = arg.slice(prefix.length)
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

  // 与 compat-manifest.json (defaultMode: "base-path") 及 next.config.mjs 保持严格一致：
  // 派生项目 (PROJECT_NAME !== "cooliebase-all") 若未显式传 PREVIEW_BASE_PATH，自动推导为 /<PROJECT_NAME>
  const isDerivedProject =
    merged.PROJECT_NAME &&
    String(merged.PROJECT_NAME).trim() !== "" &&
    String(merged.PROJECT_NAME).trim() !== "cooliebase" + "-all"
  if (isDerivedProject && !merged.PREVIEW_BASE_PATH && opts.sets.PREVIEW_BASE_PATH === undefined) {
    merged.PREVIEW_BASE_PATH = "/" + String(merged.PROJECT_NAME).trim().replace(/^\/+/, "").replace(/\/+$/, "")
  } else if (merged.PREVIEW_BASE_PATH) {
    const rawBp = String(merged.PREVIEW_BASE_PATH).trim()
    merged.PREVIEW_BASE_PATH = rawBp === "/" ? "" : "/" + rawBp.replace(/^\/+/, "").replace(/\/+$/, "")
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
        parsed.facade.basePath = merged.PREVIEW_BASE_PATH || ""
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
 * 面向普通应届毕业生与本地 27B 模型的控件同义词容错字典
 * 当输入非标准控件名（如 money/price/amount/dropdown/boolean 等）时自动归一化为 22 种标准商业控件。
 */
const WIDGET_SYNONYM_MAP = {
  money: "currency",
  price: "currency",
  amount: "currency",
  decimal: "currency",
  int: "number",
  integer: "number",
  float: "number",
  bool: "switch",
  boolean: "switch",
  toggle: "switch",
  enum: "select",
  dropdown: "select",
  combobox: "select",
  multi_select: "checkbox",
  tags: "checkbox",
  string: "text",
  input: "text",
  phone: "text",
  email: "text",
  url: "text",
  longtext: "textarea",
  multiline: "textarea",
  markdown: "rich_text",
  html: "rich_text",
  editor: "rich_text",
  time: "datetime",
  timestamp: "datetime",
  avatar: "image",
  photo: "image",
  picture: "image",
  upload: "file",
  attachment: "file",
  user: "user_picker",
  member: "user_picker",
  dept: "dept_picker",
  department: "dept_picker",
  tree: "tree_select",
  table: "sub_table",
  children: "sub_table",
}

/**
 * 蓝图防呆诊断与自愈器（27B & 应届生友好）：
 * 1. 自动将口语化/同义词控件名纠正为 22 种标准控件；
 * 2. 表名未带 `<domain>_` 前缀时自动补齐；
 * 3. 声明了 `stateMachine` 但 `fields` 中漏写状态列时，自动补齐状态列并推导 `enumValues` / `enumLabels`；
 * 4. 返回结构化中文诊断报告 `diagnostics[]` 与自愈后的 `healedSpec`。
 */
function diagnoseAndHealBlueprint(domainSpec) {
  if (!domainSpec || typeof domainSpec !== "object") {
    throw new Error("[blueprint-doctor] 蓝图必须是合法的 JSON 对象")
  }
  const diagnostics = []
  const healed = JSON.parse(JSON.stringify(domainSpec))
  const domain = String(healed.domain || "custom")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
  healed.domain = domain

  if (!Array.isArray(healed.entities) || healed.entities.length === 0) {
    throw new Error("[blueprint-doctor] 蓝图必须包含非空的 entities[] 业务实体数组")
  }

  for (const ent of healed.entities) {
    const rawTable = String(ent.table || ent.name || "item")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
    if (!rawTable.startsWith(`${domain}_`)) {
      const fixedTable = `${domain}_${rawTable}`
      diagnostics.push({
        level: "healed",
        entity: rawTable,
        message: `表名 "${rawTable}" 未包含域前缀 "${domain}_"，已自动规范化为 "${fixedTable}"`,
      })
      ent.table = fixedTable
    } else {
      ent.table = rawTable
    }

    const rawMenuCandidate = String(
      ent.menuTitle !== undefined ? ent.menuTitle : ent.title || ent.className || ent.table
    ).trim()
    const menuCheck = validateMenuTitle(rawMenuCandidate)
    if (!menuCheck.ok) {
      diagnostics.push({
        level: "healed",
        entity: ent.table,
        message: `侧边栏可见菜单名 "${rawMenuCandidate}" (${menuCheck.length} 字) 超过 <=4 字上限，已自动精简为 "${menuCheck.suggested}"`,
      })
      ent.menuTitle = menuCheck.suggested
    } else {
      ent.menuTitle = menuCheck.label
    }

    ent.fields = Array.isArray(ent.fields) ? ent.fields : []
    for (const f of ent.fields) {
      const rawWidget = String(f.widget || "text").trim().toLowerCase()
      if (!WIDGET_TO_COLUMN_TYPE[rawWidget]) {
        const mapped = WIDGET_SYNONYM_MAP[rawWidget] || "text"
        diagnostics.push({
          level: "healed",
          entity: ent.table,
          field: f.name,
          message: `字段 "${f.name}" 的控件 "${rawWidget}" 非标准名称，已自动自愈为 "${mapped}"`,
        })
        f.widget = mapped
      } else {
        f.widget = rawWidget
      }
    }

    if (ent.stateMachine && Array.isArray(ent.stateMachine.transitions)) {
      const statusField = ent.stateMachine.field || "status"
      const allStates = new Set([ent.stateMachine.initial || "DRAFT"])
      const labels = { ...(ent.stateMachine.labels || {}) }
      ent.stateMachine.transitions = ent.stateMachine.transitions.map((tr) => {
        const fromArr = Array.isArray(tr.from) ? tr.from.map(String) : tr.from ? [String(tr.from)] : []
        for (const s of fromArr) allStates.add(s)
        if (tr.to) {
          allStates.add(String(tr.to))
          if (tr.label && !labels[tr.to]) labels[tr.to] = tr.label
        }
        const actName = String(tr.name || tr.action || `to_${String(tr.to || "next").toLowerCase()}`)
        return {
          ...tr,
          name: actName,
          action: actName,
          from: fromArr,
          to: String(tr.to || ""),
          label: tr.label || actName,
        }
      })
      const existingField = ent.fields.find((f) => f.name === statusField)
      if (!existingField) {
        diagnostics.push({
          level: "healed",
          entity: ent.table,
          field: statusField,
          message: `实体 "${ent.table}" 声明了 stateMachine 但未定义 "${statusField}" 字段，已自动补齐状态列与枚举值 [${[...allStates].join(", ")}]`,
        })
        ent.fields.push({
          name: statusField,
          label: "状态",
          widget: "select",
          required: true,
          query: "EQ",
          options: [...allStates].map((val) => ({ label: labels[val] || val, value: val })),
          enumValues: [...allStates],
          enumLabels: labels,
        })
      } else {
        existingField.enumValues = [...allStates]
        existingField.enumLabels = labels
        existingField.options = [...allStates].map((val) => ({ label: labels[val] || val, value: val }))
      }
    }

    if (Array.isArray(ent.convertActions) && ent.convertActions.length > 0) {
      const toCamelField = (s) => String(s || "").replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
      const toPascalCase = (s) =>
        String(s || "")
          .split("_")
          .filter(Boolean)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("")
      ent.convertActions = ent.convertActions.map((ca) => {
        const actName = String(ca.name || ca.action || ca.target || "convert")
        const targetTbl = ca.targetTable || ca.target || ""
        const targetCls = ca.targetClassName || toPascalCase(targetTbl)
        const whenSt =
          ca.whenStatus || (Array.isArray(ca.fromStates) && ca.fromStates.length > 0 ? String(ca.fromStates[0]) : undefined)
        const fMap = ca.fieldMap
          ? { ...ca.fieldMap }
          : Object.fromEntries(
              Object.entries(ca.fieldMapping || {}).map(([srcKey, dstKey]) => [dstKey, srcKey])
            )
        return {
          ...ca,
          name: actName,
          action: actName,
          label: ca.label || actName,
          targetTable: targetTbl,
          targetClassName: targetCls,
          ...(whenSt ? { whenStatus: whenSt } : {}),
          fieldMap: fMap,
        }
      })
    }
  }

  return { healedSpec: healed, diagnostics }
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
  for (const rawEnt of domainSpec.entities) {
    if (rawEnt && rawEnt.menuTitle !== undefined) {
      const explicitCheck = validateMenuTitle(rawEnt.menuTitle)
      if (!explicitCheck.ok) {
        throw new Error(
          `[blueprint-engine] 实体 "${rawEnt.table || rawEnt.className || "unknown"}" 的显式菜单标题 menuTitle "${rawEnt.menuTitle}" 超过 <=4 字上限（实测 ${explicitCheck.length} 字；建议改为 "${explicitCheck.suggested}"）`
        )
      }
    }
  }
  const { healedSpec, diagnostics } = diagnoseAndHealBlueprint(domainSpec)
  const domain = String(healedSpec.domain).trim().toLowerCase()
  const exportName = `${domain.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_TABLES`

  const codegenTables = []
  const pageSchemas = {}
  const stateMachines = {}
  const convertActionsMap = {}

  for (const ent of healedSpec.entities) {
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
        widget,
      }
      if (f.query) col.queryType = f.query
      if (f.visibleOn) col.visibleOn = f.visibleOn
      if (f.requiredOn) col.requiredOn = f.requiredOn
      if (f.disabledOn) col.disabledOn = f.disabledOn
      if (Array.isArray(f.subFields) && f.subFields.length > 0) col.subFields = f.subFields
      if (Array.isArray(f.enumValues) && f.enumValues.length > 0) {
        col.enumValues = f.enumValues
        if (f.enumLabels) col.enumLabels = f.enumLabels
      } else if (Array.isArray(f.options) && f.options.length > 0) {
        col.enumValues = f.options.map((opt) => (typeof opt === "string" ? opt : opt.value))
        col.enumLabels = Object.fromEntries(
          f.options.map((opt) => (typeof opt === "string" ? [opt, opt] : [opt.value, opt.label || opt.value]))
        )
      }
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

    const advanced = {}
    if (ent.layoutMode) advanced.layoutMode = ent.layoutMode
    if (ent.stateMachine && Array.isArray(ent.stateMachine.transitions)) {
      advanced.stateMachine = {
        field: ent.stateMachine.field || "status",
        initial: ent.stateMachine.initial || "DRAFT",
        transitions: ent.stateMachine.transitions,
      }
    }
    if (Array.isArray(ent.convertActions) && ent.convertActions.length > 0) {
      advanced.convertActions = ent.convertActions
      convertActionsMap[tableName] = ent.convertActions
    }

    codegenTables.push({
      moduleName: domain,
      className,
      businessName: title,
      menuTitle: ent.menuTitle || compactMenuTitle(title),
      parentMenuId: `${domain}-dir`,
      permissionPrefix: `${domain}:${permEntity.replace(/_/g, "-")}`,
      ...(Object.keys(advanced).length > 0 ? { advanced } : {}),
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

  const basePath = resolveBlueprintBasePath(healedSpec)
  const runtimeEndpoints = {
    basePath,
    portalEntry: `${basePath}/2c`,
    adminEntry: `${basePath}/admin`,
    pluginApiPrefix: `${basePath}/api/v1/plugins/cooliebase.${domain}/api`,
    openApiDocs: `${basePath}/api/docs?domain=${domain}`,
    metricsEndpoint: `${basePath}/api/metrics`,
    sseEndpoint: `${basePath}/api/v1/realtime/sse`,
  }

  const tablesTsCode =
    `// 由 scripts/blueprint-engine.cjs compile-domain 自动从极简业务蓝图展开生成\n` +
    `import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"\n\n` +
    `export const ${exportName}: CodegenConfig[] = ${JSON.stringify(codegenTables, null, 2)}\n`

  const specName = `${domain}-blueprint`
  const specBriefRel = `docs/specs/${domain}/${specName}/brief.json`
  const e2eTestRel = `test/e2e/${domain}-blueprint.spec.ts`
  const integrationTestRel = `test/integration/${domain}-blueprint-e2e.test.ts`
  const domainTitle = String(healedSpec.title || healedSpec.variables?.PLATFORM_TITLE || `${domain.toUpperCase()} 业务系统`).trim()

  const specBrief = buildBlueprintSpecBrief({
    specName,
    specBriefRel,
    domain,
    domainTitle,
    basePath,
    runtimeEndpoints,
    codegenTables,
    stateMachines,
    convertActionsMap,
    e2eTestRel,
    integrationTestRel,
    tablesFileRel: `scripts/data/${domain}-tables.ts`,
  })

  const e2eTestCode = buildBlueprintE2eTestCode({
    domain,
    domainTitle,
    basePath,
    runtimeEndpoints,
    codegenTables,
    stateMachines,
    convertActionsMap,
  })

  const integrationTestCode = buildBlueprintIntegrationE2eTestCode({
    domain,
    domainTitle,
    basePath,
    runtimeEndpoints,
    codegenTables,
    stateMachines,
    convertActionsMap,
  })

  return {
    domain,
    basePath,
    runtimeEndpoints,
    exportName,
    tablesFileRel: `scripts/data/${domain}-tables.ts`,
    specName,
    specBriefRel,
    specBrief,
    e2eTestRel,
    e2eTestCode,
    integrationTestRel,
    integrationTestCode,
    codegenTables,
    tablesTsCode,
    pageSchemas,
    stateMachines,
    convertActions: convertActionsMap,
    diagnostics,
  }
}

function toResourceSegment(_domain, tableName) {
  return String(tableName || "entity").replace(/_/g, "-")
}

/**
 * 从极简蓝图自动推导 Spec-Kit SDD brief.json（可交由 speckit:build 展开 14 份 CMMI 工程资产）
 */
function buildBlueprintSpecBrief({
  specName,
  specBriefRel,
  domain,
  domainTitle,
  basePath,
  runtimeEndpoints,
  codegenTables,
  stateMachines,
  convertActionsMap,
  e2eTestRel,
  tablesFileRel,
}) {
  const stories = [
    ...codegenTables.map((t) => {
      const tableName = t.table?.name || t.tableName || "entity"
      const fnName = t.businessName || t.table?.comment || tableName
      const resourceName = toResourceSegment(domain, tableName)
      return {
        priority: "P0",
        text: `WHEN 运营或业务人员访问 ${runtimeEndpoints.adminEntry}/${domain}/${resourceName} 或调用 ${runtimeEndpoints.pluginApiPrefix}/${resourceName} 时，THE SYSTEM SHALL 提供《${fnName}》完整 CRUD、租户与数据权限隔离、状态机流转及联动校验能力。`,
      }
    }),
    {
      priority: "P0",
      text: `WHEN C 端用户或移动端客户端访问 ${runtimeEndpoints.portalEntry} 与 ${runtimeEndpoints.openApiDocs} 时，THE SYSTEM SHALL 自动对齐 basePath (${basePath || "/"}) 并提供统一的门户展示与 OpenAPI 3.1 实时沙盒契约。`,
    },
    {
      priority: "P1",
      text: `WHEN 业务单据触发状态机跃迁或跨单据下推转换时，THE SYSTEM SHALL 执行后端白名单状态守卫（非法跃迁返回 400/422 阻断）并支持一键映射生成下游关联单据。`,
    },
  ]
  const acceptance = [
    {
      check: `四端 basePath 路由可达性验证：C端门户 (${runtimeEndpoints.portalEntry})、B端后台 (${runtimeEndpoints.adminEntry})、插件API (${runtimeEndpoints.pluginApiPrefix})、OpenAPI 3.1 沙盒 (${runtimeEndpoints.openApiDocs}) 均返回预期响应`,
    },
    ...codegenTables.map((t) => {
      const tableName = t.table?.name || t.tableName || "entity"
      const fnName = t.businessName || t.table?.comment || tableName
      return {
        check: `《${fnName}》(${tableName}) 全生命周期 E2E 验证：未登录 401 拦截 -> 登录鉴权 -> POST 创建 -> GET 列表/详情 -> PUT 更新 -> 状态机合法跃迁与非法跃迁 400/422 阻断 -> DELETE 软删除`,
      }
    }),
    {
      check: `运行 \`pnpm exec playwright test ${e2eTestRel}\` exit=0（真实数据库驱动，零前端假 Mock）`,
    },
  ]
  return {
    name: specName,
    domain,
    title: `${domainTitle}全栈蓝图交付与四端 Spec E2E 验证规格`,
    type: "feature",
    goal: `基于声明式业务蓝图一键生成 ${domainTitle} (${domain}) 的数据库 DDL、Kysely 仓储、状态机与跨单据下推 Service、插件 API、B端/C端/移动端自适应页面、14 份 SDD 规格资产与端到端 Playwright E2E 验证套件。`,
    roles: [
      {
        role: "C 端门户与移动端用户",
        can: `通过 ${runtimeEndpoints.portalEntry} 与 Expo 移动端浏览 ${domainTitle} 门户及业务资源`,
      },
      {
        role: "B 端业务管理员",
        can: `通过 ${runtimeEndpoints.adminEntry} 管理 ${codegenTables.map((t) => t.businessName || t.table?.comment || t.table?.name).join("、")}，执行状态流转与跨单据下推`,
      },
    ],
    stories,
    constraints: [
      `多端 basePath 统一收敛为 "${basePath || "/"}"，前端与移动端统一经 toRuntimeApiPath 归一化至 ${runtimeEndpoints.pluginApiPrefix}。`,
      "100% 真实数据库驱动（SQLite / PostgreSQL），严禁任何硬编码假 Mock。",
      "所有状态跃迁必须经过后端状态机白名单守卫，非法跃迁必须返回 400/422 阻断并记录不可变审计日志。",
    ],
    acceptance,
    nonGoals: ["不侵入底座平台地基域（system/infra）核心代码"],
    architecture: `蓝图 DSL -> ${tablesFileRel} -> CodegenEngine 生成 packages/plugins/plugin-${domain} -> 挂载 ${runtimeEndpoints.pluginApiPrefix} -> ${e2eTestRel} 四端与状态机全链路 E2E 验证。`,
    entities: codegenTables.map((t) => ({
      table: t.table?.name || "entity",
      note: `${t.businessName || t.table?.comment || ""}\uff08含 tenant_id 多租户隔离、软删除与状态机守卫\uff09`,
    })),
    invariants: [
      {
        name: "四端 basePath 与插件路由契约一致性",
        how: `C端(${runtimeEndpoints.portalEntry})、B端(${runtimeEndpoints.adminEntry})、API(${runtimeEndpoints.pluginApiPrefix}) 与 Expo 客户端共享同一套 basePath 与路由归一化契约。`,
      },
      {
        name: "4态状态机合法跃迁与跨单据下推原子性",
        how: `状态机 (${Object.keys(stateMachines).join(", ") || "默认状态流"}) 仅允许白名单跃迁；跨单据下推 (${Object.keys(convertActionsMap).join(", ") || "无"}) 自动映射字段并写入真实数据库。`,
      },
    ],
    ui: codegenTables.map((t) => {
      const tableName = t.table?.name || "entity"
      const resourceName = toResourceSegment(domain, tableName)
      return `${runtimeEndpoints.adminEntry}/${domain}/${resourceName}：《${t.businessName || t.table?.comment || tableName}》管理页（布局模式：${t.advanced?.layoutMode || "table"}）`
    }),
    ops: [
      `运行 \`pnpm run speckit:check -- --spec ${specName}\` 检查 14 份 SDD 规格资产完整性`,
      `运行 \`pnpm exec playwright test ${e2eTestRel}\` 执行四端 basePath + 真实 CRUD + 状态机 + 跨单据下推完整 E2E 验证`,
    ],
    tasks: [
      {
        id: "T1",
        parent: "main",
        title: `编译 ${domainTitle} (${domain}) 表结构元数据与 SDD 14 份工程规格资产`,
        files: [tablesFileRel, specBriefRel],
        dod: `pnpm run speckit:check -- --spec ${specName} 通过`,
      },
      {
        id: "T2",
        parent: "T1",
        title: `生成 ${domainTitle} (${domain}) 全栈第一方插件代码（DDL/Repository/Service/状态机/跨单据下推/B端C端页面）`,
        files: [`packages/plugins/plugin-${domain}`],
        dod: `插件路由挂载至 ${runtimeEndpoints.pluginApiPrefix} 且通过静态门禁`,
      },
      {
        id: "T3",
        parent: "T2",
        title: `执行 ${domainTitle} (${domain}) 四端 basePath 与 6 阶段全功能 Playwright E2E 闭环验证`,
        files: [e2eTestRel],
        dod: `运行 ${e2eTestRel} 6 大阶段（四端路由、鉴权、CRUD+主子表、状态机正反向、跨单据下推、软删除）全部通过`,
      },
    ],
    dependencies: "T1 → T2 → T3",
    windowMinutes: 15,
  }
}

/**
 * 从极简蓝图自动生成完整的四端 basePath + CRUD + 状态机 + 跨单据下推 + 主子表 Playwright E2E 测试套件
 */
function buildBlueprintE2eTestCode({
  domain,
  domainTitle,
  basePath,
  runtimeEndpoints,
  codegenTables,
  stateMachines,
  convertActionsMap,
}) {
  const toCamelField = (s) => String(s || "").replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
  const entitySpecs = codegenTables.map((t) => {
    const tableName = t.table?.name || "entity"
    const functionName = t.businessName || t.table?.comment || tableName
    const resourceName = toResourceSegment(domain, tableName)
    const columns = Array.isArray(t.table?.columns) ? t.table.columns : []
    const sampleCreate = {}
    const sampleUpdate = {}
    for (const col of columns) {
      const colName = col.name || col.columnName
      if (
        col.isPk ||
        ["id", "tenant_id", "created_by", "created_at", "updated_by", "updated_at", "deleted_at", "creator", "updater"].includes(colName)
      ) {
        continue
      }
      const fieldKey = colName
      const comment = col.comment || colName
      if (col.widget === "sub_table" && Array.isArray(col.subFields) && col.subFields.length > 0) {
        const subRow = {}
        for (const sc of col.subFields) {
          subRow[sc.name] = sc.widget === "number" || sc.widget === "currency" ? 2 : `明细-${sc.label || sc.name}`
        }
        sampleCreate[fieldKey] = JSON.stringify([subRow])
        sampleUpdate[fieldKey] = JSON.stringify([subRow])
        continue
      }
      if (Array.isArray(col.enumValues) && col.enumValues.length > 0) {
        sampleCreate[fieldKey] = col.enumValues[0]
        sampleUpdate[fieldKey] = col.enumValues[Math.min(1, col.enumValues.length - 1)]
      } else if (col.tsType === "number") {
        sampleCreate[fieldKey] = 100
        sampleUpdate[fieldKey] = 200
      } else if (col.tsType === "boolean") {
        sampleCreate[fieldKey] = true
        sampleUpdate[fieldKey] = false
      } else {
        sampleCreate[fieldKey] = `E2E-${functionName}-${comment}`
        sampleUpdate[fieldKey] = `E2E-Updated-${functionName}-${comment}`
      }
    }
    return {
      tableName,
      resourceName,
      functionName,
      layoutMode: t.advanced?.layoutMode || "table",
      sampleCreate,
      sampleUpdate,
      stateMachine: t.advanced?.stateMachine || stateMachines[tableName] || null,
      convertActions: t.advanced?.convertActions || convertActionsMap[tableName] || [],
    }
  })

  return `// 由 scripts/blueprint-engine.cjs 自动生成的全栈 Spec E2E 验证套件（严禁假 Mock，100% 真实 API 与数据库驱动）
import { test, expect } from "@playwright/test"

const BASE_PATH = ${JSON.stringify(basePath)}
const ENDPOINTS = ${JSON.stringify(runtimeEndpoints, null, 2)}
const ENTITIES = ${JSON.stringify(entitySpecs, null, 2)}

const ADMIN_USER = process.env.ADMIN_BOOTSTRAP_USERNAME || "admin"
const ADMIN_PASS = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123"

test.describe("${domainTitle} (${domain}) 蓝图四端 basePath 与全栈业务能力 E2E 验证", () => {
  let token = ""
  const createdIdsByTable: Record<string, string | number> = {}

  test("1. 四端 basePath 路由与 OpenAPI 3.1 / Prometheus 契约探针可达性", async ({ request, page }) => {
    // 1.1 C端门户 (<basePath>/2c)
    const portalRes = await page.goto(ENDPOINTS.portalEntry)
    expect(portalRes?.status()).toBeLessThan(400)

    // 1.2 B端管理后台登录页 (<basePath>/admin/login)
    const adminLoginRes = await page.goto(\`\${ENDPOINTS.adminEntry}/login\`)
    expect(adminLoginRes?.status()).toBeLessThan(400)

    // 1.3 OpenAPI 3.1 实时沙盒 (<basePath>/api/docs?domain=${domain})
    const docsRes = await request.get(ENDPOINTS.openApiDocs)
    expect(docsRes.status()).toBe(200)
    const docsBody = await docsRes.json()
    expect(docsBody.openapi).toBe("3.1.0")
    expect(docsBody.servers?.[0]?.url).toBe(BASE_PATH || "/")

    // 1.4 Prometheus 监控指标 (<basePath>/api/metrics)
    const metricsRes = await request.get(ENDPOINTS.metricsEndpoint)
    expect(metricsRes.status()).toBe(200)
  })

  test("2. 鉴权守卫拦截（未登录 401）与真实管理员登录签发 Token", async ({ request }) => {
    for (const entity of ENTITIES) {
      const unauthRes = await request.get(\`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`)
      expect([401, 403]).toContain(unauthRes.status())
    }

    const authRes = await request.post(\`\${BASE_PATH}/api/v1/admin/system/auth\`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    })
    expect(authRes.status()).toBe(200)
    const authBody = await authRes.json()
    token = authBody?.data?.token || authBody?.token || ""
    expect(Boolean(token)).toBe(true)
  })

  test("3. 全实体真实数据库 CRUD 生命周期 + 主子表 (sub_table) 明细落库验证", async ({ request }) => {
    const headers = { Authorization: \`Bearer \${token}\` }
    for (const entity of ENTITIES) {
      const collectionUrl = \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`

      // 3.1 Create
      const createRes = await request.post(collectionUrl, { headers, data: entity.sampleCreate })
      expect([200, 201]).toContain(createRes.status())
      const createdBody = await createRes.json()
      const created = createdBody?.data || createdBody
      const recordId = created?.id
      expect(recordId).toBeDefined()
      createdIdsByTable[entity.tableName] = recordId

      // 3.2 List & Filter
      const listRes = await request.get(\`\${collectionUrl}?page=1&pageSize=10\`, { headers })
      expect(listRes.status()).toBe(200)
      const listBody = await listRes.json()
      const listItems = listBody?.data?.list || listBody?.data?.items || listBody?.data || []
      expect(Array.isArray(listItems)).toBe(true)
      expect(listItems.length).toBeGreaterThan(0)

      // 3.3 Update (PUT 携带 body.id)
      const updateRes = await request.put(collectionUrl, {
        headers,
        data: { id: String(recordId), ...entity.sampleUpdate },
      })
      expect(updateRes.status()).toBe(200)
    }
  })

  test("4. 4态状态机 (stateMachine) 合法流转与非法状态跃迁阻断 (400/422) 验证", async ({ request }) => {
    const headers = { Authorization: \`Bearer \${token}\` }
    for (const entity of ENTITIES) {
      if (!entity.stateMachine) continue
      const recordId = createdIdsByTable[entity.tableName]
      expect(recordId).toBeDefined()
      const transitionUrl = \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}/transition\`
      const transitions = entity.stateMachine.transitions || []

      // 4.1 正向依次执行合法状态跃迁 (如 DRAFT -> PENDING -> APPROVED)
      let currentState = entity.stateMachine.initial || "DRAFT"
      for (const step of transitions) {
        const fromList = Array.isArray(step.from) ? step.from : [step.from]
        if (fromList.includes(currentState) && step.to !== "REJECTED") {
          const validRes = await request.post(transitionUrl, {
            headers,
            data: { id: String(recordId), action: step.name || step.action },
          })
          expect(validRes.status()).toBe(200)
          currentState = step.to
        }
      }

      // 4.2 构造非法状态跃迁断言被后端状态机守卫拦截 (400/422/500)
      const illegalRes = await request.post(transitionUrl, {
        headers,
        data: { id: String(recordId), action: "__ILLEGAL_STATE_TRANSITION__" },
      })
      expect(illegalRes.status()).toBeGreaterThanOrEqual(400)
    }
  })

  test("5. 跨单据一键下推转换 (convertActions) 真实落库闭环验证", async ({ request }) => {
    const headers = { Authorization: \`Bearer \${token}\` }
    for (const entity of ENTITIES) {
      if (!entity.convertActions || entity.convertActions.length === 0) continue
      const recordId = createdIdsByTable[entity.tableName]
      expect(recordId).toBeDefined()
      const convertUrl = \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}/convert\`
      for (const act of entity.convertActions) {
        const targetAction = act.name || act.action || act.target || act.targetTable
        const convertRes = await request.post(convertUrl, {
          headers,
          data: { id: String(recordId), action: targetAction },
        })
        expect([200, 201]).toContain(convertRes.status())
      }
    }
  })

  test("6. 软删除 (DELETE) 与清理闭环验证", async ({ request }) => {
    const headers = { Authorization: \`Bearer \${token}\` }
    for (const entity of ENTITIES) {
      const recordId = createdIdsByTable[entity.tableName]
      if (!recordId) continue
      const delRes = await request.delete(
        \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}?id=\${encodeURIComponent(String(recordId))}\`,
        { headers },
      )
      expect([200, 204]).toContain(delRes.status())
    }
  })
})
`
}

/**
 * 生成可在无头沙盒/CI 下毫秒级跑通的 6 阶段全栈 Vitest E2E 验证套件（直调插件入口、OpenAPI 3.1、Prometheus 与真实仓储）
 */
function buildBlueprintIntegrationE2eTestCode({
  domain,
  domainTitle,
  basePath,
  runtimeEndpoints,
  codegenTables,
  stateMachines,
  convertActionsMap,
}) {
  const toCamelField = (s) => String(s || "").replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
  const entitySpecs = codegenTables.map((t) => {
    const tableName = t.table?.name || "entity"
    const functionName = t.businessName || t.table?.comment || tableName
    const resourceName = toResourceSegment(domain, tableName)
    const columns = Array.isArray(t.table?.columns) ? t.table.columns : []
    const sampleCreate = {}
    const sampleUpdate = {}
    for (const col of columns) {
      const colName = col.name || col.columnName
      if (
        col.isPk ||
        ["id", "tenant_id", "created_by", "created_at", "updated_by", "updated_at", "deleted_at", "creator", "updater"].includes(colName)
      ) {
        continue
      }
      const fieldKey = colName
      const comment = col.comment || colName
      if (col.widget === "sub_table" && Array.isArray(col.subFields) && col.subFields.length > 0) {
        const subRow = {}
        for (const sc of col.subFields) {
          subRow[sc.name] = sc.widget === "number" || sc.widget === "currency" ? 2 : `明细-${sc.label || sc.name}`
        }
        sampleCreate[fieldKey] = JSON.stringify([subRow])
        sampleUpdate[fieldKey] = JSON.stringify([subRow])
        continue
      }
      if (Array.isArray(col.enumValues) && col.enumValues.length > 0) {
        sampleCreate[fieldKey] = col.enumValues[0]
        sampleUpdate[fieldKey] = col.enumValues[Math.min(1, col.enumValues.length - 1)]
      } else if (col.tsType === "number") {
        sampleCreate[fieldKey] = 100
        sampleUpdate[fieldKey] = 200
      } else if (col.tsType === "boolean") {
        sampleCreate[fieldKey] = true
        sampleUpdate[fieldKey] = false
      } else {
        sampleCreate[fieldKey] = `E2E-${functionName}-${comment}`
        sampleUpdate[fieldKey] = `E2E-Updated-${functionName}-${comment}`
      }
    }
    return {
      tableName,
      resourceName,
      functionName,
      layoutMode: t.advanced?.layoutMode || "table",
      sampleCreate,
      sampleUpdate,
      stateMachine: t.advanced?.stateMachine || stateMachines[tableName] || null,
      convertActions: t.advanced?.convertActions || convertActionsMap[tableName] || [],
    }
  })

  return `// 由 scripts/blueprint-engine.cjs 自动生成的 6 阶段全栈 Spec E2E 验证套件（真实插件入口 + 真实仓储 + 零假 Mock）
import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import pluginEntry from "../../packages/plugins/plugin-${domain}/plugin-entry"
import { issueJwt } from "../../packages/shared/backend/auth/jwt"
import { getPlatformRole } from "../../packages/shared/backend/lib/biz-tenant"
import { withBasePath } from "../../packages/shared/frontend/lib/base-path"
import { apiPath, toRuntimeApiPath } from "../../packages/shared/frontend/lib/request"
import { buildOpenApi31Spec } from "../../src/app/api/docs/route"
import { GET as getMetricsRoute } from "../../src/app/api/metrics/route"

const BASE_PATH = ${JSON.stringify(basePath)}
const ENDPOINTS = ${JSON.stringify(runtimeEndpoints, null, 2)}
const ENTITIES = ${JSON.stringify(entitySpecs, null, 2)}

describe("${domainTitle} (${domain}) 蓝图四端 basePath 与 6 阶段全栈 Spec E2E 闭环验证", () => {
  const routes = (pluginEntry as unknown as { routes: Record<string, (input: any) => Promise<{ status: number; body: any }>> }).routes
  const { token } = issueJwt({
    sub: "e2e-admin-1",
    username: "admin",
    tenantId: "tenant-default",
    roles: [getPlatformRole()],
    permissions: ["*"],
    type: "admin",
  })
  const authHeaders = { authorization: \`Bearer \${token}\`, "content-type": "application/json" }
  const createdIdsByTable: Record<string, string> = {}

  it("Stage 1: 四端 basePath (2c / admin / api / expo) 路由归一化与 OpenAPI 3.1 / Prometheus 探针验证", async () => {
    const prevBase = process.env.BASE_PATH
    try {
      process.env.BASE_PATH = BASE_PATH
      expect(withBasePath("/2c")).toBe(ENDPOINTS.portalEntry)
      expect(withBasePath("/admin")).toBe(ENDPOINTS.adminEntry)
      for (const entity of ENTITIES) {
        expect(apiPath(toRuntimeApiPath(\`/api/v1/admin/${domain}/\${entity.resourceName}\`))).toBe(
          \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`,
        )
      }
      const openApi = buildOpenApi31Spec("${domain}")
      expect(openApi.openapi).toBe("3.1.0")
      expect(openApi.servers?.[0]?.url).toBe(BASE_PATH || "/")

      const metricsRes = await getMetricsRoute(new NextRequest(\`http://localhost:3200\${ENDPOINTS.metricsEndpoint}\`))
      expect(metricsRes.status).toBe(200)
    } finally {
      if (prevBase === undefined) delete process.env.BASE_PATH
      else process.env.BASE_PATH = prevBase
    }
  })

  it("Stage 2: 鉴权守卫拦截（未携带 Token 返回 401）", async () => {
    for (const entity of ENTITIES) {
      const handler = routes[\`admin:\${entity.resourceName}:get\`]
      expect(handler).toBeDefined()
      const unauthRes = await handler({
        method: "GET",
        path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`,
        headers: {},
        query: {},
      })
      expect([401, 403]).toContain(unauthRes.status)
    }
  })

  it("Stage 3: 全实体真实 CRUD 生命周期 + 主子表 (sub_table) 明细落库验证", async () => {
    for (const entity of ENTITIES) {
      const postHandler = routes[\`admin:\${entity.resourceName}:post\`]
      const getHandler = routes[\`admin:\${entity.resourceName}:get\`]
      const putHandler = routes[\`admin:\${entity.resourceName}:put\`]

      // 3.1 Create
      const createRes = await postHandler({
        method: "POST",
        path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`,
        headers: authHeaders,
        body: entity.sampleCreate,
      })
      expect([200, 201]).toContain(createRes.status)
      const recordId = String(createRes.body?.data?.id ?? createRes.body?.id ?? "")
      expect(Boolean(recordId)).toBe(true)
      createdIdsByTable[entity.tableName] = recordId

      // 3.2 Page List
      const listRes = await getHandler({
        method: "GET",
        path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`,
        headers: authHeaders,
        query: { page: "1", pageSize: "10" },
      })
      expect(listRes.status).toBe(200)
      const items = listRes.body?.data?.items || listRes.body?.data?.list || []
      expect(items.length).toBeGreaterThan(0)

      // 3.3 Update (若实体带状态机，保持初始状态供 Stage 4 验证正向流转)
      const updatePayload = entity.stateMachine
        ? { ...entity.sampleUpdate, [entity.stateMachine.field || "status"]: entity.stateMachine.initial || "DRAFT" }
        : entity.sampleUpdate
      const updateRes = await putHandler({
        method: "PUT",
        path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`,
        headers: authHeaders,
        body: { id: recordId, ...updatePayload },
      })
      expect(updateRes.status).toBe(200)
    }
  })

  it("Stage 4: 4态状态机 (stateMachine) 正向合法流转与非法状态跃迁阻断 (400) 验证", async () => {
    for (const entity of ENTITIES) {
      if (!entity.stateMachine) continue
      const recordId = createdIdsByTable[entity.tableName]
      const transitionHandler = routes[\`admin:\${entity.resourceName}/transition:post\`]
      expect(transitionHandler).toBeDefined()

      let currentState = entity.stateMachine.initial || "DRAFT"
      for (const step of entity.stateMachine.transitions || []) {
        const fromList = Array.isArray(step.from) ? step.from : [step.from]
        if (fromList.includes(currentState) && step.to !== "REJECTED") {
          const validRes = await transitionHandler({
            method: "POST",
            path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}/transition\`,
            headers: authHeaders,
            body: { id: recordId, action: step.name || step.action },
          })
          expect(validRes.status).toBe(200)
          currentState = step.to
        }
      }

      // 构造非法状态跃迁断言返回 400
      const illegalRes = await transitionHandler({
        method: "POST",
        path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}/transition\`,
        headers: authHeaders,
        body: { id: recordId, action: "__ILLEGAL_STATE_TRANSITION__" },
      })
      expect(illegalRes.status).toBe(400)
    }
  })

  it("Stage 5: 跨单据一键下推转换 (convertActions) 真实映射闭环验证", async () => {
    for (const entity of ENTITIES) {
      if (!entity.convertActions || entity.convertActions.length === 0) continue
      const recordId = createdIdsByTable[entity.tableName]
      const convertHandler = routes[\`admin:\${entity.resourceName}/convert:post\`]
      expect(convertHandler).toBeDefined()

      for (const act of entity.convertActions) {
        const targetAction = act.name || act.action
        const convertRes = await convertHandler({
          method: "POST",
          path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}/convert\`,
          headers: authHeaders,
          body: { id: recordId, action: targetAction },
        })
        expect(convertRes.status).toBe(200)
        expect(convertRes.body?.data?.sourceId).toBe(recordId)
        expect(convertRes.body?.data?.targetPayload).toBeDefined()
      }
    }
  })

  it("Stage 6: 软删除 (DELETE) 与清理闭环验证", async () => {
    for (const entity of ENTITIES) {
      const recordId = createdIdsByTable[entity.tableName]
      const delHandler = routes[\`admin:\${entity.resourceName}:delete\`]
      const delRes = await delHandler({
        method: "DELETE",
        path: \`\${ENDPOINTS.pluginApiPrefix}/\${entity.resourceName}\`,
        headers: authHeaders,
        query: { id: recordId },
      })
      expect(delRes.status).toBe(200)
    }
  })
})
`
}

/**
 * 解析当前蓝图或派生工程生效的 basePath（与 next.config.mjs 及 compat-manifest.json 严格一致）
 */
function resolveBlueprintBasePath(domainSpec, rootDir = ROOT) {
  const normalize = (raw) => {
    const trimmed = String(raw || "").trim()
    if (!trimmed || trimmed === "/") return ""
    return "/" + trimmed.replace(/^\/+/, "").replace(/\/+$/, "")
  }
  if (domainSpec && domainSpec.basePath !== undefined) {
    return normalize(domainSpec.basePath)
  }
  if (domainSpec?.variables?.PREVIEW_BASE_PATH !== undefined && domainSpec.variables.PREVIEW_BASE_PATH !== "") {
    return normalize(domainSpec.variables.PREVIEW_BASE_PATH)
  }
  if (
    domainSpec?.variables?.PROJECT_NAME &&
    String(domainSpec.variables.PROJECT_NAME).trim() !== "cooliebase" + "-all"
  ) {
    return normalize(domainSpec.variables.PROJECT_NAME)
  }
  if (process.env.BASE_PATH || process.env.PREVIEW_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH) {
    return normalize(process.env.BASE_PATH || process.env.PREVIEW_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH)
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"))
    const isMaster = process.env.COOLIE_MASTER_BASE === "true" || pkg.name === "cooliebase" + "-all"
    if (pkg.name && !isMaster) {
      return normalize(String(pkg.name).replace(/^@.*\//, ""))
    }
  } catch {
    /* package.json 缺失或解析失败时回退根路径 */
  }
  return ""
}

function resolveBlueprintFileArg(argv) {
  const fileIdx = argv.indexOf("--file")
  if (fileIdx >= 0 && argv[fileIdx + 1]) return argv[fileIdx + 1]
  const fromIdx = argv.indexOf("--from")
  if (fromIdx >= 0 && argv[fromIdx + 1]) return argv[fromIdx + 1]
  const positional = argv.slice(1).find((a) => !a.startsWith("-"))
  return positional || null
}

function runCompileDomain(argv) {
  const fileArg = resolveBlueprintFileArg(argv)
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
          basePath: compiled.basePath,
          runtimeEndpoints: compiled.runtimeEndpoints,
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

function runDoctor(argv) {
  const fileArg = resolveBlueprintFileArg(argv)
  if (!fileArg) {
    throw new Error("用法: node scripts/blueprint-engine.cjs doctor --file <domain-blueprint.json>")
  }
  const spec = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), fileArg), "utf8"))
  const { healedSpec, diagnostics } = diagnoseAndHealBlueprint(spec)
  const basePath = resolveBlueprintBasePath(healedSpec)
  console.log(JSON.stringify({ domain: healedSpec.domain, basePath, diagnostics, healedSpec }, null, 2))
}

function runDeliver(argv) {
  const fileArg = resolveBlueprintFileArg(argv)
  const dryRun = argv.includes("--dry-run")
  const verifyE2e = argv.includes("--verify-e2e")
  if (!fileArg) {
    throw new Error("用法: node scripts/blueprint-engine.cjs deliver --file <domain-blueprint.json> [--dry-run] [--verify-e2e]")
  }
  const spec = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), fileArg), "utf8"))
  const compiled = compileBlueprintDomain(spec)
  if (spec.variables) {
    runRender({
      cmd: "render",
      compact: false,
      dryRun,
      valuesFile: null,
      preset: spec.variables.INDUSTRY_PRESET || null,
      sets: spec.variables,
    })
  }
  if (!dryRun) {
    const absTables = path.join(ROOT, compiled.tablesFileRel)
    fs.mkdirSync(path.dirname(absTables), { recursive: true })
    fs.writeFileSync(absTables, compiled.tablesTsCode, "utf8")

    // 自动落盘 Spec-Kit SDD brief.json 并展开 14 份 CMMI 标准工程规格资产
    const absSpecBrief = path.join(ROOT, compiled.specBriefRel)
    fs.mkdirSync(path.dirname(absSpecBrief), { recursive: true })
    fs.writeFileSync(absSpecBrief, JSON.stringify(compiled.specBrief, null, 2) + "\n", "utf8")

    // 自动落盘四端 basePath + CRUD + 状态机 + 跨单据下推全栈 Playwright E2E 与 Vitest E2E 验证套件
    const absE2eTest = path.join(ROOT, compiled.e2eTestRel)
    fs.mkdirSync(path.dirname(absE2eTest), { recursive: true })
    fs.writeFileSync(absE2eTest, compiled.e2eTestCode, "utf8")

    const absIntTest = path.join(ROOT, compiled.integrationTestRel)
    fs.mkdirSync(path.dirname(absIntTest), { recursive: true })
    fs.writeFileSync(absIntTest, compiled.integrationTestCode, "utf8")

    const { execFileSync } = require("node:child_process")
    const localTsx = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx")
    const localVitest = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "vitest.cmd" : "vitest")
    const runTsx = (scriptArgs) => {
      if (fs.existsSync(localTsx)) {
        execFileSync(localTsx, scriptArgs, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" })
      } else {
        execFileSync("pnpm", ["exec", "tsx", ...scriptArgs], { cwd: ROOT, stdio: "inherit" })
      }
    }
    runTsx(["scripts/speckit.ts", "build", "--", "--name", compiled.specName])
    runTsx(["scripts/create-business-domain.ts", compiled.domain, "--force"])
    if (verifyE2e) {
      const vitestTargets = [compiled.integrationTestRel, `packages/plugins/plugin-${compiled.domain}`]
      if (fs.existsSync(localVitest)) {
        execFileSync(localVitest, ["run", ...vitestTargets], {
          cwd: ROOT,
          stdio: "inherit",
          shell: process.platform === "win32",
        })
      } else {
        execFileSync("pnpm", ["exec", "vitest", "run", ...vitestTargets], {
          cwd: ROOT,
          stdio: "inherit",
        })
      }
    }
  }
  console.log(
    `[blueprint-engine] ${dryRun ? "DELIVER DRY-RUN" : "DELIVERED"}: 域 "${compiled.domain}" (${compiled.codegenTables.length} 张表, 自愈诊断 ${compiled.diagnostics.length} 项, basePath="${compiled.basePath || "/"}")`
  )
  console.log(
    `  • B端后台: ${compiled.runtimeEndpoints.adminEntry}  · C端门户: ${compiled.runtimeEndpoints.portalEntry}  · 插件API: ${compiled.runtimeEndpoints.pluginApiPrefix}  · OpenAPI沙盒: ${compiled.runtimeEndpoints.openApiDocs}`
  )
  console.log(
    `  • SDD规格: ${compiled.specBriefRel} (14份工程资产)  · 全栈E2E套件: ${compiled.integrationTestRel} & ${compiled.e2eTestRel}`
  )
}

if (require.main === module) {
  const rawArgv = process.argv.slice(2)
  const opts = parseCliArgs(rawArgv)
  if (opts.cmd === "check") runCheck()
  else if (opts.cmd === "schema") runSchema(opts)
  else if (opts.cmd === "render") runRender(opts)
  else if (opts.cmd === "compile-domain") runCompileDomain(rawArgv)
  else if (opts.cmd === "doctor") runDoctor(rawArgv)
  else if (opts.cmd === "deliver") runDeliver(rawArgv)
  else {
    console.log("用法: node scripts/blueprint-engine.cjs [check | schema --compact | render --values <json> --preset <industry> --set K=V | compile-domain --file <spec.json> --write | doctor --file <spec.json> | deliver --file <spec.json> [--dry-run]]")
  }
}

module.exports = {
  loadManifest,
  buildDefaultMap,
  extractPlaceholdersFromText,
  renderTemplateText,
  resolveBlueprintBasePath,
  diagnoseAndHealBlueprint,
  compileBlueprintDomain,
  compactMenuTitle,
  validateMenuTitle,
  validateBlueprintMenuTitles,
}
