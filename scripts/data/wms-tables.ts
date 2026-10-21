/**
 * WMS 域的表定义（低代码 CodegenConfig）。
 *
 * 单独成模块的原因：它是**权威表定义**，有两个消费方 ——
 *   1. `scripts/scaffold-wms-domain.ts` 用它生成全栈代码；
 *   2. `scripts/generate-table-migration.ts` 用它生成**建表迁移**。
 * 放在 scaffold 脚本里会导致"导入即执行脚手架"（顶层循环会写文件），所以抽出来做纯数据。
 *
 * 注意: 只生成代码、不生成建表 SQL 是本仓的历史缺口 ——
 * 见 `node scripts/report-table-inventory.cjs` 的 queriedButNeverCreated 一栏。
 */
import type { CodegenConfig } from "../../packages/domains/infra/backend/services/codegen-templates"

export const WMS_TABLES: CodegenConfig[] = [
  // 1. 仓库管理
  {
    moduleName: "wms",
    className: "WmsWarehouse",
    businessName: "智能仓库",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:warehouse",
    table: {
      name: "wms_warehouse",
      comment: "智能仓库实体表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "主键ID", isPk: true },
        { name: "code", type: "varchar", tsType: "string", nullable: false, comment: "仓库编码", formValidation: "required", queryType: "LIKE" },
        { name: "name", type: "varchar", tsType: "string", nullable: false, comment: "仓库名称", formValidation: "required", queryType: "LIKE" },
        { name: "capacity", type: "int", tsType: "number", nullable: true, comment: "库容量(m³)" },
        { name: "active", type: "boolean", tsType: "boolean", nullable: false, comment: "启用状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 2. 物料主数据
  {
    moduleName: "wms",
    className: "WmsItem",
    businessName: "物料主数据",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:item",
    table: {
      name: "wms_item",
      comment: "物料与商品主数据表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", isPk: true },
        { name: "item_code", type: "varchar", tsType: "string", nullable: false, comment: "物料编码", formValidation: "required", queryType: "LIKE" },
        { name: "item_name", type: "varchar", tsType: "string", nullable: false, comment: "物料名称", formValidation: "required", queryType: "LIKE" },
        { name: "category_id", type: "varchar", tsType: "string", nullable: true, comment: "分类ID" },
        { name: "brand_id", type: "varchar", tsType: "string", nullable: true, comment: "品牌ID" },
        { name: "unit", type: "varchar", tsType: "string", nullable: true, comment: "基本单位" },
        { name: "spec", type: "varchar", tsType: "string", nullable: true, comment: "规格型号" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "物料状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 3. 物料分类
  {
    moduleName: "wms",
    className: "WmsItemCategory",
    businessName: "物料分类",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:category",
    template: "TREE",
    table: {
      name: "wms_item_category",
      comment: "物料分类树表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "分类ID", isPk: true },
        { name: "parent_id", type: "varchar", tsType: "string", nullable: false, comment: "上级分类ID" },
        { name: "name", type: "varchar", tsType: "string", nullable: false, comment: "分类名称", formValidation: "required", queryType: "LIKE" },
        { name: "code", type: "varchar", tsType: "string", nullable: false, comment: "分类编码", formValidation: "required", queryType: "LIKE" },
        { name: "sort", type: "int", tsType: "number", nullable: false, comment: "显示排序" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 4. 物料品牌
  {
    moduleName: "wms",
    className: "WmsItemBrand",
    businessName: "物料品牌",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:brand",
    table: {
      name: "wms_item_brand",
      comment: "物料品牌表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "品牌ID", isPk: true },
        { name: "name", type: "varchar", tsType: "string", nullable: false, comment: "品牌名称", formValidation: "required", queryType: "LIKE" },
        { name: "code", type: "varchar", tsType: "string", nullable: false, comment: "品牌编码", formValidation: "required", queryType: "LIKE" },
        { name: "logo", type: "varchar", tsType: "string", nullable: true, comment: "品牌LOGO" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 5. 货主管理
  {
    moduleName: "wms",
    className: "WmsMerchant",
    businessName: "货主管理",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:merchant",
    table: {
      name: "wms_merchant",
      comment: "货主主数据表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "货主ID", isPk: true },
        { name: "code", type: "varchar", tsType: "string", nullable: false, comment: "货主编码", formValidation: "required", queryType: "LIKE" },
        { name: "name", type: "varchar", tsType: "string", nullable: false, comment: "货主名称", formValidation: "required", queryType: "LIKE" },
        { name: "contact_name", type: "varchar", tsType: "string", nullable: true, comment: "联系人" },
        { name: "contact_phone", type: "varchar", tsType: "string", nullable: true, comment: "联系电话" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 6. 入库单
  {
    moduleName: "wms",
    className: "WmsReceiptOrder",
    businessName: "入库单",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:receipt",
    table: {
      name: "wms_receipt_order",
      comment: "入库单据表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "入库单ID", isPk: true },
        { name: "order_no", type: "varchar", tsType: "string", nullable: false, comment: "入库单号", formValidation: "required", queryType: "LIKE" },
        { name: "receipt_type", type: "varchar", tsType: "string", nullable: false, comment: "入库类型" },
        { name: "warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "目标仓库ID" },
        { name: "merchant_id", type: "varchar", tsType: "string", nullable: true, comment: "货主ID" },
        { name: "total_qty", type: "int", tsType: "number", nullable: false, comment: "总入库数量" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "单据状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 7. 出库单
  {
    moduleName: "wms",
    className: "WmsShipmentOrder",
    businessName: "出库单",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:shipment",
    table: {
      name: "wms_shipment_order",
      comment: "出库单据表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "出库单ID", isPk: true },
        { name: "order_no", type: "varchar", tsType: "string", nullable: false, comment: "出库单号", formValidation: "required", queryType: "LIKE" },
        { name: "shipment_type", type: "varchar", tsType: "string", nullable: false, comment: "出库类型" },
        { name: "warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "源仓库ID" },
        { name: "merchant_id", type: "varchar", tsType: "string", nullable: true, comment: "货主ID" },
        { name: "total_qty", type: "int", tsType: "number", nullable: false, comment: "总出库数量" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "单据状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 8. 移库单
  {
    moduleName: "wms",
    className: "WmsMovementOrder",
    businessName: "移库单",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:movement",
    table: {
      name: "wms_movement_order",
      comment: "移库单据表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "移库单ID", isPk: true },
        { name: "order_no", type: "varchar", tsType: "string", nullable: false, comment: "移库单号", formValidation: "required", queryType: "LIKE" },
        { name: "from_warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "源仓库ID" },
        { name: "to_warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "目标仓库ID" },
        { name: "total_qty", type: "int", tsType: "number", nullable: false, comment: "移库数量" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "单据状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 9. 盘点单
  {
    moduleName: "wms",
    className: "WmsCheckOrder",
    businessName: "盘点单",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:check",
    table: {
      name: "wms_check_order",
      comment: "库存盘点单据表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "盘点单ID", isPk: true },
        { name: "order_no", type: "varchar", tsType: "string", nullable: false, comment: "盘点单号", formValidation: "required", queryType: "LIKE" },
        { name: "warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "盘点仓库ID" },
        { name: "check_type", type: "varchar", tsType: "string", nullable: false, comment: "盘点类型" },
        { name: "status", type: "varchar", tsType: "string", nullable: false, comment: "单据状态" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 10. 实时库存
  {
    moduleName: "wms",
    className: "WmsInventory",
    businessName: "实时库存",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:inventory",
    table: {
      name: "wms_inventory",
      comment: "实时库存主表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "库存ID", isPk: true },
        { name: "warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "仓库ID", queryType: "EQ" },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", queryType: "EQ" },
        { name: "merchant_id", type: "varchar", tsType: "string", nullable: true, comment: "货主ID" },
        { name: "qty", type: "int", tsType: "number", nullable: false, comment: "现存数量" },
        { name: "locked_qty", type: "int", tsType: "number", nullable: false, comment: "锁定数量" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "update_time", type: "timestamp", tsType: "string", nullable: false, comment: "更新时间" },
      ]
        }
        },
  // 11. 库存变动历史流水
  {
    moduleName: "wms",
    className: "WmsInventoryHistory",
    businessName: "库存流水",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:inventory-history",
    table: {
      name: "wms_inventory_history",
      comment: "库存流水变动记录表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "流水ID", isPk: true },
        { name: "warehouse_id", type: "varchar", tsType: "string", nullable: false, comment: "仓库ID" },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID" },
        { name: "change_type", type: "varchar", tsType: "string", nullable: false, comment: "变动类型" },
        { name: "qty_change", type: "int", tsType: "number", nullable: false, comment: "变动数量" },
        { name: "before_qty", type: "int", tsType: "number", nullable: false, comment: "变动前数量" },
        { name: "after_qty", type: "int", tsType: "number", nullable: false, comment: "变动后数量" },
        { name: "ref_order_no", type: "varchar", tsType: "string", nullable: true, comment: "关联单号", queryType: "LIKE" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "记录时间" },
      ]
        }
        },
  // 12. 入库单明细
  {
    moduleName: "wms",
    className: "WmsReceiptOrderDetail",
    businessName: "入库明细",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:receipt",
    table: {
      name: "wms_receipt_order_detail",
      comment: "入库单明细表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "明细ID", isPk: true },
        { name: "receipt_order_id", type: "varchar", tsType: "string", nullable: false, comment: "关联入库单ID", queryType: "EQ" },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", queryType: "EQ" },
        { name: "plan_qty", type: "int", tsType: "number", nullable: false, comment: "计划入库数量" },
        { name: "real_qty", type: "int", tsType: "number", nullable: false, comment: "实际入库数量" },
        { name: "batch_no", type: "varchar", tsType: "string", nullable: true, comment: "批次号" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 13. 出库单明细
  {
    moduleName: "wms",
    className: "WmsShipmentOrderDetail",
    businessName: "出库明细",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:shipment",
    table: {
      name: "wms_shipment_order_detail",
      comment: "出库单明细表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "明细ID", isPk: true },
        { name: "shipment_order_id", type: "varchar", tsType: "string", nullable: false, comment: "关联出库单ID", queryType: "EQ" },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", queryType: "EQ" },
        { name: "plan_qty", type: "int", tsType: "number", nullable: false, comment: "计划出库数量" },
        { name: "real_qty", type: "int", tsType: "number", nullable: false, comment: "实际出库数量" },
        { name: "batch_no", type: "varchar", tsType: "string", nullable: true, comment: "批次号" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 14. 移库单明细
  {
    moduleName: "wms",
    className: "WmsMovementOrderDetail",
    businessName: "移库明细",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:movement",
    table: {
      name: "wms_movement_order_detail",
      comment: "移库单明细表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "明细ID", isPk: true },
        { name: "movement_order_id", type: "varchar", tsType: "string", nullable: false, comment: "关联移库单ID", queryType: "EQ" },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", queryType: "EQ" },
        { name: "qty", type: "int", tsType: "number", nullable: false, comment: "移库数量" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 15. 盘点单明细
  {
    moduleName: "wms",
    className: "WmsCheckOrderDetail",
    businessName: "盘点明细",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:check",
    table: {
      name: "wms_check_order_detail",
      comment: "盘点单明细表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "明细ID", isPk: true },
        { name: "check_order_id", type: "varchar", tsType: "string", nullable: false, comment: "关联盘点单ID", queryType: "EQ" },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", queryType: "EQ" },
        { name: "system_qty", type: "int", tsType: "number", nullable: false, comment: "账面数量" },
        { name: "check_qty", type: "int", tsType: "number", nullable: false, comment: "实盘数量" },
        { name: "diff_qty", type: "int", tsType: "number", nullable: false, comment: "差异数量" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
  // 16. 物料规格 SKU
  {
    moduleName: "wms",
    className: "WmsItemSku",
    businessName: "物料SKU",
    parentMenuId: "wms-dir",
    permissionPrefix: "wms:item",
    table: {
      name: "wms_item_sku",
      comment: "物料SKU规格表",
      columns: [
        { name: "id", type: "varchar", tsType: "string", nullable: false, comment: "SKU ID", isPk: true },
        { name: "item_id", type: "varchar", tsType: "string", nullable: false, comment: "物料ID", queryType: "EQ" },
        { name: "sku_code", type: "varchar", tsType: "string", nullable: false, comment: "SKU编码", formValidation: "required", queryType: "LIKE" },
        { name: "sku_name", type: "varchar", tsType: "string", nullable: false, comment: "规格名称", formValidation: "required", queryType: "LIKE" },
        { name: "barcode", type: "varchar", tsType: "string", nullable: true, comment: "条形码" },
        { name: "price", type: "decimal", tsType: "number", nullable: true, comment: "参考单价" },
        { name: "tenant_id", type: "varchar", tsType: "string", nullable: false, comment: "租户ID" },
        { name: "create_time", type: "timestamp", tsType: "string", nullable: false, comment: "创建时间" },
      ]
        }
        },
]
