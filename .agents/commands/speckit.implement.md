---
description: SpaceX 级真实数据库驱动测试 (Spec-Ops Real DB Verification) - 100% 拒绝假 Mock
---
请执行真实数据库自动化测试套件：
1. 执行命令：`npm run verify:real-db -- --keep`；
2. 验证基于真实 PostgreSQL / 嵌入式 SQLite 真实 C 引擎的**全部**测试（含 CAS 并发防超卖）通过 ——
   **数量不写死**，以命令输出为准（`verify:real-db` 会打印 files / tests 汇总）；
3. 断言 0 假 Mock、0 伪造数据，确保测试退出码为 0。
