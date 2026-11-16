# 踩坑实录：better-sqlite3 布尔值映射为整型 0/1

### 现象
直接向 SQLite 传入 JS `true` / `false` 参数时，`better-sqlite3` 报 `TypeError: SQLite3 only supports number, string, bigint, buffer, null`。

### 解法
在 `packages/shared/backend/lib/database/kysely-client.ts` 中对 SqliteDialect 的 prepare 函数进行包装，自动将布尔参数清洗为 `1` 或 `0`。
