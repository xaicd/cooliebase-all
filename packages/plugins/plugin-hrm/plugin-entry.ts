/**
 * hrm 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_hrm_employee from "@/modules/hrm/routes/admin/hrm-employee/route"
import * as route_admin_hrm_employee__id_ from "@/modules/hrm/routes/admin/hrm-employee/[id]/route"
import * as route_admin_hrm_employee_export from "@/modules/hrm/routes/admin/hrm-employee/export/route"
import * as route_admin_hrm_employee_import from "@/modules/hrm/routes/admin/hrm-employee/import/route"
import * as route_admin_hrm_employee_import_template from "@/modules/hrm/routes/admin/hrm-employee/import-template/route"
import * as route_admin_hrm_payroll from "@/modules/hrm/routes/admin/hrm-payroll/route"
import * as route_admin_hrm_payroll__id_ from "@/modules/hrm/routes/admin/hrm-payroll/[id]/route"
import * as route_admin_hrm_payroll_export from "@/modules/hrm/routes/admin/hrm-payroll/export/route"
import * as route_admin_hrm_payroll_import from "@/modules/hrm/routes/admin/hrm-payroll/import/route"
import * as route_admin_hrm_payroll_import_template from "@/modules/hrm/routes/admin/hrm-payroll/import-template/route"
import * as route_admin_hrm_position from "@/modules/hrm/routes/admin/hrm-position/route"
import * as route_admin_hrm_position__id_ from "@/modules/hrm/routes/admin/hrm-position/[id]/route"
import * as route_admin_hrm_position_export from "@/modules/hrm/routes/admin/hrm-position/export/route"
import * as route_admin_hrm_position_import from "@/modules/hrm/routes/admin/hrm-position/import/route"
import * as route_admin_hrm_position_import_template from "@/modules/hrm/routes/admin/hrm-position/import-template/route"

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
    "admin:hrm-employee/[id]:delete": (input: any) => invoke(route_admin_hrm_employee__id_.DELETE, input),
    "admin:hrm-employee/[id]:get": (input: any) => invoke(route_admin_hrm_employee__id_.GET, input),
    "admin:hrm-employee/[id]:put": (input: any) => invoke(route_admin_hrm_employee__id_.PUT, input),
    "admin:hrm-employee/export:post": (input: any) => invoke(route_admin_hrm_employee_export.POST, input),
    "admin:hrm-employee/import-template:get": (input: any) => invoke(route_admin_hrm_employee_import_template.GET, input),
    "admin:hrm-employee/import:post": (input: any) => invoke(route_admin_hrm_employee_import.POST, input),
    "admin:hrm-employee:delete": (input: any) => invoke(route_admin_hrm_employee.DELETE, input),
    "admin:hrm-employee:get": (input: any) => invoke(route_admin_hrm_employee.GET, input),
    "admin:hrm-employee:post": (input: any) => invoke(route_admin_hrm_employee.POST, input),
    "admin:hrm-employee:put": (input: any) => invoke(route_admin_hrm_employee.PUT, input),
    "admin:hrm-payroll/[id]:delete": (input: any) => invoke(route_admin_hrm_payroll__id_.DELETE, input),
    "admin:hrm-payroll/[id]:get": (input: any) => invoke(route_admin_hrm_payroll__id_.GET, input),
    "admin:hrm-payroll/[id]:put": (input: any) => invoke(route_admin_hrm_payroll__id_.PUT, input),
    "admin:hrm-payroll/export:post": (input: any) => invoke(route_admin_hrm_payroll_export.POST, input),
    "admin:hrm-payroll/import-template:get": (input: any) => invoke(route_admin_hrm_payroll_import_template.GET, input),
    "admin:hrm-payroll/import:post": (input: any) => invoke(route_admin_hrm_payroll_import.POST, input),
    "admin:hrm-payroll:delete": (input: any) => invoke(route_admin_hrm_payroll.DELETE, input),
    "admin:hrm-payroll:get": (input: any) => invoke(route_admin_hrm_payroll.GET, input),
    "admin:hrm-payroll:post": (input: any) => invoke(route_admin_hrm_payroll.POST, input),
    "admin:hrm-payroll:put": (input: any) => invoke(route_admin_hrm_payroll.PUT, input),
    "admin:hrm-position/[id]:delete": (input: any) => invoke(route_admin_hrm_position__id_.DELETE, input),
    "admin:hrm-position/[id]:get": (input: any) => invoke(route_admin_hrm_position__id_.GET, input),
    "admin:hrm-position/[id]:put": (input: any) => invoke(route_admin_hrm_position__id_.PUT, input),
    "admin:hrm-position/export:post": (input: any) => invoke(route_admin_hrm_position_export.POST, input),
    "admin:hrm-position/import-template:get": (input: any) => invoke(route_admin_hrm_position_import_template.GET, input),
    "admin:hrm-position/import:post": (input: any) => invoke(route_admin_hrm_position_import.POST, input),
    "admin:hrm-position:delete": (input: any) => invoke(route_admin_hrm_position.DELETE, input),
    "admin:hrm-position:get": (input: any) => invoke(route_admin_hrm_position.GET, input),
    "admin:hrm-position:post": (input: any) => invoke(route_admin_hrm_position.POST, input),
    "admin:hrm-position:put": (input: any) => invoke(route_admin_hrm_position.PUT, input),
  },
})
