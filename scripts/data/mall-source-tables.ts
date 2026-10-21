// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const MALL_TABLES: CodegenConfig[] = [
  {
    "moduleName": "mall",
    "className": "ProductBrand",
    "businessName": "商品品牌",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_brand",
    "table": {
      "name": "product_brand",
      "comment": "商品品牌",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "品牌编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "品牌名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "品牌图片",
          "nullableInferred": true
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "品牌排序",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "品牌描述",
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
    "moduleName": "mall",
    "className": "ProductBrowseHistory",
    "businessName": "商品浏览记录",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_browse_history",
    "table": {
      "name": "product_browse_history",
      "comment": "商品浏览记录",
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
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
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
          "name": "user_deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "用户是否删除",
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
    "moduleName": "mall",
    "className": "ProductCategory",
    "businessName": "商品分类",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_category",
    "table": {
      "name": "product_category",
      "comment": "商品分类",
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
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "移动端分类图",
          "nullableInferred": true
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
    "moduleName": "mall",
    "className": "ProductComment",
    "businessName": "商品评论",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_comment",
    "table": {
      "name": "product_comment",
      "comment": "商品评论",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "评论编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "评价人的用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "评价人名称",
          "nullableInferred": true
        },
        {
          "name": "user_avatar",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "评价人头像",
          "nullableInferred": true
        },
        {
          "name": "anonymous",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否匿名",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "交易订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "交易订单项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 名称",
          "nullableInferred": true
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 图片地址",
          "nullableInferred": true
        },
        {
          "name": "sku_properties",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "属性数组，JSON 格式",
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
          "name": "scores",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "评分星级",
          "nullableInferred": true
        },
        {
          "name": "description_scores",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "描述星级",
          "nullableInferred": true
        },
        {
          "name": "benefit_scores",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "服务星级",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "评论内容",
          "nullableInferred": true
        },
        {
          "name": "pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "评论图片地址数组",
          "nullableInferred": true
        },
        {
          "name": "reply_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "商家是否回复",
          "nullableInferred": true
        },
        {
          "name": "reply_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复管理员编号",
          "nullableInferred": true
        },
        {
          "name": "reply_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商家回复内容",
          "nullableInferred": true
        },
        {
          "name": "reply_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "商家回复时间",
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
    "moduleName": "mall",
    "className": "ProductFavorite",
    "businessName": "商品收藏",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_favorite",
    "table": {
      "name": "product_favorite",
      "comment": "商品收藏",
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
          "comment": "商品 SPU 编号",
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
    "moduleName": "mall",
    "className": "ProductProperty",
    "businessName": "商品属性项",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_property",
    "table": {
      "name": "product_property",
      "comment": "商品属性项",
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
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
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
    "moduleName": "mall",
    "className": "ProductPropertyValue",
    "businessName": "商品属性值",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_property_value",
    "table": {
      "name": "product_property_value",
      "comment": "商品属性值",
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
          "name": "property_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性项的编号",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
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
    "moduleName": "mall",
    "className": "ProductSku",
    "businessName": "商品 SKU",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_sku",
    "table": {
      "name": "product_sku",
      "comment": "商品 SKU",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "商品 SKU 编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "properties",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "属性数组，JSON 格式",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品价格，单位：分",
          "nullableInferred": true
        },
        {
          "name": "market_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "市场价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "cost_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "成本价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "bar_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品条码",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图片地址",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "库存",
          "nullableInferred": true
        },
        {
          "name": "weight",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "商品重量，单位：kg 千克",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "volume",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "商品体积，单位：m^3 平米",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "first_brokerage_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "一级分销的佣金，单位：分",
          "nullableInferred": true
        },
        {
          "name": "second_brokerage_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "二级分销的佣金，单位：分",
          "nullableInferred": true
        },
        {
          "name": "sales_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品销量",
          "nullableInferred": true
        },
        {
          "name": "property_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "property_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性名字",
          "nullableInferred": true
        },
        {
          "name": "value_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性值编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "value_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性值名字",
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
    "moduleName": "mall",
    "className": "ProductSpu",
    "businessName": "商品 SPU",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_spu",
    "table": {
      "name": "product_spu",
      "comment": "商品 SPU",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "商品 SPU 编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "keyword",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关键字",
          "nullableInferred": true
        },
        {
          "name": "introduction",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品简介",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品详情",
          "nullableInferred": true
        },
        {
          "name": "category_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品分类编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "brand_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品品牌编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品封面图",
          "nullableInferred": true
        },
        {
          "name": "slider_pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "商品轮播图",
          "nullableInferred": true
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排序字段",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spec_type",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "规格类型",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品价格，单位使用：分",
          "nullableInferred": true
        },
        {
          "name": "market_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "市场价，单位使用：分",
          "nullableInferred": true
        },
        {
          "name": "cost_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "成本价，单位使用：分",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "库存",
          "nullableInferred": true
        },
        {
          "name": "delivery_types",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "配送方式数组",
          "nullableInferred": true
        },
        {
          "name": "delivery_template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "物流配置模板编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "give_integral",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "赠送积分",
          "nullableInferred": true
        },
        {
          "name": "sub_commission_type",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "分销类型",
          "nullableInferred": true
        },
        {
          "name": "sales_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品销量",
          "nullableInferred": true
        },
        {
          "name": "virtual_sales_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "虚拟销量",
          "nullableInferred": true
        },
        {
          "name": "browse_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "浏览量",
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
    "moduleName": "mall",
    "className": "ProductStatistics",
    "businessName": "商品统计",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:product_statistics",
    "table": {
      "name": "product_statistics",
      "comment": "商品统计",
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
          "name": "time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "统计日期",
          "nullableInferred": true
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "browse_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "浏览量",
          "nullableInferred": true
        },
        {
          "name": "browse_user_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "访客量",
          "nullableInferred": true
        },
        {
          "name": "favorite_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "收藏数量",
          "nullableInferred": true
        },
        {
          "name": "cart_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "加购数量",
          "nullableInferred": true
        },
        {
          "name": "order_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "下单件数",
          "nullableInferred": true
        },
        {
          "name": "order_pay_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付件数",
          "nullableInferred": true
        },
        {
          "name": "order_pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "after_sale_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款件数",
          "nullableInferred": true
        },
        {
          "name": "after_sale_refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "browse_convert_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "访客支付转化率（百分比）",
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
    "moduleName": "mall",
    "className": "Article",
    "businessName": "文章管理",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:article",
    "table": {
      "name": "promotion_article",
      "comment": "文章管理",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "文章管理编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "category_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "分类编号 ArticleCategoryDO#id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "关联商品编号 ProductSpuDO#id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文章标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "author",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文章作者",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文章封面图片地址",
          "nullableInferred": true
        },
        {
          "name": "introduction",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文章简介",
          "nullableInferred": true
        },
        {
          "name": "browse_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "浏览次数",
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
          "name": "recommend_hot",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否热门(小程序)",
          "nullableInferred": true
        },
        {
          "name": "recommend_banner",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否轮播图(小程序)",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文章内容",
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
    "moduleName": "mall",
    "className": "ArticleCategory",
    "businessName": "文章分类",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:article_category",
    "table": {
      "name": "promotion_article_category",
      "comment": "文章分类",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "文章分类编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文章分类名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图标地址",
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
    "moduleName": "mall",
    "className": "Banner",
    "businessName": "banner",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:banner",
    "table": {
      "name": "promotion_banner",
      "comment": "banner",
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
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "跳转链接",
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
          "name": "position",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "定位",
          "nullableInferred": true
        },
        {
          "name": "memo",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "browse_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "点击次数",
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
    "moduleName": "mall",
    "className": "BargainActivity",
    "businessName": "砍价活动",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:bargain_activity",
    "table": {
      "name": "promotion_bargain_activity",
      "comment": "砍价活动",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "砍价活动编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "砍价活动名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动开始时间",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动结束时间",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "活动状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "bargain_first_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价起始价格，单位：分",
          "nullableInferred": true
        },
        {
          "name": "bargain_min_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价底价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价库存(剩余库存砍价时扣减)",
          "nullableInferred": true
        },
        {
          "name": "total_stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价总库存",
          "nullableInferred": true
        },
        {
          "name": "help_max_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价人数",
          "nullableInferred": true
        },
        {
          "name": "bargain_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "帮砍次数",
          "nullableInferred": true
        },
        {
          "name": "total_limit_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "总限购数量",
          "nullableInferred": true
        },
        {
          "name": "random_min_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户每次砍价的最小金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "random_max_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户每次砍价的最大金额，单位：分",
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
    "moduleName": "mall",
    "className": "BargainHelp",
    "businessName": "砍价助力",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:bargain_help",
    "table": {
      "name": "promotion_bargain_help",
      "comment": "砍价助力",
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
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "砍价活动编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "record_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "砍价记录编号",
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
          "name": "reduce_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "减少价格，单位：分",
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
    "moduleName": "mall",
    "className": "BargainRecord",
    "businessName": "砍价记录 DO TO",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:bargain_record",
    "table": {
      "name": "promotion_bargain_record",
      "comment": "砍价记录 DO TO",
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
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "砍价活动编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "bargain_first_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价起始价格，单位：分",
          "nullableInferred": true
        },
        {
          "name": "bargain_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "当前砍价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "砍价状态",
          "nullableInferred": true,
          "queryType": "="
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
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单编号",
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
    "moduleName": "mall",
    "className": "CombinationActivity",
    "businessName": "拼团活动",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:combination_activity",
    "table": {
      "name": "promotion_combination_activity",
      "comment": "拼团活动",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "活动编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "拼团名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "total_limit_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "总限购数量",
          "nullableInferred": true
        },
        {
          "name": "single_limit_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "单次限购数量",
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
          "name": "user_size",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "几人团",
          "nullableInferred": true
        },
        {
          "name": "virtual_group",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "虚拟成团",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "活动状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "limit_duration",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "限制时长（小时）",
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
    "moduleName": "mall",
    "className": "CombinationProduct",
    "businessName": "拼团商品",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:combination_product",
    "table": {
      "name": "promotion_combination_product",
      "comment": "拼团商品",
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
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "拼团活动编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "combination_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "拼团价格，单位分",
          "nullableInferred": true
        },
        {
          "name": "activity_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "拼团商品状态",
          "nullableInferred": true
        },
        {
          "name": "activity_start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动开始时间点",
          "nullableInferred": true
        },
        {
          "name": "activity_end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动结束时间点",
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
    "moduleName": "mall",
    "className": "CombinationRecord",
    "businessName": "拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:combination_record",
    "table": {
      "name": "promotion_combination_record",
      "comment": "拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人",
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
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "拼团活动编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "combination_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "拼团商品单价",
          "nullableInferred": true
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品名字",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品图片",
          "nullableInferred": true
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "购买的商品数量",
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
          "name": "nickname",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
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
          "name": "head_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "团长编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "开团状态",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单编号",
          "nullableInferred": true
        },
        {
          "name": "user_size",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "开团需要人数",
          "nullableInferred": true
        },
        {
          "name": "user_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "已加入拼团人数",
          "nullableInferred": true
        },
        {
          "name": "virtual_group",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否虚拟成团",
          "nullableInferred": true
        },
        {
          "name": "expire_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "过期时间",
          "nullableInferred": true
        },
        {
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "开始时间 (订单付款后开始的时间)",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "结束时间（成团时间/失败时间）",
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
    "moduleName": "mall",
    "className": "Coupon",
    "businessName": "优惠劵",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:coupon",
    "table": {
      "name": "promotion_coupon",
      "comment": "优惠劵",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "优惠劵编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "优惠劵模板编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "优惠劵名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠码状态",
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
          "name": "take_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "领取类型",
          "nullableInferred": true
        },
        {
          "name": "use_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "是否设置满多少金额可用，单位：分",
          "nullableInferred": true
        },
        {
          "name": "valid_start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "生效开始时间",
          "nullableInferred": true
        },
        {
          "name": "valid_end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "生效结束时间",
          "nullableInferred": true
        },
        {
          "name": "product_scope",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品范围",
          "nullableInferred": true
        },
        {
          "name": "product_scope_values",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "商品范围编号的数组",
          "nullableInferred": true
        },
        {
          "name": "discount_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣类型",
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣百分比",
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "discount_limit_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣上限，仅在 等于 时生效",
          "nullableInferred": true
        },
        {
          "name": "use_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "使用订单号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "use_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "使用时间",
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
    "moduleName": "mall",
    "className": "CouponTemplate",
    "businessName": "优惠劵模板 DO当用户领取时，会生成 优惠劵",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:coupon_template",
    "table": {
      "name": "promotion_coupon_template",
      "comment": "优惠劵模板 DO当用户领取时，会生成 优惠劵",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "模板编号，自增唯一",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "优惠劵名",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "优惠券说明",
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
          "name": "total_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "发放数量",
          "nullableInferred": true
        },
        {
          "name": "take_limit_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "每人限领个数",
          "nullableInferred": true
        },
        {
          "name": "take_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "领取方式",
          "nullableInferred": true
        },
        {
          "name": "use_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "是否设置满多少金额可用，单位：分",
          "nullableInferred": true
        },
        {
          "name": "product_scope",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品范围",
          "nullableInferred": true
        },
        {
          "name": "product_scope_values",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "商品范围编号的数组",
          "nullableInferred": true
        },
        {
          "name": "validity_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "生效日期类型",
          "nullableInferred": true
        },
        {
          "name": "valid_start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "固定日期 - 生效开始时间",
          "nullableInferred": true
        },
        {
          "name": "valid_end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "固定日期 - 生效结束时间",
          "nullableInferred": true
        },
        {
          "name": "fixed_start_term",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "领取日期 - 开始天数",
          "nullableInferred": true
        },
        {
          "name": "fixed_end_term",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "领取日期 - 结束天数",
          "nullableInferred": true
        },
        {
          "name": "discount_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣类型",
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣百分比",
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "discount_limit_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣上限，仅在 等于 时生效",
          "nullableInferred": true
        },
        {
          "name": "take_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "领取优惠券的数量",
          "nullableInferred": true
        },
        {
          "name": "use_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "使用优惠券的次数",
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
    "moduleName": "mall",
    "className": "DiscountActivity",
    "businessName": "限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:discount_activity",
    "table": {
      "name": "promotion_discount_activity",
      "comment": "限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "活动编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "活动标题",
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
    "moduleName": "mall",
    "className": "DiscountProduct",
    "businessName": "限时折扣商品",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:discount_product",
    "table": {
      "name": "promotion_discount_product",
      "comment": "限时折扣商品",
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
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "限时折扣活动的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "discount_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣类型",
          "nullableInferred": true
        },
        {
          "name": "discount_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "折扣百分比",
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "activity_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "活动标题",
          "nullableInferred": true
        },
        {
          "name": "activity_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "活动状态",
          "nullableInferred": true
        },
        {
          "name": "activity_start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动开始时间点",
          "nullableInferred": true
        },
        {
          "name": "activity_end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动结束时间点",
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
    "moduleName": "mall",
    "className": "DiyPage",
    "businessName": "装修页面",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:diy_page",
    "table": {
      "name": "promotion_diy_page",
      "comment": "装修页面",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "装修页面编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "装修模板编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "页面名称",
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
          "name": "preview_pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "预览图，多个逗号分隔",
          "nullableInferred": true
        },
        {
          "name": "property",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "页面属性，JSON 格式",
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
    "moduleName": "mall",
    "className": "DiyTemplate",
    "businessName": "装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. ",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:diy_template",
    "table": {
      "name": "promotion_diy_template",
      "comment": "装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. ",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "装修模板编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模板名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "used",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否使用",
          "nullableInferred": true
        },
        {
          "name": "used_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "使用时间",
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
          "name": "preview_pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "预览图",
          "nullableInferred": true
        },
        {
          "name": "property",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "uni-app 底部导航属性，JSON 格式",
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
    "moduleName": "mall",
    "className": "KeFuConversation",
    "businessName": "客服会话",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:ke_fu_conversation",
    "table": {
      "name": "promotion_kefu_conversation",
      "comment": "客服会话",
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
          "comment": "会话所属用户",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "last_message_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "最后聊天时间",
          "nullableInferred": true
        },
        {
          "name": "last_message_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "最后聊天内容",
          "nullableInferred": true
        },
        {
          "name": "last_message_content_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "最后发送的消息类型",
          "nullableInferred": true
        },
        {
          "name": "admin_pinned",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "管理端置顶",
          "nullableInferred": true
        },
        {
          "name": "user_deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "用户是否可见",
          "nullableInferred": true
        },
        {
          "name": "admin_deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "管理员是否可见",
          "nullableInferred": true
        },
        {
          "name": "admin_unread_message_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "管理员未读消息数",
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
    "moduleName": "mall",
    "className": "KeFuMessage",
    "businessName": "客服消息",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:ke_fu_message",
    "table": {
      "name": "promotion_kefu_message",
      "comment": "客服消息",
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
          "name": "conversation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "会话编号",
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
          "name": "sender_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "发送人类型",
          "nullableInferred": true
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
          "name": "receiver_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "接收人类型",
          "nullableInferred": true
        },
        {
          "name": "content_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息",
          "nullableInferred": true
        },
        {
          "name": "read_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是/否已读",
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
    "moduleName": "mall",
    "className": "PointActivity",
    "businessName": "积分商城活动",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:point_activity",
    "table": {
      "name": "promotion_point_activity",
      "comment": "积分商城活动",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "积分商城活动编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "积分商城活动商品",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "活动状态",
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
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排序",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分商城活动库存(剩余库存积分兑换时扣减)",
          "nullableInferred": true
        },
        {
          "name": "total_stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分商城活动总库存",
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
    "moduleName": "mall",
    "className": "PointProduct",
    "businessName": "积分商城商品",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:point_product",
    "table": {
      "name": "promotion_point_product",
      "comment": "积分商城商品",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "积分商城商品编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "积分商城活动 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "可兑换次数",
          "nullableInferred": true
        },
        {
          "name": "point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所需兑换积分",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "所需兑换金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分商城商品库存",
          "nullableInferred": true
        },
        {
          "name": "activity_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分商城商品状态",
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
    "moduleName": "mall",
    "className": "RewardActivity",
    "businessName": "满减送活动",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:reward_activity",
    "table": {
      "name": "promotion_reward_activity",
      "comment": "满减送活动",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "活动编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "活动标题",
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
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "condition_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "条件类型",
          "nullableInferred": true
        },
        {
          "name": "product_scope",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品范围",
          "nullableInferred": true
        },
        {
          "name": "product_scope_values",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号的数组",
          "nullableInferred": true
        },
        {
          "name": "rules",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "优惠规则的数组",
          "nullableInferred": true
        },
        {
          "name": "limit",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠门槛",
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠价格，单位：分",
          "nullableInferred": true
        },
        {
          "name": "free_delivery",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否包邮",
          "nullableInferred": true
        },
        {
          "name": "point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "赠送的积分",
          "nullableInferred": true
        },
        {
          "name": "give_coupon_template_counts",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "赠送的优惠劵",
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
    "moduleName": "mall",
    "className": "SeckillActivity",
    "businessName": "秒杀活动",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:seckill_activity",
    "table": {
      "name": "promotion_seckill_activity",
      "comment": "秒杀活动",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "秒杀活动编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀活动商品",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀活动名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "活动状态",
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
          "name": "start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动开始时间",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动结束时间",
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
          "name": "config_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀时段 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "total_limit_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "总限购数量",
          "nullableInferred": true
        },
        {
          "name": "single_limit_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "单次限够数量",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "秒杀库存(剩余库存秒杀时扣减)",
          "nullableInferred": true
        },
        {
          "name": "total_stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "秒杀总库存",
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
    "moduleName": "mall",
    "className": "SeckillConfig",
    "businessName": "秒杀时段",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:seckill_config",
    "table": {
      "name": "promotion_seckill_config",
      "comment": "秒杀时段",
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
          "comment": "秒杀时段名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "start_time",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "开始时间点",
          "nullableInferred": true
        },
        {
          "name": "end_time",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "结束时间点",
          "nullableInferred": true
        },
        {
          "name": "slider_pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀轮播图",
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
    "moduleName": "mall",
    "className": "SeckillProduct",
    "businessName": "秒杀参与商品",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:seckill_product",
    "table": {
      "name": "promotion_seckill_product",
      "comment": "秒杀参与商品",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "秒杀参与商品编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀活动 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "config_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀时段 id",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "seckill_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "秒杀金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "stock",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "秒杀库存",
          "nullableInferred": true
        },
        {
          "name": "activity_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "秒杀商品状态",
          "nullableInferred": true
        },
        {
          "name": "activity_start_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动开始时间点",
          "nullableInferred": true
        },
        {
          "name": "activity_end_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "活动结束时间点",
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
    "moduleName": "mall",
    "className": "AfterSale",
    "businessName": "售后订单，用于处理 交易订单的退款退货流程",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:after_sale",
    "table": {
      "name": "trade_after_sale",
      "comment": "售后订单，用于处理 交易订单的退款退货流程",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "售后编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "售后单号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "way",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "售后方式",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "售后类型",
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
          "name": "apply_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "申请原因",
          "nullableInferred": true
        },
        {
          "name": "apply_description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "补充描述",
          "nullableInferred": true
        },
        {
          "name": "apply_pic_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "补充凭证图片",
          "nullableInferred": true
        },
        {
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "交易订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "order_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单流水号",
          "nullableInferred": true
        },
        {
          "name": "order_item_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "交易订单项编号",
          "nullableInferred": true
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true
        },
        {
          "name": "spu_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 名称",
          "nullableInferred": true
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true
        },
        {
          "name": "properties",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "属性数组，JSON 格式",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品图片",
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退货商品数量",
          "nullableInferred": true
        },
        {
          "name": "audit_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "审批时间",
          "nullableInferred": true
        },
        {
          "name": "audit_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "审批人",
          "nullableInferred": true
        },
        {
          "name": "audit_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "审批备注",
          "nullableInferred": true
        },
        {
          "name": "refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款金额，单位：分。",
          "nullableInferred": true
        },
        {
          "name": "pay_refund_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付退款编号",
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
          "name": "logistics_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货物流公司编号",
          "nullableInferred": true
        },
        {
          "name": "logistics_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "退货物流单号",
          "nullableInferred": true
        },
        {
          "name": "delivery_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "退货时间",
          "nullableInferred": true
        },
        {
          "name": "receive_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "收货时间",
          "nullableInferred": true
        },
        {
          "name": "receive_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收货备注",
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
    "moduleName": "mall",
    "className": "AfterSaleLog",
    "businessName": "交易售后日志",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:after_sale_log",
    "table": {
      "name": "trade_after_sale_log",
      "comment": "交易售后日志",
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
          "name": "user_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户类型",
          "nullableInferred": true
        },
        {
          "name": "after_sale_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "售后编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "before_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作前状态",
          "nullableInferred": true
        },
        {
          "name": "after_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作后状态",
          "nullableInferred": true
        },
        {
          "name": "operate_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作类型",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "操作明细",
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
    "moduleName": "mall",
    "className": "BrokerageRecord",
    "businessName": "佣金记录",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:brokerage_record",
    "table": {
      "name": "trade_brokerage_record",
      "comment": "佣金记录",
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
          "name": "biz_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "业务编号",
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
          "comment": "标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "说明",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "金额",
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "当前总佣金",
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
          "name": "frozen_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "冻结时间（天）",
          "nullableInferred": true
        },
        {
          "name": "unfreeze_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "解冻时间",
          "nullableInferred": true
        },
        {
          "name": "source_user_level",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "来源用户等级",
          "nullableInferred": true
        },
        {
          "name": "source_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "来源用户编号",
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
    "moduleName": "mall",
    "className": "BrokerageUser",
    "businessName": "分销用户",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:brokerage_user",
    "table": {
      "name": "trade_brokerage_user",
      "comment": "分销用户",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "用户编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "bind_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "推广员编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "bind_user_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "推广员绑定时间",
          "nullableInferred": true
        },
        {
          "name": "brokerage_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否有分销资格",
          "nullableInferred": true
        },
        {
          "name": "brokerage_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "成为分销员时间",
          "nullableInferred": true
        },
        {
          "name": "brokerage_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "可用佣金",
          "nullableInferred": true
        },
        {
          "name": "frozen_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "冻结佣金",
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
    "moduleName": "mall",
    "className": "BrokerageWithdraw",
    "businessName": "佣金提现",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:brokerage_withdraw",
    "table": {
      "name": "trade_brokerage_withdraw",
      "comment": "佣金提现",
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
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提现金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "fee_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提现手续费，单位：分",
          "nullableInferred": true
        },
        {
          "name": "total_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "当前总佣金，单位：分",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "提现类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "提现姓名",
          "nullableInferred": true
        },
        {
          "name": "user_account",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "提现账号",
          "nullableInferred": true
        },
        {
          "name": "qr_code_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收款码",
          "nullableInferred": true
        },
        {
          "name": "bank_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "银行名称",
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
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "audit_reason",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "审核驳回原因",
          "nullableInferred": true
        },
        {
          "name": "audit_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "审核时间",
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
    "moduleName": "mall",
    "className": "Cart",
    "businessName": "购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:cart",
    "table": {
      "name": "trade_cart",
      "comment": "购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号，唯一自增",
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
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品购买数量",
          "nullableInferred": true
        },
        {
          "name": "selected",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否选中",
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
    "moduleName": "mall",
    "className": "TradeConfig",
    "businessName": "交易中心配置",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:trade_config",
    "table": {
      "name": "trade_config",
      "comment": "交易中心配置",
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
          "name": "after_sale_refund_reasons",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "售后的退款理由",
          "nullableInferred": true
        },
        {
          "name": "after_sale_return_reasons",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "售后的退货理由",
          "nullableInferred": true
        },
        {
          "name": "delivery_express_free_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否启用全场包邮",
          "nullableInferred": true
        },
        {
          "name": "delivery_express_free_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "全场包邮的最小金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "delivery_pick_up_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否开启自提",
          "nullableInferred": true
        },
        {
          "name": "brokerage_enabled",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否启用分佣",
          "nullableInferred": true
        },
        {
          "name": "brokerage_enabled_condition",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分佣模式",
          "nullableInferred": true
        },
        {
          "name": "brokerage_bind_mode",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分销关系绑定模式",
          "nullableInferred": true
        },
        {
          "name": "brokerage_poster_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "分销海报图地址数组",
          "nullableInferred": true
        },
        {
          "name": "brokerage_first_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "一级返佣比例",
          "nullableInferred": true
        },
        {
          "name": "brokerage_second_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "二级返佣比例",
          "nullableInferred": true
        },
        {
          "name": "brokerage_withdraw_min_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户提现最低金额",
          "nullableInferred": true
        },
        {
          "name": "brokerage_withdraw_fee_percent",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户提现手续费百分比",
          "nullableInferred": true
        },
        {
          "name": "brokerage_frozen_days",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "佣金冻结时间(天)",
          "nullableInferred": true
        },
        {
          "name": "brokerage_withdraw_types",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "提现方式",
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
    "moduleName": "mall",
    "className": "DeliveryExpress",
    "businessName": "快递公司",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:delivery_express",
    "table": {
      "name": "trade_delivery_express",
      "comment": "快递公司",
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
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "快递公司 code",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "快递公司名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "logo",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "快递公司 logo",
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
    "moduleName": "mall",
    "className": "DeliveryExpressTemplate",
    "businessName": "快递运费模板",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:delivery_express_template",
    "table": {
      "name": "trade_delivery_express_template",
      "comment": "快递运费模板",
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
          "comment": "模板名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "charge_mode",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "配送计费方式",
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
    "moduleName": "mall",
    "className": "DeliveryExpressTemplateCharge",
    "businessName": "快递运费模板计费配置",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:delivery_express_template_charge",
    "table": {
      "name": "trade_delivery_express_template_charge",
      "comment": "快递运费模板计费配置",
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
          "name": "template_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "配送模板编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "area_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "配送区域编号列表",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "charge_mode",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "配送计费方式",
          "nullableInferred": true
        },
        {
          "name": "start_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "首件数量(件数,重量，或体积)",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "start_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "起步价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "extra_count",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "续件数量(件, 重量，或体积)",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "extra_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "额外价，单位：分",
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
    "moduleName": "mall",
    "className": "DeliveryExpressTemplateFree",
    "businessName": "快递运费模板包邮配置",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:delivery_express_template_free",
    "table": {
      "name": "trade_delivery_express_template_free",
      "comment": "快递运费模板包邮配置",
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
          "comment": "配送模板编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "area_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "配送区域编号列表",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "free_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "包邮金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "free_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "包邮件数",
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
    "moduleName": "mall",
    "className": "DeliveryPickUpStore",
    "businessName": "自提门店",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:delivery_pick_up_store",
    "table": {
      "name": "trade_delivery_pick_up_store",
      "comment": "自提门店",
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
          "comment": "门店名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "introduction",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "门店简介",
          "nullableInferred": true
        },
        {
          "name": "phone",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "门店手机",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "area_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "区域编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "detail_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "门店详细地址",
          "nullableInferred": true
        },
        {
          "name": "logo",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "门店 logo",
          "nullableInferred": true
        },
        {
          "name": "opening_time",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "营业开始时间",
          "nullableInferred": true
        },
        {
          "name": "closing_time",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "营业结束时间",
          "nullableInferred": true
        },
        {
          "name": "latitude",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "纬度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "longitude",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "经度",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "verify_user_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "核销员工用户编号数组",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "门店状态",
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
    "moduleName": "mall",
    "className": "TradeOrder",
    "businessName": "交易订单",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:trade_order",
    "table": {
      "name": "trade_order",
      "comment": "交易订单",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "订单编号，主键自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单流水号",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "订单类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "terminal",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "订单来源",
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
          "name": "user_ip",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户 IP",
          "nullableInferred": true
        },
        {
          "name": "user_remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户备注",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "订单状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "product_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "购买的商品数量",
          "nullableInferred": true
        },
        {
          "name": "finish_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "订单完成时间",
          "nullableInferred": true
        },
        {
          "name": "cancel_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "订单取消时间",
          "nullableInferred": true
        },
        {
          "name": "cancel_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "取消类型",
          "nullableInferred": true
        },
        {
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商家备注",
          "nullableInferred": true
        },
        {
          "name": "comment_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否评价",
          "nullableInferred": true
        },
        {
          "name": "brokerage_user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "推广人编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "pay_order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "支付订单编号",
          "nullableInferred": true
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
          "name": "total_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品原价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "delivery_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "运费金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "adjust_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "订单调价，单位：分",
          "nullableInferred": true
        },
        {
          "name": "pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "应付金额（总），单位：分",
          "nullableInferred": true
        },
        {
          "name": "delivery_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "配送方式",
          "nullableInferred": true
        },
        {
          "name": "logistics_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发货物流公司编号",
          "nullableInferred": true
        },
        {
          "name": "logistics_no",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "发货物流单号",
          "nullableInferred": true
        },
        {
          "name": "delivery_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "发货时间",
          "nullableInferred": true
        },
        {
          "name": "receive_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "收货时间",
          "nullableInferred": true
        },
        {
          "name": "receiver_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收件人名称",
          "nullableInferred": true
        },
        {
          "name": "receiver_mobile",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收件人手机",
          "nullableInferred": true
        },
        {
          "name": "receiver_area_id",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "收件人地区编号",
          "nullableInferred": true
        },
        {
          "name": "receiver_detail_address",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "收件人详细地址",
          "nullableInferred": true
        },
        {
          "name": "pick_up_store_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "自提门店编号",
          "nullableInferred": true
        },
        {
          "name": "pick_up_verify_code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "自提核销码",
          "nullableInferred": true
        },
        {
          "name": "refund_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "售后状态",
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
          "name": "coupon_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "优惠劵编号",
          "nullableInferred": true
        },
        {
          "name": "coupon_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠劵减免金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "use_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "使用的积分",
          "nullableInferred": true
        },
        {
          "name": "point_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分抵扣的金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "give_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "赠送的积分",
          "nullableInferred": true
        },
        {
          "name": "refund_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退还的使用的积分",
          "nullableInferred": true
        },
        {
          "name": "vip_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "VIP 减免金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "give_coupon_template_counts",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "赠送的优惠劵",
          "nullableInferred": true
        },
        {
          "name": "give_coupon_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "赠送的优惠劵编号",
          "nullableInferred": true
        },
        {
          "name": "seckill_activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "秒杀活动编号",
          "nullableInferred": true
        },
        {
          "name": "bargain_activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "砍价活动编号",
          "nullableInferred": true
        },
        {
          "name": "bargain_record_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "砍价记录编号",
          "nullableInferred": true
        },
        {
          "name": "combination_activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "拼团活动编号",
          "nullableInferred": true
        },
        {
          "name": "combination_head_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "拼团团长编号",
          "nullableInferred": true
        },
        {
          "name": "combination_record_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "拼团记录编号",
          "nullableInferred": true
        },
        {
          "name": "point_activity_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "积分商城活动的编号",
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
    "moduleName": "mall",
    "className": "TradeOrderItem",
    "businessName": "交易订单项",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:trade_order_item",
    "table": {
      "name": "trade_order_item",
      "comment": "交易订单项",
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
          "name": "order_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "cart_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "购物车项编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "spu_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SPU 名称",
          "nullableInferred": true
        },
        {
          "name": "sku_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品 SKU 编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "properties",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "属性数组，JSON 格式",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "商品图片",
          "nullableInferred": true
        },
        {
          "name": "count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "购买数量",
          "nullableInferred": true
        },
        {
          "name": "comment_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否评价",
          "nullableInferred": true
        },
        {
          "name": "price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "商品原价（单），单位：分",
          "nullableInferred": true
        },
        {
          "name": "discount_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠金额（总），单位：分",
          "nullableInferred": true
        },
        {
          "name": "delivery_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "运费金额（总），单位：分",
          "nullableInferred": true
        },
        {
          "name": "adjust_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "订单调价（总），单位：分",
          "nullableInferred": true
        },
        {
          "name": "pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "应付金额（总），单位：分",
          "nullableInferred": true
        },
        {
          "name": "coupon_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "优惠劵减免金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "point_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "积分抵扣的金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "use_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "使用的积分",
          "nullableInferred": true
        },
        {
          "name": "give_point",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "赠送的积分",
          "nullableInferred": true
        },
        {
          "name": "vip_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "VIP 减免金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "after_sale_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "售后单编号",
          "nullableInferred": true
        },
        {
          "name": "after_sale_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "售后状态",
          "nullableInferred": true
        },
        {
          "name": "property_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性编号",
          "nullableInferred": true
        },
        {
          "name": "property_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性名字",
          "nullableInferred": true
        },
        {
          "name": "value_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性值编号",
          "nullableInferred": true
        },
        {
          "name": "value_name",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "属性值名字",
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
    "moduleName": "mall",
    "className": "TradeOrderLog",
    "businessName": "订单日志",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:trade_order_log",
    "table": {
      "name": "trade_order_log",
      "comment": "订单日志",
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
          "name": "user_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "用户类型",
          "nullableInferred": true
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
          "name": "before_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作前状态",
          "nullableInferred": true
        },
        {
          "name": "after_status",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作后状态",
          "nullableInferred": true
        },
        {
          "name": "operate_type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "操作类型",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "订单日志信息",
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
    "moduleName": "mall",
    "className": "TradeStatistics",
    "businessName": "交易统计 DO以天为维度，统计全部的数据",
    "parentMenuId": "mall-dir",
    "permissionPrefix": "mall:trade_statistics",
    "table": {
      "name": "trade_statistics",
      "comment": "交易统计 DO以天为维度，统计全部的数据",
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
          "name": "time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "统计日期",
          "nullableInferred": true
        },
        {
          "name": "order_create_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "创建订单数",
          "nullableInferred": true
        },
        {
          "name": "order_pay_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "支付订单商品数",
          "nullableInferred": true
        },
        {
          "name": "order_pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "总支付金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "after_sale_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "退款订单数",
          "nullableInferred": true
        },
        {
          "name": "after_sale_refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "总退款金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "brokerage_settlement_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "佣金金额（已结算），单位：分",
          "nullableInferred": true
        },
        {
          "name": "wallet_pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "总支付金额（余额），单位：分",
          "nullableInferred": true
        },
        {
          "name": "recharge_pay_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "充值订单数",
          "nullableInferred": true
        },
        {
          "name": "recharge_pay_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "充值金额，单位：分",
          "nullableInferred": true
        },
        {
          "name": "recharge_refund_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "充值退款订单数",
          "nullableInferred": true
        },
        {
          "name": "recharge_refund_price",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "充值退款金额，单位：分",
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
