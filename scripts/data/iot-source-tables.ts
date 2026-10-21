// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const IOT_TABLES: CodegenConfig[] = [
  {
    "moduleName": "iot",
    "className": "IotAlertConfig",
    "businessName": "IoT 告警配置",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_alert_config",
    "table": {
      "name": "iot_alert_config",
      "comment": "IoT 告警配置",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "配置编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "配置名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "配置描述",
          "nullableInferred": true
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "配置状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "配置状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "scene_rule_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "关联的场景联动规则编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receive_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "接收的用户编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receive_types",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "接收的类型数组",
          "nullableInferred": true
        },
        {
          "name": "sms_template_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "短信模板编号",
          "nullableInferred": true
        },
        {
          "name": "mail_template_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "邮件模板编号",
          "nullableInferred": true
        },
        {
          "name": "notify_template_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "站内信模板编号",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotAlertRecord",
    "businessName": "IoT 告警记录",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_alert_record",
    "table": {
      "name": "iot_alert_record",
      "comment": "IoT 告警记录",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "记录编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "config_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "告警名称",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "config_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "告警名称",
          "nullableInferred": true
        },
        {
          "name": "config_level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "告警级别",
          "nullableInferred": true
        },
        {
          "name": "scene_rule_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "场景规则编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "触发的设备消息",
          "nullableInferred": true
        },
        {
          "name": "process_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否处理",
          "nullableInferred": true
        },
        {
          "name": "process_remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处理结果（备注）",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotDataRule",
    "businessName": "IoT 数据流转规则 DO监听 数据源，转发到 数据目的",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_data_rule",
    "table": {
      "name": "iot_data_rule",
      "comment": "IoT 数据流转规则 DO监听 数据源，转发到 数据目的",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "数据流转规格编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据流转规格名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据流转规格描述",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数据流转规格状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_configs",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "数据源配置数组",
          "nullableInferred": true
        },
        {
          "name": "sink_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "数据目的编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "method",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息方法",
          "nullableInferred": true
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "identifier",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标识符",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotDataSink",
    "businessName": "IoT 数据流转目的",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_data_sink",
    "table": {
      "name": "iot_data_sink",
      "comment": "IoT 数据流转目的",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "数据流转目的编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据流转目的名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据流转目的描述",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数据流转目的状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数据流转目的类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "config",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据流转目的配置",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotDevice",
    "businessName": "IoT 设备",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_device",
    "table": {
      "name": "iot_device",
      "comment": "IoT 设备",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "设备 ID，主键，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "device_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备名称，在产品内唯一，用于标识设备",
          "nullableInferred": true
        },
        {
          "name": "nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备备注名称",
          "nullableInferred": true
        },
        {
          "name": "serial_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备序列号",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备图片",
          "nullableInferred": true
        },
        {
          "name": "group_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "设备分组编号集合",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品标识",
          "nullableInferred": true
        },
        {
          "name": "device_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备类型",
          "nullableInferred": true
        },
        {
          "name": "gateway_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "网关设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "state",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "online_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后上线时间",
          "nullableInferred": true
        },
        {
          "name": "offline_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后离线时间",
          "nullableInferred": true
        },
        {
          "name": "active_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "设备激活时间",
          "nullableInferred": true
        },
        {
          "name": "firmware_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_secret",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备密钥，用于设备认证",
          "nullableInferred": true
        },
        {
          "name": "latitude",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "设备位置的纬度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "longitude",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "设备位置的经度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "config",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备配置",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotDeviceGroup",
    "businessName": "IoT 设备分组",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_device_group",
    "table": {
      "name": "iot_device_group",
      "comment": "IoT 设备分组",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "分组 ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分组名字",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分组状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分组描述",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotDeviceModbusConfig",
    "businessName": "IoT 设备 Modbus 连接配置",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_device_modbus_config",
    "table": {
      "name": "iot_device_modbus_config",
      "comment": "IoT 设备 Modbus 连接配置",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "主键",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "Modbus 服务器 IP 地址",
          "nullableInferred": true
        },
        {
          "name": "port",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "Modbus 服务器端口",
          "nullableInferred": true
        },
        {
          "name": "slave_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "从站地址",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "timeout",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "连接超时时间，单位：毫秒",
          "nullableInferred": true
        },
        {
          "name": "retry_interval",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "重试间隔，单位：毫秒",
          "nullableInferred": true
        },
        {
          "name": "mode",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "模式",
          "nullableInferred": true
        },
        {
          "name": "frame_format",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数据帧格式",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotDeviceModbusPoint",
    "businessName": "IoT 设备 Modbus 点位配置",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_device_modbus_point",
    "table": {
      "name": "iot_device_modbus_point",
      "comment": "IoT 设备 Modbus 点位配置",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "主键",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "device_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "thing_model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物模型属性编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "identifier",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性标识符",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "function_code",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "Modbus 功能码",
          "nullableInferred": true
        },
        {
          "name": "register_address",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "寄存器起始地址",
          "nullableInferred": true
        },
        {
          "name": "register_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "寄存器数量",
          "nullableInferred": true
        },
        {
          "name": "byte_order",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "字节序",
          "nullableInferred": true
        },
        {
          "name": "raw_data_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "原始数据类型",
          "nullableInferred": true
        },
        {
          "name": "scale",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "缩放因子",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "poll_interval",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轮询间隔（毫秒）",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotOtaFirmware",
    "businessName": "IoT OTA 固件",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_ota_firmware",
    "table": {
      "name": "iot_ota_firmware",
      "comment": "IoT OTA 固件",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "固件编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件描述",
          "nullableInferred": true
        },
        {
          "name": "version",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "版本号",
          "nullableInferred": true
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件文件 URL",
          "nullableInferred": true
        },
        {
          "name": "file_size",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "固件文件大小",
          "nullableInferred": true
        },
        {
          "name": "file_digest_algorithm",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件文件签名算法",
          "nullableInferred": true
        },
        {
          "name": "file_digest_value",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件文件签名结果",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotOtaTask",
    "businessName": "IoT OTA 升级任务",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_ota_task",
    "table": {
      "name": "iot_ota_task",
      "comment": "IoT OTA 升级任务",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "任务编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务描述",
          "nullableInferred": true
        },
        {
          "name": "firmware_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "任务状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_scope",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备升级范围",
          "nullableInferred": true
        },
        {
          "name": "device_total_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备总数数量",
          "nullableInferred": true
        },
        {
          "name": "device_success_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备成功数量",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotOtaTaskRecord",
    "businessName": "IoT OTA 升级任务记录",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_ota_task_record",
    "table": {
      "name": "iot_ota_task_record",
      "comment": "IoT OTA 升级任务记录",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "升级记录编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "firmware_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固件编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "from_firmware_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源的固件编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "升级状态",
          "nullableInferred": true,
          "queryType": "=",
          "dictType": "iot_ota_task_record_status"
        },
        {
          "name": "progress",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "升级进度，百分比",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "升级进度描述",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotProduct",
    "businessName": "IoT 产品",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_product",
    "table": {
      "name": "iot_product",
      "comment": "IoT 产品",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "产品 ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "product_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品标识",
          "nullableInferred": true
        },
        {
          "name": "product_secret",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品密钥，用于一型一密动态注册",
          "nullableInferred": true
        },
        {
          "name": "register_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否开启动态注册",
          "nullableInferred": true
        },
        {
          "name": "category_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品分类编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "icon",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品图标",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品图片",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品描述",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "产品状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备类型",
          "nullableInferred": true
        },
        {
          "name": "net_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "联网方式",
          "nullableInferred": true
        },
        {
          "name": "protocol_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "协议类型",
          "nullableInferred": true
        },
        {
          "name": "serialize_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "序列化类型",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotProductCategory",
    "businessName": "IoT 产品分类",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_product_category",
    "table": {
      "name": "iot_product_category",
      "comment": "IoT 产品分类",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "分类 ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类名字",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分类排序",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分类状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类描述",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotSceneRule",
    "businessName": "IoT 场景联动规则",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_scene_rule",
    "table": {
      "name": "iot_scene_rule",
      "comment": "IoT 场景联动规则",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "场景联动编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "场景联动名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "场景联动描述",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "场景联动状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "last_trigger_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后触发时间",
          "nullableInferred": true
        },
        {
          "name": "triggers",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "场景定义配置",
          "nullableInferred": true
        },
        {
          "name": "actions",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "场景动作配置",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "场景事件类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "device_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "identifier",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物模型标识符",
          "nullableInferred": true
        },
        {
          "name": "operator",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "操作符",
          "nullableInferred": true
        },
        {
          "name": "value",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "参数（属性值、在线状态）",
          "nullableInferred": true
        },
        {
          "name": "cron_expression",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "CRON 表达式",
          "nullableInferred": true
        },
        {
          "name": "condition_groups",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "触发条件分组（状态条件分组）的数组",
          "nullableInferred": true
        },
        {
          "name": "param",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "参数",
          "nullableInferred": true
        },
        {
          "name": "params",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "请求参数",
          "nullableInferred": true
        },
        {
          "name": "alert_config_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "告警配置编号",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "iot",
    "className": "IotThingModel",
    "businessName": "IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服",
    "parentMenuId": "iot-dir",
    "permissionPrefix": "iot:iot_thing_model",
    "table": {
      "name": "iot_thing_model",
      "comment": "IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "物模型功能编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "identifier",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "功能标识",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "功能名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "功能描述",
          "nullableInferred": true
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品标识",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品标识",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "功能类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "property",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性",
          "nullableInferred": true
        },
        {
          "name": "event",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "事件",
          "nullableInferred": true
        },
        {
          "name": "service",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "服务",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  }
]
