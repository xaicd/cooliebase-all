# 表元数据草稿（待评审，**未接入**）

> 由 `node scripts/draft-missing-table-metadata.cjs` 生成，**请勿直接使用**。
> 本仓表定义真源是低代码元数据（AGENTS §9.5）：评审通过后手工写入
> `scripts/data/<x>-tables.ts`，再用 `scripts/generate-table-migration.ts` 生成迁移。
> 之所以只是草稿: TS 类型不足以确定 PG 类型（`number` 可能是 int 也可能是 decimal；
> `createdAt: string` 语义上是 timestamp），标 `?` 处需人工判断。

生成时间: 2026-10-21T14:10:59.352Z
