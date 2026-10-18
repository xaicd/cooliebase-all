/**
 * 数据源管理器
 *
 * 根据环境变量 DB_DRIVER / DATABASE_URL 自动选择数据库适配器。
 * 未配置数据库时 fallback 到内存存储，保证开发阶段零配置可运行。
 */

import type { DatabaseDriver, DataSourceConfig, ProtocolFamily, CompatibilityTier } from "./types"

// === 驱动 → 协议族映射 ===
const DRIVER_PROTOCOL_MAP: Record<DatabaseDriver, ProtocolFamily> = {
  postgresql: "postgresql",
  mysql: "mysql",
  mariadb: "mysql",
  sqlserver: "sqlserver",
  sqlite: "sqlite",
  tidb: "mysql",
  oceanbase: "mysql",
  opengauss: "postgresql",
  gaussdb: "postgresql",
  kingbase: "postgresql",
  dm: "proprietary",
  oracle: "proprietary",
  memory: "sqlite",
}

// === 驱动 → 兼容等级映射 ===
const DRIVER_TIER_MAP: Record<DatabaseDriver, CompatibilityTier> = {
  postgresql: "A",
  mysql: "A",
  mariadb: "A",
  sqlserver: "A",
  sqlite: "A",
  tidb: "A",
  oceanbase: "A",
  opengauss: "B",
  gaussdb: "B",
  kingbase: "B",
  dm: "C",
  oracle: "C",
  memory: "A",
}

// === 从 DATABASE_URL 自动检测驱动类型 ===
function detectDriverFromUrl(url: string): DatabaseDriver {
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) return "postgresql"
  if (url.startsWith("mysql://")) return "mysql"
  if (url.startsWith("mariadb://")) return "mariadb"
  if (url.startsWith("sqlserver://") || url.startsWith("mssql://")) return "sqlserver"
  if (url.startsWith("file:") || url.includes(".sqlite") || url.includes(".db")) return "sqlite"
  return "memory"
}

// === 全局数据源实例 ===
let _currentConfig: DataSourceConfig | null = null

export function getDataSourceConfig(): DataSourceConfig {
  if (_currentConfig) return _currentConfig

  const envDriver = process.env.DB_DRIVER as DatabaseDriver | undefined
  const envUrl = process.env.DATABASE_URL ?? ""
  const driver: DatabaseDriver = envDriver ?? (envUrl ? detectDriverFromUrl(envUrl) : "memory")
  // 未知驱动**必须报错**，不能静默降级。
  // 原先这里是 `?? "sqlite"` —— 于是 `DB_DRIVER=postgres`（少个 ql）会被当成 sqlite，
  // 一切"照常工作"，只是行为完全不同（真正的静默失效）。实测: 协议族被识别成 sqlite，
  // 依赖影响行数的原子更新**永远返回 0**，表现为"库存永远不足"。
  if (!(driver in DRIVER_PROTOCOL_MAP)) {
    throw new Error(
      `未知的数据库驱动 DB_DRIVER=${driver}；合法值: ${Object.keys(DRIVER_PROTOCOL_MAP).join(", ")}（注意是 postgresql 不是 postgres）`,
    )
  }
  const protocolFamily = DRIVER_PROTOCOL_MAP[driver]
  const tier = DRIVER_TIER_MAP[driver] ?? "A"
  const poolSize = Number(process.env.DB_POOL_SIZE ?? 10)

  _currentConfig = {
    name: "primary",
    driver,
    url: envUrl || "memory://cooliebase-all",
    tier,
    protocolFamily,
    poolSize,
    timezone: process.env.DB_TIMEZONE || "UTC",
  }

  assertProductionDataSourceConfiguration(_currentConfig)
  return _currentConfig
}

/** Production replicas must never silently fall back to process-local storage. */
export function assertProductionDataSourceConfiguration(config = getDataSourceConfig()): void {
  if (process.env.NODE_ENV !== "production") return
  if (!process.env.DATABASE_URL) throw new Error("生产环境必须配置 DATABASE_URL")
  if (config.driver === "memory") throw new Error("生产环境禁止使用 memory 数据源")
  if (!Number.isInteger(config.poolSize) || config.poolSize < 1) {
    throw new Error("生产环境 DB_POOL_SIZE 必须是正整数")
  }
}

export function isMemoryMode(): boolean {
  return getDataSourceConfig().driver === "memory"
}

export function getProtocolFamily(): ProtocolFamily {
  return getDataSourceConfig().protocolFamily
}

export function getCompatibilityTier(): CompatibilityTier {
  return getDataSourceConfig().tier
}

/** 重置配置（仅用于测试） */
export function resetDataSourceConfig(): void {
  _currentConfig = null
}
