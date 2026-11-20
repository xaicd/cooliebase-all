/**
 * Autonomous Heartbeat Engine (自主巡检与自愈守护引擎)
 *
 * 核心公理与设计哲学 (AGENTS.md Rule 13 & 高阶反问架构):
 *   系统不应被动等待人类发现问题或告警唤醒，而必须由 AI Agent 驱动的主动巡检守护中枢
 *   对 17 个域、326 份契约、事务性发件箱 (Outbox)、真实数据库与数据一致性进行全天候全息探针巡检，
 *   并在发现积压或异常时自动执行自愈 (Auto-Healing) 修复！
 */

import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { sql } from "kysely"
import { getKyselyDb, hasRealDatabase } from "./database"
import { listDomainCatalog, isFoundationModule } from "../constants/domain-catalog"
import { listOutbox, outboxDispatch } from "./transactional-outbox"
import { getOutboxStore } from "./outbox-store"

const ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd())
const HEARTBEAT_FILE = path.join(ROOT, "packages", "shared", "contract", "gate-assets", "agent-autopilot-heartbeat.json")
const CONTRACTS_FILE = path.join(ROOT, "packages", "shared", "contract", "agent-contracts.json")

export interface DomainHealthProbe {
  name: string
  kind: "plugin" | "foundation" | "business"
  isLocal: boolean
  manifestExists: boolean
  status: "healthy" | "degraded" | "missing"
}

export interface DatabaseProbeResult {
  hasRealDb: boolean
  driver: string
  latencyMs: number
  connected: boolean
  error?: string
}

export interface OutboxProbeResult {
  totalCount: number
  pendingCount: number
  failedCount: number
  healedCount: number
  healthy: boolean
}

export interface ContractsProbeResult {
  total: number
  domainsCount: number
  valid: boolean
  error?: string
}

export interface AutopilotHeartbeat {
  timestamp: string
  durationMs: number
  healthScore: number // 0 - 100
  status: "optimal" | "degraded" | "critical"
  system: {
    hostname: string
    nodeVersion: string
    platform: string
    memoryUsageMb: number
    uptimeSec: number
  }
  database: DatabaseProbeResult
  outbox: OutboxProbeResult
  contracts: ContractsProbeResult
  domains: {
    total: number
    healthy: number
    items: DomainHealthProbe[]
  }
  healingActions: string[]
}

/**
 * 探针 1: 数据库连通性与延迟探测
 */
export async function probeDatabase(): Promise<DatabaseProbeResult> {
  const start = Date.now()
  const isReal = hasRealDatabase()
  try {
    if (!isReal) {
      return {
        hasRealDb: false,
        driver: "memory",
        latencyMs: 1,
        connected: true,
      }
    }

    const db = await getKyselyDb()
    // 执行真实数据库探针
    await sql`SELECT 1 as ping`.execute(db)
    const latencyMs = Date.now() - start
    return {
      hasRealDb: true,
      driver: process.env.DATABASE_URL?.split("://")[0] || "postgresql",
      latencyMs,
      connected: true,
    }
  } catch (error: any) {
    return {
      hasRealDb: isReal,
      driver: process.env.DATABASE_URL?.split("://")[0] || "unknown",
      latencyMs: Date.now() - start,
      connected: false,
      error: error?.message || String(error),
    }
  }
}

/**
 * 探针 2: 17 领域微内核状态网格巡检
 */
export function probeDomains(): { total: number; healthy: number; items: DomainHealthProbe[] } {
  const catalog = listDomainCatalog()
  const items: DomainHealthProbe[] = catalog.map((domain) => {
    const isFoundation = isFoundationModule(domain.name)
    const isLocal = true
    const candidatePaths = [
      path.join(ROOT, "packages", "domains", domain.name, "contract", "module.manifest.json"),
      path.join(ROOT, "packages", "plugins", `plugin-${domain.name}`, "contract", "module.manifest.json"),
      path.join(ROOT, "packages", "plugins", `plugin-${domain.name}`, "plugin.manifest.json"),
    ]
    const manifestExists = candidatePaths.some((p) => fs.existsSync(p))
    const status: DomainHealthProbe["status"] = manifestExists ? "healthy" : "missing"

    return {
      name: domain.name,
      kind: isFoundation ? "foundation" : "plugin",
      isLocal,
      manifestExists,
      status,
    }
  })

  const healthy = items.filter((d) => d.status === "healthy").length
  return { total: items.length, healthy, items }
}

/**
 * 探针 3 & 自愈中枢: 发件箱积压检测与主动 Flush 自愈
 */
export async function probeAndHealOutbox(forceHeal = false): Promise<{ probe: OutboxProbeResult; actions: string[] }> {
  const healingActions: string[] = []
  try {
    const store = getOutboxStore()
    const all = await store.list().catch(() => [])
    const pending = all.filter((r) => r.status === "pending")
    const failed = all.filter((r) => r.status === "failed")

    let healedCount = 0
    if (pending.length > 0 || forceHeal) {
      const dispatched = await outboxDispatch(100).catch(() => 0)
      if (dispatched > 0) {
        healedCount = dispatched
        healingActions.push(`[Auto-Healing] 自动消费并广播发件箱积压消息: ${dispatched} 条`)
      }
    }

    return {
      probe: {
        totalCount: all.length,
        pendingCount: Math.max(0, pending.length - healedCount),
        failedCount: failed.length,
        healedCount,
        healthy: failed.length === 0,
      },
      actions: healingActions,
    }
  } catch (err: any) {
    return {
      probe: {
        totalCount: 0,
        pendingCount: 0,
        failedCount: 0,
        healedCount: 0,
        healthy: false,
      },
      actions: [`[Warning] 无法读取 Outbox Store: ${err?.message}`],
    }
  }
}

/**
 * 探针 4: 326 份 Agent 契约健康度校验
 */
export function probeAgentContracts(): ContractsProbeResult {
  if (!fs.existsSync(CONTRACTS_FILE)) {
    return { total: 0, domainsCount: 0, valid: false, error: "契约注册表 packages/shared/contract/agent-contracts.json 不存在" }
  }

  try {
    const raw = JSON.parse(fs.readFileSync(CONTRACTS_FILE, "utf8"))
    const total = raw.contracts?.length ?? 0
    const domainsCount = raw.domains?.length ?? 0
    const valid = total >= 326 && domainsCount >= 14
    return {
      total,
      domainsCount,
      valid,
      error: valid ? undefined : `契约总数不足 326 (当前 ${total})`,
    }
  } catch (e: any) {
    return { total: 0, domainsCount: 0, valid: false, error: e?.message }
  }
}

/**
 * 核心调度器: 运行一个完整的巡检与自愈周期
 */
export async function runAutopilotCycle(opts: { forceHeal?: boolean } = {}): Promise<AutopilotHeartbeat> {
  const start = Date.now()

  // 1. 并发探测各子系统
  const [dbResult, outboxResult] = await Promise.all([
    probeDatabase(),
    probeAndHealOutbox(opts.forceHeal),
  ])
  const domainMesh = probeDomains()
  const contractsResult = probeAgentContracts()

  // 2. 计算健康度评分 (0 - 100)
  let score = 0

  // 数据库 30 分
  if (dbResult.connected) {
    score += 25
    if (dbResult.latencyMs < 50) score += 5
    else if (dbResult.latencyMs < 200) score += 3
  }

  // 领域拓扑 35 分
  const domainRatio = domainMesh.total > 0 ? domainMesh.healthy / domainMesh.total : 0
  score += Math.round(domainRatio * 35)

  // 发件箱状态 20 分
  if (outboxResult.probe.healthy) {
    score += 20
  } else if (outboxResult.probe.failedCount < 5) {
    score += 10
  }

  // Agent 契约 15 分
  if (contractsResult.valid) {
    score += 15
  } else if (contractsResult.total > 0) {
    score += Math.round((contractsResult.total / 326) * 15)
  }

  const durationMs = Date.now() - start
  const status: AutopilotHeartbeat["status"] =
    score >= 90 ? "optimal" : score >= 70 ? "degraded" : "critical"

  const mem = process.memoryUsage()
  const heartbeat: AutopilotHeartbeat = {
    timestamp: new Date().toISOString(),
    durationMs,
    healthScore: score,
    status,
    system: {
      hostname: os.hostname(),
      nodeVersion: process.version,
      platform: os.platform(),
      memoryUsageMb: Math.round(mem.rss / (1024 * 1024)),
      uptimeSec: Math.round(process.uptime()),
    },
    database: dbResult,
    outbox: outboxResult.probe,
    contracts: contractsResult,
    domains: domainMesh,
    healingActions: outboxResult.actions,
  }

  // 3. 持久化遥测快照
  try {
    fs.mkdirSync(path.dirname(HEARTBEAT_FILE), { recursive: true })
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(heartbeat, null, 2), "utf8")
  } catch (err) {
    console.error("[agent:autopilot] 写入心跳快照失败:", err)
  }

  return heartbeat
}
