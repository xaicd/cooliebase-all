import { performance } from "node:perf_hooks"
import { Client as PgClient } from "pg"
import mysql from "mysql2/promise"
import { DataSourceConfigRepository, type DataSourceConfigRow } from "@/modules/infra/backend/repositories/data-source-config.repository"
import type { CreateDataSourceConfigInput, DataSourceConfigPageInput, GetQueryConnectionInput, ListQueryDataSourcesInput, TestDataSourceConnectionInput, UpdateDataSourceConfigInput } from "@/modules/infra/backend/validators/data-source-config.validator"
import { cryptoEngine } from "@/modules/shared/backend/lib/crypto-engine"
import { getDataSourceConfig } from "@/modules/shared/backend/lib/database/datasource-manager"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"

const MASTER_ID = "0"
type ConnectionConfig = { driver: string; url: string; username: string; password: string }

function validateConnectionConfig(config: ConnectionConfig) {
  const url = new URL(config.url)
  const protocols: Record<string, string[]> = {
    postgresql: ["postgresql:", "postgres:"], opengauss: ["postgresql:", "postgres:"], gaussdb: ["postgresql:", "postgres:"], kingbase: ["postgresql:", "postgres:"],
    mysql: ["mysql:"], mariadb: ["mariadb:", "mysql:"], tidb: ["mysql:"], oceanbase: ["mysql:"],
  }
  if (!protocols[config.driver]?.includes(url.protocol)) throw new Error("数据源类型与连接地址不匹配")
  if (url.username || url.password) throw new Error("连接地址不得包含用户名或密码")
  if (!url.hostname) throw new Error("数据源连接必须包含主机名")
}

async function connectAndPing(config: ConnectionConfig) {
  validateConnectionConfig(config)
  const startedAt = performance.now()
  if (["postgresql", "opengauss", "gaussdb", "kingbase"].includes(config.driver)) {
    // pg gives credentials embedded in connectionString precedence over separate fields.
    // CoolieBase data-source forms keep URL, username, and password separate, so parse URL
    // into non-credential options and pass form credentials explicitly.
    const url = new URL(config.url)
    const client = new PgClient({
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      database: decodeURIComponent(url.pathname.replace(/^\//, "")) || undefined,
      user: config.username,
      password: config.password,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    })
    try { await client.connect(); await client.query("SELECT 1") } finally { await client.end().catch(() => undefined) }
  } else {
    const connection = await mysql.createConnection({ uri: config.url, user: config.username, password: config.password, connectTimeout: 5000 })
    try { await connection.query("SELECT 1") } finally { await connection.end().catch(() => undefined) }
  }
  return { latencyMs: Math.round(performance.now() - startedAt) }
}

function toResponse(row: DataSourceConfigRow) {
  return { id: row.id, tenantId: row.tenantId, name: row.name, driver: row.driver, url: row.url, username: row.username, remark: row.remark, isMaster: false, hasPassword: true, createdAt: row.createdAt, updatedAt: row.updatedAt }
}

function safeUrlForResponse(value: string) {
  try {
    const url = new URL(value)
    url.username = ""
    url.password = ""
    return url.toString()
  } catch {
    return "已由运行环境配置"
  }
}

function masterResponse() {
  const config = getDataSourceConfig()
  return { id: MASTER_ID, name: config.name, driver: config.driver, url: safeUrlForResponse(config.url), username: "环境变量配置", remark: "系统主数据源，由 DATABASE_URL 管理", isMaster: true, hasPassword: false, createdAt: "", updatedAt: "" }
}

export class DataSourceConfigService {
  static async page(input: DataSourceConfigPageInput) {
    const pageInput = { tenantId: input.tenantId, page: input.page ?? 1, pageSize: input.pageSize ?? 20, keyword: input.keyword }
    const result = await DataSourceConfigRepository.findPage(pageInput)
    const master = masterResponse()
    domainLog.event("infra.data-source-config.page", { tenantId: input.tenantId, page: pageInput.page, total: result.total })
    return { items: pageInput.page === 1 ? [master, ...result.items.map(toResponse)] : result.items.map(toResponse), total: result.total, page: pageInput.page, pageSize: pageInput.pageSize }
  }

  static async get(tenantId: string, id: string) {
    if (!tenantId) throw new Error("请选择归属租户")
    if (id === MASTER_ID) throw new Error("系统主数据源不能分配给租户报表")
    const row = await DataSourceConfigRepository.findById(tenantId, id)
    if (!row) throw new Error("数据源不存在")
    return toResponse(row)
  }

  static async create(input: CreateDataSourceConfigInput) {
    const config: ConnectionConfig = { driver: input.driver!, url: input.url!, username: input.username!, password: input.password! }
    await connectAndPing(config)
    const row = await DataSourceConfigRepository.create({ tenantId: input.tenantId, name: input.name!, driver: config.driver, url: config.url, username: config.username, encryptedPassword: cryptoEngine.encrypt(config.password), remark: input.remark ?? null })
    domainLog.event("infra.data-source-config.create", { id: row.id, tenantId: row.tenantId, driver: row.driver })
    domainLog.audit("infra.data-source-config.create", { targetType: "INFRA_DATA_SOURCE_CONFIG", targetId: row.id })
    return { id: row.id }
  }

  static async update(input: UpdateDataSourceConfigInput) {
    if (input.id === MASTER_ID) throw new Error("系统主数据源不允许修改")
    const current = await DataSourceConfigRepository.findById(input.tenantId, input.id)
    if (!current) throw new Error("数据源不存在")
    const password = input.password || cryptoEngine.decrypt(current.encryptedPassword)
    const config: ConnectionConfig = { driver: input.driver!, url: input.url!, username: input.username!, password }
    await connectAndPing(config)
    const { id } = input
    await DataSourceConfigRepository.update(input.tenantId, id, { name: input.name!, driver: config.driver, url: config.url, username: config.username, remark: input.remark, encryptedPassword: input.password ? cryptoEngine.encrypt(input.password) : undefined })
    domainLog.event("infra.data-source-config.update", { id, tenantId: input.tenantId, driver: config.driver })
    domainLog.audit("infra.data-source-config.update", { targetType: "INFRA_DATA_SOURCE_CONFIG", targetId: id })
    return { id }
  }

  static async delete(tenantId: string, id: string) {
    if (id === MASTER_ID) throw new Error("系统主数据源不允许删除")
    await DataSourceConfigRepository.softDelete(tenantId, id)
    domainLog.event("infra.data-source-config.delete", { id, tenantId })
    domainLog.audit("infra.data-source-config.delete", { targetType: "INFRA_DATA_SOURCE_CONFIG", targetId: id })
    return { success: true }
  }

  static async testConnection(input: TestDataSourceConnectionInput) {
    let config: ConnectionConfig
    if (input.id) {
      if (input.id === MASTER_ID) throw new Error("系统主数据源由运行环境维护，不能在管理端测试")
      const row = await DataSourceConfigRepository.findById(input.tenantId!, input.id)
      if (!row) throw new Error("数据源不存在")
      config = { driver: row.driver, url: row.url, username: row.username, password: cryptoEngine.decrypt(row.encryptedPassword) }
    } else {
      config = { driver: input.driver!, url: input.url!, username: input.username!, password: input.password! }
    }
    const result = await connectAndPing(config)
    domainLog.event("infra.data-source-config.test", { id: input.id, driver: config.driver, latencyMs: result.latencyMs })
    domainLog.audit("infra.data-source-config.test", { targetType: "INFRA_DATA_SOURCE_CONFIG", targetId: input.id ?? "draft" })
    return result
  }

  static async listQueryDataSources(input: ListQueryDataSourcesInput) {
    const page = await DataSourceConfigRepository.findPage({ tenantId: input.tenantId, page: 1, pageSize: 100 })
    return page.items.map(({ id, name, driver }) => ({ id, name, driver }))
  }

  static async getQueryConnection(input: GetQueryConnectionInput) {
    if (input.id === MASTER_ID) return null
    return DataSourceConfigRepository.findById(input.tenantId, input.id)
  }
}
