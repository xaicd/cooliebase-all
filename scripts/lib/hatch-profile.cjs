/**
 * ProjectReactor hatch plan: Profile + Bundle + Patch（对标 DeepSeek Harness 叠层，不引入 Cordis）。
 * 域名真源是 domain-catalog.json，本文件只决定「这次克隆保留哪些域」。
 */

const PROFILES = Object.freeze(["base", "minimal", "standard", "vertical", "creator"])

/** system/infra 通过 Facade 依赖这些业务域；裁掉会导致基座无法编译。 */
const PLATFORM_COMPANIONS = Object.freeze(["online", "ai", "aigw"])

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
    help: false,
    dryRun: false,
    /**
     * 跳过数据库准备。给 `project:init --target` 用：它委派本脚本只为"克隆 + 裁剪"，
     * 产物走 **SQLite**，不该被 Postgres 拦住（实测：否则这条零容器路线直接中止）。
     */
    noProvisionDb: false,
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
  npm run project:create -- <目标路径> [--profile base|minimal|standard|vertical|creator] [--bundle mall,crm]

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
    // **`npm run build` 直接失败**（实测：module-not-found on online）。
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
  const excludedDomains = catalogDomainNames(catalog).filter((name) => !selected.includes(name))
  const pruned = excludedDomains.length > 0 || !includeClients

  return {
    profile,
    includeClients,
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

const RETIRED_DIR_PREFIXES = Object.freeze([
  "docs/architecture/archive",
  "docs/specs/archive",
  // 注意：**不能整目录裁 `docs/architecture/artifacts`** —— 其中有 3 个门禁必需的已提交基线：
  //   socratic-inquiry-latest.json（harness:check）、deps-audit-baseline.json（deps:audit）、
  //   engineering-standards-baseline.json（standards:check）。
  // 整目录裁掉会让新孵化工程的 `npm run check` 必红（实测：socratic:check 报缺文件）。
  "docs/architecture/OPEN-SOURCE-TRACKING-MANUAL.md",
  "docs/architecture/CURRENT-PROGRESS.md",
  ".claude",
  ".commandcode",
])

/**
 * **文件名前缀**裁剪（与目录前缀分开）：目录前缀按 `rel === p || rel.startsWith(p + "/")` 匹配，
 * 而这里的前缀是文件名片段（如 `...coverage-`），必须按 `rel.startsWith(p)` 匹配，
 * 否则永远不会命中（实测：写成目录前缀后 8 个历史报告一个都没被裁掉）。
 */
const RETIRED_FILE_PREFIXES = Object.freeze([
  "docs/architecture/artifacts/all-next-starter-coverage-",
  "docs/architecture/artifacts/cooliebase-full-scan-",
])

function shouldSkipRelPath(relPath, plan) {
  const rel = String(relPath || "").replace(/\\/g, "/")
  if (!rel) return false
  for (const prefix of RETIRED_DIR_PREFIXES) {
    if (rel === prefix || rel.startsWith(`${prefix}/`)) return true
  }
  for (const prefix of RETIRED_FILE_PREFIXES) {
    if (rel.startsWith(prefix)) return true
  }
  if (!plan.includeClients && (rel === "clients" || rel.startsWith("clients/"))) return true
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
  shouldSkipRelPath,
  pruneCatalog,
  pruneRpcActions,
  buildHatchManifest,
}
