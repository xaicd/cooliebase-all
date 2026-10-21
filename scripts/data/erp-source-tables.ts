// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const ERP_TABLES: CodegenConfig[] = [
  {
    "moduleName": "erp",
    "className": "ErpAccount",
    "businessName": "ERP 结算账户",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_account",
    "table": {
      "name": "erp_account",
      "comment": "ERP 结算账户",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "结算账户编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "账户名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "账户编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "开启状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排序",
          "nullableInferred": true
        },
        {
          "name": "default_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否默认",
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
    "moduleName": "erp",
    "className": "ErpCustomer",
    "businessName": "ERP 客户",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_customer",
    "table": {
      "name": "erp_customer",
      "comment": "ERP 客户",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "客户编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "contact",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人",
          "nullableInferred": true
        },
        {
          "name": "mobile",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "手机号码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系电话",
          "nullableInferred": true
        },
        {
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "电子邮箱",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "fax",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "传真",
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "开启状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排序",
          "nullableInferred": true
        },
        {
          "name": "tax_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "纳税人识别号",
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "bank_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开户行",
          "nullableInferred": true
        },
        {
          "name": "bank_account",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开户账号",
          "nullableInferred": true
        },
        {
          "name": "bank_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开户地址",
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
    "moduleName": "erp",
    "className": "ErpFinancePayment",
    "businessName": "ERP 付款单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_finance_payment",
    "table": {
      "name": "erp_finance_payment",
      "comment": "ERP 付款单",
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
          "comment": "付款单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "付款状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "payment_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "付款时间",
          "nullableInferred": true
        },
        {
          "name": "finance_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "财务人员编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "supplier_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "付款账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "payment_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "实付金额，单位：分",
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
    "moduleName": "erp",
    "className": "ErpFinancePaymentItem",
    "businessName": "ERP 付款项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_finance_payment_item",
    "table": {
      "name": "erp_finance_payment_item",
      "comment": "ERP 付款项",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "入库项编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "payment_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "付款单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "业务类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务单号",
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "应付金额，单位：分",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "paid_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已付金额，单位：分",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "payment_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次付款，单位：分",
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
    "moduleName": "erp",
    "className": "ErpFinanceReceipt",
    "businessName": "ERP 收款单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_finance_receipt",
    "table": {
      "name": "erp_finance_receipt",
      "comment": "ERP 收款单",
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
          "comment": "收款单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "收款状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "收款时间",
          "nullableInferred": true
        },
        {
          "name": "finance_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "财务人员编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "customer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "receipt_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "实付金额，单位：分",
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
    "moduleName": "erp",
    "className": "ErpFinanceReceiptItem",
    "businessName": "ERP 收款项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_finance_receipt_item",
    "table": {
      "name": "erp_finance_receipt_item",
      "comment": "ERP 收款项",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "入库项编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "业务类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务单号",
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "应收金额，单位：分",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "receipted_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已收金额，单位：分",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "receipt_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次收款，单位：分",
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
    "moduleName": "erp",
    "className": "ErpProduct",
    "businessName": "ERP 产品",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_product",
    "table": {
      "name": "erp_product",
      "comment": "ERP 产品",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "产品编号",
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
          "name": "bar_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品条码",
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
          "name": "unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "单位编号",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "standard",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品规格",
          "nullableInferred": true
        },
        {
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品备注",
          "nullableInferred": true
        },
        {
          "name": "expiry_day",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "保质期天数",
          "nullableInferred": true
        },
        {
          "name": "weight",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "基础重量（kg）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "purchase_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "采购价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "sale_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "销售价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "min_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最低价格，单位：元",
          "precision": 18,
          "scale": 2,
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
    "moduleName": "erp",
    "className": "ErpProductCategory",
    "businessName": "ERP 产品分类",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_product_category",
    "table": {
      "name": "erp_product_category",
      "comment": "ERP 产品分类",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "分类编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "父分类编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类编码",
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
          "comment": "开启状态",
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
    "moduleName": "erp",
    "className": "ErpProductUnit",
    "businessName": "ERP 产品单位",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_product_unit",
    "table": {
      "name": "erp_product_unit",
      "comment": "ERP 产品单位",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "单位编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "单位名字",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "单位状态",
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
    "moduleName": "erp",
    "className": "ErpPurchaseIn",
    "businessName": "ERP 采购入库",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_purchase_in",
    "table": {
      "name": "erp_purchase_in",
      "comment": "ERP 采购入库",
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
          "comment": "采购入库单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "入库状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "supplier_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结算账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "in_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库时间",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单号",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最终合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "payment_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已支付金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计产品价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计税额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "other_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "其它金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件地址",
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
    "moduleName": "erp",
    "className": "ErpPurchaseInItem",
    "businessName": "ERP 采购入库项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_purchase_in_item",
    "table": {
      "name": "erp_purchase_in_items",
      "comment": "ERP 采购入库项",
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
          "name": "in_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购入库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位单位",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单位单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpPurchaseOrder",
    "businessName": "ERP 采购订单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_purchase_order",
    "table": {
      "name": "erp_purchase_order",
      "comment": "ERP 采购订单",
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
          "comment": "采购订单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "采购状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "supplier_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结算账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下单时间",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最终合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计产品价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计税额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "deposit_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "定金金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件地址",
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
          "name": "in_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "采购入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "return_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "采购退货数量",
          "precision": 18,
          "scale": 2,
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
    "moduleName": "erp",
    "className": "ErpPurchaseOrderItem",
    "businessName": "ERP 采购订单项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_purchase_order_item",
    "table": {
      "name": "erp_purchase_order_items",
      "comment": "ERP 采购订单项",
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
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位单位",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单位单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税额，单位：元",
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
          "name": "in_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "采购入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "return_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "采购退货数量",
          "precision": 18,
          "scale": 2,
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
    "moduleName": "erp",
    "className": "ErpPurchaseReturn",
    "businessName": "ERP 采购退货",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_purchase_return",
    "table": {
      "name": "erp_purchase_return",
      "comment": "ERP 采购退货",
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
          "comment": "采购退货单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退货状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "supplier_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结算账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退货时间",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单号",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最终合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "refund_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已退款金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计产品价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计税额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "other_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "其它金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件地址",
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
    "moduleName": "erp",
    "className": "ErpPurchaseReturnItem",
    "businessName": "ERP 采购退货项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_purchase_return_item",
    "table": {
      "name": "erp_purchase_return_items",
      "comment": "ERP 采购退货项",
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
          "name": "return_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购退货编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位单位",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单位单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpSaleOrder",
    "businessName": "ERP 销售订单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_sale_order",
    "table": {
      "name": "erp_sale_order",
      "comment": "ERP 销售订单",
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
          "comment": "销售订单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "销售状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "customer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结算账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sale_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售员编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下单时间",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最终合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计产品价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计税额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "deposit_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "定金金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件地址",
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
          "name": "out_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "销售出库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "return_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "销售退货数量",
          "precision": 18,
          "scale": 2,
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
    "moduleName": "erp",
    "className": "ErpSaleOrderItem",
    "businessName": "ERP 销售订单项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_sale_order_item",
    "table": {
      "name": "erp_sale_order_items",
      "comment": "ERP 销售订单项",
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
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位单位",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单位单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税额，单位：元",
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
          "name": "out_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "销售出库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "return_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "销售退货数量",
          "precision": 18,
          "scale": 2,
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
    "moduleName": "erp",
    "className": "ErpSaleOut",
    "businessName": "ERP 销售出库",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_sale_out",
    "table": {
      "name": "erp_sale_out",
      "comment": "ERP 销售出库",
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
          "comment": "销售出库单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "出库状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "customer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结算账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sale_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售员编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "out_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出库时间",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单号",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最终合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "receipt_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已收款金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计产品价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计税额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "other_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "其它金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件地址",
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
    "moduleName": "erp",
    "className": "ErpSaleOutItem",
    "businessName": "ERP 销售出库项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_sale_out_item",
    "table": {
      "name": "erp_sale_out_items",
      "comment": "ERP 销售出库项",
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
          "name": "out_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售出库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位单位",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单位单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpSaleReturn",
    "businessName": "ERP 销售退货",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_sale_return",
    "table": {
      "name": "erp_sale_return",
      "comment": "ERP 销售退货",
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
          "comment": "销售退货单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退货状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "customer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结算账户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sale_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售员编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退货时间",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单号",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最终合计价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "refund_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已退款金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计产品价格，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计税额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "other_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "其它金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件地址",
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
    "moduleName": "erp",
    "className": "ErpSaleReturnItem",
    "businessName": "ERP 销售退货项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_sale_return_item",
    "table": {
      "name": "erp_sale_return_items",
      "comment": "ERP 销售退货项",
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
          "name": "return_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售退货编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位单位",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单位单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "tax_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpStock",
    "businessName": "ERP 产品库存",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock",
    "table": {
      "name": "erp_stock",
      "comment": "ERP 产品库存",
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
          "name": "product_id",
          "queryType": "=",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "库存数量",
          "precision": 18,
          "scale": 2,
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
    "moduleName": "erp",
    "className": "ErpStockCheck",
    "businessName": "ERP 库存盘点单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_check",
    "table": {
      "name": "erp_stock_check",
      "comment": "ERP 库存盘点单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "盘点编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "check_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点时间",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
          "precision": 18,
          "scale": 2,
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
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件 URL",
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
    "moduleName": "erp",
    "className": "ErpStockCheckItem",
    "businessName": "ERP 库存盘点单项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_check_item",
    "table": {
      "name": "erp_stock_check_item",
      "comment": "ERP 库存盘点单项",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "盘点项编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "check_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单价",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "stock_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "账面数量（当前库存）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "actual_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "实际数量（实际库存）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "盈亏数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpStockIn",
    "businessName": "ERP 其它入库单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_in",
    "table": {
      "name": "erp_stock_in",
      "comment": "ERP 其它入库单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "入库编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "supplier_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "in_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库时间",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
          "precision": 18,
          "scale": 2,
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
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件 URL",
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
    "moduleName": "erp",
    "className": "ErpStockInItem",
    "businessName": "ERP 其它入库单项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_in_item",
    "table": {
      "name": "erp_stock_in_item",
      "comment": "ERP 其它入库单项",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "入库项编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "in_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单价",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpStockMove",
    "businessName": "ERP 库存调拨单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_move",
    "table": {
      "name": "erp_stock_move",
      "comment": "ERP 库存调拨单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "调拨编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调拨单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "move_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "调拨时间",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
          "precision": 18,
          "scale": 2,
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
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件 URL",
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
    "moduleName": "erp",
    "className": "ErpStockMoveItem",
    "businessName": "ERP 库存调拨单项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_move_item",
    "table": {
      "name": "erp_stock_move_item",
      "comment": "ERP 库存调拨单项",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "调拨项编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "move_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调拨编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "from_warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调出仓库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "to_warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "调入仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单价",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpStockOut",
    "businessName": "ERP 其它出库单",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_out",
    "table": {
      "name": "erp_stock_out",
      "comment": "ERP 其它出库单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "出库编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "customer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "out_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出库时间",
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
          "precision": 18,
          "scale": 2,
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
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "file_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "附件 URL",
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
    "moduleName": "erp",
    "className": "ErpStockOutItem",
    "businessName": "ERP 其它出库单项",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_out_item",
    "table": {
      "name": "erp_stock_out_item",
      "comment": "ERP 其它出库单项",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "出库项编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "out_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
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
          "name": "product_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单价",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合计金额，单位：元",
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
    "moduleName": "erp",
    "className": "ErpStockRecord",
    "businessName": "ERP 产品库存明细",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_stock_record",
    "table": {
      "name": "erp_stock_record",
      "comment": "ERP 产品库存明细",
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
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "出入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总库存量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "业务类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务单号",
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
    "moduleName": "erp",
    "className": "ErpSupplier",
    "businessName": "ERP 供应商",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_supplier",
    "table": {
      "name": "erp_supplier",
      "comment": "ERP 供应商",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "供应商编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "contact",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人",
          "nullableInferred": true
        },
        {
          "name": "mobile",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "手机号码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系电话",
          "nullableInferred": true
        },
        {
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "电子邮箱",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "fax",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "传真",
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "开启状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排序",
          "nullableInferred": true
        },
        {
          "name": "tax_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "纳税人识别号",
          "nullableInferred": true
        },
        {
          "name": "tax_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "税率",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "bank_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开户行",
          "nullableInferred": true
        },
        {
          "name": "bank_account",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开户账号",
          "nullableInferred": true
        },
        {
          "name": "bank_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开户地址",
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
    "moduleName": "erp",
    "className": "ErpWarehouse",
    "businessName": "ERP 仓库",
    "parentMenuId": "erp-dir",
    "permissionPrefix": "erp:erp_warehouse",
    "table": {
      "name": "erp_warehouse",
      "comment": "ERP 仓库",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "仓库编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库地址",
          "nullableInferred": true
        },
        {
          "name": "sort",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "排序",
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
          "name": "principal",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人",
          "nullableInferred": true
        },
        {
          "name": "warehouse_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "仓储费，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "truckage_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "搬运费，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "开启状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "default_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否默认",
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
