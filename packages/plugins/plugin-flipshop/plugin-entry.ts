/**
 * 翻牌小店 (flipshop) 域的**第一方插件入口**（合并/同进程形态）。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 * 本文件的 import 块与 routes 映射由 `pnpm run plugins:sync-routes` 从 routes/ 真源重派生。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_products from "@/modules/flipshop/routes/admin/products/route"
import * as route_admin_products__id_ from "@/modules/flipshop/routes/admin/products/[id]/route"

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
  async setup(ctx) { ctx.logger.info("flipshop ready (merged)") },
  async onHealth() { return { status: "ok" } },
  async onShutdown() {},
  routes: {
    "admin:products/[id]:get": (input: any) => invoke(route_admin_products__id_.GET, input),
    "admin:products:get": (input: any) => invoke(route_admin_products.GET, input),
    "admin:products:post": (input: any) => invoke(route_admin_products.POST, input),
  },
})
