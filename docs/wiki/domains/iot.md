# 领域百科：iot (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-iot/`](../../packages/plugins/plugin-iot)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3224 | **上游环境变量**：`COOLIEBASE_DOMAIN_IOT_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/iot`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`5000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [iot.facade.ts](../../packages/plugins/plugin-iot/contract/iot.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listDevices`
- `createDevice`
- `listAlerts`
- `handleAlert`

---

## 三、 Agent 自动化实体与契约清单 (15 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `IotAlertConfig` | IoT 告警配置 | `/admin/iot/iot-alert-config` | `iot:iot_alert_config` | [`iot-alert-config.agent.json`](../../packages/plugins/plugin-iot/agent/iot-alert-config.agent.json) |
| `IotAlertRecord` | IoT 告警记录 | `/admin/iot/iot-alert-record` | `iot:iot_alert_record` | [`iot-alert-record.agent.json`](../../packages/plugins/plugin-iot/agent/iot-alert-record.agent.json) |
| `IotDataRule` | IoT 数据流转规则 DO监听 数据源，转发到 数据目的 | `/admin/iot/iot-data-rule` | `iot:iot_data_rule` | [`iot-data-rule.agent.json`](../../packages/plugins/plugin-iot/agent/iot-data-rule.agent.json) |
| `IotDataSink` | IoT 数据流转目的 | `/admin/iot/iot-data-sink` | `iot:iot_data_sink` | [`iot-data-sink.agent.json`](../../packages/plugins/plugin-iot/agent/iot-data-sink.agent.json) |
| `IotDevice` | IoT 设备 | `/admin/iot/iot-device` | `iot:iot_device` | [`iot-device.agent.json`](../../packages/plugins/plugin-iot/agent/iot-device.agent.json) |
| `IotDeviceGroup` | IoT 设备分组 | `/admin/iot/iot-device-group` | `iot:iot_device_group` | [`iot-device-group.agent.json`](../../packages/plugins/plugin-iot/agent/iot-device-group.agent.json) |
| `IotDeviceModbusConfig` | IoT 设备 Modbus 连接配置 | `/admin/iot/iot-device-modbus-config` | `iot:iot_device_modbus_config` | [`iot-device-modbus-config.agent.json`](../../packages/plugins/plugin-iot/agent/iot-device-modbus-config.agent.json) |
| `IotDeviceModbusPoint` | IoT 设备 Modbus 点位配置 | `/admin/iot/iot-device-modbus-point` | `iot:iot_device_modbus_point` | [`iot-device-modbus-point.agent.json`](../../packages/plugins/plugin-iot/agent/iot-device-modbus-point.agent.json) |
| `IotOtaFirmware` | IoT OTA 固件 | `/admin/iot/iot-ota-firmware` | `iot:iot_ota_firmware` | [`iot-ota-firmware.agent.json`](../../packages/plugins/plugin-iot/agent/iot-ota-firmware.agent.json) |
| `IotOtaTask` | IoT OTA 升级任务 | `/admin/iot/iot-ota-task` | `iot:iot_ota_task` | [`iot-ota-task.agent.json`](../../packages/plugins/plugin-iot/agent/iot-ota-task.agent.json) |
| `IotOtaTaskRecord` | IoT OTA 升级任务记录 | `/admin/iot/iot-ota-task-record` | `iot:iot_ota_task_record` | [`iot-ota-task-record.agent.json`](../../packages/plugins/plugin-iot/agent/iot-ota-task-record.agent.json) |
| `IotProduct` | IoT 产品 | `/admin/iot/iot-product` | `iot:iot_product` | [`iot-product.agent.json`](../../packages/plugins/plugin-iot/agent/iot-product.agent.json) |
| `IotProductCategory` | IoT 产品分类 | `/admin/iot/iot-product-category` | `iot:iot_product_category` | [`iot-product-category.agent.json`](../../packages/plugins/plugin-iot/agent/iot-product-category.agent.json) |
| `IotSceneRule` | IoT 场景联动规则 | `/admin/iot/iot-scene-rule` | `iot:iot_scene_rule` | [`iot-scene-rule.agent.json`](../../packages/plugins/plugin-iot/agent/iot-scene-rule.agent.json) |
| `IotThingModel` | IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服 | `/admin/iot/iot-thing-model` | `iot:iot_thing_model` | [`iot-thing-model.agent.json`](../../packages/plugins/plugin-iot/agent/iot-thing-model.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-iot/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-iot/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-iot/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
