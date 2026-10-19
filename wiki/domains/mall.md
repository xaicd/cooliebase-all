# 领域百科：mall (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-mall/`](../../packages/plugins/plugin-mall)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3217 | **上游环境变量**：`COOLIEBASE_DOMAIN_MALL_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/mall`, `/api/v1/app/mall`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`5000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [mall.facade.ts](../../packages/plugins/plugin-mall/contract/mall.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listProducts`
- `listOrders`
- `issueCoupon`

---

## 三、 Agent 自动化实体与契约清单 (49 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `AfterSale` | 售后订单，用于处理 交易订单的退款退货流程 | `/admin/mall/after-sale` | `mall:after_sale` | [`after-sale.agent.json`](../../packages/plugins/plugin-mall/agent/after-sale.agent.json) |
| `AfterSaleLog` | 交易售后日志 | `/admin/mall/after-sale-log` | `mall:after_sale_log` | [`after-sale-log.agent.json`](../../packages/plugins/plugin-mall/agent/after-sale-log.agent.json) |
| `Article` | 文章管理 | `/admin/mall/article` | `mall:article` | [`article.agent.json`](../../packages/plugins/plugin-mall/agent/article.agent.json) |
| `ArticleCategory` | 文章分类 | `/admin/mall/article-category` | `mall:article_category` | [`article-category.agent.json`](../../packages/plugins/plugin-mall/agent/article-category.agent.json) |
| `Banner` | banner | `/admin/mall/banner` | `mall:banner` | [`banner.agent.json`](../../packages/plugins/plugin-mall/agent/banner.agent.json) |
| `BargainActivity` | 砍价活动 | `/admin/mall/bargain-activity` | `mall:bargain_activity` | [`bargain-activity.agent.json`](../../packages/plugins/plugin-mall/agent/bargain-activity.agent.json) |
| `BargainHelp` | 砍价助力 | `/admin/mall/bargain-help` | `mall:bargain_help` | [`bargain-help.agent.json`](../../packages/plugins/plugin-mall/agent/bargain-help.agent.json) |
| `BargainRecord` | 砍价记录 DO TO | `/admin/mall/bargain-record` | `mall:bargain_record` | [`bargain-record.agent.json`](../../packages/plugins/plugin-mall/agent/bargain-record.agent.json) |
| `BrokerageRecord` | 佣金记录 | `/admin/mall/brokerage-record` | `mall:brokerage_record` | [`brokerage-record.agent.json`](../../packages/plugins/plugin-mall/agent/brokerage-record.agent.json) |
| `BrokerageUser` | 分销用户 | `/admin/mall/brokerage-user` | `mall:brokerage_user` | [`brokerage-user.agent.json`](../../packages/plugins/plugin-mall/agent/brokerage-user.agent.json) |
| `BrokerageWithdraw` | 佣金提现 | `/admin/mall/brokerage-withdraw` | `mall:brokerage_withdraw` | [`brokerage-withdraw.agent.json`](../../packages/plugins/plugin-mall/agent/brokerage-withdraw.agent.json) |
| `Cart` | 购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联 | `/admin/mall/cart` | `mall:cart` | [`cart.agent.json`](../../packages/plugins/plugin-mall/agent/cart.agent.json) |
| `CombinationActivity` | 拼团活动 | `/admin/mall/combination-activity` | `mall:combination_activity` | [`combination-activity.agent.json`](../../packages/plugins/plugin-mall/agent/combination-activity.agent.json) |
| `CombinationProduct` | 拼团商品 | `/admin/mall/combination-product` | `mall:combination_product` | [`combination-product.agent.json`](../../packages/plugins/plugin-mall/agent/combination-product.agent.json) |
| `CombinationRecord` | 拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人的拼团记录，通过 关联 | `/admin/mall/combination-record` | `mall:combination_record` | [`combination-record.agent.json`](../../packages/plugins/plugin-mall/agent/combination-record.agent.json) |
| `Coupon` | 优惠劵 | `/admin/mall/coupon` | `mall:coupon` | [`coupon.agent.json`](../../packages/plugins/plugin-mall/agent/coupon.agent.json) |
| `CouponTemplate` | 优惠劵模板 DO当用户领取时，会生成 优惠劵 | `/admin/mall/coupon-template` | `mall:coupon_template` | [`coupon-template.agent.json`](../../packages/plugins/plugin-mall/agent/coupon-template.agent.json) |
| `DeliveryExpress` | 快递公司 | `/admin/mall/delivery-express` | `mall:delivery_express` | [`delivery-express.agent.json`](../../packages/plugins/plugin-mall/agent/delivery-express.agent.json) |
| `DeliveryExpressTemplate` | 快递运费模板 | `/admin/mall/delivery-express-template` | `mall:delivery_express_template` | [`delivery-express-template.agent.json`](../../packages/plugins/plugin-mall/agent/delivery-express-template.agent.json) |
| `DeliveryExpressTemplateCharge` | 快递运费模板计费配置 | `/admin/mall/delivery-express-template-charge` | `mall:delivery_express_template_charge` | [`delivery-express-template-charge.agent.json`](../../packages/plugins/plugin-mall/agent/delivery-express-template-charge.agent.json) |
| `DeliveryExpressTemplateFree` | 快递运费模板包邮配置 | `/admin/mall/delivery-express-template-free` | `mall:delivery_express_template_free` | [`delivery-express-template-free.agent.json`](../../packages/plugins/plugin-mall/agent/delivery-express-template-free.agent.json) |
| `DeliveryPickUpStore` | 自提门店 | `/admin/mall/delivery-pick-up-store` | `mall:delivery_pick_up_store` | [`delivery-pick-up-store.agent.json`](../../packages/plugins/plugin-mall/agent/delivery-pick-up-store.agent.json) |
| `DiscountActivity` | 限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一个活动； | `/admin/mall/discount-activity` | `mall:discount_activity` | [`discount-activity.agent.json`](../../packages/plugins/plugin-mall/agent/discount-activity.agent.json) |
| `DiscountProduct` | 限时折扣商品 | `/admin/mall/discount-product` | `mall:discount_product` | [`discount-product.agent.json`](../../packages/plugins/plugin-mall/agent/discount-product.agent.json) |
| `DiyPage` | 装修页面 | `/admin/mall/diy-page` | `mall:diy_page` | [`diy-page.agent.json`](../../packages/plugins/plugin-mall/agent/diy-page.agent.json) |
| `DiyTemplate` | 装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. 如果需要使用某个模版，则将 设置为 true，表示已使用，有且仅有一个 | `/admin/mall/diy-template` | `mall:diy_template` | [`diy-template.agent.json`](../../packages/plugins/plugin-mall/agent/diy-template.agent.json) |
| `KeFuConversation` | 客服会话 | `/admin/mall/ke-fu-conversation` | `mall:ke_fu_conversation` | [`ke-fu-conversation.agent.json`](../../packages/plugins/plugin-mall/agent/ke-fu-conversation.agent.json) |
| `KeFuMessage` | 客服消息 | `/admin/mall/ke-fu-message` | `mall:ke_fu_message` | [`ke-fu-message.agent.json`](../../packages/plugins/plugin-mall/agent/ke-fu-message.agent.json) |
| `PointActivity` | 积分商城活动 | `/admin/mall/point-activity` | `mall:point_activity` | [`point-activity.agent.json`](../../packages/plugins/plugin-mall/agent/point-activity.agent.json) |
| `PointProduct` | 积分商城商品 | `/admin/mall/point-product` | `mall:point_product` | [`point-product.agent.json`](../../packages/plugins/plugin-mall/agent/point-product.agent.json) |
| `ProductBrand` | 商品品牌 | `/admin/mall/product-brand` | `mall:product_brand` | [`product-brand.agent.json`](../../packages/plugins/plugin-mall/agent/product-brand.agent.json) |
| `ProductBrowseHistory` | 商品浏览记录 | `/admin/mall/product-browse-history` | `mall:product_browse_history` | [`product-browse-history.agent.json`](../../packages/plugins/plugin-mall/agent/product-browse-history.agent.json) |
| `ProductCategory` | 商品分类 | `/admin/mall/product-category` | `mall:product_category` | [`product-category.agent.json`](../../packages/plugins/plugin-mall/agent/product-category.agent.json) |
| `ProductComment` | 商品评论 | `/admin/mall/product-comment` | `mall:product_comment` | [`product-comment.agent.json`](../../packages/plugins/plugin-mall/agent/product-comment.agent.json) |
| `ProductFavorite` | 商品收藏 | `/admin/mall/product-favorite` | `mall:product_favorite` | [`product-favorite.agent.json`](../../packages/plugins/plugin-mall/agent/product-favorite.agent.json) |
| `ProductProperty` | 商品属性项 | `/admin/mall/product-property` | `mall:product_property` | [`product-property.agent.json`](../../packages/plugins/plugin-mall/agent/product-property.agent.json) |
| `ProductPropertyValue` | 商品属性值 | `/admin/mall/product-property-value` | `mall:product_property_value` | [`product-property-value.agent.json`](../../packages/plugins/plugin-mall/agent/product-property-value.agent.json) |
| `ProductSku` | 商品 SKU | `/admin/mall/product-sku` | `mall:product_sku` | [`product-sku.agent.json`](../../packages/plugins/plugin-mall/agent/product-sku.agent.json) |
| `ProductSpu` | 商品 SPU | `/admin/mall/product-spu` | `mall:product_spu` | [`product-spu.agent.json`](../../packages/plugins/plugin-mall/agent/product-spu.agent.json) |
| `ProductStatistics` | 商品统计 | `/admin/mall/product-statistics` | `mall:product_statistics` | [`product-statistics.agent.json`](../../packages/plugins/plugin-mall/agent/product-statistics.agent.json) |
| `RewardActivity` | 满减送活动 | `/admin/mall/reward-activity` | `mall:reward_activity` | [`reward-activity.agent.json`](../../packages/plugins/plugin-mall/agent/reward-activity.agent.json) |
| `SeckillActivity` | 秒杀活动 | `/admin/mall/seckill-activity` | `mall:seckill_activity` | [`seckill-activity.agent.json`](../../packages/plugins/plugin-mall/agent/seckill-activity.agent.json) |
| `SeckillConfig` | 秒杀时段 | `/admin/mall/seckill-config` | `mall:seckill_config` | [`seckill-config.agent.json`](../../packages/plugins/plugin-mall/agent/seckill-config.agent.json) |
| `SeckillProduct` | 秒杀参与商品 | `/admin/mall/seckill-product` | `mall:seckill_product` | [`seckill-product.agent.json`](../../packages/plugins/plugin-mall/agent/seckill-product.agent.json) |
| `TradeConfig` | 交易中心配置 | `/admin/mall/trade-config` | `mall:trade_config` | [`trade-config.agent.json`](../../packages/plugins/plugin-mall/agent/trade-config.agent.json) |
| `TradeOrder` | 交易订单 | `/admin/mall/trade-order` | `mall:trade_order` | [`trade-order.agent.json`](../../packages/plugins/plugin-mall/agent/trade-order.agent.json) |
| `TradeOrderItem` | 交易订单项 | `/admin/mall/trade-order-item` | `mall:trade_order_item` | [`trade-order-item.agent.json`](../../packages/plugins/plugin-mall/agent/trade-order-item.agent.json) |
| `TradeOrderLog` | 订单日志 | `/admin/mall/trade-order-log` | `mall:trade_order_log` | [`trade-order-log.agent.json`](../../packages/plugins/plugin-mall/agent/trade-order-log.agent.json) |
| `TradeStatistics` | 交易统计 DO以天为维度，统计全部的数据 | `/admin/mall/trade-statistics` | `mall:trade_statistics` | [`trade-statistics.agent.json`](../../packages/plugins/plugin-mall/agent/trade-statistics.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-mall/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-mall/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-mall/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
