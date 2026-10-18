/**
 * aigw 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_channels from "@/modules/aigw/routes/admin/channels/route"
import * as route_admin_models from "@/modules/aigw/routes/admin/models/route"
import * as route_admin_tokens from "@/modules/aigw/routes/admin/tokens/route"
import * as route_admin_usages from "@/modules/aigw/routes/admin/usages/route"
import * as route_open_chat_completions from "@/modules/aigw/routes/open/chat/completions/route"
import * as route_open_embeddings from "@/modules/aigw/routes/open/embeddings/route"
import * as route_open_models from "@/modules/aigw/routes/open/models/route"
import * as route_open_quota from "@/modules/aigw/routes/open/quota/route"

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
    "admin:channels:delete": (input: any) => invoke(route_admin_channels.DELETE, input),
    "admin:channels:get": (input: any) => invoke(route_admin_channels.GET, input),
    "admin:channels:post": (input: any) => invoke(route_admin_channels.POST, input),
    "admin:channels:put": (input: any) => invoke(route_admin_channels.PUT, input),
    "admin:models:delete": (input: any) => invoke(route_admin_models.DELETE, input),
    "admin:models:get": (input: any) => invoke(route_admin_models.GET, input),
    "admin:models:post": (input: any) => invoke(route_admin_models.POST, input),
    "admin:models:put": (input: any) => invoke(route_admin_models.PUT, input),
    "admin:tokens:delete": (input: any) => invoke(route_admin_tokens.DELETE, input),
    "admin:tokens:get": (input: any) => invoke(route_admin_tokens.GET, input),
    "admin:tokens:post": (input: any) => invoke(route_admin_tokens.POST, input),
    "admin:tokens:put": (input: any) => invoke(route_admin_tokens.PUT, input),
    "admin:usages:get": (input: any) => invoke(route_admin_usages.GET, input),
    "open:chat/completions:post": (input: any) => invoke(route_open_chat_completions.POST, input),
    "open:embeddings:post": (input: any) => invoke(route_open_embeddings.POST, input),
    "open:models:get": (input: any) => invoke(route_open_models.GET, input),
    "open:quota:get": (input: any) => invoke(route_open_quota.GET, input),
  },
})
