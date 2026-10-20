-- 20261019160000_pay_status_text
-- 把支付订单状态列由 INTEGER 改为 TEXT。
--
-- 为什么：这两列是**字符串状态机**的落点 —— `pay-order-lifecycle.ts` 定义
-- `PayOrderStatus = "WAITING" | "SUCCESS" | "CLOSED"`，service / 契约 / 前端四层一致使用字符串。
-- 而列此前是 INTEGER（由上游导入的元数据推导建表），**任何应用代码都写不进合法值**：
-- 真实库报 `invalid input syntax for type integer: "WAITING"`（内存回退不校验类型，故长期未暴露）。
--
-- 为什么改列而不是改应用：仓内**不存在任何整数状态码约定**（无种子 / 无 init SQL / 归档文档亦无），
-- 编码只能凭空发明；且**没有任何代码读取整数**（不存在 `status === 0` 之类的比较），
-- 故文本在实践上是整数的超集，改列不破坏任何消费者。依据见
-- docs/01_management/dar-decision-records/pay-order-status-column-type.md。
--
-- 转换无损：`USING "status"::text` 保留原值的十进制表示。

ALTER TABLE "pay_order" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "pay_order_extension" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
