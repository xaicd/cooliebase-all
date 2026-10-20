/**
 * ai 域的跨域 RPC 契约（**代码**，由 scripts/bootstrap-rpc-contracts.ts 从既有 catalog 反向生成）。
 *
 * 之后 `rpc-actions.json` 是**派生物** —— 加方法请改这里，再跑
 * `pnpm exec tsx scripts/generate-rpc-actions.ts --write`（门禁 `rpc:actions:check` 会拦漂移）。
 */
import { defineRpcContract } from "@/modules/shared/backend/lib/rpc-contract"

export const AI_RPC_CONTRACT = defineRpcContract("ai", {
  ping: { schema: "ping" },
  listModels: { service: "AiService", module: "index", schema: "aiPageQuerySchema", fieldsRef: "pageQuery" },
  createModel: { service: "AiService", module: "index", schema: "aiModelCreateSchema" },
  listChats: { service: "AiService", module: "index", schema: "aiPageQuerySchema", fieldsRef: "pageQuery" },
  deleteChat: { service: "AiService", module: "index", schema: "aiChatDeleteSchema" },
  relayChatCompletion: { service: "AiService", module: "index", schema: "aiRelayChatSchema" },
  listPublicModels: { service: "AiService", module: "index", schema: "empty" },
  embed: { service: "AiService", module: "index", schema: "aiEmbeddingSchema" },
})
