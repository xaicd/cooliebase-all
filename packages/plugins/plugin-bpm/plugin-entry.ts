/**
 * bpm 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_bpm_category__id_ from "@/modules/bpm/routes/admin/bpm-category/[id]/route"
import * as route_admin_bpm_category from "@/modules/bpm/routes/admin/bpm-category/route"
import * as route_admin_bpm_comment__id_ from "@/modules/bpm/routes/admin/bpm-comment/[id]/route"
import * as route_admin_bpm_comment from "@/modules/bpm/routes/admin/bpm-comment/route"
import * as route_admin_bpm_form__id_ from "@/modules/bpm/routes/admin/bpm-form/[id]/route"
import * as route_admin_bpm_form from "@/modules/bpm/routes/admin/bpm-form/route"
import * as route_admin_bpm_model__id_ from "@/modules/bpm/routes/admin/bpm-model/[id]/route"
import * as route_admin_bpm_model from "@/modules/bpm/routes/admin/bpm-model/route"
import * as route_admin_bpm_oaleave__id_ from "@/modules/bpm/routes/admin/bpm-oaleave/[id]/route"
import * as route_admin_bpm_oaleave from "@/modules/bpm/routes/admin/bpm-oaleave/route"
import * as route_admin_bpm_process_definition__id_ from "@/modules/bpm/routes/admin/bpm-process-definition/[id]/route"
import * as route_admin_bpm_process_definition from "@/modules/bpm/routes/admin/bpm-process-definition/route"
import * as route_admin_bpm_process_expression__id_ from "@/modules/bpm/routes/admin/bpm-process-expression/[id]/route"
import * as route_admin_bpm_process_expression from "@/modules/bpm/routes/admin/bpm-process-expression/route"
import * as route_admin_bpm_process_instance_copy__id_ from "@/modules/bpm/routes/admin/bpm-process-instance-copy/[id]/route"
import * as route_admin_bpm_process_instance_copy from "@/modules/bpm/routes/admin/bpm-process-instance-copy/route"
import * as route_admin_bpm_process_instance__id_ from "@/modules/bpm/routes/admin/bpm-process-instance/[id]/route"
import * as route_admin_bpm_process_instance from "@/modules/bpm/routes/admin/bpm-process-instance/route"
import * as route_admin_bpm_process_listener__id_ from "@/modules/bpm/routes/admin/bpm-process-listener/[id]/route"
import * as route_admin_bpm_process_listener from "@/modules/bpm/routes/admin/bpm-process-listener/route"
import * as route_admin_bpm_task__id_ from "@/modules/bpm/routes/admin/bpm-task/[id]/route"
import * as route_admin_bpm_task from "@/modules/bpm/routes/admin/bpm-task/route"
import * as route_admin_bpm_user_group__id_ from "@/modules/bpm/routes/admin/bpm-user-group/[id]/route"
import * as route_admin_bpm_user_group from "@/modules/bpm/routes/admin/bpm-user-group/route"
import * as route_admin_process_definitions__id_ from "@/modules/bpm/routes/admin/process-definitions/[id]/route"
import * as route_admin_process_definitions from "@/modules/bpm/routes/admin/process-definitions/route"
import * as route_admin_tasks__id_ from "@/modules/bpm/routes/admin/tasks/[id]/route"
import * as route_admin_tasks from "@/modules/bpm/routes/admin/tasks/route"

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
    "admin:bpm-category/[id]:delete": (input: any) => invoke(route_admin_bpm_category__id_.DELETE, input),
    "admin:bpm-category/[id]:get": (input: any) => invoke(route_admin_bpm_category__id_.GET, input),
    "admin:bpm-category/[id]:put": (input: any) => invoke(route_admin_bpm_category__id_.PUT, input),
    "admin:bpm-category:get": (input: any) => invoke(route_admin_bpm_category.GET, input),
    "admin:bpm-category:post": (input: any) => invoke(route_admin_bpm_category.POST, input),
    "admin:bpm-comment/[id]:delete": (input: any) => invoke(route_admin_bpm_comment__id_.DELETE, input),
    "admin:bpm-comment/[id]:get": (input: any) => invoke(route_admin_bpm_comment__id_.GET, input),
    "admin:bpm-comment/[id]:put": (input: any) => invoke(route_admin_bpm_comment__id_.PUT, input),
    "admin:bpm-comment:get": (input: any) => invoke(route_admin_bpm_comment.GET, input),
    "admin:bpm-comment:post": (input: any) => invoke(route_admin_bpm_comment.POST, input),
    "admin:bpm-form/[id]:delete": (input: any) => invoke(route_admin_bpm_form__id_.DELETE, input),
    "admin:bpm-form/[id]:get": (input: any) => invoke(route_admin_bpm_form__id_.GET, input),
    "admin:bpm-form/[id]:put": (input: any) => invoke(route_admin_bpm_form__id_.PUT, input),
    "admin:bpm-form:get": (input: any) => invoke(route_admin_bpm_form.GET, input),
    "admin:bpm-form:post": (input: any) => invoke(route_admin_bpm_form.POST, input),
    "admin:bpm-model/[id]:delete": (input: any) => invoke(route_admin_bpm_model__id_.DELETE, input),
    "admin:bpm-model/[id]:get": (input: any) => invoke(route_admin_bpm_model__id_.GET, input),
    "admin:bpm-model/[id]:put": (input: any) => invoke(route_admin_bpm_model__id_.PUT, input),
    "admin:bpm-model:get": (input: any) => invoke(route_admin_bpm_model.GET, input),
    "admin:bpm-model:post": (input: any) => invoke(route_admin_bpm_model.POST, input),
    "admin:bpm-oaleave/[id]:delete": (input: any) => invoke(route_admin_bpm_oaleave__id_.DELETE, input),
    "admin:bpm-oaleave/[id]:get": (input: any) => invoke(route_admin_bpm_oaleave__id_.GET, input),
    "admin:bpm-oaleave/[id]:put": (input: any) => invoke(route_admin_bpm_oaleave__id_.PUT, input),
    "admin:bpm-oaleave:get": (input: any) => invoke(route_admin_bpm_oaleave.GET, input),
    "admin:bpm-oaleave:post": (input: any) => invoke(route_admin_bpm_oaleave.POST, input),
    "admin:bpm-process-definition/[id]:delete": (input: any) => invoke(route_admin_bpm_process_definition__id_.DELETE, input),
    "admin:bpm-process-definition/[id]:get": (input: any) => invoke(route_admin_bpm_process_definition__id_.GET, input),
    "admin:bpm-process-definition/[id]:put": (input: any) => invoke(route_admin_bpm_process_definition__id_.PUT, input),
    "admin:bpm-process-definition:get": (input: any) => invoke(route_admin_bpm_process_definition.GET, input),
    "admin:bpm-process-definition:post": (input: any) => invoke(route_admin_bpm_process_definition.POST, input),
    "admin:bpm-process-expression/[id]:delete": (input: any) => invoke(route_admin_bpm_process_expression__id_.DELETE, input),
    "admin:bpm-process-expression/[id]:get": (input: any) => invoke(route_admin_bpm_process_expression__id_.GET, input),
    "admin:bpm-process-expression/[id]:put": (input: any) => invoke(route_admin_bpm_process_expression__id_.PUT, input),
    "admin:bpm-process-expression:get": (input: any) => invoke(route_admin_bpm_process_expression.GET, input),
    "admin:bpm-process-expression:post": (input: any) => invoke(route_admin_bpm_process_expression.POST, input),
    "admin:bpm-process-instance-copy/[id]:delete": (input: any) => invoke(route_admin_bpm_process_instance_copy__id_.DELETE, input),
    "admin:bpm-process-instance-copy/[id]:get": (input: any) => invoke(route_admin_bpm_process_instance_copy__id_.GET, input),
    "admin:bpm-process-instance-copy/[id]:put": (input: any) => invoke(route_admin_bpm_process_instance_copy__id_.PUT, input),
    "admin:bpm-process-instance-copy:get": (input: any) => invoke(route_admin_bpm_process_instance_copy.GET, input),
    "admin:bpm-process-instance-copy:post": (input: any) => invoke(route_admin_bpm_process_instance_copy.POST, input),
    "admin:bpm-process-instance/[id]:delete": (input: any) => invoke(route_admin_bpm_process_instance__id_.DELETE, input),
    "admin:bpm-process-instance/[id]:get": (input: any) => invoke(route_admin_bpm_process_instance__id_.GET, input),
    "admin:bpm-process-instance/[id]:put": (input: any) => invoke(route_admin_bpm_process_instance__id_.PUT, input),
    "admin:bpm-process-instance:get": (input: any) => invoke(route_admin_bpm_process_instance.GET, input),
    "admin:bpm-process-instance:post": (input: any) => invoke(route_admin_bpm_process_instance.POST, input),
    "admin:bpm-process-listener/[id]:delete": (input: any) => invoke(route_admin_bpm_process_listener__id_.DELETE, input),
    "admin:bpm-process-listener/[id]:get": (input: any) => invoke(route_admin_bpm_process_listener__id_.GET, input),
    "admin:bpm-process-listener/[id]:put": (input: any) => invoke(route_admin_bpm_process_listener__id_.PUT, input),
    "admin:bpm-process-listener:get": (input: any) => invoke(route_admin_bpm_process_listener.GET, input),
    "admin:bpm-process-listener:post": (input: any) => invoke(route_admin_bpm_process_listener.POST, input),
    "admin:bpm-task/[id]:delete": (input: any) => invoke(route_admin_bpm_task__id_.DELETE, input),
    "admin:bpm-task/[id]:get": (input: any) => invoke(route_admin_bpm_task__id_.GET, input),
    "admin:bpm-task/[id]:put": (input: any) => invoke(route_admin_bpm_task__id_.PUT, input),
    "admin:bpm-task:get": (input: any) => invoke(route_admin_bpm_task.GET, input),
    "admin:bpm-task:post": (input: any) => invoke(route_admin_bpm_task.POST, input),
    "admin:bpm-user-group/[id]:delete": (input: any) => invoke(route_admin_bpm_user_group__id_.DELETE, input),
    "admin:bpm-user-group/[id]:get": (input: any) => invoke(route_admin_bpm_user_group__id_.GET, input),
    "admin:bpm-user-group/[id]:put": (input: any) => invoke(route_admin_bpm_user_group__id_.PUT, input),
    "admin:bpm-user-group:get": (input: any) => invoke(route_admin_bpm_user_group.GET, input),
    "admin:bpm-user-group:post": (input: any) => invoke(route_admin_bpm_user_group.POST, input),
    "admin:process-definitions/[id]:delete": (input: any) => invoke(route_admin_process_definitions__id_.DELETE, input),
    "admin:process-definitions/[id]:get": (input: any) => invoke(route_admin_process_definitions__id_.GET, input),
    "admin:process-definitions/[id]:put": (input: any) => invoke(route_admin_process_definitions__id_.PUT, input),
    "admin:process-definitions:get": (input: any) => invoke(route_admin_process_definitions.GET, input),
    "admin:process-definitions:post": (input: any) => invoke(route_admin_process_definitions.POST, input),
    "admin:tasks/[id]:delete": (input: any) => invoke(route_admin_tasks__id_.DELETE, input),
    "admin:tasks/[id]:get": (input: any) => invoke(route_admin_tasks__id_.GET, input),
    "admin:tasks/[id]:put": (input: any) => invoke(route_admin_tasks__id_.PUT, input),
    "admin:tasks:get": (input: any) => invoke(route_admin_tasks.GET, input),
    "admin:tasks:post": (input: any) => invoke(route_admin_tasks.POST, input),
  },
})
