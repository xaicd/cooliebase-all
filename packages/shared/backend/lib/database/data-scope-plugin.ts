import { AsyncLocalStorage } from "node:async_hooks"
import {
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
  OperationNodeTransformer,
  SelectQueryNode,
  UpdateQueryNode,
  DeleteQueryNode,
  WhereNode,
  BinaryOperationNode,
  ColumnNode,
  ValueNode,
  ValueListNode,
  OperatorNode,
  TableNode,
} from "kysely"

/**
 * 数据权限范围枚举（对标 yudao DataScopeEnum / @DataPermission 5 级数据权限体系）
 *
 * 1 - ALL: 全部数据权限（仅受租户隔离约束，不追加部门/本人 WHERE 条件）
 * 2 - DEPT_CUSTOM: 指定部门数据权限（WHERE dept_id IN (...customDeptIds)）
 * 3 - DEPT_ONLY: 本部门数据权限（WHERE dept_id = userDeptId）
 * 4 - DEPT_AND_CHILD: 本部门及以下数据权限（WHERE dept_id IN (userDeptId, ...childDeptIds)）
 * 5 - SELF_ONLY: 仅本人数据权限（WHERE created_by = userId）
 */
export const DataScopeEnum = {
  ALL: 1,
  DEPT_CUSTOM: 2,
  DEPT_ONLY: 3,
  DEPT_AND_CHILD: 4,
  SELF_ONLY: 5,
} as const

export type DataScopeLevel = (typeof DataScopeEnum)[keyof typeof DataScopeEnum]

export interface DataScopeContext {
  /** 数据范围级别（1~5） */
  scope: DataScopeLevel
  /** 当前操作人用户 ID（SELF_ONLY 必填） */
  userId?: string
  /** 当前操作人所属部门 ID（DEPT_ONLY / DEPT_AND_CHILD 使用） */
  userDeptId?: string
  /** 自定义授权部门列表或本部门及子孙部门列表（DEPT_CUSTOM / DEPT_AND_CHILD 使用） */
  deptIds?: string[]
  /** 部门列名，默认 "dept_id" */
  deptColumn?: string
  /** 创建人列名，默认 "created_by" */
  userColumn?: string
  /** 限定生效的业务表名白名单（为空时对所有非平台豁免表生效） */
  tables?: string[]
}

const dataScopeStorage = new AsyncLocalStorage<DataScopeContext>()

/**
 * 在指定的数据权限上下文中运行回调，期间所有 Kysely 查询自动在 AST 层注入对应的部门/本人过滤条件
 */
export function runWithDataScope<T>(ctx: DataScopeContext, fn: () => T): T {
  return dataScopeStorage.run(ctx, fn)
}

/**
 * 获取当前异步上下文的数据权限配置
 */
export function getCurrentDataScope(): DataScopeContext | undefined {
  return dataScopeStorage.getStore()
}

/**
 * 系统平台级元数据表（不参与部门/本人行级数据范围过滤）
 */
const DATA_SCOPE_EXEMPT_TABLES = new Set([
  "system_tenant",
  "system_tenant_package",
  "system_tenant_package_menu",
  "system_menu",
  "system_dict_type",
  "system_dict_data",
  "infra_data_source_config",
  "infra_codegen_table",
  "infra_codegen_column",
  "plugin",
  "plugin_state",
  "plugin_config",
  "plugin_migration",
])

/**
 * 构建当前数据范围对应的 Kysely AST 二元谓词节点
 */
function buildDataScopePredicate(ctx: DataScopeContext): BinaryOperationNode | null {
  const deptCol = ctx.deptColumn || "dept_id"
  const userCol = ctx.userColumn || "created_by"

  switch (ctx.scope) {
    case DataScopeEnum.ALL:
      return null

    case DataScopeEnum.DEPT_ONLY: {
      const targetDept = ctx.userDeptId || "__NO_DEPT_ASSIGNED__"
      return BinaryOperationNode.create(
        ColumnNode.create(deptCol),
        OperatorNode.create("="),
        ValueNode.create(targetDept),
      )
    }

    case DataScopeEnum.DEPT_CUSTOM:
    case DataScopeEnum.DEPT_AND_CHILD: {
      const rawIds = [
        ...(ctx.scope === DataScopeEnum.DEPT_AND_CHILD && ctx.userDeptId ? [ctx.userDeptId] : []),
        ...(ctx.deptIds ?? []),
      ]
      const uniqueDeptIds = Array.from(new Set(rawIds.filter(Boolean)))
      if (uniqueDeptIds.length === 0) {
        return BinaryOperationNode.create(
          ColumnNode.create(deptCol),
          OperatorNode.create("="),
          ValueNode.create("__EMPTY_DATA_SCOPE__"),
        )
      }
      if (uniqueDeptIds.length === 1) {
        return BinaryOperationNode.create(
          ColumnNode.create(deptCol),
          OperatorNode.create("="),
          ValueNode.create(uniqueDeptIds[0]),
        )
      }
      return BinaryOperationNode.create(
        ColumnNode.create(deptCol),
        OperatorNode.create("in"),
        ValueListNode.create(uniqueDeptIds.map((id) => ValueNode.create(id))),
      )
    }

    case DataScopeEnum.SELF_ONLY: {
      const targetUser = ctx.userId || "__ANONYMOUS_DATA_SCOPE__"
      return BinaryOperationNode.create(
        ColumnNode.create(userCol),
        OperatorNode.create("="),
        ValueNode.create(targetUser),
      )
    }

    default:
      return null
  }
}

class DataScopeTransformer extends OperationNodeTransformer {
  private readonly ctx: DataScopeContext

  constructor(ctx: DataScopeContext) {
    super()
    this.ctx = ctx
  }

  private extractTableName(node: unknown): string | null {
    if (!node || typeof node !== "object") return null
    const n = node as { kind?: string; table?: unknown; identifier?: unknown; node?: unknown; name?: unknown }
    if (n.kind === "TableNode") return this.extractTableName(n.table)
    if (n.kind === "SchemableIdentifierNode") return this.extractTableName(n.identifier)
    if (n.kind === "AliasedNode") return this.extractTableName(n.node)
    if (n.kind === "IdentifierNode" && typeof n.name === "string") return n.name
    if (typeof n.name === "string") return n.name
    return null
  }

  private shouldInterceptTable(tableName: string | null): boolean {
    if (!tableName || DATA_SCOPE_EXEMPT_TABLES.has(tableName)) return false
    if (Array.isArray(this.ctx.tables) && this.ctx.tables.length > 0) {
      return this.ctx.tables.includes(tableName)
    }
    return true
  }

  private isColumnAlreadyConstrained(whereNode: WhereNode | undefined, colName: string): boolean {
    if (!whereNode) return false
    const jsonStr = JSON.stringify(whereNode)
    return jsonStr.includes(`"name":"${colName}"`)
  }

  protected override transformSelectQuery(node: SelectQueryNode): SelectQueryNode {
    const transformed = super.transformSelectQuery(node)
    const fromItem = transformed.from?.froms?.[0]
    const tableName = this.extractTableName(fromItem)
    if (!this.shouldInterceptTable(tableName)) return transformed

    const targetCol =
      this.ctx.scope === DataScopeEnum.SELF_ONLY
        ? this.ctx.userColumn || "created_by"
        : this.ctx.deptColumn || "dept_id"
    if (this.isColumnAlreadyConstrained(transformed.where, targetCol)) return transformed

    const predicate = buildDataScopePredicate(this.ctx)
    if (!predicate) return transformed

    return {
      ...transformed,
      where: transformed.where
        ? WhereNode.cloneWithOperation(transformed.where, "And", predicate)
        : WhereNode.create(predicate),
    }
  }

  protected override transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
    const transformed = super.transformUpdateQuery(node)
    const tableName = this.extractTableName(transformed.table)
    if (!this.shouldInterceptTable(tableName)) return transformed

    const targetCol =
      this.ctx.scope === DataScopeEnum.SELF_ONLY
        ? this.ctx.userColumn || "created_by"
        : this.ctx.deptColumn || "dept_id"
    if (this.isColumnAlreadyConstrained(transformed.where, targetCol)) return transformed

    const predicate = buildDataScopePredicate(this.ctx)
    if (!predicate) return transformed

    return {
      ...transformed,
      where: transformed.where
        ? WhereNode.cloneWithOperation(transformed.where, "And", predicate)
        : WhereNode.create(predicate),
    }
  }

  protected override transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode {
    const transformed = super.transformDeleteQuery(node)
    const fromItem = transformed.from?.froms?.[0]
    const tableName = this.extractTableName(fromItem)
    if (!this.shouldInterceptTable(tableName)) return transformed

    const targetCol =
      this.ctx.scope === DataScopeEnum.SELF_ONLY
        ? this.ctx.userColumn || "created_by"
        : this.ctx.deptColumn || "dept_id"
    if (this.isColumnAlreadyConstrained(transformed.where, targetCol)) return transformed

    const predicate = buildDataScopePredicate(this.ctx)
    if (!predicate) return transformed

    return {
      ...transformed,
      where: transformed.where
        ? WhereNode.cloneWithOperation(transformed.where, "And", predicate)
        : WhereNode.create(predicate),
    }
  }
}

/**
 * Kysely 语法树级数据范围权限插件（DataScopeIsolationPlugin）
 *
 * 当处于 `runWithDataScope(ctx, fn)` 上下文且 `ctx.scope !== DataScopeEnum.ALL` 时，
 * 自动对 SELECT / UPDATE / DELETE 注入 `dept_id` 或 `created_by` 行级权限过滤。
 */
export class DataScopeIsolationPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const ctx = getCurrentDataScope()
    if (!ctx || ctx.scope === DataScopeEnum.ALL) {
      return args.node
    }
    const transformer = new DataScopeTransformer(ctx)
    return transformer.transformNode(args.node)
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return args.result
  }
}

export const dataScopeIsolationPlugin = new DataScopeIsolationPlugin()

