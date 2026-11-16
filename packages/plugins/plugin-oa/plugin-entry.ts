/**
 * oa 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_oa_attendance from "@/modules/oa/routes/admin/oa-attendance/route"
import * as route_admin_oa_attendance__id_ from "@/modules/oa/routes/admin/oa-attendance/[id]/route"
import * as route_admin_oa_attendance_export from "@/modules/oa/routes/admin/oa-attendance/export/route"
import * as route_admin_oa_attendance_import from "@/modules/oa/routes/admin/oa-attendance/import/route"
import * as route_admin_oa_attendance_import_template from "@/modules/oa/routes/admin/oa-attendance/import-template/route"
import * as route_admin_oa_leave_apply from "@/modules/oa/routes/admin/oa-leave-apply/route"
import * as route_admin_oa_leave_apply__id_ from "@/modules/oa/routes/admin/oa-leave-apply/[id]/route"
import * as route_admin_oa_leave_apply_export from "@/modules/oa/routes/admin/oa-leave-apply/export/route"
import * as route_admin_oa_leave_apply_import from "@/modules/oa/routes/admin/oa-leave-apply/import/route"
import * as route_admin_oa_leave_apply_import_template from "@/modules/oa/routes/admin/oa-leave-apply/import-template/route"
import * as route_admin_oa_notice from "@/modules/oa/routes/admin/oa-notice/route"
import * as route_admin_oa_notice__id_ from "@/modules/oa/routes/admin/oa-notice/[id]/route"
import * as route_admin_oa_notice_export from "@/modules/oa/routes/admin/oa-notice/export/route"
import * as route_admin_oa_notice_import from "@/modules/oa/routes/admin/oa-notice/import/route"
import * as route_admin_oa_notice_import_template from "@/modules/oa/routes/admin/oa-notice/import-template/route"

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
    "admin:oa-attendance/[id]:delete": (input: any) => invoke(route_admin_oa_attendance__id_.DELETE, input),
    "admin:oa-attendance/[id]:get": (input: any) => invoke(route_admin_oa_attendance__id_.GET, input),
    "admin:oa-attendance/[id]:put": (input: any) => invoke(route_admin_oa_attendance__id_.PUT, input),
    "admin:oa-attendance/export:post": (input: any) => invoke(route_admin_oa_attendance_export.POST, input),
    "admin:oa-attendance/import-template:get": (input: any) => invoke(route_admin_oa_attendance_import_template.GET, input),
    "admin:oa-attendance/import:post": (input: any) => invoke(route_admin_oa_attendance_import.POST, input),
    "admin:oa-attendance:delete": (input: any) => invoke(route_admin_oa_attendance.DELETE, input),
    "admin:oa-attendance:get": (input: any) => invoke(route_admin_oa_attendance.GET, input),
    "admin:oa-attendance:post": (input: any) => invoke(route_admin_oa_attendance.POST, input),
    "admin:oa-attendance:put": (input: any) => invoke(route_admin_oa_attendance.PUT, input),
    "admin:oa-leave-apply/[id]:delete": (input: any) => invoke(route_admin_oa_leave_apply__id_.DELETE, input),
    "admin:oa-leave-apply/[id]:get": (input: any) => invoke(route_admin_oa_leave_apply__id_.GET, input),
    "admin:oa-leave-apply/[id]:put": (input: any) => invoke(route_admin_oa_leave_apply__id_.PUT, input),
    "admin:oa-leave-apply/export:post": (input: any) => invoke(route_admin_oa_leave_apply_export.POST, input),
    "admin:oa-leave-apply/import-template:get": (input: any) => invoke(route_admin_oa_leave_apply_import_template.GET, input),
    "admin:oa-leave-apply/import:post": (input: any) => invoke(route_admin_oa_leave_apply_import.POST, input),
    "admin:oa-leave-apply:delete": (input: any) => invoke(route_admin_oa_leave_apply.DELETE, input),
    "admin:oa-leave-apply:get": (input: any) => invoke(route_admin_oa_leave_apply.GET, input),
    "admin:oa-leave-apply:post": (input: any) => invoke(route_admin_oa_leave_apply.POST, input),
    "admin:oa-leave-apply:put": (input: any) => invoke(route_admin_oa_leave_apply.PUT, input),
    "admin:oa-notice/[id]:delete": (input: any) => invoke(route_admin_oa_notice__id_.DELETE, input),
    "admin:oa-notice/[id]:get": (input: any) => invoke(route_admin_oa_notice__id_.GET, input),
    "admin:oa-notice/[id]:put": (input: any) => invoke(route_admin_oa_notice__id_.PUT, input),
    "admin:oa-notice/export:post": (input: any) => invoke(route_admin_oa_notice_export.POST, input),
    "admin:oa-notice/import-template:get": (input: any) => invoke(route_admin_oa_notice_import_template.GET, input),
    "admin:oa-notice/import:post": (input: any) => invoke(route_admin_oa_notice_import.POST, input),
    "admin:oa-notice:delete": (input: any) => invoke(route_admin_oa_notice.DELETE, input),
    "admin:oa-notice:get": (input: any) => invoke(route_admin_oa_notice.GET, input),
    "admin:oa-notice:post": (input: any) => invoke(route_admin_oa_notice.POST, input),
    "admin:oa-notice:put": (input: any) => invoke(route_admin_oa_notice.PUT, input),
  },
})
