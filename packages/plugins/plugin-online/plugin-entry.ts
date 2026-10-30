/**
 * online 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_definitions from "@/modules/online/routes/admin/definitions/route"
import * as route_admin_definitions__code_ from "@/modules/online/routes/admin/definitions/[code]/route"
import * as route_admin_definitions__code__archive from "@/modules/online/routes/admin/definitions/[code]/archive/route"
import * as route_admin_definitions__code__codegen_download from "@/modules/online/routes/admin/definitions/[code]/codegen/download/route"
import * as route_admin_definitions__code__codegen_preview from "@/modules/online/routes/admin/definitions/[code]/codegen/preview/route"
import * as route_admin_definitions__code__draft from "@/modules/online/routes/admin/definitions/[code]/draft/route"
import * as route_admin_definitions__code__lookup_dictionary from "@/modules/online/routes/admin/definitions/[code]/lookup/dictionary/route"
import * as route_admin_definitions__code__normalize_system_fields from "@/modules/online/routes/admin/definitions/[code]/normalize-system-fields/route"
import * as route_admin_definitions__code__publish from "@/modules/online/routes/admin/definitions/[code]/publish/route"
import * as route_admin_definitions__code__rollback from "@/modules/online/routes/admin/definitions/[code]/rollback/route"
import * as route_admin_definitions__code__schema_plans from "@/modules/online/routes/admin/definitions/[code]/schema-plans/route"
import * as route_admin_definitions__code__schema_plans__planId_ from "@/modules/online/routes/admin/definitions/[code]/schema-plans/[planId]/route"
import * as route_admin_definitions__code__schema_plans__planId__apply from "@/modules/online/routes/admin/definitions/[code]/schema-plans/[planId]/apply/route"
import * as route_admin_definitions__code__schema_plans__planId__approve from "@/modules/online/routes/admin/definitions/[code]/schema-plans/[planId]/approve/route"
import * as route_admin_definitions__code__test_sessions from "@/modules/online/routes/admin/definitions/[code]/test-sessions/route"
import * as route_admin_definitions__code__test_sessions__sessionId_ from "@/modules/online/routes/admin/definitions/[code]/test-sessions/[sessionId]/route"
import * as route_admin_definitions__code__test_sessions__sessionId__records from "@/modules/online/routes/admin/definitions/[code]/test-sessions/[sessionId]/records/route"
import * as route_admin_definitions__code__test_sessions__sessionId__records__recordId_ from "@/modules/online/routes/admin/definitions/[code]/test-sessions/[sessionId]/records/[recordId]/route"
import * as route_admin_definitions__code__validate from "@/modules/online/routes/admin/definitions/[code]/validate/route"
import * as route_admin_definitions_codegen_download from "@/modules/online/routes/admin/definitions/codegen/download/route"
import * as route_admin_page_schema__entity_ from "@/modules/online/routes/admin/page-schema/[entity]/route"

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
    "admin:definitions/[code]/archive:post": (input: any) => invoke(route_admin_definitions__code__archive.POST, input),
    "admin:definitions/[code]/codegen/download:get": (input: any) => invoke(route_admin_definitions__code__codegen_download.GET, input),
    "admin:definitions/[code]/codegen/preview:post": (input: any) => invoke(route_admin_definitions__code__codegen_preview.POST, input),
    "admin:definitions/[code]/draft:put": (input: any) => invoke(route_admin_definitions__code__draft.PUT, input),
    "admin:definitions/[code]/lookup/dictionary:get": (input: any) => invoke(route_admin_definitions__code__lookup_dictionary.GET, input),
    "admin:definitions/[code]/normalize-system-fields:post": (input: any) => invoke(route_admin_definitions__code__normalize_system_fields.POST, input),
    "admin:definitions/[code]/publish:post": (input: any) => invoke(route_admin_definitions__code__publish.POST, input),
    "admin:definitions/[code]/rollback:post": (input: any) => invoke(route_admin_definitions__code__rollback.POST, input),
    "admin:definitions/[code]:delete": (input: any) => invoke(route_admin_definitions__code_.DELETE, input),
    "admin:definitions/[code]:get": (input: any) => invoke(route_admin_definitions__code_.GET, input),
    "admin:definitions/[code]:put": (input: any) => invoke(route_admin_definitions__code_.PUT, input),
    "admin:definitions/[code]/schema-plans/[planId]/apply:post": (input: any) => invoke(route_admin_definitions__code__schema_plans__planId__apply.POST, input),
    "admin:definitions/[code]/schema-plans/[planId]/approve:post": (input: any) => invoke(route_admin_definitions__code__schema_plans__planId__approve.POST, input),
    "admin:definitions/[code]/schema-plans/[planId]:get": (input: any) => invoke(route_admin_definitions__code__schema_plans__planId_.GET, input),
    "admin:definitions/[code]/schema-plans:get": (input: any) => invoke(route_admin_definitions__code__schema_plans.GET, input),
    "admin:definitions/[code]/schema-plans:post": (input: any) => invoke(route_admin_definitions__code__schema_plans.POST, input),
    "admin:definitions/[code]/test-sessions/[sessionId]/records/[recordId]:delete": (input: any) => invoke(route_admin_definitions__code__test_sessions__sessionId__records__recordId_.DELETE, input),
    "admin:definitions/[code]/test-sessions/[sessionId]/records/[recordId]:put": (input: any) => invoke(route_admin_definitions__code__test_sessions__sessionId__records__recordId_.PUT, input),
    "admin:definitions/[code]/test-sessions/[sessionId]/records:get": (input: any) => invoke(route_admin_definitions__code__test_sessions__sessionId__records.GET, input),
    "admin:definitions/[code]/test-sessions/[sessionId]/records:post": (input: any) => invoke(route_admin_definitions__code__test_sessions__sessionId__records.POST, input),
    "admin:definitions/[code]/test-sessions/[sessionId]:get": (input: any) => invoke(route_admin_definitions__code__test_sessions__sessionId_.GET, input),
    "admin:definitions/[code]/test-sessions:post": (input: any) => invoke(route_admin_definitions__code__test_sessions.POST, input),
    "admin:definitions/[code]/validate:post": (input: any) => invoke(route_admin_definitions__code__validate.POST, input),
    "admin:definitions/codegen/download:post": (input: any) => invoke(route_admin_definitions_codegen_download.POST, input),
    "admin:definitions:get": (input: any) => invoke(route_admin_definitions.GET, input),
    "admin:definitions:post": (input: any) => invoke(route_admin_definitions.POST, input),
    "admin:page-schema/[entity]:get": (input: any) => invoke(route_admin_page_schema__entity_.GET, input),
    "admin:page-schema/[entity]:post": (input: any) => invoke(route_admin_page_schema__entity_.POST, input),
    "admin:page-schema/[entity]:put": (input: any) => invoke(route_admin_page_schema__entity_.PUT, input),
  },
})
