/**
 * Kysely 多数据库客户端工厂
 *
 * 支持的驱动族：
 * - PostgreSQL 族（含 openGauss/KingbaseES）→ PostgresDialect
 * - MySQL 族（含 TiDB/OceanBase/MariaDB）→ MysqlDialect
 * - Memory（开发模式）→ DummyDriver（查询不执行，走内存 Repository）
 */

import { Kysely, DummyDriver, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely"
import { getDataSourceConfig, isMemoryMode } from "./datasource-manager"
import { writeCompactError } from "../observability"
import { tenantIsolationPlugin } from "./tenant-isolation-plugin"
import { multiDataSourceManager } from "./multi-datasource-manager"
import type { DatabaseDriver, DataSourceConfig } from "./types"
import type { DB } from "./schema"

// === Dialect 工厂 ===

async function createPostgresDialect(url: string) {
  const { PostgresDialect } = await import("kysely")
  const pg = await import("pg")
  const pool = new pg.default.Pool({
    connectionString: url,
    max: Math.max(1, Number(process.env.DB_POOL_SIZE ?? 10)),
    connectionTimeoutMillis: Math.max(1_000, Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 5_000)),
    idleTimeoutMillis: Math.max(1_000, Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30_000)),
  })
  pool.on("error", (error) => writeCompactError("database.pool.error", error, { driver: "postgresql" }))
  return new PostgresDialect({ pool })
}

async function createMysqlDialect(url: string) {
  const { MysqlDialect } = await import("kysely")
  const mysql = await import("mysql2")
  return new MysqlDialect({
    pool: mysql.default.createPool(url),
  })
}

function sanitizeSqliteParams(arg: any): any {
  if (typeof arg === "boolean") return arg ? 1 : 0
  if (Array.isArray(arg)) return arg.map(sanitizeSqliteParams)
  if (arg && typeof arg === "object" && !(arg instanceof Buffer) && !(arg instanceof Uint8Array)) {
    const copy: Record<string, any> = {}
    for (const [k, v] of Object.entries(arg)) copy[k] = sanitizeSqliteParams(v)
    return copy
  }
  return arg
}

async function createSqliteDialect(url: string) {
  const { SqliteDialect } = await import("kysely")
  const Database = (await import("better-sqlite3")).default
  const path = await import("path")
  const fs = await import("fs")

  let dbPath = (url || "file:./data/cooliebase.db").replace(/^file:/, "")
  if (!dbPath || dbPath === ":memory:") {
    dbPath = ":memory:"
  } else {
    const dir = path.dirname(dbPath)
    if (dir && dir !== "." && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const db = new Database(dbPath)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  // better-sqlite3 仅支持 number, string, bigint, buffer, null，不支持 JS boolean。
  // 包装 prepare 自动将查询参数中的 boolean (true/false) 转为 SQLite 整型 (1/0)。
  const origPrepare = db.prepare.bind(db)
  db.prepare = function (sql: string) {
    const stmt = origPrepare(sql)
    const wrap = (fn: any) =>
      function (this: any, ...args: any[]) {
        const sanitized = args.map(sanitizeSqliteParams)
        return fn.apply(stmt, sanitized)
      }
    stmt.all = wrap(stmt.all)
    stmt.get = wrap(stmt.get)
    stmt.run = wrap(stmt.run)
    stmt.iterate = wrap(stmt.iterate)
    return stmt
  } as any

  return new SqliteDialect({ database: db })
}

function createDummyDialect() {
  return {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db: any) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  }
}

// === 驱动族映射 ===
const DRIVER_FAMILY: Record<DatabaseDriver, "pg" | "mysql" | "sqlite" | "dummy"> = {
  postgresql: "pg",
  mysql: "mysql",
  mariadb: "mysql",
  tidb: "mysql",
  oceanbase: "mysql",
  opengauss: "pg",
  gaussdb: "pg",
  kingbase: "pg",
  sqlserver: "dummy",  // TODO: 添加 MSSQL dialect
  sqlite: "sqlite",
  dm: "dummy",
  oracle: "dummy",
  memory: "dummy",
}

// === 全局单例 ===
let _kyselyInstance: Kysely<DB> | null = null

/**
 * 根据数据源配置创建独立的 Kysely 实例
 */
export async function createKyselyInstance(config: DataSourceConfig): Promise<Kysely<DB>> {
  const family = DRIVER_FAMILY[config.driver] ?? "dummy"
  let dialect: any

  switch (family) {
    case "pg":
      dialect = await createPostgresDialect(config.url)
      break
    case "mysql":
      dialect = await createMysqlDialect(config.url)
      break
    case "sqlite":
      dialect = await createSqliteDialect(config.url)
      break
    default:
      dialect = createDummyDialect()
  }

  return new Kysely<DB>({ dialect, plugins: [tenantIsolationPlugin] })
}

/**
 * 获取 Kysely 数据库实例（单例与动态多数据源感知）
 *
 * 内存模式下使用 DummyDriver（查询不执行），
 * 业务数据通过 Repository 的内存实现提供。
 */
export async function getKyselyDb(): Promise<Kysely<DB>> {
  const activeDs = multiDataSourceManager.getActiveDataSourceName()
  if (activeDs !== multiDataSourceManager.getDefaultSourceName() && multiDataSourceManager.hasDataSource(activeDs)) {
    return multiDataSourceManager.getDataSource(activeDs)
  }

  if (_kyselyInstance) return _kyselyInstance

  const config = getDataSourceConfig()
  _kyselyInstance = await createKyselyInstance(config)
  if (!multiDataSourceManager.hasDataSource("primary")) {
    multiDataSourceManager.registerDataSource("primary", _kyselyInstance)
  }
  return _kyselyInstance
}

/**
 * 判断当前是否有真实数据库连接可用
 */
export function hasRealDatabase(): boolean {
  const config = getDataSourceConfig()
  const family = DRIVER_FAMILY[config.driver] ?? "dummy"
  return family !== "dummy" && !isMemoryMode()
}

/** 销毁连接（用于 shutdown） */
export async function destroyKyselyDb(): Promise<void> {
  if (_kyselyInstance) {
    await _kyselyInstance.destroy()
    _kyselyInstance = null
  }
  await multiDataSourceManager.closeAllDataSources()
}

