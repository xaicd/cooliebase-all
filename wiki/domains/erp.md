# 领域百科：erp (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-erp/`](../../packages/plugins/plugin-erp)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3220 | **上游环境变量**：`COOLIEBASE_DOMAIN_ERP_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/erp`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`8000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [erp.facade.ts](../../packages/plugins/plugin-erp/contract/erp.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listProducts`
- `listOrders`
- `adjustStock`

---

## 三、 Agent 自动化实体与契约清单 (33 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `ErpAccount` | ERP 结算账户 | `/admin/erp/erp-account` | `erp:erp_account` | [`erp-account.agent.json`](../../packages/plugins/plugin-erp/agent/erp-account.agent.json) |
| `ErpCustomer` | ERP 客户 | `/admin/erp/erp-customer` | `erp:erp_customer` | [`erp-customer.agent.json`](../../packages/plugins/plugin-erp/agent/erp-customer.agent.json) |
| `ErpFinancePayment` | ERP 付款单 | `/admin/erp/erp-finance-payment` | `erp:erp_finance_payment` | [`erp-finance-payment.agent.json`](../../packages/plugins/plugin-erp/agent/erp-finance-payment.agent.json) |
| `ErpFinancePaymentItem` | ERP 付款项 | `/admin/erp/erp-finance-payment-item` | `erp:erp_finance_payment_item` | [`erp-finance-payment-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-finance-payment-item.agent.json) |
| `ErpFinanceReceipt` | ERP 收款单 | `/admin/erp/erp-finance-receipt` | `erp:erp_finance_receipt` | [`erp-finance-receipt.agent.json`](../../packages/plugins/plugin-erp/agent/erp-finance-receipt.agent.json) |
| `ErpFinanceReceiptItem` | ERP 收款项 | `/admin/erp/erp-finance-receipt-item` | `erp:erp_finance_receipt_item` | [`erp-finance-receipt-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-finance-receipt-item.agent.json) |
| `ErpProduct` | ERP 产品 | `/admin/erp/erp-product` | `erp:erp_product` | [`erp-product.agent.json`](../../packages/plugins/plugin-erp/agent/erp-product.agent.json) |
| `ErpProductCategory` | ERP 产品分类 | `/admin/erp/erp-product-category` | `erp:erp_product_category` | [`erp-product-category.agent.json`](../../packages/plugins/plugin-erp/agent/erp-product-category.agent.json) |
| `ErpProductUnit` | ERP 产品单位 | `/admin/erp/erp-product-unit` | `erp:erp_product_unit` | [`erp-product-unit.agent.json`](../../packages/plugins/plugin-erp/agent/erp-product-unit.agent.json) |
| `ErpPurchaseIn` | ERP 采购入库 | `/admin/erp/erp-purchase-in` | `erp:erp_purchase_in` | [`erp-purchase-in.agent.json`](../../packages/plugins/plugin-erp/agent/erp-purchase-in.agent.json) |
| `ErpPurchaseInItem` | ERP 采购入库项 | `/admin/erp/erp-purchase-in-item` | `erp:erp_purchase_in_item` | [`erp-purchase-in-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-purchase-in-item.agent.json) |
| `ErpPurchaseOrder` | ERP 采购订单 | `/admin/erp/erp-purchase-order` | `erp:erp_purchase_order` | [`erp-purchase-order.agent.json`](../../packages/plugins/plugin-erp/agent/erp-purchase-order.agent.json) |
| `ErpPurchaseOrderItem` | ERP 采购订单项 | `/admin/erp/erp-purchase-order-item` | `erp:erp_purchase_order_item` | [`erp-purchase-order-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-purchase-order-item.agent.json) |
| `ErpPurchaseReturn` | ERP 采购退货 | `/admin/erp/erp-purchase-return` | `erp:erp_purchase_return` | [`erp-purchase-return.agent.json`](../../packages/plugins/plugin-erp/agent/erp-purchase-return.agent.json) |
| `ErpPurchaseReturnItem` | ERP 采购退货项 | `/admin/erp/erp-purchase-return-item` | `erp:erp_purchase_return_item` | [`erp-purchase-return-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-purchase-return-item.agent.json) |
| `ErpSaleOrder` | ERP 销售订单 | `/admin/erp/erp-sale-order` | `erp:erp_sale_order` | [`erp-sale-order.agent.json`](../../packages/plugins/plugin-erp/agent/erp-sale-order.agent.json) |
| `ErpSaleOrderItem` | ERP 销售订单项 | `/admin/erp/erp-sale-order-item` | `erp:erp_sale_order_item` | [`erp-sale-order-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-sale-order-item.agent.json) |
| `ErpSaleOut` | ERP 销售出库 | `/admin/erp/erp-sale-out` | `erp:erp_sale_out` | [`erp-sale-out.agent.json`](../../packages/plugins/plugin-erp/agent/erp-sale-out.agent.json) |
| `ErpSaleOutItem` | ERP 销售出库项 | `/admin/erp/erp-sale-out-item` | `erp:erp_sale_out_item` | [`erp-sale-out-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-sale-out-item.agent.json) |
| `ErpSaleReturn` | ERP 销售退货 | `/admin/erp/erp-sale-return` | `erp:erp_sale_return` | [`erp-sale-return.agent.json`](../../packages/plugins/plugin-erp/agent/erp-sale-return.agent.json) |
| `ErpSaleReturnItem` | ERP 销售退货项 | `/admin/erp/erp-sale-return-item` | `erp:erp_sale_return_item` | [`erp-sale-return-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-sale-return-item.agent.json) |
| `ErpStock` | ERP 产品库存 | `/admin/erp/erp-stock` | `erp:erp_stock` | [`erp-stock.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock.agent.json) |
| `ErpStockCheck` | ERP 库存盘点单 | `/admin/erp/erp-stock-check` | `erp:erp_stock_check` | [`erp-stock-check.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-check.agent.json) |
| `ErpStockCheckItem` | ERP 库存盘点单项 | `/admin/erp/erp-stock-check-item` | `erp:erp_stock_check_item` | [`erp-stock-check-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-check-item.agent.json) |
| `ErpStockIn` | ERP 其它入库单 | `/admin/erp/erp-stock-in` | `erp:erp_stock_in` | [`erp-stock-in.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-in.agent.json) |
| `ErpStockInItem` | ERP 其它入库单项 | `/admin/erp/erp-stock-in-item` | `erp:erp_stock_in_item` | [`erp-stock-in-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-in-item.agent.json) |
| `ErpStockMove` | ERP 库存调拨单 | `/admin/erp/erp-stock-move` | `erp:erp_stock_move` | [`erp-stock-move.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-move.agent.json) |
| `ErpStockMoveItem` | ERP 库存调拨单项 | `/admin/erp/erp-stock-move-item` | `erp:erp_stock_move_item` | [`erp-stock-move-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-move-item.agent.json) |
| `ErpStockOut` | ERP 其它出库单 | `/admin/erp/erp-stock-out` | `erp:erp_stock_out` | [`erp-stock-out.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-out.agent.json) |
| `ErpStockOutItem` | ERP 其它出库单项 | `/admin/erp/erp-stock-out-item` | `erp:erp_stock_out_item` | [`erp-stock-out-item.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-out-item.agent.json) |
| `ErpStockRecord` | ERP 产品库存明细 | `/admin/erp/erp-stock-record` | `erp:erp_stock_record` | [`erp-stock-record.agent.json`](../../packages/plugins/plugin-erp/agent/erp-stock-record.agent.json) |
| `ErpSupplier` | ERP 供应商 | `/admin/erp/erp-supplier` | `erp:erp_supplier` | [`erp-supplier.agent.json`](../../packages/plugins/plugin-erp/agent/erp-supplier.agent.json) |
| `ErpWarehouse` | ERP 仓库 | `/admin/erp/erp-warehouse` | `erp:erp_warehouse` | [`erp-warehouse.agent.json`](../../packages/plugins/plugin-erp/agent/erp-warehouse.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-erp/backend/services/`；
   - 仓储数据访问放于 `packages/plugins/plugin-erp/backend/repositories/`；
   - 契约接口放于 `packages/plugins/plugin-erp/contract/`。
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
