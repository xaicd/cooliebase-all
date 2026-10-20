// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const PAY_TABLES: CodegenConfig[] = [
  {
    "moduleName": "pay",
    "className": "PayApp",
    "businessName": "支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_app",
    "table": {
      "name": "pay_app",
      "comment": "支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "应用编号，数据库自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "app_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用标识",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用名",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "order_notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付结果的回调地址",
          "nullableInferred": true
        },
        {
          "name": "refund_notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退款结果的回调地址",
          "nullableInferred": true
        },
        {
          "name": "transfer_notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账结果的回调地址",
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
    "moduleName": "pay",
    "className": "PayChannel",
    "businessName": "支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_channel",
    "table": {
      "name": "pay_channel",
      "comment": "支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "渠道编号，数据库自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "fee_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "渠道费率，单位：百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "config",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付渠道配置",
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
    "moduleName": "pay",
    "className": "PayDemoOrder",
    "businessName": "示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_demo_order",
    "table": {
      "name": "pay_demo_order",
      "comment": "示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "订单编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品名称",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "价格，单位：分",
          "nullableInferred": true
        },
        {
          "name": "pay_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否支付",
          "nullableInferred": true
        },
        {
          "name": "pay_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pay_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "付款时间",
          "nullableInferred": true
        },
        {
          "name": "pay_channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付渠道",
          "nullableInferred": true
        },
        {
          "name": "pay_refund_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付退款单号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "refund_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退款完成时间",
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
    "moduleName": "pay",
    "className": "PayDemoWithdraw",
    "businessName": "示例提现订单演示业务系统的转账业务",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_demo_withdraw",
    "table": {
      "name": "pay_demo_withdraw",
      "comment": "示例提现订单演示业务系统的转账业务",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "提现单编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "subject",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "提现标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提现金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "user_account",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款人账号",
          "nullableInferred": true
        },
        {
          "name": "user_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款人姓名",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提现方式",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提现状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pay_transfer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "transfer_channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账渠道",
          "nullableInferred": true
        },
        {
          "name": "transfer_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "转账成功时间",
          "nullableInferred": true
        },
        {
          "name": "transfer_error_msg",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账错误提示",
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
    "moduleName": "pay",
    "className": "PayNotifyLog",
    "businessName": "商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_notify_log",
    "table": {
      "name": "pay_notify_log",
      "comment": "商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "日志编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通知任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "notify_times",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "第几次被通知",
          "nullableInferred": true
        },
        {
          "name": "response",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "HTTP 响应结果",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付通知状态",
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
    "moduleName": "pay",
    "className": "PayNotifyTask",
    "businessName": "支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_notify_task",
    "table": {
      "name": "pay_notify_task",
      "comment": "支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "通知类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "data_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据编号，根据不同 type 进行关联：",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "merchant_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "merchant_refund_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户退款编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "merchant_transfer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户转账编号",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "通知状态",
          "nullableInferred": true
        },
        {
          "name": "next_notify_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下一次通知时间",
          "nullableInferred": true
        },
        {
          "name": "last_execute_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后一次执行时间",
          "nullableInferred": true
        },
        {
          "name": "notify_times",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "当前通知次数",
          "nullableInferred": true
        },
        {
          "name": "max_notify_times",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最大可通知次数",
          "nullableInferred": true
        },
        {
          "name": "notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通知地址",
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
    "moduleName": "pay",
    "className": "PayOrder",
    "businessName": "支付订单",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_order",
    "table": {
      "name": "pay_order",
      "comment": "支付订单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "订单编号，数据库自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编码",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户类型",
          "nullableInferred": true
        },
        {
          "name": "merchant_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subject",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "body",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品描述信息",
          "nullableInferred": true
        },
        {
          "name": "notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "异步通知地址",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "channel_fee_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "渠道手续费，单位：百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "channel_fee_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "渠道手续金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "支付状态（字符串状态机 WAITING/SUCCESS/CLOSED，见 pay-order-lifecycle.ts）",
          "nullableInferred": true
        },
        {
          "name": "user_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户 IP",
          "nullableInferred": true
        },
        {
          "name": "expire_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "订单失效时间",
          "nullableInferred": true
        },
        {
          "name": "success_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "订单支付成功时间",
          "nullableInferred": true
        },
        {
          "name": "extension_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付成功的订单拓展单编号",
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付成功的外部订单号",
          "nullableInferred": true
        },
        {
          "name": "refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款总金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "channel_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道用户编号",
          "nullableInferred": true
        },
        {
          "name": "channel_order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道订单号",
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
    "moduleName": "pay",
    "className": "PayOrderExtension",
    "businessName": "支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_order_extension",
    "table": {
      "name": "pay_order_extension",
      "comment": "支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "订单拓展编号，数据库自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "外部订单号，根据规则生成",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编码",
          "nullableInferred": true
        },
        {
          "name": "user_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户 IP",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "支付状态（字符串状态机 WAITING/SUCCESS/CLOSED，见 pay-order-lifecycle.ts）",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_extras",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "支付渠道的额外参数",
          "nullableInferred": true
        },
        {
          "name": "channel_error_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调用渠道的错误码",
          "nullableInferred": true
        },
        {
          "name": "channel_error_msg",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调用渠道报错时，错误信息",
          "nullableInferred": true
        },
        {
          "name": "channel_notify_data",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付渠道的同步/异步通知的内容",
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
    "moduleName": "pay",
    "className": "PayRefund",
    "businessName": "支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_refund",
    "table": {
      "name": "pay_refund",
      "comment": "支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "退款单编号，数据库自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "外部退款号，根据规则生成",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道编码",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付订单编号",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户类型",
          "nullableInferred": true
        },
        {
          "name": "merchant_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户订单编号",
          "nullableInferred": true
        },
        {
          "name": "merchant_refund_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户退款订单号",
          "nullableInferred": true
        },
        {
          "name": "notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "异步通知地址",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款状态",
          "nullableInferred": true
        },
        {
          "name": "pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退款原因",
          "nullableInferred": true
        },
        {
          "name": "user_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户 IP",
          "nullableInferred": true
        },
        {
          "name": "channel_order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道订单号",
          "nullableInferred": true
        },
        {
          "name": "channel_refund_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道退款单号",
          "nullableInferred": true
        },
        {
          "name": "success_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退款成功时间",
          "nullableInferred": true
        },
        {
          "name": "channel_error_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调用渠道的错误码",
          "nullableInferred": true
        },
        {
          "name": "channel_error_msg",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调用渠道的错误提示",
          "nullableInferred": true
        },
        {
          "name": "channel_notify_data",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付渠道的同步/异步通知的内容",
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
    "moduleName": "pay",
    "className": "PayTransfer",
    "businessName": "转账单",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_transfer",
    "table": {
      "name": "pay_transfer",
      "comment": "转账单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "应用编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账渠道编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账渠道编码",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户类型",
          "nullableInferred": true
        },
        {
          "name": "merchant_transfer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商户转账单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subject",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转账标题",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "转账金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "user_account",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款人账号",
          "nullableInferred": true
        },
        {
          "name": "user_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款人姓名",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "转账状态",
          "nullableInferred": true
        },
        {
          "name": "success_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "订单转账成功时间",
          "nullableInferred": true
        },
        {
          "name": "notify_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "异步通知地址",
          "nullableInferred": true
        },
        {
          "name": "user_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户 IP",
          "nullableInferred": true
        },
        {
          "name": "channel_extras",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道的额外参数",
          "nullableInferred": true
        },
        {
          "name": "channel_transfer_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道转账单号",
          "nullableInferred": true
        },
        {
          "name": "channel_error_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调用渠道的错误码",
          "nullableInferred": true
        },
        {
          "name": "channel_error_msg",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调用渠道的错误提示",
          "nullableInferred": true
        },
        {
          "name": "channel_notify_data",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道的同步/异步通知的内容",
          "nullableInferred": true
        },
        {
          "name": "channel_package_info",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "渠道 package 信息",
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
    "moduleName": "pay",
    "className": "PayWallet",
    "businessName": "会员钱包",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_wallet",
    "table": {
      "name": "pay_wallet",
      "comment": "会员钱包",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户类型, 预留 多商户转帐可能需要用到",
          "nullableInferred": true
        },
        {
          "name": "balance",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "余额，单位分",
          "nullableInferred": true
        },
        {
          "name": "freeze_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "冻结金额，单位分",
          "nullableInferred": true
        },
        {
          "name": "total_expense",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "累计支出，单位分",
          "nullableInferred": true
        },
        {
          "name": "total_recharge",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "累计充值，单位分",
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
    "moduleName": "pay",
    "className": "PayWalletRecharge",
    "businessName": "会员钱包充值",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_wallet_recharge",
    "table": {
      "name": "pay_wallet_recharge",
      "comment": "会员钱包充值",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "wallet_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "钱包编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "total_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户实际到账余额",
          "nullableInferred": true
        },
        {
          "name": "pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "实际支付金额",
          "nullableInferred": true
        },
        {
          "name": "bonus_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "钱包赠送金额",
          "nullableInferred": true
        },
        {
          "name": "package_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "充值套餐编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pay_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否已支付",
          "nullableInferred": true
        },
        {
          "name": "pay_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pay_channel_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付成功的支付渠道",
          "nullableInferred": true
        },
        {
          "name": "pay_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "订单支付时间",
          "nullableInferred": true
        },
        {
          "name": "pay_refund_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付退款单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "refund_total_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款金额，包含赠送金额",
          "nullableInferred": true
        },
        {
          "name": "refund_pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款支付金额",
          "nullableInferred": true
        },
        {
          "name": "refund_bonus_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款钱包赠送金额",
          "nullableInferred": true
        },
        {
          "name": "refund_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退款时间",
          "nullableInferred": true
        },
        {
          "name": "refund_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款状态",
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
    "moduleName": "pay",
    "className": "PayWalletRechargePackage",
    "businessName": "会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_wallet_recharge_package",
    "table": {
      "name": "pay_wallet_recharge_package",
      "comment": "会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "套餐名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付金额",
          "nullableInferred": true
        },
        {
          "name": "bonus_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "赠送金额",
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
    "moduleName": "pay",
    "className": "PayWalletTransaction",
    "businessName": "会员钱包流水",
    "parentMenuId": "pay-dir",
    "permissionPrefix": "pay:pay_wallet_transaction",
    "table": {
      "name": "pay_wallet_transaction",
      "comment": "会员钱包流水",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流水号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "wallet_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "钱包编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "关联业务分类",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关联业务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流水说明",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "交易金额，单位分",
          "nullableInferred": true
        },
        {
          "name": "balance",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "交易后余额，单位分",
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
