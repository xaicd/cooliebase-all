/**
 * crm 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_clues__id_ from "@/modules/crm/routes/admin/clues/[id]/route"
import * as route_admin_clues from "@/modules/crm/routes/admin/clues/route"
import * as route_admin_crm_business_status__id_ from "@/modules/crm/routes/admin/crm-business-status/[id]/route"
import * as route_admin_crm_business_status from "@/modules/crm/routes/admin/crm-business-status/route"
import * as route_admin_crm_business__id_ from "@/modules/crm/routes/admin/crm-business/[id]/route"
import * as route_admin_crm_business from "@/modules/crm/routes/admin/crm-business/route"
import * as route_admin_crm_clue__id_ from "@/modules/crm/routes/admin/crm-clue/[id]/route"
import * as route_admin_crm_clue from "@/modules/crm/routes/admin/crm-clue/route"
import * as route_admin_crm_contact__id_ from "@/modules/crm/routes/admin/crm-contact/[id]/route"
import * as route_admin_crm_contact from "@/modules/crm/routes/admin/crm-contact/route"
import * as route_admin_crm_contract_config__id_ from "@/modules/crm/routes/admin/crm-contract-config/[id]/route"
import * as route_admin_crm_contract_config from "@/modules/crm/routes/admin/crm-contract-config/route"
import * as route_admin_crm_contract__id_ from "@/modules/crm/routes/admin/crm-contract/[id]/route"
import * as route_admin_crm_contract from "@/modules/crm/routes/admin/crm-contract/route"
import * as route_admin_crm_customer_limit_config__id_ from "@/modules/crm/routes/admin/crm-customer-limit-config/[id]/route"
import * as route_admin_crm_customer_limit_config from "@/modules/crm/routes/admin/crm-customer-limit-config/route"
import * as route_admin_crm_customer_pool_config__id_ from "@/modules/crm/routes/admin/crm-customer-pool-config/[id]/route"
import * as route_admin_crm_customer_pool_config from "@/modules/crm/routes/admin/crm-customer-pool-config/route"
import * as route_admin_crm_customer__id_ from "@/modules/crm/routes/admin/crm-customer/[id]/route"
import * as route_admin_crm_customer from "@/modules/crm/routes/admin/crm-customer/route"
import * as route_admin_crm_follow_up_record__id_ from "@/modules/crm/routes/admin/crm-follow-up-record/[id]/route"
import * as route_admin_crm_follow_up_record from "@/modules/crm/routes/admin/crm-follow-up-record/route"
import * as route_admin_crm_operate_log__id_ from "@/modules/crm/routes/admin/crm-operate-log/[id]/route"
import * as route_admin_crm_operate_log from "@/modules/crm/routes/admin/crm-operate-log/route"
import * as route_admin_crm_performance_config__id_ from "@/modules/crm/routes/admin/crm-performance-config/[id]/route"
import * as route_admin_crm_performance_config from "@/modules/crm/routes/admin/crm-performance-config/route"
import * as route_admin_crm_permission__id_ from "@/modules/crm/routes/admin/crm-permission/[id]/route"
import * as route_admin_crm_permission from "@/modules/crm/routes/admin/crm-permission/route"
import * as route_admin_crm_product_category__id_ from "@/modules/crm/routes/admin/crm-product-category/[id]/route"
import * as route_admin_crm_product_category from "@/modules/crm/routes/admin/crm-product-category/route"
import * as route_admin_crm_product__id_ from "@/modules/crm/routes/admin/crm-product/[id]/route"
import * as route_admin_crm_product from "@/modules/crm/routes/admin/crm-product/route"
import * as route_admin_crm_receivable_plan__id_ from "@/modules/crm/routes/admin/crm-receivable-plan/[id]/route"
import * as route_admin_crm_receivable_plan from "@/modules/crm/routes/admin/crm-receivable-plan/route"
import * as route_admin_crm_receivable__id_ from "@/modules/crm/routes/admin/crm-receivable/[id]/route"
import * as route_admin_crm_receivable from "@/modules/crm/routes/admin/crm-receivable/route"
import * as route_admin_crm_statistics_customer__id_ from "@/modules/crm/routes/admin/crm-statistics-customer/[id]/route"
import * as route_admin_crm_statistics_customer from "@/modules/crm/routes/admin/crm-statistics-customer/route"
import * as route_admin_crm_statistics_funnel__id_ from "@/modules/crm/routes/admin/crm-statistics-funnel/[id]/route"
import * as route_admin_crm_statistics_funnel from "@/modules/crm/routes/admin/crm-statistics-funnel/route"
import * as route_admin_crm_statistics_performance_target__id_ from "@/modules/crm/routes/admin/crm-statistics-performance-target/[id]/route"
import * as route_admin_crm_statistics_performance_target from "@/modules/crm/routes/admin/crm-statistics-performance-target/route"
import * as route_admin_crm_statistics_performance__id_ from "@/modules/crm/routes/admin/crm-statistics-performance/[id]/route"
import * as route_admin_crm_statistics_performance from "@/modules/crm/routes/admin/crm-statistics-performance/route"
import * as route_admin_crm_statistics_portrait__id_ from "@/modules/crm/routes/admin/crm-statistics-portrait/[id]/route"
import * as route_admin_crm_statistics_portrait from "@/modules/crm/routes/admin/crm-statistics-portrait/route"
import * as route_admin_crm_statistics_product__id_ from "@/modules/crm/routes/admin/crm-statistics-product/[id]/route"
import * as route_admin_crm_statistics_product from "@/modules/crm/routes/admin/crm-statistics-product/route"
import * as route_admin_crm_statistics_rank__id_ from "@/modules/crm/routes/admin/crm-statistics-rank/[id]/route"
import * as route_admin_crm_statistics_rank from "@/modules/crm/routes/admin/crm-statistics-rank/route"
import * as route_admin_customers__id_ from "@/modules/crm/routes/admin/customers/[id]/route"
import * as route_admin_customers from "@/modules/crm/routes/admin/customers/route"
import * as route_admin_followups__id_ from "@/modules/crm/routes/admin/followups/[id]/route"
import * as route_admin_followups from "@/modules/crm/routes/admin/followups/route"

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
    "admin:clues/[id]:delete": (input: any) => invoke(route_admin_clues__id_.DELETE, input),
    "admin:clues/[id]:get": (input: any) => invoke(route_admin_clues__id_.GET, input),
    "admin:clues/[id]:put": (input: any) => invoke(route_admin_clues__id_.PUT, input),
    "admin:clues:get": (input: any) => invoke(route_admin_clues.GET, input),
    "admin:clues:post": (input: any) => invoke(route_admin_clues.POST, input),
    "admin:crm-business-status/[id]:delete": (input: any) => invoke(route_admin_crm_business_status__id_.DELETE, input),
    "admin:crm-business-status/[id]:get": (input: any) => invoke(route_admin_crm_business_status__id_.GET, input),
    "admin:crm-business-status/[id]:put": (input: any) => invoke(route_admin_crm_business_status__id_.PUT, input),
    "admin:crm-business-status:get": (input: any) => invoke(route_admin_crm_business_status.GET, input),
    "admin:crm-business-status:post": (input: any) => invoke(route_admin_crm_business_status.POST, input),
    "admin:crm-business/[id]:delete": (input: any) => invoke(route_admin_crm_business__id_.DELETE, input),
    "admin:crm-business/[id]:get": (input: any) => invoke(route_admin_crm_business__id_.GET, input),
    "admin:crm-business/[id]:put": (input: any) => invoke(route_admin_crm_business__id_.PUT, input),
    "admin:crm-business:get": (input: any) => invoke(route_admin_crm_business.GET, input),
    "admin:crm-business:post": (input: any) => invoke(route_admin_crm_business.POST, input),
    "admin:crm-clue/[id]:delete": (input: any) => invoke(route_admin_crm_clue__id_.DELETE, input),
    "admin:crm-clue/[id]:get": (input: any) => invoke(route_admin_crm_clue__id_.GET, input),
    "admin:crm-clue/[id]:put": (input: any) => invoke(route_admin_crm_clue__id_.PUT, input),
    "admin:crm-clue:get": (input: any) => invoke(route_admin_crm_clue.GET, input),
    "admin:crm-clue:post": (input: any) => invoke(route_admin_crm_clue.POST, input),
    "admin:crm-contact/[id]:delete": (input: any) => invoke(route_admin_crm_contact__id_.DELETE, input),
    "admin:crm-contact/[id]:get": (input: any) => invoke(route_admin_crm_contact__id_.GET, input),
    "admin:crm-contact/[id]:put": (input: any) => invoke(route_admin_crm_contact__id_.PUT, input),
    "admin:crm-contact:get": (input: any) => invoke(route_admin_crm_contact.GET, input),
    "admin:crm-contact:post": (input: any) => invoke(route_admin_crm_contact.POST, input),
    "admin:crm-contract-config/[id]:delete": (input: any) => invoke(route_admin_crm_contract_config__id_.DELETE, input),
    "admin:crm-contract-config/[id]:get": (input: any) => invoke(route_admin_crm_contract_config__id_.GET, input),
    "admin:crm-contract-config/[id]:put": (input: any) => invoke(route_admin_crm_contract_config__id_.PUT, input),
    "admin:crm-contract-config:get": (input: any) => invoke(route_admin_crm_contract_config.GET, input),
    "admin:crm-contract-config:post": (input: any) => invoke(route_admin_crm_contract_config.POST, input),
    "admin:crm-contract/[id]:delete": (input: any) => invoke(route_admin_crm_contract__id_.DELETE, input),
    "admin:crm-contract/[id]:get": (input: any) => invoke(route_admin_crm_contract__id_.GET, input),
    "admin:crm-contract/[id]:put": (input: any) => invoke(route_admin_crm_contract__id_.PUT, input),
    "admin:crm-contract:get": (input: any) => invoke(route_admin_crm_contract.GET, input),
    "admin:crm-contract:post": (input: any) => invoke(route_admin_crm_contract.POST, input),
    "admin:crm-customer-limit-config/[id]:delete": (input: any) => invoke(route_admin_crm_customer_limit_config__id_.DELETE, input),
    "admin:crm-customer-limit-config/[id]:get": (input: any) => invoke(route_admin_crm_customer_limit_config__id_.GET, input),
    "admin:crm-customer-limit-config/[id]:put": (input: any) => invoke(route_admin_crm_customer_limit_config__id_.PUT, input),
    "admin:crm-customer-limit-config:get": (input: any) => invoke(route_admin_crm_customer_limit_config.GET, input),
    "admin:crm-customer-limit-config:post": (input: any) => invoke(route_admin_crm_customer_limit_config.POST, input),
    "admin:crm-customer-pool-config/[id]:delete": (input: any) => invoke(route_admin_crm_customer_pool_config__id_.DELETE, input),
    "admin:crm-customer-pool-config/[id]:get": (input: any) => invoke(route_admin_crm_customer_pool_config__id_.GET, input),
    "admin:crm-customer-pool-config/[id]:put": (input: any) => invoke(route_admin_crm_customer_pool_config__id_.PUT, input),
    "admin:crm-customer-pool-config:get": (input: any) => invoke(route_admin_crm_customer_pool_config.GET, input),
    "admin:crm-customer-pool-config:post": (input: any) => invoke(route_admin_crm_customer_pool_config.POST, input),
    "admin:crm-customer/[id]:delete": (input: any) => invoke(route_admin_crm_customer__id_.DELETE, input),
    "admin:crm-customer/[id]:get": (input: any) => invoke(route_admin_crm_customer__id_.GET, input),
    "admin:crm-customer/[id]:put": (input: any) => invoke(route_admin_crm_customer__id_.PUT, input),
    "admin:crm-customer:get": (input: any) => invoke(route_admin_crm_customer.GET, input),
    "admin:crm-customer:post": (input: any) => invoke(route_admin_crm_customer.POST, input),
    "admin:crm-follow-up-record/[id]:delete": (input: any) => invoke(route_admin_crm_follow_up_record__id_.DELETE, input),
    "admin:crm-follow-up-record/[id]:get": (input: any) => invoke(route_admin_crm_follow_up_record__id_.GET, input),
    "admin:crm-follow-up-record/[id]:put": (input: any) => invoke(route_admin_crm_follow_up_record__id_.PUT, input),
    "admin:crm-follow-up-record:get": (input: any) => invoke(route_admin_crm_follow_up_record.GET, input),
    "admin:crm-follow-up-record:post": (input: any) => invoke(route_admin_crm_follow_up_record.POST, input),
    "admin:crm-operate-log/[id]:delete": (input: any) => invoke(route_admin_crm_operate_log__id_.DELETE, input),
    "admin:crm-operate-log/[id]:get": (input: any) => invoke(route_admin_crm_operate_log__id_.GET, input),
    "admin:crm-operate-log/[id]:put": (input: any) => invoke(route_admin_crm_operate_log__id_.PUT, input),
    "admin:crm-operate-log:get": (input: any) => invoke(route_admin_crm_operate_log.GET, input),
    "admin:crm-operate-log:post": (input: any) => invoke(route_admin_crm_operate_log.POST, input),
    "admin:crm-performance-config/[id]:delete": (input: any) => invoke(route_admin_crm_performance_config__id_.DELETE, input),
    "admin:crm-performance-config/[id]:get": (input: any) => invoke(route_admin_crm_performance_config__id_.GET, input),
    "admin:crm-performance-config/[id]:put": (input: any) => invoke(route_admin_crm_performance_config__id_.PUT, input),
    "admin:crm-performance-config:get": (input: any) => invoke(route_admin_crm_performance_config.GET, input),
    "admin:crm-performance-config:post": (input: any) => invoke(route_admin_crm_performance_config.POST, input),
    "admin:crm-permission/[id]:delete": (input: any) => invoke(route_admin_crm_permission__id_.DELETE, input),
    "admin:crm-permission/[id]:get": (input: any) => invoke(route_admin_crm_permission__id_.GET, input),
    "admin:crm-permission/[id]:put": (input: any) => invoke(route_admin_crm_permission__id_.PUT, input),
    "admin:crm-permission:get": (input: any) => invoke(route_admin_crm_permission.GET, input),
    "admin:crm-permission:post": (input: any) => invoke(route_admin_crm_permission.POST, input),
    "admin:crm-product-category/[id]:delete": (input: any) => invoke(route_admin_crm_product_category__id_.DELETE, input),
    "admin:crm-product-category/[id]:get": (input: any) => invoke(route_admin_crm_product_category__id_.GET, input),
    "admin:crm-product-category/[id]:put": (input: any) => invoke(route_admin_crm_product_category__id_.PUT, input),
    "admin:crm-product-category:get": (input: any) => invoke(route_admin_crm_product_category.GET, input),
    "admin:crm-product-category:post": (input: any) => invoke(route_admin_crm_product_category.POST, input),
    "admin:crm-product/[id]:delete": (input: any) => invoke(route_admin_crm_product__id_.DELETE, input),
    "admin:crm-product/[id]:get": (input: any) => invoke(route_admin_crm_product__id_.GET, input),
    "admin:crm-product/[id]:put": (input: any) => invoke(route_admin_crm_product__id_.PUT, input),
    "admin:crm-product:get": (input: any) => invoke(route_admin_crm_product.GET, input),
    "admin:crm-product:post": (input: any) => invoke(route_admin_crm_product.POST, input),
    "admin:crm-receivable-plan/[id]:delete": (input: any) => invoke(route_admin_crm_receivable_plan__id_.DELETE, input),
    "admin:crm-receivable-plan/[id]:get": (input: any) => invoke(route_admin_crm_receivable_plan__id_.GET, input),
    "admin:crm-receivable-plan/[id]:put": (input: any) => invoke(route_admin_crm_receivable_plan__id_.PUT, input),
    "admin:crm-receivable-plan:get": (input: any) => invoke(route_admin_crm_receivable_plan.GET, input),
    "admin:crm-receivable-plan:post": (input: any) => invoke(route_admin_crm_receivable_plan.POST, input),
    "admin:crm-receivable/[id]:delete": (input: any) => invoke(route_admin_crm_receivable__id_.DELETE, input),
    "admin:crm-receivable/[id]:get": (input: any) => invoke(route_admin_crm_receivable__id_.GET, input),
    "admin:crm-receivable/[id]:put": (input: any) => invoke(route_admin_crm_receivable__id_.PUT, input),
    "admin:crm-receivable:get": (input: any) => invoke(route_admin_crm_receivable.GET, input),
    "admin:crm-receivable:post": (input: any) => invoke(route_admin_crm_receivable.POST, input),
    "admin:crm-statistics-customer/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_customer__id_.DELETE, input),
    "admin:crm-statistics-customer/[id]:get": (input: any) => invoke(route_admin_crm_statistics_customer__id_.GET, input),
    "admin:crm-statistics-customer/[id]:put": (input: any) => invoke(route_admin_crm_statistics_customer__id_.PUT, input),
    "admin:crm-statistics-customer:get": (input: any) => invoke(route_admin_crm_statistics_customer.GET, input),
    "admin:crm-statistics-customer:post": (input: any) => invoke(route_admin_crm_statistics_customer.POST, input),
    "admin:crm-statistics-funnel/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_funnel__id_.DELETE, input),
    "admin:crm-statistics-funnel/[id]:get": (input: any) => invoke(route_admin_crm_statistics_funnel__id_.GET, input),
    "admin:crm-statistics-funnel/[id]:put": (input: any) => invoke(route_admin_crm_statistics_funnel__id_.PUT, input),
    "admin:crm-statistics-funnel:get": (input: any) => invoke(route_admin_crm_statistics_funnel.GET, input),
    "admin:crm-statistics-funnel:post": (input: any) => invoke(route_admin_crm_statistics_funnel.POST, input),
    "admin:crm-statistics-performance-target/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_performance_target__id_.DELETE, input),
    "admin:crm-statistics-performance-target/[id]:get": (input: any) => invoke(route_admin_crm_statistics_performance_target__id_.GET, input),
    "admin:crm-statistics-performance-target/[id]:put": (input: any) => invoke(route_admin_crm_statistics_performance_target__id_.PUT, input),
    "admin:crm-statistics-performance-target:get": (input: any) => invoke(route_admin_crm_statistics_performance_target.GET, input),
    "admin:crm-statistics-performance-target:post": (input: any) => invoke(route_admin_crm_statistics_performance_target.POST, input),
    "admin:crm-statistics-performance/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_performance__id_.DELETE, input),
    "admin:crm-statistics-performance/[id]:get": (input: any) => invoke(route_admin_crm_statistics_performance__id_.GET, input),
    "admin:crm-statistics-performance/[id]:put": (input: any) => invoke(route_admin_crm_statistics_performance__id_.PUT, input),
    "admin:crm-statistics-performance:get": (input: any) => invoke(route_admin_crm_statistics_performance.GET, input),
    "admin:crm-statistics-performance:post": (input: any) => invoke(route_admin_crm_statistics_performance.POST, input),
    "admin:crm-statistics-portrait/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_portrait__id_.DELETE, input),
    "admin:crm-statistics-portrait/[id]:get": (input: any) => invoke(route_admin_crm_statistics_portrait__id_.GET, input),
    "admin:crm-statistics-portrait/[id]:put": (input: any) => invoke(route_admin_crm_statistics_portrait__id_.PUT, input),
    "admin:crm-statistics-portrait:get": (input: any) => invoke(route_admin_crm_statistics_portrait.GET, input),
    "admin:crm-statistics-portrait:post": (input: any) => invoke(route_admin_crm_statistics_portrait.POST, input),
    "admin:crm-statistics-product/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_product__id_.DELETE, input),
    "admin:crm-statistics-product/[id]:get": (input: any) => invoke(route_admin_crm_statistics_product__id_.GET, input),
    "admin:crm-statistics-product/[id]:put": (input: any) => invoke(route_admin_crm_statistics_product__id_.PUT, input),
    "admin:crm-statistics-product:get": (input: any) => invoke(route_admin_crm_statistics_product.GET, input),
    "admin:crm-statistics-product:post": (input: any) => invoke(route_admin_crm_statistics_product.POST, input),
    "admin:crm-statistics-rank/[id]:delete": (input: any) => invoke(route_admin_crm_statistics_rank__id_.DELETE, input),
    "admin:crm-statistics-rank/[id]:get": (input: any) => invoke(route_admin_crm_statistics_rank__id_.GET, input),
    "admin:crm-statistics-rank/[id]:put": (input: any) => invoke(route_admin_crm_statistics_rank__id_.PUT, input),
    "admin:crm-statistics-rank:get": (input: any) => invoke(route_admin_crm_statistics_rank.GET, input),
    "admin:crm-statistics-rank:post": (input: any) => invoke(route_admin_crm_statistics_rank.POST, input),
    "admin:customers/[id]:delete": (input: any) => invoke(route_admin_customers__id_.DELETE, input),
    "admin:customers/[id]:get": (input: any) => invoke(route_admin_customers__id_.GET, input),
    "admin:customers/[id]:put": (input: any) => invoke(route_admin_customers__id_.PUT, input),
    "admin:customers:get": (input: any) => invoke(route_admin_customers.GET, input),
    "admin:customers:post": (input: any) => invoke(route_admin_customers.POST, input),
    "admin:followups/[id]:delete": (input: any) => invoke(route_admin_followups__id_.DELETE, input),
    "admin:followups/[id]:get": (input: any) => invoke(route_admin_followups__id_.GET, input),
    "admin:followups/[id]:put": (input: any) => invoke(route_admin_followups__id_.PUT, input),
    "admin:followups:get": (input: any) => invoke(route_admin_followups.GET, input),
    "admin:followups:post": (input: any) => invoke(route_admin_followups.POST, input),
  },
})
