/**
 * pms 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_pms_milestone from "@/modules/pms/routes/admin/pms-milestone/route"
import * as route_admin_pms_milestone__id_ from "@/modules/pms/routes/admin/pms-milestone/[id]/route"
import * as route_admin_pms_milestone_export from "@/modules/pms/routes/admin/pms-milestone/export/route"
import * as route_admin_pms_milestone_import from "@/modules/pms/routes/admin/pms-milestone/import/route"
import * as route_admin_pms_milestone_import_template from "@/modules/pms/routes/admin/pms-milestone/import-template/route"
import * as route_admin_pms_project from "@/modules/pms/routes/admin/pms-project/route"
import * as route_admin_pms_project__id_ from "@/modules/pms/routes/admin/pms-project/[id]/route"
import * as route_admin_pms_project_export from "@/modules/pms/routes/admin/pms-project/export/route"
import * as route_admin_pms_project_import from "@/modules/pms/routes/admin/pms-project/import/route"
import * as route_admin_pms_project_import_template from "@/modules/pms/routes/admin/pms-project/import-template/route"
import * as route_admin_pms_timesheet from "@/modules/pms/routes/admin/pms-timesheet/route"
import * as route_admin_pms_timesheet__id_ from "@/modules/pms/routes/admin/pms-timesheet/[id]/route"
import * as route_admin_pms_timesheet_export from "@/modules/pms/routes/admin/pms-timesheet/export/route"
import * as route_admin_pms_timesheet_import from "@/modules/pms/routes/admin/pms-timesheet/import/route"
import * as route_admin_pms_timesheet_import_template from "@/modules/pms/routes/admin/pms-timesheet/import-template/route"

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
    "admin:pms-milestone/[id]:delete": (input: any) => invoke(route_admin_pms_milestone__id_.DELETE, input),
    "admin:pms-milestone/[id]:get": (input: any) => invoke(route_admin_pms_milestone__id_.GET, input),
    "admin:pms-milestone/[id]:put": (input: any) => invoke(route_admin_pms_milestone__id_.PUT, input),
    "admin:pms-milestone/export:post": (input: any) => invoke(route_admin_pms_milestone_export.POST, input),
    "admin:pms-milestone/import-template:get": (input: any) => invoke(route_admin_pms_milestone_import_template.GET, input),
    "admin:pms-milestone/import:post": (input: any) => invoke(route_admin_pms_milestone_import.POST, input),
    "admin:pms-milestone:delete": (input: any) => invoke(route_admin_pms_milestone.DELETE, input),
    "admin:pms-milestone:get": (input: any) => invoke(route_admin_pms_milestone.GET, input),
    "admin:pms-milestone:post": (input: any) => invoke(route_admin_pms_milestone.POST, input),
    "admin:pms-milestone:put": (input: any) => invoke(route_admin_pms_milestone.PUT, input),
    "admin:pms-project/[id]:delete": (input: any) => invoke(route_admin_pms_project__id_.DELETE, input),
    "admin:pms-project/[id]:get": (input: any) => invoke(route_admin_pms_project__id_.GET, input),
    "admin:pms-project/[id]:put": (input: any) => invoke(route_admin_pms_project__id_.PUT, input),
    "admin:pms-project/export:post": (input: any) => invoke(route_admin_pms_project_export.POST, input),
    "admin:pms-project/import-template:get": (input: any) => invoke(route_admin_pms_project_import_template.GET, input),
    "admin:pms-project/import:post": (input: any) => invoke(route_admin_pms_project_import.POST, input),
    "admin:pms-project:delete": (input: any) => invoke(route_admin_pms_project.DELETE, input),
    "admin:pms-project:get": (input: any) => invoke(route_admin_pms_project.GET, input),
    "admin:pms-project:post": (input: any) => invoke(route_admin_pms_project.POST, input),
    "admin:pms-project:put": (input: any) => invoke(route_admin_pms_project.PUT, input),
    "admin:pms-timesheet/[id]:delete": (input: any) => invoke(route_admin_pms_timesheet__id_.DELETE, input),
    "admin:pms-timesheet/[id]:get": (input: any) => invoke(route_admin_pms_timesheet__id_.GET, input),
    "admin:pms-timesheet/[id]:put": (input: any) => invoke(route_admin_pms_timesheet__id_.PUT, input),
    "admin:pms-timesheet/export:post": (input: any) => invoke(route_admin_pms_timesheet_export.POST, input),
    "admin:pms-timesheet/import-template:get": (input: any) => invoke(route_admin_pms_timesheet_import_template.GET, input),
    "admin:pms-timesheet/import:post": (input: any) => invoke(route_admin_pms_timesheet_import.POST, input),
    "admin:pms-timesheet:delete": (input: any) => invoke(route_admin_pms_timesheet.DELETE, input),
    "admin:pms-timesheet:get": (input: any) => invoke(route_admin_pms_timesheet.GET, input),
    "admin:pms-timesheet:post": (input: any) => invoke(route_admin_pms_timesheet.POST, input),
    "admin:pms-timesheet:put": (input: any) => invoke(route_admin_pms_timesheet.PUT, input),
  },
})
