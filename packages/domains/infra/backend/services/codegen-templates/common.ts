// Common types and helpers for codegen templates

export interface ConfiguredColumn {
  name: string
  type: string
  tsType: string
  nullable: boolean
  comment: string
  isPk?: boolean
  isAutoIncrement?: boolean
  columnKey?: string
  extra?: string
  maxLength?: number
  precision?: number
  scale?: number
  enumValues?: string[]
  /** 值 → 中文标签（可选）。给 agent 与前端共用同一套口径。 */
  enumLabels?: Record<string, string>
  /** 终态值（可选）：到达这些状态后不再有合法迁移。 */
  enumTerminal?: string[]
  defaultValueTyped?: unknown
  /**
   * 建表时的 SQL 默认值**表达式**（如 `CURRENT_TIMESTAMP`）。
   * 字面量默认值（数字/布尔/字符串）用 `defaultValueTyped`；这个字段留给无法用字面量
   * 表达的情况。生成迁移时两者都会输出为 `DEFAULT ...` —— 漏掉默认值等于**静默改语义**
   * （例如 `auto_throttle` 默认 false 丢了，行的初始状态就变了）。
   */
  defaultSql?: string
  formValidation?: "required" | "optional"
  widget?: string
  queryType?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    ruleKeys?: string[]
  }
  query?: {
    required?: boolean
    operator?: string
    defaultValue?: unknown
  }
}

export interface CodegenMasterDetailChild {
  code: string
  tableName: string
  foreignKeyField: string
  fields: Array<ConfiguredColumn & { readOnly?: boolean; uiComponent?: string }>
}

export type CodegenTemplateType = "CRUD" | "TREE" | "MASTER_DETAIL"

export interface CodegenConfig {
  table: {
    name: string
    comment: string
    columns: ConfiguredColumn[]
  }
  moduleName: string
  businessName: string
  className: string
  parentMenuId?: string
  template?: CodegenTemplateType
  submodule?: string
  packagePath?: string
  author?: string
  permissionPrefix?: string
  advanced?: {
    model?: {
      tree?: {
        parentField: string
        nameField: string
      }
      masterDetail?: {
        children: CodegenMasterDetailChild[]
      }
    }
  }
  onlineRuntime?: {
    storageKind?: "MANAGED_TABLE" | "PHYSICAL_TABLE"
    domain?: string
    tableId?: string
  }
}

export interface CodegenOutput {
  path: string
  content: string
  type: "type" | "validator" | "repository" | "service" | "rpc" | "route" | "api" | "component" | "page" | "appPage" | "test" | "sql"
}

/**
 * 把注释渲染成**安全的 JSX 文本**。
 *
 * 列注释来自数据源（表元数据 / 源框架 javadoc），可能含 `{` `}` `<` `>` ——
 * 直接插进 JSX 会被当成表达式或标签，**编译期**才炸（`Expected '</', got '#'`）。
 * 这里 KEEP 语义、去掉标记: `{@link X#y()}` 这类 javadoc 内联标签整段去掉。
 */
export function jsxText(text: string): string {
  return (text || "")
    .replace(/\{@[a-z]+\s+[^}]*\}/gi, "") // javadoc 内联标签整段去掉
    .replace(/[{}<>]/g, "")                  // 其余 JSX 敏感字符
    .replace(/\s+/g, " ")
    .trim()
}

export function toPascal(str: string): string {
  return str.replace(/(?:^|[_\s-])(\w)/g, (_, c) => c.toUpperCase())
}

export function toCamel(str: string): string {
  const p = toPascal(str)
  return p.charAt(0).toLowerCase() + p.slice(1)
}

export function toKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_]/g, "-")
    .toLowerCase()
}

export function toConstant(str: string): string {
  return toKebab(str).replace(/-/g, "_").toUpperCase()
}

/**
 * 域的**真实目录**（生成物的落点）。
 *
 * 域被改造成第一方插件后目录在 packages/plugins/plugin-<name>。
 * 写死 packages/domains 会让生成物落到旧路径 —— 最坏的地方是它**不会报错**:
 * 代码照写、路径合法，但应用里的 @/modules/<name> 别名指向真实位置，
 * 于是新功能"生成了却不通"。这里与脚本侧的 domainDirOf 保持同一套判定顺序
 * （插件优先，避免残留旧目录造成反馈回路）。
 */
export function domainBaseDir(moduleName: string): string {
  const pluginDir = `packages/plugins/plugin-${moduleName}`
  try {
    // 服务端专用（生成器只在服务端跑）。用 require 而不是 import 顶层引入,
    // 避免把 node:fs 带进可能被前端引用的模块图。
    const fs = require("node:fs") as typeof import("node:fs")
    const path = require("node:path") as typeof import("node:path")
    if (fs.existsSync(path.join(process.cwd(), pluginDir))) return pluginDir
  } catch {
    // 拿不到文件系统时按旧布局处理，保持纯函数可测
  }
  return `packages/domains/${moduleName}`
}

export function getBackendPath(config: CodegenConfig): string {
  const { moduleName, submodule } = config
  const sub = submodule ? `/${submodule}` : ""
  return `${domainBaseDir(moduleName)}${sub}/backend`
}

export function getFrontendPath(config: CodegenConfig): string {
  const { moduleName, submodule } = config
  const sub = submodule ? `/${submodule}` : ""
  return `${domainBaseDir(moduleName)}${sub}/frontend`
}

const MANAGED_COLUMNS = new Set([
  "id", "tenant_id", "created_by", "creator", "updated_by", "updater",
  "created_at", "create_time", "updated_at", "update_time", "deleted",
])

export function isManagedColumn(column: ConfiguredColumn): boolean {
  return MANAGED_COLUMNS.has(column.name.toLowerCase())
}

export function configuredColumns(config: CodegenConfig): ConfiguredColumn[] {
  return config.table.columns
}

export function formColumns(config: CodegenConfig): ConfiguredColumn[] {
  return config.table.columns.filter((c) => !isManagedColumn(c))
}

export function queryColumns(config: CodegenConfig): ConfiguredColumn[] {
  return config.table.columns.filter((c) => !isManagedColumn(c) && c.queryType && c.queryType !== "NONE")
}

export function hasTableColumn(config: CodegenConfig, name: string): boolean {
  return config.table.columns.some((c) => c.name.toLowerCase() === name.toLowerCase())
}

export function persistOrderColumn(config: CodegenConfig): string {
  const columns = config.table.columns.map((c) => c.name.toLowerCase())
  if (columns.includes("sort")) return "sort"
  if (columns.includes("create_time")) return "create_time"
  if (columns.includes("created_at")) return "created_at"
  return "id"
}
