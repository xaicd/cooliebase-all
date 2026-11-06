import { type CodegenConfig, type CodegenOutput, toKebab } from "./common"

import { tableDdl } from "./column-type"

/**
 * 建表迁移。
 *
 * 为什么必须生成：codegen 会产出 Repository（它按表名查询），但不产出 DDL ——
 * 于是"代码有了、表没有"：内存回退下一切正常，一连真实库就是
 * `relation "..." does not exist`。而且这个缺口**是静默的**（只有真实库才暴露）。
 *
 * 产物落在 `prisma/migrations/<时间戳>_add_<表名>/migration.sql`，
 * 解压/注入后 `prisma migrate deploy` 即可建表；`standards:check` 的
 * table-definition-coverage 规则正是以此为判据。
 *
 * 幂等与 slug 约定（2026-11-06）：组装层（index.ts）按 `existingMigrationDirs`
 * 跳过已存在迁移（engine 自动读磁盘）；表名隔离用 **table.name 直接写带前缀全名**
 * （如 `mrbs_meeting_room`），表名与迁移目录名自动携带前缀——多项目共享库不再撞通用表名。
 */
export function generateTableDdl(config: CodegenConfig): CodegenOutput {
  const tableName = config.table.name
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  const content = `-- 由 Codegen Engine 生成: ${tableName} 的建表迁移
-- 生成时间: ${new Date().toISOString()}
--
-- 为什么必须有这条迁移: Repository 会按表名查询，而此前 codegen 只生成代码、不生成 DDL ——
-- 结果"代码有了、表没有"，内存回退下看不出来，一连真实库就 relation does not exist。

${tableDdl({ name: tableName, comment: config.table.comment, columns: config.table.columns ?? [] })}
`
  return { path: `prisma/migrations/${stamp}_add_${toKebab(tableName)}/migration.sql`, content, type: "sql" }
}

/** 保留: 有些调用方只需要 DDL 文本（如预览）。 */
export function tableDdlText(config: CodegenConfig): string {
  return tableDdl({ name: config.table.name, comment: config.table.comment, columns: config.table.columns ?? [] })
}
