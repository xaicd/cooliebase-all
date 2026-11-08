#!/usr/bin/env node
/**
 * 把 admin 页面从「每个路由一个硬编码薄壳」收成**一个派发器 + 一份生成的映射**。
 *
 * 为什么（与插件 API 挂载保持一致）:
 *   API 侧早就收编了 —— 整个插件接口面只有 `plugins/[pluginKey]/api/[...path]/route.ts`
 *   两个文件。页面侧却留着 476 个 `page.tsx`，其中 **475 个 ≤12 行**、**0 个含真实逻辑**
 *   （实测统计），全是 `import { X } from "@/modules/<域>/frontend/pages/<页>"` 的一行壳。
 *   页面实现本来就在各域包里，薄壳只是**没有收编的框架适配**。
 *
 * 为什么映射表必须**生成**而不是拼字符串 import:
 *   本仓踩过 —— "把路径拼成模板串再 import，Turbopack 也无法静态追踪"
 *   （见 first-party-entries.ts 的注释）。所以每个页面的 import 必须是**字面量**。
 *
 * 用法:
 *   node scripts/generate-admin-pages.cjs --dry-run   # 只打印解析结果
 *   node scripts/generate-admin-pages.cjs --write
 *   node scripts/generate-admin-pages.cjs --check     # CI: 产物是否与现状一致
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const ADMIN_PAGES = path.join(ROOT, "src", "app", "(admin-pages)", "admin")
const DISPATCHER_DIR = path.join(ADMIN_PAGES, "[...slug]")
const DISPATCHER = path.join(DISPATCHER_DIR, "page.tsx")
const REGISTRY_DIR = path.join(ADMIN_PAGES, "_generated")
const REGISTRY = path.join(REGISTRY_DIR, "admin-page-registry.ts")

/**
 * **真源是声明，不是文件系统。**
 *
 * 第一版从被它自己删掉的薄壳里推导 —— 于是第二次跑就只剩 1 条映射，
 * 476 个页面全丢（实测踩到，且 check/build 都还是绿的）。
 * 改成读 `packages/shared/contract/admin-pages.json`（提交进仓库的声明）:
 * 声明 → 生成派发器 + 映射表 → 删薄壳。删完还能重新生成，因为真源在别处。
 */
const DECLARATION = path.join(ROOT, "packages", "shared", "contract", "admin-pages.json")
if (!fs.existsSync(DECLARATION)) {
  console.error(`[admin-pages] 缺声明 ${path.relative(ROOT, DECLARATION)}`)
  process.exit(1)
}
let declaration
try {
  declaration = JSON.parse(fs.readFileSync(DECLARATION, "utf8"))
} catch (error) {
  console.error(`[admin-pages] 声明不是合法 JSON —— ${error.message}`)
  process.exit(1)
}

/**
 * 自动发现新业务域的管理端落地页。
 * 针对新孵化/新建的业务域（如 meeting, booking），自动将其 `*-list.page.tsx`
 * （或单页面 `*.page.tsx`）收编进 admin-pages.json，确保侧栏与派发器立即可达。
 */
function discoverBusinessDomainPages(existingPages) {
  const existingModules = new Set(existingPages.map((p) => p.module).filter(Boolean));
  const existingSlugs = new Set(existingPages.map((p) => p.slug).filter(Boolean));
  const BUILTIN_DOMAINS = new Set(["system", "infra", "ai", "aigw", "bpm", "crm", "erp", "im", "iot", "mall", "member", "mes", "mp", "overview", "pay", "report", "scheme", "wms", "flipshop"]);
  const discovered = [];

  const scanDir = (dir, domain) => {
    if (BUILTIN_DOMAINS.has(domain)) return;
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".page.tsx") && !f.startsWith("_"));
    const listPages = files.filter((f) => f.endsWith("-list.page.tsx"));
    const targetFiles = listPages.length > 0 ? listPages : files;

    for (const f of targetFiles) {
      if (f === "login.page.tsx") continue;
      const baseName = f.replace(/\.page\.tsx$/, "");
      const mod = `@/modules/${domain}/frontend/pages/${baseName}.page`;
      if (existingModules.has(mod)) continue;

      const fullPath = path.join(dir, f);
      const fileContent = fs.readFileSync(fullPath, "utf8");
      let exportName = "default";
      if (fileContent.includes("export default")) {
        exportName = "default";
      } else {
        const match =
          fileContent.match(/export\s+(?:function|const)\s+([A-Za-z0-9_]+Page)/) ||
          fileContent.match(/export\s+(?:function|const)\s+([A-Z][A-Za-z0-9_]+)/);
        if (match) exportName = match[1];
      }

      let entityName = baseName.endsWith("-list") ? baseName.replace(/-list$/, "") : baseName;
      let slug = `${domain}/${entityName}`;
      if (existingSlugs.has(slug)) slug = `${domain}/${baseName}`;

      discovered.push({
        slug,
        kind: "page",
        exportName,
        module: mod,
      });
      existingModules.add(mod);
      existingSlugs.add(slug);
    }
  };

  const domainsDir = path.join(ROOT, "packages", "domains");
  if (fs.existsSync(domainsDir)) {
    for (const d of fs.readdirSync(domainsDir)) {
      if (d.startsWith(".")) continue;
      scanDir(path.join(domainsDir, d, "frontend", "pages"), d);
    }
  }
  const pluginsDir = path.join(ROOT, "packages", "plugins");
  if (fs.existsSync(pluginsDir)) {
    for (const p of fs.readdirSync(pluginsDir)) {
      if (p.startsWith("plugin-")) {
        const d = p.replace(/^plugin-/, "");
        scanDir(path.join(pluginsDir, p, "frontend", "pages"), d);
      }
    }
  }

  return discovered;
}

const discoveredPages = discoverBusinessDomainPages(declaration.pages ?? []);
if (discoveredPages.length > 0) {
  declaration.pages = [...(declaration.pages ?? []), ...discoveredPages];
  if (process.argv.includes("--write")) {
    fs.writeFileSync(DECLARATION, JSON.stringify(declaration, null, 2) + "\n");
    console.log(`[admin-pages] 自动收编 ${discoveredPages.length} 个新业务域落地页: ${discoveredPages.map((p) => p.slug).join(", ")}`);
  }
}
const pages = (declaration.pages ?? []).map((row) => ({ ...row }))
if (pages.length === 0) {
  console.error("[admin-pages] 声明里没有页面 —— 空声明会生成空映射，拒绝")
  process.exit(1)
}
const unknown = pages.filter((page) => page.kind === "unknown")
const duplicates = pages.map((page) => page.slug).filter((slug, index, all) => all.indexOf(slug) !== index)
if (duplicates.length > 0) {
  console.error(`[admin-pages] 声明里有重复 slug: ${[...new Set(duplicates)].join(", ")}`)
  process.exit(1)
}

// ---- 生成映射表: 每条 import 都是字面量（Turbopack 才追得到）----
const entries = pages
  .filter((page) => page.kind === "page")
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .map((page) => {
    const load =
      page.exportName === "default"
        ? `() => import("${page.module}").then((m) => m.default)`
        : `() => import("${page.module}").then((m) => m.${page.exportName})`
    return `  ${JSON.stringify(page.slug)}: { kind: "page", load: ${load} },`
  })
  .join("\n")

const redirectEntries = pages
  .filter((page) => page.kind === "redirect")
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .map((page) => `  ${JSON.stringify(page.slug)}: { kind: "redirect", target: ${JSON.stringify(page.target)} },`)
  .join("\n")

const canvasEntries = pages
  .filter((page) => page.kind === "canvas")
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .map((page) => `  ${JSON.stringify(page.slug)}: { kind: "canvas", entity: ${JSON.stringify(page.entity)}, domain: ${JSON.stringify(page.domain)} },`)
  .join("\n")

const registrySource = `// Auto-generated by Codegen Engine (admin page registry) —— 不要手改
// 由 scripts/generate-admin-pages.cjs 生成。${pages.length} 个 admin 路由收成一张表。
//
// 每条 import 都是**字面量**: Turbopack 无法静态追踪模板串拼出来的 import
// （本仓在 first-party-entries.ts 上踩过）。所以这里必须生成，不能运行时拼。

export type AdminPageEntry =
  | { kind: "page"; load: () => Promise<unknown> }
  | { kind: "redirect"; target: string }
  | { kind: "canvas"; entity: string; domain?: string }

export const ADMIN_PAGE_REGISTRY: Record<string, AdminPageEntry> = {
${entries}
${redirectEntries}
${canvasEntries ? canvasEntries + "\n" : ""}
}
`

const dispatcherSource = `// Auto-generated by Codegen Engine (admin page dispatcher) —— 不要手改
import type React from "react"

import { redirect } from "next/navigation"

import { ADMIN_PAGE_REGISTRY } from "../_generated/admin-page-registry"
import { UniversalSchemaCanvas } from "@/shared/frontend/components/universal-schema-canvas"
import { GENERATED_PAGE_SCHEMAS } from "@/shared/contract/page-schemas.generated"

/**
 * **必须显式声明已知路由，并关掉"未知参数也匹配"。**
 *
 * 只靠页面里调 notFound() 是不够的: 这是个 async 页面、上层又是客户端 layout，
 * 流式渲染一旦开始状态码就定了 —— 实测结果就是**未知路径返回 200**（改前是 404，
 * 用 git stash 对比确认是我的重构引入的）。
 * 用 generateStaticParams + dynamicParams=false 让**路由层**就拒绝未知 slug。
 */
export const dynamicParams = false

export function generateStaticParams() {
  const standardSlugs = Object.keys(ADMIN_PAGE_REGISTRY).map((slug) => ({ slug: slug.split("/") }))
  const canvasSlugs = Object.keys(GENERATED_PAGE_SCHEMAS).map((entity) => ({ slug: ["canvas", entity] }))
  return [...standardSlugs, ...canvasSlugs]
}

/**
 * admin 页面的**唯一派发器**。
 *
 * 与插件 API 挂载同构: 接口面是 \`plugins/[pluginKey]/api/[...path]/route.ts\` 两个文件，
 * 页面面就是这一个文件 + 一张生成的映射表（而不是 476 个硬编码薄壳）。
 * 页面实现仍在各域包里（\`@/modules/<域>/frontend/pages/*\`），这里只负责按 slug 找到它。
 */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>
  searchParams?: Promise<{ mode?: string }>
}) {
  const { slug } = await params
  const { mode } = (await searchParams) ?? {}
  const key = slug.join("/")

  // 1. 动态本体画布路由: /admin/canvas/[entity]
  if (slug[0] === "canvas" && slug.length >= 2) {
    const entity = slug[1]
    const domain = slug.length >= 3 ? slug[2] : undefined
    return <UniversalSchemaCanvas entity={entity} domain={domain} />
  }

  const entry = ADMIN_PAGE_REGISTRY[key]
  // 走到这里 key 一定在表里（unknown slug 在路由层就被 dynamicParams=false 挡掉）；
  // 保底一句，避免表被改坏时静默渲染空页。
  if (!entry) redirect("/admin")
  if (entry.kind === "redirect") redirect(entry.target)

  if (entry.kind === "canvas") {
    return <UniversalSchemaCanvas entity={entry.entity} domain={entry.domain} />
  }

  // 2. 支持查询参数 ?mode=canvas 无缝切换至通用本体画布
  if (mode === "canvas") {
    const possibleEntity = slug[slug.length - 1].replace(/-/g, "_")
    return <UniversalSchemaCanvas entity={possibleEntity} domain={slug[0]} />
  }

  const Component = (await entry.load()) as React.ComponentType
  // **必须当 JSX 渲染，不能当函数调用**: 业务页面多是客户端组件（"use client"），
  // 从服务端调用会报 "Attempted to call X() from the server but X is on the client"。
  // 写这一版时踩到，构建期预渲染 476 个页面时炸出来。
  return <Component />
}
`

if (process.argv.includes("--check")) {
  const problems = []
  if (!fs.existsSync(DISPATCHER)) problems.push("缺派发器 src/app/(admin-pages)/admin/[...slug]/page.tsx")
  else if (fs.readFileSync(DISPATCHER, "utf8") !== dispatcherSource) problems.push("派发器内容与生成器不一致")
  if (!fs.existsSync(REGISTRY)) problems.push("缺映射表 _generated/admin-page-registry.ts")
  else if (fs.readFileSync(REGISTRY, "utf8") !== registrySource) problems.push("映射表与现状不一致（新增/删除页面后请重跑生成器）")
  if (problems.length > 0) {
    for (const problem of problems) console.error(`   ✗ ${problem}`)
    process.exit(1)
  }
  const missingHandwritten = unknown.filter((page) => !fs.existsSync(path.join(ADMIN_PAGES, `${page.slug}/page.tsx`)))
  if (missingHandwritten.length > 0) {
    for (const page of missingHandwritten) console.error(`   ✗ 手写页面被误删: ${page.file}`)
    process.exit(1)
  }
  // 也要拦"又冒出硬编码薄壳": 声明里已列出的 slug 不该再有实体文件
  const strays = pages
    .filter((page) => page.kind !== "unknown")
    .filter((page) => fs.existsSync(path.join(ADMIN_PAGES, `${page.slug}/page.tsx`)))
    .map((page) => `src/app/(admin-pages)/admin/${page.slug}/page.tsx`)
  if (strays.length > 0) {
    console.error(`   ✗ 出现硬编码薄壳（应改为登记进 packages/shared/contract/admin-pages.json）:`)
    for (const stray of strays.slice(0, 5)) console.error(`      ${stray}`)
    process.exit(1)
  }
  console.log(`[admin-pages] PASS: 派发器 + ${pages.length} 条映射一致，无硬编码薄壳，${unknown.length} 个手写页面在位`)
  process.exit(0)
}

// ---- --write: 落盘派发器与映射表，并删除已收编的薄壳 ----
fs.mkdirSync(DISPATCHER_DIR, { recursive: true })
fs.mkdirSync(REGISTRY_DIR, { recursive: true })
fs.writeFileSync(DISPATCHER, dispatcherSource)
fs.writeFileSync(REGISTRY, registrySource)

// **只删真正被收编的**（page / redirect）—— 手写页面（unknown）必须保留。
// 写这一版时踩到: 删除循环遍历了全部 pages，把唯一那个手写页面也删了。
let removed = 0
for (const page of pages) {
  if (page.kind === "unknown") continue
  const file = path.join(ADMIN_PAGES, `${page.slug}/page.tsx`)
  if (fs.existsSync(file)) { fs.rmSync(file); removed += 1 }
}
// 清理因此变空的目录
const prune = (dir) => {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { prune(path.join(dir, entry.name)) }
  }
  if (dir !== ADMIN_PAGES && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
}
prune(ADMIN_PAGES)

console.log(`[admin-pages] 已生成派发器 + ${pages.length} 条映射，删除薄壳 ${removed} 个`)
