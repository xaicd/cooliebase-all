/**
 * ProjectReactor hatch plan: Profile + Bundle + Patch（对标 DeepSeek Harness 叠层，不引入 Cordis）。
 * 域名真源是 domain-catalog.json，本文件只决定「这次克隆保留哪些域」。
 */

const PROFILES = Object.freeze(["base", "minimal", "standard", "vertical", "creator"])

/** system/infra 通过 Facade 依赖这些业务域；裁掉会导致基座无法编译。 */
const PLATFORM_COMPANIONS = Object.freeze(["online"])

const DOMAIN_PATH_PREFIXES = Object.freeze([
  "packages/domains/",
  // 域迁成第一方插件后目录在 packages/plugins/plugin-<name>。
  // 漏了这条，被排除的域在 project:create 时**不会被跳过**，会被原样拷进新工程。
  "packages/plugins/plugin-",
  "src/app/api/v1/admin/",
  "src/app/api/v1/app/",
  "src/app/api/v1/open/",
  "src/app/(admin-pages)/admin/",
  "src/app/(cpc-pages)/cpc/",
  // 客户端内按域组织的模块（clients/<channel>/src/modules/<domain>）随被排除域同步裁剪
  "clients/expo/src/modules/",
  "clients/miniapp/src/modules/",
])

function splitCsv(value) {
  return String(value || "")
    .split(/[,+\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function unique(list) {
  return [...new Set(list)]
}

function parseArgv(argv) {
  const args = argv.slice(2)
  const out = {
    target: undefined,
    profile: "base",
    bundle: [],
    clients: [],
    help: false,
    dryRun: false,
    /**
     * 跳过数据库准备。给 `project:init --target` 用：它委派本脚本只为"克隆 + 裁剪"，
     * 产物走 **SQLite**，不该被 Postgres 拦住（实测：否则这条零容器路线直接中止）。
     */
    noProvisionDb: false,
    /**
     * 产物的**人类可读标题**（`--title`）。克隆链用它替换基座的全称字面量
     * （`CoolieBase All` —— 包括 `project-profile.json` 与**断言它的测试**）。
     *
     * **为什么必须有这个旗标**（实测 bug）：`runProjectReactor` 一直有
     * `options.customTitle || <由 name 推导>` 的回退，但**没有任何旗标能喂它** ——
     * 于是 `project:init --name t4-product --title "T4 验收产物"` 造出的产物里，
     * 身份契约写的是 `T4 验收产物`（走 `opts.title`），
     * 而测试断言被替换成 **`T4 Product`**（由 name 推导）→ 产物 `check` **必红**。
     */
    customTitle: undefined,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") {
      out.help = true
      continue
    }
    if (arg === "--dry-run") {
      out.dryRun = true
      continue
    }
    if (arg === "--no-provision-db") {
      out.noProvisionDb = true
      continue
    }
    if (arg === "--profile") {
      out.profile = String(args[i + 1] || "").trim().toLowerCase()
      i += 1
      continue
    }
    if (arg.startsWith("--profile=")) {
      out.profile = arg.slice("--profile=".length).trim().toLowerCase()
      continue
    }
    if (arg === "--bundle") {
      out.bundle = splitCsv(args[i + 1])
      i += 1
      continue
    }
    if (arg.startsWith("--bundle=")) {
      out.bundle = splitCsv(arg.slice("--bundle=".length))
      continue
    }
    if (arg === "--clients") {
      out.clients = splitCsv(args[i + 1])
      i += 1
      continue
    }
    if (arg.startsWith("--clients=")) {
      out.clients = splitCsv(arg.slice("--clients=".length))
      continue
    }
    if (arg === "--title") {
      out.customTitle = String(args[i + 1] || "").trim() || undefined
      i += 1
      continue
    }
    if (arg.startsWith("--title=")) {
      out.customTitle = arg.slice("--title=".length).trim() || undefined
      continue
    }
    if (arg.startsWith("--")) {
      throw new Error(`未知参数 ${arg}。使用 --help 查看用法。`)
    }
    if (!out.target) {
      out.target = arg
      continue
    }
    throw new Error(`多余位置参数: ${arg}`)
  }

  // 只给 --bundle 不给 --profile 时，自动升到 vertical
  // （base/standard 都视作"没显式选"，否则 --bundle 会被 base 的校验误拒）
  if (out.bundle.length > 0 && (out.profile === "base" || out.profile === "standard")) {
    out.profile = "vertical"
  }

  return out
}

function helpText() {
  return `用法:
  pnpm run project:create -- <目标路径> [--profile base|minimal|standard|vertical|creator] [--bundle mall,crm]

Profile:
  standard  整仓（默认，DigitalStaff NPC 全能力模板）
  base      shared + system + infra（**默认**：最轻，起项目/预览最快；平台伴生域按需动态加载）
  minimal   shared + system + infra + 平台伴生域 (online/ai/aigw)
  vertical  minimal + --bundle 业务域白名单
  creator   等同 standard（含 online/codegen）

说明:
  平台伴生域因 system 菜单目录与 infra codegen 的 Facade 依赖，不能从 minimal 裁掉。
  Prisma 迁移仍部署全量基座表，裁剪的是代码与 catalog 发现面。`
}

function catalogDomainNames(catalog) {
  return (catalog.domains || []).map((item) => item.name)
}

/**
 * 业务域 = 业务层 ∪ 插件层。
 *
 * 域迁成第一方插件后会被移出 layers.business 放进 layers.plugin；
 * 只读 business 会让 standard profile 只剩 system/infra —— 孵出来的新工程**没有任何业务域**。
 * 语义上"插件层"就是"可插拔的业务域"，两者必须合并看待。
 */
function businessDomainNames(catalog) {
  return [
    ...(catalog.layers?.business?.domains || []),
    ...(catalog.layers?.plugin?.domains || []),
  ]
}

function platformDomainNames(catalog) {
  return catalog.layers?.platform?.domains || ["system", "infra"]
}

function resolveHatchPlan(catalog, options = {}) {
  const profile = String(options.profile || "base").toLowerCase()
  const requestedBundle = unique(options.bundle || [])

  if (!PROFILES.includes(profile)) {
    throw new Error(`未知 profile "${profile}"。可选: ${PROFILES.join(", ")}`)
  }

  const known = new Set(catalogDomainNames(catalog))
  for (const name of requestedBundle) {
    if (!known.has(name)) {
      throw new Error(`--bundle 含未知域 "${name}"。合法域名以 domain-catalog.json 为准。`)
    }
  }

  if (profile === "vertical" && requestedBundle.length === 0) {
    throw new Error("vertical profile 必须提供 --bundle（例如 --bundle mall,crm）")
  }

  if ((profile === "minimal" || profile === "base") && requestedBundle.length > 0) {
    throw new Error(`${profile} 不能叠加 --bundle；请改用 --profile vertical --bundle ...`)
  }

  const platform = platformDomainNames(catalog)
  const companions = PLATFORM_COMPANIONS.filter((name) => known.has(name))
  const business = businessDomainNames(catalog)

  let selected = []
  let includeClients = true

  if (profile === "base") {
    // 新工程的**默认**形态：平台地基（system + infra）+ **平台伴生域**。
    //
    // 为什么必须带伴生域（实测）：平台地基对它们存在**静态依赖**——
    //   · `src/app/api/v1/open/meta/page-schema/[entity]/route.ts` 静态 import
    //     `@/modules/online/backend/services/page-schema.service`；
    //   · `packages/domains/infra/.../codegen-templates/service.template.ts` 静态 import
    //     `onlinePlatformFacade`。
    // 早前这里注释写的是"已改为按需动态加载"，但它只对 `codegen-table.service.ts`
    // 这类动态 import 成立，上述两处仍是静态的 —— 于是 `--profile base` 产物
    // **`pnpm run build` 直接失败**（实测：module-not-found on online）。
    // 结论：`base` 与 `minimal` 目前等价。要真正区分，需先把上述两处改为惰性加载。
    selected = unique([...platform, ...companions])
    includeClients = false
  } else if (profile === "minimal") {
    selected = unique([...platform, ...companions])
    includeClients = false
  } else if (profile === "vertical") {
    const extra = requestedBundle.filter((name) => !platform.includes(name))
    selected = unique([...platform, ...companions, ...extra])
    includeClients = true
  } else {
    selected = unique([...platform, ...business])
    includeClients = true
  }

  selected = selected.filter((name) => known.has(name))
  const requestedClients = unique(options.clients || [])
  if (requestedClients.length > 0) {
    includeClients = requestedClients.includes("expo") || requestedClients.includes("miniapp")
  }
  const excludedDomains = catalogDomainNames(catalog).filter((name) => !selected.includes(name))
  const pruned = excludedDomains.length > 0 || !includeClients

  return {
    profile,
    includeClients,
    clients: requestedClients.length > 0 ? requestedClients : includeClients ? ["admin-web", "expo", "miniapp"] : ["admin-web"],
    pruned,
    companions,
    domains: selected,
    excludedDomains,
    bundle: requestedBundle,
  }
}

function matchesDomainPrefix(rel, domain) {
  const needle = domain.replace(/\\/g, "/")
  for (const prefix of DOMAIN_PATH_PREFIXES) {
    if (rel === `${prefix}${needle}` || rel.startsWith(`${prefix}${needle}/`)) return true
  }
  return false
}

/**
 * `docs/architecture/artifacts/` 仅允许携带门禁链运行必需的静态基线 JSON。
 * 母本运行期心跳、分诊痕迹、压测/扫描结果及历史盘点草稿一律拦截，绝不污染 Layer-B 派生工程。
 */
const GATE_REQUIRED_ARTIFACTS = new Set([
  "docs/architecture/artifacts/admin-route-policy-baseline.json",
  "docs/architecture/artifacts/agent-contract-coverage-baseline.json",
  "docs/architecture/artifacts/agent-native-baseline.json",
  "docs/architecture/artifacts/agent-route-coverage-baseline.json",
  "docs/architecture/artifacts/clause-mechanism-map.json",
  "docs/architecture/artifacts/contract-governance-baseline.json",
  "docs/architecture/artifacts/deps-audit-baseline.json",
  "docs/architecture/artifacts/design-tokens-baseline.json",
  "docs/architecture/artifacts/engineering-standards-baseline.json",
  "docs/architecture/artifacts/frontend-raw-fetch-baseline.json",
  "docs/architecture/artifacts/handwritten-files-baseline.json",
  "docs/architecture/artifacts/harness-unreachable-scripts.json",
  "docs/architecture/artifacts/menu-title-length-baseline.json",
  "docs/architecture/artifacts/route-validation-baseline.json",
  "docs/architecture/artifacts/socratic-inquiry-latest.json",
  "docs/architecture/artifacts/typecheck-baseline.json",
  "docs/architecture/artifacts/write-path-depth-baseline.json",
  "docs/architecture/artifacts/write-path-depth-evidence-baseline.json",
])

const RETIRED_DIR_PREFIXES = Object.freeze([
  "docs/architecture/archive",
  "docs/specs/archive",
  "docs/specs/system",
  "docs/features",
  ".kiro/specs",
  "docs/architecture/OPEN-SOURCE-TRACKING-MANUAL.md",
  "docs/architecture/CURRENT-PROGRESS.md",
  "docs/architecture/EVOLUTION-ROADMAP-2026.md",
  "docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md",
  "docs/architecture/upstream-radar-catalog.json",
  "docs/architecture/ai-gateway-new-api.md",
  "docs/architecture/online-jeecg-functional-benchmark.md",
  "docs/architecture/coolie-hook-and-gate-handoff.md",
  "docs/architecture/cooliebase-all-module-to-plugin-migration.md",
  "docs/architecture/cooliebase-full-migration-board.md",
  "docs/architecture/cooliebase-module-first-migration.md",
  "docs/architecture/cooliebase-all-sync-taskboard.md",
  "docs/architecture/nextjs-app-router-stateless-scaling-audit.md",
  "docs/architecture/system-core-implementation-checklist.md",
  "docs/architecture/system-domain-split-spec.md",
  "docs/guides/dsh-integration.md",
  "docs/guides/dbx-mcp-integration.md",
  "docs/05_verification/workspace-executability-purge-scope-evidence.md",
  ".claude",
  ".commandcode",
])

/**
 * **文件名前缀**裁剪（与目录前缀分开）：按 `rel.startsWith(p)` 匹配母本客户/外部调研/历史发布说明前缀。
 */
const RETIRED_FILE_PREFIXES = Object.freeze([
  "docs/architecture/artifacts/all-next-starter-coverage-",
  "docs/architecture/artifacts/cooliebase-full-scan-",
  "docs/architecture/artifacts/upstream-radar-report",
  "docs/architecture/yingsuantong-",
  "docs/architecture/GEO-",
  "docs/architecture/dsh-research-",
  "docs/07_release/RELEASE_NOTES_",
])

function shouldSkipRelPath(relPath, plan = {}) {
  const rel = String(relPath || "").replace(/\\/g, "/")
  if (!rel) return false
  for (const prefix of RETIRED_DIR_PREFIXES) {
    if (rel === prefix || rel.startsWith(`${prefix}/`)) return true
  }
  for (const prefix of RETIRED_FILE_PREFIXES) {
    if (rel.startsWith(prefix)) return true
  }
  if (rel.startsWith("docs/architecture/artifacts/") && !GATE_REQUIRED_ARTIFACTS.has(rel)) {
    return true
  }
  if (rel.startsWith("docs/01_management/dar-decision-records/") && rel.endsWith(".md")) {
    return true
  }
  if (rel.startsWith("docs/06_quality_assurance/audit/") && rel.endsWith(".md")) {
    return true
  }
  // 当不包含客户端时，排除独立客户端子项目 (clients/expo, clients/miniapp)，保留 clients/ 目录及 README 标识
  if (
    plan.includeClients === false &&
    (rel === "clients/expo" ||
      rel.startsWith("clients/expo/") ||
      rel === "clients/miniapp" ||
      rel.startsWith("clients/miniapp/"))
  ) {
    return true
  }
  for (const domain of plan.excludedDomains || []) {
    if (matchesDomainPrefix(rel, domain)) return true
  }
  return false
}

function pruneCatalog(catalog, plan) {
  const keep = new Set(plan.domains)
  const next = JSON.parse(JSON.stringify(catalog))
  next.domains = (catalog.domains || []).filter((item) => keep.has(item.name))
  next.layers.business.domains = (catalog.layers?.business?.domains || []).filter((name) => keep.has(name))
  // 插件层同样要裁 —— 否则新工程的 catalog 会留着"目录已被删掉的域"，
  // 门禁要么直接失败，要么静默对不上。
  if (next.layers.plugin) {
    next.layers.plugin.domains = (catalog.layers?.plugin?.domains || []).filter((name) => keep.has(name))
  }
  return next
}

function pruneRpcActions(rpcCatalog, plan) {
  const keep = new Set(plan.domains)
  const next = JSON.parse(JSON.stringify(rpcCatalog))
  const domains = {}
  for (const [name, spec] of Object.entries(rpcCatalog.domains || {})) {
    if (keep.has(name)) domains[name] = spec
  }
  next.domains = domains
  return next
}

function buildHatchManifest(plan) {
  return {
    version: 1,
    kind: "hatch-manifest",
    profile: plan.profile,
    pruned: Boolean(plan.pruned),
    includeClients: Boolean(plan.includeClients),
    domains: plan.domains,
    excludedDomains: plan.excludedDomains,
    companions: plan.companions,
    bundle: plan.bundle,
    prisma: "full-base-migrations",
    note: "Prisma 迁移仍为全量基座表；代码目录与 catalog 发现面按 profile 裁剪。",
  }
}

module.exports = {
  PROFILES,
  PLATFORM_COMPANIONS,
  DOMAIN_PATH_PREFIXES,
  parseArgv,
  helpText,
  resolveHatchPlan,
  GATE_REQUIRED_ARTIFACTS,
  shouldSkipRelPath,
  pruneCatalog,
  pruneRpcActions,
  buildHatchManifest,
}
