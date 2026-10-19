# 领域百科：wms (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-wms/`](../../packages/plugins/plugin-wms)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3221 | **上游环境变量**：`COOLIEBASE_DOMAIN_WMS_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/wms`
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
- [wms.facade.ts](../../packages/plugins/plugin-wms/contract/wms.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listWarehouses`
- `checkin`
- `deductStock`
- `lockStock`
- `releaseStock`
- `replenishStock`

---

## 三、 Agent 自动化实体与契约清单 (16 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `WmsCheckOrder` | 盘点单 | `/admin/wms/wms-check-order` | `wms:check` | [`wms-check-order.agent.json`](../../packages/plugins/plugin-wms/agent/wms-check-order.agent.json) |
| `WmsCheckOrderDetail` | 盘点明细 | `/admin/wms/wms-check-order-detail` | `wms:check` | [`wms-check-order-detail.agent.json`](../../packages/plugins/plugin-wms/agent/wms-check-order-detail.agent.json) |
| `WmsInventory` | 实时库存 | `/admin/wms/wms-inventory` | `wms:inventory` | [`wms-inventory.agent.json`](../../packages/plugins/plugin-wms/agent/wms-inventory.agent.json) |
| `WmsInventoryHistory` | 库存流水 | `/admin/wms/wms-inventory-history` | `wms:inventory-history` | [`wms-inventory-history.agent.json`](../../packages/plugins/plugin-wms/agent/wms-inventory-history.agent.json) |
| `WmsItem` | 物料主数据 | `/admin/wms/wms-item` | `wms:item` | [`wms-item.agent.json`](../../packages/plugins/plugin-wms/agent/wms-item.agent.json) |
| `WmsItemBrand` | 物料品牌 | `/admin/wms/wms-item-brand` | `wms:brand` | [`wms-item-brand.agent.json`](../../packages/plugins/plugin-wms/agent/wms-item-brand.agent.json) |
| `WmsItemCategory` | 物料分类 | `/admin/wms/wms-item-category` | `wms:category` | [`wms-item-category.agent.json`](../../packages/plugins/plugin-wms/agent/wms-item-category.agent.json) |
| `WmsItemSku` | 物料SKU | `/admin/wms/wms-item-sku` | `wms:item` | [`wms-item-sku.agent.json`](../../packages/plugins/plugin-wms/agent/wms-item-sku.agent.json) |
| `WmsMerchant` | 货主管理 | `/admin/wms/wms-merchant` | `wms:merchant` | [`wms-merchant.agent.json`](../../packages/plugins/plugin-wms/agent/wms-merchant.agent.json) |
| `WmsMovementOrder` | 移库单 | `/admin/wms/wms-movement-order` | `wms:movement` | [`wms-movement-order.agent.json`](../../packages/plugins/plugin-wms/agent/wms-movement-order.agent.json) |
| `WmsMovementOrderDetail` | 移库明细 | `/admin/wms/wms-movement-order-detail` | `wms:movement` | [`wms-movement-order-detail.agent.json`](../../packages/plugins/plugin-wms/agent/wms-movement-order-detail.agent.json) |
| `WmsReceiptOrder` | 入库单 | `/admin/wms/wms-receipt-order` | `wms:receipt` | [`wms-receipt-order.agent.json`](../../packages/plugins/plugin-wms/agent/wms-receipt-order.agent.json) |
| `WmsReceiptOrderDetail` | 入库明细 | `/admin/wms/wms-receipt-order-detail` | `wms:receipt` | [`wms-receipt-order-detail.agent.json`](../../packages/plugins/plugin-wms/agent/wms-receipt-order-detail.agent.json) |
| `WmsShipmentOrder` | 出库单 | `/admin/wms/wms-shipment-order` | `wms:shipment` | [`wms-shipment-order.agent.json`](../../packages/plugins/plugin-wms/agent/wms-shipment-order.agent.json) |
| `WmsShipmentOrderDetail` | 出库明细 | `/admin/wms/wms-shipment-order-detail` | `wms:shipment` | [`wms-shipment-order-detail.agent.json`](../../packages/plugins/plugin-wms/agent/wms-shipment-order-detail.agent.json) |
| `WmsWarehouse` | 智能仓库 | `/admin/wms/wms-warehouse` | `wms:warehouse` | [`wms-warehouse.agent.json`](../../packages/plugins/plugin-wms/agent/wms-warehouse.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-wms/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-wms/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-wms/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
