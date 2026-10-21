// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const IM_TABLES: CodegenConfig[] = [
  {
    "moduleName": "im",
    "className": "ImChannel",
    "businessName": "IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_channel",
    "table": {
      "name": "im_channel",
      "comment": "IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消",
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
          "comment": "频道业务码",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "频道名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "avatar",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "频道头像",
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
    "moduleName": "im",
    "className": "ImChannelMaterial",
    "businessName": "IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N ",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_channel_material",
    "table": {
      "name": "im_channel_material",
      "comment": "IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N ",
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
          "name": "channel_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "频道编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "素材内容类型",
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
          "name": "cover_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "封面图",
          "nullableInferred": true
        },
        {
          "name": "summary",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "摘要",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "富文本 HTML；在 使用",
          "nullableInferred": true
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "跳转链接；在 使用",
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
    "moduleName": "im",
    "className": "ImChannelMessage",
    "businessName": "IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_channel_message",
    "table": {
      "name": "im_channel_message",
      "comment": "IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于",
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
          "name": "channel_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "频道编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "material_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关联素材编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息内容；推送时 payload 的 JSON 快照",
          "nullableInferred": true
        },
        {
          "name": "receiver_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "接收人编号列表；为空表示全员",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "send_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发送时间",
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
    "moduleName": "im",
    "className": "ImConversationRead",
    "businessName": "IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_conversation_read",
    "table": {
      "name": "im_conversation_read",
      "comment": "IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /",
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
          "name": "conversation_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "会话类型",
          "nullableInferred": true
        },
        {
          "name": "target_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "目标编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "message_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "最大已读消息编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "read_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最近已读时间",
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
    "moduleName": "im",
    "className": "ImFacePack",
    "businessName": "IM 表情包 DO（运营配置的系统表情包元数据）",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_face_pack",
    "table": {
      "name": "im_face_pack",
      "comment": "IM 表情包 DO（运营配置的系统表情包元数据）",
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
          "comment": "表情包名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "icon",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表情包图标",
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
    "moduleName": "im",
    "className": "ImFacePackItem",
    "businessName": "IM 表情包项 DO（系统表情包内的单张表情图）",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_face_pack_item",
    "table": {
      "name": "im_face_pack_item",
      "comment": "IM 表情包项 DO（系统表情包内的单张表情图）",
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
          "name": "pack_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "所属表情包编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表情图 URL",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表情名（可选；如「狗头」「捂脸」）",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "width",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "渲染宽度（像素）",
          "nullableInferred": true
        },
        {
          "name": "height",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "渲染高度（像素）",
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
    "moduleName": "im",
    "className": "ImFaceUserItem",
    "businessName": "IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_face_user_item",
    "table": {
      "name": "im_face_user_item",
      "comment": "IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）",
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
          "comment": "所属用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表情图 URL",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表情名（可选）",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "width",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "渲染宽度（像素）",
          "nullableInferred": true
        },
        {
          "name": "height",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "渲染高度（像素）",
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
    "moduleName": "im",
    "className": "ImFriend",
    "businessName": "IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_friend",
    "table": {
      "name": "im_friend",
      "comment": "IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u",
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
          "name": "friend_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "好友用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "silent",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否免打扰",
          "nullableInferred": true
        },
        {
          "name": "display_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "好友展示备注",
          "nullableInferred": true
        },
        {
          "name": "add_source",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "添加来源",
          "nullableInferred": true
        },
        {
          "name": "pinned",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否置顶联系人",
          "nullableInferred": true
        },
        {
          "name": "blocked",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否拉黑（弱关联 friend，单边屏蔽对方私聊消息）",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "好友状态",
          "nullableInferred": true,
          "queryType": "=",
          "dictType": "im_friend_status"
        },
        {
          "name": "add_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "添加好友时间",
          "nullableInferred": true
        },
        {
          "name": "delete_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "删除好友时间",
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
    "moduleName": "im",
    "className": "ImFriendRequest",
    "businessName": "IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_friend_request",
    "table": {
      "name": "im_friend_request",
      "comment": "IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接",
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
          "name": "from_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发起方用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "to_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "接收方用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "apply_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "申请理由",
          "nullableInferred": true
        },
        {
          "name": "display_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发起方对接收方的备注",
          "nullableInferred": true
        },
        {
          "name": "add_source",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "添加来源",
          "nullableInferred": true
        },
        {
          "name": "handle_result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "处理结果",
          "nullableInferred": true
        },
        {
          "name": "handle_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处理理由（接收方拒绝时可选填）",
          "nullableInferred": true
        },
        {
          "name": "handle_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "处理时间",
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
    "moduleName": "im",
    "className": "ImGroup",
    "businessName": "IM 群信息",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_group",
    "table": {
      "name": "im_group",
      "comment": "IM 群信息",
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
          "comment": "群名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "owner_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群主用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "avatar",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群头像",
          "nullableInferred": true
        },
        {
          "name": "notice",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群公告",
          "nullableInferred": true
        },
        {
          "name": "join_approval",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "进群是否需群主 / 管理员审批",
          "nullableInferred": true
        },
        {
          "name": "banned",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否封禁",
          "nullableInferred": true
        },
        {
          "name": "banned_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "封禁原因",
          "nullableInferred": true
        },
        {
          "name": "banned_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "封禁时间",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "群状态",
          "nullableInferred": true,
          "queryType": "=",
          "dictType": "im_group_status"
        },
        {
          "name": "dissolved_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "解散时间",
          "nullableInferred": true
        },
        {
          "name": "muted_all",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否全群禁言",
          "nullableInferred": true
        },
        {
          "name": "pinned_message_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "群置顶消息编号列表",
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
    "moduleName": "im",
    "className": "ImGroupMember",
    "businessName": "IM 群成员",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_group_member",
    "table": {
      "name": "im_group_member",
      "comment": "IM 群成员",
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
          "name": "group_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群编号",
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
          "name": "display_user_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "组内显示名",
          "nullableInferred": true
        },
        {
          "name": "group_remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群备注",
          "nullableInferred": true
        },
        {
          "name": "silent",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否免打扰",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "成员状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "role",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "成员角色",
          "nullableInferred": true
        },
        {
          "name": "join_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "入群时间",
          "nullableInferred": true
        },
        {
          "name": "add_source",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "加入来源",
          "nullableInferred": true
        },
        {
          "name": "inviter_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "邀请人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "quit_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退群时间",
          "nullableInferred": true
        },
        {
          "name": "mute_end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "禁言到期时间",
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
    "moduleName": "im",
    "className": "ImGroupMessage",
    "businessName": "IM 群聊消息",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_group_message",
    "table": {
      "name": "im_group_message",
      "comment": "IM 群聊消息",
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
          "name": "client_message_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户端消息编号，用于发送幂等",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sender_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发送人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "group_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息内容，JSON 格式",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "send_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发送时间",
          "nullableInferred": true
        },
        {
          "name": "receiver_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "定向接收用户编号列表，以逗号分隔",
          "nullableInferred": true
        },
        {
          "name": "at_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "@ 目标用户编号列表，以逗号分隔",
          "nullableInferred": true
        },
        {
          "name": "receipt_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "回执状态",
          "nullableInferred": true
        },
        {
          "name": "read_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "离线拉取等场景下回算的已读人数",
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
    "moduleName": "im",
    "className": "ImGroupRequest",
    "businessName": "IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_group_request",
    "table": {
      "name": "im_group_request",
      "comment": "IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply",
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
          "name": "group_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "申请人 / 被邀请人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "inviter_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "邀请人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "apply_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "申请理由",
          "nullableInferred": true
        },
        {
          "name": "add_source",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "加入来源",
          "nullableInferred": true
        },
        {
          "name": "handle_result",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "处理结果",
          "nullableInferred": true
        },
        {
          "name": "handle_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处理人用户编号（群主或管理员）",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "handle_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "处理理由（拒绝时可选填）",
          "nullableInferred": true
        },
        {
          "name": "handle_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "处理时间",
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
    "moduleName": "im",
    "className": "ImPrivateMessage",
    "businessName": "IM 私聊消息",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_private_message",
    "table": {
      "name": "im_private_message",
      "comment": "IM 私聊消息",
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
          "name": "client_message_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "客户端消息编号，用于发送幂等",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sender_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发送人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receiver_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "接收人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息内容，JSON 格式",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "receipt_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "回执状态",
          "nullableInferred": true
        },
        {
          "name": "send_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发送时间",
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
    "moduleName": "im",
    "className": "ImRtcCall",
    "businessName": "IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_rtc_call",
    "table": {
      "name": "im_rtc_call",
      "comment": "IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →",
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
          "name": "room",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务通话编号（UUID，同时作为 LiveKit 房间名）；唯一",
          "nullableInferred": true
        },
        {
          "name": "conversation_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "会话类型",
          "nullableInferred": true
        },
        {
          "name": "media_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "媒体类型",
          "nullableInferred": true
        },
        {
          "name": "inviter_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发起人用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "group_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "群编号；私聊为 NULL",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "通话状态",
          "nullableInferred": true,
          "queryType": "=",
          "dictType": "im_rtc_call_status"
        },
        {
          "name": "end_reason",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "结束原因；通话未结束时为 NULL",
          "nullableInferred": true
        },
        {
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发起时间",
          "nullableInferred": true
        },
        {
          "name": "accept_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "接通时间",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "通话结束时间",
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
    "moduleName": "im",
    "className": "ImRtcParticipant",
    "businessName": "IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_rtc_participant",
    "table": {
      "name": "im_rtc_participant",
      "comment": "IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主",
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
          "name": "call_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "通话编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "room",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务通话编号",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "参与者用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "role",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "参与角色",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "参与状态",
          "nullableInferred": true,
          "queryType": "=",
          "dictType": "im_rtc_participant_status"
        },
        {
          "name": "invite_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "被邀请时间；发起人取通话 startTime",
          "nullableInferred": true
        },
        {
          "name": "accept_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "接听时间；未接听 NULL",
          "nullableInferred": true
        },
        {
          "name": "leave_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "离开时间；未加入 NULL",
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
    "moduleName": "im",
    "className": "ImSensitiveWord",
    "businessName": "IM 敏感词",
    "parentMenuId": "im-dir",
    "permissionPrefix": "im:im_sensitive_word",
    "table": {
      "name": "im_sensitive_word",
      "comment": "IM 敏感词",
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
          "name": "word",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "敏感词",
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
  }
]
