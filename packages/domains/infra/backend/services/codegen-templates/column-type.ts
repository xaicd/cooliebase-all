/**
 * 低代码列类型 → PostgreSQL 类型。
 *
 * **单一真源**：codegen 的建表迁移模板与 `scripts/generate-table-migration.ts`
 * 都用这份映射。此前只有脚本里有；若 codegen 侧另写一份，两边迟早漂移
 * —— 而类型映射漂移的后果是建出来的表与代码期望不一致（静默、且只在真实库暴露）。
 *
 * `precision`/`scale`/`maxLength` 若在元数据里声明了就**照用**，不能一律给默认值:
 * 例如 10 亿量级的计数字段落到 INTEGER 会**溢出**，必须 BIGINT。
 */
export function pgType(column: {
  name: string
  type: string
  isPk?: boolean
  maxLength?: number
  precision?: number
  scale?: number
}): string {
  // 主键走 TEXT，与仓库既有迁移一致（id 是应用侧生成的字符串，不是自增列）。
  // **本仓约定: id 一律 TEXT** —— 主键与所有外键（`*_id`）都是。
    // **id 类列一律 TEXT**（主键与所有外键 `*_id`）—— 生成仓储写的是 UUID 字符串。
    if (column.isPk || column.name === "id" || column.name.endsWith("_id")) return "TEXT"
  switch (column.type) {
    case "varchar":
      if (column.maxLength) return `VARCHAR(${column.maxLength})`
      // 对齐 docs/architecture/database-design-standard-v1.md §2 长度裁决规则：
      // 租户/编码/状态类 64，名称/标题类 100，描述/备注类 500，其余常规文本 255。
      if (column.name === "tenant_id" || column.name === "company_id") return "VARCHAR(64)"
      if (/^(code|status|type|.*_code|.*_status|.*_type)$/.test(column.name)) return "VARCHAR(64)"
      if (/^(name|title|.*_name|.*_title)$/.test(column.name)) return "VARCHAR(100)"
      if (/^(remark|description|summary|.*_desc|.*_remark)$/.test(column.name)) return "VARCHAR(500)"
      return "VARCHAR(255)"
    case "text":
      return "TEXT"
    case "int":
      return "INTEGER"
    case "bigint":
      return "BIGINT"
    case "timestamp":
      return "TIMESTAMP(3)"
    case "decimal":
      return `DECIMAL(${column.precision ?? 18},${column.scale ?? 4})`
    case "boolean":
      return "BOOLEAN"
    default:
      return "VARCHAR(255)"
  }
}

/** 字面量默认值 -> SQL 片段（字符串加引号；null 显式写出）。 */
export function defaultFromLiteral(value: unknown): string | null {
  if (value === undefined) return null
  if (value === null) return "NULL"
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return `'${String(value).replace(/'/g, "''")}'`
}

/** 单列 DDL 片段。 */
export function columnLine(column: {
  name: string
  type: string
  nullable: boolean
  isPk?: boolean
  defaultValueTyped?: unknown
  defaultSql?: string
  maxLength?: number
  precision?: number
  scale?: number
}): string {
  const parts = [`    "${column.name}" ${pgType(column)}`]
  if (column.nullable !== true) parts.push("NOT NULL")
  // 默认值必须一起带上 —— 只建列不建默认值会静默改变语义。
  const sqlDefault = column.defaultSql ?? defaultFromLiteral(column.defaultValueTyped)
  if (sqlDefault !== null) parts.push(`DEFAULT ${sqlDefault}`)
  return parts.join(" ")
}

/** 单表 CREATE TABLE 语句（含主键与 tenant_id 索引）。 */
export function tableDdl(table: {
  name: string
  comment?: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    isPk?: boolean
    defaultValueTyped?: unknown
    defaultSql?: string
    maxLength?: number
    precision?: number
    scale?: number
  }>
}): string {
  const columns = table.columns ?? []
  const pk = columns.filter((column) => column.isPk).map((column) => column.name)
  const lines = columns.map(columnLine)
  if (pk.length > 0) {
    lines.push(`    CONSTRAINT "${table.name}_pkey" PRIMARY KEY (${pk.map((name) => `"${name}"`).join(", ")})`)
  }
  // 幂等: 这些表可能**已由更早的迁移建过**（先有域、后补元数据的情况很常见）。
  // 不加 IF NOT EXISTS 的话，全新库上 `prisma migrate deploy` 会直接失败在
  // `relation "x" already exists` —— 实测踩到过，且只在全新建库时暴露。
  const statements = [`CREATE TABLE IF NOT EXISTS "${table.name}" (\n${lines.join(",\n")}\n);`]
  // **列级收敛** —— 只靠 CREATE TABLE IF NOT EXISTS 不够（实测踩到）:
  // 表若已由更早的迁移建过，`IF NOT EXISTS` 会让整条 CREATE 变成 no-op，
  // 于是「表存在但列不全」这种**漂移被静默忽略** —— 仓储按元数据写入时才发现
  // `column "deleted" does not exist`（真实库模式 197 个测试因此失败）。
  // 逐列 ADD COLUMN IF NOT EXISTS 把漂移收敛回来，对全新库则是 no-op。
  // 主键列不在此列 —— 已存在的表无法用 ADD COLUMN 补主键。
  for (const column of columns) {
    if (column.isPk) continue
    statements.push(`ALTER TABLE "${table.name}" ADD COLUMN IF NOT EXISTS ${columnLine(column).trim()};`)
    // 表若已由更早的迁移建过，`CREATE TABLE IF NOT EXISTS` 会跳过 -> 老列类型留着（如 bigint），
    // 而仓储写的是 UUID -> `invalid input syntax for type bigint: "<uuid>"`。
    // 只对 **id 类列**做类型收敛（上次对全部列一刀切，把别的转换也改了，导致迁移失败）。
    if (column.isPk || column.name === "id" || column.name.endsWith("_id")) {
      statements.push(`ALTER TABLE "${table.name}" ALTER COLUMN "${column.name}" TYPE TEXT USING "${column.name}"::TEXT;`)
    }
  }
  // 多租户过滤（AGENTS §4.8 & database-design-standard-v1 §4）必建索引。
  if (columns.some((column) => column.name === "tenant_id")) {
    statements.push(`CREATE INDEX IF NOT EXISTS "${table.name}_tenant_id_idx" ON "${table.name}"("tenant_id");`)
  }
  if (columns.some((column) => column.name === "company_id")) {
    statements.push(`CREATE INDEX IF NOT EXISTS "${table.name}_company_id_idx" ON "${table.name}"("company_id");`)
  }
  return `-- ${table.comment ?? table.name}\n${statements.join("\n")}`
}
