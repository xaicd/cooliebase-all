/**
 * erp 域的跨域 RPC 契约（**代码**，由 scripts/bootstrap-rpc-contracts.ts 从既有 catalog 反向生成）。
 *
 * 之后 `rpc-actions.json` 是**派生物** —— 加方法请改这里，再跑
 * `pnpm exec tsx scripts/generate-rpc-actions.ts --write`（门禁 `rpc:actions:check` 会拦漂移）。
 */
import { defineRpcContract } from "@/modules/shared/backend/lib/rpc-contract"

export const ERP_RPC_CONTRACT = defineRpcContract("erp", {
  ping: { schema: "ping" },
  listProducts: { service: "ErpService", module: "index", schema: "erpPageQuerySchema", fieldsRef: "pageQuery" },
  listOrders: { service: "ErpService", module: "index", schema: "erpPageQuerySchema", fieldsRef: "pageQuery" },
  adjustStock: { service: "ErpService", module: "index", schema: "erpStockAdjustmentSchema" },
})
