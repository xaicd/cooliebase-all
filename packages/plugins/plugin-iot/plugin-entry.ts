/**
 * iot 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。
 *
 * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被
 * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），
 * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。
 *
 * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,
 * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

import * as route_admin_alerts from "@/modules/iot/routes/admin/alerts/route"
import * as route_admin_alerts__id_ from "@/modules/iot/routes/admin/alerts/[id]/route"
import * as route_admin_devices from "@/modules/iot/routes/admin/devices/route"
import * as route_admin_devices__id_ from "@/modules/iot/routes/admin/devices/[id]/route"
import * as route_admin_iot_alert_config from "@/modules/iot/routes/admin/iot-alert-config/route"
import * as route_admin_iot_alert_config__id_ from "@/modules/iot/routes/admin/iot-alert-config/[id]/route"
import * as route_admin_iot_alert_record from "@/modules/iot/routes/admin/iot-alert-record/route"
import * as route_admin_iot_alert_record__id_ from "@/modules/iot/routes/admin/iot-alert-record/[id]/route"
import * as route_admin_iot_data_rule from "@/modules/iot/routes/admin/iot-data-rule/route"
import * as route_admin_iot_data_rule__id_ from "@/modules/iot/routes/admin/iot-data-rule/[id]/route"
import * as route_admin_iot_data_sink from "@/modules/iot/routes/admin/iot-data-sink/route"
import * as route_admin_iot_data_sink__id_ from "@/modules/iot/routes/admin/iot-data-sink/[id]/route"
import * as route_admin_iot_device from "@/modules/iot/routes/admin/iot-device/route"
import * as route_admin_iot_device__id_ from "@/modules/iot/routes/admin/iot-device/[id]/route"
import * as route_admin_iot_device_group from "@/modules/iot/routes/admin/iot-device-group/route"
import * as route_admin_iot_device_group__id_ from "@/modules/iot/routes/admin/iot-device-group/[id]/route"
import * as route_admin_iot_device_message from "@/modules/iot/routes/admin/iot-device-message/route"
import * as route_admin_iot_device_message__id_ from "@/modules/iot/routes/admin/iot-device-message/[id]/route"
import * as route_admin_iot_device_modbus_config from "@/modules/iot/routes/admin/iot-device-modbus-config/route"
import * as route_admin_iot_device_modbus_config__id_ from "@/modules/iot/routes/admin/iot-device-modbus-config/[id]/route"
import * as route_admin_iot_device_modbus_point from "@/modules/iot/routes/admin/iot-device-modbus-point/route"
import * as route_admin_iot_device_modbus_point__id_ from "@/modules/iot/routes/admin/iot-device-modbus-point/[id]/route"
import * as route_admin_iot_device_property from "@/modules/iot/routes/admin/iot-device-property/route"
import * as route_admin_iot_device_property__id_ from "@/modules/iot/routes/admin/iot-device-property/[id]/route"
import * as route_admin_iot_ota_firmware from "@/modules/iot/routes/admin/iot-ota-firmware/route"
import * as route_admin_iot_ota_firmware__id_ from "@/modules/iot/routes/admin/iot-ota-firmware/[id]/route"
import * as route_admin_iot_ota_task from "@/modules/iot/routes/admin/iot-ota-task/route"
import * as route_admin_iot_ota_task__id_ from "@/modules/iot/routes/admin/iot-ota-task/[id]/route"
import * as route_admin_iot_ota_task_record from "@/modules/iot/routes/admin/iot-ota-task-record/route"
import * as route_admin_iot_ota_task_record__id_ from "@/modules/iot/routes/admin/iot-ota-task-record/[id]/route"
import * as route_admin_iot_product from "@/modules/iot/routes/admin/iot-product/route"
import * as route_admin_iot_product__id_ from "@/modules/iot/routes/admin/iot-product/[id]/route"
import * as route_admin_iot_product_category from "@/modules/iot/routes/admin/iot-product-category/route"
import * as route_admin_iot_product_category__id_ from "@/modules/iot/routes/admin/iot-product-category/[id]/route"
import * as route_admin_iot_scene_rule from "@/modules/iot/routes/admin/iot-scene-rule/route"
import * as route_admin_iot_scene_rule__id_ from "@/modules/iot/routes/admin/iot-scene-rule/[id]/route"
import * as route_admin_iot_statistics from "@/modules/iot/routes/admin/iot-statistics/route"
import * as route_admin_iot_statistics__id_ from "@/modules/iot/routes/admin/iot-statistics/[id]/route"
import * as route_admin_iot_thing_model from "@/modules/iot/routes/admin/iot-thing-model/route"
import * as route_admin_iot_thing_model__id_ from "@/modules/iot/routes/admin/iot-thing-model/[id]/route"

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
    "admin:alerts/[id]:delete": (input: any) => invoke(route_admin_alerts__id_.DELETE, input),
    "admin:alerts/[id]:get": (input: any) => invoke(route_admin_alerts__id_.GET, input),
    "admin:alerts/[id]:put": (input: any) => invoke(route_admin_alerts__id_.PUT, input),
    "admin:alerts:get": (input: any) => invoke(route_admin_alerts.GET, input),
    "admin:alerts:post": (input: any) => invoke(route_admin_alerts.POST, input),
    "admin:devices/[id]:delete": (input: any) => invoke(route_admin_devices__id_.DELETE, input),
    "admin:devices/[id]:get": (input: any) => invoke(route_admin_devices__id_.GET, input),
    "admin:devices/[id]:put": (input: any) => invoke(route_admin_devices__id_.PUT, input),
    "admin:devices:get": (input: any) => invoke(route_admin_devices.GET, input),
    "admin:devices:post": (input: any) => invoke(route_admin_devices.POST, input),
    "admin:iot-alert-config/[id]:delete": (input: any) => invoke(route_admin_iot_alert_config__id_.DELETE, input),
    "admin:iot-alert-config/[id]:get": (input: any) => invoke(route_admin_iot_alert_config__id_.GET, input),
    "admin:iot-alert-config/[id]:put": (input: any) => invoke(route_admin_iot_alert_config__id_.PUT, input),
    "admin:iot-alert-config:get": (input: any) => invoke(route_admin_iot_alert_config.GET, input),
    "admin:iot-alert-config:post": (input: any) => invoke(route_admin_iot_alert_config.POST, input),
    "admin:iot-alert-record/[id]:delete": (input: any) => invoke(route_admin_iot_alert_record__id_.DELETE, input),
    "admin:iot-alert-record/[id]:get": (input: any) => invoke(route_admin_iot_alert_record__id_.GET, input),
    "admin:iot-alert-record/[id]:put": (input: any) => invoke(route_admin_iot_alert_record__id_.PUT, input),
    "admin:iot-alert-record:get": (input: any) => invoke(route_admin_iot_alert_record.GET, input),
    "admin:iot-alert-record:post": (input: any) => invoke(route_admin_iot_alert_record.POST, input),
    "admin:iot-data-rule/[id]:delete": (input: any) => invoke(route_admin_iot_data_rule__id_.DELETE, input),
    "admin:iot-data-rule/[id]:get": (input: any) => invoke(route_admin_iot_data_rule__id_.GET, input),
    "admin:iot-data-rule/[id]:put": (input: any) => invoke(route_admin_iot_data_rule__id_.PUT, input),
    "admin:iot-data-rule:get": (input: any) => invoke(route_admin_iot_data_rule.GET, input),
    "admin:iot-data-rule:post": (input: any) => invoke(route_admin_iot_data_rule.POST, input),
    "admin:iot-data-sink/[id]:delete": (input: any) => invoke(route_admin_iot_data_sink__id_.DELETE, input),
    "admin:iot-data-sink/[id]:get": (input: any) => invoke(route_admin_iot_data_sink__id_.GET, input),
    "admin:iot-data-sink/[id]:put": (input: any) => invoke(route_admin_iot_data_sink__id_.PUT, input),
    "admin:iot-data-sink:get": (input: any) => invoke(route_admin_iot_data_sink.GET, input),
    "admin:iot-data-sink:post": (input: any) => invoke(route_admin_iot_data_sink.POST, input),
    "admin:iot-device-group/[id]:delete": (input: any) => invoke(route_admin_iot_device_group__id_.DELETE, input),
    "admin:iot-device-group/[id]:get": (input: any) => invoke(route_admin_iot_device_group__id_.GET, input),
    "admin:iot-device-group/[id]:put": (input: any) => invoke(route_admin_iot_device_group__id_.PUT, input),
    "admin:iot-device-group:get": (input: any) => invoke(route_admin_iot_device_group.GET, input),
    "admin:iot-device-group:post": (input: any) => invoke(route_admin_iot_device_group.POST, input),
    "admin:iot-device-message/[id]:delete": (input: any) => invoke(route_admin_iot_device_message__id_.DELETE, input),
    "admin:iot-device-message/[id]:get": (input: any) => invoke(route_admin_iot_device_message__id_.GET, input),
    "admin:iot-device-message/[id]:put": (input: any) => invoke(route_admin_iot_device_message__id_.PUT, input),
    "admin:iot-device-message:get": (input: any) => invoke(route_admin_iot_device_message.GET, input),
    "admin:iot-device-message:post": (input: any) => invoke(route_admin_iot_device_message.POST, input),
    "admin:iot-device-modbus-config/[id]:delete": (input: any) => invoke(route_admin_iot_device_modbus_config__id_.DELETE, input),
    "admin:iot-device-modbus-config/[id]:get": (input: any) => invoke(route_admin_iot_device_modbus_config__id_.GET, input),
    "admin:iot-device-modbus-config/[id]:put": (input: any) => invoke(route_admin_iot_device_modbus_config__id_.PUT, input),
    "admin:iot-device-modbus-config:get": (input: any) => invoke(route_admin_iot_device_modbus_config.GET, input),
    "admin:iot-device-modbus-config:post": (input: any) => invoke(route_admin_iot_device_modbus_config.POST, input),
    "admin:iot-device-modbus-point/[id]:delete": (input: any) => invoke(route_admin_iot_device_modbus_point__id_.DELETE, input),
    "admin:iot-device-modbus-point/[id]:get": (input: any) => invoke(route_admin_iot_device_modbus_point__id_.GET, input),
    "admin:iot-device-modbus-point/[id]:put": (input: any) => invoke(route_admin_iot_device_modbus_point__id_.PUT, input),
    "admin:iot-device-modbus-point:get": (input: any) => invoke(route_admin_iot_device_modbus_point.GET, input),
    "admin:iot-device-modbus-point:post": (input: any) => invoke(route_admin_iot_device_modbus_point.POST, input),
    "admin:iot-device-property/[id]:delete": (input: any) => invoke(route_admin_iot_device_property__id_.DELETE, input),
    "admin:iot-device-property/[id]:get": (input: any) => invoke(route_admin_iot_device_property__id_.GET, input),
    "admin:iot-device-property/[id]:put": (input: any) => invoke(route_admin_iot_device_property__id_.PUT, input),
    "admin:iot-device-property:get": (input: any) => invoke(route_admin_iot_device_property.GET, input),
    "admin:iot-device-property:post": (input: any) => invoke(route_admin_iot_device_property.POST, input),
    "admin:iot-device/[id]:delete": (input: any) => invoke(route_admin_iot_device__id_.DELETE, input),
    "admin:iot-device/[id]:get": (input: any) => invoke(route_admin_iot_device__id_.GET, input),
    "admin:iot-device/[id]:put": (input: any) => invoke(route_admin_iot_device__id_.PUT, input),
    "admin:iot-device:get": (input: any) => invoke(route_admin_iot_device.GET, input),
    "admin:iot-device:post": (input: any) => invoke(route_admin_iot_device.POST, input),
    "admin:iot-ota-firmware/[id]:delete": (input: any) => invoke(route_admin_iot_ota_firmware__id_.DELETE, input),
    "admin:iot-ota-firmware/[id]:get": (input: any) => invoke(route_admin_iot_ota_firmware__id_.GET, input),
    "admin:iot-ota-firmware/[id]:put": (input: any) => invoke(route_admin_iot_ota_firmware__id_.PUT, input),
    "admin:iot-ota-firmware:get": (input: any) => invoke(route_admin_iot_ota_firmware.GET, input),
    "admin:iot-ota-firmware:post": (input: any) => invoke(route_admin_iot_ota_firmware.POST, input),
    "admin:iot-ota-task-record/[id]:delete": (input: any) => invoke(route_admin_iot_ota_task_record__id_.DELETE, input),
    "admin:iot-ota-task-record/[id]:get": (input: any) => invoke(route_admin_iot_ota_task_record__id_.GET, input),
    "admin:iot-ota-task-record/[id]:put": (input: any) => invoke(route_admin_iot_ota_task_record__id_.PUT, input),
    "admin:iot-ota-task-record:get": (input: any) => invoke(route_admin_iot_ota_task_record.GET, input),
    "admin:iot-ota-task-record:post": (input: any) => invoke(route_admin_iot_ota_task_record.POST, input),
    "admin:iot-ota-task/[id]:delete": (input: any) => invoke(route_admin_iot_ota_task__id_.DELETE, input),
    "admin:iot-ota-task/[id]:get": (input: any) => invoke(route_admin_iot_ota_task__id_.GET, input),
    "admin:iot-ota-task/[id]:put": (input: any) => invoke(route_admin_iot_ota_task__id_.PUT, input),
    "admin:iot-ota-task:get": (input: any) => invoke(route_admin_iot_ota_task.GET, input),
    "admin:iot-ota-task:post": (input: any) => invoke(route_admin_iot_ota_task.POST, input),
    "admin:iot-product-category/[id]:delete": (input: any) => invoke(route_admin_iot_product_category__id_.DELETE, input),
    "admin:iot-product-category/[id]:get": (input: any) => invoke(route_admin_iot_product_category__id_.GET, input),
    "admin:iot-product-category/[id]:put": (input: any) => invoke(route_admin_iot_product_category__id_.PUT, input),
    "admin:iot-product-category:get": (input: any) => invoke(route_admin_iot_product_category.GET, input),
    "admin:iot-product-category:post": (input: any) => invoke(route_admin_iot_product_category.POST, input),
    "admin:iot-product/[id]:delete": (input: any) => invoke(route_admin_iot_product__id_.DELETE, input),
    "admin:iot-product/[id]:get": (input: any) => invoke(route_admin_iot_product__id_.GET, input),
    "admin:iot-product/[id]:put": (input: any) => invoke(route_admin_iot_product__id_.PUT, input),
    "admin:iot-product:get": (input: any) => invoke(route_admin_iot_product.GET, input),
    "admin:iot-product:post": (input: any) => invoke(route_admin_iot_product.POST, input),
    "admin:iot-scene-rule/[id]:delete": (input: any) => invoke(route_admin_iot_scene_rule__id_.DELETE, input),
    "admin:iot-scene-rule/[id]:get": (input: any) => invoke(route_admin_iot_scene_rule__id_.GET, input),
    "admin:iot-scene-rule/[id]:put": (input: any) => invoke(route_admin_iot_scene_rule__id_.PUT, input),
    "admin:iot-scene-rule:get": (input: any) => invoke(route_admin_iot_scene_rule.GET, input),
    "admin:iot-scene-rule:post": (input: any) => invoke(route_admin_iot_scene_rule.POST, input),
    "admin:iot-statistics/[id]:delete": (input: any) => invoke(route_admin_iot_statistics__id_.DELETE, input),
    "admin:iot-statistics/[id]:get": (input: any) => invoke(route_admin_iot_statistics__id_.GET, input),
    "admin:iot-statistics/[id]:put": (input: any) => invoke(route_admin_iot_statistics__id_.PUT, input),
    "admin:iot-statistics:get": (input: any) => invoke(route_admin_iot_statistics.GET, input),
    "admin:iot-statistics:post": (input: any) => invoke(route_admin_iot_statistics.POST, input),
    "admin:iot-thing-model/[id]:delete": (input: any) => invoke(route_admin_iot_thing_model__id_.DELETE, input),
    "admin:iot-thing-model/[id]:get": (input: any) => invoke(route_admin_iot_thing_model__id_.GET, input),
    "admin:iot-thing-model/[id]:put": (input: any) => invoke(route_admin_iot_thing_model__id_.PUT, input),
    "admin:iot-thing-model:get": (input: any) => invoke(route_admin_iot_thing_model.GET, input),
    "admin:iot-thing-model:post": (input: any) => invoke(route_admin_iot_thing_model.POST, input),
  },
})
