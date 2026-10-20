# 软件测试执行总结报告 (Test Summary Report)

- **生成方式**: `npm run test:summary` —— **本文件由脚本生成，禁止手写**（数字来自真实 vitest JSON reporter）
- **生成日期**: 2026-10-19
- **真源**: 全量 `pnpm exec vitest run` 的 JSON 报告

> 此前的版本是手写的，声称「14 个测试文件 / 61 个用例 / 55 passed」，实测为
> 「450 文件 / 869 用例 / 849 passed」—— **差了约 32 倍**。
> 手写数字必然漂移，故改为生成。

---

## 1. 真实测试大盘（实测，非估算）

| 指标 | 实测值 | 说明 |
|---|---|---|
| **测试文件总数** | **450** | Vitest 实际加载的文件 |
| **测试文件通过 / 失败** | **450 / 0** | 口径＝ Vitest 的 `testResults[].status` |
| 测试块（suite）通过 / 失败 | 926 / 0 | 口径＝ `numPassedTestSuites`（**是块数，不是文件数**） |
| **测试用例总数** | **869** | — |
| **通过** | **849** | — |
| **失败** | **0** | **必须为 0** |
| **跳过** | **20** | 环境相关（如未配置 `DATABASE_URL` 的 PG 集成测试） |
| **源码中 `expect()` 总数** | **3889** | 源码计数（vitest JSON 不提供），口径可复核 |

> 跳过 6 个文件级套件，全部因**环境条件**而非缺陷 —— 例如未配置
> `DATABASE_URL` 时的 PostgreSQL 集成测试。检查方式：把这些套件单独在具备该环境时跑一遍。

## 2. 分层与假 Mock 治理

- 测试依赖真实存储：内存回退（无 `DATABASE_URL`）或真实 SQLite/PostgreSQL；
  **不存在前端伪造 Mock 充当数据库的情形**。
- 断言空转度由 `npm run vacuity:audit` 审计（report-only）——
  实测 850 个测试块中字面量恒真断言 0 处。
- 断言**杀伤力**由 `npm run mutation:gate` 验证（语义突变必须被测试杀死）。

## 3. 复现方式

```bash
npm run test            # 全量（本报告的真源）
npm run test:unit       # L1
npm run test:integration# L2
npm run test:contract   # L3 契约产物层
npm run test:e2e        # L4（Playwright）
npm run test:summary    # 重新生成本报告
```

## 4. 逐套件结果（按状态）

| 状态 | 套件数 |
|---|---|
| 通过（文件） | 450 |
| 失败（文件） | 0 |
| 全为 skip 的套件 | 6 |

**结论：全量套件 0 失败。**
