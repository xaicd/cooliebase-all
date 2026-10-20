# 测试规范

本仓的测试按 **4 层金字塔**组织（AGENTS.md §19）。本文档只描述**当前真实状态**，
包括已知缺口——不要照着"理想状态"写用例。

## 1. 四层与落位

| 层 | 目的 | 位置 | 运行器 |
|---|---|---|---|
| **L1 单元** | 纯逻辑，无网络、无数据库 | `src/**/__tests__/*.test.ts`（69 个）、`test/unit/`（2 个） | vitest |
| **L2 集成** | 真实数据库读写 | `test/integration/`、以及服务层的 `*-services.test.ts` | vitest |
| **L3 契约** | RPC / Facade / 路由契约 | `packages/shared/backend/lib/__tests__/rpc-protocol.test.ts` 等 | vitest |
| **L4 E2E** | 浏览器端到端与 Agent UI 探针 | `test/e2e/`、`test/agent/` | Playwright |

## 2. 命令

```bash
npm test              # 全量 vitest（覆盖 src/**、scripts/**、test/**）
npm run test:unit     # 仅 test/unit
npm run test:integration  # 仅 test/integration
npm run test:matrix   # test/unit + test/integration
npm run test:e2e      # playwright test test/e2e
npm run test:agent    # playwright test test/agent
npm run test:all      # test:matrix 串 playwright
```

## 3. 底座（复用，不要自己造 Mock 初始化）

- **L1 断网**：`test/framework/network-guard.ts` 的 `assertNoNetwork()` / `restoreNetwork()`。
  单元测试必须自洽，真实网络请求会让用例不可复现，并把它做成"集成测试"。

  ```ts
  import { assertNoNetwork, restoreNetwork } from "../../test/framework/network-guard"
  beforeEach(() => assertNoNetwork())
  afterEach(() => restoreNetwork())
  ```

- **L2 真实库**：`packages/domains/infra/testing/TestingKit`
  - `createTestDatabase()` —— 真嵌入式 SQLite（WAL + 外键），带种子数据，返回 `{ db, dbPath, cleanup }`。
    **这是真实数据库，不是伪造 mock**；不要另写内存假实现。
  - `createMockUserContext()` —— 标准用户/租户上下文
  - `createMockRequest()` —— 构造 Next.js `Request`（走 `next/server` 路由时用，**不是** express/supertest）

- **L4 探针**：`TestingKit.getAgentPlaywrightProbeConfig()` 提供登录态与视口配置。

## 4. 已知缺口（诚实记录）

1. **`test:unit` 覆盖面偏小**：它只跑 `test/unit/`；**域级单元测试在 `packages/**/__tests__/`**，
   数量以 `find packages -path '*__tests__*' -name '*.test.ts' | wc -l` 为准（不写死）。
   要跑全量请用 **`pnpm run test:clean`** —— 覆盖 `test/` + `packages/`，且**剔除
   `DATABASE_URL` / `DB_DRIVER` / `NODE_ENV`**（手写 `env -u …` 漏掉 NODE_ENV 会在
   `NODE_ENV=production` 的 shell 里误红，实测）。
2. **L4 目前跑不起来**：`package.json` 声明了 `test:e2e` / `test:agent`，`playwright.config.ts` 与
   `test/e2e/*.spec.ts` 也在，但 **`@playwright/test` 既不在依赖里也未安装**。启用前需要：
   `npm i -D @playwright/test && pnpm exec playwright install`。
3. **部分 L2 测试依赖外部数据库**：`infra-services` / `mp-services` / `oauth2.service` /
   `system-persistence-services` 是 PostgreSQL 集成测试，**未配置 `DATABASE_URL` 时会整体跳过**
   （不是失败）。要真实执行：直接跑 `npm run verify:real-db` —— 它会**自起嵌入式 Postgres**（零容器）、建独立验证库、迁移、种子，再跑全量测试；若已有真实库，设 `DATABASE_URL` 即可复用它。
4. **测试类型检查有既有欠账**：主 `tsconfig.json` 排除了 `**/__tests__/**` 与 `*.test.ts`，
   测试代码长期不在类型检查范围内。`tsconfig.vitest.json` 把它们纳入检查，据此可复现
   **94 个既有类型错误**，多为 `new Kysely({...})` 未带类型参数导致构造器推导为 `never`
   （如 `tenant-isolation-plugin.test.ts`、`codegen-engine.rpc.test.ts`）。

   ```bash
   pnpm exec tsc -p tsconfig.vitest.json --noEmit   # 诊断用；当前非全绿，未接入门禁
   ```

   另有一批更大的欠账在构建触及范围之外：`packages/domains/**/backend/services/*.rpc.ts`
   存在约 200 个类型错误（`Property 'registerHandler' does not exist`、`Cannot find name 'bus'`）。
   这些文件不被任何路由引用，因此 `next build` 不会检查到它们。全量口径：
   `pnpm exec tsc -p tsconfig.vitest.json --noEmit` 若把 `src/**/*.ts` 全量纳入为 293 个错误。

## 5. 编写约定

1. 测试文件命名 `*.test.ts`（vitest）或 `*.spec.ts`（Playwright），放在对应层的目录下。
2. 每个域至少 1 条关键路径用例；涉及权限边界要有拒绝路径；涉及事务要有回滚用例（AGENTS.md §8）。
3. 断言优先用真实数据流，不要为了让用例通过而伪造返回值。
4. 新增测试脚手架前先看 `TestingKit` 与本文档——重复的 Mock 初始化正是这一层要消灭的东西。
