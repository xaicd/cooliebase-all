import { listDomainCatalog } from "../constants/domain-catalog"
import { currentNodeID } from "./broker-context"

export type RegistryNode = {
  nodeID: string
  lastHeartbeat: number
  services: string[]
  available: boolean
}

export type RegistryService = {
  name: string
  nodes: string[]
  local: boolean
  available: boolean
}

const nodes = new Map<string, RegistryNode>()
let activeEnv: NodeJS.Dict<string> = process.env

export function resetBrokerRegistry() {
  nodes.clear()
  activeEnv = process.env
}

export function isLocalService(name: string, env: NodeJS.Dict<string> = activeEnv): boolean {
  const packed = env.COOLIEBASE_PACK_DOMAIN?.trim()
  if (packed) return packed === name
  return !readDomainUpstream(name, env)
}

export function readDomainUpstream(name: string, env: NodeJS.Dict<string> = activeEnv): string | undefined {
  const domain = listDomainCatalog().find((item) => item.name === name)
  const raw = domain ? env[domain.upstreamEnv]?.trim() : undefined
  return raw ? raw.replace(/\/+$/, "") : undefined
}

export function registerRemoteServicesFromEnv(env: NodeJS.Dict<string> = activeEnv) {
  for (const domain of listDomainCatalog()) {
    if (!isLocalService(domain.name, env)) registerRemoteService(domain.name)
  }
}

export function registerRemoteService(name: string, nodeID = `remote-${name}`) {
  const existing = nodes.get(nodeID)
  const services = existing ? Array.from(new Set([...existing.services, name])) : [name]
  heartbeat(nodeID, services)
  return { nodeID, services }
}

export function heartbeat(nodeID = currentNodeID(), services?: string[]) {
  const existing = nodes.get(nodeID)
  nodes.set(nodeID, {
    nodeID,
    lastHeartbeat: Date.now(),
    services: services ?? existing?.services ?? [],
    available: true,
  })
}

export function registerLocalServices(env: NodeJS.Dict<string> = process.env) {
  activeEnv = env
  const nodeID = currentNodeID(env)
  const services = listDomainCatalog()
    .filter((domain) => isLocalService(domain.name, env))
    .map((domain) => domain.name)
  heartbeat(nodeID, services)
  registerRemoteServicesFromEnv(env)
  return { nodeID, services }
}

export function listNodes(): RegistryNode[] {
  return [...nodes.values()]
}

export function listServices(): RegistryService[] {
  const self = currentNodeID(activeEnv)
  const byName = new Map<string, RegistryService>()
  for (const node of nodes.values()) {
    for (const name of node.services) {
      const current = byName.get(name) ?? { name, nodes: [], local: false, available: false }
      current.nodes.push(node.nodeID)
      current.local = current.local || node.nodeID === self
      current.available = current.available || node.available
      byName.set(name, current)
    }
  }
  return [...byName.values()]
}

export function hasService(name: string): boolean {
  return listServices().some((service) => service.name === name && service.available)
}

export async function waitForServices(names: string[], timeoutMs = 3000, intervalMs = 50): Promise<boolean> {
  const started = Date.now()
  while (Date.now() - started <= timeoutMs) {
    if (names.every((name) => hasService(name))) return true
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return false
}

export function ping(nodeID?: string, timeoutMs = 1000) {
  const started = Date.now()
  const targets = nodeID ? [nodes.get(nodeID)].filter(Boolean) as RegistryNode[] : listNodes()
  if (nodeID && targets.length === 0) return { nodeID, available: false, elapsedTime: timeoutMs }
  if (nodeID) return { nodeID, available: true, elapsedTime: Date.now() - started }
  return Object.fromEntries(targets.map((node) => [node.nodeID, { nodeID: node.nodeID, available: true, elapsedTime: Date.now() - started }]))
}
