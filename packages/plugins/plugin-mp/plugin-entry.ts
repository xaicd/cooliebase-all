/**
 * mp 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_accounts from "@/modules/mp/routes/admin/accounts/route"
import * as route_admin_accounts__id_ from "@/modules/mp/routes/admin/accounts/[id]/route"
import * as route_admin_fans from "@/modules/mp/routes/admin/fans/route"
import * as route_admin_fans__id_ from "@/modules/mp/routes/admin/fans/[id]/route"
import * as route_admin_messages from "@/modules/mp/routes/admin/messages/route"
import * as route_admin_messages__id_ from "@/modules/mp/routes/admin/messages/[id]/route"
import * as route_admin_mp_account from "@/modules/mp/routes/admin/mp-account/route"
import * as route_admin_mp_account__id_ from "@/modules/mp/routes/admin/mp-account/[id]/route"
import * as route_admin_mp_auto_reply from "@/modules/mp/routes/admin/mp-auto-reply/route"
import * as route_admin_mp_auto_reply__id_ from "@/modules/mp/routes/admin/mp-auto-reply/[id]/route"
import * as route_admin_mp_draft from "@/modules/mp/routes/admin/mp-draft/route"
import * as route_admin_mp_draft__id_ from "@/modules/mp/routes/admin/mp-draft/[id]/route"
import * as route_admin_mp_free_publish from "@/modules/mp/routes/admin/mp-free-publish/route"
import * as route_admin_mp_free_publish__id_ from "@/modules/mp/routes/admin/mp-free-publish/[id]/route"
import * as route_admin_mp_material from "@/modules/mp/routes/admin/mp-material/route"
import * as route_admin_mp_material__id_ from "@/modules/mp/routes/admin/mp-material/[id]/route"
import * as route_admin_mp_menu from "@/modules/mp/routes/admin/mp-menu/route"
import * as route_admin_mp_menu__id_ from "@/modules/mp/routes/admin/mp-menu/[id]/route"
import * as route_admin_mp_message from "@/modules/mp/routes/admin/mp-message/route"
import * as route_admin_mp_message__id_ from "@/modules/mp/routes/admin/mp-message/[id]/route"
import * as route_admin_mp_message_template from "@/modules/mp/routes/admin/mp-message-template/route"
import * as route_admin_mp_message_template__id_ from "@/modules/mp/routes/admin/mp-message-template/[id]/route"
import * as route_admin_mp_open from "@/modules/mp/routes/admin/mp-open/route"
import * as route_admin_mp_open__id_ from "@/modules/mp/routes/admin/mp-open/[id]/route"
import * as route_admin_mp_statistics from "@/modules/mp/routes/admin/mp-statistics/route"
import * as route_admin_mp_statistics__id_ from "@/modules/mp/routes/admin/mp-statistics/[id]/route"
import * as route_admin_mp_tag from "@/modules/mp/routes/admin/mp-tag/route"
import * as route_admin_mp_tag__id_ from "@/modules/mp/routes/admin/mp-tag/[id]/route"
import * as route_admin_mp_user from "@/modules/mp/routes/admin/mp-user/route"
import * as route_admin_mp_user__id_ from "@/modules/mp/routes/admin/mp-user/[id]/route"

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
    "admin:accounts/[id]:delete": (input: any) => invoke(route_admin_accounts__id_.DELETE, input),
    "admin:accounts/[id]:get": (input: any) => invoke(route_admin_accounts__id_.GET, input),
    "admin:accounts/[id]:put": (input: any) => invoke(route_admin_accounts__id_.PUT, input),
    "admin:accounts:get": (input: any) => invoke(route_admin_accounts.GET, input),
    "admin:accounts:post": (input: any) => invoke(route_admin_accounts.POST, input),
    "admin:fans/[id]:delete": (input: any) => invoke(route_admin_fans__id_.DELETE, input),
    "admin:fans/[id]:get": (input: any) => invoke(route_admin_fans__id_.GET, input),
    "admin:fans/[id]:put": (input: any) => invoke(route_admin_fans__id_.PUT, input),
    "admin:fans:get": (input: any) => invoke(route_admin_fans.GET, input),
    "admin:fans:post": (input: any) => invoke(route_admin_fans.POST, input),
    "admin:messages/[id]:delete": (input: any) => invoke(route_admin_messages__id_.DELETE, input),
    "admin:messages/[id]:get": (input: any) => invoke(route_admin_messages__id_.GET, input),
    "admin:messages/[id]:put": (input: any) => invoke(route_admin_messages__id_.PUT, input),
    "admin:messages:get": (input: any) => invoke(route_admin_messages.GET, input),
    "admin:messages:post": (input: any) => invoke(route_admin_messages.POST, input),
    "admin:mp-account/[id]:delete": (input: any) => invoke(route_admin_mp_account__id_.DELETE, input),
    "admin:mp-account/[id]:get": (input: any) => invoke(route_admin_mp_account__id_.GET, input),
    "admin:mp-account/[id]:put": (input: any) => invoke(route_admin_mp_account__id_.PUT, input),
    "admin:mp-account:get": (input: any) => invoke(route_admin_mp_account.GET, input),
    "admin:mp-account:post": (input: any) => invoke(route_admin_mp_account.POST, input),
    "admin:mp-auto-reply/[id]:delete": (input: any) => invoke(route_admin_mp_auto_reply__id_.DELETE, input),
    "admin:mp-auto-reply/[id]:get": (input: any) => invoke(route_admin_mp_auto_reply__id_.GET, input),
    "admin:mp-auto-reply/[id]:put": (input: any) => invoke(route_admin_mp_auto_reply__id_.PUT, input),
    "admin:mp-auto-reply:get": (input: any) => invoke(route_admin_mp_auto_reply.GET, input),
    "admin:mp-auto-reply:post": (input: any) => invoke(route_admin_mp_auto_reply.POST, input),
    "admin:mp-draft/[id]:delete": (input: any) => invoke(route_admin_mp_draft__id_.DELETE, input),
    "admin:mp-draft/[id]:get": (input: any) => invoke(route_admin_mp_draft__id_.GET, input),
    "admin:mp-draft/[id]:put": (input: any) => invoke(route_admin_mp_draft__id_.PUT, input),
    "admin:mp-draft:get": (input: any) => invoke(route_admin_mp_draft.GET, input),
    "admin:mp-draft:post": (input: any) => invoke(route_admin_mp_draft.POST, input),
    "admin:mp-free-publish/[id]:delete": (input: any) => invoke(route_admin_mp_free_publish__id_.DELETE, input),
    "admin:mp-free-publish/[id]:get": (input: any) => invoke(route_admin_mp_free_publish__id_.GET, input),
    "admin:mp-free-publish/[id]:put": (input: any) => invoke(route_admin_mp_free_publish__id_.PUT, input),
    "admin:mp-free-publish:get": (input: any) => invoke(route_admin_mp_free_publish.GET, input),
    "admin:mp-free-publish:post": (input: any) => invoke(route_admin_mp_free_publish.POST, input),
    "admin:mp-material/[id]:delete": (input: any) => invoke(route_admin_mp_material__id_.DELETE, input),
    "admin:mp-material/[id]:get": (input: any) => invoke(route_admin_mp_material__id_.GET, input),
    "admin:mp-material/[id]:put": (input: any) => invoke(route_admin_mp_material__id_.PUT, input),
    "admin:mp-material:get": (input: any) => invoke(route_admin_mp_material.GET, input),
    "admin:mp-material:post": (input: any) => invoke(route_admin_mp_material.POST, input),
    "admin:mp-menu/[id]:delete": (input: any) => invoke(route_admin_mp_menu__id_.DELETE, input),
    "admin:mp-menu/[id]:get": (input: any) => invoke(route_admin_mp_menu__id_.GET, input),
    "admin:mp-menu/[id]:put": (input: any) => invoke(route_admin_mp_menu__id_.PUT, input),
    "admin:mp-menu:get": (input: any) => invoke(route_admin_mp_menu.GET, input),
    "admin:mp-menu:post": (input: any) => invoke(route_admin_mp_menu.POST, input),
    "admin:mp-message-template/[id]:delete": (input: any) => invoke(route_admin_mp_message_template__id_.DELETE, input),
    "admin:mp-message-template/[id]:get": (input: any) => invoke(route_admin_mp_message_template__id_.GET, input),
    "admin:mp-message-template/[id]:put": (input: any) => invoke(route_admin_mp_message_template__id_.PUT, input),
    "admin:mp-message-template:get": (input: any) => invoke(route_admin_mp_message_template.GET, input),
    "admin:mp-message-template:post": (input: any) => invoke(route_admin_mp_message_template.POST, input),
    "admin:mp-message/[id]:delete": (input: any) => invoke(route_admin_mp_message__id_.DELETE, input),
    "admin:mp-message/[id]:get": (input: any) => invoke(route_admin_mp_message__id_.GET, input),
    "admin:mp-message/[id]:put": (input: any) => invoke(route_admin_mp_message__id_.PUT, input),
    "admin:mp-message:get": (input: any) => invoke(route_admin_mp_message.GET, input),
    "admin:mp-message:post": (input: any) => invoke(route_admin_mp_message.POST, input),
    "admin:mp-open/[id]:delete": (input: any) => invoke(route_admin_mp_open__id_.DELETE, input),
    "admin:mp-open/[id]:get": (input: any) => invoke(route_admin_mp_open__id_.GET, input),
    "admin:mp-open/[id]:put": (input: any) => invoke(route_admin_mp_open__id_.PUT, input),
    "admin:mp-open:get": (input: any) => invoke(route_admin_mp_open.GET, input),
    "admin:mp-open:post": (input: any) => invoke(route_admin_mp_open.POST, input),
    "admin:mp-statistics/[id]:delete": (input: any) => invoke(route_admin_mp_statistics__id_.DELETE, input),
    "admin:mp-statistics/[id]:get": (input: any) => invoke(route_admin_mp_statistics__id_.GET, input),
    "admin:mp-statistics/[id]:put": (input: any) => invoke(route_admin_mp_statistics__id_.PUT, input),
    "admin:mp-statistics:get": (input: any) => invoke(route_admin_mp_statistics.GET, input),
    "admin:mp-statistics:post": (input: any) => invoke(route_admin_mp_statistics.POST, input),
    "admin:mp-tag/[id]:delete": (input: any) => invoke(route_admin_mp_tag__id_.DELETE, input),
    "admin:mp-tag/[id]:get": (input: any) => invoke(route_admin_mp_tag__id_.GET, input),
    "admin:mp-tag/[id]:put": (input: any) => invoke(route_admin_mp_tag__id_.PUT, input),
    "admin:mp-tag:get": (input: any) => invoke(route_admin_mp_tag.GET, input),
    "admin:mp-tag:post": (input: any) => invoke(route_admin_mp_tag.POST, input),
    "admin:mp-user/[id]:delete": (input: any) => invoke(route_admin_mp_user__id_.DELETE, input),
    "admin:mp-user/[id]:get": (input: any) => invoke(route_admin_mp_user__id_.GET, input),
    "admin:mp-user/[id]:put": (input: any) => invoke(route_admin_mp_user__id_.PUT, input),
    "admin:mp-user:get": (input: any) => invoke(route_admin_mp_user.GET, input),
    "admin:mp-user:post": (input: any) => invoke(route_admin_mp_user.POST, input),
  },
})
