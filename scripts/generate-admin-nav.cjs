#!/usr/bin/env node
/**
 * `admin:nav` —— 由**生成的页面注册表**产出侧栏导航（475 页全可达）。
 *
 * ## 为什么
 *
 * 侧栏以前读上游菜单（1414 条）再用 `SIDEBAR_COMPONENT_ROUTES`（手写 66 条）
 * 判断"有没有落地页"，于是**只暴露了 9 个入口**，而 `admin-pages.json` 里
 * 声明了 475 个页面 —— 绝大多数功能在界面上**点不到**（直连 URL 却能开）。
 * 两份真理源（手写路由映射 vs 生成的页面注册表）必然漂移。
 *
 * 现在反过来：**页面注册表是唯一真源**，导航由它生成；
 * `SIDEBAR_COMPONENT_ROUTES` 只保留"上游菜单组件 → 路由"的别名用途。
 *
 * ## 真源
 *   1. `packages/shared/contract/admin-pages.json` —— 有哪些页面（slug / kind）
 *   2. `docs/agent/contracts.json`               —— 页面的中文标题（page.title / page.route）
 *   3. `packages/*\/*\/contract/module.manifest.json` —— 域显示名（displayName）
 *
 * ## 用法
 *   node scripts/generate-admin-nav.cjs --write
 *   node scripts/generate-admin-nav.cjs --check   # CI: 产物与现状是否一致
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const DECLARATION = path.join(ROOT, "packages", "shared", "contract", "admin-pages.json")
const CONTRACTS = path.join(ROOT, "docs", "agent", "contracts.json")
const MENU_SEED = path.join(ROOT, "prisma", "data", "menus.seed-data.ts")
const OUT = path.join(ROOT, "packages", "shared", "contract", "admin-nav.generated.ts")

/** 平台地基优先，其余按域 id 排序 —— 让侧栏顺序稳定、可解释。 */
const DOMAIN_PRIORITY = ["system", "infra"]
/** 没有 module.manifest.json 的"伪域"（页面前缀），补中文名。 */
const DOMAIN_TITLE_PATCH = { aigw: "AI 网关", mall: "商城中心", overview: "总览", scheme: "方案" }

function readJson(file) {
  if (!fs.existsSync(file)) {
    console.error(`[admin-nav] 缺文件 ${path.relative(ROOT, file)}`)
    process.exit(1)
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (error) {
    console.error(`[admin-nav] ${path.relative(ROOT, file)} 不是合法 JSON —— ${error.message}`)
    process.exit(1)
  }
}

/** 域 id → 显示名（读各域 module.manifest.json 的 displayName）。 */
function readDomainTitles() {
  const titles = {}
  for (const group of ["domains", "plugins"]) {
    const base = path.join(ROOT, "packages", group)
    if (!fs.existsSync(base)) continue
    for (const pkg of fs.readdirSync(base)) {
      const manifest = path.join(base, pkg, "contract", "module.manifest.json")
      if (!fs.existsSync(manifest)) continue
      try {
        const parsed = JSON.parse(fs.readFileSync(manifest, "utf8"))
        if (parsed.domain && parsed.displayName) titles[parsed.domain] = parsed.displayName
      } catch {
        // 单个域 manifest 坏掉不该让整份导航生成失败
      }
    }
  }
  return { ...titles, ...DOMAIN_TITLE_PATCH }
}

/** slug 末段的人类可读兜底（契约里没有该页面时用）。 */
function humanize(slug) {
  const last = slug.split("/").pop() ?? slug
  const domain = slug.split("/")[0]
  const stripped = last.startsWith(domain + "-") ? last.slice(domain.length + 1) : last
  return stripped.replace(/[-_]/g, " ").trim() || slug
}

/** 归一化：去分隔符 + 去尾部 /index + 小写。让 `system/dict-data` ↔ `system/dict/data/index` 能对上。 */
function normalizeKey(value) {
  return value.toLowerCase().replace(/\/index$/, "").replace(/[^a-z0-9]/g, "")
}

/**
 * 上游菜单的**中文名**表：归一化组件路径 → 名称。
 *
 * 页面注册表里有 100+ 页没有 agent 契约（因此没有 page.title），但它们大多在
 * 上游菜单目录里有对应条目（component = `<域>/<实体>/index`）。用菜单名补标签，
 * 比回退成英文 slug（`depts` / `area`）可读得多。
 */
function readMenuNames() {
  const map = new Map()
  if (!fs.existsSync(MENU_SEED)) return map
  const raw = fs.readFileSync(MENU_SEED, "utf8")
  const matched = raw.match(/INIT_MENUS\s*:[^=]*=\s*\[/)
  if (!matched || matched.index === undefined) return map
  // 注意：不能 `indexOf("[")` —— 会先命中类型注解里的 `SystemMenuRow[]`，
  // 结果切出个空数组（实测：菜单名全丢，标签全退回英文 slug）。
  const start = matched.index + matched[0].length - 1
  let depth = 0
  let end = -1
  for (let i = start; i < raw.length; i += 1) {
    if (raw[i] === "[") depth += 1
    else if (raw[i] === "]") {
      depth -= 1
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  if (end === -1) return map
  let menus
  try {
    menus = JSON.parse(raw.slice(start, end))
  } catch {
    return map
  }
  for (const menu of menus) {
    const component = menu?.component
    const name = menu?.name
    if (typeof component !== "string" || typeof name !== "string") continue
    const key = normalizeKey(component)
    if (key) map.set(key, name)
  }
  return map
}

/** 页面 slug → 上游菜单名。例: `system/depts` → `部门管理`；`system/dict-data` → `字典数据`。 */
function menuNameFor(slug, menuNames) {
  const key = normalizeKey(slug)
  const candidates = [key, key.replace(/s$/, ""), key.replace(/es$/, "")]
  for (const candidate of candidates) {
    const hit = menuNames.get(candidate)
    if (hit) return hit
  }
  return undefined
}

function buildNav() {
  const declaration = readJson(DECLARATION)
  // 动态路由（`infra/online-runtime/[code]`）不是"能点的功能"，进导航只会生出死条目。
  const pages = (declaration.pages ?? []).filter((page) => page.kind === "page" && page.slug && !page.slug.includes("["))
  if (pages.length === 0) {
    console.error("[admin-nav] admin-pages.json 里没有 kind=page 的页面 —— 空导航会让人点不到任何功能，拒绝")
    process.exit(1)
  }

  // page.route → 中文标题
  const titleByRoute = new Map()
  if (fs.existsSync(CONTRACTS)) {
    const contracts = readJson(CONTRACTS).contracts ?? []
    for (const item of contracts) {
      const route = item?.page?.route
      const title = item?.page?.title
      if (typeof route === "string" && typeof title === "string") titleByRoute.set(route, title)
    }
  }

  const domainTitles = readDomainTitles()
  const menuNames = readMenuNames()
  const groups = new Map()
  for (const page of pages) {
    const [domain] = page.slug.split("/")
    const href = `/admin/${page.slug}`
    const label = titleByRoute.get(href) ?? menuNameFor(page.slug, menuNames) ?? humanize(page.slug)
    if (!groups.has(domain)) groups.set(domain, [])
    groups.get(domain).push({ id: page.slug, href, label })
  }

  const rank = (domain) => {
    const index = DOMAIN_PRIORITY.indexOf(domain)
    return index === -1 ? DOMAIN_PRIORITY.length : index
  }
  return [...groups.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([domain, items]) => ({
      id: domain,
      title: domainTitles[domain] ?? domain,
      items: items.sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN")),
    }))
}

function render(nav) {
  const body = nav
    .map(
      (group) =>
        `  {\n    id: ${JSON.stringify(group.id)},\n    title: ${JSON.stringify(group.title)},\n    items: [\n` +
        group.items.map((item) => `      { id: ${JSON.stringify(item.id)}, href: ${JSON.stringify(item.href)}, label: ${JSON.stringify(item.label)} },`).join("\n") +
        `\n    ],\n  },`,
    )
    .join("\n")
  return `// 由 scripts/generate-admin-nav.cjs 生成，**勿手改**。
//
// 真源: packages/shared/contract/admin-pages.json（页面清单）
//      + docs/agent/contracts.json（页面中文标题）
//      + packages/*/*/contract/module.manifest.json（域显示名）
//
// 为什么生成而不是手写: 侧栏曾只暴露 9 个入口而声明了 ${nav.reduce((n, g) => n + g.items.length, 0)} 个页面 ——
// 手写映射与页面注册表必然漂移。页面注册表是唯一真源，导航由它派生。

export type AdminNavItem = { id: string; href: string; label: string }
export type AdminNavGroup = { id: string; title: string; items: AdminNavItem[] }

export const ADMIN_NAV: AdminNavGroup[] = [
${body}
]
`
}

function main() {
  const write = process.argv.includes("--write")
  const check = process.argv.includes("--check")
  const nav = buildNav()
  const next = render(nav)
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null

  if (write) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, next, "utf8")
    console.log(`[admin-nav] 已写入 ${path.relative(ROOT, OUT)}（${nav.length} 组 / ${nav.reduce((n, g) => n + g.items.length, 0)} 项）`)
    return 0
  }
  if (check) {
    if (current === next) {
      console.log(`[admin-nav] PASS: 侧栏导航与页面注册表一致（${nav.length} 组 / ${nav.reduce((n, g) => n + g.items.length, 0)} 项）`)
      return 0
    }
    console.error("[admin-nav] ✗ 侧栏导航与真源不一致 —— 跑 `pnpm run admin:nav` 重新生成")
    return 1
  }
  console.log(JSON.stringify(nav, null, 2).slice(0, 2000))
  return 0
}

process.exit(main())
