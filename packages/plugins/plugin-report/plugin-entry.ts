/**
 * report 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_boards from "@/modules/report/routes/admin/boards/route"
import * as route_admin_boards__id_ from "@/modules/report/routes/admin/boards/[id]/route"
import * as route_admin_custom_sql_data_sources from "@/modules/report/routes/admin/custom-sql/data-sources/route"
import * as route_admin_custom_sql_execute from "@/modules/report/routes/admin/custom-sql/execute/route"
import * as route_admin_export from "@/modules/report/routes/admin/export/route"
import * as route_admin_export__id_ from "@/modules/report/routes/admin/export/[id]/route"
import * as route_admin_go_view_data from "@/modules/report/routes/admin/go-view-data/route"
import * as route_admin_go_view_data__id_ from "@/modules/report/routes/admin/go-view-data/[id]/route"
import * as route_admin_go_view_project from "@/modules/report/routes/admin/go-view-project/route"
import * as route_admin_go_view_project__id_ from "@/modules/report/routes/admin/go-view-project/[id]/route"

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
    "admin:boards/[id]:delete": (input: any) => invoke(route_admin_boards__id_.DELETE, input),
    "admin:boards/[id]:get": (input: any) => invoke(route_admin_boards__id_.GET, input),
    "admin:boards/[id]:put": (input: any) => invoke(route_admin_boards__id_.PUT, input),
    "admin:boards:get": (input: any) => invoke(route_admin_boards.GET, input),
    "admin:boards:post": (input: any) => invoke(route_admin_boards.POST, input),
    "admin:custom-sql/data-sources:get": (input: any) => invoke(route_admin_custom_sql_data_sources.GET, input),
    "admin:custom-sql/execute:post": (input: any) => invoke(route_admin_custom_sql_execute.POST, input),
    "admin:export/[id]:delete": (input: any) => invoke(route_admin_export__id_.DELETE, input),
    "admin:export/[id]:get": (input: any) => invoke(route_admin_export__id_.GET, input),
    "admin:export/[id]:put": (input: any) => invoke(route_admin_export__id_.PUT, input),
    "admin:export:get": (input: any) => invoke(route_admin_export.GET, input),
    "admin:export:post": (input: any) => invoke(route_admin_export.POST, input),
    "admin:go-view-data/[id]:delete": (input: any) => invoke(route_admin_go_view_data__id_.DELETE, input),
    "admin:go-view-data/[id]:get": (input: any) => invoke(route_admin_go_view_data__id_.GET, input),
    "admin:go-view-data/[id]:put": (input: any) => invoke(route_admin_go_view_data__id_.PUT, input),
    "admin:go-view-data:get": (input: any) => invoke(route_admin_go_view_data.GET, input),
    "admin:go-view-data:post": (input: any) => invoke(route_admin_go_view_data.POST, input),
    "admin:go-view-project/[id]:delete": (input: any) => invoke(route_admin_go_view_project__id_.DELETE, input),
    "admin:go-view-project/[id]:get": (input: any) => invoke(route_admin_go_view_project__id_.GET, input),
    "admin:go-view-project/[id]:put": (input: any) => invoke(route_admin_go_view_project__id_.PUT, input),
    "admin:go-view-project:get": (input: any) => invoke(route_admin_go_view_project.GET, input),
    "admin:go-view-project:post": (input: any) => invoke(route_admin_go_view_project.POST, input),
  },
})
