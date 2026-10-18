import {
  DOMAIN_CATALOG,
  type DomainCatalogEntry,
  getDomainCatalogEntry,
  listDomainCatalog,
  requireDomainCatalogEntry,
} from "../constants/domain-catalog"

export type DomainUpstreamMatch = {
  domain: string
  prefix: string
  baseUrl: string
  timeoutMs: number
}

export type DomainPackPlan = {
  domain: string
  owner: string
  kind: DomainCatalogEntry["kind"]
  stage: DomainCatalogEntry["stage"]
  packable: boolean
  packKind: DomainCatalogEntry["packKind"]
  defaultPort: number
  upstreamEnv: string
  publicPrefixes: string[]
  modules: string[]
  apiRouteDirs: string[]
  independentDatabase: boolean
}

const NATIVE_CHANNELS = ["admin", "app", "open", "internal"] as const

export function listPackableDomains(): DomainCatalogEntry[] {
  return listDomainCatalog().filter((domain) => domain.packable)
}

export function matchPathToDomain(pathname: string): { domain: DomainCatalogEntry; prefix: string } | undefined {
  const normalized = pathname.split("?")[0] || pathname
  const matches = listDomainCatalog()
    .flatMap((domain) => domain.publicPrefixes.map((prefix) => ({ domain, prefix })))
    .filter(({ prefix }) => normalized === prefix || normalized.startsWith(`${prefix}/`))
    .sort((left, right) => right.prefix.length - left.prefix.length)
  return matches[0]
}

export function readUpstreamBaseUrl(domain: DomainCatalogEntry, env: NodeJS.Dict<string> = process.env): string | undefined {
  const raw = env[domain.upstreamEnv]?.trim()
  if (!raw) return undefined
  return raw.replace(/\/+$/, "")
}

export function matchRemoteDomainUpstream(
  pathname: string,
  env: NodeJS.Dict<string> = process.env,
): DomainUpstreamMatch | undefined {
  if (env.COOLIEBASE_PACK_DOMAIN) return undefined
  const matched = matchPathToDomain(pathname)
  if (!matched) return undefined
  const baseUrl = readUpstreamBaseUrl(matched.domain, env)
  if (!baseUrl) return undefined
  return {
    domain: matched.domain.name,
    prefix: matched.prefix,
    baseUrl,
    timeoutMs: matched.domain.resilience.timeoutMs,
  }
}

export function buildDomainPackPlan(name: string): DomainPackPlan {
  const domain = requireDomainCatalogEntry(name)
  const modules = Array.from(new Set([domain.name, ...domain.dependsOnModules]))
  return {
    domain: domain.name,
    owner: domain.owner,
    kind: domain.kind,
    stage: domain.stage,
    packable: domain.packable,
    packKind: domain.packKind,
    defaultPort: domain.defaultPort,
    upstreamEnv: domain.upstreamEnv,
    publicPrefixes: domain.publicPrefixes,
    modules,
    apiRouteDirs: domain.publicPrefixes.map((prefix) => prefix.replace(/^\/api/, "src/app/api")),
    independentDatabase: domain.independentDatabase,
  }
}

export function collectStaticUpstreamEnv(env: NodeJS.Dict<string> = process.env): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}
  for (const domain of DOMAIN_CATALOG.domains) {
    result[domain.name] = readUpstreamBaseUrl(domain, env)
  }
  return result
}

export function isNativeApiChannel(channel: string): boolean {
  return (NATIVE_CHANNELS as readonly string[]).includes(channel)
}

export { getDomainCatalogEntry, listDomainCatalog, requireDomainCatalogEntry }
