# 设计：电商平台

上游：`docs/features/ecommerce/requirements.md`（本文件不得反向修改需求）

## 1. 架构

shop 是第一方插件（packages/plugins/plugin-shop），挂在 /api/v1/plugins/cooliebase.shop/api/**。C 端与运营端都走 HTTP；下单预占与支付回调**只走 Facade**（wmsFacade.lockStock / releaseStock、pay 的回调状态机），不 import 别的域 Service。

## 2. 数据

| 表 | 说明 |
|---|---|
| `shop_product` | 商品；id 一律 text（本仓约定） |
| `shop_order` | 订单；状态列为可读字符串 |

表定义真源 = 低代码元数据（AGENTS §9.5），不手写 DDL。

## 3. 关键不变量

1. **不超卖** —— 预占走 wmsFacade.lockStock（条件更新 WHERE qty >= n），影响 0 行即拒绝且不建单。
2. **回调幂等** —— 只有 setStatusIfCurrent(PENDING→PAID) 返回 true 时才发业务事件；已支付不降级。
3. **前置状态** —— 只有 PENDING 能被取消；用 defineStateMachine 声明，不写 if。

## 4. UI

* admin 商品列表：搜索/新增/编辑/上下架/删除（复用 new-business-plugin 的列表与表单模板）。
* admin 订单列表：按状态筛选。
* C 端商品列表/详情：schema 驱动，C 端不手写字段。

## 5. 运维与运营

* 门禁链：check → verify:real-db → build。
* 运营：agent:ops 用 shop 的 Agent 契约做接口体检 + 造/清样例数据。
* 保护：下单与支付回调路由声明 idempotent: true（复用 withAdminRoute 的声明式防护）。

## 6. 风险

| 风险 | 处理 |
|---|---|
| 库存扣减与订单创建不在同一事务 | 先预占后建单；失败则释放预占（补偿） |
| 支付回调与订单状态并发 | 状态机 + 条件更新（只用首次回调发事件） |
