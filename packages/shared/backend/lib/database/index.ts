/**
 * 数据库基础设施统一入口
 */

export type { DB } from "./schema"
export type {
  DatabaseDriver,
  CompatibilityTier,
  ProtocolFamily,
  DataSourceConfig,
  PageParams,
  PageResult,
  OrderBy,
  SortOrder,
  WhereCondition,
  BaseRepository,
  ReplicaNode,
  ReplicaLoadBalancePolicy,
  MasterReplicaConfig,
  DataSourceContext,
  ShardingStrategyType,
  ShardingRule,
  ShardingQueryResult,
} from "./types"

export {
  getDataSourceConfig,
  assertProductionDataSourceConfiguration,
  isMemoryMode,
  getProtocolFamily,
  getCompatibilityTier,
  resetDataSourceConfig,
} from "./datasource-manager"

export {
  getKyselyDb,
  createKyselyInstance,
  hasRealDatabase,
  destroyKyselyDb,
} from "./kysely-client"

export {
  ReadWriteRouter,
  readWriteRouter,
  ReplicaClusterManager,
  replicaClusterManager,
  runWithMaster,
  runWithReplica,
  runInTransaction,
} from "./read-write-router"

export {
  MultiDataSourceManager,
  multiDataSourceManager,
  runWithDataSource,
  getActiveDataSourceName,
} from "./multi-datasource-manager"

export {
  ShardingEngine,
  shardingEngine,
  createHashModShardingRule,
  createTimeMonthlyShardingRule,
} from "./sharding-engine"

export {
  sqlTable,
  sqlColumn,
  mapDbRow,
  likePredicate,
  comparePredicate,
  matchesMemory,
  alwaysTrue,
  eqColumn,
  joinAnd,
  selectDynamicPage,
  selectDynamicById,
  existsDynamicRow,
  insertDynamicRow,
  updateDynamicRow,
  mutateColumnAtomic,
  deleteDynamicRow,
} from "./dynamic-table"
export type { DynamicPersistScope, DynamicQueryOperator } from "./dynamic-table"

export {
  QueryWrapper,
  BaseMapper,
  BaseService
} from "./base-mapper"
export type { QueryCondition, OrderItem, QueryOperator } from "./base-mapper"

export {
  DataScopeEnum,
  DataScopeIsolationPlugin,
  dataScopeIsolationPlugin,
  runWithDataScope,
  getCurrentDataScope,
} from "./data-scope-plugin"
export type { DataScopeLevel, DataScopeContext } from "./data-scope-plugin"



