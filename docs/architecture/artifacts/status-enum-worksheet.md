# `status` 列枚举取值 —— 待领域负责人拍板

- 生成时间：2026-10-21
- 来源：`scripts/data/*.ts` 的表元数据（**机器推导不出取值**，故列出待填）
- 合计：**158** 张表有 `status` 列，而全仓**没有任何一处**声明过它的允许值

## 怎么用

在「允许值」列按 `;` 分隔填写，建议同时给中文与是否终态，例如：

```
ACTIVE=启用;DISABLED=停用;ARCHIVED=已归档#terminal
```

填好后我把它写进表元数据（`enumValues` / `enumLabels` / `enumTerminal`），
重跑 codegen 即会生成到 **校验器、前端、agent 契约** 三处。

| 域 | 表 | 中文名 | status 注释 | 允许值（待填） |
|---|---|---|---|---|
| erp | `erp-account` | ERP 结算账户 | 开启状态 |  |
| erp | `erp-customer` | ERP 客户 | 开启状态 |  |
| erp | `erp-finance-payment` | ERP 付款单 | 付款状态 |  |
| erp | `erp-finance-receipt` | ERP 收款单 | 收款状态 |  |
| erp | `erp-product` | ERP 产品 | 产品状态 |  |
| erp | `erp-product-category` | ERP 产品分类 | 开启状态 |  |
| erp | `erp-product-unit` | ERP 产品单位 | 单位状态 |  |
| erp | `erp-purchase-in` | ERP 采购入库 | 入库状态 |  |
| erp | `erp-purchase-order` | ERP 采购订单 | 采购状态 |  |
| erp | `erp-purchase-return` | ERP 采购退货 | 退货状态 |  |
| erp | `erp-sale-order` | ERP 销售订单 | 销售状态 |  |
| erp | `erp-sale-out` | ERP 销售出库 | 出库状态 |  |
| erp | `erp-sale-return` | ERP 销售退货 | 退货状态 |  |
| erp | `erp-stock-check` | ERP 库存盘点单 | 状态 |  |
| erp | `erp-stock-in` | ERP 其它入库单 | 状态 |  |
| erp | `erp-stock-move` | ERP 库存调拨单 | 状态 |  |
| erp | `erp-stock-out` | ERP 其它出库单 | 状态 |  |
| erp | `erp-supplier` | ERP 供应商 | 开启状态 |  |
| erp | `erp-warehouse` | ERP 仓库 | 开启状态 |  |
| mes | `mes-cal-plan` | MES 排班计划 | 状态 |  |
| mes | `mes-dv-check-plan` | MES 点检保养方案 | 状态 |  |
| mes | `mes-dv-check-record` | MES 设备点检记录 | 状态 |  |
| mes | `mes-dv-machinery` | MES 设备台账 | 设备状态 |  |
| mes | `mes-dv-machinery-type` | MES 设备类型 | 状态 |  |
| mes | `mes-dv-mainten-record` | MES 设备保养记录 | 状态 |  |
| mes | `mes-dv-mainten-record-line` | MES 设备保养记录明细 | 保养结果 |  |
| mes | `mes-dv-repair` | MES 维修工单 | 状态 |  |
| mes | `mes-dv-subject` | MES 点检保养项目 | 状态 |  |
| mes | `mes-md-auto-code-rule` | MES 编码规则 | 状态 |  |
| mes | `mes-md-client` | MES 客户 | 状态 |  |
| mes | `mes-md-item` | MES 物料产品 | 状态 |  |
| mes | `mes-md-item-type` | MES 物料产品分类 | 状态 |  |
| mes | `mes-md-product-bom` | MES 产品 BOM | 是否启用 |  |
| mes | `mes-md-unit-measure` | MES 计量单位 | 状态 |  |
| mes | `mes-md-vendor` | MES 供应商 | 状态 |  |
| mes | `mes-md-workshop` | MES 车间 | 状态 |  |
| mes | `mes-md-workstation` | MES 工作站 | 状态 |  |
| mes | `mes-pro-andon-record` | MES 安灯呼叫记录 | 处置状态 |  |
| mes | `mes-pro-card` | MES 生产流转卡 | 状态 |  |
| mes | `mes-pro-feedback` | MES 生产报工 | 状态 |  |
| mes | `mes-pro-process` | MES 生产工序 | 状态 |  |
| mes | `mes-pro-route` | MES 工艺路线 | 状态 |  |
| mes | `mes-pro-task` | MES 生产任务 | 任务状态 |  |
| mes | `mes-pro-work-order` | MES 生产工单 | 工单状态 |  |
| mes | `mes-qc-ipqc` | MES 过程检验单（IPQC, In-Process Quality Contr | 状态 |  |
| mes | `mes-qc-iqc` | MES 来料检验单（IQC, Incoming Quality Control） | 状态 |  |
| mes | `mes-qc-oqc` | MES 出货检验单（OQC, Outgoing Quality Control） | 状态 |  |
| mes | `mes-qc-rqc` | MES 退货检验单（RQC, Return Quality Control） | 状态 |  |
| mes | `mes-qc-template` | MES 质检方案 | 状态 |  |
| mes | `mes-tm-tool` | MES 工具台账 | 状态 |  |
| mes | `mes-wm-arrival-notice` | MES 到货通知单 | 状态 |  |
| mes | `mes-wm-barcode` | MES 条码清单 | 状态 |  |
| mes | `mes-wm-barcode-config` | MES 条码配置 | 状态 |  |
| mes | `mes-wm-item-consume` | MES 物料消耗记录 | 状态 |  |
| mes | `mes-wm-item-receipt` | MES 采购入库单 | 状态 |  |
| mes | `mes-wm-misc-issue` | MES 杂项出库单 | 状态 |  |
| mes | `mes-wm-misc-receipt` | MES 杂项入库单 | 状态 |  |
| mes | `mes-wm-outsource-issue` | MES 外协发料单 | 单据状态 |  |
| mes | `mes-wm-outsource-receipt` | MES 外协入库单 | 状态 |  |
| mes | `mes-wm-package` | MES 装箱单 | 状态 |  |
| mes | `mes-wm-product-issue` | MES 领料出库单 | 状态 |  |
| mes | `mes-wm-product-produce` | MES 生产入库单 | 状态 |  |
| mes | `mes-wm-product-receipt` | MES 产品收货（入库）单 | 状态 |  |
| mes | `mes-wm-product-sales` | MES 销售出库单 | 状态 |  |
| mes | `mes-wm-return-issue` | MES 生产退料单 | 状态 |  |
| mes | `mes-wm-return-sales` | MES 销售退货单 | 状态 |  |
| mes | `mes-wm-return-vendor` | MES 供应商退货单 | 状态 |  |
| mes | `mes-wm-sales-notice` | MES 发货通知单 | 状态 |  |
| mes | `mes-wm-stock-taking-plan` | MES 盘点方案 | 状态 |  |
| mes | `mes-wm-stock-taking-task` | MES 盘点任务 | 任务状态 |  |
| mes | `mes-wm-stock-taking-task-line` | MES 盘点任务行 | 盘点状态 |  |
| mes | `mes-wm-transfer` | MES 转移单 | 状态 |  |
| mes | `mes-wm-warehouse-area` | MES 库位 | 状态 |  |
| bpm | `bpm-category` | BPM 流程分类 | 分类状态 |  |
| bpm | `bpm-form` | BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景 | 状态 |  |
| bpm | `bpm-oaleave` | OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是  | 审批结果 |  |
| bpm | `bpm-process-expression` | BPM 流程表达式 | 表达式状态 |  |
| bpm | `bpm-process-listener` | BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计 | 状态 |  |
| bpm | `bpm-user-group` | BPM 用户组 | 状态 |  |
| im | `im-channel` | IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消 | 状态 |  |
| im | `im-face-pack` | IM 表情包 DO（运营配置的系统表情包元数据） | 状态 |  |
| im | `im-face-pack-item` | IM 表情包项 DO（系统表情包内的单张表情图） | 状态 |  |
| im | `im-friend` | IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u | 好友状态 |  |
| im | `im-group` | IM 群信息 | 群状态 |  |
| im | `im-group-member` | IM 群成员 | 成员状态 |  |
| im | `im-group-message` | IM 群聊消息 | 消息状态 |  |
| im | `im-private-message` | IM 私聊消息 | 消息状态 |  |
| im | `im-rtc-call` | IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED → | 通话状态 |  |
| im | `im-rtc-participant` | IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主 | 参与状态 |  |
| im | `im-sensitive-word` | IM 敏感词 | 状态 |  |
| wms.ts | `wms-item` | 物料主数据 | 物料状态 |  |
| wms.ts | `wms-item-category` | 物料分类 | 状态 |  |
| wms.ts | `wms-item-brand` | 物料品牌 | 状态 |  |
| wms.ts | `wms-merchant` | 货主管理 | 状态 |  |
| wms.ts | `wms-receipt-order` | 入库单 | 单据状态 |  |
| wms.ts | `wms-shipment-order` | 出库单 | 单据状态 |  |
| wms.ts | `wms-movement-order` | 移库单 | 单据状态 |  |
| wms.ts | `wms-check-order` | 盘点单 | 单据状态 |  |
| ai | `ai-api-key` | AI API 秘钥 | 状态 |  |
| ai | `ai-chat-role` | AI 聊天角色 | 状态 |  |
| ai | `ai-image` | AI 绘画 | 生成状态 |  |
| ai | `ai-knowledge` | AI 知识库 | 状态 |  |
| ai | `ai-knowledge-document` | AI 知识库-文档 | 状态 |  |
| ai | `ai-knowledge-segment` | AI 知识库-文档分段 | 状态 |  |
| ai | `ai-model` | AI 模型 DO默认模型： 为开启，并且 排序第一 | 状态 |  |
| ai | `ai-music` | AI 音乐 | 音乐状态 |  |
| ai | `ai-tool` | AI 工具 | 状态 |  |
| ai | `ai-workflow` | AI 工作流 | 状态 |  |
| iot | `iot-alert-config` | IoT 告警配置 | 配置状态 |  |
| iot | `iot-data-rule` | IoT 数据流转规则 DO监听 数据源，转发到 数据目的 | 数据流转规格状态 |  |
| iot | `iot-data-sink` | IoT 数据流转目的 | 数据流转目的状态 |  |
| iot | `iot-device-group` | IoT 设备分组 | 分组状态 |  |
| iot | `iot-device-modbus-config` | IoT 设备 Modbus 连接配置 | 状态 |  |
| iot | `iot-device-modbus-point` | IoT 设备 Modbus 点位配置 | 状态 |  |
| iot | `iot-ota-task` | IoT OTA 升级任务 | 任务状态 |  |
| iot | `iot-ota-task-record` | IoT OTA 升级任务记录 | 升级状态 |  |
| iot | `iot-product` | IoT 产品 | 产品状态 |  |
| iot | `iot-product-category` | IoT 产品分类 | 分类状态 |  |
| iot | `iot-scene-rule` | IoT 场景联动规则 | 场景联动状态 |  |
| pay | `pay-app` | 支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家 | 状态 |  |
| pay | `pay-channel` | 支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P | 状态 |  |
| pay | `pay-demo-withdraw` | 示例提现订单演示业务系统的转账业务 | 提现状态 |  |
| pay | `pay-notify-log` | 商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排 | 支付通知状态 |  |
| pay | `pay-notify-task` | 支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直 | 通知状态 |  |
| pay | `pay-order` | 支付订单 | 支付状态（字符串状态机 WAITING/SUCCESS/CLOSED，见 pay-order-lifecycle.ts） |  |
| pay | `pay-order-extension` | 支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录 | 支付状态（字符串状态机 WAITING/SUCCESS/CLOSED，见 pay-order-lifecycle.ts） |  |
| pay | `pay-refund` | 支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO : | 退款状态 |  |
| pay | `pay-transfer` | 转账单 | 转账状态 |  |
| pay | `pay-wallet-recharge-package` | 会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额； | 状态 |  |
| member | `member-group` | 用户分组 | 状态 |  |
| member | `member-level` | 会员等级 DO配置每个等级需要的积分 | 状态 |  |
| member | `member-sign-in-config` | 签到规则 | 状态 |  |
| member | `member-user` | 会员用户 DOuk_mobile 索引：基于 字段 | 帐号状态 |  |
| mall | `product-brand` | 商品品牌 | 状态 |  |
| mall | `product-category` | 商品分类 | 开启状态 |  |
| mall | `product-spu` | 商品 SPU | 商品状态 |  |
| mall | `article` | 文章管理 | 状态 |  |
| mall | `article-category` | 文章分类 | 状态 |  |
| mall | `banner` | banner | 状态 |  |
| mall | `bargain-activity` | 砍价活动 | 活动状态 |  |
| mall | `bargain-record` | 砍价记录 DO TO | 砍价状态 |  |
| mall | `combination-activity` | 拼团活动 | 活动状态 |  |
| mall | `combination-record` | 拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人 | 开团状态 |  |
| mall | `coupon` | 优惠劵 | 优惠码状态 |  |
| mall | `coupon-template` | 优惠劵模板 DO当用户领取时，会生成 优惠劵 | 状态 |  |
| mall | `discount-activity` | 限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一 | 状态 |  |
| mall | `point-activity` | 积分商城活动 | 活动状态 |  |
| mall | `reward-activity` | 满减送活动 | 状态 |  |
| mall | `seckill-activity` | 秒杀活动 | 活动状态 |  |
| mall | `seckill-config` | 秒杀时段 | 状态 |  |
| mall | `after-sale` | 售后订单，用于处理 交易订单的退款退货流程 | 退款状态 |  |
| mall | `brokerage-record` | 佣金记录 | 状态 |  |
| mall | `brokerage-withdraw` | 佣金提现 | 状态 |  |
| mall | `delivery-express` | 快递公司 | 状态 |  |
| mall | `delivery-pick-up-store` | 自提门店 | 门店状态 |  |
| mall | `trade-order` | 交易订单 | 订单状态 |  |
| crm | `crm-product` | CRM 产品 | 状态 |  |
| report | `go-view-project` | GoView 项目表每个大屏图标，对应一个项目 | 发布状态 |  |
