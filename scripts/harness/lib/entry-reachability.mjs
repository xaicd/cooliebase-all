#!/usr/bin/env node
/**
 * 触达闭环维度 1「入口可发现」审计器 (对齐 wenlv-next WEN-502 Gate 5)
 * ============================================================================
 * 背景教训: Spec 交付了 B 端管理后台页面，却未登记到页面清单 / 侧栏菜单，
 *          导致 Gate 0-4 只审 Markdown 文件存在性而放过了「有页面无菜单」的断头路。
 *
 * 判定（针对活跃 Spec 域及已交付的新业务插件/域落地页）：
 *   1. 扫描该 Spec 所属域在 `packages/plugins/plugin-<domain>/frontend/pages/*.page.tsx`
 *      与 `packages/domains/<domain>/frontend/pages/*.page.tsx` 已落盘的管理端页面；
 *   2. 校验对应 slug (`<domain>/<entity>`) 是否已在 `packages/shared/contract/admin-pages.json` 登记；
 *   3. 校验对应路由 (`/admin/<domain>/<entity>`) 是否已在 `packages/shared/contract/admin-nav.generated.ts`
 *      的 `ADMIN_NAV` 侧栏导航中真实可达；
 *   4. 若 Spec 的 `tasks.md` 声明了触达闭环/入口可发现义务，校验任务清单是否覆盖菜单/导航生成。
 *
 * 结论分三类（具名输出，禁止只报笼统失败）：
 *   DEAD-END         页面已落盘但运行期侧栏菜单 `admin-nav.generated.ts` 无对应 href ⇒ 无条件阻断 (block)
 *   ENTRY-UNRESOLVED 已在 `admin-pages.json` 声明但 `admin-nav.generated.ts` 解析不到路由 ⇒ 阻断 (block)
 *   SPEC-GAP         运行期已登记，但活跃 Spec 的 `tasks.md` 未显式覆盖菜单/导航登记（advisory）
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(HERE, "..", "..", "..")

const ADMIN_PAGES_JSON = "packages/shared/contract/admin-pages.json"
const ADMIN_NAV_TS = "packages/shared/contract/admin-nav.generated.ts"
const BUILTIN_EXEMPT_DOMAINS = new Set(["infra", "system", "governance", "archive"])

function readJsonSafe(absPath) {
  if (!fs.existsSync(absPath)) return null
  try {
    return JSON.parse(fs.readFileSync(absPath, "utf8"))
  } catch {
    return null
  }
}

export function extractAdminNavHrefs(content) {
  const hrefs = new Set()
  const re = /href\s*:\s*["'`]([^"'`]+)["'`]/g
  let m
  while ((m = re.exec(content)) !== null) hrefs.add(m[1])
  return hrefs
}

function discoverDomainDeliveredPages(rootDir, domain) {
  const pages = []
  const candidates = [
    path.join(rootDir, "packages", "plugins", `plugin-${domain}`, "frontend", "pages"),
    path.join(rootDir, "packages", "domains", domain, "frontend", "pages"),
  ]
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".page.tsx") && !f.startsWith("_"))
    const listPages = files.filter((f) => f.endsWith("-list.page.tsx"))
    const targetFiles = listPages.length > 0 ? listPages : files
    for (const f of targetFiles) {
      if (f === "login.page.tsx") continue
      const baseName = f.replace(/\.page\.tsx$/, "")
      const entityName = baseName.endsWith("-list") ? baseName.replace(/-list$/, "") : baseName
      pages.push({
        file: path.relative(rootDir, path.join(dir, f)).replace(/\\/g, "/"),
        slug: `${domain}/${entityName}`,
        altSlug: `${domain}/${baseName}`,
        route: `/admin/${domain}/${entityName}`,
        altRoute: `/admin/${domain}/${baseName}`,
      })
    }
  }
  return pages
}

export function auditEntryReachability({ rootDir = REPO_ROOT, specFilter = null } = {}) {
  const adminPagesAbs = path.join(rootDir, ADMIN_PAGES_JSON)
  const adminNavAbs = path.join(rootDir, ADMIN_NAV_TS)
  const declaration = readJsonSafe(adminPagesAbs)
  const declaredSlugs = new Set((declaration?.pages ?? []).map((p) => String(p.slug || "")))
  const navContent = fs.existsSync(adminNavAbs) ? fs.readFileSync(adminNavAbs, "utf8") : ""
  const navHrefs = extractAdminNavHrefs(navContent)

  const specsRoot = path.join(rootDir, "docs", "specs")
  const activeSpecs = []
  if (fs.existsSync(specsRoot)) {
    for (const domainEntry of fs.readdirSync(specsRoot, { withFileTypes: true })) {
      if (!domainEntry.isDirectory() || domainEntry.name === "archive") continue
      const domainDir = path.join(specsRoot, domainEntry.name)
      for (const specEntry of fs.readdirSync(domainDir, { withFileTypes: true })) {
        if (!specEntry.isDirectory()) continue
        const specDir = path.join(domainDir, specEntry.name)
        if (!fs.existsSync(path.join(specDir, "brief.json")) && !fs.existsSync(path.join(specDir, "tasks.md"))) continue
        if (specFilter && specEntry.name !== specFilter && domainEntry.name !== specFilter) continue
        let brief = {}
        try {
          brief = JSON.parse(fs.readFileSync(path.join(specDir, "brief.json"), "utf8"))
        } catch {
          /* ignore */
        }
        activeSpecs.push({
          name: specEntry.name,
          domain: String(brief.domain || domainEntry.name),
          dir: specDir,
        })
      }
    }
  }

  const findings = []
  let checkedPageCount = 0

  for (const spec of activeSpecs) {
    if (BUILTIN_EXEMPT_DOMAINS.has(spec.domain)) continue
    const deliveredPages = discoverDomainDeliveredPages(rootDir, spec.domain)
    if (deliveredPages.length === 0) continue

    const tasksPath = path.join(spec.dir, "tasks.md")
    const tasksText = fs.existsSync(tasksPath) ? fs.readFileSync(tasksPath, "utf8") : ""
    const hasMenuTask =
      /admin-nav|admin-pages|generate-admin-nav|侧栏|菜单|入口可发现|domain:new|create-business-domain/i.test(tasksText)

    for (const page of deliveredPages) {
      checkedPageCount += 1
      const inDeclaration = declaredSlugs.has(page.slug) || declaredSlugs.has(page.altSlug)
      const inNav = navHrefs.has(page.route) || navHrefs.has(page.altRoute)

      if (!inNav && !inDeclaration) {
        findings.push({
          class: "DEAD-END",
          blocking: true,
          spec: spec.name,
          domain: spec.domain,
          file: page.file,
          route: page.route,
          message: `${spec.domain} 域已落盘管理端页面 ${page.file}，但未登记进 ${ADMIN_PAGES_JSON} 与 ${ADMIN_NAV_TS}（期望路由 ${page.route}）—— 请运行 node scripts/generate-admin-pages.cjs --write && node scripts/generate-admin-nav.cjs --write`,
        })
      } else if (inDeclaration && !inNav) {
        findings.push({
          class: "ENTRY-UNRESOLVED",
          blocking: true,
          spec: spec.name,
          domain: spec.domain,
          file: page.file,
          route: page.route,
          message: `${spec.domain} 域页面 ${page.slug} 已在 ${ADMIN_PAGES_JSON} 声明，但侧栏导航 ${ADMIN_NAV_TS} 未生成对应入口 ${page.route} —— 请运行 node scripts/generate-admin-nav.cjs --write`,
        })
      } else if (!hasMenuTask) {
        findings.push({
          class: "SPEC-GAP",
          blocking: false,
          spec: spec.name,
          domain: spec.domain,
          file: page.file,
          route: page.route,
          message: `${spec.name} 运行期侧栏入口 ${page.route} 已可达，建议在 tasks.md 显式保留侧栏导航可达验证条目`,
        })
      }
    }
  }

  const blockingFindings = findings.filter((f) => f.blocking)
  return {
    ok: blockingFindings.length === 0,
    checkedSpecs: activeSpecs.length,
    checkedPageCount,
    blockingCount: blockingFindings.length,
    advisoryCount: findings.length - blockingFindings.length,
    findings,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const specIdx = args.indexOf("--spec")
  const specFilter = specIdx >= 0 ? args[specIdx + 1] : null
  const asJson = args.includes("--json")
  const result = auditEntryReachability({ specFilter })
  if (asJson) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    if (result.ok) {
      console.log(
        `✅ [entry-reachability] PASS: 审计 ${result.checkedSpecs} 个活跃规格 / ${result.checkedPageCount} 个管理端落地页，0 断头路`,
      )
      for (const f of result.findings) {
        console.log(`  ⚠️ [${f.class}] ${f.message}`)
      }
    } else {
      console.error(`❌ [entry-reachability] FAIL: 发现 ${result.blockingCount} 处断头路页面`)
      for (const f of result.findings) {
        const icon = f.blocking ? "❌" : "⚠️"
        console.error(`  ${icon} [${f.class}] ${f.message}`)
      }
    }
  }
  process.exit(result.ok ? 0 : 1)
}
