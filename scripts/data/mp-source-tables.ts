// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const MP_TABLES: CodegenConfig[] = [
  {
    "moduleName": "mp",
    "className": "MpAccount",
    "businessName": "公众号账号",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:account",
    "table": {
      "name": "mp_account",
      "comment": "公众号账号",
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
          "comment": "公众号名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "account",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号",
          "nullableInferred": true
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appid",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_secret",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号密钥",
          "nullableInferred": true
        },
        {
          "name": "token",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号token",
          "nullableInferred": true
        },
        {
          "name": "aes_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息加解密密钥",
          "nullableInferred": true
        },
        {
          "name": "qr_code_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "二维码图片 URL",
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
    "moduleName": "mp",
    "className": "MpAutoReply",
    "businessName": "公众号消息自动回复",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:auto-reply",
    "table": {
      "name": "mp_auto_reply",
      "comment": "公众号消息自动回复",
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
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appId",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "回复类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "request_keyword",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "请求的关键字",
          "nullableInferred": true
        },
        {
          "name": "request_match",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "请求的关键字的匹配",
          "nullableInferred": true
        },
        {
          "name": "request_message_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "请求的消息类型",
          "nullableInferred": true
        },
        {
          "name": "response_message_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的消息类型",
          "nullableInferred": true
        },
        {
          "name": "response_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的消息内容",
          "nullableInferred": true
        },
        {
          "name": "response_media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的媒体 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "response_media_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的媒体 URL",
          "nullableInferred": true
        },
        {
          "name": "response_title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的标题",
          "nullableInferred": true
        },
        {
          "name": "response_description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的描述",
          "nullableInferred": true
        },
        {
          "name": "response_thumb_media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的缩略图的媒体 id，通过素材管理中的接口上传多媒体文件，得到的 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "response_thumb_media_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的缩略图的媒体 URL",
          "nullableInferred": true
        },
        {
          "name": "response_articles",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的图文消息",
          "nullableInferred": true
        },
        {
          "name": "response_music_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的音乐链接",
          "nullableInferred": true
        },
        {
          "name": "response_hq_music_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的高质量音乐链接",
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
    "moduleName": "mp",
    "className": "MpMaterial",
    "businessName": "公众号素材 DO1. a href=https://developers.wei",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:material",
    "table": {
      "name": "mp_material",
      "comment": "公众号素材 DO1. a href=https://developers.wei",
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
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appId",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号素材 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文件类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "permanent",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否永久",
          "nullableInferred": true
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文件服务器的 URL",
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "名字",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "mp_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号文件 URL",
          "nullableInferred": true
        },
        {
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "视频素材的标题",
          "nullableInferred": true
        },
        {
          "name": "introduction",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "视频素材的描述",
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
    "moduleName": "mp",
    "className": "MpMenu",
    "businessName": "公众号菜单",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:menu",
    "table": {
      "name": "mp_menu",
      "comment": "公众号菜单",
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
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appId",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "菜单名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "menu_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "菜单标识",
          "nullableInferred": true
        },
        {
          "name": "parent_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "父菜单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "按钮类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "网页链接",
          "nullableInferred": true
        },
        {
          "name": "mini_program_app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "小程序的 appId",
          "nullableInferred": true
        },
        {
          "name": "mini_program_page_path",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "小程序的页面路径",
          "nullableInferred": true
        },
        {
          "name": "article_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "跳转图文的媒体编号",
          "nullableInferred": true
        },
        {
          "name": "reply_message_type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true
        },
        {
          "name": "reply_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的消息内容",
          "nullableInferred": true
        },
        {
          "name": "reply_media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的媒体 id",
          "nullableInferred": true
        },
        {
          "name": "reply_media_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的媒体 URL",
          "nullableInferred": true
        },
        {
          "name": "reply_title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的标题",
          "nullableInferred": true
        },
        {
          "name": "reply_description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的描述",
          "nullableInferred": true
        },
        {
          "name": "reply_thumb_media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的缩略图的媒体 id，通过素材管理中的接口上传多媒体文件，得到的 id",
          "nullableInferred": true
        },
        {
          "name": "reply_thumb_media_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的缩略图的媒体 URL",
          "nullableInferred": true
        },
        {
          "name": "reply_articles",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的图文消息数组",
          "nullableInferred": true
        },
        {
          "name": "reply_music_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的音乐链接",
          "nullableInferred": true
        },
        {
          "name": "reply_hq_music_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复的高质量音乐链接",
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
    "moduleName": "mp",
    "className": "MpMessage",
    "businessName": "公众号消息",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:message",
    "table": {
      "name": "mp_message",
      "comment": "公众号消息",
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
          "name": "msg_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "微信公众号消息 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的 ID",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appid",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号粉丝的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "openid",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号粉丝标志",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "send_from",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息来源",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息内容",
          "nullableInferred": true
        },
        {
          "name": "media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "媒体文件的编号",
          "nullableInferred": true
        },
        {
          "name": "media_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "媒体文件的 URL",
          "nullableInferred": true
        },
        {
          "name": "recognition",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "语音识别后文本",
          "nullableInferred": true
        },
        {
          "name": "format",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "语音格式，如 amr，speex 等",
          "nullableInferred": true
        },
        {
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标题",
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
          "name": "thumb_media_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "缩略图的媒体 id，通过素材管理中的接口上传多媒体文件，得到的 id",
          "nullableInferred": true
        },
        {
          "name": "thumb_media_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "缩略图的媒体 URL",
          "nullableInferred": true
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "点击图文消息跳转链接",
          "nullableInferred": true
        },
        {
          "name": "location_x",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "地理位置维度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "location_y",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "地理位置经度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "scale",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "地图缩放大小",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "label",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "详细地址",
          "nullableInferred": true
        },
        {
          "name": "articles",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "图文消息数组",
          "nullableInferred": true
        },
        {
          "name": "music_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "音乐链接",
          "nullableInferred": true
        },
        {
          "name": "hq_music_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "高质量音乐链接",
          "nullableInferred": true
        },
        {
          "name": "event",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "事件类型",
          "nullableInferred": true
        },
        {
          "name": "event_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "事件 Key",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图片链接",
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
    "moduleName": "mp",
    "className": "MpMessageTemplate",
    "businessName": "公众号模版消息",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:message-template",
    "table": {
      "name": "mp_message_template",
      "comment": "公众号模版消息",
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
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appId",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号模板 ID",
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
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模板内容",
          "nullableInferred": true
        },
        {
          "name": "example",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模板示例",
          "nullableInferred": true
        },
        {
          "name": "primary_industry",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模板所属行业的一级行业",
          "nullableInferred": true
        },
        {
          "name": "deputy_industry",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模板所属行业的二级行业",
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
    "moduleName": "mp",
    "className": "MpTag",
    "businessName": "公众号标签",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:tag",
    "table": {
      "name": "mp_tag",
      "comment": "公众号标签",
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
          "name": "tag_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号标签 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标签名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "此标签下粉丝数",
          "nullableInferred": true
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appId",
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
    "moduleName": "mp",
    "className": "MpUser",
    "businessName": "微信公众号粉丝",
    "parentMenuId": "mp-dir",
    "permissionPrefix": "mp:user",
    "table": {
      "name": "mp_user",
      "comment": "微信公众号粉丝",
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
          "name": "openid",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "粉丝标识",
          "nullableInferred": true
        },
        {
          "name": "union_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "微信生态唯一标识",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "subscribe_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "关注状态",
          "nullableInferred": true
        },
        {
          "name": "subscribe_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "关注时间",
          "nullableInferred": true
        },
        {
          "name": "unsubscribe_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "取消关注时间",
          "nullableInferred": true
        },
        {
          "name": "nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "昵称",
          "nullableInferred": true
        },
        {
          "name": "head_image_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "头像地址",
          "nullableInferred": true
        },
        {
          "name": "language",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "语言",
          "nullableInferred": true
        },
        {
          "name": "country",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "国家",
          "nullableInferred": true
        },
        {
          "name": "province",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "省份",
          "nullableInferred": true
        },
        {
          "name": "city",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "城市",
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
          "name": "tag_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "标签编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "account_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号账号的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "app_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "公众号 appId",
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
