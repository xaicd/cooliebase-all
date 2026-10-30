/**
 * member 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_address from "@/modules/member/routes/admin/address/route"
import * as route_admin_address__id_ from "@/modules/member/routes/admin/address/[id]/route"
import * as route_admin_levels from "@/modules/member/routes/admin/levels/route"
import * as route_admin_levels__id_ from "@/modules/member/routes/admin/levels/[id]/route"
import * as route_admin_member_address from "@/modules/member/routes/admin/member-address/route"
import * as route_admin_member_address__id_ from "@/modules/member/routes/admin/member-address/[id]/route"
import * as route_admin_member_config from "@/modules/member/routes/admin/member-config/route"
import * as route_admin_member_config__id_ from "@/modules/member/routes/admin/member-config/[id]/route"
import * as route_admin_member_experience_record from "@/modules/member/routes/admin/member-experience-record/route"
import * as route_admin_member_experience_record__id_ from "@/modules/member/routes/admin/member-experience-record/[id]/route"
import * as route_admin_member_group from "@/modules/member/routes/admin/member-group/route"
import * as route_admin_member_group__id_ from "@/modules/member/routes/admin/member-group/[id]/route"
import * as route_admin_member_level from "@/modules/member/routes/admin/member-level/route"
import * as route_admin_member_level__id_ from "@/modules/member/routes/admin/member-level/[id]/route"
import * as route_admin_member_level_record from "@/modules/member/routes/admin/member-level-record/route"
import * as route_admin_member_level_record__id_ from "@/modules/member/routes/admin/member-level-record/[id]/route"
import * as route_admin_member_point_record from "@/modules/member/routes/admin/member-point-record/route"
import * as route_admin_member_point_record__id_ from "@/modules/member/routes/admin/member-point-record/[id]/route"
import * as route_admin_member_sign_in_config from "@/modules/member/routes/admin/member-sign-in-config/route"
import * as route_admin_member_sign_in_config__id_ from "@/modules/member/routes/admin/member-sign-in-config/[id]/route"
import * as route_admin_member_sign_in_record from "@/modules/member/routes/admin/member-sign-in-record/route"
import * as route_admin_member_sign_in_record__id_ from "@/modules/member/routes/admin/member-sign-in-record/[id]/route"
import * as route_admin_member_tag from "@/modules/member/routes/admin/member-tag/route"
import * as route_admin_member_tag__id_ from "@/modules/member/routes/admin/member-tag/[id]/route"
import * as route_admin_member_user from "@/modules/member/routes/admin/member-user/route"
import * as route_admin_member_user__id_ from "@/modules/member/routes/admin/member-user/[id]/route"
import * as route_admin_points from "@/modules/member/routes/admin/points/route"
import * as route_admin_points__id_ from "@/modules/member/routes/admin/points/[id]/route"
import * as route_admin_users from "@/modules/member/routes/admin/users/route"
import * as route_admin_users__id_ from "@/modules/member/routes/admin/users/[id]/route"
import * as route_app_auth_login from "@/modules/member/routes/app/auth/login/route"
import * as route_app_auth_logout from "@/modules/member/routes/app/auth/logout/route"
import * as route_app_auth_register from "@/modules/member/routes/app/auth/register/route"
import * as route_app_profile from "@/modules/member/routes/app/profile/route"
import * as route_app_user_profile from "@/modules/member/routes/app/user/profile/route"

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
    "admin:address/[id]:delete": (input: any) => invoke(route_admin_address__id_.DELETE, input),
    "admin:address/[id]:get": (input: any) => invoke(route_admin_address__id_.GET, input),
    "admin:address/[id]:put": (input: any) => invoke(route_admin_address__id_.PUT, input),
    "admin:address:get": (input: any) => invoke(route_admin_address.GET, input),
    "admin:address:post": (input: any) => invoke(route_admin_address.POST, input),
    "admin:levels/[id]:delete": (input: any) => invoke(route_admin_levels__id_.DELETE, input),
    "admin:levels/[id]:get": (input: any) => invoke(route_admin_levels__id_.GET, input),
    "admin:levels/[id]:put": (input: any) => invoke(route_admin_levels__id_.PUT, input),
    "admin:levels:get": (input: any) => invoke(route_admin_levels.GET, input),
    "admin:levels:post": (input: any) => invoke(route_admin_levels.POST, input),
    "admin:member-address/[id]:delete": (input: any) => invoke(route_admin_member_address__id_.DELETE, input),
    "admin:member-address/[id]:get": (input: any) => invoke(route_admin_member_address__id_.GET, input),
    "admin:member-address/[id]:put": (input: any) => invoke(route_admin_member_address__id_.PUT, input),
    "admin:member-address:get": (input: any) => invoke(route_admin_member_address.GET, input),
    "admin:member-address:post": (input: any) => invoke(route_admin_member_address.POST, input),
    "admin:member-config/[id]:delete": (input: any) => invoke(route_admin_member_config__id_.DELETE, input),
    "admin:member-config/[id]:get": (input: any) => invoke(route_admin_member_config__id_.GET, input),
    "admin:member-config/[id]:put": (input: any) => invoke(route_admin_member_config__id_.PUT, input),
    "admin:member-config:get": (input: any) => invoke(route_admin_member_config.GET, input),
    "admin:member-config:post": (input: any) => invoke(route_admin_member_config.POST, input),
    "admin:member-experience-record/[id]:delete": (input: any) => invoke(route_admin_member_experience_record__id_.DELETE, input),
    "admin:member-experience-record/[id]:get": (input: any) => invoke(route_admin_member_experience_record__id_.GET, input),
    "admin:member-experience-record/[id]:put": (input: any) => invoke(route_admin_member_experience_record__id_.PUT, input),
    "admin:member-experience-record:get": (input: any) => invoke(route_admin_member_experience_record.GET, input),
    "admin:member-experience-record:post": (input: any) => invoke(route_admin_member_experience_record.POST, input),
    "admin:member-group/[id]:delete": (input: any) => invoke(route_admin_member_group__id_.DELETE, input),
    "admin:member-group/[id]:get": (input: any) => invoke(route_admin_member_group__id_.GET, input),
    "admin:member-group/[id]:put": (input: any) => invoke(route_admin_member_group__id_.PUT, input),
    "admin:member-group:get": (input: any) => invoke(route_admin_member_group.GET, input),
    "admin:member-group:post": (input: any) => invoke(route_admin_member_group.POST, input),
    "admin:member-level-record/[id]:delete": (input: any) => invoke(route_admin_member_level_record__id_.DELETE, input),
    "admin:member-level-record/[id]:get": (input: any) => invoke(route_admin_member_level_record__id_.GET, input),
    "admin:member-level-record/[id]:put": (input: any) => invoke(route_admin_member_level_record__id_.PUT, input),
    "admin:member-level-record:get": (input: any) => invoke(route_admin_member_level_record.GET, input),
    "admin:member-level-record:post": (input: any) => invoke(route_admin_member_level_record.POST, input),
    "admin:member-level/[id]:delete": (input: any) => invoke(route_admin_member_level__id_.DELETE, input),
    "admin:member-level/[id]:get": (input: any) => invoke(route_admin_member_level__id_.GET, input),
    "admin:member-level/[id]:put": (input: any) => invoke(route_admin_member_level__id_.PUT, input),
    "admin:member-level:get": (input: any) => invoke(route_admin_member_level.GET, input),
    "admin:member-level:post": (input: any) => invoke(route_admin_member_level.POST, input),
    "admin:member-point-record/[id]:delete": (input: any) => invoke(route_admin_member_point_record__id_.DELETE, input),
    "admin:member-point-record/[id]:get": (input: any) => invoke(route_admin_member_point_record__id_.GET, input),
    "admin:member-point-record/[id]:put": (input: any) => invoke(route_admin_member_point_record__id_.PUT, input),
    "admin:member-point-record:get": (input: any) => invoke(route_admin_member_point_record.GET, input),
    "admin:member-point-record:post": (input: any) => invoke(route_admin_member_point_record.POST, input),
    "admin:member-sign-in-config/[id]:delete": (input: any) => invoke(route_admin_member_sign_in_config__id_.DELETE, input),
    "admin:member-sign-in-config/[id]:get": (input: any) => invoke(route_admin_member_sign_in_config__id_.GET, input),
    "admin:member-sign-in-config/[id]:put": (input: any) => invoke(route_admin_member_sign_in_config__id_.PUT, input),
    "admin:member-sign-in-config:get": (input: any) => invoke(route_admin_member_sign_in_config.GET, input),
    "admin:member-sign-in-config:post": (input: any) => invoke(route_admin_member_sign_in_config.POST, input),
    "admin:member-sign-in-record/[id]:delete": (input: any) => invoke(route_admin_member_sign_in_record__id_.DELETE, input),
    "admin:member-sign-in-record/[id]:get": (input: any) => invoke(route_admin_member_sign_in_record__id_.GET, input),
    "admin:member-sign-in-record/[id]:put": (input: any) => invoke(route_admin_member_sign_in_record__id_.PUT, input),
    "admin:member-sign-in-record:get": (input: any) => invoke(route_admin_member_sign_in_record.GET, input),
    "admin:member-sign-in-record:post": (input: any) => invoke(route_admin_member_sign_in_record.POST, input),
    "admin:member-tag/[id]:delete": (input: any) => invoke(route_admin_member_tag__id_.DELETE, input),
    "admin:member-tag/[id]:get": (input: any) => invoke(route_admin_member_tag__id_.GET, input),
    "admin:member-tag/[id]:put": (input: any) => invoke(route_admin_member_tag__id_.PUT, input),
    "admin:member-tag:get": (input: any) => invoke(route_admin_member_tag.GET, input),
    "admin:member-tag:post": (input: any) => invoke(route_admin_member_tag.POST, input),
    "admin:member-user/[id]:delete": (input: any) => invoke(route_admin_member_user__id_.DELETE, input),
    "admin:member-user/[id]:get": (input: any) => invoke(route_admin_member_user__id_.GET, input),
    "admin:member-user/[id]:put": (input: any) => invoke(route_admin_member_user__id_.PUT, input),
    "admin:member-user:get": (input: any) => invoke(route_admin_member_user.GET, input),
    "admin:member-user:post": (input: any) => invoke(route_admin_member_user.POST, input),
    "admin:points/[id]:delete": (input: any) => invoke(route_admin_points__id_.DELETE, input),
    "admin:points/[id]:get": (input: any) => invoke(route_admin_points__id_.GET, input),
    "admin:points/[id]:put": (input: any) => invoke(route_admin_points__id_.PUT, input),
    "admin:points:get": (input: any) => invoke(route_admin_points.GET, input),
    "admin:points:post": (input: any) => invoke(route_admin_points.POST, input),
    "admin:users/[id]:delete": (input: any) => invoke(route_admin_users__id_.DELETE, input),
    "admin:users/[id]:get": (input: any) => invoke(route_admin_users__id_.GET, input),
    "admin:users/[id]:put": (input: any) => invoke(route_admin_users__id_.PUT, input),
    "admin:users:get": (input: any) => invoke(route_admin_users.GET, input),
    "admin:users:post": (input: any) => invoke(route_admin_users.POST, input),
    "app:auth/login:post": (input: any) => invoke(route_app_auth_login.POST, input),
    "app:auth/logout:post": (input: any) => invoke(route_app_auth_logout.POST, input),
    "app:auth/register:post": (input: any) => invoke(route_app_auth_register.POST, input),
    "app:profile:get": (input: any) => invoke(route_app_profile.GET, input),
    "app:profile:put": (input: any) => invoke(route_app_profile.PUT, input),
    "app:user/profile:get": (input: any) => invoke(route_app_user_profile.GET, input),
    "app:user/profile:put": (input: any) => invoke(route_app_user_profile.PUT, input),
  },
})
