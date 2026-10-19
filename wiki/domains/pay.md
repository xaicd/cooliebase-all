# 领域百科：pay (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-pay/`](../../packages/plugins/plugin-pay)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3214 | **上游环境变量**：`COOLIEBASE_DOMAIN_PAY_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/pay`, `/api/v1/app/pay`, `/api/v1/open/pay`
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
- [pay.facade.ts](../../packages/plugins/plugin-pay/contract/pay.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listOrders`
- `createOrder`
- `createRefund`
- `listRefunds`

---

## 三、 Agent 自动化实体与契约清单 (14 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `PayApp` | 支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家等等不过一般来说，一个商户，只有一个应用哈~即 PayMerchantDO : PayAppDO = 1 : n | `/admin/pay/pay-app` | `pay:pay_app` | [`pay-app.agent.json`](../../packages/plugins/plugin-pay/agent/pay-app.agent.json) |
| `PayChannel` | 支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 PayAppDO : PayChannelDO = 1 : n | `/admin/pay/pay-channel` | `pay:pay_channel` | [`pay-channel.agent.json`](../../packages/plugins/plugin-pay/agent/pay-channel.agent.json) |
| `PayDemoOrder` | 示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款 | `/admin/pay/pay-demo-order` | `pay:pay_demo_order` | [`pay-demo-order.agent.json`](../../packages/plugins/plugin-pay/agent/pay-demo-order.agent.json) |
| `PayDemoWithdraw` | 示例提现订单演示业务系统的转账业务 | `/admin/pay/pay-demo-withdraw` | `pay:pay_demo_withdraw` | [`pay-demo-withdraw.agent.json`](../../packages/plugins/plugin-pay/agent/pay-demo-withdraw.agent.json) |
| `PayNotifyLog` | 商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排查问题 | `/admin/pay/pay-notify-log` | `pay:pay_notify_log` | [`pay-notify-log.agent.json`](../../packages/plugins/plugin-pay/agent/pay-notify-log.agent.json) |
| `PayNotifyTask` | 支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直到成功。 | `/admin/pay/pay-notify-task` | `pay:pay_notify_task` | [`pay-notify-task.agent.json`](../../packages/plugins/plugin-pay/agent/pay-notify-task.agent.json) |
| `PayOrder` | 支付订单 | `/admin/pay/pay-order` | `pay:pay_order` | [`pay-order.agent.json`](../../packages/plugins/plugin-pay/agent/pay-order.agent.json) |
| `PayOrderExtension` | 支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录 | `/admin/pay/pay-order-extension` | `pay:pay_order_extension` | [`pay-order-extension.agent.json`](../../packages/plugins/plugin-pay/agent/pay-order-extension.agent.json) |
| `PayRefund` | 支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO : PayRefundDO = 1 : n | `/admin/pay/pay-refund` | `pay:pay_refund` | [`pay-refund.agent.json`](../../packages/plugins/plugin-pay/agent/pay-refund.agent.json) |
| `PayTransfer` | 转账单 | `/admin/pay/pay-transfer` | `pay:pay_transfer` | [`pay-transfer.agent.json`](../../packages/plugins/plugin-pay/agent/pay-transfer.agent.json) |
| `PayWallet` | 会员钱包 | `/admin/pay/pay-wallet` | `pay:pay_wallet` | [`pay-wallet.agent.json`](../../packages/plugins/plugin-pay/agent/pay-wallet.agent.json) |
| `PayWalletRecharge` | 会员钱包充值 | `/admin/pay/pay-wallet-recharge` | `pay:pay_wallet_recharge` | [`pay-wallet-recharge.agent.json`](../../packages/plugins/plugin-pay/agent/pay-wallet-recharge.agent.json) |
| `PayWalletRechargePackage` | 会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额； | `/admin/pay/pay-wallet-recharge-package` | `pay:pay_wallet_recharge_package` | [`pay-wallet-recharge-package.agent.json`](../../packages/plugins/plugin-pay/agent/pay-wallet-recharge-package.agent.json) |
| `PayWalletTransaction` | 会员钱包流水 | `/admin/pay/pay-wallet-transaction` | `pay:pay_wallet_transaction` | [`pay-wallet-transaction.agent.json`](../../packages/plugins/plugin-pay/agent/pay-wallet-transaction.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-pay/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-pay/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-pay/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
