/**
 * aigw 域的跨域 RPC 契约（**代码**，由 scripts/bootstrap-rpc-contracts.ts 从既有 catalog 反向生成）。
 *
 * 之后 `rpc-actions.json` 是**派生物** —— 加方法请改这里，再跑
 * `pnpm exec tsx scripts/generate-rpc-actions.ts --write`（门禁 `rpc:actions:check` 会拦漂移）。
 */
import { defineRpcContract } from "@/modules/shared/backend/lib/rpc-contract"

export const AIGW_RPC_CONTRACT = defineRpcContract("aigw", {
  ping: { schema: "ping" },
  listChannels: { service: "AigwChannelService", module: "aigw-channel.service", target: "page", schema: "aigwPageQuerySchema", fieldsRef: "pageQuery" },
  createChannel: { service: "AigwChannelService", module: "aigw-channel.service", target: "create", schema: "aigwChannelCreateSchema" },
  listTokens: { service: "AigwAccessTokenService", module: "aigw-access-token.service", target: "page", schema: "aigwPageQuerySchema", fieldsRef: "pageQuery" },
  createToken: { service: "AigwAccessTokenService", module: "aigw-access-token.service", target: "create", schema: "aigwTokenCreateSchema" },
  listModels: { service: "AigwModelService", module: "aigw-model.service", target: "page", schema: "aigwPageQuerySchema", fieldsRef: "pageQuery" },
  relayChat: { service: "AigwRelayService", module: "aigw-relay.service", target: "relayChatCompletion", schema: "aigwRelayChatSchema" },
  listPublicModels: { service: "AigwRelayService", module: "aigw-relay.service", schema: "aigwListPublicModelsSchema" },
  embed: { service: "AigwRelayService", module: "aigw-relay.service", schema: "aigwEmbedSchema" },
})
