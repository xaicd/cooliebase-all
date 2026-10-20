/**
 * Capability Seam graph: generated from domain-catalog + contract/rpc, never a second domain list.
 */

const fs = require("fs")
const path = require("path")
const { ROOT, loadCatalog } = require("./domain-catalog.cjs")
const { loadRpcActions } = require("./rpc-contracts.cjs")

/**
 * 域的实际目录。域被改造成**第一方插件**后目录会搬到 packages/plugins/plugin-<name>，
 * 写死 packages/domains/<name> 会让 seam 图看不见它的契约，从而报 "triangle incomplete"。
 */
function domainDirOf(root, name) {
  // 插件位置优先（理由同 domain-catalog.cjs: 对残留旧目录免疫）
  const plugin = path.join("packages", "plugins", `plugin-${name}`)
  if (fs.existsSync(path.join(root, plugin))) return plugin.replace(/\\/g, "/")
  return path.join("packages", "domains", name).replace(/\\/g, "/")
}

const SEAM_GRAPH_REL = path.join("packages", "shared", "contract", "seam-graph.json").replace(/\\/g, "/")

/** 插件 id 约定: 第一方插件 id = cooliebase.<域名>（见 scripts/scaffold-domain-plugin.cjs）。 */
function pluginIdOf(name) {
  return `cooliebase.${name}`
}

/** 该域在 catalog 里的 kind（plugin / business / platform）。 */
function domainKindOf(name) {
  const catalog = loadCatalog()
  return (catalog.domains || []).find((item) => item.name === name)?.kind
}

const CONSUMER_SLOTS = [
  ["adminApi", (name) => `src/app/api/v1/admin/${name}`],
  ["appApi", (name) => `src/app/api/v1/app/${name}`],
  ["openApi", (name) => `src/app/api/v1/open/${name}`],
  ["frontendApi", (name) => `${domainDirOf(ROOT, name)}/frontend/api`],
  ["adminPages", (name) => `src/app/(admin-pages)/admin/${name}`],
  ["modulePages", (name) => `${domainDirOf(ROOT, name)}/frontend/pages`],
  ["cpcPages", (name) => `src/app/(cpc-pages)/cpc/${name}`],
  ["moduleCpcPages", (name) => `${domainDirOf(ROOT, name)}/frontend/cpc-pages`],
]

function toPosix(rel) {
  return String(rel || "").replace(/\\/g, "/")
}

function joinRoot(root, rel) {
  return path.join(root, ...toPosix(rel).split("/"))
}

function existsRel(root, rel) {
  return fs.existsSync(joinRoot(root, rel))
}

function listDirFiles(root, relDir, predicate) {
  const dir = joinRoot(root, relDir)
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return []
  return fs.readdirSync(dir)
    .filter((name) => predicate(name))
    .sort()
    .map((name) => `${toPosix(relDir)}/${name}`)
}

function methodsFor(rpcActions, domainName) {
  const spec = rpcActions?.domains?.[domainName]
  if (!spec?.actions) return []
  return spec.actions.map((item) => item.method)
}

function buildDomainSeam(root, domain, rpcActions) {
  const name = domain.name
  const base = domainDirOf(root, name)
  const contractDir = `${base}/contract`
  const servicesDir = `${base}/backend/services`
  const repositoriesDir = `${base}/backend/repositories`

  const facades = listDirFiles(root, contractDir, (file) => file.endsWith(".facade.ts"))
  const actions = listDirFiles(root, contractDir, (file) => file === "actions.ts" || file.endsWith(".actions.ts"))
  const protos = listDirFiles(root, contractDir, (file) => file.endsWith(".proto"))
  const manifests = listDirFiles(root, contractDir, (file) => file === "route.manifest.yaml")

  const consumer = {}
  // 插件类域的路由由宿主按 manifest 挂载在 /api/v1/plugins/<id>/api，
  // 不再有 src/app/api/v1/<surface>/<domain> 目录 —— 消费面必须按插件挂载点记，
  // 否则 seam 三角判不出来（实测：切掉 Next 转发文件后 rolesComplete 变 false）。
  const domainKind = domainKindOf(name)
  const pluginApiSlots = new Set(["adminApi", "appApi", "openApi"])
  for (const [key, relOf] of CONSUMER_SLOTS) {
    if (domainKind === "plugin" && pluginApiSlots.has(key)) {
      consumer[key] = `src/app/api/v1/plugins/${pluginIdOf(name)}/api`
      continue
    }
    const rel = relOf(name)
    if (existsRel(root, rel)) consumer[key] = rel
  }

  const definition = {
    dir: existsRel(root, contractDir) ? contractDir : null,
    facades,
    actions,
    proto: protos[0] || null,
    manifest: manifests[0] || null,
  }
  const provider = {
    servicesDir: existsRel(root, servicesDir) ? servicesDir : null,
    repositoriesDir: existsRel(root, repositoriesDir) ? repositoriesDir : null,
    methods: methodsFor(rpcActions, name),
  }
  const rolesComplete = Boolean(
    definition.dir
      && facades.length > 0
      && provider.servicesDir
      && Object.keys(consumer).length > 0,
  )

  return {
    name,
    kind: domain.kind,
    stage: domain.stage,
    definition,
    provider,
    consumer,
    rolesComplete,
  }
}

function buildSeamGraph({ root = ROOT, catalog, rpcActions } = {}) {
  const sourceCatalog = catalog || loadCatalog()
  const sourceRpc = rpcActions || loadRpcActions()
  const domains = (sourceCatalog.domains || []).map((domain) => buildDomainSeam(root, domain, sourceRpc))
  return {
    version: 1,
    kind: "capability-seam-graph",
    generated: true,
    source: "packages/shared/backend/constants/domain-catalog.json",
    generatedBy: "scripts/lib/seam-graph.cjs",
    note: "Do not hand-edit domain names. Run pnpm run domain:seams after catalog/contract changes.",
    domains,
  }
}

function renderSeamGraph(options) {
  return `${JSON.stringify(buildSeamGraph(options), null, 2)}\n`
}

function seamGraphPath(root = ROOT) {
  return joinRoot(root, SEAM_GRAPH_REL)
}

function writeSeamGraph(options = {}) {
  const root = options.root || ROOT
  const target = seamGraphPath(root)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, renderSeamGraph(options), "utf8")
  return toPosix(path.relative(root, target))
}

function assertSeamGraphMatches(options = {}) {
  const root = options.root || ROOT
  const expected = renderSeamGraph(options)
  const target = seamGraphPath(root)
  if (!fs.existsSync(target)) {
    throw new Error(`missing ${SEAM_GRAPH_REL}; run pnpm run domain:seams`)
  }
  const actual = fs.readFileSync(target, "utf8")
  if (actual !== expected) {
    throw new Error(`seam-graph drift in ${SEAM_GRAPH_REL}; run pnpm run domain:seams`)
  }
  const graph = JSON.parse(actual)
  const catalogNames = (options.catalog || loadCatalog()).domains.map((item) => item.name)
  const graphNames = (graph.domains || []).map((item) => item.name)
  if (catalogNames.join("\0") !== graphNames.join("\0")) {
    throw new Error("seam-graph domain names must match domain-catalog.json exactly")
  }
  const incomplete = (graph.domains || []).filter((item) => !item.rolesComplete).map((item) => item.name)
  if (incomplete.length) {
    throw new Error(`seam triangle incomplete for: ${incomplete.join(", ")}`)
  }
  return graph
}

module.exports = {
  SEAM_GRAPH_REL,
  buildSeamGraph,
  renderSeamGraph,
  writeSeamGraph,
  assertSeamGraphMatches,
  seamGraphPath,
}
