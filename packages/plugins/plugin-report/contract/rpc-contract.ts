/**
 * report 域的跨域 RPC 契约（**代码**，由 scripts/bootstrap-rpc-contracts.ts 从既有 catalog 反向生成）。
 *
 * 之后 `rpc-actions.json` 是**派生物** —— 加方法请改这里，再跑
 * `pnpm exec tsx scripts/generate-rpc-actions.ts --write`（门禁 `rpc:actions:check` 会拦漂移）。
 */
import { defineRpcContract } from "@/modules/shared/backend/lib/rpc-contract"

export const REPORT_RPC_CONTRACT = defineRpcContract("report", {
  ping: { schema: "ping" },
  listBoards: { service: "ReportService", module: "index", schema: "reportPageQuerySchema", fieldsRef: "pageQuery" },
  exportBoard: { service: "ReportService", module: "index", schema: "reportExportSchema" },
})
