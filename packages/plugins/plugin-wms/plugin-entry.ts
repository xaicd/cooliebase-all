/**
 * wms 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_wms_check_order from "@/modules/wms/routes/admin/wms-check-order/route"
import * as route_admin_wms_check_order__id_ from "@/modules/wms/routes/admin/wms-check-order/[id]/route"
import * as route_admin_wms_check_order_detail from "@/modules/wms/routes/admin/wms-check-order-detail/route"
import * as route_admin_wms_check_order_detail__id_ from "@/modules/wms/routes/admin/wms-check-order-detail/[id]/route"
import * as route_admin_wms_check_order_detail_export from "@/modules/wms/routes/admin/wms-check-order-detail/export/route"
import * as route_admin_wms_check_order_detail_import from "@/modules/wms/routes/admin/wms-check-order-detail/import/route"
import * as route_admin_wms_check_order_detail_import_template from "@/modules/wms/routes/admin/wms-check-order-detail/import-template/route"
import * as route_admin_wms_check_order_export from "@/modules/wms/routes/admin/wms-check-order/export/route"
import * as route_admin_wms_check_order_import from "@/modules/wms/routes/admin/wms-check-order/import/route"
import * as route_admin_wms_check_order_import_template from "@/modules/wms/routes/admin/wms-check-order/import-template/route"
import * as route_admin_wms_home_statistics from "@/modules/wms/routes/admin/wms-home-statistics/route"
import * as route_admin_wms_inventory from "@/modules/wms/routes/admin/wms-inventory/route"
import * as route_admin_wms_inventory__id_ from "@/modules/wms/routes/admin/wms-inventory/[id]/route"
import * as route_admin_wms_inventory_export from "@/modules/wms/routes/admin/wms-inventory/export/route"
import * as route_admin_wms_inventory_history from "@/modules/wms/routes/admin/wms-inventory-history/route"
import * as route_admin_wms_inventory_history__id_ from "@/modules/wms/routes/admin/wms-inventory-history/[id]/route"
import * as route_admin_wms_inventory_history_export from "@/modules/wms/routes/admin/wms-inventory-history/export/route"
import * as route_admin_wms_inventory_history_import from "@/modules/wms/routes/admin/wms-inventory-history/import/route"
import * as route_admin_wms_inventory_history_import_template from "@/modules/wms/routes/admin/wms-inventory-history/import-template/route"
import * as route_admin_wms_inventory_import from "@/modules/wms/routes/admin/wms-inventory/import/route"
import * as route_admin_wms_inventory_import_template from "@/modules/wms/routes/admin/wms-inventory/import-template/route"
import * as route_admin_wms_item from "@/modules/wms/routes/admin/wms-item/route"
import * as route_admin_wms_item__id_ from "@/modules/wms/routes/admin/wms-item/[id]/route"
import * as route_admin_wms_item_brand from "@/modules/wms/routes/admin/wms-item-brand/route"
import * as route_admin_wms_item_brand__id_ from "@/modules/wms/routes/admin/wms-item-brand/[id]/route"
import * as route_admin_wms_item_brand_export from "@/modules/wms/routes/admin/wms-item-brand/export/route"
import * as route_admin_wms_item_brand_import from "@/modules/wms/routes/admin/wms-item-brand/import/route"
import * as route_admin_wms_item_brand_import_template from "@/modules/wms/routes/admin/wms-item-brand/import-template/route"
import * as route_admin_wms_item_category from "@/modules/wms/routes/admin/wms-item-category/route"
import * as route_admin_wms_item_category__id_ from "@/modules/wms/routes/admin/wms-item-category/[id]/route"
import * as route_admin_wms_item_category_export from "@/modules/wms/routes/admin/wms-item-category/export/route"
import * as route_admin_wms_item_category_import from "@/modules/wms/routes/admin/wms-item-category/import/route"
import * as route_admin_wms_item_category_import_template from "@/modules/wms/routes/admin/wms-item-category/import-template/route"
import * as route_admin_wms_item_export from "@/modules/wms/routes/admin/wms-item/export/route"
import * as route_admin_wms_item_import from "@/modules/wms/routes/admin/wms-item/import/route"
import * as route_admin_wms_item_import_template from "@/modules/wms/routes/admin/wms-item/import-template/route"
import * as route_admin_wms_item_sku from "@/modules/wms/routes/admin/wms-item-sku/route"
import * as route_admin_wms_item_sku__id_ from "@/modules/wms/routes/admin/wms-item-sku/[id]/route"
import * as route_admin_wms_item_sku_export from "@/modules/wms/routes/admin/wms-item-sku/export/route"
import * as route_admin_wms_item_sku_import from "@/modules/wms/routes/admin/wms-item-sku/import/route"
import * as route_admin_wms_item_sku_import_template from "@/modules/wms/routes/admin/wms-item-sku/import-template/route"
import * as route_admin_wms_merchant from "@/modules/wms/routes/admin/wms-merchant/route"
import * as route_admin_wms_merchant__id_ from "@/modules/wms/routes/admin/wms-merchant/[id]/route"
import * as route_admin_wms_merchant_export from "@/modules/wms/routes/admin/wms-merchant/export/route"
import * as route_admin_wms_merchant_import from "@/modules/wms/routes/admin/wms-merchant/import/route"
import * as route_admin_wms_merchant_import_template from "@/modules/wms/routes/admin/wms-merchant/import-template/route"
import * as route_admin_wms_movement_order from "@/modules/wms/routes/admin/wms-movement-order/route"
import * as route_admin_wms_movement_order__id_ from "@/modules/wms/routes/admin/wms-movement-order/[id]/route"
import * as route_admin_wms_movement_order_detail from "@/modules/wms/routes/admin/wms-movement-order-detail/route"
import * as route_admin_wms_movement_order_detail__id_ from "@/modules/wms/routes/admin/wms-movement-order-detail/[id]/route"
import * as route_admin_wms_movement_order_detail_export from "@/modules/wms/routes/admin/wms-movement-order-detail/export/route"
import * as route_admin_wms_movement_order_detail_import from "@/modules/wms/routes/admin/wms-movement-order-detail/import/route"
import * as route_admin_wms_movement_order_detail_import_template from "@/modules/wms/routes/admin/wms-movement-order-detail/import-template/route"
import * as route_admin_wms_movement_order_export from "@/modules/wms/routes/admin/wms-movement-order/export/route"
import * as route_admin_wms_movement_order_import from "@/modules/wms/routes/admin/wms-movement-order/import/route"
import * as route_admin_wms_movement_order_import_template from "@/modules/wms/routes/admin/wms-movement-order/import-template/route"
import * as route_admin_wms_receipt_order from "@/modules/wms/routes/admin/wms-receipt-order/route"
import * as route_admin_wms_receipt_order__id_ from "@/modules/wms/routes/admin/wms-receipt-order/[id]/route"
import * as route_admin_wms_receipt_order_detail from "@/modules/wms/routes/admin/wms-receipt-order-detail/route"
import * as route_admin_wms_receipt_order_detail__id_ from "@/modules/wms/routes/admin/wms-receipt-order-detail/[id]/route"
import * as route_admin_wms_receipt_order_detail_export from "@/modules/wms/routes/admin/wms-receipt-order-detail/export/route"
import * as route_admin_wms_receipt_order_detail_import from "@/modules/wms/routes/admin/wms-receipt-order-detail/import/route"
import * as route_admin_wms_receipt_order_detail_import_template from "@/modules/wms/routes/admin/wms-receipt-order-detail/import-template/route"
import * as route_admin_wms_receipt_order_export from "@/modules/wms/routes/admin/wms-receipt-order/export/route"
import * as route_admin_wms_receipt_order_import from "@/modules/wms/routes/admin/wms-receipt-order/import/route"
import * as route_admin_wms_receipt_order_import_template from "@/modules/wms/routes/admin/wms-receipt-order/import-template/route"
import * as route_admin_wms_shipment_order from "@/modules/wms/routes/admin/wms-shipment-order/route"
import * as route_admin_wms_shipment_order__id_ from "@/modules/wms/routes/admin/wms-shipment-order/[id]/route"
import * as route_admin_wms_shipment_order_detail from "@/modules/wms/routes/admin/wms-shipment-order-detail/route"
import * as route_admin_wms_shipment_order_detail__id_ from "@/modules/wms/routes/admin/wms-shipment-order-detail/[id]/route"
import * as route_admin_wms_shipment_order_detail_export from "@/modules/wms/routes/admin/wms-shipment-order-detail/export/route"
import * as route_admin_wms_shipment_order_detail_import from "@/modules/wms/routes/admin/wms-shipment-order-detail/import/route"
import * as route_admin_wms_shipment_order_detail_import_template from "@/modules/wms/routes/admin/wms-shipment-order-detail/import-template/route"
import * as route_admin_wms_shipment_order_export from "@/modules/wms/routes/admin/wms-shipment-order/export/route"
import * as route_admin_wms_shipment_order_import from "@/modules/wms/routes/admin/wms-shipment-order/import/route"
import * as route_admin_wms_shipment_order_import_template from "@/modules/wms/routes/admin/wms-shipment-order/import-template/route"
import * as route_admin_wms_warehouse from "@/modules/wms/routes/admin/wms-warehouse/route"
import * as route_admin_wms_warehouse__id_ from "@/modules/wms/routes/admin/wms-warehouse/[id]/route"
import * as route_admin_wms_warehouse_export from "@/modules/wms/routes/admin/wms-warehouse/export/route"
import * as route_admin_wms_warehouse_import from "@/modules/wms/routes/admin/wms-warehouse/import/route"
import * as route_admin_wms_warehouse_import_template from "@/modules/wms/routes/admin/wms-warehouse/import-template/route"

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
    "admin:wms-check-order-detail/[id]:delete": (input: any) => invoke(route_admin_wms_check_order_detail__id_.DELETE, input),
    "admin:wms-check-order-detail/[id]:get": (input: any) => invoke(route_admin_wms_check_order_detail__id_.GET, input),
    "admin:wms-check-order-detail/[id]:put": (input: any) => invoke(route_admin_wms_check_order_detail__id_.PUT, input),
    "admin:wms-check-order-detail/export:post": (input: any) => invoke(route_admin_wms_check_order_detail_export.POST, input),
    "admin:wms-check-order-detail/import-template:get": (input: any) => invoke(route_admin_wms_check_order_detail_import_template.GET, input),
    "admin:wms-check-order-detail/import:post": (input: any) => invoke(route_admin_wms_check_order_detail_import.POST, input),
    "admin:wms-check-order-detail:delete": (input: any) => invoke(route_admin_wms_check_order_detail.DELETE, input),
    "admin:wms-check-order-detail:get": (input: any) => invoke(route_admin_wms_check_order_detail.GET, input),
    "admin:wms-check-order-detail:post": (input: any) => invoke(route_admin_wms_check_order_detail.POST, input),
    "admin:wms-check-order-detail:put": (input: any) => invoke(route_admin_wms_check_order_detail.PUT, input),
    "admin:wms-check-order/[id]:delete": (input: any) => invoke(route_admin_wms_check_order__id_.DELETE, input),
    "admin:wms-check-order/[id]:get": (input: any) => invoke(route_admin_wms_check_order__id_.GET, input),
    "admin:wms-check-order/[id]:put": (input: any) => invoke(route_admin_wms_check_order__id_.PUT, input),
    "admin:wms-check-order/export:post": (input: any) => invoke(route_admin_wms_check_order_export.POST, input),
    "admin:wms-check-order/import-template:get": (input: any) => invoke(route_admin_wms_check_order_import_template.GET, input),
    "admin:wms-check-order/import:post": (input: any) => invoke(route_admin_wms_check_order_import.POST, input),
    "admin:wms-check-order:delete": (input: any) => invoke(route_admin_wms_check_order.DELETE, input),
    "admin:wms-check-order:get": (input: any) => invoke(route_admin_wms_check_order.GET, input),
    "admin:wms-check-order:post": (input: any) => invoke(route_admin_wms_check_order.POST, input),
    "admin:wms-check-order:put": (input: any) => invoke(route_admin_wms_check_order.PUT, input),
    "admin:wms-home-statistics:get": (input: any) => invoke(route_admin_wms_home_statistics.GET, input),
    "admin:wms-home-statistics:post": (input: any) => invoke(route_admin_wms_home_statistics.POST, input),
    "admin:wms-inventory-history/[id]:delete": (input: any) => invoke(route_admin_wms_inventory_history__id_.DELETE, input),
    "admin:wms-inventory-history/[id]:get": (input: any) => invoke(route_admin_wms_inventory_history__id_.GET, input),
    "admin:wms-inventory-history/[id]:put": (input: any) => invoke(route_admin_wms_inventory_history__id_.PUT, input),
    "admin:wms-inventory-history/export:post": (input: any) => invoke(route_admin_wms_inventory_history_export.POST, input),
    "admin:wms-inventory-history/import-template:get": (input: any) => invoke(route_admin_wms_inventory_history_import_template.GET, input),
    "admin:wms-inventory-history/import:post": (input: any) => invoke(route_admin_wms_inventory_history_import.POST, input),
    "admin:wms-inventory-history:delete": (input: any) => invoke(route_admin_wms_inventory_history.DELETE, input),
    "admin:wms-inventory-history:get": (input: any) => invoke(route_admin_wms_inventory_history.GET, input),
    "admin:wms-inventory-history:post": (input: any) => invoke(route_admin_wms_inventory_history.POST, input),
    "admin:wms-inventory-history:put": (input: any) => invoke(route_admin_wms_inventory_history.PUT, input),
    "admin:wms-inventory/[id]:delete": (input: any) => invoke(route_admin_wms_inventory__id_.DELETE, input),
    "admin:wms-inventory/[id]:get": (input: any) => invoke(route_admin_wms_inventory__id_.GET, input),
    "admin:wms-inventory/[id]:put": (input: any) => invoke(route_admin_wms_inventory__id_.PUT, input),
    "admin:wms-inventory/export:post": (input: any) => invoke(route_admin_wms_inventory_export.POST, input),
    "admin:wms-inventory/import-template:get": (input: any) => invoke(route_admin_wms_inventory_import_template.GET, input),
    "admin:wms-inventory/import:post": (input: any) => invoke(route_admin_wms_inventory_import.POST, input),
    "admin:wms-inventory:delete": (input: any) => invoke(route_admin_wms_inventory.DELETE, input),
    "admin:wms-inventory:get": (input: any) => invoke(route_admin_wms_inventory.GET, input),
    "admin:wms-inventory:post": (input: any) => invoke(route_admin_wms_inventory.POST, input),
    "admin:wms-inventory:put": (input: any) => invoke(route_admin_wms_inventory.PUT, input),
    "admin:wms-item-brand/[id]:delete": (input: any) => invoke(route_admin_wms_item_brand__id_.DELETE, input),
    "admin:wms-item-brand/[id]:get": (input: any) => invoke(route_admin_wms_item_brand__id_.GET, input),
    "admin:wms-item-brand/[id]:put": (input: any) => invoke(route_admin_wms_item_brand__id_.PUT, input),
    "admin:wms-item-brand/export:post": (input: any) => invoke(route_admin_wms_item_brand_export.POST, input),
    "admin:wms-item-brand/import-template:get": (input: any) => invoke(route_admin_wms_item_brand_import_template.GET, input),
    "admin:wms-item-brand/import:post": (input: any) => invoke(route_admin_wms_item_brand_import.POST, input),
    "admin:wms-item-brand:delete": (input: any) => invoke(route_admin_wms_item_brand.DELETE, input),
    "admin:wms-item-brand:get": (input: any) => invoke(route_admin_wms_item_brand.GET, input),
    "admin:wms-item-brand:post": (input: any) => invoke(route_admin_wms_item_brand.POST, input),
    "admin:wms-item-brand:put": (input: any) => invoke(route_admin_wms_item_brand.PUT, input),
    "admin:wms-item-category/[id]:delete": (input: any) => invoke(route_admin_wms_item_category__id_.DELETE, input),
    "admin:wms-item-category/[id]:get": (input: any) => invoke(route_admin_wms_item_category__id_.GET, input),
    "admin:wms-item-category/[id]:put": (input: any) => invoke(route_admin_wms_item_category__id_.PUT, input),
    "admin:wms-item-category/export:post": (input: any) => invoke(route_admin_wms_item_category_export.POST, input),
    "admin:wms-item-category/import-template:get": (input: any) => invoke(route_admin_wms_item_category_import_template.GET, input),
    "admin:wms-item-category/import:post": (input: any) => invoke(route_admin_wms_item_category_import.POST, input),
    "admin:wms-item-category:delete": (input: any) => invoke(route_admin_wms_item_category.DELETE, input),
    "admin:wms-item-category:get": (input: any) => invoke(route_admin_wms_item_category.GET, input),
    "admin:wms-item-category:post": (input: any) => invoke(route_admin_wms_item_category.POST, input),
    "admin:wms-item-category:put": (input: any) => invoke(route_admin_wms_item_category.PUT, input),
    "admin:wms-item-sku/[id]:delete": (input: any) => invoke(route_admin_wms_item_sku__id_.DELETE, input),
    "admin:wms-item-sku/[id]:get": (input: any) => invoke(route_admin_wms_item_sku__id_.GET, input),
    "admin:wms-item-sku/[id]:put": (input: any) => invoke(route_admin_wms_item_sku__id_.PUT, input),
    "admin:wms-item-sku/export:post": (input: any) => invoke(route_admin_wms_item_sku_export.POST, input),
    "admin:wms-item-sku/import-template:get": (input: any) => invoke(route_admin_wms_item_sku_import_template.GET, input),
    "admin:wms-item-sku/import:post": (input: any) => invoke(route_admin_wms_item_sku_import.POST, input),
    "admin:wms-item-sku:delete": (input: any) => invoke(route_admin_wms_item_sku.DELETE, input),
    "admin:wms-item-sku:get": (input: any) => invoke(route_admin_wms_item_sku.GET, input),
    "admin:wms-item-sku:post": (input: any) => invoke(route_admin_wms_item_sku.POST, input),
    "admin:wms-item-sku:put": (input: any) => invoke(route_admin_wms_item_sku.PUT, input),
    "admin:wms-item/[id]:delete": (input: any) => invoke(route_admin_wms_item__id_.DELETE, input),
    "admin:wms-item/[id]:get": (input: any) => invoke(route_admin_wms_item__id_.GET, input),
    "admin:wms-item/[id]:put": (input: any) => invoke(route_admin_wms_item__id_.PUT, input),
    "admin:wms-item/export:post": (input: any) => invoke(route_admin_wms_item_export.POST, input),
    "admin:wms-item/import-template:get": (input: any) => invoke(route_admin_wms_item_import_template.GET, input),
    "admin:wms-item/import:post": (input: any) => invoke(route_admin_wms_item_import.POST, input),
    "admin:wms-item:delete": (input: any) => invoke(route_admin_wms_item.DELETE, input),
    "admin:wms-item:get": (input: any) => invoke(route_admin_wms_item.GET, input),
    "admin:wms-item:post": (input: any) => invoke(route_admin_wms_item.POST, input),
    "admin:wms-item:put": (input: any) => invoke(route_admin_wms_item.PUT, input),
    "admin:wms-merchant/[id]:delete": (input: any) => invoke(route_admin_wms_merchant__id_.DELETE, input),
    "admin:wms-merchant/[id]:get": (input: any) => invoke(route_admin_wms_merchant__id_.GET, input),
    "admin:wms-merchant/[id]:put": (input: any) => invoke(route_admin_wms_merchant__id_.PUT, input),
    "admin:wms-merchant/export:post": (input: any) => invoke(route_admin_wms_merchant_export.POST, input),
    "admin:wms-merchant/import-template:get": (input: any) => invoke(route_admin_wms_merchant_import_template.GET, input),
    "admin:wms-merchant/import:post": (input: any) => invoke(route_admin_wms_merchant_import.POST, input),
    "admin:wms-merchant:delete": (input: any) => invoke(route_admin_wms_merchant.DELETE, input),
    "admin:wms-merchant:get": (input: any) => invoke(route_admin_wms_merchant.GET, input),
    "admin:wms-merchant:post": (input: any) => invoke(route_admin_wms_merchant.POST, input),
    "admin:wms-merchant:put": (input: any) => invoke(route_admin_wms_merchant.PUT, input),
    "admin:wms-movement-order-detail/[id]:delete": (input: any) => invoke(route_admin_wms_movement_order_detail__id_.DELETE, input),
    "admin:wms-movement-order-detail/[id]:get": (input: any) => invoke(route_admin_wms_movement_order_detail__id_.GET, input),
    "admin:wms-movement-order-detail/[id]:put": (input: any) => invoke(route_admin_wms_movement_order_detail__id_.PUT, input),
    "admin:wms-movement-order-detail/export:post": (input: any) => invoke(route_admin_wms_movement_order_detail_export.POST, input),
    "admin:wms-movement-order-detail/import-template:get": (input: any) => invoke(route_admin_wms_movement_order_detail_import_template.GET, input),
    "admin:wms-movement-order-detail/import:post": (input: any) => invoke(route_admin_wms_movement_order_detail_import.POST, input),
    "admin:wms-movement-order-detail:delete": (input: any) => invoke(route_admin_wms_movement_order_detail.DELETE, input),
    "admin:wms-movement-order-detail:get": (input: any) => invoke(route_admin_wms_movement_order_detail.GET, input),
    "admin:wms-movement-order-detail:post": (input: any) => invoke(route_admin_wms_movement_order_detail.POST, input),
    "admin:wms-movement-order-detail:put": (input: any) => invoke(route_admin_wms_movement_order_detail.PUT, input),
    "admin:wms-movement-order/[id]:delete": (input: any) => invoke(route_admin_wms_movement_order__id_.DELETE, input),
    "admin:wms-movement-order/[id]:get": (input: any) => invoke(route_admin_wms_movement_order__id_.GET, input),
    "admin:wms-movement-order/[id]:put": (input: any) => invoke(route_admin_wms_movement_order__id_.PUT, input),
    "admin:wms-movement-order/export:post": (input: any) => invoke(route_admin_wms_movement_order_export.POST, input),
    "admin:wms-movement-order/import-template:get": (input: any) => invoke(route_admin_wms_movement_order_import_template.GET, input),
    "admin:wms-movement-order/import:post": (input: any) => invoke(route_admin_wms_movement_order_import.POST, input),
    "admin:wms-movement-order:delete": (input: any) => invoke(route_admin_wms_movement_order.DELETE, input),
    "admin:wms-movement-order:get": (input: any) => invoke(route_admin_wms_movement_order.GET, input),
    "admin:wms-movement-order:post": (input: any) => invoke(route_admin_wms_movement_order.POST, input),
    "admin:wms-movement-order:put": (input: any) => invoke(route_admin_wms_movement_order.PUT, input),
    "admin:wms-receipt-order-detail/[id]:delete": (input: any) => invoke(route_admin_wms_receipt_order_detail__id_.DELETE, input),
    "admin:wms-receipt-order-detail/[id]:get": (input: any) => invoke(route_admin_wms_receipt_order_detail__id_.GET, input),
    "admin:wms-receipt-order-detail/[id]:put": (input: any) => invoke(route_admin_wms_receipt_order_detail__id_.PUT, input),
    "admin:wms-receipt-order-detail/export:post": (input: any) => invoke(route_admin_wms_receipt_order_detail_export.POST, input),
    "admin:wms-receipt-order-detail/import-template:get": (input: any) => invoke(route_admin_wms_receipt_order_detail_import_template.GET, input),
    "admin:wms-receipt-order-detail/import:post": (input: any) => invoke(route_admin_wms_receipt_order_detail_import.POST, input),
    "admin:wms-receipt-order-detail:delete": (input: any) => invoke(route_admin_wms_receipt_order_detail.DELETE, input),
    "admin:wms-receipt-order-detail:get": (input: any) => invoke(route_admin_wms_receipt_order_detail.GET, input),
    "admin:wms-receipt-order-detail:post": (input: any) => invoke(route_admin_wms_receipt_order_detail.POST, input),
    "admin:wms-receipt-order-detail:put": (input: any) => invoke(route_admin_wms_receipt_order_detail.PUT, input),
    "admin:wms-receipt-order/[id]:delete": (input: any) => invoke(route_admin_wms_receipt_order__id_.DELETE, input),
    "admin:wms-receipt-order/[id]:get": (input: any) => invoke(route_admin_wms_receipt_order__id_.GET, input),
    "admin:wms-receipt-order/[id]:put": (input: any) => invoke(route_admin_wms_receipt_order__id_.PUT, input),
    "admin:wms-receipt-order/export:post": (input: any) => invoke(route_admin_wms_receipt_order_export.POST, input),
    "admin:wms-receipt-order/import-template:get": (input: any) => invoke(route_admin_wms_receipt_order_import_template.GET, input),
    "admin:wms-receipt-order/import:post": (input: any) => invoke(route_admin_wms_receipt_order_import.POST, input),
    "admin:wms-receipt-order:delete": (input: any) => invoke(route_admin_wms_receipt_order.DELETE, input),
    "admin:wms-receipt-order:get": (input: any) => invoke(route_admin_wms_receipt_order.GET, input),
    "admin:wms-receipt-order:post": (input: any) => invoke(route_admin_wms_receipt_order.POST, input),
    "admin:wms-receipt-order:put": (input: any) => invoke(route_admin_wms_receipt_order.PUT, input),
    "admin:wms-shipment-order-detail/[id]:delete": (input: any) => invoke(route_admin_wms_shipment_order_detail__id_.DELETE, input),
    "admin:wms-shipment-order-detail/[id]:get": (input: any) => invoke(route_admin_wms_shipment_order_detail__id_.GET, input),
    "admin:wms-shipment-order-detail/[id]:put": (input: any) => invoke(route_admin_wms_shipment_order_detail__id_.PUT, input),
    "admin:wms-shipment-order-detail/export:post": (input: any) => invoke(route_admin_wms_shipment_order_detail_export.POST, input),
    "admin:wms-shipment-order-detail/import-template:get": (input: any) => invoke(route_admin_wms_shipment_order_detail_import_template.GET, input),
    "admin:wms-shipment-order-detail/import:post": (input: any) => invoke(route_admin_wms_shipment_order_detail_import.POST, input),
    "admin:wms-shipment-order-detail:delete": (input: any) => invoke(route_admin_wms_shipment_order_detail.DELETE, input),
    "admin:wms-shipment-order-detail:get": (input: any) => invoke(route_admin_wms_shipment_order_detail.GET, input),
    "admin:wms-shipment-order-detail:post": (input: any) => invoke(route_admin_wms_shipment_order_detail.POST, input),
    "admin:wms-shipment-order-detail:put": (input: any) => invoke(route_admin_wms_shipment_order_detail.PUT, input),
    "admin:wms-shipment-order/[id]:delete": (input: any) => invoke(route_admin_wms_shipment_order__id_.DELETE, input),
    "admin:wms-shipment-order/[id]:get": (input: any) => invoke(route_admin_wms_shipment_order__id_.GET, input),
    "admin:wms-shipment-order/[id]:put": (input: any) => invoke(route_admin_wms_shipment_order__id_.PUT, input),
    "admin:wms-shipment-order/export:post": (input: any) => invoke(route_admin_wms_shipment_order_export.POST, input),
    "admin:wms-shipment-order/import-template:get": (input: any) => invoke(route_admin_wms_shipment_order_import_template.GET, input),
    "admin:wms-shipment-order/import:post": (input: any) => invoke(route_admin_wms_shipment_order_import.POST, input),
    "admin:wms-shipment-order:delete": (input: any) => invoke(route_admin_wms_shipment_order.DELETE, input),
    "admin:wms-shipment-order:get": (input: any) => invoke(route_admin_wms_shipment_order.GET, input),
    "admin:wms-shipment-order:post": (input: any) => invoke(route_admin_wms_shipment_order.POST, input),
    "admin:wms-shipment-order:put": (input: any) => invoke(route_admin_wms_shipment_order.PUT, input),
    "admin:wms-warehouse/[id]:delete": (input: any) => invoke(route_admin_wms_warehouse__id_.DELETE, input),
    "admin:wms-warehouse/[id]:get": (input: any) => invoke(route_admin_wms_warehouse__id_.GET, input),
    "admin:wms-warehouse/[id]:put": (input: any) => invoke(route_admin_wms_warehouse__id_.PUT, input),
    "admin:wms-warehouse/export:post": (input: any) => invoke(route_admin_wms_warehouse_export.POST, input),
    "admin:wms-warehouse/import-template:get": (input: any) => invoke(route_admin_wms_warehouse_import_template.GET, input),
    "admin:wms-warehouse/import:post": (input: any) => invoke(route_admin_wms_warehouse_import.POST, input),
    "admin:wms-warehouse:delete": (input: any) => invoke(route_admin_wms_warehouse.DELETE, input),
    "admin:wms-warehouse:get": (input: any) => invoke(route_admin_wms_warehouse.GET, input),
    "admin:wms-warehouse:post": (input: any) => invoke(route_admin_wms_warehouse.POST, input),
    "admin:wms-warehouse:put": (input: any) => invoke(route_admin_wms_warehouse.PUT, input),
  },
})
