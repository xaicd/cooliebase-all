// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const MEMBER_TABLES: CodegenConfig[] = [
  {
    "moduleName": "member",
    "className": "MemberAddress",
    "businessName": "用户收件地址",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_address",
    "table": {
      "name": "member_address",
      "comment": "用户收件地址",
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
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收件人名称",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "地区编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "detail_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收件详细地址",
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
    "moduleName": "member",
    "className": "MemberConfig",
    "businessName": "会员配置",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_config",
    "table": {
      "name": "member_config",
      "comment": "会员配置",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "自增主键",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "point_trade_deduct_enable",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "积分抵扣开关",
          "nullableInferred": true
        },
        {
          "name": "point_trade_deduct_unit_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分抵扣，单位：分",
          "nullableInferred": true
        },
        {
          "name": "point_trade_deduct_max_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分抵扣最大值",
          "nullableInferred": true
        },
        {
          "name": "point_trade_give_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "1 元赠送多少分",
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
    "moduleName": "member",
    "className": "MemberExperienceRecord",
    "businessName": "会员经验记录",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_experience_record",
    "table": {
      "name": "member_experience_record",
      "comment": "会员经验记录",
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
          "comment": "用户编号",
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
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "描述",
          "nullableInferred": true
        },
        {
          "name": "experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "经验",
          "nullableInferred": true
        },
        {
          "name": "total_experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "变更后的经验",
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
    "moduleName": "member",
    "className": "MemberGroup",
    "businessName": "用户分组",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_group",
    "table": {
      "name": "member_group",
      "comment": "用户分组",
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
          "comment": "名称",
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
          "type": "varchar",
          "tsType": "string",
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
    "moduleName": "member",
    "className": "MemberLevel",
    "businessName": "会员等级 DO配置每个等级需要的积分",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_level",
    "table": {
      "name": "member_level",
      "comment": "会员等级 DO配置每个等级需要的积分",
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
          "comment": "等级名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "等级",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "升级经验",
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "享受折扣",
          "nullableInferred": true
        },
        {
          "name": "icon",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "等级图标",
          "nullableInferred": true
        },
        {
          "name": "background_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "等级背景图",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
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
    "moduleName": "member",
    "className": "MemberLevelRecord",
    "businessName": "会员等级记录 DO用户每次等级发生变更时，记录一条日志",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_level_record",
    "table": {
      "name": "member_level_record",
      "comment": "会员等级记录 DO用户每次等级发生变更时，记录一条日志",
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
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "level_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "等级编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "会员等级",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "discount_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "享受折扣",
          "nullableInferred": true
        },
        {
          "name": "experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "升级经验",
          "nullableInferred": true
        },
        {
          "name": "user_experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "会员此时的经验",
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
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "描述",
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
    "moduleName": "member",
    "className": "MemberPointRecord",
    "businessName": "用户积分记录",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_point_record",
    "table": {
      "name": "member_point_record",
      "comment": "用户积分记录",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "自增主键",
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
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务编码",
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
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "积分标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "积分描述",
          "nullableInferred": true
        },
        {
          "name": "point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "变动积分",
          "nullableInferred": true
        },
        {
          "name": "total_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "变动后的积分",
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
    "moduleName": "member",
    "className": "MemberSignInConfig",
    "businessName": "签到规则",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_sign_in_config",
    "table": {
      "name": "member_sign_in_config",
      "comment": "签到规则",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "规则自增主键",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "day",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "签到第 x 天",
          "nullableInferred": true
        },
        {
          "name": "point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "奖励积分",
          "nullableInferred": true
        },
        {
          "name": "experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "奖励经验",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
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
    "moduleName": "member",
    "className": "MemberSignInRecord",
    "businessName": "签到记录",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_sign_in_record",
    "table": {
      "name": "member_sign_in_record",
      "comment": "签到记录",
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
          "comment": "签到用户",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "day",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "第几天签到",
          "nullableInferred": true
        },
        {
          "name": "point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "签到的积分",
          "nullableInferred": true
        },
        {
          "name": "experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "签到的经验",
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
    "moduleName": "member",
    "className": "MemberTag",
    "businessName": "会员标签",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_tag",
    "table": {
      "name": "member_tag",
      "comment": "会员标签",
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
          "comment": "标签名称",
          "nullableInferred": true,
          "queryType": "LIKE"
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
    "moduleName": "member",
    "className": "MemberUser",
    "businessName": "会员用户 DOuk_mobile 索引：基于 字段",
    "parentMenuId": "member-dir",
    "permissionPrefix": "member:member_user",
    "table": {
      "name": "member_user",
      "comment": "会员用户 DOuk_mobile 索引：基于 字段",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "用户ID",
          "isPk": true,
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
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "邮箱",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "password",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "加密后的密码",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "帐号状态",
          "nullableInferred": true,
          "queryType": "=",
"enumValues": ["ACTIVE", "DISABLED"],
"enumLabels": { "ACTIVE": "启用", "DISABLED": "停用" }
        },
        {
          "name": "register_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "注册 IP",
          "nullableInferred": true
        },
        {
          "name": "register_terminal",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "注册终端",
          "nullableInferred": true
        },
        {
          "name": "login_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "最后登录IP",
          "nullableInferred": true
        },
        {
          "name": "login_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后登录时间",
          "nullableInferred": true
        },
        {
          "name": "nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "用户昵称",
          "nullableInferred": true
        },
        {
          "name": "avatar",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户头像",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "真实名字",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "birthday",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出生日期",
          "nullableInferred": true
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
          "name": "mark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户备注",
          "nullableInferred": true
        },
        {
          "name": "point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分",
          "nullableInferred": true
        },
        {
          "name": "tag_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "会员标签列表，以逗号分隔",
          "nullableInferred": true
        },
        {
          "name": "level_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "会员级别编号",
          "nullableInferred": true
        },
        {
          "name": "experience",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "会员经验",
          "nullableInferred": true
        },
        {
          "name": "group_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户分组编号",
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
          "nullable": false,
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
          "nullable": false,
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
        },
        {
          "name": "extra_fields",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "deleted_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "account",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "password_hash",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "password_salt",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "avatar_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "member_level",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
      ]
    }
  }
]
