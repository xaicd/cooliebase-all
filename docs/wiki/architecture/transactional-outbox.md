# 架构百科：事务性发件箱 (Transactional Outbox)

> 对应规则：AGENTS.md §3.3 / §4.2

## 一、 解决的核心问题
在微服务或模块化解耦中，**“写本地数据库”与“向消息总线发事件”必须处于同一个本地 ACID 事务中**。如果先发消息后写库，可能写库失败导致数据不一致；如果先写库后发消息，可能网络中断导致下游丢事件。

## 二、 使用范式
```ts
import { runUnitOfWork } from '@/shared/backend/lib/transactional-outbox';

await runUnitOfWork(async (uow) => {
  // 1. 执行业务写操作 (挂在同一本地事务中)
  await uow.db.insertInto('mall_order').values({ id: 'ord-01', total_fee: 100 }).execute();

  // 2. 将可靠领域事件追加至 outbox 发件箱表
  uow.appendOutbox({
    type: 'mall.order.created',
    source: 'mall',
    payload: { id: 'ord-01' }
  });

  // 如果此处发生任何 throw，本地写库与 outbox 记录一同 ROLLBACK！
});
```
