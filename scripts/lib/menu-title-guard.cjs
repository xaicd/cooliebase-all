/**
 * 侧边栏可见菜单标题 <=4 字守卫与冻结棘轮 (Menu Title <=4 Visible Chars Guard & Ratchet)
 * ============================================================================
 * 规范目标:
 *   1. 管理后台侧边栏所有新增/蓝图生成的可见导航菜单标题（一级分组 title 与二级条目 label）必须 <= 4 个可见字符（如「采购订单」「库位盘点」）。
 *   2. 历史批量导入源表遗留的 >4 字菜单标签冻结于 docs/architecture/artifacts/menu-title-length-baseline.json（只减不增棘轮）。
 *   3. 供 scripts/generate-admin-nav.cjs (--check / --write-baseline) 与 scripts/blueprint-engine.cjs 共用同一真源。
 */
"use strict"

const fs = require("node:fs")
const path = require("node:path")

const MAX_VISIBLE_MENU_CHARS = 4
const DEFAULT_BASELINE_REL = "docs/architecture/artifacts/menu-title-length-baseline.json"

/**
 * 按 Unicode 码点统计去除首尾空白后的可见字符数（中文汉字、ASCII 字母、数字各计 1 字符）。
 */
function visibleCharCount(label) {
  const clean = String(label || "").trim()
  if (!clean) return 0
  return Array.from(clean).length
}

/**
 * 将冗长业务实体名称智能精简为 <=4 字的侧边栏可见菜单名。
 * 例如:
 *   "请假审批单" -> "请假审批"
 *   "电子图书管理" -> "电子图书"
 *   "紧急采购物料明细记录表" -> "紧急采购"
 */
function compactMenuTitle(rawTitle, maxChars = MAX_VISIBLE_MENU_CHARS) {
  let text = String(rawTitle || "").trim()
  if (!text) return "业务项"
  if (visibleCharCount(text) <= maxChars) return text

  // 第一轮：剥离常见冗余尾缀
  const suffixes = [
    "管理中心",
    "配置中心",
    "数据列表",
    "信息管理",
    "档案管理",
    "记录表",
    "关联表",
    "明细表",
    "管理",
    "列表",
    "中心",
  ]
  for (const suffix of suffixes) {
    if (text.endsWith(suffix) && visibleCharCount(text) - visibleCharCount(suffix) >= 2) {
      text = text.slice(0, text.length - suffix.length).trim()
      if (visibleCharCount(text) <= maxChars) return text
    }
  }

  // 若末尾是单个「单 / 表 / 项」且剥离后恰好 <= maxChars 且 >= 2 字（如「请假审批单」->「请假审批」）
  if (/[单表项]$/.test(text)) {
    const trimmed = text.slice(0, -1).trim()
    if (visibleCharCount(trimmed) >= 2 && visibleCharCount(trimmed) <= maxChars) {
      return trimmed
    }
  }

  return Array.from(text).slice(0, maxChars).join("")
}

/**
 * 单条可见菜单标题校验。
 */
function validateMenuTitle(label, opts = {}) {
  const maxChars = Number.isInteger(opts.maxChars) ? opts.maxChars : MAX_VISIBLE_MENU_CHARS
  const trimmed = String(label || "").trim()
  const length = visibleCharCount(trimmed)
  if (!trimmed) {
    return {
      ok: false,
      label: trimmed,
      length: 0,
      maxChars,
      suggested: "业务项",
      reason: "菜单标题不能为空",
    }
  }
  if (length > maxChars) {
    return {
      ok: false,
      label: trimmed,
      length,
      maxChars,
      suggested: compactMenuTitle(trimmed, maxChars),
      reason: `可见菜单标题 "${trimmed}" 为 ${length} 字，超过 <=${maxChars} 字上限`,
    }
  }
  return {
    ok: true,
    label: trimmed,
    length,
    maxChars,
    suggested: trimmed,
  }
}

/**
 * 收集 ADMIN_NAV 树中全部超过上限的菜单键（键同时包含路径与文本，改出新的超长名同样会被拦截）。
 */
function collectOverlongNavEntries(navGroups, maxChars = MAX_VISIBLE_MENU_CHARS) {
  const overlong = []
  for (const group of navGroups || []) {
    const groupCheck = validateMenuTitle(group.title, { maxChars })
    if (!groupCheck.ok) {
      overlong.push({
        kind: "group",
        key: `group:${group.id} -> ${groupCheck.label}`,
        id: group.id,
        href: `/admin/${group.id}`,
        label: groupCheck.label,
        length: groupCheck.length,
        suggested: groupCheck.suggested,
      })
    }
    for (const item of group.items || []) {
      const itemCheck = validateMenuTitle(item.label, { maxChars })
      if (!itemCheck.ok) {
        overlong.push({
          kind: "item",
          key: `item:${item.id} (${item.href}) -> ${itemCheck.label}`,
          id: item.id,
          href: item.href,
          label: itemCheck.label,
          length: itemCheck.length,
          suggested: itemCheck.suggested,
        })
      }
    }
  }
  return overlong.sort((a, b) => a.key.localeCompare(b.key))
}

/**
 * 对 ADMIN_NAV 执行 <=4 字棘轮校验或写入冻结基线。
 */
function checkNavMenuLengths(navGroups, opts = {}) {
  const rootDir = opts.rootDir || path.resolve(__dirname, "../..")
  const baselineRel = opts.baselineRel || DEFAULT_BASELINE_REL
  const baselineAbs = opts.baselinePath || path.join(rootDir, baselineRel)
  const maxChars = Number.isInteger(opts.maxChars) ? opts.maxChars : MAX_VISIBLE_MENU_CHARS
  const writeBaseline = Boolean(opts.writeBaseline)

  const overlong = collectOverlongNavEntries(navGroups, maxChars)
  const keys = overlong.map((entry) => entry.key)

  if (writeBaseline) {
    fs.mkdirSync(path.dirname(baselineAbs), { recursive: true })
    const payload = {
      note: "历史导入源表存量 >4 字侧边栏菜单冻结棘轮基线。只减不增，一切新增菜单与蓝图实体必须 <=4 字。",
      tier: "ratchet",
      maxVisibleChars: maxChars,
      count: keys.length,
      entries: keys,
    }
    fs.writeFileSync(baselineAbs, JSON.stringify(payload, null, 2) + "\n", "utf8")
    return {
      ok: true,
      wroteBaseline: true,
      baselinePath: baselineAbs,
      frozenCount: keys.length,
      currentCount: keys.length,
      violations: [],
      fixedCount: 0,
    }
  }

  if (!fs.existsSync(baselineAbs)) {
    return {
      ok: false,
      wroteBaseline: false,
      baselinePath: baselineAbs,
      frozenCount: 0,
      currentCount: keys.length,
      violations: overlong,
      fixedCount: 0,
      missingBaseline: true,
    }
  }

  let parsed = { entries: [] }
  try {
    parsed = JSON.parse(fs.readFileSync(baselineAbs, "utf8"))
  } catch (err) {
    return {
      ok: false,
      wroteBaseline: false,
      baselinePath: baselineAbs,
      frozenCount: 0,
      currentCount: keys.length,
      violations: overlong,
      fixedCount: 0,
      parseError: err.message,
    }
  }

  const frozenSet = new Set(Array.isArray(parsed.entries) ? parsed.entries : [])
  const violations = overlong.filter((entry) => !frozenSet.has(entry.key))
  const curSet = new Set(keys)
  const fixedCount = [...frozenSet].filter((k) => !curSet.has(k)).length

  return {
    ok: violations.length === 0,
    wroteBaseline: false,
    baselinePath: baselineAbs,
    frozenCount: frozenSet.size,
    currentCount: keys.length,
    violations,
    fixedCount,
  }
}

/**
 * 校验蓝图实体列表中的显式或派生可见菜单标题是否全部 <=4 字。
 */
function validateBlueprintMenuTitles(domainSpec, opts = {}) {
  const maxChars = Number.isInteger(opts.maxChars) ? opts.maxChars : MAX_VISIBLE_MENU_CHARS
  const entities = Array.isArray(domainSpec?.entities) ? domainSpec.entities : []
  const violations = []
  for (const ent of entities) {
    const candidate = ent.menuTitle !== undefined ? ent.menuTitle : ent.title || ent.className || ent.table
    const res = validateMenuTitle(candidate, { maxChars })
    if (!res.ok) {
      violations.push({
        entity: ent.table || ent.className || "unknown",
        ...res,
      })
    }
  }
  return {
    ok: violations.length === 0,
    maxChars,
    violations,
  }
}

module.exports = {
  MAX_VISIBLE_MENU_CHARS,
  DEFAULT_BASELINE_REL,
  visibleCharCount,
  compactMenuTitle,
  validateMenuTitle,
  collectOverlongNavEntries,
  checkNavMenuLengths,
  validateBlueprintMenuTitles,
}
