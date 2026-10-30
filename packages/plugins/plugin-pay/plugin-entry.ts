/**
 * pay 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_orders from "@/modules/pay/routes/admin/orders/route"
import * as route_admin_pay_app from "@/modules/pay/routes/admin/pay-app/route"
import * as route_admin_pay_app__id_ from "@/modules/pay/routes/admin/pay-app/[id]/route"
import * as route_admin_pay_channel from "@/modules/pay/routes/admin/pay-channel/route"
import * as route_admin_pay_channel__id_ from "@/modules/pay/routes/admin/pay-channel/[id]/route"
import * as route_admin_pay_demo_order from "@/modules/pay/routes/admin/pay-demo-order/route"
import * as route_admin_pay_demo_order__id_ from "@/modules/pay/routes/admin/pay-demo-order/[id]/route"
import * as route_admin_pay_demo_withdraw from "@/modules/pay/routes/admin/pay-demo-withdraw/route"
import * as route_admin_pay_demo_withdraw__id_ from "@/modules/pay/routes/admin/pay-demo-withdraw/[id]/route"
import * as route_admin_pay_notify from "@/modules/pay/routes/admin/pay-notify/route"
import * as route_admin_pay_notify__id_ from "@/modules/pay/routes/admin/pay-notify/[id]/route"
import * as route_admin_pay_notify_log from "@/modules/pay/routes/admin/pay-notify-log/route"
import * as route_admin_pay_notify_log__id_ from "@/modules/pay/routes/admin/pay-notify-log/[id]/route"
import * as route_admin_pay_notify_task from "@/modules/pay/routes/admin/pay-notify-task/route"
import * as route_admin_pay_notify_task__id_ from "@/modules/pay/routes/admin/pay-notify-task/[id]/route"
import * as route_admin_pay_order from "@/modules/pay/routes/admin/pay-order/route"
import * as route_admin_pay_order__id_ from "@/modules/pay/routes/admin/pay-order/[id]/route"
import * as route_admin_pay_order_extension from "@/modules/pay/routes/admin/pay-order-extension/route"
import * as route_admin_pay_order_extension__id_ from "@/modules/pay/routes/admin/pay-order-extension/[id]/route"
import * as route_admin_pay_refund from "@/modules/pay/routes/admin/pay-refund/route"
import * as route_admin_pay_refund__id_ from "@/modules/pay/routes/admin/pay-refund/[id]/route"
import * as route_admin_pay_transfer from "@/modules/pay/routes/admin/pay-transfer/route"
import * as route_admin_pay_transfer__id_ from "@/modules/pay/routes/admin/pay-transfer/[id]/route"
import * as route_admin_pay_wallet from "@/modules/pay/routes/admin/pay-wallet/route"
import * as route_admin_pay_wallet__id_ from "@/modules/pay/routes/admin/pay-wallet/[id]/route"
import * as route_admin_pay_wallet_recharge from "@/modules/pay/routes/admin/pay-wallet-recharge/route"
import * as route_admin_pay_wallet_recharge__id_ from "@/modules/pay/routes/admin/pay-wallet-recharge/[id]/route"
import * as route_admin_pay_wallet_recharge_package from "@/modules/pay/routes/admin/pay-wallet-recharge-package/route"
import * as route_admin_pay_wallet_recharge_package__id_ from "@/modules/pay/routes/admin/pay-wallet-recharge-package/[id]/route"
import * as route_admin_pay_wallet_transaction from "@/modules/pay/routes/admin/pay-wallet-transaction/route"
import * as route_admin_pay_wallet_transaction__id_ from "@/modules/pay/routes/admin/pay-wallet-transaction/[id]/route"
import * as route_admin_refunds from "@/modules/pay/routes/admin/refunds/route"
import * as route_app_cashier from "@/modules/pay/routes/app/cashier/route"
import * as route_open_notify from "@/modules/pay/routes/open/notify/route"

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
    "admin:orders:get": (input: any) => invoke(route_admin_orders.GET, input),
    "admin:pay-app/[id]:delete": (input: any) => invoke(route_admin_pay_app__id_.DELETE, input),
    "admin:pay-app/[id]:get": (input: any) => invoke(route_admin_pay_app__id_.GET, input),
    "admin:pay-app/[id]:put": (input: any) => invoke(route_admin_pay_app__id_.PUT, input),
    "admin:pay-app:get": (input: any) => invoke(route_admin_pay_app.GET, input),
    "admin:pay-app:post": (input: any) => invoke(route_admin_pay_app.POST, input),
    "admin:pay-channel/[id]:delete": (input: any) => invoke(route_admin_pay_channel__id_.DELETE, input),
    "admin:pay-channel/[id]:get": (input: any) => invoke(route_admin_pay_channel__id_.GET, input),
    "admin:pay-channel/[id]:put": (input: any) => invoke(route_admin_pay_channel__id_.PUT, input),
    "admin:pay-channel:get": (input: any) => invoke(route_admin_pay_channel.GET, input),
    "admin:pay-channel:post": (input: any) => invoke(route_admin_pay_channel.POST, input),
    "admin:pay-demo-order/[id]:delete": (input: any) => invoke(route_admin_pay_demo_order__id_.DELETE, input),
    "admin:pay-demo-order/[id]:get": (input: any) => invoke(route_admin_pay_demo_order__id_.GET, input),
    "admin:pay-demo-order/[id]:put": (input: any) => invoke(route_admin_pay_demo_order__id_.PUT, input),
    "admin:pay-demo-order:get": (input: any) => invoke(route_admin_pay_demo_order.GET, input),
    "admin:pay-demo-order:post": (input: any) => invoke(route_admin_pay_demo_order.POST, input),
    "admin:pay-demo-withdraw/[id]:delete": (input: any) => invoke(route_admin_pay_demo_withdraw__id_.DELETE, input),
    "admin:pay-demo-withdraw/[id]:get": (input: any) => invoke(route_admin_pay_demo_withdraw__id_.GET, input),
    "admin:pay-demo-withdraw/[id]:put": (input: any) => invoke(route_admin_pay_demo_withdraw__id_.PUT, input),
    "admin:pay-demo-withdraw:get": (input: any) => invoke(route_admin_pay_demo_withdraw.GET, input),
    "admin:pay-demo-withdraw:post": (input: any) => invoke(route_admin_pay_demo_withdraw.POST, input),
    "admin:pay-notify-log/[id]:delete": (input: any) => invoke(route_admin_pay_notify_log__id_.DELETE, input),
    "admin:pay-notify-log/[id]:get": (input: any) => invoke(route_admin_pay_notify_log__id_.GET, input),
    "admin:pay-notify-log/[id]:put": (input: any) => invoke(route_admin_pay_notify_log__id_.PUT, input),
    "admin:pay-notify-log:get": (input: any) => invoke(route_admin_pay_notify_log.GET, input),
    "admin:pay-notify-log:post": (input: any) => invoke(route_admin_pay_notify_log.POST, input),
    "admin:pay-notify-task/[id]:delete": (input: any) => invoke(route_admin_pay_notify_task__id_.DELETE, input),
    "admin:pay-notify-task/[id]:get": (input: any) => invoke(route_admin_pay_notify_task__id_.GET, input),
    "admin:pay-notify-task/[id]:put": (input: any) => invoke(route_admin_pay_notify_task__id_.PUT, input),
    "admin:pay-notify-task:get": (input: any) => invoke(route_admin_pay_notify_task.GET, input),
    "admin:pay-notify-task:post": (input: any) => invoke(route_admin_pay_notify_task.POST, input),
    "admin:pay-notify/[id]:delete": (input: any) => invoke(route_admin_pay_notify__id_.DELETE, input),
    "admin:pay-notify/[id]:get": (input: any) => invoke(route_admin_pay_notify__id_.GET, input),
    "admin:pay-notify/[id]:put": (input: any) => invoke(route_admin_pay_notify__id_.PUT, input),
    "admin:pay-notify:get": (input: any) => invoke(route_admin_pay_notify.GET, input),
    "admin:pay-notify:post": (input: any) => invoke(route_admin_pay_notify.POST, input),
    "admin:pay-order-extension/[id]:delete": (input: any) => invoke(route_admin_pay_order_extension__id_.DELETE, input),
    "admin:pay-order-extension/[id]:get": (input: any) => invoke(route_admin_pay_order_extension__id_.GET, input),
    "admin:pay-order-extension/[id]:put": (input: any) => invoke(route_admin_pay_order_extension__id_.PUT, input),
    "admin:pay-order-extension:get": (input: any) => invoke(route_admin_pay_order_extension.GET, input),
    "admin:pay-order-extension:post": (input: any) => invoke(route_admin_pay_order_extension.POST, input),
    "admin:pay-order/[id]:delete": (input: any) => invoke(route_admin_pay_order__id_.DELETE, input),
    "admin:pay-order/[id]:get": (input: any) => invoke(route_admin_pay_order__id_.GET, input),
    "admin:pay-order/[id]:put": (input: any) => invoke(route_admin_pay_order__id_.PUT, input),
    "admin:pay-order:get": (input: any) => invoke(route_admin_pay_order.GET, input),
    "admin:pay-order:post": (input: any) => invoke(route_admin_pay_order.POST, input),
    "admin:pay-refund/[id]:delete": (input: any) => invoke(route_admin_pay_refund__id_.DELETE, input),
    "admin:pay-refund/[id]:get": (input: any) => invoke(route_admin_pay_refund__id_.GET, input),
    "admin:pay-refund/[id]:put": (input: any) => invoke(route_admin_pay_refund__id_.PUT, input),
    "admin:pay-refund:get": (input: any) => invoke(route_admin_pay_refund.GET, input),
    "admin:pay-refund:post": (input: any) => invoke(route_admin_pay_refund.POST, input),
    "admin:pay-transfer/[id]:delete": (input: any) => invoke(route_admin_pay_transfer__id_.DELETE, input),
    "admin:pay-transfer/[id]:get": (input: any) => invoke(route_admin_pay_transfer__id_.GET, input),
    "admin:pay-transfer/[id]:put": (input: any) => invoke(route_admin_pay_transfer__id_.PUT, input),
    "admin:pay-transfer:get": (input: any) => invoke(route_admin_pay_transfer.GET, input),
    "admin:pay-transfer:post": (input: any) => invoke(route_admin_pay_transfer.POST, input),
    "admin:pay-wallet-recharge-package/[id]:delete": (input: any) => invoke(route_admin_pay_wallet_recharge_package__id_.DELETE, input),
    "admin:pay-wallet-recharge-package/[id]:get": (input: any) => invoke(route_admin_pay_wallet_recharge_package__id_.GET, input),
    "admin:pay-wallet-recharge-package/[id]:put": (input: any) => invoke(route_admin_pay_wallet_recharge_package__id_.PUT, input),
    "admin:pay-wallet-recharge-package:get": (input: any) => invoke(route_admin_pay_wallet_recharge_package.GET, input),
    "admin:pay-wallet-recharge-package:post": (input: any) => invoke(route_admin_pay_wallet_recharge_package.POST, input),
    "admin:pay-wallet-recharge/[id]:delete": (input: any) => invoke(route_admin_pay_wallet_recharge__id_.DELETE, input),
    "admin:pay-wallet-recharge/[id]:get": (input: any) => invoke(route_admin_pay_wallet_recharge__id_.GET, input),
    "admin:pay-wallet-recharge/[id]:put": (input: any) => invoke(route_admin_pay_wallet_recharge__id_.PUT, input),
    "admin:pay-wallet-recharge:get": (input: any) => invoke(route_admin_pay_wallet_recharge.GET, input),
    "admin:pay-wallet-recharge:post": (input: any) => invoke(route_admin_pay_wallet_recharge.POST, input),
    "admin:pay-wallet-transaction/[id]:delete": (input: any) => invoke(route_admin_pay_wallet_transaction__id_.DELETE, input),
    "admin:pay-wallet-transaction/[id]:get": (input: any) => invoke(route_admin_pay_wallet_transaction__id_.GET, input),
    "admin:pay-wallet-transaction/[id]:put": (input: any) => invoke(route_admin_pay_wallet_transaction__id_.PUT, input),
    "admin:pay-wallet-transaction:get": (input: any) => invoke(route_admin_pay_wallet_transaction.GET, input),
    "admin:pay-wallet-transaction:post": (input: any) => invoke(route_admin_pay_wallet_transaction.POST, input),
    "admin:pay-wallet/[id]:delete": (input: any) => invoke(route_admin_pay_wallet__id_.DELETE, input),
    "admin:pay-wallet/[id]:get": (input: any) => invoke(route_admin_pay_wallet__id_.GET, input),
    "admin:pay-wallet/[id]:put": (input: any) => invoke(route_admin_pay_wallet__id_.PUT, input),
    "admin:pay-wallet:get": (input: any) => invoke(route_admin_pay_wallet.GET, input),
    "admin:pay-wallet:post": (input: any) => invoke(route_admin_pay_wallet.POST, input),
    "admin:refunds:get": (input: any) => invoke(route_admin_refunds.GET, input),
    "app:cashier:post": (input: any) => invoke(route_app_cashier.POST, input),
    "open:notify:post": (input: any) => invoke(route_open_notify.POST, input),
  },
})
