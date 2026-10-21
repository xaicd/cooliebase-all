// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const BPM_TABLES: CodegenConfig[] = [
  {
    "moduleName": "bpm",
    "className": "BpmCategory",
    "businessName": "BPM 流程分类",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_category",
    "table": {
      "name": "bpm_category",
      "comment": "BPM 流程分类",
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
          "comment": "分类名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类标志",
          "nullableInferred": true,
          "queryType": "LIKE"
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分类状态",
          "nullableInferred": true,
          "queryType": "=",
          "enumTerminal": ["ARCHIVED"]
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
    "moduleName": "bpm",
    "className": "BpmForm",
    "businessName": "BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_form",
    "table": {
      "name": "bpm_form",
      "comment": "BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景",
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
          "comment": "表单名",
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
          "name": "conf",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表单的配置",
          "nullableInferred": true
        },
        {
          "name": "fields",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "表单项的数组",
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
    "moduleName": "bpm",
    "className": "BpmOALeave",
    "businessName": "OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 ",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_oaleave",
    "table": {
      "name": "bpm_oa_leave",
      "comment": "OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 ",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "请假表单主键",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "申请人的用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "请假类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "原因",
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
          "name": "day",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "请假天数",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "审批结果",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_instance_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "对应的流程编号",
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
    "moduleName": "bpm",
    "className": "BpmProcessDefinitionInfo",
    "businessName": "BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_process_definition_info",
    "table": {
      "name": "bpm_process_definition_info",
      "comment": "BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表",
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
          "name": "process_definition_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程定义的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程模型的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "流程模型的类型",
          "nullableInferred": true
        },
        {
          "name": "category",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程分类的编码",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "icon",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图标",
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
          "name": "form_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "表单类型",
          "nullableInferred": true
        },
        {
          "name": "form_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "动态表单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "form_conf",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表单的配置",
          "nullableInferred": true
        },
        {
          "name": "form_fields",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "表单项的数组",
          "nullableInferred": true
        },
        {
          "name": "form_custom_create_path",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "自定义表单的提交路径，使用 Vue 的路由地址",
          "nullableInferred": true
        },
        {
          "name": "form_custom_view_path",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "自定义表单的查看路径，使用 Vue 的路由地址",
          "nullableInferred": true
        },
        {
          "name": "simple_model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "SIMPLE 设计器模型数据 json 格式",
          "nullableInferred": true
        },
        {
          "name": "visible",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否可见",
          "nullableInferred": true
        },
        {
          "name": "sort",
          "type": "bigint",
          "tsType": "number",
          "nullable": true,
          "comment": "排序值",
          "nullableInferred": true
        },
        {
          "name": "start_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "可发起用户编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "start_dept_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "可发起部门编号数组",
          "nullableInferred": true
        },
        {
          "name": "manager_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "可管理用户编号数组",
          "nullableInferred": true
        },
        {
          "name": "allow_cancel_running_process",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否允许撤销审批中的申请",
          "nullableInferred": true
        },
        {
          "name": "allow_withdraw_task",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否允许审批人撤回任务",
          "nullableInferred": true
        },
        {
          "name": "process_id_rule",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程 ID 规则",
          "nullableInferred": true
        },
        {
          "name": "auto_approval_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "自动去重类型",
          "nullableInferred": true
        },
        {
          "name": "title_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标题设置",
          "nullableInferred": true
        },
        {
          "name": "summary_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "摘要设置",
          "nullableInferred": true
        },
        {
          "name": "process_before_trigger_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程前置通知设置",
          "nullableInferred": true
        },
        {
          "name": "process_after_trigger_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程后置通知设置",
          "nullableInferred": true
        },
        {
          "name": "task_before_trigger_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务前置通知设置",
          "nullableInferred": true
        },
        {
          "name": "task_after_trigger_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务后置通知设置",
          "nullableInferred": true
        },
        {
          "name": "print_template_setting",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "自定义打印模板设置",
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
    "moduleName": "bpm",
    "className": "BpmProcessExpression",
    "businessName": "BPM 流程表达式",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_process_expression",
    "table": {
      "name": "bpm_process_expression",
      "comment": "BPM 流程表达式",
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
          "comment": "表达式名字",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "表达式状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "expression",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表达式",
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
    "moduleName": "bpm",
    "className": "BpmProcessInstanceCopy",
    "businessName": "流程抄送",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_process_instance_copy",
    "table": {
      "name": "bpm_process_instance_copy",
      "comment": "流程抄送",
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
          "name": "start_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发起人 Id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_instance_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程名",
          "nullableInferred": true
        },
        {
          "name": "process_instance_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程实例的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "process_definition_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程实例的流程定义编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "category",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程分类",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程活动的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "activity_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程活动的名字",
          "nullableInferred": true
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "流程活动的编号",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号（被抄送的用户编号）",
          "nullableInferred": true
        },
        {
          "name": "reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "抄送意见",
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
    "moduleName": "bpm",
    "className": "BpmProcessListener",
    "businessName": "BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_process_listener",
    "table": {
      "name": "bpm_process_listener",
      "comment": "BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "主键 ID，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "监听器名字",
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
          "name": "type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "监听类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "event",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "监听事件",
          "nullableInferred": true
        },
        {
          "name": "value_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "值类型",
          "nullableInferred": true
        },
        {
          "name": "value",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "值",
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
    "moduleName": "bpm",
    "className": "BpmUserGroup",
    "businessName": "BPM 用户组",
    "parentMenuId": "bpm-dir",
    "permissionPrefix": "bpm:bpm_user_group",
    "table": {
      "name": "bpm_user_group",
      "comment": "BPM 用户组",
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
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "组名",
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "成员用户编号数组",
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
  }
]
