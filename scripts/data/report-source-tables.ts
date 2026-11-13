// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const REPORT_TABLES: CodegenConfig[] = [
  {
    "moduleName": "report",
    "className": "GoViewProject",
    "businessName": "GoView 项目表每个大屏图标，对应一个项目",
    "parentMenuId": "report-dir",
    "permissionPrefix": "report:go-view-project",
    "table": {
      "name": "report_go_view_project",
      "comment": "GoView 项目表每个大屏图标，对应一个项目",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号，数据库自增",
          "isPk": true,
          "nullableInferred": true
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
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "预览图片 URL",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "报表内容",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "发布状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "项目备注",
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
