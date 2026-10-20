const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "../..")
const CATALOG_PATH = path.join(ROOT, "packages", "shared", "backend", "constants", "domain-catalog.json")

function loadCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"))
}

function listDomains() {
  return loadCatalog().domains
}

function getDomain(name) {
  const domain = listDomains().find((entry) => entry.name === name)
  if (!domain) {
    throw new Error(`Unknown domain: ${name}. Use --list to see packable domains.`)
  }
  return domain
}

function toYaml(domain) {
  const prefixes = domain.publicPrefixes.map((prefix) => `  - ${prefix}`).join("\n")
  const modules = ["shared", domain.name]
    .filter((value, index, list) => list.indexOf(value) === index)
    .map((name) => `    - ${name}`)
    .join("\n")
  return `# Generated from packages/shared/backend/constants/domain-catalog.json
# Do not hand-edit pack/upstream fields. Run: pnpm run domain:manifests
domain: ${domain.name}
owner: ${domain.owner}
kind: ${domain.kind}
stage: ${domain.stage}
contractVersion: ${domain.contractVersion}
implementation: ${domain.implementation}
publicPrefix:
${prefixes}
upstream:
  env: ${domain.upstreamEnv}
  protocol: http
  defaultPort: ${domain.defaultPort}
auth:
  audience: ${domain.auth.audience}
  tenantPolicy: ${domain.auth.tenantPolicy}
resilience:
  timeoutMs: ${domain.resilience.timeoutMs}
  retry:
    maxAttempts: ${domain.resilience.retryMaxAttempts}
    safeMethodsOnly: ${domain.resilience.safeMethodsOnly}
  idempotencyRequired: ${domain.resilience.idempotencyRequired}
rollout:
  mode: local
messaging:
  transport: in-process
  queueGroup: cooliebase.${domain.name}
  commandSubject: cooliebase.cmd.${domain.name}.>
  eventSubject: cooliebase.evt.${domain.name}.>
invoke:
  colocated: sdk
  remote: rpc
  protocol: nats-rr
  serialization: json
  facade: required
pack:
  enabled: ${domain.packable}
  kind: ${domain.packKind}
  independentDatabase: ${domain.independentDatabase}
  dependsOnModules:
${modules}
`
}

function manifestPath(domainName) {
  return path.join(domainPathOf(ROOT, domainName), "contract", "route.manifest.yaml")
}

function writeGeneratedManifests() {
  const written = []
  for (const domain of listDomains()) {
    if (domain.manifestMode === "handwritten") continue
    const target = manifestPath(domain.name)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, toYaml(domain))
    written.push(path.relative(ROOT, target).replace(/\\/g, "/"))
  }
  return written
}

// ---------------------------------------------------------------------------
// Module manifest (P0): aggregate already-existing contract sources — never a
// second source of truth. Every field below is parsed out of a file that the
// repo already maintains, so drift is impossible by construction.
// ---------------------------------------------------------------------------

/**
 * 域的实际目录（相对仓库根，posix 风格）。
 *
 * 域被改造成**第一方插件**后目录会搬到 packages/plugins/plugin-<name>。
 * 生成器与门禁必须共用这一个解析器 —— 否则会出现"代码搬走了、生成物还写在旧路径"，
 * 旧目录被重建，解析器又会误判"域还在原地"（实测踩过：残留的 contract/ 目录让
 * seam 图一直指向旧路径并报 triangle incomplete）。
 */
function domainDirOf(root, name) {
  // 核心基础 SDK 不是域: shared 在 packages/shared/，不在 packages/domains/ 下。
  // 漏了这条，依赖闭包会去解析 packages/domains/shared（不存在），
  // 打包就静默漏掉 shared（"missing" 列表里才有痕迹）。
  if (name === "shared") return "packages/shared"
  // 插件位置**优先**: 只要有 packages/plugins/plugin-<name> 就以它为准。
  // 不能反过来靠"旧目录是否存在"判断 —— 旧目录可能被残留生成物重建，导致解析器
  // 误判域还在原地（实测踩过这个反馈回路）。
  const plugin = path.join(root, "packages", "plugins", `plugin-${name}`)
  if (fs.existsSync(plugin)) return path.posix.join("packages", "plugins", `plugin-${name}`)
  return path.posix.join("packages", "domains", name)
}

/** 绝对路径版本的域目录。 */
function domainPathOf(root, name) {
  return path.join(root, domainDirOf(root, name))
}

const CONTRACT_DIR = (domainName) => path.join(domainPathOf(ROOT, domainName), "contract")

function readTextIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
}

/** 每个 *.facade.ts 导出的 `*_FACADE_METHODS` 方法名。 */
function readFacadeSurfaces(domainName) {
  const dir = CONTRACT_DIR(domainName)
  if (!fs.existsSync(dir)) return []
  const surfaces = []
  for (const entry of fs.readdirSync(dir).filter((f) => f.endsWith(".facade.ts")).sort()) {
    const source = readTextIfExists(path.join(dir, entry))
    const match = source.match(/_FACADE_METHODS\s*=\s*\[([\s\S]*?)\]\s*as const/)
    if (!match) continue
    const methods = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    if (methods.length > 0) surfaces.push({ file: entry, methods })
  }
  return surfaces
}

/** `<domain>.proto` 中的 service/rpc 列表。 */
function readProtoRpcs(domainName) {
  const source = readTextIfExists(path.join(CONTRACT_DIR(domainName), `${domainName}.proto`))
  if (!source) return []
  const rpcs = []
  let service = ""
  for (const line of source.split("\n")) {
    const svc = line.match(/^\s*service\s+([A-Za-z0-9_]+)\s*\{/)
    if (svc) {
      service = svc[1]
      continue
    }
    const rpc = line.match(/^\s*rpc\s+([A-Za-z0-9_]+)\s*\(/)
    if (rpc && service) rpcs.push({ service, method: rpc[1] })
  }
  return rpcs
}

/** `actions.ts` 中以 `<domain>.` 为前缀的 action key。 */
function readActionKeys(domainName) {
  const source = readTextIfExists(path.join(CONTRACT_DIR(domainName), "actions.ts"))
  if (!source) return []
  const pattern = new RegExp(`"${domainName}\\.([A-Za-z0-9_]+)"\\s*:`, "g")
  return [...source.matchAll(pattern)].map((m) => `${domainName}.${m[1]}`)
}

/** 权限码 `<domain>:<resource>:<action>`，按域名归组（单次解析，供所有域复用）。 */
function readPermissionsByDomain() {
  const source = readTextIfExists(
    path.join(ROOT, "packages", "shared", "backend", "constants", "permissions.ts"),
  )
  const byDomain = new Map()
  for (const match of source.matchAll(/"([a-z0-9-]+):([a-z0-9-]+):([a-z0-9-]+)"/g)) {
    const [code, domain] = [match[0].slice(1, -1), match[1]]
    if (!byDomain.has(domain)) byDomain.set(domain, new Set())
    byDomain.get(domain).add(code)
  }
  for (const [key, value] of byDomain) byDomain.set(key, [...value].sort())
  return byDomain
}

/** 域名 → 中文标签。真源：admin-menu.ts 的顶层条目（key=域名, label=中文）。 */
function readDomainLabels() {
  const source = readTextIfExists(
    path.join(ROOT, "packages", "shared", "backend", "constants", "admin-menu.ts"),
  )
  const labels = new Map()
  for (const match of source.matchAll(/^ {4}key: "([a-z0-9-]+)",\n {4}label: "([^"]+)",/gm)) {
    labels.set(match[1], match[2])
  }
  return labels
}

/**
 * capability 由「真实声明」推导，而不是手工编造：
 * 声明是请求，不是授权 —— 插件 manifest 的 capability 也是同一语义。
 */
function deriveCapabilities(domain, sources) {
  const capabilities = ["api.routes.register"]
  if (sources.facades.length > 0) capabilities.push("facade.invoke")
  if (sources.rpcs.length > 0) capabilities.push("rpc.serve")
  if (sources.actions.length > 0) capabilities.push("cmd.dispatch")
  if (domain.packable) capabilities.push("pack.independent")
  return capabilities
}

function toModuleManifest(domain, sources, labels = new Map()) {
  const methods = [...new Set(sources.facades.flatMap((surface) => surface.methods))]
  return {
    $schema: "cooliebase-module-manifest/v1",
    /** 解析主键：网关按它把 /modules/<domain>/<method> 路由到对应域。 */
    domain: domain.name,
    // `<org>.<name>` 命名习惯（与插件 id 一致）
    id: `cooliebase.${domain.name}`,
    apiVersion: 1,
    displayName: labels.get(domain.name) || domain.name,
    kind: domain.kind,
    stage: domain.stage,
    owner: domain.owner,
    contractVersion: domain.contractVersion,
    implementation: domain.implementation,
    minimumHostVersion: "1.0.0",
    capabilities: deriveCapabilities(domain, sources),
    entrypoints: {
      facade: sources.facades.map((surface) => `${domainDirOf(ROOT, domain.name)}/contract/${surface.file}`),
      proto: fs.existsSync(path.join(CONTRACT_DIR(domain.name), `${domain.name}.proto`))
        ? `${domainDirOf(ROOT, domain.name)}/contract/${domain.name}.proto`
        : null,
      actions: fs.existsSync(path.join(CONTRACT_DIR(domain.name), "actions.ts"))
        ? `${domainDirOf(ROOT, domain.name)}/contract/actions.ts`
        : null,
    },
    apiRoutes: {
      publicPrefix: domain.publicPrefixes,
      adminPrefix: `/api/v1/admin/${domain.name}`,
    },
    auth: { audience: domain.auth.audience, tenantPolicy: domain.auth.tenantPolicy },
    messaging: {
      queueGroup: `cooliebase.${domain.name}`,
      commandSubject: `cooliebase.cmd.${domain.name}.>`,
      eventSubject: `cooliebase.evt.${domain.name}.>`,
    },
    invoke: { colocated: "sdk", remote: "rpc", protocol: "nats-rr", serialization: "json" },
    upstream: { env: domain.upstreamEnv, protocol: "http", defaultPort: domain.defaultPort },
    // 与 route.manifest.yaml 保持同一嵌套形状, 避免同一事实两种表达
    resilience: {
      timeoutMs: domain.resilience.timeoutMs,
      retry: {
        maxAttempts: domain.resilience.retryMaxAttempts,
        safeMethodsOnly: domain.resilience.safeMethodsOnly,
      },
      idempotencyRequired: domain.resilience.idempotencyRequired,
    },
    facadeMethods: methods,
    rpc: sources.rpcs,
    actions: sources.actions,
    permissions: sources.permissions,
    dependsOn: domain.dependsOnModules,
    pack: {
      enabled: domain.packable,
      kind: domain.packKind,
      independentDatabase: domain.independentDatabase,
    },
  }
}

function moduleManifestPath(domainName) {
  return path.join(domainPathOf(ROOT, domainName), "contract", "module.manifest.json")
}

function writeGeneratedModuleManifests() {
  const permissionsByDomain = readPermissionsByDomain()
  const labels = readDomainLabels()
  const written = []
  for (const domain of listDomains()) {
    if (domain.manifestMode === "handwritten") continue
    const sources = {
      facades: readFacadeSurfaces(domain.name),
      rpcs: readProtoRpcs(domain.name),
      actions: readActionKeys(domain.name),
      permissions: permissionsByDomain.get(domain.name) || [],
    }
    const target = moduleManifestPath(domain.name)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, `${JSON.stringify(toModuleManifest(domain, sources, labels), null, 2)}\n`)
    written.push(path.relative(ROOT, target).replace(/\\/g, "/"))
  }
  return written
}

function moduleRegistryPath() {
  // 刻意放在组合根(src/app)而非 modules/shared:
  // 1) 分层: shared 是 L0 基础 SDK, 从不静态依赖具体域(既有姿势是动态 import);
  //    本索引静态 import 全部域, 住在 shared 会把依赖方向倒过来。
  // 2) 实害: domain:pack 只打包 [domain, ...dependsOnModules], 即仅 domain + shared。
  //    索引若在 shared 内, 打包后会 import 到未随包拷贝的其它域 -> 构建失败。
  // 网关本身不属于任何单域的 apiRouteDirs, 故不会进入域包。
  return path.join(ROOT, "src", "app", "api", "v1", "admin", "modules", "_lib", "module-registry.generated.ts")
}

/**
 * 生成静态注册表索引。
 * 必须静态 import 而非运行时 fs 读盘：Next.js standalone 产物不会把 src 下的
 * JSON 当作可 fs 读取的资源，运行时读盘在生产会拿不到文件。
 */
function toModuleRegistrySource(domains) {
  const imports = domains.map((domain, index) => {
    const importPath =
      domain.kind === "plugin"
        ? `@/plugins/plugin-${domain.name}/contract/module.manifest.json`
        : `@/domains/${domain.name}/contract/module.manifest.json`
    return `import manifest${index} from "${importPath}"`
  })
  const entries = domains.map((_, index) => `  manifest${index},`)
  return [
    "// Generated by `pnpm run domain:manifests`. Do not hand-edit.",
    "// 各域 manifest 的静态索引；新增域后重新运行 pnpm run domain:manifests 即可。",
    "",
    ...imports,
    "",
    "export const MODULE_MANIFESTS = [",
    ...entries,
    "] as const",
    "",
  ].join("\n")
}

function writeGeneratedModuleRegistry() {
  const domains = listDomains().filter((domain) => domain.manifestMode !== "handwritten")
  const target = moduleRegistryPath()
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, toModuleRegistrySource(domains))
  return path.relative(ROOT, target).replace(/\\/g, "/")
}

module.exports = {
  domainDirOf,
  domainPathOf,
  ROOT,
  CATALOG_PATH,
  loadCatalog,
  listDomains,
  getDomain,
  toYaml,
  manifestPath,
  writeGeneratedManifests,
  readFacadeSurfaces,
  readProtoRpcs,
  readActionKeys,
  readPermissionsByDomain,
  readDomainLabels,
  toModuleManifest,
  moduleManifestPath,
  writeGeneratedModuleManifests,
  moduleRegistryPath,
  toModuleRegistrySource,
  writeGeneratedModuleRegistry,
}
