/**
 * ai 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_ai_api_key__id_ from "@/modules/ai/routes/admin/ai-api-key/[id]/route"
import * as route_admin_ai_api_key from "@/modules/ai/routes/admin/ai-api-key/route"
import * as route_admin_ai_chat_conversation__id_ from "@/modules/ai/routes/admin/ai-chat-conversation/[id]/route"
import * as route_admin_ai_chat_conversation from "@/modules/ai/routes/admin/ai-chat-conversation/route"
import * as route_admin_ai_chat_message__id_ from "@/modules/ai/routes/admin/ai-chat-message/[id]/route"
import * as route_admin_ai_chat_message from "@/modules/ai/routes/admin/ai-chat-message/route"
import * as route_admin_ai_chat_role__id_ from "@/modules/ai/routes/admin/ai-chat-role/[id]/route"
import * as route_admin_ai_chat_role from "@/modules/ai/routes/admin/ai-chat-role/route"
import * as route_admin_ai_image__id_ from "@/modules/ai/routes/admin/ai-image/[id]/route"
import * as route_admin_ai_image from "@/modules/ai/routes/admin/ai-image/route"
import * as route_admin_ai_knowledge_document__id_ from "@/modules/ai/routes/admin/ai-knowledge-document/[id]/route"
import * as route_admin_ai_knowledge_document from "@/modules/ai/routes/admin/ai-knowledge-document/route"
import * as route_admin_ai_knowledge_segment__id_ from "@/modules/ai/routes/admin/ai-knowledge-segment/[id]/route"
import * as route_admin_ai_knowledge_segment from "@/modules/ai/routes/admin/ai-knowledge-segment/route"
import * as route_admin_ai_knowledge__id_ from "@/modules/ai/routes/admin/ai-knowledge/[id]/route"
import * as route_admin_ai_knowledge from "@/modules/ai/routes/admin/ai-knowledge/route"
import * as route_admin_ai_mind_map__id_ from "@/modules/ai/routes/admin/ai-mind-map/[id]/route"
import * as route_admin_ai_mind_map from "@/modules/ai/routes/admin/ai-mind-map/route"
import * as route_admin_ai_music__id_ from "@/modules/ai/routes/admin/ai-music/[id]/route"
import * as route_admin_ai_music from "@/modules/ai/routes/admin/ai-music/route"
import * as route_admin_ai_tool__id_ from "@/modules/ai/routes/admin/ai-tool/[id]/route"
import * as route_admin_ai_tool from "@/modules/ai/routes/admin/ai-tool/route"
import * as route_admin_ai_workflow__id_ from "@/modules/ai/routes/admin/ai-workflow/[id]/route"
import * as route_admin_ai_workflow from "@/modules/ai/routes/admin/ai-workflow/route"
import * as route_admin_ai_write__id_ from "@/modules/ai/routes/admin/ai-write/[id]/route"
import * as route_admin_ai_write from "@/modules/ai/routes/admin/ai-write/route"
import * as route_open_v1_chat_completions from "@/modules/ai/routes/open/v1/chat/completions/route"
import * as route_open_v1_embeddings from "@/modules/ai/routes/open/v1/embeddings/route"
import * as route_open_v1_models from "@/modules/ai/routes/open/v1/models/route"

async function invoke(handler: (request: Request, context?: unknown) => Promise<Response> | Response, input: any) {
  const url = new URL(`http://plugin.invalid${input.path}`)
  for (const [key, value] of Object.entries(input.query ?? {})) url.searchParams.set(key, String(value))
  const request = new Request(url, {
    method: input.method,
    headers: input.headers,
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  })
  const response = await handler(request)
  const text = await response.text()
  let body: unknown = text
  try { body = text ? JSON.parse(text) : null } catch { /* 非 JSON 原样返回 */ }
  return { status: response.status, body }
}

export default definePlugin({
  async setup(ctx) { ctx.logger.info("ready (merged)") },
  async onHealth() { return { status: "ok" } },
  async onShutdown() {},
  routes: {
    "admin:ai-api-key/[id]:delete": (input: any) => invoke(route_admin_ai_api_key__id_.DELETE, input),
    "admin:ai-api-key/[id]:get": (input: any) => invoke(route_admin_ai_api_key__id_.GET, input),
    "admin:ai-api-key/[id]:put": (input: any) => invoke(route_admin_ai_api_key__id_.PUT, input),
    "admin:ai-api-key:get": (input: any) => invoke(route_admin_ai_api_key.GET, input),
    "admin:ai-api-key:post": (input: any) => invoke(route_admin_ai_api_key.POST, input),
    "admin:ai-chat-conversation/[id]:delete": (input: any) => invoke(route_admin_ai_chat_conversation__id_.DELETE, input),
    "admin:ai-chat-conversation/[id]:get": (input: any) => invoke(route_admin_ai_chat_conversation__id_.GET, input),
    "admin:ai-chat-conversation/[id]:put": (input: any) => invoke(route_admin_ai_chat_conversation__id_.PUT, input),
    "admin:ai-chat-conversation:get": (input: any) => invoke(route_admin_ai_chat_conversation.GET, input),
    "admin:ai-chat-conversation:post": (input: any) => invoke(route_admin_ai_chat_conversation.POST, input),
    "admin:ai-chat-message/[id]:delete": (input: any) => invoke(route_admin_ai_chat_message__id_.DELETE, input),
    "admin:ai-chat-message/[id]:get": (input: any) => invoke(route_admin_ai_chat_message__id_.GET, input),
    "admin:ai-chat-message/[id]:put": (input: any) => invoke(route_admin_ai_chat_message__id_.PUT, input),
    "admin:ai-chat-message:get": (input: any) => invoke(route_admin_ai_chat_message.GET, input),
    "admin:ai-chat-message:post": (input: any) => invoke(route_admin_ai_chat_message.POST, input),
    "admin:ai-chat-role/[id]:delete": (input: any) => invoke(route_admin_ai_chat_role__id_.DELETE, input),
    "admin:ai-chat-role/[id]:get": (input: any) => invoke(route_admin_ai_chat_role__id_.GET, input),
    "admin:ai-chat-role/[id]:put": (input: any) => invoke(route_admin_ai_chat_role__id_.PUT, input),
    "admin:ai-chat-role:get": (input: any) => invoke(route_admin_ai_chat_role.GET, input),
    "admin:ai-chat-role:post": (input: any) => invoke(route_admin_ai_chat_role.POST, input),
    "admin:ai-image/[id]:delete": (input: any) => invoke(route_admin_ai_image__id_.DELETE, input),
    "admin:ai-image/[id]:get": (input: any) => invoke(route_admin_ai_image__id_.GET, input),
    "admin:ai-image/[id]:put": (input: any) => invoke(route_admin_ai_image__id_.PUT, input),
    "admin:ai-image:get": (input: any) => invoke(route_admin_ai_image.GET, input),
    "admin:ai-image:post": (input: any) => invoke(route_admin_ai_image.POST, input),
    "admin:ai-knowledge-document/[id]:delete": (input: any) => invoke(route_admin_ai_knowledge_document__id_.DELETE, input),
    "admin:ai-knowledge-document/[id]:get": (input: any) => invoke(route_admin_ai_knowledge_document__id_.GET, input),
    "admin:ai-knowledge-document/[id]:put": (input: any) => invoke(route_admin_ai_knowledge_document__id_.PUT, input),
    "admin:ai-knowledge-document:get": (input: any) => invoke(route_admin_ai_knowledge_document.GET, input),
    "admin:ai-knowledge-document:post": (input: any) => invoke(route_admin_ai_knowledge_document.POST, input),
    "admin:ai-knowledge-segment/[id]:delete": (input: any) => invoke(route_admin_ai_knowledge_segment__id_.DELETE, input),
    "admin:ai-knowledge-segment/[id]:get": (input: any) => invoke(route_admin_ai_knowledge_segment__id_.GET, input),
    "admin:ai-knowledge-segment/[id]:put": (input: any) => invoke(route_admin_ai_knowledge_segment__id_.PUT, input),
    "admin:ai-knowledge-segment:get": (input: any) => invoke(route_admin_ai_knowledge_segment.GET, input),
    "admin:ai-knowledge-segment:post": (input: any) => invoke(route_admin_ai_knowledge_segment.POST, input),
    "admin:ai-knowledge/[id]:delete": (input: any) => invoke(route_admin_ai_knowledge__id_.DELETE, input),
    "admin:ai-knowledge/[id]:get": (input: any) => invoke(route_admin_ai_knowledge__id_.GET, input),
    "admin:ai-knowledge/[id]:put": (input: any) => invoke(route_admin_ai_knowledge__id_.PUT, input),
    "admin:ai-knowledge:get": (input: any) => invoke(route_admin_ai_knowledge.GET, input),
    "admin:ai-knowledge:post": (input: any) => invoke(route_admin_ai_knowledge.POST, input),
    "admin:ai-mind-map/[id]:delete": (input: any) => invoke(route_admin_ai_mind_map__id_.DELETE, input),
    "admin:ai-mind-map/[id]:get": (input: any) => invoke(route_admin_ai_mind_map__id_.GET, input),
    "admin:ai-mind-map/[id]:put": (input: any) => invoke(route_admin_ai_mind_map__id_.PUT, input),
    "admin:ai-mind-map:get": (input: any) => invoke(route_admin_ai_mind_map.GET, input),
    "admin:ai-mind-map:post": (input: any) => invoke(route_admin_ai_mind_map.POST, input),
    "admin:ai-music/[id]:delete": (input: any) => invoke(route_admin_ai_music__id_.DELETE, input),
    "admin:ai-music/[id]:get": (input: any) => invoke(route_admin_ai_music__id_.GET, input),
    "admin:ai-music/[id]:put": (input: any) => invoke(route_admin_ai_music__id_.PUT, input),
    "admin:ai-music:get": (input: any) => invoke(route_admin_ai_music.GET, input),
    "admin:ai-music:post": (input: any) => invoke(route_admin_ai_music.POST, input),
    "admin:ai-tool/[id]:delete": (input: any) => invoke(route_admin_ai_tool__id_.DELETE, input),
    "admin:ai-tool/[id]:get": (input: any) => invoke(route_admin_ai_tool__id_.GET, input),
    "admin:ai-tool/[id]:put": (input: any) => invoke(route_admin_ai_tool__id_.PUT, input),
    "admin:ai-tool:get": (input: any) => invoke(route_admin_ai_tool.GET, input),
    "admin:ai-tool:post": (input: any) => invoke(route_admin_ai_tool.POST, input),
    "admin:ai-workflow/[id]:delete": (input: any) => invoke(route_admin_ai_workflow__id_.DELETE, input),
    "admin:ai-workflow/[id]:get": (input: any) => invoke(route_admin_ai_workflow__id_.GET, input),
    "admin:ai-workflow/[id]:put": (input: any) => invoke(route_admin_ai_workflow__id_.PUT, input),
    "admin:ai-workflow:get": (input: any) => invoke(route_admin_ai_workflow.GET, input),
    "admin:ai-workflow:post": (input: any) => invoke(route_admin_ai_workflow.POST, input),
    "admin:ai-write/[id]:delete": (input: any) => invoke(route_admin_ai_write__id_.DELETE, input),
    "admin:ai-write/[id]:get": (input: any) => invoke(route_admin_ai_write__id_.GET, input),
    "admin:ai-write/[id]:put": (input: any) => invoke(route_admin_ai_write__id_.PUT, input),
    "admin:ai-write:get": (input: any) => invoke(route_admin_ai_write.GET, input),
    "admin:ai-write:post": (input: any) => invoke(route_admin_ai_write.POST, input),
    "open:v1/chat/completions:post": (input: any) => invoke(route_open_v1_chat_completions.POST, input),
    "open:v1/embeddings:post": (input: any) => invoke(route_open_v1_embeddings.POST, input),
    "open:v1/models:get": (input: any) => invoke(route_open_v1_models.GET, input),
  },
})
