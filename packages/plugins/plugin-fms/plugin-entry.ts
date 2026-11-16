/**
 * fms 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_fms_account from "@/modules/fms/routes/admin/fms-account/route"
import * as route_admin_fms_account__id_ from "@/modules/fms/routes/admin/fms-account/[id]/route"
import * as route_admin_fms_account_export from "@/modules/fms/routes/admin/fms-account/export/route"
import * as route_admin_fms_account_import from "@/modules/fms/routes/admin/fms-account/import/route"
import * as route_admin_fms_account_import_template from "@/modules/fms/routes/admin/fms-account/import-template/route"
import * as route_admin_fms_reconcile from "@/modules/fms/routes/admin/fms-reconcile/route"
import * as route_admin_fms_reconcile__id_ from "@/modules/fms/routes/admin/fms-reconcile/[id]/route"
import * as route_admin_fms_reconcile_export from "@/modules/fms/routes/admin/fms-reconcile/export/route"
import * as route_admin_fms_reconcile_import from "@/modules/fms/routes/admin/fms-reconcile/import/route"
import * as route_admin_fms_reconcile_import_template from "@/modules/fms/routes/admin/fms-reconcile/import-template/route"
import * as route_admin_fms_voucher from "@/modules/fms/routes/admin/fms-voucher/route"
import * as route_admin_fms_voucher__id_ from "@/modules/fms/routes/admin/fms-voucher/[id]/route"
import * as route_admin_fms_voucher_export from "@/modules/fms/routes/admin/fms-voucher/export/route"
import * as route_admin_fms_voucher_import from "@/modules/fms/routes/admin/fms-voucher/import/route"
import * as route_admin_fms_voucher_import_template from "@/modules/fms/routes/admin/fms-voucher/import-template/route"

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
    "admin:fms-account/[id]:delete": (input: any) => invoke(route_admin_fms_account__id_.DELETE, input),
    "admin:fms-account/[id]:get": (input: any) => invoke(route_admin_fms_account__id_.GET, input),
    "admin:fms-account/[id]:put": (input: any) => invoke(route_admin_fms_account__id_.PUT, input),
    "admin:fms-account/export:post": (input: any) => invoke(route_admin_fms_account_export.POST, input),
    "admin:fms-account/import-template:get": (input: any) => invoke(route_admin_fms_account_import_template.GET, input),
    "admin:fms-account/import:post": (input: any) => invoke(route_admin_fms_account_import.POST, input),
    "admin:fms-account:delete": (input: any) => invoke(route_admin_fms_account.DELETE, input),
    "admin:fms-account:get": (input: any) => invoke(route_admin_fms_account.GET, input),
    "admin:fms-account:post": (input: any) => invoke(route_admin_fms_account.POST, input),
    "admin:fms-account:put": (input: any) => invoke(route_admin_fms_account.PUT, input),
    "admin:fms-reconcile/[id]:delete": (input: any) => invoke(route_admin_fms_reconcile__id_.DELETE, input),
    "admin:fms-reconcile/[id]:get": (input: any) => invoke(route_admin_fms_reconcile__id_.GET, input),
    "admin:fms-reconcile/[id]:put": (input: any) => invoke(route_admin_fms_reconcile__id_.PUT, input),
    "admin:fms-reconcile/export:post": (input: any) => invoke(route_admin_fms_reconcile_export.POST, input),
    "admin:fms-reconcile/import-template:get": (input: any) => invoke(route_admin_fms_reconcile_import_template.GET, input),
    "admin:fms-reconcile/import:post": (input: any) => invoke(route_admin_fms_reconcile_import.POST, input),
    "admin:fms-reconcile:delete": (input: any) => invoke(route_admin_fms_reconcile.DELETE, input),
    "admin:fms-reconcile:get": (input: any) => invoke(route_admin_fms_reconcile.GET, input),
    "admin:fms-reconcile:post": (input: any) => invoke(route_admin_fms_reconcile.POST, input),
    "admin:fms-reconcile:put": (input: any) => invoke(route_admin_fms_reconcile.PUT, input),
    "admin:fms-voucher/[id]:delete": (input: any) => invoke(route_admin_fms_voucher__id_.DELETE, input),
    "admin:fms-voucher/[id]:get": (input: any) => invoke(route_admin_fms_voucher__id_.GET, input),
    "admin:fms-voucher/[id]:put": (input: any) => invoke(route_admin_fms_voucher__id_.PUT, input),
    "admin:fms-voucher/export:post": (input: any) => invoke(route_admin_fms_voucher_export.POST, input),
    "admin:fms-voucher/import-template:get": (input: any) => invoke(route_admin_fms_voucher_import_template.GET, input),
    "admin:fms-voucher/import:post": (input: any) => invoke(route_admin_fms_voucher_import.POST, input),
    "admin:fms-voucher:delete": (input: any) => invoke(route_admin_fms_voucher.DELETE, input),
    "admin:fms-voucher:get": (input: any) => invoke(route_admin_fms_voucher.GET, input),
    "admin:fms-voucher:post": (input: any) => invoke(route_admin_fms_voucher.POST, input),
    "admin:fms-voucher:put": (input: any) => invoke(route_admin_fms_voucher.PUT, input),
  },
})
