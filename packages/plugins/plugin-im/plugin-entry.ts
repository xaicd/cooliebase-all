/**
 * im 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_conversations__id_ from "@/modules/im/routes/admin/conversations/[id]/route"
import * as route_admin_conversations from "@/modules/im/routes/admin/conversations/route"
import * as route_admin_im_channel_manager__id_ from "@/modules/im/routes/admin/im-channel-manager/[id]/route"
import * as route_admin_im_channel_manager from "@/modules/im/routes/admin/im-channel-manager/route"
import * as route_admin_im_channel_material_manager__id_ from "@/modules/im/routes/admin/im-channel-material-manager/[id]/route"
import * as route_admin_im_channel_material_manager from "@/modules/im/routes/admin/im-channel-material-manager/route"
import * as route_admin_im_channel_material__id_ from "@/modules/im/routes/admin/im-channel-material/[id]/route"
import * as route_admin_im_channel_material from "@/modules/im/routes/admin/im-channel-material/route"
import * as route_admin_im_channel_message_manager__id_ from "@/modules/im/routes/admin/im-channel-message-manager/[id]/route"
import * as route_admin_im_channel_message_manager from "@/modules/im/routes/admin/im-channel-message-manager/route"
import * as route_admin_im_channel_message__id_ from "@/modules/im/routes/admin/im-channel-message/[id]/route"
import * as route_admin_im_channel_message from "@/modules/im/routes/admin/im-channel-message/route"
import * as route_admin_im_conversation_read__id_ from "@/modules/im/routes/admin/im-conversation-read/[id]/route"
import * as route_admin_im_conversation_read from "@/modules/im/routes/admin/im-conversation-read/route"
import * as route_admin_im_face_pack_item_manager__id_ from "@/modules/im/routes/admin/im-face-pack-item-manager/[id]/route"
import * as route_admin_im_face_pack_item_manager from "@/modules/im/routes/admin/im-face-pack-item-manager/route"
import * as route_admin_im_face_pack_manager__id_ from "@/modules/im/routes/admin/im-face-pack-manager/[id]/route"
import * as route_admin_im_face_pack_manager from "@/modules/im/routes/admin/im-face-pack-manager/route"
import * as route_admin_im_face_pack__id_ from "@/modules/im/routes/admin/im-face-pack/[id]/route"
import * as route_admin_im_face_pack from "@/modules/im/routes/admin/im-face-pack/route"
import * as route_admin_im_face_user_item_manager__id_ from "@/modules/im/routes/admin/im-face-user-item-manager/[id]/route"
import * as route_admin_im_face_user_item_manager from "@/modules/im/routes/admin/im-face-user-item-manager/route"
import * as route_admin_im_face_user_item__id_ from "@/modules/im/routes/admin/im-face-user-item/[id]/route"
import * as route_admin_im_face_user_item from "@/modules/im/routes/admin/im-face-user-item/route"
import * as route_admin_im_friend_manager__id_ from "@/modules/im/routes/admin/im-friend-manager/[id]/route"
import * as route_admin_im_friend_manager from "@/modules/im/routes/admin/im-friend-manager/route"
import * as route_admin_im_friend_request_manager__id_ from "@/modules/im/routes/admin/im-friend-request-manager/[id]/route"
import * as route_admin_im_friend_request_manager from "@/modules/im/routes/admin/im-friend-request-manager/route"
import * as route_admin_im_friend_request__id_ from "@/modules/im/routes/admin/im-friend-request/[id]/route"
import * as route_admin_im_friend_request from "@/modules/im/routes/admin/im-friend-request/route"
import * as route_admin_im_friend__id_ from "@/modules/im/routes/admin/im-friend/[id]/route"
import * as route_admin_im_friend from "@/modules/im/routes/admin/im-friend/route"
import * as route_admin_im_group_manager__id_ from "@/modules/im/routes/admin/im-group-manager/[id]/route"
import * as route_admin_im_group_manager from "@/modules/im/routes/admin/im-group-manager/route"
import * as route_admin_im_group_member_manager__id_ from "@/modules/im/routes/admin/im-group-member-manager/[id]/route"
import * as route_admin_im_group_member_manager from "@/modules/im/routes/admin/im-group-member-manager/route"
import * as route_admin_im_group_member__id_ from "@/modules/im/routes/admin/im-group-member/[id]/route"
import * as route_admin_im_group_member from "@/modules/im/routes/admin/im-group-member/route"
import * as route_admin_im_group_message_manager__id_ from "@/modules/im/routes/admin/im-group-message-manager/[id]/route"
import * as route_admin_im_group_message_manager from "@/modules/im/routes/admin/im-group-message-manager/route"
import * as route_admin_im_group_message__id_ from "@/modules/im/routes/admin/im-group-message/[id]/route"
import * as route_admin_im_group_message from "@/modules/im/routes/admin/im-group-message/route"
import * as route_admin_im_group_request_manager__id_ from "@/modules/im/routes/admin/im-group-request-manager/[id]/route"
import * as route_admin_im_group_request_manager from "@/modules/im/routes/admin/im-group-request-manager/route"
import * as route_admin_im_group_request__id_ from "@/modules/im/routes/admin/im-group-request/[id]/route"
import * as route_admin_im_group_request from "@/modules/im/routes/admin/im-group-request/route"
import * as route_admin_im_group__id_ from "@/modules/im/routes/admin/im-group/[id]/route"
import * as route_admin_im_group from "@/modules/im/routes/admin/im-group/route"
import * as route_admin_im_private_message_manager__id_ from "@/modules/im/routes/admin/im-private-message-manager/[id]/route"
import * as route_admin_im_private_message_manager from "@/modules/im/routes/admin/im-private-message-manager/route"
import * as route_admin_im_private_message__id_ from "@/modules/im/routes/admin/im-private-message/[id]/route"
import * as route_admin_im_private_message from "@/modules/im/routes/admin/im-private-message/route"
import * as route_admin_im_rtc_call_manager__id_ from "@/modules/im/routes/admin/im-rtc-call-manager/[id]/route"
import * as route_admin_im_rtc_call_manager from "@/modules/im/routes/admin/im-rtc-call-manager/route"
import * as route_admin_im_rtc_call__id_ from "@/modules/im/routes/admin/im-rtc-call/[id]/route"
import * as route_admin_im_rtc_call from "@/modules/im/routes/admin/im-rtc-call/route"
import * as route_admin_im_rtc_live_kit__id_ from "@/modules/im/routes/admin/im-rtc-live-kit/[id]/route"
import * as route_admin_im_rtc_live_kit from "@/modules/im/routes/admin/im-rtc-live-kit/route"
import * as route_admin_im_sensitive_word_manager__id_ from "@/modules/im/routes/admin/im-sensitive-word-manager/[id]/route"
import * as route_admin_im_sensitive_word_manager from "@/modules/im/routes/admin/im-sensitive-word-manager/route"
import * as route_admin_im_statistics_manager__id_ from "@/modules/im/routes/admin/im-statistics-manager/[id]/route"
import * as route_admin_im_statistics_manager from "@/modules/im/routes/admin/im-statistics-manager/route"
import * as route_admin_messages_audit from "@/modules/im/routes/admin/messages/audit/route"

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
    "admin:conversations/[id]:delete": (input: any) => invoke(route_admin_conversations__id_.DELETE, input),
    "admin:conversations/[id]:get": (input: any) => invoke(route_admin_conversations__id_.GET, input),
    "admin:conversations/[id]:put": (input: any) => invoke(route_admin_conversations__id_.PUT, input),
    "admin:conversations:get": (input: any) => invoke(route_admin_conversations.GET, input),
    "admin:conversations:post": (input: any) => invoke(route_admin_conversations.POST, input),
    "admin:im-channel-manager/[id]:delete": (input: any) => invoke(route_admin_im_channel_manager__id_.DELETE, input),
    "admin:im-channel-manager/[id]:get": (input: any) => invoke(route_admin_im_channel_manager__id_.GET, input),
    "admin:im-channel-manager/[id]:put": (input: any) => invoke(route_admin_im_channel_manager__id_.PUT, input),
    "admin:im-channel-manager:get": (input: any) => invoke(route_admin_im_channel_manager.GET, input),
    "admin:im-channel-manager:post": (input: any) => invoke(route_admin_im_channel_manager.POST, input),
    "admin:im-channel-material-manager/[id]:delete": (input: any) => invoke(route_admin_im_channel_material_manager__id_.DELETE, input),
    "admin:im-channel-material-manager/[id]:get": (input: any) => invoke(route_admin_im_channel_material_manager__id_.GET, input),
    "admin:im-channel-material-manager/[id]:put": (input: any) => invoke(route_admin_im_channel_material_manager__id_.PUT, input),
    "admin:im-channel-material-manager:get": (input: any) => invoke(route_admin_im_channel_material_manager.GET, input),
    "admin:im-channel-material-manager:post": (input: any) => invoke(route_admin_im_channel_material_manager.POST, input),
    "admin:im-channel-material/[id]:delete": (input: any) => invoke(route_admin_im_channel_material__id_.DELETE, input),
    "admin:im-channel-material/[id]:get": (input: any) => invoke(route_admin_im_channel_material__id_.GET, input),
    "admin:im-channel-material/[id]:put": (input: any) => invoke(route_admin_im_channel_material__id_.PUT, input),
    "admin:im-channel-material:get": (input: any) => invoke(route_admin_im_channel_material.GET, input),
    "admin:im-channel-material:post": (input: any) => invoke(route_admin_im_channel_material.POST, input),
    "admin:im-channel-message-manager/[id]:delete": (input: any) => invoke(route_admin_im_channel_message_manager__id_.DELETE, input),
    "admin:im-channel-message-manager/[id]:get": (input: any) => invoke(route_admin_im_channel_message_manager__id_.GET, input),
    "admin:im-channel-message-manager/[id]:put": (input: any) => invoke(route_admin_im_channel_message_manager__id_.PUT, input),
    "admin:im-channel-message-manager:get": (input: any) => invoke(route_admin_im_channel_message_manager.GET, input),
    "admin:im-channel-message-manager:post": (input: any) => invoke(route_admin_im_channel_message_manager.POST, input),
    "admin:im-channel-message/[id]:delete": (input: any) => invoke(route_admin_im_channel_message__id_.DELETE, input),
    "admin:im-channel-message/[id]:get": (input: any) => invoke(route_admin_im_channel_message__id_.GET, input),
    "admin:im-channel-message/[id]:put": (input: any) => invoke(route_admin_im_channel_message__id_.PUT, input),
    "admin:im-channel-message:get": (input: any) => invoke(route_admin_im_channel_message.GET, input),
    "admin:im-channel-message:post": (input: any) => invoke(route_admin_im_channel_message.POST, input),
    "admin:im-conversation-read/[id]:delete": (input: any) => invoke(route_admin_im_conversation_read__id_.DELETE, input),
    "admin:im-conversation-read/[id]:get": (input: any) => invoke(route_admin_im_conversation_read__id_.GET, input),
    "admin:im-conversation-read/[id]:put": (input: any) => invoke(route_admin_im_conversation_read__id_.PUT, input),
    "admin:im-conversation-read:get": (input: any) => invoke(route_admin_im_conversation_read.GET, input),
    "admin:im-conversation-read:post": (input: any) => invoke(route_admin_im_conversation_read.POST, input),
    "admin:im-face-pack-item-manager/[id]:delete": (input: any) => invoke(route_admin_im_face_pack_item_manager__id_.DELETE, input),
    "admin:im-face-pack-item-manager/[id]:get": (input: any) => invoke(route_admin_im_face_pack_item_manager__id_.GET, input),
    "admin:im-face-pack-item-manager/[id]:put": (input: any) => invoke(route_admin_im_face_pack_item_manager__id_.PUT, input),
    "admin:im-face-pack-item-manager:get": (input: any) => invoke(route_admin_im_face_pack_item_manager.GET, input),
    "admin:im-face-pack-item-manager:post": (input: any) => invoke(route_admin_im_face_pack_item_manager.POST, input),
    "admin:im-face-pack-manager/[id]:delete": (input: any) => invoke(route_admin_im_face_pack_manager__id_.DELETE, input),
    "admin:im-face-pack-manager/[id]:get": (input: any) => invoke(route_admin_im_face_pack_manager__id_.GET, input),
    "admin:im-face-pack-manager/[id]:put": (input: any) => invoke(route_admin_im_face_pack_manager__id_.PUT, input),
    "admin:im-face-pack-manager:get": (input: any) => invoke(route_admin_im_face_pack_manager.GET, input),
    "admin:im-face-pack-manager:post": (input: any) => invoke(route_admin_im_face_pack_manager.POST, input),
    "admin:im-face-pack/[id]:delete": (input: any) => invoke(route_admin_im_face_pack__id_.DELETE, input),
    "admin:im-face-pack/[id]:get": (input: any) => invoke(route_admin_im_face_pack__id_.GET, input),
    "admin:im-face-pack/[id]:put": (input: any) => invoke(route_admin_im_face_pack__id_.PUT, input),
    "admin:im-face-pack:get": (input: any) => invoke(route_admin_im_face_pack.GET, input),
    "admin:im-face-pack:post": (input: any) => invoke(route_admin_im_face_pack.POST, input),
    "admin:im-face-user-item-manager/[id]:delete": (input: any) => invoke(route_admin_im_face_user_item_manager__id_.DELETE, input),
    "admin:im-face-user-item-manager/[id]:get": (input: any) => invoke(route_admin_im_face_user_item_manager__id_.GET, input),
    "admin:im-face-user-item-manager/[id]:put": (input: any) => invoke(route_admin_im_face_user_item_manager__id_.PUT, input),
    "admin:im-face-user-item-manager:get": (input: any) => invoke(route_admin_im_face_user_item_manager.GET, input),
    "admin:im-face-user-item-manager:post": (input: any) => invoke(route_admin_im_face_user_item_manager.POST, input),
    "admin:im-face-user-item/[id]:delete": (input: any) => invoke(route_admin_im_face_user_item__id_.DELETE, input),
    "admin:im-face-user-item/[id]:get": (input: any) => invoke(route_admin_im_face_user_item__id_.GET, input),
    "admin:im-face-user-item/[id]:put": (input: any) => invoke(route_admin_im_face_user_item__id_.PUT, input),
    "admin:im-face-user-item:get": (input: any) => invoke(route_admin_im_face_user_item.GET, input),
    "admin:im-face-user-item:post": (input: any) => invoke(route_admin_im_face_user_item.POST, input),
    "admin:im-friend-manager/[id]:delete": (input: any) => invoke(route_admin_im_friend_manager__id_.DELETE, input),
    "admin:im-friend-manager/[id]:get": (input: any) => invoke(route_admin_im_friend_manager__id_.GET, input),
    "admin:im-friend-manager/[id]:put": (input: any) => invoke(route_admin_im_friend_manager__id_.PUT, input),
    "admin:im-friend-manager:get": (input: any) => invoke(route_admin_im_friend_manager.GET, input),
    "admin:im-friend-manager:post": (input: any) => invoke(route_admin_im_friend_manager.POST, input),
    "admin:im-friend-request-manager/[id]:delete": (input: any) => invoke(route_admin_im_friend_request_manager__id_.DELETE, input),
    "admin:im-friend-request-manager/[id]:get": (input: any) => invoke(route_admin_im_friend_request_manager__id_.GET, input),
    "admin:im-friend-request-manager/[id]:put": (input: any) => invoke(route_admin_im_friend_request_manager__id_.PUT, input),
    "admin:im-friend-request-manager:get": (input: any) => invoke(route_admin_im_friend_request_manager.GET, input),
    "admin:im-friend-request-manager:post": (input: any) => invoke(route_admin_im_friend_request_manager.POST, input),
    "admin:im-friend-request/[id]:delete": (input: any) => invoke(route_admin_im_friend_request__id_.DELETE, input),
    "admin:im-friend-request/[id]:get": (input: any) => invoke(route_admin_im_friend_request__id_.GET, input),
    "admin:im-friend-request/[id]:put": (input: any) => invoke(route_admin_im_friend_request__id_.PUT, input),
    "admin:im-friend-request:get": (input: any) => invoke(route_admin_im_friend_request.GET, input),
    "admin:im-friend-request:post": (input: any) => invoke(route_admin_im_friend_request.POST, input),
    "admin:im-friend/[id]:delete": (input: any) => invoke(route_admin_im_friend__id_.DELETE, input),
    "admin:im-friend/[id]:get": (input: any) => invoke(route_admin_im_friend__id_.GET, input),
    "admin:im-friend/[id]:put": (input: any) => invoke(route_admin_im_friend__id_.PUT, input),
    "admin:im-friend:get": (input: any) => invoke(route_admin_im_friend.GET, input),
    "admin:im-friend:post": (input: any) => invoke(route_admin_im_friend.POST, input),
    "admin:im-group-manager/[id]:delete": (input: any) => invoke(route_admin_im_group_manager__id_.DELETE, input),
    "admin:im-group-manager/[id]:get": (input: any) => invoke(route_admin_im_group_manager__id_.GET, input),
    "admin:im-group-manager/[id]:put": (input: any) => invoke(route_admin_im_group_manager__id_.PUT, input),
    "admin:im-group-manager:get": (input: any) => invoke(route_admin_im_group_manager.GET, input),
    "admin:im-group-manager:post": (input: any) => invoke(route_admin_im_group_manager.POST, input),
    "admin:im-group-member-manager/[id]:delete": (input: any) => invoke(route_admin_im_group_member_manager__id_.DELETE, input),
    "admin:im-group-member-manager/[id]:get": (input: any) => invoke(route_admin_im_group_member_manager__id_.GET, input),
    "admin:im-group-member-manager/[id]:put": (input: any) => invoke(route_admin_im_group_member_manager__id_.PUT, input),
    "admin:im-group-member-manager:get": (input: any) => invoke(route_admin_im_group_member_manager.GET, input),
    "admin:im-group-member-manager:post": (input: any) => invoke(route_admin_im_group_member_manager.POST, input),
    "admin:im-group-member/[id]:delete": (input: any) => invoke(route_admin_im_group_member__id_.DELETE, input),
    "admin:im-group-member/[id]:get": (input: any) => invoke(route_admin_im_group_member__id_.GET, input),
    "admin:im-group-member/[id]:put": (input: any) => invoke(route_admin_im_group_member__id_.PUT, input),
    "admin:im-group-member:get": (input: any) => invoke(route_admin_im_group_member.GET, input),
    "admin:im-group-member:post": (input: any) => invoke(route_admin_im_group_member.POST, input),
    "admin:im-group-message-manager/[id]:delete": (input: any) => invoke(route_admin_im_group_message_manager__id_.DELETE, input),
    "admin:im-group-message-manager/[id]:get": (input: any) => invoke(route_admin_im_group_message_manager__id_.GET, input),
    "admin:im-group-message-manager/[id]:put": (input: any) => invoke(route_admin_im_group_message_manager__id_.PUT, input),
    "admin:im-group-message-manager:get": (input: any) => invoke(route_admin_im_group_message_manager.GET, input),
    "admin:im-group-message-manager:post": (input: any) => invoke(route_admin_im_group_message_manager.POST, input),
    "admin:im-group-message/[id]:delete": (input: any) => invoke(route_admin_im_group_message__id_.DELETE, input),
    "admin:im-group-message/[id]:get": (input: any) => invoke(route_admin_im_group_message__id_.GET, input),
    "admin:im-group-message/[id]:put": (input: any) => invoke(route_admin_im_group_message__id_.PUT, input),
    "admin:im-group-message:get": (input: any) => invoke(route_admin_im_group_message.GET, input),
    "admin:im-group-message:post": (input: any) => invoke(route_admin_im_group_message.POST, input),
    "admin:im-group-request-manager/[id]:delete": (input: any) => invoke(route_admin_im_group_request_manager__id_.DELETE, input),
    "admin:im-group-request-manager/[id]:get": (input: any) => invoke(route_admin_im_group_request_manager__id_.GET, input),
    "admin:im-group-request-manager/[id]:put": (input: any) => invoke(route_admin_im_group_request_manager__id_.PUT, input),
    "admin:im-group-request-manager:get": (input: any) => invoke(route_admin_im_group_request_manager.GET, input),
    "admin:im-group-request-manager:post": (input: any) => invoke(route_admin_im_group_request_manager.POST, input),
    "admin:im-group-request/[id]:delete": (input: any) => invoke(route_admin_im_group_request__id_.DELETE, input),
    "admin:im-group-request/[id]:get": (input: any) => invoke(route_admin_im_group_request__id_.GET, input),
    "admin:im-group-request/[id]:put": (input: any) => invoke(route_admin_im_group_request__id_.PUT, input),
    "admin:im-group-request:get": (input: any) => invoke(route_admin_im_group_request.GET, input),
    "admin:im-group-request:post": (input: any) => invoke(route_admin_im_group_request.POST, input),
    "admin:im-group/[id]:delete": (input: any) => invoke(route_admin_im_group__id_.DELETE, input),
    "admin:im-group/[id]:get": (input: any) => invoke(route_admin_im_group__id_.GET, input),
    "admin:im-group/[id]:put": (input: any) => invoke(route_admin_im_group__id_.PUT, input),
    "admin:im-group:get": (input: any) => invoke(route_admin_im_group.GET, input),
    "admin:im-group:post": (input: any) => invoke(route_admin_im_group.POST, input),
    "admin:im-private-message-manager/[id]:delete": (input: any) => invoke(route_admin_im_private_message_manager__id_.DELETE, input),
    "admin:im-private-message-manager/[id]:get": (input: any) => invoke(route_admin_im_private_message_manager__id_.GET, input),
    "admin:im-private-message-manager/[id]:put": (input: any) => invoke(route_admin_im_private_message_manager__id_.PUT, input),
    "admin:im-private-message-manager:get": (input: any) => invoke(route_admin_im_private_message_manager.GET, input),
    "admin:im-private-message-manager:post": (input: any) => invoke(route_admin_im_private_message_manager.POST, input),
    "admin:im-private-message/[id]:delete": (input: any) => invoke(route_admin_im_private_message__id_.DELETE, input),
    "admin:im-private-message/[id]:get": (input: any) => invoke(route_admin_im_private_message__id_.GET, input),
    "admin:im-private-message/[id]:put": (input: any) => invoke(route_admin_im_private_message__id_.PUT, input),
    "admin:im-private-message:get": (input: any) => invoke(route_admin_im_private_message.GET, input),
    "admin:im-private-message:post": (input: any) => invoke(route_admin_im_private_message.POST, input),
    "admin:im-rtc-call-manager/[id]:delete": (input: any) => invoke(route_admin_im_rtc_call_manager__id_.DELETE, input),
    "admin:im-rtc-call-manager/[id]:get": (input: any) => invoke(route_admin_im_rtc_call_manager__id_.GET, input),
    "admin:im-rtc-call-manager/[id]:put": (input: any) => invoke(route_admin_im_rtc_call_manager__id_.PUT, input),
    "admin:im-rtc-call-manager:get": (input: any) => invoke(route_admin_im_rtc_call_manager.GET, input),
    "admin:im-rtc-call-manager:post": (input: any) => invoke(route_admin_im_rtc_call_manager.POST, input),
    "admin:im-rtc-call/[id]:delete": (input: any) => invoke(route_admin_im_rtc_call__id_.DELETE, input),
    "admin:im-rtc-call/[id]:get": (input: any) => invoke(route_admin_im_rtc_call__id_.GET, input),
    "admin:im-rtc-call/[id]:put": (input: any) => invoke(route_admin_im_rtc_call__id_.PUT, input),
    "admin:im-rtc-call:get": (input: any) => invoke(route_admin_im_rtc_call.GET, input),
    "admin:im-rtc-call:post": (input: any) => invoke(route_admin_im_rtc_call.POST, input),
    "admin:im-rtc-live-kit/[id]:delete": (input: any) => invoke(route_admin_im_rtc_live_kit__id_.DELETE, input),
    "admin:im-rtc-live-kit/[id]:get": (input: any) => invoke(route_admin_im_rtc_live_kit__id_.GET, input),
    "admin:im-rtc-live-kit/[id]:put": (input: any) => invoke(route_admin_im_rtc_live_kit__id_.PUT, input),
    "admin:im-rtc-live-kit:get": (input: any) => invoke(route_admin_im_rtc_live_kit.GET, input),
    "admin:im-rtc-live-kit:post": (input: any) => invoke(route_admin_im_rtc_live_kit.POST, input),
    "admin:im-sensitive-word-manager/[id]:delete": (input: any) => invoke(route_admin_im_sensitive_word_manager__id_.DELETE, input),
    "admin:im-sensitive-word-manager/[id]:get": (input: any) => invoke(route_admin_im_sensitive_word_manager__id_.GET, input),
    "admin:im-sensitive-word-manager/[id]:put": (input: any) => invoke(route_admin_im_sensitive_word_manager__id_.PUT, input),
    "admin:im-sensitive-word-manager:get": (input: any) => invoke(route_admin_im_sensitive_word_manager.GET, input),
    "admin:im-sensitive-word-manager:post": (input: any) => invoke(route_admin_im_sensitive_word_manager.POST, input),
    "admin:im-statistics-manager/[id]:delete": (input: any) => invoke(route_admin_im_statistics_manager__id_.DELETE, input),
    "admin:im-statistics-manager/[id]:get": (input: any) => invoke(route_admin_im_statistics_manager__id_.GET, input),
    "admin:im-statistics-manager/[id]:put": (input: any) => invoke(route_admin_im_statistics_manager__id_.PUT, input),
    "admin:im-statistics-manager:get": (input: any) => invoke(route_admin_im_statistics_manager.GET, input),
    "admin:im-statistics-manager:post": (input: any) => invoke(route_admin_im_statistics_manager.POST, input),
    "admin:messages/audit:post": (input: any) => invoke(route_admin_messages_audit.POST, input),
  },
})
