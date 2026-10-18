/**
 * 第一方插件自带的迁移执行器。
 *
 * 为什么需要：Paperclip 的第一方插件自带 `migrations/`（如 plugin-ontology 有 18 个 SQL）——
 * 这样「插件 = 自包含包（代码 + 迁移 + 测试 + 路由）」才成立。我们此前只能走 plugin_state
 * 扩展表那条路，插件带不走自己的表。
 *
 * 三条安全边界（这是本文件存在的全部理由，缺一条都不该开）：
 *
 * 1. **只执行宿主信任的插件**。信任来自运营配置（COOLIEBASE_TRUSTED_PLUGIN_KEYS），
 *    不能由 manifest 自封 —— 否则任何插件都能自带迁移。第三方插件仍走扩展表。
 *
 * 2. **严格隔离在插件自己的 schema**（plugin_<key>）。执行时 search_path 只指向该 schema，
 *    且静态拒绝任何显式 schema 限定（pubic.xxx）、DROP SCHEMA、GRANT/REVOKE、角色/扩展 DDL 等 ——
 *    否则一个插件就能 DROP 宿主表。宿主表（public）对它不可见。
 *
 * 3. **幂等**：按文件名记录在 plugin_migration；同名文件不重复执行。
 *    宿主不假定迁移文件不可变（改了就算新内容重新应用），安全性由插件作者负责。
 *
 * 传输用 `pg` 的 Client 而不是 Prisma：DDL 常含多条语句，Prisma 的执行接口按单语句走，
 * 多语句会失败；`pg` 无参数 query 走简单协议，可以一次发多条。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

import { Client } from "pg"

import { cooliebasePrisma } from "../prisma"

/** 插件数据所在的 schema 名。只允许 [a-z0-9_]，避免注入与引号问题。 */
export function pluginSchemaName(pluginKey: string): string {
  return `plugin_${pluginKey.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`.slice(0, 60)
}

/**
 * 去掉 SQL 注释后再检查。
 *
 * 必须这么做: 示例迁移的注释里就出现了 "public." 这种字样（用它解释规则），
 * 不剥注释会把**注释**当成越界语句误报。护栏要检查的是**可执行 SQL**。
 * 剥离只会让检查更保守地看到更少文本 —— 而被剥掉的部分本来也不会执行。
 */
export function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
}

/** 迁移 SQL 的静态护栏。宁可拒绝，也不要执行一条可能越界的语句。 */
export function assertMigrationSqlSafe(sql: string): void {
  const executable = stripSqlComments(sql)
  const forbidden: Array<[RegExp, string]> = [
    [/\bdrop\s+schema\b/i, "不允许 DROP SCHEMA"],
    [/\bset\s+(local\s+)?search_path\b/i, "不允许自行改动 search_path（宿主已固定）"],
    [/public\s*\./i, "不允许直接引用 public schema（宿主表不可见）"],
    [/\b(create|drop|alter)\s+(role|user|extension|database|tablespace)\b/i, "不允许角色/用户/扩展/库级 DDL"],
    [/\b(grant|revoke)\b/i, "不允许 GRANT / REVOKE"],
    [/\balter\s+system\b/i, "不允许 ALTER SYSTEM"],
    [/\bcopy\b[^;]*\bprogram\b/i, "不允许 COPY ... PROGRAM"],
    [/\b(insert\s+into|update|delete\s+from)\s+pg_/i, "不允许写系统目录"],
  ]
  for (const [pattern, reason] of forbidden) {
    if (pattern.test(executable)) throw new Error(`插件迁移被拒绝：${reason}`)
  }
}

/**
 * 宿主是否信任该插件（是否允许它自带迁移）。
 * 只认运营配置：`COOLIEBASE_TRUSTED_PLUGIN_KEYS=vendor.plugin-a,vendor.plugin-b`。
 * 刻意**不接受** manifest 自封的信任声明 —— 否则任何插件都能给自己发许可。
 */
export function trustedPluginKeys(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.COOLIEBASE_TRUSTED_PLUGIN_KEYS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function isTrustedPlugin(pluginKey: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return trustedPluginKeys(env).includes(pluginKey)
}

export type PluginMigrationResult = {
  schema: string
  applied: string[]
  skipped: string[]
  /** 未执行的原因（不信任 / 无目录 等）。null 表示正常执行。 */
  skippedReason: string | null
}

/**
 * 执行插件的自带迁移。`trusted` 必须由调用方按宿主配置判定 —— 本函数不猜。
 */
export async function runPluginMigrations(input: {
  pluginKey: string
  packagePath: string
  dir: string
  trusted: boolean
}): Promise<PluginMigrationResult> {
  const schema = pluginSchemaName(input.pluginKey)
  const empty = { schema, applied: [], skipped: [], skippedReason: null } as PluginMigrationResult

  if (!input.trusted) {
    return { ...empty, skippedReason: "宿主未信任该插件，跳过自带迁移（第三方插件请用 plugin_state 扩展表）" }
  }

  const migrationsRoot = path.resolve(input.packagePath)
  const dirAbs = path.resolve(input.packagePath, input.dir)
  // 与 manifest/worker 同一道防线：迁移目录不许越出插件包
  if (!dirAbs.startsWith(migrationsRoot + path.sep)) {
    throw new Error(`迁移目录越出插件包目录: ${input.dir}`)
  }
  if (!existsSync(dirAbs)) {
    return { ...empty, skippedReason: `迁移目录不存在: ${input.dir}` }
  }

  const files = readdirSync(dirAbs)
    .filter((name) => name.endsWith(".sql"))
    .sort()
  if (files.length === 0) return { ...empty, skippedReason: "迁移目录里没有 .sql 文件" }

  const records = await cooliebasePrisma.pluginMigration.findMany({ where: { pluginKey: input.pluginKey } })
  const done = new Set(records.map((record) => record.name))

  const applied: string[] = []
  const skipped: string[] = []
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
    for (const file of files) {
      if (done.has(file)) {
        skipped.push(file)
        continue
      }
      const sql = readFileSync(path.join(dirAbs, file), "utf8")
      assertMigrationSqlSafe(sql)

      await client.query("BEGIN")
      try {
        // 只把插件自己的 schema 放进 search_path —— 未加限定的表名都落在这里
        await client.query(`SET LOCAL search_path TO "${schema}"`)
        await client.query(sql)
        await client.query("COMMIT")
      } catch (error) {
        await client.query("ROLLBACK")
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`插件迁移 ${file} 执行失败（已回滚）：${message}`)
      }
      await cooliebasePrisma.pluginMigration.create({
        data: { pluginKey: input.pluginKey, name: file, schema },
      })
      applied.push(file)
    }
  } finally {
    await client.end()
  }

  return { schema, applied, skipped, skippedReason: null }
}
