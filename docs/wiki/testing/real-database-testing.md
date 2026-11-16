# 测试百科：真实数据库驱动与并发 CAS 防超卖

## 一、 为什么拒绝假 Mock？
内存数组 (`items.filter()`) 不校验数据库引擎的真实约束（如列名拼错、NOT NULL 漏填、跨租户越权、并发死锁）。

## 二、 双模真实驱动
1. **嵌入式 SQLite C 引擎**：
   - 零配置、毫秒级拉起，自带真实 WAL 模式与外键约束；
   - 用于日常开发与 CI 快速回归。
2. **PostgreSQL 容器镜像**：
   - 用于上线前全量渗透扫描与生产发布验证。

## 三、 CAS 原子影响行数验证
```sql
UPDATE inv_atomic_probe 
SET qty = qty - 4 
WHERE id = 'p1' AND tenant_id = '1' AND qty >= 4 
RETURNING id;
```
通过受影响行数判定扣减是否成功，并发场景下有且只有一个请求返回 1，另一请求返回 0，天然防超卖。
