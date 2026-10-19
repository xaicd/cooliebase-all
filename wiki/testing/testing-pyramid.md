# 测试百科：四层金字塔测试体系 (L1~L4)

```
                   ▲
                  /      L4: 契约端到端旅程 (Playwright & run-ops)
                 /       L3: 契约与跨域门禁 (rpc-actions & seam-graph)
                /        L2: 嵌入式 SQLite / PG 集成测试 (真实引擎)
               /_______  L1: 业务逻辑与算法单测 (纯函数/状态机)
```

- **L1 单元测试**：毫秒级纯函数、状态机跃迁矩阵断言；
- **L2 集成测试**：由嵌入式真实 SQLite (`better-sqlite3`) 或 PostgreSQL 驱动，校验外键、行级锁、租户隔离；
- **L3 契约测试**：验证 OpenAPI 与 RPC Actions 契约前后向兼容；
- **L4 自动化旅程**：由 326 份 Agent 契约直接驱动无头浏览器与无头 API 运营。
