// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const MES_TABLES: CodegenConfig[] = [
  {
    "moduleName": "mes",
    "className": "MesCalHoliday",
    "businessName": "MES 假期设置",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_holiday",
    "table": {
      "name": "mes_cal_holiday",
      "comment": "MES 假期设置",
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
          "name": "day",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "日期",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "日期类型",
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
    "moduleName": "mes",
    "className": "MesCalPlan",
    "businessName": "MES 排班计划",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_plan",
    "table": {
      "name": "mes_cal_plan",
      "comment": "MES 排班计划",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "计划编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计划编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计划名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "calendar_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "班组类型",
          "nullableInferred": true
        },
        {
          "name": "start_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "开始日期",
          "nullableInferred": true
        },
        {
          "name": "end_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "结束日期",
          "nullableInferred": true
        },
        {
          "name": "shift_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轮班方式",
          "nullableInferred": true
        },
        {
          "name": "shift_method",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "倒班方式",
          "nullableInferred": true
        },
        {
          "name": "shift_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "倒班天数",
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
    "moduleName": "mes",
    "className": "MesCalPlanShift",
    "businessName": "MES 计划班次",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_plan_shift",
    "table": {
      "name": "mes_cal_plan_shift",
      "comment": "MES 计划班次",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "班次编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "排班计划编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "显示顺序",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班次名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "start_time",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开始时间（HH:mm 格式）",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结束时间（HH:mm 格式）",
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
    "moduleName": "mes",
    "className": "MesCalPlanTeam",
    "businessName": "MES 计划班组关联",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_plan_team",
    "table": {
      "name": "mes_cal_plan_team",
      "comment": "MES 计划班组关联",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "排班计划编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "team_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班组编号",
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
    "moduleName": "mes",
    "className": "MesCalTeam",
    "businessName": "MES 班组",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_team",
    "table": {
      "name": "mes_cal_team",
      "comment": "MES 班组",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "班组编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班组编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班组名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "calendar_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "班组类型",
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
    "moduleName": "mes",
    "className": "MesCalTeamMember",
    "businessName": "MES 班组成员",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_team_member",
    "table": {
      "name": "mes_cal_team_member",
      "comment": "MES 班组成员",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "班组成员编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "team_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班组编号",
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
    "moduleName": "mes",
    "className": "MesCalTeamShift",
    "businessName": "MES 班组排班",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_cal_team_shift",
    "table": {
      "name": "mes_cal_team_shift",
      "comment": "MES 班组排班",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "排班计划编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "team_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班组编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "shift_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "班次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "day",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "日期",
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
    "moduleName": "mes",
    "className": "MesDvCheckPlan",
    "businessName": "MES 点检保养方案",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_check_plan",
    "table": {
      "name": "mes_dv_check_plan",
      "comment": "MES 点检保养方案",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "方案类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "start_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "开始日期",
          "nullableInferred": true
        },
        {
          "name": "end_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "结束日期",
          "nullableInferred": true
        },
        {
          "name": "cycle_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "周期类型",
          "nullableInferred": true
        },
        {
          "name": "cycle_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "周期数量",
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
    "moduleName": "mes",
    "className": "MesDvCheckPlanMachinery",
    "businessName": "MES 点检保养方案设备",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_check_plan_machinery",
    "table": {
      "name": "mes_dv_check_plan_machinery",
      "comment": "MES 点检保养方案设备",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "machinery_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
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
    "moduleName": "mes",
    "className": "MesDvCheckPlanSubject",
    "businessName": "MES 点检保养方案项目",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_check_plan_subject",
    "table": {
      "name": "mes_dv_check_plan_subject",
      "comment": "MES 点检保养方案项目",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subject_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "项目编号",
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
    "moduleName": "mes",
    "className": "MesDvCheckRecord",
    "businessName": "MES 设备点检记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_check_record",
    "table": {
      "name": "mes_dv_check_record",
      "comment": "MES 设备点检记录",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "点检计划编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "machinery_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "check_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "点检时间",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "点检人编号",
          "nullableInferred": true,
          "queryType": "="
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
    "moduleName": "mes",
    "className": "MesDvCheckRecordLine",
    "businessName": "MES 设备点检记录明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_check_record_line",
    "table": {
      "name": "mes_dv_check_record_line",
      "comment": "MES 设备点检记录明细",
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
          "name": "record_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "点检记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subject_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "点检项目编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "check_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "点检结果",
          "nullableInferred": true
        },
        {
          "name": "check_result",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "异常描述",
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
    "moduleName": "mes",
    "className": "MesDvMachinery",
    "businessName": "MES 设备台账",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_machinery",
    "table": {
      "name": "mes_dv_machinery",
      "comment": "MES 设备台账",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "brand",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "品牌",
          "nullableInferred": true
        },
        {
          "name": "specification",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "规格型号",
          "nullableInferred": true
        },
        {
          "name": "machinery_type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备类型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workshop_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "所属车间编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "设备状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "last_mainten_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最近保养时间",
          "nullableInferred": true
        },
        {
          "name": "last_check_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最近点检时间",
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
    "moduleName": "mes",
    "className": "MesDvMachineryType",
    "businessName": "MES 设备类型",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_machinery_type",
    "table": {
      "name": "mes_dv_machinery_type",
      "comment": "MES 设备类型",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "类型编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "类型名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "父类型编号",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "显示排序",
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
    "moduleName": "mes",
    "className": "MesDvMaintenRecord",
    "businessName": "MES 设备保养记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_mainten_record",
    "table": {
      "name": "mes_dv_mainten_record",
      "comment": "MES 设备保养记录",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计划编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "machinery_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "mainten_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "保养时间",
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
    "moduleName": "mes",
    "className": "MesDvMaintenRecordLine",
    "businessName": "MES 设备保养记录明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_mainten_record_line",
    "table": {
      "name": "mes_dv_mainten_record_line",
      "comment": "MES 设备保养记录明细",
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
          "name": "record_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "保养记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subject_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "项目编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "保养结果",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "result",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "异常描述",
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
    "moduleName": "mes",
    "className": "MesDvRepair",
    "businessName": "MES 维修工单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_repair",
    "table": {
      "name": "mes_dv_repair",
      "comment": "MES 维修工单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "维修工单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "维修工单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "machinery_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "require_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "报修日期",
          "nullableInferred": true
        },
        {
          "name": "finish_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "维修完成日期",
          "nullableInferred": true
        },
        {
          "name": "confirm_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "验收日期",
          "nullableInferred": true
        },
        {
          "name": "result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "维修结果",
          "nullableInferred": true
        },
        {
          "name": "accepted_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "维修人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "confirm_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "验收人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号",
          "nullableInferred": true
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编码",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesDvRepairLine",
    "businessName": "MES 维修工单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_repair_line",
    "table": {
      "name": "mes_dv_repair_line",
      "comment": "MES 维修工单行",
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
          "name": "repair_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "维修工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subject_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "点检保养项目编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "malfunction",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "故障描述",
          "nullableInferred": true
        },
        {
          "name": "malfunction_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "故障图片 URL",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "维修描述",
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
    "moduleName": "mes",
    "className": "MesDvSubject",
    "businessName": "MES 点检保养项目",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_dv_subject",
    "table": {
      "name": "mes_dv_subject",
      "comment": "MES 点检保养项目",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "项目编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "项目名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "项目类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "项目内容",
          "nullableInferred": true
        },
        {
          "name": "standard",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标准",
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
    "moduleName": "mes",
    "className": "MesMdAutoCodePart",
    "businessName": "MES 编码规则组成",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_auto_code_part",
    "table": {
      "name": "mes_md_auto_code_part",
      "comment": "MES 编码规则组成",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "分段 ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "rule_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "规则 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分段序号",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分段类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "length",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分段长度",
          "nullableInferred": true
        },
        {
          "name": "date_format",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "日期格式",
          "nullableInferred": true
        },
        {
          "name": "fix_character",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "固定字符",
          "nullableInferred": true
        },
        {
          "name": "serial_start_no",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "流水号起始值",
          "nullableInferred": true
        },
        {
          "name": "serial_step",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "流水号步长",
          "nullableInferred": true
        },
        {
          "name": "cycle_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "流水号是否循环",
          "nullableInferred": true
        },
        {
          "name": "cycle_method",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "循环方式",
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
    "moduleName": "mes",
    "className": "MesMdAutoCodeRecord",
    "businessName": "MES 编码生成记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_auto_code_record",
    "table": {
      "name": "mes_md_auto_code_record",
      "comment": "MES 编码生成记录",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "记录 ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "rule_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "规则 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "result",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生成的编码",
          "nullableInferred": true
        },
        {
          "name": "serial_no",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "生成的流水号",
          "nullableInferred": true
        },
        {
          "name": "input_char",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "传入的参数",
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
    "moduleName": "mes",
    "className": "MesMdAutoCodeRule",
    "businessName": "MES 编码规则",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_auto_code_rule",
    "table": {
      "name": "mes_md_auto_code_rule",
      "comment": "MES 编码规则",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "规则 ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "规则编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "规则名称",
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
          "name": "max_length",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最大长度",
          "nullableInferred": true
        },
        {
          "name": "padded",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否补齐",
          "nullableInferred": true
        },
        {
          "name": "padded_char",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "补齐字符",
          "nullableInferred": true
        },
        {
          "name": "padded_method",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "补齐方式",
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
    "moduleName": "mes",
    "className": "MesMdClient",
    "businessName": "MES 客户",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_client",
    "table": {
      "name": "mes_md_client",
      "comment": "MES 客户",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户简称",
          "nullableInferred": true
        },
        {
          "name": "english_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户英文名称",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户简介",
          "nullableInferred": true
        },
        {
          "name": "logo",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户LOGO地址",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "客户类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户地址",
          "nullableInferred": true
        },
        {
          "name": "website",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户官网地址",
          "nullableInferred": true
        },
        {
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户邮箱地址",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户电话",
          "nullableInferred": true
        },
        {
          "name": "contact1_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人1",
          "nullableInferred": true
        },
        {
          "name": "contact1_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人1-电话",
          "nullableInferred": true
        },
        {
          "name": "contact1_email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人1-邮箱",
          "nullableInferred": true
        },
        {
          "name": "contact2_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人2",
          "nullableInferred": true
        },
        {
          "name": "contact2_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人2-电话",
          "nullableInferred": true
        },
        {
          "name": "contact2_email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人2-邮箱",
          "nullableInferred": true
        },
        {
          "name": "credit_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "统一社会信用代码",
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
    "moduleName": "mes",
    "className": "MesMdItem",
    "businessName": "MES 物料产品",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_item",
    "table": {
      "name": "mes_md_item",
      "comment": "MES 物料产品",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "物料编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "specification",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "规格型号",
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计量单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料分类编号",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "safe_stock_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否启用安全库存",
          "nullableInferred": true
        },
        {
          "name": "min_stock",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最低库存量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "max_stock",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最高库存量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "high_value",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否高值物料",
          "nullableInferred": true
        },
        {
          "name": "batch_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否启用批次管理",
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
    "moduleName": "mes",
    "className": "MesMdItemBatchConfig",
    "businessName": "MES 物料批次属性配置",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_item_batch_config",
    "table": {
      "name": "mes_md_item_batch_config",
      "comment": "MES 物料批次属性配置",
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
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "produce_date_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-生产日期",
          "nullableInferred": true
        },
        {
          "name": "expire_date_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-有效期",
          "nullableInferred": true
        },
        {
          "name": "receipt_date_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-入库日期",
          "nullableInferred": true
        },
        {
          "name": "vendor_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-供应商",
          "nullableInferred": true
        },
        {
          "name": "client_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-客户",
          "nullableInferred": true
        },
        {
          "name": "sales_order_code_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "purchase_order_code_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-采购订单编号",
          "nullableInferred": true
        },
        {
          "name": "work_order_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-生产工单",
          "nullableInferred": true
        },
        {
          "name": "task_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-生产任务",
          "nullableInferred": true
        },
        {
          "name": "workstation_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-工作站",
          "nullableInferred": true
        },
        {
          "name": "tool_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-工具",
          "nullableInferred": true
        },
        {
          "name": "mold_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-模具",
          "nullableInferred": true
        },
        {
          "name": "lot_number_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-生产批号",
          "nullableInferred": true
        },
        {
          "name": "quality_status_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "批次属性-质量状态",
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
    "moduleName": "mes",
    "className": "MesMdItemType",
    "businessName": "MES 物料产品分类",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_item_type",
    "table": {
      "name": "mes_md_item_type",
      "comment": "MES 物料产品分类",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "comment": "父分类编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_or_product",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料/产品标识",
          "nullableInferred": true
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "显示排序",
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
    "moduleName": "mes",
    "className": "MesMdProductBom",
    "businessName": "MES 产品 BOM",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_product_bom",
    "table": {
      "name": "mes_md_product_bom",
      "comment": "MES 产品 BOM",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "BOM编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "bom_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "BOM物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "物料使用比例",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "是否启用",
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
    "moduleName": "mes",
    "className": "MesMdProductSip",
    "businessName": "MES 产品SIP",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_product_sip",
    "table": {
      "name": "mes_md_product_sip",
      "comment": "MES 产品SIP",
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
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排列顺序",
          "nullableInferred": true
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
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
          "comment": "详细描述",
          "nullableInferred": true
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图片地址",
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
    "moduleName": "mes",
    "className": "MesMdProductSop",
    "businessName": "MES 产品SOP",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_product_sop",
    "table": {
      "name": "mes_md_product_sop",
      "comment": "MES 产品SOP",
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
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料产品编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排列顺序",
          "nullableInferred": true
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
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
          "comment": "详细描述",
          "nullableInferred": true
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图片地址",
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
    "moduleName": "mes",
    "className": "MesMdUnitMeasure",
    "businessName": "MES 计量单位",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_unit_measure",
    "table": {
      "name": "mes_md_unit_measure",
      "comment": "MES 计量单位",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "单位编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "单位名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "primary_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否主单位",
          "nullableInferred": true
        },
        {
          "name": "primary_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "主单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "change_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "与主单位换算比例",
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
    "moduleName": "mes",
    "className": "MesMdVendor",
    "businessName": "MES 供应商",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_vendor",
    "table": {
      "name": "mes_md_vendor",
      "comment": "MES 供应商",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商简称",
          "nullableInferred": true
        },
        {
          "name": "english_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商英文名称",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商简介",
          "nullableInferred": true
        },
        {
          "name": "logo",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商LOGO地址",
          "nullableInferred": true
        },
        {
          "name": "level",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商等级",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "score",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "供应商评分",
          "nullableInferred": true
        },
        {
          "name": "address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商地址",
          "nullableInferred": true
        },
        {
          "name": "website",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商官网地址",
          "nullableInferred": true
        },
        {
          "name": "email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商邮箱地址",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商电话",
          "nullableInferred": true
        },
        {
          "name": "contact1_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人1",
          "nullableInferred": true
        },
        {
          "name": "contact1_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人1-电话",
          "nullableInferred": true
        },
        {
          "name": "contact1_email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人1-邮箱",
          "nullableInferred": true
        },
        {
          "name": "contact2_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人2",
          "nullableInferred": true
        },
        {
          "name": "contact2_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人2-电话",
          "nullableInferred": true
        },
        {
          "name": "contact2_email",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人2-邮箱",
          "nullableInferred": true
        },
        {
          "name": "credit_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "统一社会信用代码",
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
    "moduleName": "mes",
    "className": "MesMdWorkshop",
    "businessName": "MES 车间",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_workshop",
    "table": {
      "name": "mes_md_workshop",
      "comment": "MES 车间",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "车间编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "车间名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "area",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "面积（平方米）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "charge_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人用户编号",
          "nullableInferred": true,
          "queryType": "="
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
    "moduleName": "mes",
    "className": "MesMdWorkstation",
    "businessName": "MES 工作站",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_workstation",
    "table": {
      "name": "mes_md_workstation",
      "comment": "MES 工作站",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站地点",
          "nullableInferred": true
        },
        {
          "name": "workshop_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "所在车间编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "线边库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesMdWorkstationMachine",
    "businessName": "MES 设备资源",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_workstation_machine",
    "table": {
      "name": "mes_md_workstation_machine",
      "comment": "MES 设备资源",
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
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "machinery_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "设备编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
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
    "moduleName": "mes",
    "className": "MesMdWorkstationTool",
    "businessName": "MES 工装夹具资源",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_workstation_tool",
    "table": {
      "name": "mes_md_workstation_tool",
      "comment": "MES 工装夹具资源",
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
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool_type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工具类型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
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
    "moduleName": "mes",
    "className": "MesMdWorkstationWorker",
    "businessName": "MES 人力资源",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_md_workstation_worker",
    "table": {
      "name": "mes_md_workstation_worker",
      "comment": "MES 人力资源",
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
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "post_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "岗位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
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
    "moduleName": "mes",
    "className": "MesProAndonConfig",
    "businessName": "MES 安灯呼叫配置",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_andon_config",
    "table": {
      "name": "mes_pro_andon_config",
      "comment": "MES 安灯呼叫配置",
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
          "name": "reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "呼叫原因",
          "nullableInferred": true
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "级别",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "handler_role_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处置人角色编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "handler_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处置人编号",
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
    "moduleName": "mes",
    "className": "MesProAndonRecord",
    "businessName": "MES 安灯呼叫记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_andon_record",
    "table": {
      "name": "mes_pro_andon_record",
      "comment": "MES 安灯呼叫记录",
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
          "name": "config_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "安灯配置编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发起用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "呼叫原因（快照值，不随配置变更）",
          "nullableInferred": true
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "级别（快照值）",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "处置状态",
          "nullableInferred": true
        },
        {
          "name": "handle_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "处置时间",
          "nullableInferred": true
        },
        {
          "name": "handler_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处置人编号",
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
    "moduleName": "mes",
    "className": "MesProCard",
    "businessName": "MES 生产流转卡",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_card",
    "table": {
      "name": "mes_pro_card",
      "comment": "MES 生产流转卡",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流转卡编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "transfered_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "流转数量",
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
    "moduleName": "mes",
    "className": "MesProCardProcess",
    "businessName": "MES 流转卡工序记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_card_process",
    "table": {
      "name": "mes_pro_card_process",
      "comment": "MES 流转卡工序记录",
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
          "name": "card_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流转卡编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "序号",
          "nullableInferred": true
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "input_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "进入工序时间",
          "nullableInferred": true
        },
        {
          "name": "output_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出工序时间",
          "nullableInferred": true
        },
        {
          "name": "input_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "投入数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "output_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "产出数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "操作人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "ipqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "过程检验单编号",
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
    "moduleName": "mes",
    "className": "MesProFeedback",
    "businessName": "MES 生产报工",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_feedback",
    "table": {
      "name": "mes_pro_feedback",
      "comment": "MES 生产报工",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报工单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "报工类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "channel",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报工途径",
          "nullableInferred": true
        },
        {
          "name": "feedback_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "报工时间",
          "nullableInferred": true
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "route_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务编号",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号（冗余自任务）",
          "nullableInferred": true
        },
        {
          "name": "expire_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "过期日期",
          "nullableInferred": true
        },
        {
          "name": "lot_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产批号",
          "nullableInferred": true
        },
        {
          "name": "scheduled_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "排产数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "feedback_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次报工数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不良品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "uncheck_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "待检测数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "labor_scrap_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "工废数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "material_scrap_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "料废数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "other_scrap_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "其他废品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "feedback_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报工用户编号",
          "nullableInferred": true
        },
        {
          "name": "approve_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "审核用户编号",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesProProcess",
    "businessName": "MES 生产工序",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_process",
    "table": {
      "name": "mes_pro_process",
      "comment": "MES 生产工序",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "attention",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺要求",
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
    "moduleName": "mes",
    "className": "MesProProcessContent",
    "businessName": "MES 生产工序内容",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_process_content",
    "table": {
      "name": "mes_pro_process_content",
      "comment": "MES 生产工序内容",
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
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "顺序编号",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "步骤说明",
          "nullableInferred": true
        },
        {
          "name": "device",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "辅助设备",
          "nullableInferred": true
        },
        {
          "name": "material",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "辅助材料",
          "nullableInferred": true
        },
        {
          "name": "doc_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "材料文档 URL",
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
    "moduleName": "mes",
    "className": "MesProRoute",
    "businessName": "MES 工艺路线",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_route",
    "table": {
      "name": "mes_pro_route",
      "comment": "MES 工艺路线",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线说明",
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
    "moduleName": "mes",
    "className": "MesProRouteProcess",
    "businessName": "MES 工艺路线工序",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_route_process",
    "table": {
      "name": "mes_pro_route_process",
      "comment": "MES 工艺路线工序",
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
          "name": "route_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "序号",
          "nullableInferred": true
        },
        {
          "name": "next_process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "下一道工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "link_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "与下一道工序关系",
          "nullableInferred": true
        },
        {
          "name": "prepare_time",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "准备时间（分钟）",
          "nullableInferred": true
        },
        {
          "name": "wait_time",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "等待时间（分钟）",
          "nullableInferred": true
        },
        {
          "name": "color_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "甘特图显示颜色",
          "nullableInferred": true
        },
        {
          "name": "key_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否关键工序",
          "nullableInferred": true
        },
        {
          "name": "check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否质检工序",
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
    "moduleName": "mes",
    "className": "MesProRouteProduct",
    "businessName": "MES 工艺路线产品",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_route_product",
    "table": {
      "name": "mes_pro_route_product",
      "comment": "MES 工艺路线产品",
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
          "name": "route_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "生产数量",
          "nullableInferred": true
        },
        {
          "name": "production_time",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "生产用时",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "time_unit_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "时间单位",
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
    "moduleName": "mes",
    "className": "MesProRouteProductBom",
    "businessName": "MES 工艺路线产品 BOM",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_route_product_bom",
    "table": {
      "name": "mes_pro_route_product_bom",
      "comment": "MES 工艺路线产品 BOM",
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
          "name": "route_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "BOM 物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "用料比例",
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
    "moduleName": "mes",
    "className": "MesProTask",
    "businessName": "MES 生产任务",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_task",
    "table": {
      "name": "mes_pro_task",
      "comment": "MES 生产任务",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "route_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工艺路线编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "排产数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "produced_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已生产数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualify_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualify_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不良品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "changed_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "调整数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true
        },
        {
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "开始生产时间",
          "nullableInferred": true
        },
        {
          "name": "duration",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "生产时长（工作日，1=8小时）",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "结束生产时间",
          "nullableInferred": true
        },
        {
          "name": "color_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "甘特图显示颜色",
          "nullableInferred": true
        },
        {
          "name": "finish_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "完成日期",
          "nullableInferred": true
        },
        {
          "name": "cancel_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "取消日期",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "任务状态",
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
    "moduleName": "mes",
    "className": "MesProTaskIssue",
    "businessName": "MES 生产任务投料",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_task_issue",
    "table": {
      "name": "mes_pro_task_issue",
      "comment": "MES 生产任务投料",
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
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编码",
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "投料批次",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "单位编号",
          "nullableInferred": true
        },
        {
          "name": "issued_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "总投料数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "available_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "当前可用数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "used_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "当前使用数量",
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
    "moduleName": "mes",
    "className": "MesProWorkOrder",
    "businessName": "MES 生产工单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_work_order",
    "table": {
      "name": "mes_pro_work_order",
      "comment": "MES 生产工单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "工单类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_source_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源类型",
          "nullableInferred": true
        },
        {
          "name": "order_source_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号",
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
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "生产数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "quantity_produced",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已生产数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "quantity_changed",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "调整数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "quantity_scheduled",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "已排产数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "request_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "需求日期",
          "nullableInferred": true
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "父工单编号",
          "nullableInferred": true
        },
        {
          "name": "finish_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "完成时间",
          "nullableInferred": true
        },
        {
          "name": "cancel_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "取消时间",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "工单状态",
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
    "moduleName": "mes",
    "className": "MesProWorkOrderBom",
    "businessName": "MES 生产工单 BOM",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_work_order_bom",
    "table": {
      "name": "mes_pro_work_order_bom",
      "comment": "MES 生产工单 BOM",
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
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "BOM 物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "预计使用量",
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
    "moduleName": "mes",
    "className": "MesProWorkRecord",
    "businessName": "MES 用户工作站绑定关系（当前快照）",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_work_record",
    "table": {
      "name": "mes_pro_work_record",
      "comment": "MES 用户工作站绑定关系（当前快照）",
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
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "当前状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "clock_in_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "上工时间",
          "nullableInferred": true
        },
        {
          "name": "clock_out_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下工时间",
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
    "moduleName": "mes",
    "className": "MesProWorkRecordLog",
    "businessName": "MES 上下工记录流水",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_pro_work_record_log",
    "table": {
      "name": "mes_pro_work_record_log",
      "comment": "MES 上下工记录流水",
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
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作类型",
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
    "moduleName": "mes",
    "className": "MesQcDefect",
    "businessName": "MES 缺陷类型",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_defect",
    "table": {
      "name": "mes_qc_defect",
      "comment": "MES 缺陷类型",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "缺陷编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "缺陷描述",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检测项类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "缺陷等级",
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
    "moduleName": "mes",
    "className": "MesQcDefectRecord",
    "businessName": "MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_defect_record",
    "table": {
      "name": "mes_qc_defect_record",
      "comment": "MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、",
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
          "name": "qc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检验类型",
          "nullableInferred": true
        },
        {
          "name": "qc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "缺陷描述",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "缺陷等级",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "缺陷数量",
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
    "moduleName": "mes",
    "className": "MesQcIndicator",
    "businessName": "MES 质检指标",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_indicator",
    "table": {
      "name": "mes_qc_indicator",
      "comment": "MES 质检指标",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测项编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测项名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检测项类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测工具",
          "nullableInferred": true
        },
        {
          "name": "result_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "结果值类型",
          "nullableInferred": true
        },
        {
          "name": "result_specification",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结果值属性",
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
    "moduleName": "mes",
    "className": "MesQcIndicatorResult",
    "businessName": "MES 检验结果记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_indicator_result",
    "table": {
      "name": "mes_qc_indicator_result",
      "comment": "MES 检验结果记录",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "样品编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "qc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关联质检单 ID（IQC/IPQC/OQC/RQC 的 id）",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "qc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质检类型",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sn",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物资 SN",
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
    "moduleName": "mes",
    "className": "MesQcIndicatorResultDetail",
    "businessName": "MES 检验结果明细记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_indicator_result_detail",
    "table": {
      "name": "mes_qc_indicator_result_detail",
      "comment": "MES 检验结果明细记录",
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
          "name": "result_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关联检验结果 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "indicator_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测指标 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "value",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测值（统一存为字符串）",
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
    "moduleName": "mes",
    "className": "MesQcIpqc",
    "businessName": "MES 过程检验单（IPQC, In-Process Quality Contr",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_ipqc",
    "table": {
      "name": "mes_qc_ipqc",
      "comment": "MES 过程检验单（IPQC, In-Process Quality Contr",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "IPQC 检验类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验模板 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据行 ID",
          "nullableInferred": true
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号（冗余）",
          "nullableInferred": true
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单 ID",
          "nullableInferred": true
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务 ID",
          "nullableInferred": true
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工位 ID",
          "nullableInferred": true
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序 ID",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料 ID",
          "nullableInferred": true
        },
        {
          "name": "check_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "检测数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "labor_scrap_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "工废数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "material_scrap_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "料废数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "other_scrap_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "其他废品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "major_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "minor_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "check_result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检测结果",
          "nullableInferred": true
        },
        {
          "name": "inspect_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "检测日期",
          "nullableInferred": true
        },
        {
          "name": "inspector_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测人员用户 ID",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesQcIpqcLine",
    "businessName": "MES 过程检验单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_ipqc_line",
    "table": {
      "name": "mes_qc_ipqc_line",
      "comment": "MES 过程检验单行",
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
          "name": "ipqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "过程检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "indicator_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测指标 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测工具",
          "nullableInferred": true
        },
        {
          "name": "check_method",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测方法",
          "nullableInferred": true
        },
        {
          "name": "standard_value",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "标准值",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计量单位 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "max_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差上限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "min_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差下限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
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
    "moduleName": "mes",
    "className": "MesQcIqc",
    "businessName": "MES 来料检验单（IQC, Incoming Quality Control）",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_iqc",
    "table": {
      "name": "mes_qc_iqc",
      "comment": "MES 来料检验单（IQC, Incoming Quality Control）",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验模板 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号（冗余）",
          "nullableInferred": true
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商 ID",
          "nullableInferred": true
        },
        {
          "name": "vendor_batch",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商批次号",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料 ID",
          "nullableInferred": true
        },
        {
          "name": "received_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次接收数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "check_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次检测数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "major_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "minor_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "check_result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检测结果",
          "nullableInferred": true
        },
        {
          "name": "receive_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "来料日期",
          "nullableInferred": true
        },
        {
          "name": "inspect_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "检测日期",
          "nullableInferred": true
        },
        {
          "name": "inspector_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测人员用户 ID",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesQcIqcLine",
    "businessName": "MES 来料检验单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_iqc_line",
    "table": {
      "name": "mes_qc_iqc_line",
      "comment": "MES 来料检验单行",
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
          "name": "iqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来料检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "indicator_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测指标 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测工具",
          "nullableInferred": true
        },
        {
          "name": "check_method",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测方法",
          "nullableInferred": true
        },
        {
          "name": "standard_value",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "标准值",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计量单位 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "max_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差上限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "min_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差下限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
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
    "moduleName": "mes",
    "className": "MesQcOqc",
    "businessName": "MES 出货检验单（OQC, Outgoing Quality Control）",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_oqc",
    "table": {
      "name": "mes_qc_oqc",
      "comment": "MES 出货检验单（OQC, Outgoing Quality Control）",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验模板 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号（冗余）",
          "nullableInferred": true
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户 ID",
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料 ID",
          "nullableInferred": true
        },
        {
          "name": "min_check_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最低检测数",
          "nullableInferred": true
        },
        {
          "name": "max_unqualified_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最大不合格数",
          "nullableInferred": true
        },
        {
          "name": "out_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次出货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "check_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次检测数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "major_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "minor_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "check_result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检测结果",
          "nullableInferred": true
        },
        {
          "name": "out_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出货日期",
          "nullableInferred": true
        },
        {
          "name": "inspect_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "检测日期",
          "nullableInferred": true
        },
        {
          "name": "inspector_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测人员用户 ID",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesQcOqcLine",
    "businessName": "MES 出货检验单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_oqc_line",
    "table": {
      "name": "mes_qc_oqc_line",
      "comment": "MES 出货检验单行",
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
          "name": "oqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出货检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "indicator_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测指标 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测工具",
          "nullableInferred": true
        },
        {
          "name": "check_method",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测方法",
          "nullableInferred": true
        },
        {
          "name": "standard_value",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "标准值",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计量单位 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "max_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差上限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "min_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差下限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
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
    "moduleName": "mes",
    "className": "MesQcRqc",
    "businessName": "MES 退货检验单（RQC, Return Quality Control）",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_rqc",
    "table": {
      "name": "mes_qc_rqc",
      "comment": "MES 退货检验单（RQC, Return Quality Control）",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检验模板 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编码（冗余）",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检验类型",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料 ID",
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "check_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "检测数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格品数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unqualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "不合格数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "major_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "minor_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷率（%）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "check_result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "检测结果",
          "nullableInferred": true
        },
        {
          "name": "inspect_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "检测日期",
          "nullableInferred": true
        },
        {
          "name": "inspector_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测人员用户 ID",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesQcRqcLine",
    "businessName": "MES 退货检验行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_rqc_line",
    "table": {
      "name": "mes_qc_rqc_line",
      "comment": "MES 退货检验行",
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
          "name": "rqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "indicator_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测指标 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测工具",
          "nullableInferred": true
        },
        {
          "name": "check_method",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测方法",
          "nullableInferred": true
        },
        {
          "name": "standard_value",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "标准值",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计量单位 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "max_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差上限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "min_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差下限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "critical_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "致命缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "major_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "严重缺陷数量",
          "nullableInferred": true
        },
        {
          "name": "minor_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "轻微缺陷数量",
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
    "moduleName": "mes",
    "className": "MesQcTemplate",
    "businessName": "MES 质检方案",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_template",
    "table": {
      "name": "mes_qc_template",
      "comment": "MES 质检方案",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "types",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "检测种类",
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
    "moduleName": "mes",
    "className": "MesQcTemplateIndicator",
    "businessName": "MES 质检方案-检测指标项",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_template_indicator",
    "table": {
      "name": "mes_qc_template_indicator",
      "comment": "MES 质检方案-检测指标项",
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
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "质检方案编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "indicator_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "质检指标编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "check_method",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检测方法",
          "nullableInferred": true
        },
        {
          "name": "standard_value",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "标准值",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "unit_measure_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "计量单位编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "threshold_max",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差上限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "threshold_min",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "误差下限",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "doc_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "说明图 URL",
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
    "moduleName": "mes",
    "className": "MesQcTemplateItem",
    "businessName": "MES 质检方案-产品关联",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_qc_template_item",
    "table": {
      "name": "mes_qc_template_item",
      "comment": "MES 质检方案-产品关联",
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
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "质检方案编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity_check",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最低检测数",
          "nullableInferred": true
        },
        {
          "name": "quantity_unqualified",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最大不合格数（0=不启用）",
          "nullableInferred": true
        },
        {
          "name": "critical_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最大致命缺陷率（%，0=不允许）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "major_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最大严重缺陷率（%，0=不允许）",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "minor_rate",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最大轻微缺陷率（%）",
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
    "moduleName": "mes",
    "className": "MesTmTool",
    "businessName": "MES 工具台账",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_tm_tool",
    "table": {
      "name": "mes_tm_tool",
      "comment": "MES 工具台账",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工具编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工具名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "brand",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "品牌",
          "nullableInferred": true
        },
        {
          "name": "specification",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "型号规格",
          "nullableInferred": true
        },
        {
          "name": "tool_type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工具类型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "nullableInferred": true
        },
        {
          "name": "available_quantity",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "可用数量",
          "nullableInferred": true
        },
        {
          "name": "mainten_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "保养维护类型",
          "nullableInferred": true
        },
        {
          "name": "next_mainten_period",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "下次保养周期（次数）",
          "nullableInferred": true
        },
        {
          "name": "next_mainten_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "下次保养日期",
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
    "moduleName": "mes",
    "className": "MesTmToolType",
    "businessName": "MES 工具类型",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_tm_tool_type",
    "table": {
      "name": "mes_tm_tool_type",
      "comment": "MES 工具类型",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "类型编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "类型名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "code_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否编码管理",
          "nullableInferred": true
        },
        {
          "name": "mainten_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "保养维护类型",
          "nullableInferred": true
        },
        {
          "name": "mainten_period",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "保养周期",
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
    "moduleName": "mes",
    "className": "MesWmArrivalNotice",
    "businessName": "MES 到货通知单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_arrival_notice",
    "table": {
      "name": "mes_wm_arrival_notice",
      "comment": "MES 到货通知单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通知单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通知单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "purchase_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单编号",
          "nullableInferred": true
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "arrival_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "到货日期",
          "nullableInferred": true
        },
        {
          "name": "contact_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人",
          "nullableInferred": true
        },
        {
          "name": "contact_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系电话",
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
    "moduleName": "mes",
    "className": "MesWmArrivalNoticeLine",
    "businessName": "MES 到货通知单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_arrival_notice_line",
    "table": {
      "name": "mes_wm_arrival_notice_line",
      "comment": "MES 到货通知单行",
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
          "name": "notice_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "到货通知单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "arrival_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "到货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "qualified_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "合格数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "iqc_check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否需要来料检验",
          "nullableInferred": true
        },
        {
          "name": "iqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来料检验单编号",
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
    "moduleName": "mes",
    "className": "MesWmBarcode",
    "businessName": "MES 条码清单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_barcode",
    "table": {
      "name": "mes_wm_barcode",
      "comment": "MES 条码清单",
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
          "name": "config_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "条码配置编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "format",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "条码格式",
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
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "条码内容（核心字段，前端根据此内容生成条码图片）",
          "nullableInferred": true
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
          "name": "biz_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务编码",
          "nullableInferred": true
        },
        {
          "name": "biz_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务名称",
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
    "moduleName": "mes",
    "className": "MesWmBarcodeConfig",
    "businessName": "MES 条码配置",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_barcode_config",
    "table": {
      "name": "mes_wm_barcode_config",
      "comment": "MES 条码配置",
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
          "name": "format",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "条码格式",
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
          "name": "content_format",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "内容格式模板（支持 BUSINESSCODE 占位符）",
          "nullableInferred": true
        },
        {
          "name": "content_example",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "内容样例",
          "nullableInferred": true
        },
        {
          "name": "auto_generate_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否自动生成",
          "nullableInferred": true
        },
        {
          "name": "default_template",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "默认打印模板",
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
    "moduleName": "mes",
    "className": "MesWmBatch",
    "businessName": "批次管理",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_batch",
    "table": {
      "name": "mes_wm_batch",
      "comment": "批次管理",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "批次ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "produce_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "生产日期",
          "nullableInferred": true
        },
        {
          "name": "expire_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "有效期",
          "nullableInferred": true
        },
        {
          "name": "receipt_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库日期",
          "nullableInferred": true
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sales_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "purchase_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单编号",
          "nullableInferred": true
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务ID",
          "nullableInferred": true
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站ID",
          "nullableInferred": true
        },
        {
          "name": "tool_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工具ID",
          "nullableInferred": true
        },
        {
          "name": "mold_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模具 ID",
          "nullableInferred": true
        },
        {
          "name": "lot_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产批号",
          "nullableInferred": true
        },
        {
          "name": "quality_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质量状态",
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
    "moduleName": "mes",
    "className": "MesWmItemConsume",
    "businessName": "MES 物料消耗记录",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_item_consume",
    "table": {
      "name": "mes_wm_item_consume",
      "comment": "MES 物料消耗记录",
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
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "feedback_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报工记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "consume_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "消耗日期",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesWmItemConsumeDetail",
    "businessName": "MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_item_consume_detail",
    "table": {
      "name": "mes_wm_item_consume_detail",
      "comment": "MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配",
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
          "name": "consume_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消耗记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消耗记录行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存台账编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "消耗数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
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
    "moduleName": "mes",
    "className": "MesWmItemConsumeLine",
    "businessName": "MES 物料消耗记录行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_item_consume_line",
    "table": {
      "name": "mes_wm_item_consume_line",
      "comment": "MES 物料消耗记录行",
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
          "name": "consume_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消耗记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "消耗数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
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
    "moduleName": "mes",
    "className": "MesWmItemReceipt",
    "businessName": "MES 采购入库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_item_receipt",
    "table": {
      "name": "mes_wm_item_receipt",
      "comment": "MES 采购入库单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "iqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来料检验单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "notice_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "到货通知单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "purchase_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单号",
          "nullableInferred": true
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库日期",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesWmItemReceiptDetail",
    "businessName": "MES 采购入库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_item_receipt_detail",
    "table": {
      "name": "mes_wm_item_receipt_detail",
      "comment": "MES 采购入库明细",
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
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "上架数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
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
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
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
    "moduleName": "mes",
    "className": "MesWmItemReceiptLine",
    "businessName": "MES 采购入库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_item_receipt_line",
    "table": {
      "name": "mes_wm_item_receipt_line",
      "comment": "MES 采购入库单行",
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
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "arrival_notice_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "到货通知单行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "received_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编码",
          "nullableInferred": true
        },
        {
          "name": "production_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "生产日期",
          "nullableInferred": true
        },
        {
          "name": "expire_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "有效期",
          "nullableInferred": true
        },
        {
          "name": "lot_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产批号",
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
    "moduleName": "mes",
    "className": "MesWmMaterialStock",
    "businessName": "MES 库存台账（仓库现有量）",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_material_stock",
    "table": {
      "name": "mes_wm_material_stock",
      "comment": "MES 库存台账（仓库现有量）",
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
          "name": "item_type_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料分类编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
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
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
          "nullableInferred": true
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "在库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "receipt_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库时间",
          "nullableInferred": true
        },
        {
          "name": "frozen",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否冻结",
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
    "moduleName": "mes",
    "className": "MesWmMiscIssue",
    "businessName": "MES 杂项出库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_misc_issue",
    "table": {
      "name": "mes_wm_misc_issue",
      "comment": "MES 杂项出库单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "杂项类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编号",
          "nullableInferred": true
        },
        {
          "name": "issue_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出库日期",
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
    "moduleName": "mes",
    "className": "MesWmMiscIssueDetail",
    "businessName": "MES 杂项出库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_misc_issue_detail",
    "table": {
      "name": "mes_wm_misc_issue_detail",
      "comment": "MES 杂项出库明细",
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
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "出库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位ID",
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
    "moduleName": "mes",
    "className": "MesWmMiscIssueLine",
    "businessName": "MES 杂项出库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_misc_issue_line",
    "table": {
      "name": "mes_wm_misc_issue_line",
      "comment": "MES 杂项出库单行",
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
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "出库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
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
    "moduleName": "mes",
    "className": "MesWmMiscReceipt",
    "businessName": "MES 杂项入库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_misc_receipt",
    "table": {
      "name": "mes_wm_misc_receipt",
      "comment": "MES 杂项入库单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "杂项类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据类型",
          "nullableInferred": true
        },
        {
          "name": "source_doc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "source_doc_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源单据编码",
          "nullableInferred": true
        },
        {
          "name": "receipt_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库日期",
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
    "moduleName": "mes",
    "className": "MesWmMiscReceiptDetail",
    "businessName": "MES 杂项入库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_misc_receipt_detail",
    "table": {
      "name": "mes_wm_misc_receipt_detail",
      "comment": "MES 杂项入库明细",
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
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位ID",
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
    "moduleName": "mes",
    "className": "MesWmMiscReceiptLine",
    "businessName": "MES 杂项入库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_misc_receipt_line",
    "table": {
      "name": "mes_wm_misc_receipt_line",
      "comment": "MES 杂项入库单行",
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
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
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
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
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
    "moduleName": "mes",
    "className": "MesWmOutsourceIssue",
    "businessName": "MES 外协发料单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_outsource_issue",
    "table": {
      "name": "mes_wm_outsource_issue",
      "comment": "MES 外协发料单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "发料单ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发料单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发料单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "issue_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发料日期",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "单据状态",
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
    "moduleName": "mes",
    "className": "MesWmOutsourceIssueDetail",
    "businessName": "MES 外协发料单明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_outsource_issue_detail",
    "table": {
      "name": "mes_wm_outsource_issue_detail",
      "comment": "MES 外协发料单明细",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "明细ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发料单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区ID",
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
    "moduleName": "mes",
    "className": "MesWmOutsourceIssueLine",
    "businessName": "MES 外协发料单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_outsource_issue_line",
    "table": {
      "name": "mes_wm_outsource_issue_line",
      "comment": "MES 外协发料单行",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "行ID",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发料单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "发料数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次ID",
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
    "moduleName": "mes",
    "className": "MesWmOutsourceReceipt",
    "businessName": "MES 外协入库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_outsource_receipt",
    "table": {
      "name": "mes_wm_outsource_receipt",
      "comment": "MES 外协入库单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "外协工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库日期",
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
    "moduleName": "mes",
    "className": "MesWmOutsourceReceiptDetail",
    "businessName": "MES 外协入库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_outsource_receipt_detail",
    "table": {
      "name": "mes_wm_outsource_receipt_detail",
      "comment": "MES 外协入库明细",
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
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "上架数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
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
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
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
    "moduleName": "mes",
    "className": "MesWmOutsourceReceiptLine",
    "businessName": "MES 外协入库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_outsource_receipt_line",
    "table": {
      "name": "mes_wm_outsource_receipt_line",
      "comment": "MES 外协入库单行",
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
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "production_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "生产日期",
          "nullableInferred": true
        },
        {
          "name": "expire_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "有效期",
          "nullableInferred": true
        },
        {
          "name": "lot_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产批号",
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
          "name": "iqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来料检验单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "iqc_check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否需要质检",
          "nullableInferred": true
        },
        {
          "name": "quality_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质量状态",
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
    "moduleName": "mes",
    "className": "MesWmPackage",
    "businessName": "MES 装箱单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_package",
    "table": {
      "name": "mes_wm_package",
      "comment": "MES 装箱单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "MES 装箱单 DO",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "装箱单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "父箱 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "package_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "装箱日期",
          "nullableInferred": true
        },
        {
          "name": "sales_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "invoice_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发票编号",
          "nullableInferred": true
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "length",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "箱长度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "width",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "箱宽度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "height",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "箱高度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "size_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "尺寸单位 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "net_weight",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "净重",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "gross_weight",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "毛重",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "weight_unit_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "重量单位 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "inspector_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "检查员用户 ID",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesWmPackageLine",
    "businessName": "MES 装箱明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_package_line",
    "table": {
      "name": "mes_wm_package_line",
      "comment": "MES 装箱明细",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "MES 装箱明细 DO",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "package_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "装箱单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "装箱数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "expire_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "有效期",
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
    "moduleName": "mes",
    "className": "MesWmProductIssue",
    "businessName": "MES 领料出库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_issue",
    "table": {
      "name": "mes_wm_product_issue",
      "comment": "MES 领料出库单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "领料单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "领料单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "issue_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "领料日期",
          "nullableInferred": true
        },
        {
          "name": "required_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "需求时间",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesWmProductIssueDetail",
    "businessName": "MES 领料出库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_issue_detail",
    "table": {
      "name": "mes_wm_product_issue_detail",
      "comment": "MES 领料出库明细",
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
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "领料单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "领料数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位ID",
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
    "moduleName": "mes",
    "className": "MesWmProductIssueLine",
    "businessName": "MES 领料出库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_issue_line",
    "table": {
      "name": "mes_wm_product_issue_line",
      "comment": "MES 领料出库单行",
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
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "领料单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "领料数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
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
    "moduleName": "mes",
    "className": "MesWmProductProduce",
    "businessName": "MES 生产入库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_produce",
    "table": {
      "name": "mes_wm_product_produce",
      "comment": "MES 生产入库单",
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
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "feedback_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报工记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产任务 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工序 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "produce_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "生产日期",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesWmProductProduceDetail",
    "businessName": "MES 生产入库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_produce_detail",
    "table": {
      "name": "mes_wm_product_produce_detail",
      "comment": "MES 生产入库明细",
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
          "name": "produce_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区 ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位 ID",
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
    "moduleName": "mes",
    "className": "MesWmProductProduceLine",
    "businessName": "MES 生产入库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_produce_line",
    "table": {
      "name": "mes_wm_product_produce_line",
      "comment": "MES 生产入库单行",
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
          "name": "produce_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "入库单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "feedback_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报工记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "入库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "expire_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "过期日期",
          "nullableInferred": true
        },
        {
          "name": "lot_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产批号",
          "nullableInferred": true
        },
        {
          "name": "quality_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质量状态",
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
    "moduleName": "mes",
    "className": "MesWmProductReceipt",
    "businessName": "MES 产品收货（入库）单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_receipt",
    "table": {
      "name": "mes_wm_product_receipt",
      "comment": "MES 产品收货（入库）单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "产品物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "收货日期",
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
    "moduleName": "mes",
    "className": "MesWmProductReceiptDetail",
    "businessName": "MES 产品收货（入库）单明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_receipt_detail",
    "table": {
      "name": "mes_wm_product_receipt_detail",
      "comment": "MES 产品收货（入库）单明细",
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
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货单行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "上架数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
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
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
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
    "moduleName": "mes",
    "className": "MesWmProductReceiptLine",
    "businessName": "MES 产品收货（入库）单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_receipt_line",
    "table": {
      "name": "mes_wm_product_receipt_line",
      "comment": "MES 产品收货（入库）单行",
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
          "name": "receipt_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存物资记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "收货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
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
    "moduleName": "mes",
    "className": "MesWmProductSales",
    "businessName": "MES 销售出库单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_sales",
    "table": {
      "name": "mes_wm_product_sales",
      "comment": "MES 销售出库单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sales_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单号",
          "nullableInferred": true
        },
        {
          "name": "notice_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发货通知单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sales_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "出库日期",
          "nullableInferred": true
        },
        {
          "name": "contact_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系人",
          "nullableInferred": true
        },
        {
          "name": "contact_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系电话",
          "nullableInferred": true
        },
        {
          "name": "contact_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货地址",
          "nullableInferred": true
        },
        {
          "name": "carrier",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "承运商",
          "nullableInferred": true
        },
        {
          "name": "shipping_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "运输单号",
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
    "moduleName": "mes",
    "className": "MesWmProductSalesDetail",
    "businessName": "MES 销售出库明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_sales_detail",
    "table": {
      "name": "mes_wm_product_sales_detail",
      "comment": "MES 销售出库明细",
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
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sales_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "拣货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位ID",
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
    "moduleName": "mes",
    "className": "MesWmProductSalesLine",
    "businessName": "MES 销售出库单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_product_sales_line",
    "table": {
      "name": "mes_wm_product_sales_line",
      "comment": "MES 销售出库单行",
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
          "name": "sales_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出库单ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "notice_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发货通知单行ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "出库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "oqc_check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否出厂检验",
          "nullableInferred": true
        },
        {
          "name": "oqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "出厂检验单 ID",
          "nullableInferred": true
        },
        {
          "name": "quality_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质量状态",
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
    "moduleName": "mes",
    "className": "MesWmReturnIssue",
    "businessName": "MES 生产退料单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_issue",
    "table": {
      "name": "mes_wm_return_issue",
      "comment": "MES 生产退料单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退料单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退料单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "workstation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作站 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退料类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退料日期",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
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
    "moduleName": "mes",
    "className": "MesWmReturnIssueDetail",
    "businessName": "MES 生产退料明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_issue_detail",
    "table": {
      "name": "mes_wm_return_issue_detail",
      "comment": "MES 生产退料明细",
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
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退料单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "退料数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库 ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区 ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位 ID",
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
    "moduleName": "mes",
    "className": "MesWmReturnIssueLine",
    "businessName": "MES 生产退料单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_issue_line",
    "table": {
      "name": "mes_wm_return_issue_line",
      "comment": "MES 生产退料单行",
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
          "name": "issue_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退料单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "退料数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编码",
          "nullableInferred": true
        },
        {
          "name": "rqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "rqc_check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否需要质检",
          "nullableInferred": true
        },
        {
          "name": "quality_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质量状态",
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
    "moduleName": "mes",
    "className": "MesWmReturnSales",
    "businessName": "MES 销售退货单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_sales",
    "table": {
      "name": "mes_wm_return_sales",
      "comment": "MES 销售退货单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "sales_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退货日期",
          "nullableInferred": true
        },
        {
          "name": "return_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货原因",
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
    "moduleName": "mes",
    "className": "MesWmReturnSalesDetail",
    "businessName": "MES 销售退货明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_sales_detail",
    "table": {
      "name": "mes_wm_return_sales_detail",
      "comment": "MES 销售退货明细",
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
          "comment": "退货单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区 ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位 ID",
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
    "moduleName": "mes",
    "className": "MesWmReturnSalesLine",
    "businessName": "MES 销售退货单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_sales_line",
    "table": {
      "name": "mes_wm_return_sales_line",
      "comment": "MES 销售退货单行",
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
          "comment": "退货单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "退货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "rqc_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货检验单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "rqc_check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否需要质检",
          "nullableInferred": true
        },
        {
          "name": "quality_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "质量状态",
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
    "moduleName": "mes",
    "className": "MesWmReturnVendor",
    "businessName": "MES 供应商退货单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_vendor",
    "table": {
      "name": "mes_wm_return_vendor",
      "comment": "MES 供应商退货单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "purchase_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "采购订单编号",
          "nullableInferred": true
        },
        {
          "name": "vendor_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "供应商 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "return_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退货日期",
          "nullableInferred": true
        },
        {
          "name": "return_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货原因",
          "nullableInferred": true
        },
        {
          "name": "transport_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物流单号",
          "nullableInferred": true
        },
        {
          "name": "transport_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物流联系电话",
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
    "moduleName": "mes",
    "className": "MesWmReturnVendorDetail",
    "businessName": "MES 供应商退货明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_vendor_detail",
    "table": {
      "name": "mes_wm_return_vendor_detail",
      "comment": "MES 供应商退货明细",
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
          "comment": "退货单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "退货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库 ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区 ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位 ID",
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
    "moduleName": "mes",
    "className": "MesWmReturnVendorLine",
    "businessName": "MES 供应商退货单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_return_vendor_line",
    "table": {
      "name": "mes_wm_return_vendor_line",
      "comment": "MES 供应商退货单行",
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
          "comment": "退货单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "退货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
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
    "moduleName": "mes",
    "className": "MesWmSalesNotice",
    "businessName": "MES 发货通知单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_sales_notice",
    "table": {
      "name": "mes_wm_sales_notice",
      "comment": "MES 发货通知单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通知单编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通知单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "sales_order_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "销售订单编号",
          "nullableInferred": true
        },
        {
          "name": "client_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sales_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发货日期",
          "nullableInferred": true
        },
        {
          "name": "recipient_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货人",
          "nullableInferred": true
        },
        {
          "name": "recipient_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系方式",
          "nullableInferred": true
        },
        {
          "name": "recipient_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货地址",
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
    "moduleName": "mes",
    "className": "MesWmSalesNoticeLine",
    "businessName": "MES 发货通知单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_sales_notice_line",
    "table": {
      "name": "mes_wm_sales_notice_line",
      "comment": "MES 发货通知单行",
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
          "name": "notice_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发货通知单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "发货数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "oqc_check_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否检验",
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
    "moduleName": "mes",
    "className": "MesWmSn",
    "businessName": "MES SN 码",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_sn",
    "table": {
      "name": "mes_wm_sn",
      "comment": "MES SN 码",
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
          "name": "uuid",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 UUID（用于标记同一批次生成的 SN 码）",
          "nullableInferred": true
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "SN 码（唯一）",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "work_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生产工单编号",
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
    "moduleName": "mes",
    "className": "MesWmStockTakingPlan",
    "businessName": "MES 盘点方案",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_stock_taking_plan",
    "table": {
      "name": "mes_wm_stock_taking_plan",
      "comment": "MES 盘点方案",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "方案名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "盘点类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "计划开始时间",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "计划结束时间",
          "nullableInferred": true
        },
        {
          "name": "blind_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否盲盘",
          "nullableInferred": true
        },
        {
          "name": "frozen",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否冻结库存",
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
    "moduleName": "mes",
    "className": "MesWmStockTakingPlanParam",
    "businessName": "MES 盘点方案参数",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_stock_taking_plan_param",
    "table": {
      "name": "mes_wm_stock_taking_plan_param",
      "comment": "MES 盘点方案参数",
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
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点方案编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "参数值类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "value_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "参数值编号，例如仓库、库区、库位、物料、批次的主键 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "value_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "参数值编码，例如仓库编码、库区编码、库位编码、物料编码、批次编码",
          "nullableInferred": true
        },
        {
          "name": "value_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "参数值名称，例如仓库名称、库区名称、库位名称、物料名称、批次名称",
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
    "moduleName": "mes",
    "className": "MesWmStockTakingTask",
    "businessName": "MES 盘点任务",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_stock_taking_task",
    "table": {
      "name": "mes_wm_stock_taking_task",
      "comment": "MES 盘点任务",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "taking_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点日期",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "盘点类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "plan_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点计划编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "blind_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否盲盘",
          "nullableInferred": true
        },
        {
          "name": "frozen",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否冻结库存",
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "任务状态",
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
    "moduleName": "mes",
    "className": "MesWmStockTakingTaskLine",
    "businessName": "MES 盘点任务行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_stock_taking_task_line",
    "table": {
      "name": "mes_wm_stock_taking_task_line",
      "comment": "MES 盘点任务行",
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
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编码",
          "nullableInferred": true
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "在库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "taking_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "盘点数量",
          "precision": 18,
          "scale": 2,
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
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "盘点状态",
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
    "moduleName": "mes",
    "className": "MesWmStockTakingTaskResult",
    "businessName": "MES 盘点结果",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_stock_taking_task_result",
    "table": {
      "name": "mes_wm_stock_taking_task_result",
      "comment": "MES 盘点结果",
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
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "盘点任务行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编码",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编号",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编号",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "在库数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "taking_quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "盘点数量",
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
    "moduleName": "mes",
    "className": "MesWmTransaction",
    "businessName": "MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_transaction",
    "table": {
      "name": "mes_wm_transaction",
      "comment": "MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许",
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
          "comment": "事务类型",
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
          "comment": "来源业务主单 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "biz_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源业务单号",
          "nullableInferred": true
        },
        {
          "name": "biz_line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源业务行 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "related_transaction_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关联的事务 ID",
          "nullableInferred": true
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料 ID",
          "nullableInferred": true
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "本次变动数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次 ID",
          "nullableInferred": true
        },
        {
          "name": "batch_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次号",
          "nullableInferred": true
        },
        {
          "name": "warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库 ID",
          "nullableInferred": true
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区 ID",
          "nullableInferred": true
        },
        {
          "name": "area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位 ID",
          "nullableInferred": true
        },
        {
          "name": "transaction_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "事务发生时间",
          "nullableInferred": true
        },
        {
          "name": "erp_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "ERP 账期",
          "nullableInferred": true
        },
        {
          "name": "receipt_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入库时间",
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
    "moduleName": "mes",
    "className": "MesWmTransfer",
    "businessName": "MES 转移单",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_transfer",
    "table": {
      "name": "mes_wm_transfer",
      "comment": "MES 转移单",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转移单编号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转移单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "转移单类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "delivery_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否配送",
          "nullableInferred": true
        },
        {
          "name": "recipient_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货人",
          "nullableInferred": true
        },
        {
          "name": "recipient_telephone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "联系方式",
          "nullableInferred": true
        },
        {
          "name": "destination_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "目的地",
          "nullableInferred": true
        },
        {
          "name": "carrier",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "承运商",
          "nullableInferred": true
        },
        {
          "name": "shipping_number",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "运输单号",
          "nullableInferred": true
        },
        {
          "name": "confirm_flag",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否已确认",
          "nullableInferred": true
        },
        {
          "name": "transfer_date",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "转移日期",
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
    "moduleName": "mes",
    "className": "MesWmTransferDetail",
    "businessName": "MES 调拨明细",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_transfer_detail",
    "table": {
      "name": "mes_wm_transfer_detail",
      "comment": "MES 调拨明细",
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
          "name": "line_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转移单行编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "transfer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转移单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "上架数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "to_warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移入仓库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "to_location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移入库区编号",
          "nullableInferred": true
        },
        {
          "name": "to_area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移入库位编号",
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
    "moduleName": "mes",
    "className": "MesWmTransferLine",
    "businessName": "MES 转移单行",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_transfer_line",
    "table": {
      "name": "mes_wm_transfer_line",
      "comment": "MES 转移单行",
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
          "name": "transfer_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "转移单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_stock_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库存记录编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物料编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quantity",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "转移数量",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "batch_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "批次编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "from_warehouse_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移出仓库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "from_location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移出库区编号",
          "nullableInferred": true
        },
        {
          "name": "from_area_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移出库位编号",
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
    "moduleName": "mes",
    "className": "MesWmWarehouse",
    "businessName": "MES 仓库",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_warehouse",
    "table": {
      "name": "mes_wm_warehouse",
      "comment": "MES 仓库",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "仓库编码",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "area",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "面积",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "charge_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "负责人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "frozen",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否冻结",
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
    "moduleName": "mes",
    "className": "MesWmWarehouseArea",
    "businessName": "MES 库位",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_warehouse_area",
    "table": {
      "name": "mes_wm_warehouse_area",
      "comment": "MES 库位",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库位名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "location_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "area",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "面积",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "max_load",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "最大载重",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "position_x",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "位置 X",
          "nullableInferred": true
        },
        {
          "name": "position_y",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "位置 Y",
          "nullableInferred": true
        },
        {
          "name": "position_z",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "位置 Z",
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
          "name": "frozen",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否冻结",
          "nullableInferred": true
        },
        {
          "name": "allow_item_mixing",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否允许物料混放",
          "nullableInferred": true
        },
        {
          "name": "allow_batch_mixing",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否允许批次混放",
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
    "moduleName": "mes",
    "className": "MesWmWarehouseLocation",
    "businessName": "MES 库区",
    "parentMenuId": "mes-dir",
    "permissionPrefix": "mes:mes_wm_warehouse_location",
    "table": {
      "name": "mes_wm_warehouse_location",
      "comment": "MES 库区",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区编码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "库区名称",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "area",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "面积",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "frozen",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否冻结",
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
