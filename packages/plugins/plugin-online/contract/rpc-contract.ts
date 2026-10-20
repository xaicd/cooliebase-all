/**
 * online 域的跨域 RPC 契约（**代码**，由 scripts/bootstrap-rpc-contracts.ts 从既有 catalog 反向生成）。
 *
 * 之后 `rpc-actions.json` 是**派生物** —— 加方法请改这里，再跑
 * `pnpm exec tsx scripts/generate-rpc-actions.ts --write`（门禁 `rpc:actions:check` 会拦漂移）。
 */
import { defineRpcContract } from "@/modules/shared/backend/lib/rpc-contract"

export const ONLINE_RPC_CONTRACT = defineRpcContract("online", {
  ping: { schema: "ping" },
  pageDefinitions: { service: "OnlineDefinitionService", module: "online-definition.service", schema: "onlinePageDefinitionsSchema" },
  resolvePublishedRelease: { service: "OnlineDefinitionService", module: "online-definition.service", schema: "resolvePublishedReleaseSchema" },
  resolveCodegenImport: { service: "OnlineDefinitionService", module: "online-definition.service", schema: "resolvePublishedReleaseSchema" },
  pageManagedRecords: { service: "OnlineManagedTableService", module: "online-managed-table.service", schema: "pageManagedRecordsSchema" },
  getManagedRecord: { service: "OnlineManagedTableService", module: "online-managed-table.service", schema: "getManagedRecordSchema" },
  createManagedRecord: { service: "OnlineManagedTableService", module: "online-managed-table.service", schema: "createManagedRecordSchema" },
  updateManagedRecord: { service: "OnlineManagedTableService", module: "online-managed-table.service", schema: "updateManagedRecordSchema" },
  deleteManagedRecord: { service: "OnlineManagedTableService", module: "online-managed-table.service", schema: "deleteManagedRecordSchema" },
})
