---
name: database-design
description: 表结构设计、迁移、多租户隔离、多数据库兼容。改 schema、仓储、SQL 时启用。
---

# 数据库设计与多库兼容规范

## 1. 适用场景
- 设计新业务表、扩展已有字段或设计多对多关联。
- 执行数据库迁移（Prisma Migration）。
- 编写 Kysely 仓储层查询与多数据库方言兼容适配。

## 2. 权威依据
- `AGENTS.md` §3.3 (数据库边界与 Kysely 仓储规范)
- `AGENTS.md` §4.6 (事务与状态守卫规范)
- `AGENTS.md` §6.1 (database-compatibility 治理规范)
- `docs/architecture/cooliebase-all-database-compatibility.md`
- Prisma Schema（PostgreSQL 为默认主源，兼顾 MySQL / 达梦 / Oracle）

## 3. 标准表结构六大审计字段 (强制包含)
所有业务表必须包含统一命名的多租户与审计字段：

```sql
tenant_id    VARCHAR(64) NOT NULL DEFAULT '0', -- 租户ID (多租户隔离)
creator      VARCHAR(64) DEFAULT '',          -- 创建人ID
create_time  TIMESTAMP NOT NULL DEFAULT NOW(),-- 创建时间
updater      VARCHAR(64) DEFAULT '',          -- 更新人ID
update_time  TIMESTAMP NOT NULL DEFAULT NOW(),-- 更新时间
deleted      BOOLEAN NOT NULL DEFAULT FALSE   -- 软删除标记 (0/1 或 false/true)
```

## 4. 索引设计铁律
1. **主键**：统一使用有序字符串 ID（如 NanoID / CUID / 雪花ID）或自增 BigInt。
2. **复合索引最左前缀**：涉及多租户查询时，索引必须以 `tenant_id` 为前导列：
   `CREATE INDEX idx_order_tenant_status_time ON mall_orders (tenant_id, status, create_time DESC);`
3. **软删除查询覆盖**：高频查询必须将 `deleted` 纳入组合索引考量。

## 5. 多数据库方言兼容规范
- **禁止使用单库专属方言函数**（如 PG 专有的 `jsonb_build_object` 或 MySQL 专有的 `FIND_IN_SET`）。
- 仓储层统一使用 **Kysely 查询构建器**，由驱动层抹平参数化占位符差异（PG `$1,$2` vs MySQL `?,?`）。
- 内存回退机制：当未连接真实物理数据库时，Repository 必须提供完全一致的 MEMORY_STORE 模拟实现，保证离线与轻量单元测试 100% 可行。

### 5.1 多租户查询过滤实现（强制）
1. **租户来源**：查询/写入时租户必须从全局上下文取（`getCurrentTenantId()`，`packages/shared/backend/lib/biz-tenant.ts`），禁止依赖调用方显式传 `tenantId` 参数透传（断链=数据泄露，见 AGENTS.md §4.8）。
2. **双模式同语义**：真实库 `where tenant_id = <current>`；内存 Repository 必须等价过滤（`!row.tenantId || row.tenantId === current`），禁止内存不过滤。
3. **写入侧**：insert 时 `tenant_id` 取上下文值；无上下文场景（open/relay/内部任务）从已验证的资源归属取（如 API Token 的 `token.tenantId`），禁止硬编码 `"1"` 或 `null`。
4. **required 兜底**：`TENANT_MODE=required` 时缺租户直接抛错（`requireTenantId()`），把静默全量返回变成显性 bug。

## 6. 全量初始化与最新 SQL 构建标准（唯一官方标准入口）
- **唯一官方生成命令**：`npm run build:init-sql`（对应 `scripts/build-v1-init-sql.ts`）。
- **职责**：提取 Prisma 纯净 DDL 并拓扑排序装配全域 Seed 数据，自动编译输出 `sql/init/cooliebase_all_next_v1.0.0_postgresql.sql`。
- **严禁项**：严禁私自手写临时 scratch 脚本导出/篡改初始化 SQL，必须通过维护 `scripts/build-v1-init-sql.ts` 形成统一资产。

## 7. 绝对禁止项
- 严禁通过字符串拼接拼装 SQL（防止 SQL 注入）。
- 严禁跨域直接操作他域的数据表（必须走 Domain Facade）。
- 严禁生产环境无备份直接执行破坏性迁移（DROP COLUMN / DROP TABLE）。
- 严禁绕过 `scripts/build-v1-init-sql.ts` 手写临时初始化 SQL。
