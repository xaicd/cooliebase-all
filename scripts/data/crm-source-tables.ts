// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const CRM_TABLES: CodegenConfig[] = [
  {
    "moduleName": "crm",
    "className": "CrmBusiness",
    "businessName": "CRM 商机",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:business",
    "table": {
      "name": "crm_business",
      "comment": "CRM 商机",
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
          "comment": "商机名称",
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
          "name": "follow_up_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "跟进状态",
          "nullableInferred": true
        },
        {
          "name": "contact_last_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进时间",
          "nullableInferred": true
        },
        {
          "name": "contact_next_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下次联系时间",
          "nullableInferred": true
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人的用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status_type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商机状态组编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商机状态编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "end_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "结束状态",
          "nullableInferred": true
        },
        {
          "name": "end_remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结束时的备注",
          "nullableInferred": true
        },
        {
          "name": "deal_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "预计成交日期",
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品总金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "整单折扣，百分比",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "商机总金额，单位：元",
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
    "moduleName": "crm",
    "className": "CrmBusinessProduct",
    "businessName": "CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:business-product",
    "table": {
      "name": "crm_business_product",
      "comment": "CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines",
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
          "name": "business_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商机编号",
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
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "business_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "商机价格, 单位：元",
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
          "comment": "总计价格，单位：元",
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
    "moduleName": "crm",
    "className": "CrmBusinessStatus",
    "businessName": "CRM 商机状态 DO注意，它是个配置表",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:business-status",
    "table": {
      "name": "crm_business_status",
      "comment": "CRM 商机状态 DO注意，它是个配置表",
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
          "name": "type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态类型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "赢单率，百分比",
          "nullableInferred": true
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
    "moduleName": "crm",
    "className": "CrmBusinessStatusType",
    "businessName": "CRM 商机状态组 DO注意，它是个配置表",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:business-status-type",
    "table": {
      "name": "crm_business_status_type",
      "comment": "CRM 商机状态组 DO注意，它是个配置表",
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
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态类型名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "dept_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "使用的部门编号",
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
    "moduleName": "crm",
    "className": "CrmClue",
    "businessName": "CRM 线索",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:clue",
    "table": {
      "name": "crm_clue",
      "comment": "CRM 线索",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "线索名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "follow_up_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "跟进状态",
          "nullableInferred": true
        },
        {
          "name": "contact_last_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进时间",
          "nullableInferred": true
        },
        {
          "name": "contact_last_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进内容",
          "nullableInferred": true
        },
        {
          "name": "contact_next_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下次联系时间",
          "nullableInferred": true
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人的用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "transform_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "转化状态",
          "nullableInferred": true
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
          "name": "mobile",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "手机号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "电话",
          "nullableInferred": true
        },
        {
          "name": "qq",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "QQ",
          "nullableInferred": true
        },
        {
          "name": "wechat",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "wechat",
          "nullableInferred": true
        },
        {
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "email",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "area_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所在地",
          "nullableInferred": true
        },
        {
          "name": "detail_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "详细地址",
          "nullableInferred": true
        },
        {
          "name": "industry_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所属行业",
          "nullableInferred": true
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "客户等级",
          "nullableInferred": true
        },
        {
          "name": "source",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "客户来源",
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
    "moduleName": "crm",
    "className": "CrmContact",
    "businessName": "CRM 联系人",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:contact",
    "table": {
      "name": "crm_contact",
      "comment": "CRM 联系人",
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
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人姓名",
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
          "name": "contact_last_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进时间",
          "nullableInferred": true
        },
        {
          "name": "contact_last_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进内容",
          "nullableInferred": true
        },
        {
          "name": "contact_next_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下次联系时间",
          "nullableInferred": true
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "mobile",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "手机号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "电话",
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
          "name": "qq",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "QQ",
          "nullableInferred": true
        },
        {
          "name": "wechat",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "微信",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所在地",
          "nullableInferred": true
        },
        {
          "name": "detail_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "详细地址",
          "nullableInferred": true
        },
        {
          "name": "sex",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "性别",
          "nullableInferred": true
        },
        {
          "name": "master",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否关键决策人",
          "nullableInferred": true
        },
        {
          "name": "post",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "职位",
          "nullableInferred": true
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "直属上级",
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
    "moduleName": "crm",
    "className": "CrmContactBusiness",
    "businessName": "CRM 联系人与商机的关联",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:contact-business",
    "table": {
      "name": "crm_contact_business",
      "comment": "CRM 联系人与商机的关联",
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
          "name": "contact_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "business_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商机编号",
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
    "moduleName": "crm",
    "className": "CrmContract",
    "businessName": "CRM 合同",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:contract",
    "table": {
      "name": "crm_contract",
      "comment": "CRM 合同",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "合同编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "合同名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "合同编号",
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
          "name": "business_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商机编号，非必须",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "contact_last_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进时间",
          "nullableInferred": true
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人的用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_instance_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作流编号",
          "nullableInferred": true
        },
        {
          "name": "audit_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "审批状态",
          "nullableInferred": true
        },
        {
          "name": "order_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下单日期",
          "nullableInferred": true
        },
        {
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "开始时间",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "结束时间",
          "nullableInferred": true
        },
        {
          "name": "total_product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品总金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "整单折扣",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合同总金额，单位：分",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "sign_contact_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户签约人，非必须",
          "nullableInferred": true
        },
        {
          "name": "sign_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公司签约人，非必须",
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
    "moduleName": "crm",
    "className": "CrmContractConfig",
    "businessName": "编号",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:contract-config",
    "table": {
      "name": "crm_contract_config",
      "comment": "编号",
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
          "name": "notify_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否开启提前提醒",
          "nullableInferred": true
        },
        {
          "name": "notify_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提前提醒天数",
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
    "moduleName": "crm",
    "className": "CrmContractProduct",
    "businessName": "CRM 合同产品关联表",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:contract-product",
    "table": {
      "name": "crm_contract_product",
      "comment": "CRM 合同产品关联表",
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
          "name": "contract_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "合同编号",
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
          "name": "product_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产品单价，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "contract_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合同价格, 单位：元",
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
          "comment": "总计价格，单位：元",
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
    "moduleName": "crm",
    "className": "CrmCustomer",
    "businessName": "CRM 客户",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:customer",
    "table": {
      "name": "crm_customer",
      "comment": "CRM 客户",
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
          "comment": "客户名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "follow_up_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "跟进状态",
          "nullableInferred": true
        },
        {
          "name": "contact_last_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进时间",
          "nullableInferred": true
        },
        {
          "name": "contact_last_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "最后跟进内容",
          "nullableInferred": true
        },
        {
          "name": "contact_next_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下次联系时间",
          "nullableInferred": true
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人的用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "owner_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "成为负责人的时间",
          "nullableInferred": true
        },
        {
          "name": "lock_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "锁定状态",
          "nullableInferred": true
        },
        {
          "name": "deal_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "成交状态",
          "nullableInferred": true
        },
        {
          "name": "mobile",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "手机",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "电话",
          "nullableInferred": true
        },
        {
          "name": "qq",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "QQ",
          "nullableInferred": true
        },
        {
          "name": "wechat",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "wechat",
          "nullableInferred": true
        },
        {
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "email",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "area_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所在地",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "detail_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "详细地址",
          "nullableInferred": true
        },
        {
          "name": "industry_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所属行业",
          "nullableInferred": true
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "客户等级",
          "nullableInferred": true
        },
        {
          "name": "source",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "客户来源",
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
    "moduleName": "crm",
    "className": "CrmCustomerLimitConfig",
    "businessName": "客户限制配置",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:customer-limit-config",
    "table": {
      "name": "crm_customer_limit_config",
      "comment": "客户限制配置",
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
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "规则类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "规则适用人群",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "dept_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "规则适用部门",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "max_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数量上限",
          "nullableInferred": true
        },
        {
          "name": "deal_count_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "成交客户是否占有拥有客户数",
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
    "moduleName": "crm",
    "className": "CrmCustomerPoolConfig",
    "businessName": "客户公海配置",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:customer-pool-config",
    "table": {
      "name": "crm_customer_pool_config",
      "comment": "客户公海配置",
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
          "name": "enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否启用客户公海",
          "nullableInferred": true
        },
        {
          "name": "contact_expire_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "未跟进放入公海天数",
          "nullableInferred": true
        },
        {
          "name": "deal_expire_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "未成交放入公海天数",
          "nullableInferred": true
        },
        {
          "name": "notify_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否开启提前提醒",
          "nullableInferred": true
        },
        {
          "name": "notify_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提前提醒天数",
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
    "moduleName": "crm",
    "className": "CrmFollowUpRecord",
    "businessName": "跟进记录 DO用于记录客户、联系人的每一次跟进",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:follow-up-record",
    "table": {
      "name": "crm_follow_up_record",
      "comment": "跟进记录 DO用于记录客户、联系人的每一次跟进",
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
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数据类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "跟进类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "跟进内容",
          "nullableInferred": true
        },
        {
          "name": "next_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下次联系时间",
          "nullableInferred": true
        },
        {
          "name": "pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "图片",
          "nullableInferred": true
        },
        {
          "name": "file_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "附件",
          "nullableInferred": true
        },
        {
          "name": "business_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "关联的商机编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "contact_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "关联的联系人编号数组",
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
    "moduleName": "crm",
    "className": "CrmOwnerRecord",
    "businessName": "CRM 负责人变更记录",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:owner-record",
    "table": {
      "name": "crm_owner_record",
      "comment": "CRM 负责人变更记录",
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
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "CRM 业务类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "CRM 业务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pre_owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "变更前负责人",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "post_owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "变更后负责人",
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
    "moduleName": "crm",
    "className": "CrmPerformanceConfig",
    "businessName": "CRM 业绩目标",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:performance-config",
    "table": {
      "name": "crm_performance_config",
      "comment": "CRM 业绩目标",
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
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "目标类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "object_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "目标对象编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "object_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "目标对象类型",
          "nullableInferred": true
        },
        {
          "name": "year",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "年份",
          "nullableInferred": true
        },
        {
          "name": "year_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "年度目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "january_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "一月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "february_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "二月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "march_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "三月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "april_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "四月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "may_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "五月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "june_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "六月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "july_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "七月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "august_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "八月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "september_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "九月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "october_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "十月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "november_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "十一月目标金额",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "december_target_price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "十二月目标金额",
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
    "moduleName": "crm",
    "className": "CrmPermission",
    "businessName": "CRM 数据权限",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:permission",
    "table": {
      "name": "crm_permission",
      "comment": "CRM 数据权限",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "biz_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数据类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "数据编号",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "权限级别",
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
    "moduleName": "crm",
    "className": "CrmProduct",
    "businessName": "CRM 产品",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:product",
    "table": {
      "name": "crm_product",
      "comment": "CRM 产品",
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
          "comment": "产品名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "unit",
          "type": "int",
          "tsType": "number",
          "nullable": false,
          "comment": "单位",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "价格，单位：元",
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
          "name": "category_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品分类 ID",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人的用户编号",
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
    "moduleName": "crm",
    "className": "CrmProductCategory",
    "businessName": "产品分类",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:product-category",
    "table": {
      "name": "crm_product_category",
      "comment": "产品分类",
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
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "父级编号",
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
    "moduleName": "crm",
    "className": "CrmReceivable",
    "businessName": "回款",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:receivable",
    "table": {
      "name": "crm_receivable",
      "comment": "回款",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回款编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回款计划编号",
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
          "name": "contract_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "合同编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人编号，关联",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "回款日期",
          "nullableInferred": true
        },
        {
          "name": "return_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "回款方式",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "计划回款金额，单位：元",
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
          "name": "process_instance_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作流编号",
          "nullableInferred": true
        },
        {
          "name": "audit_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "审批状态",
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
    "moduleName": "crm",
    "className": "CrmReceivablePlan",
    "businessName": "CRM 回款计划",
    "parentMenuId": "crm-dir",
    "permissionPrefix": "crm:receivable-plan",
    "table": {
      "name": "crm_receivable_plan",
      "comment": "CRM 回款计划",
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
          "name": "period",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "期数",
          "nullableInferred": true
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
          "name": "contract_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "合同编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "计划回款日期",
          "nullableInferred": true
        },
        {
          "name": "return_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "计划回款类型",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "计划回款金额，单位：元",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "receivable_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回款编号，关联",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "remind_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提前几天提醒",
          "nullableInferred": true
        },
        {
          "name": "remind_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "提醒日期",
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
  }
]
