/**
 * erp 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_erp_account from "@/modules/erp/routes/admin/erp-account/route"
import * as route_admin_erp_account__id_ from "@/modules/erp/routes/admin/erp-account/[id]/route"
import * as route_admin_erp_customer from "@/modules/erp/routes/admin/erp-customer/route"
import * as route_admin_erp_customer__id_ from "@/modules/erp/routes/admin/erp-customer/[id]/route"
import * as route_admin_erp_finance_payment from "@/modules/erp/routes/admin/erp-finance-payment/route"
import * as route_admin_erp_finance_payment__id_ from "@/modules/erp/routes/admin/erp-finance-payment/[id]/route"
import * as route_admin_erp_finance_payment_item from "@/modules/erp/routes/admin/erp-finance-payment-item/route"
import * as route_admin_erp_finance_payment_item__id_ from "@/modules/erp/routes/admin/erp-finance-payment-item/[id]/route"
import * as route_admin_erp_finance_receipt from "@/modules/erp/routes/admin/erp-finance-receipt/route"
import * as route_admin_erp_finance_receipt__id_ from "@/modules/erp/routes/admin/erp-finance-receipt/[id]/route"
import * as route_admin_erp_finance_receipt_item from "@/modules/erp/routes/admin/erp-finance-receipt-item/route"
import * as route_admin_erp_finance_receipt_item__id_ from "@/modules/erp/routes/admin/erp-finance-receipt-item/[id]/route"
import * as route_admin_erp_product from "@/modules/erp/routes/admin/erp-product/route"
import * as route_admin_erp_product__id_ from "@/modules/erp/routes/admin/erp-product/[id]/route"
import * as route_admin_erp_product_category from "@/modules/erp/routes/admin/erp-product-category/route"
import * as route_admin_erp_product_category__id_ from "@/modules/erp/routes/admin/erp-product-category/[id]/route"
import * as route_admin_erp_product_unit from "@/modules/erp/routes/admin/erp-product-unit/route"
import * as route_admin_erp_product_unit__id_ from "@/modules/erp/routes/admin/erp-product-unit/[id]/route"
import * as route_admin_erp_purchase_in from "@/modules/erp/routes/admin/erp-purchase-in/route"
import * as route_admin_erp_purchase_in__id_ from "@/modules/erp/routes/admin/erp-purchase-in/[id]/route"
import * as route_admin_erp_purchase_in_item from "@/modules/erp/routes/admin/erp-purchase-in-item/route"
import * as route_admin_erp_purchase_in_item__id_ from "@/modules/erp/routes/admin/erp-purchase-in-item/[id]/route"
import * as route_admin_erp_purchase_order from "@/modules/erp/routes/admin/erp-purchase-order/route"
import * as route_admin_erp_purchase_order__id_ from "@/modules/erp/routes/admin/erp-purchase-order/[id]/route"
import * as route_admin_erp_purchase_order_item from "@/modules/erp/routes/admin/erp-purchase-order-item/route"
import * as route_admin_erp_purchase_order_item__id_ from "@/modules/erp/routes/admin/erp-purchase-order-item/[id]/route"
import * as route_admin_erp_purchase_return from "@/modules/erp/routes/admin/erp-purchase-return/route"
import * as route_admin_erp_purchase_return__id_ from "@/modules/erp/routes/admin/erp-purchase-return/[id]/route"
import * as route_admin_erp_purchase_return_item from "@/modules/erp/routes/admin/erp-purchase-return-item/route"
import * as route_admin_erp_purchase_return_item__id_ from "@/modules/erp/routes/admin/erp-purchase-return-item/[id]/route"
import * as route_admin_erp_purchase_statistics from "@/modules/erp/routes/admin/erp-purchase-statistics/route"
import * as route_admin_erp_purchase_statistics__id_ from "@/modules/erp/routes/admin/erp-purchase-statistics/[id]/route"
import * as route_admin_erp_sale_order from "@/modules/erp/routes/admin/erp-sale-order/route"
import * as route_admin_erp_sale_order__id_ from "@/modules/erp/routes/admin/erp-sale-order/[id]/route"
import * as route_admin_erp_sale_order_item from "@/modules/erp/routes/admin/erp-sale-order-item/route"
import * as route_admin_erp_sale_order_item__id_ from "@/modules/erp/routes/admin/erp-sale-order-item/[id]/route"
import * as route_admin_erp_sale_out from "@/modules/erp/routes/admin/erp-sale-out/route"
import * as route_admin_erp_sale_out__id_ from "@/modules/erp/routes/admin/erp-sale-out/[id]/route"
import * as route_admin_erp_sale_out_item from "@/modules/erp/routes/admin/erp-sale-out-item/route"
import * as route_admin_erp_sale_out_item__id_ from "@/modules/erp/routes/admin/erp-sale-out-item/[id]/route"
import * as route_admin_erp_sale_return from "@/modules/erp/routes/admin/erp-sale-return/route"
import * as route_admin_erp_sale_return__id_ from "@/modules/erp/routes/admin/erp-sale-return/[id]/route"
import * as route_admin_erp_sale_return_item from "@/modules/erp/routes/admin/erp-sale-return-item/route"
import * as route_admin_erp_sale_return_item__id_ from "@/modules/erp/routes/admin/erp-sale-return-item/[id]/route"
import * as route_admin_erp_sale_statistics from "@/modules/erp/routes/admin/erp-sale-statistics/route"
import * as route_admin_erp_sale_statistics__id_ from "@/modules/erp/routes/admin/erp-sale-statistics/[id]/route"
import * as route_admin_erp_stock from "@/modules/erp/routes/admin/erp-stock/route"
import * as route_admin_erp_stock__id_ from "@/modules/erp/routes/admin/erp-stock/[id]/route"
import * as route_admin_erp_stock_check from "@/modules/erp/routes/admin/erp-stock-check/route"
import * as route_admin_erp_stock_check__id_ from "@/modules/erp/routes/admin/erp-stock-check/[id]/route"
import * as route_admin_erp_stock_check_item from "@/modules/erp/routes/admin/erp-stock-check-item/route"
import * as route_admin_erp_stock_check_item__id_ from "@/modules/erp/routes/admin/erp-stock-check-item/[id]/route"
import * as route_admin_erp_stock_in from "@/modules/erp/routes/admin/erp-stock-in/route"
import * as route_admin_erp_stock_in__id_ from "@/modules/erp/routes/admin/erp-stock-in/[id]/route"
import * as route_admin_erp_stock_in_item from "@/modules/erp/routes/admin/erp-stock-in-item/route"
import * as route_admin_erp_stock_in_item__id_ from "@/modules/erp/routes/admin/erp-stock-in-item/[id]/route"
import * as route_admin_erp_stock_move from "@/modules/erp/routes/admin/erp-stock-move/route"
import * as route_admin_erp_stock_move__id_ from "@/modules/erp/routes/admin/erp-stock-move/[id]/route"
import * as route_admin_erp_stock_move_item from "@/modules/erp/routes/admin/erp-stock-move-item/route"
import * as route_admin_erp_stock_move_item__id_ from "@/modules/erp/routes/admin/erp-stock-move-item/[id]/route"
import * as route_admin_erp_stock_out from "@/modules/erp/routes/admin/erp-stock-out/route"
import * as route_admin_erp_stock_out__id_ from "@/modules/erp/routes/admin/erp-stock-out/[id]/route"
import * as route_admin_erp_stock_out_item from "@/modules/erp/routes/admin/erp-stock-out-item/route"
import * as route_admin_erp_stock_out_item__id_ from "@/modules/erp/routes/admin/erp-stock-out-item/[id]/route"
import * as route_admin_erp_stock_record from "@/modules/erp/routes/admin/erp-stock-record/route"
import * as route_admin_erp_stock_record__id_ from "@/modules/erp/routes/admin/erp-stock-record/[id]/route"
import * as route_admin_erp_supplier from "@/modules/erp/routes/admin/erp-supplier/route"
import * as route_admin_erp_supplier__id_ from "@/modules/erp/routes/admin/erp-supplier/[id]/route"
import * as route_admin_erp_warehouse from "@/modules/erp/routes/admin/erp-warehouse/route"
import * as route_admin_erp_warehouse__id_ from "@/modules/erp/routes/admin/erp-warehouse/[id]/route"
import * as route_admin_orders from "@/modules/erp/routes/admin/orders/route"
import * as route_admin_orders__id_ from "@/modules/erp/routes/admin/orders/[id]/route"
import * as route_admin_products from "@/modules/erp/routes/admin/products/route"
import * as route_admin_products__id_ from "@/modules/erp/routes/admin/products/[id]/route"
import * as route_admin_stock_adjustments from "@/modules/erp/routes/admin/stock-adjustments/route"
import * as route_admin_stock_adjustments__id_ from "@/modules/erp/routes/admin/stock-adjustments/[id]/route"

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
    "admin:erp-account/[id]:delete": (input: any) => invoke(route_admin_erp_account__id_.DELETE, input),
    "admin:erp-account/[id]:get": (input: any) => invoke(route_admin_erp_account__id_.GET, input),
    "admin:erp-account/[id]:put": (input: any) => invoke(route_admin_erp_account__id_.PUT, input),
    "admin:erp-account:get": (input: any) => invoke(route_admin_erp_account.GET, input),
    "admin:erp-account:post": (input: any) => invoke(route_admin_erp_account.POST, input),
    "admin:erp-customer/[id]:delete": (input: any) => invoke(route_admin_erp_customer__id_.DELETE, input),
    "admin:erp-customer/[id]:get": (input: any) => invoke(route_admin_erp_customer__id_.GET, input),
    "admin:erp-customer/[id]:put": (input: any) => invoke(route_admin_erp_customer__id_.PUT, input),
    "admin:erp-customer:get": (input: any) => invoke(route_admin_erp_customer.GET, input),
    "admin:erp-customer:post": (input: any) => invoke(route_admin_erp_customer.POST, input),
    "admin:erp-finance-payment-item/[id]:delete": (input: any) => invoke(route_admin_erp_finance_payment_item__id_.DELETE, input),
    "admin:erp-finance-payment-item/[id]:get": (input: any) => invoke(route_admin_erp_finance_payment_item__id_.GET, input),
    "admin:erp-finance-payment-item/[id]:put": (input: any) => invoke(route_admin_erp_finance_payment_item__id_.PUT, input),
    "admin:erp-finance-payment-item:get": (input: any) => invoke(route_admin_erp_finance_payment_item.GET, input),
    "admin:erp-finance-payment-item:post": (input: any) => invoke(route_admin_erp_finance_payment_item.POST, input),
    "admin:erp-finance-payment/[id]:delete": (input: any) => invoke(route_admin_erp_finance_payment__id_.DELETE, input),
    "admin:erp-finance-payment/[id]:get": (input: any) => invoke(route_admin_erp_finance_payment__id_.GET, input),
    "admin:erp-finance-payment/[id]:put": (input: any) => invoke(route_admin_erp_finance_payment__id_.PUT, input),
    "admin:erp-finance-payment:get": (input: any) => invoke(route_admin_erp_finance_payment.GET, input),
    "admin:erp-finance-payment:post": (input: any) => invoke(route_admin_erp_finance_payment.POST, input),
    "admin:erp-finance-receipt-item/[id]:delete": (input: any) => invoke(route_admin_erp_finance_receipt_item__id_.DELETE, input),
    "admin:erp-finance-receipt-item/[id]:get": (input: any) => invoke(route_admin_erp_finance_receipt_item__id_.GET, input),
    "admin:erp-finance-receipt-item/[id]:put": (input: any) => invoke(route_admin_erp_finance_receipt_item__id_.PUT, input),
    "admin:erp-finance-receipt-item:get": (input: any) => invoke(route_admin_erp_finance_receipt_item.GET, input),
    "admin:erp-finance-receipt-item:post": (input: any) => invoke(route_admin_erp_finance_receipt_item.POST, input),
    "admin:erp-finance-receipt/[id]:delete": (input: any) => invoke(route_admin_erp_finance_receipt__id_.DELETE, input),
    "admin:erp-finance-receipt/[id]:get": (input: any) => invoke(route_admin_erp_finance_receipt__id_.GET, input),
    "admin:erp-finance-receipt/[id]:put": (input: any) => invoke(route_admin_erp_finance_receipt__id_.PUT, input),
    "admin:erp-finance-receipt:get": (input: any) => invoke(route_admin_erp_finance_receipt.GET, input),
    "admin:erp-finance-receipt:post": (input: any) => invoke(route_admin_erp_finance_receipt.POST, input),
    "admin:erp-product-category/[id]:delete": (input: any) => invoke(route_admin_erp_product_category__id_.DELETE, input),
    "admin:erp-product-category/[id]:get": (input: any) => invoke(route_admin_erp_product_category__id_.GET, input),
    "admin:erp-product-category/[id]:put": (input: any) => invoke(route_admin_erp_product_category__id_.PUT, input),
    "admin:erp-product-category:get": (input: any) => invoke(route_admin_erp_product_category.GET, input),
    "admin:erp-product-category:post": (input: any) => invoke(route_admin_erp_product_category.POST, input),
    "admin:erp-product-unit/[id]:delete": (input: any) => invoke(route_admin_erp_product_unit__id_.DELETE, input),
    "admin:erp-product-unit/[id]:get": (input: any) => invoke(route_admin_erp_product_unit__id_.GET, input),
    "admin:erp-product-unit/[id]:put": (input: any) => invoke(route_admin_erp_product_unit__id_.PUT, input),
    "admin:erp-product-unit:get": (input: any) => invoke(route_admin_erp_product_unit.GET, input),
    "admin:erp-product-unit:post": (input: any) => invoke(route_admin_erp_product_unit.POST, input),
    "admin:erp-product/[id]:delete": (input: any) => invoke(route_admin_erp_product__id_.DELETE, input),
    "admin:erp-product/[id]:get": (input: any) => invoke(route_admin_erp_product__id_.GET, input),
    "admin:erp-product/[id]:put": (input: any) => invoke(route_admin_erp_product__id_.PUT, input),
    "admin:erp-product:get": (input: any) => invoke(route_admin_erp_product.GET, input),
    "admin:erp-product:post": (input: any) => invoke(route_admin_erp_product.POST, input),
    "admin:erp-purchase-in-item/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_in_item__id_.DELETE, input),
    "admin:erp-purchase-in-item/[id]:get": (input: any) => invoke(route_admin_erp_purchase_in_item__id_.GET, input),
    "admin:erp-purchase-in-item/[id]:put": (input: any) => invoke(route_admin_erp_purchase_in_item__id_.PUT, input),
    "admin:erp-purchase-in-item:get": (input: any) => invoke(route_admin_erp_purchase_in_item.GET, input),
    "admin:erp-purchase-in-item:post": (input: any) => invoke(route_admin_erp_purchase_in_item.POST, input),
    "admin:erp-purchase-in/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_in__id_.DELETE, input),
    "admin:erp-purchase-in/[id]:get": (input: any) => invoke(route_admin_erp_purchase_in__id_.GET, input),
    "admin:erp-purchase-in/[id]:put": (input: any) => invoke(route_admin_erp_purchase_in__id_.PUT, input),
    "admin:erp-purchase-in:get": (input: any) => invoke(route_admin_erp_purchase_in.GET, input),
    "admin:erp-purchase-in:post": (input: any) => invoke(route_admin_erp_purchase_in.POST, input),
    "admin:erp-purchase-order-item/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_order_item__id_.DELETE, input),
    "admin:erp-purchase-order-item/[id]:get": (input: any) => invoke(route_admin_erp_purchase_order_item__id_.GET, input),
    "admin:erp-purchase-order-item/[id]:put": (input: any) => invoke(route_admin_erp_purchase_order_item__id_.PUT, input),
    "admin:erp-purchase-order-item:get": (input: any) => invoke(route_admin_erp_purchase_order_item.GET, input),
    "admin:erp-purchase-order-item:post": (input: any) => invoke(route_admin_erp_purchase_order_item.POST, input),
    "admin:erp-purchase-order/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_order__id_.DELETE, input),
    "admin:erp-purchase-order/[id]:get": (input: any) => invoke(route_admin_erp_purchase_order__id_.GET, input),
    "admin:erp-purchase-order/[id]:put": (input: any) => invoke(route_admin_erp_purchase_order__id_.PUT, input),
    "admin:erp-purchase-order:get": (input: any) => invoke(route_admin_erp_purchase_order.GET, input),
    "admin:erp-purchase-order:post": (input: any) => invoke(route_admin_erp_purchase_order.POST, input),
    "admin:erp-purchase-return-item/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_return_item__id_.DELETE, input),
    "admin:erp-purchase-return-item/[id]:get": (input: any) => invoke(route_admin_erp_purchase_return_item__id_.GET, input),
    "admin:erp-purchase-return-item/[id]:put": (input: any) => invoke(route_admin_erp_purchase_return_item__id_.PUT, input),
    "admin:erp-purchase-return-item:get": (input: any) => invoke(route_admin_erp_purchase_return_item.GET, input),
    "admin:erp-purchase-return-item:post": (input: any) => invoke(route_admin_erp_purchase_return_item.POST, input),
    "admin:erp-purchase-return/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_return__id_.DELETE, input),
    "admin:erp-purchase-return/[id]:get": (input: any) => invoke(route_admin_erp_purchase_return__id_.GET, input),
    "admin:erp-purchase-return/[id]:put": (input: any) => invoke(route_admin_erp_purchase_return__id_.PUT, input),
    "admin:erp-purchase-return:get": (input: any) => invoke(route_admin_erp_purchase_return.GET, input),
    "admin:erp-purchase-return:post": (input: any) => invoke(route_admin_erp_purchase_return.POST, input),
    "admin:erp-purchase-statistics/[id]:delete": (input: any) => invoke(route_admin_erp_purchase_statistics__id_.DELETE, input),
    "admin:erp-purchase-statistics/[id]:get": (input: any) => invoke(route_admin_erp_purchase_statistics__id_.GET, input),
    "admin:erp-purchase-statistics/[id]:put": (input: any) => invoke(route_admin_erp_purchase_statistics__id_.PUT, input),
    "admin:erp-purchase-statistics:get": (input: any) => invoke(route_admin_erp_purchase_statistics.GET, input),
    "admin:erp-purchase-statistics:post": (input: any) => invoke(route_admin_erp_purchase_statistics.POST, input),
    "admin:erp-sale-order-item/[id]:delete": (input: any) => invoke(route_admin_erp_sale_order_item__id_.DELETE, input),
    "admin:erp-sale-order-item/[id]:get": (input: any) => invoke(route_admin_erp_sale_order_item__id_.GET, input),
    "admin:erp-sale-order-item/[id]:put": (input: any) => invoke(route_admin_erp_sale_order_item__id_.PUT, input),
    "admin:erp-sale-order-item:get": (input: any) => invoke(route_admin_erp_sale_order_item.GET, input),
    "admin:erp-sale-order-item:post": (input: any) => invoke(route_admin_erp_sale_order_item.POST, input),
    "admin:erp-sale-order/[id]:delete": (input: any) => invoke(route_admin_erp_sale_order__id_.DELETE, input),
    "admin:erp-sale-order/[id]:get": (input: any) => invoke(route_admin_erp_sale_order__id_.GET, input),
    "admin:erp-sale-order/[id]:put": (input: any) => invoke(route_admin_erp_sale_order__id_.PUT, input),
    "admin:erp-sale-order:get": (input: any) => invoke(route_admin_erp_sale_order.GET, input),
    "admin:erp-sale-order:post": (input: any) => invoke(route_admin_erp_sale_order.POST, input),
    "admin:erp-sale-out-item/[id]:delete": (input: any) => invoke(route_admin_erp_sale_out_item__id_.DELETE, input),
    "admin:erp-sale-out-item/[id]:get": (input: any) => invoke(route_admin_erp_sale_out_item__id_.GET, input),
    "admin:erp-sale-out-item/[id]:put": (input: any) => invoke(route_admin_erp_sale_out_item__id_.PUT, input),
    "admin:erp-sale-out-item:get": (input: any) => invoke(route_admin_erp_sale_out_item.GET, input),
    "admin:erp-sale-out-item:post": (input: any) => invoke(route_admin_erp_sale_out_item.POST, input),
    "admin:erp-sale-out/[id]:delete": (input: any) => invoke(route_admin_erp_sale_out__id_.DELETE, input),
    "admin:erp-sale-out/[id]:get": (input: any) => invoke(route_admin_erp_sale_out__id_.GET, input),
    "admin:erp-sale-out/[id]:put": (input: any) => invoke(route_admin_erp_sale_out__id_.PUT, input),
    "admin:erp-sale-out:get": (input: any) => invoke(route_admin_erp_sale_out.GET, input),
    "admin:erp-sale-out:post": (input: any) => invoke(route_admin_erp_sale_out.POST, input),
    "admin:erp-sale-return-item/[id]:delete": (input: any) => invoke(route_admin_erp_sale_return_item__id_.DELETE, input),
    "admin:erp-sale-return-item/[id]:get": (input: any) => invoke(route_admin_erp_sale_return_item__id_.GET, input),
    "admin:erp-sale-return-item/[id]:put": (input: any) => invoke(route_admin_erp_sale_return_item__id_.PUT, input),
    "admin:erp-sale-return-item:get": (input: any) => invoke(route_admin_erp_sale_return_item.GET, input),
    "admin:erp-sale-return-item:post": (input: any) => invoke(route_admin_erp_sale_return_item.POST, input),
    "admin:erp-sale-return/[id]:delete": (input: any) => invoke(route_admin_erp_sale_return__id_.DELETE, input),
    "admin:erp-sale-return/[id]:get": (input: any) => invoke(route_admin_erp_sale_return__id_.GET, input),
    "admin:erp-sale-return/[id]:put": (input: any) => invoke(route_admin_erp_sale_return__id_.PUT, input),
    "admin:erp-sale-return:get": (input: any) => invoke(route_admin_erp_sale_return.GET, input),
    "admin:erp-sale-return:post": (input: any) => invoke(route_admin_erp_sale_return.POST, input),
    "admin:erp-sale-statistics/[id]:delete": (input: any) => invoke(route_admin_erp_sale_statistics__id_.DELETE, input),
    "admin:erp-sale-statistics/[id]:get": (input: any) => invoke(route_admin_erp_sale_statistics__id_.GET, input),
    "admin:erp-sale-statistics/[id]:put": (input: any) => invoke(route_admin_erp_sale_statistics__id_.PUT, input),
    "admin:erp-sale-statistics:get": (input: any) => invoke(route_admin_erp_sale_statistics.GET, input),
    "admin:erp-sale-statistics:post": (input: any) => invoke(route_admin_erp_sale_statistics.POST, input),
    "admin:erp-stock-check-item/[id]:delete": (input: any) => invoke(route_admin_erp_stock_check_item__id_.DELETE, input),
    "admin:erp-stock-check-item/[id]:get": (input: any) => invoke(route_admin_erp_stock_check_item__id_.GET, input),
    "admin:erp-stock-check-item/[id]:put": (input: any) => invoke(route_admin_erp_stock_check_item__id_.PUT, input),
    "admin:erp-stock-check-item:get": (input: any) => invoke(route_admin_erp_stock_check_item.GET, input),
    "admin:erp-stock-check-item:post": (input: any) => invoke(route_admin_erp_stock_check_item.POST, input),
    "admin:erp-stock-check/[id]:delete": (input: any) => invoke(route_admin_erp_stock_check__id_.DELETE, input),
    "admin:erp-stock-check/[id]:get": (input: any) => invoke(route_admin_erp_stock_check__id_.GET, input),
    "admin:erp-stock-check/[id]:put": (input: any) => invoke(route_admin_erp_stock_check__id_.PUT, input),
    "admin:erp-stock-check:get": (input: any) => invoke(route_admin_erp_stock_check.GET, input),
    "admin:erp-stock-check:post": (input: any) => invoke(route_admin_erp_stock_check.POST, input),
    "admin:erp-stock-in-item/[id]:delete": (input: any) => invoke(route_admin_erp_stock_in_item__id_.DELETE, input),
    "admin:erp-stock-in-item/[id]:get": (input: any) => invoke(route_admin_erp_stock_in_item__id_.GET, input),
    "admin:erp-stock-in-item/[id]:put": (input: any) => invoke(route_admin_erp_stock_in_item__id_.PUT, input),
    "admin:erp-stock-in-item:get": (input: any) => invoke(route_admin_erp_stock_in_item.GET, input),
    "admin:erp-stock-in-item:post": (input: any) => invoke(route_admin_erp_stock_in_item.POST, input),
    "admin:erp-stock-in/[id]:delete": (input: any) => invoke(route_admin_erp_stock_in__id_.DELETE, input),
    "admin:erp-stock-in/[id]:get": (input: any) => invoke(route_admin_erp_stock_in__id_.GET, input),
    "admin:erp-stock-in/[id]:put": (input: any) => invoke(route_admin_erp_stock_in__id_.PUT, input),
    "admin:erp-stock-in:get": (input: any) => invoke(route_admin_erp_stock_in.GET, input),
    "admin:erp-stock-in:post": (input: any) => invoke(route_admin_erp_stock_in.POST, input),
    "admin:erp-stock-move-item/[id]:delete": (input: any) => invoke(route_admin_erp_stock_move_item__id_.DELETE, input),
    "admin:erp-stock-move-item/[id]:get": (input: any) => invoke(route_admin_erp_stock_move_item__id_.GET, input),
    "admin:erp-stock-move-item/[id]:put": (input: any) => invoke(route_admin_erp_stock_move_item__id_.PUT, input),
    "admin:erp-stock-move-item:get": (input: any) => invoke(route_admin_erp_stock_move_item.GET, input),
    "admin:erp-stock-move-item:post": (input: any) => invoke(route_admin_erp_stock_move_item.POST, input),
    "admin:erp-stock-move/[id]:delete": (input: any) => invoke(route_admin_erp_stock_move__id_.DELETE, input),
    "admin:erp-stock-move/[id]:get": (input: any) => invoke(route_admin_erp_stock_move__id_.GET, input),
    "admin:erp-stock-move/[id]:put": (input: any) => invoke(route_admin_erp_stock_move__id_.PUT, input),
    "admin:erp-stock-move:get": (input: any) => invoke(route_admin_erp_stock_move.GET, input),
    "admin:erp-stock-move:post": (input: any) => invoke(route_admin_erp_stock_move.POST, input),
    "admin:erp-stock-out-item/[id]:delete": (input: any) => invoke(route_admin_erp_stock_out_item__id_.DELETE, input),
    "admin:erp-stock-out-item/[id]:get": (input: any) => invoke(route_admin_erp_stock_out_item__id_.GET, input),
    "admin:erp-stock-out-item/[id]:put": (input: any) => invoke(route_admin_erp_stock_out_item__id_.PUT, input),
    "admin:erp-stock-out-item:get": (input: any) => invoke(route_admin_erp_stock_out_item.GET, input),
    "admin:erp-stock-out-item:post": (input: any) => invoke(route_admin_erp_stock_out_item.POST, input),
    "admin:erp-stock-out/[id]:delete": (input: any) => invoke(route_admin_erp_stock_out__id_.DELETE, input),
    "admin:erp-stock-out/[id]:get": (input: any) => invoke(route_admin_erp_stock_out__id_.GET, input),
    "admin:erp-stock-out/[id]:put": (input: any) => invoke(route_admin_erp_stock_out__id_.PUT, input),
    "admin:erp-stock-out:get": (input: any) => invoke(route_admin_erp_stock_out.GET, input),
    "admin:erp-stock-out:post": (input: any) => invoke(route_admin_erp_stock_out.POST, input),
    "admin:erp-stock-record/[id]:delete": (input: any) => invoke(route_admin_erp_stock_record__id_.DELETE, input),
    "admin:erp-stock-record/[id]:get": (input: any) => invoke(route_admin_erp_stock_record__id_.GET, input),
    "admin:erp-stock-record/[id]:put": (input: any) => invoke(route_admin_erp_stock_record__id_.PUT, input),
    "admin:erp-stock-record:get": (input: any) => invoke(route_admin_erp_stock_record.GET, input),
    "admin:erp-stock-record:post": (input: any) => invoke(route_admin_erp_stock_record.POST, input),
    "admin:erp-stock/[id]:delete": (input: any) => invoke(route_admin_erp_stock__id_.DELETE, input),
    "admin:erp-stock/[id]:get": (input: any) => invoke(route_admin_erp_stock__id_.GET, input),
    "admin:erp-stock/[id]:put": (input: any) => invoke(route_admin_erp_stock__id_.PUT, input),
    "admin:erp-stock:get": (input: any) => invoke(route_admin_erp_stock.GET, input),
    "admin:erp-stock:post": (input: any) => invoke(route_admin_erp_stock.POST, input),
    "admin:erp-supplier/[id]:delete": (input: any) => invoke(route_admin_erp_supplier__id_.DELETE, input),
    "admin:erp-supplier/[id]:get": (input: any) => invoke(route_admin_erp_supplier__id_.GET, input),
    "admin:erp-supplier/[id]:put": (input: any) => invoke(route_admin_erp_supplier__id_.PUT, input),
    "admin:erp-supplier:get": (input: any) => invoke(route_admin_erp_supplier.GET, input),
    "admin:erp-supplier:post": (input: any) => invoke(route_admin_erp_supplier.POST, input),
    "admin:erp-warehouse/[id]:delete": (input: any) => invoke(route_admin_erp_warehouse__id_.DELETE, input),
    "admin:erp-warehouse/[id]:get": (input: any) => invoke(route_admin_erp_warehouse__id_.GET, input),
    "admin:erp-warehouse/[id]:put": (input: any) => invoke(route_admin_erp_warehouse__id_.PUT, input),
    "admin:erp-warehouse:get": (input: any) => invoke(route_admin_erp_warehouse.GET, input),
    "admin:erp-warehouse:post": (input: any) => invoke(route_admin_erp_warehouse.POST, input),
    "admin:orders/[id]:delete": (input: any) => invoke(route_admin_orders__id_.DELETE, input),
    "admin:orders/[id]:get": (input: any) => invoke(route_admin_orders__id_.GET, input),
    "admin:orders/[id]:put": (input: any) => invoke(route_admin_orders__id_.PUT, input),
    "admin:orders:get": (input: any) => invoke(route_admin_orders.GET, input),
    "admin:orders:post": (input: any) => invoke(route_admin_orders.POST, input),
    "admin:products/[id]:delete": (input: any) => invoke(route_admin_products__id_.DELETE, input),
    "admin:products/[id]:get": (input: any) => invoke(route_admin_products__id_.GET, input),
    "admin:products/[id]:put": (input: any) => invoke(route_admin_products__id_.PUT, input),
    "admin:products:get": (input: any) => invoke(route_admin_products.GET, input),
    "admin:products:post": (input: any) => invoke(route_admin_products.POST, input),
    "admin:stock-adjustments/[id]:delete": (input: any) => invoke(route_admin_stock_adjustments__id_.DELETE, input),
    "admin:stock-adjustments/[id]:get": (input: any) => invoke(route_admin_stock_adjustments__id_.GET, input),
    "admin:stock-adjustments/[id]:put": (input: any) => invoke(route_admin_stock_adjustments__id_.PUT, input),
    "admin:stock-adjustments:get": (input: any) => invoke(route_admin_stock_adjustments.GET, input),
    "admin:stock-adjustments:post": (input: any) => invoke(route_admin_stock_adjustments.POST, input),
  },
})
