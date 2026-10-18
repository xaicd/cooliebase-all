---
name: new-business-plugin
description: 从一句业务需求（如"做个电商平台"）到新业务域跑起来的第一方插件全链路：起底座、写表元数据、建表、codegen 生成全栈代码、注册为插件、编译、打包、运行预览。接到"新业务/新平台/加一个业务域/定制 plugin"时启用。
---

# 新业务域 → 第一方插件 全链路交付


## 走交付链，不要手写文档

**先读 `AGENTS.md` §3.4「AI-Driven 交付链」** —— 从一句话需求到交付的 12 步与全部入口都在那里。

最短路径:

    npm run feature:new -- --name <名> --domain <域> --title "<标题>"   # 产 brief.json
    # 填 brief（模型只写这一份）
    npm run feature:build -- --name <名>                                 # 展开 6 文档 + evidence + runbook
    npm run delivery:check -- --feature <名>                             # 逐条「还缺什么」
    npm run domain:new <域>                                              # 建域
    npm run check && npm run task:verify -- --feature <名> --summary      # 门禁 + 从 git 追溯

**记住两半**: 规划链在 `docs/features/<名>/`，实现在 `<域>` 的目录 ——
特性目录里不放业务代码。

## 把既有域的原语接进业务域（库存 / 支付）

电商类业务**不要重写**库存扣减与支付状态机 —— 那两样已经在 `wms` / `pay` 里做成了
**条件更新**与**状态机**。业务域只写"决策"，把"保证"留在原语里。

**跨域必须走 Facade**（AGENTS §3.3）:

```ts
import { wmsFacade } from "@/plugins/plugin-wms/contract/wms.facade"      // 跨插件调用必须走 Facade，不 import 它的 Service
import { defineStateMachine } from "@/shared/backend/lib/state-machine"
```

三条落地要点（都有对应测试）:

1. **预占失败就不建单** —— `wmsFacade.lockStock({ inventoryId, amount })` 是条件更新
   （不足则影响 0 行）。拿到 0 行**直接返回失败**，别插订单 —— 失败方**不改变数据**。
2. **回调幂等靠"条件更新"，不是靠判断** —— `setStatusIfCurrent(id, "PENDING", "PAID")`
   返回 false 就**不发业务事件**。重复回调天然幂等，且已支付不会被降级。
3. **只有合法前置状态能做动作** —— 取消只允许 `PENDING`；用状态机声明，别写 if。

**测什么**: 单测 mock 的是 **Facade 端口**（测决策逻辑）；Facade 背后的真实条件更新
由**那个域自己的库级测试**覆盖 —— 不要在这里再 mock 一遍数据库。

参考实现: `docs/features/ecommerce/tasks.md` 的 T10（`shop-order-ops.ts` + 3 条测试）。

## 1. 何时启用

用户说「**要做一个 X 平台 / 加一个业务域 / 定制一块业务**」这类**从零起新域**的需求时。

与其它 Skill 的分工：

| 需求 | 用哪个 |
|---|---|
| 起一个**新工程** | 本 Skill 第 2 步 |
| **新建一个业务域**（新表、新 CRUD、新页面） | **本 Skill** |
| 在**已有域**里加一个功能 | `new-feature` |
| 写/装/排障**第三方插件** | `plugin-authoring` |
| 域的拆分部署与阶段演进 | `microservice-evolution` |

## 2. 定形态（先决定，别默认整仓）

```bash
npm run project:create -- <路径>                     # base（默认）: 只要 system+infra，最轻
npm run project:create -- <路径> --profile minimal   # + online/ai/aigw（要低代码在线表单就选它）
npm run project:create -- <路径> --profile standard  # 整仓 17 个域
npm run project:create -- <路径> --bundle mall,crm   # 只要地基 + 指定业务域
```

**新项目默认只带 `system` + `infra`** —— 加载/运行/预览都快，定制扩展也快；要什么再加。

孵化会自动完成：建库 → 迁移 → **种子（含管理员与菜单）** → 裁剪 → lockfile 同步 →
生成物重建 → 路径重命名 → 自检，并**打印管理员凭据**。

**启动前先清掉 shell 里的同名环境变量**（`DATABASE_URL` / `DB_DRIVER` / `TENANT_*`）——
它们的优先级**高于 `.env`**，不清会连到别的库、或把管理员当租户账号，
表现为「登录说用户名或密码错误」（实测踩过）。

## 3. 一条命令走完（推荐）

写下表元数据之后，**其余步骤由一条命令串起来**（每步幂等、可重复运行）：

```bash
npm run domain:new <域>          # 校验元数据 -> 生成迁移 -> codegen -> 注册插件 -> 重生成 -> 打印后续
npm run domain:new <域> --dry-run  # 只校验元数据与表清单
```

它**不做**三件事（都要人或 CI 决定）：不写元数据（字段类型是产品决策）、
不 `prisma migrate deploy`（目标库由部署决定）、不提交推送。

第 4~7 节是它内部做的事 —— 单独执行其中某步时按那里操作。

## 4. 建表：先写**元数据**（唯一真源，别手写 DDL）

域的表定义写进 `scripts/data/<域>-tables.ts`（`CodegenConfig[]`），列里带上
`type / tsType / nullable / comment`，需要时补 `maxLength / precision / scale /
defaultValueTyped`。

```bash
npx tsx scripts/generate-table-migration.ts \
  --tables scripts/data/<域>-tables.ts --export <X>_TABLES --name add_<域>_tables --write
```

**为什么不能手写 DDL**：`standards:check` 的 `table-definition-coverage` 拦的是
「仓储在查、却没有任何地方创建」的表 —— 那种表在内存回退下全绿、一连真实库就
`relation does not exist`，且**静默**。

## 5. 生成完整代码（低代码，别手抄 CRUD）

```bash
npm run scaffold -- --pack service-pattern --module <域>/<功能> --entity <X> ...
```

或用 codegen 引擎按表批量生成（`CodegenEngineService.generateCodes(config)`），
产出：`contract/`（actions + rbac.sql）、`backend/`（types/validators/repositories/
services/rpc/**tests**）、`frontend/`（api/components/pages）、`src/app/api/v1/admin/<域>/…`
（**真处理器**，已被 `withAdminRoute` 包好）、以及**建表迁移**。

> 生成物已包含 CRUD 全套与测试。**禁止**再手写一遍 —— AGENTS §19「零重复代码」。

## 6. 注册为第一方插件（幂等可续跑）

```bash
node scripts/migrate-domain-to-plugin.cjs <域>            # 先 dry-run 看影响面
node scripts/migrate-domain-to-plugin.cjs <域> --write
```

它做 0~7 步：搬路由处理器进域内 → 生成 manifest+入口 → 移入 `packages/plugins/plugin-<域>`
→ `cooliebasePlugin` 指针 → 静态入口表 → **catalog 登记为 `kind=plugin`** →
`rpc-actions` / `hatch-manifest` / `compat-manifest` / 治理行 → tsconfig+vitest 别名 →
删 Next 转发文件。

**新域（尚未登记）也支持** —— 它会先按插件语义补登记，再走后续步骤。
**可重复运行**：已完成的步骤跳过，未完成的续做。

## 7. 重生成 + 门禁（顺序不能错）

```bash
npm run domain:contracts && npm run domain:seams && npm run domain:manifests && npm run admin:routes:manifest
pnpm install          # 新插件进了工作区
pnpm run check && npx vitest run
```

**顺序**：`contracts` 会重写 `module.manifest.json`，必须跑在 `manifests` **之前** —— 反了就会一直报漂移。

## 8. 编译 / 打包 / 运行预览

```bash
pnpm run build                    # 编译
npm run domain:pack <域>          # 打包 -> dist/domain-packs/<域>
pnpm run dev                      # 运行（或 ./start.sh app）
```

预览：登录 → 侧边栏进入新域页面；接口面是**插件挂载点**
`/api/v1/plugins/cooliebase.<域>/api/**`（**不是** `/api/v1/admin/<域>/...`，后者本就 404）。

**新域第一次要登记插件**（宿主只挂载已登记的）：`POST /api/v1/admin/plugins`。

## 9. Agent-Native：测试与运营框架**随代码同步产出**（强制）

新域不需要另外写测试页/运营脚本 —— 生成器与元数据同源产出，agent-device（接口级）
与 agent-browser（浏览器级）直接消费：

### 9.1 UI 必须带 Agent-Native 属性（强制）

| 要求 | 具体 |
|---|---|
| 交互元素 | `data-agent-target="<模块>:<动作>"`（search/reset/refresh/create/edit/delete/submit/cancel/close） |
| 作用域 | 根节点 `data-agent-scope` |
| 状态 | `data-agent-state`（页面 loading/modal-open/empty/ready；行 idle/editing；表单 open/submitting/error） |
| 就绪信号 | 页面顶层 `data-agent-page-ready={String(!loading)}` |
| 多层弹窗 | 基底容器打 **`inert`** 做节点剪枝（agent 不会点到被遮挡元素） |
| 移动端 | testID 用 `[Screen]__[Component]__[Action]`（如 `mes.mes-cal-holiday__Form__Submit`） |

**严禁**让 agent 依赖无文本 CSS 或坐标定位。
门禁: `npm run agent:native:check`（ratchet，只拦新增）。

### 9.2 Agent 操作契约（随代码产出）

每张表产出 `<插件根>/agent/<kebab>.agent.json`：页面路由、接口面、鉴权、选择器、
无障碍标签、旅程、运营动作，外加 `agentNative` 段（上面的属性规范，机器可读）。
汇总: `npm run agent:contracts` → `docs/agent/contracts.json`。

### 9.3 两个通用 runner（消费契约，无需逐域写代码）

```bash
npm run agent:ops:health                       # 全量接口体检（结构断言）
npm run agent:ops -- <域>.<实体> seed-sample    # 造样例数据（运营）
npm run agent:ops -- <域>.<实体> purge-sample   # 清本契约造的样例
pnpm test:agent                                # L4: 契约驱动的浏览器端到端旅程
```

改表 → 契约与用例自动跟着变，不存在"测试/运营文档与代码脱节"。

## 9. 验收清单（做完逐条打勾）

- [ ] 表元数据已写，迁移已生成**并 `prisma migrate deploy` 到库**
- [ ] codegen/脚手架产出含 **CRUD + 校验 + 测试**，不是只读骨架
- [ ] 插件 manifest 的声明面与入口实现面**一一对应**
- [ ] `pnpm run check` **exit=0**（含 `table-definition-coverage`）
- [ ] `npx vitest run` 内存模式全绿
- [ ] `pnpm run build` exit=0
- [ ] 启动后：登录成功，插件挂载点接口返回 **200**（不是 404/500）

## 10. 禁止项

1. 手写重复 CRUD / 重复 DDL —— 用元数据 + 生成器，先检索已有工具。
2. 写死路径（`packages/domains/...`）—— 用共享解析器；写死的后果通常**不是报错，而是静默失效**。
3. 把定制业务放进**基座**（基座只建 CoolieBase 原生域）。
4. 生成物手改 —— 一律让生成器重建。
5. 跳过 `npm run check`。

## 11. 权威文档

`AGENTS.md`（§3.2 目录与插件、§9.5 表定义真源、§14 代码生成、§17 基座边界、§19 零浪费）、
`docs/architecture/artifacts/source-parity-report.md`（与源框架的能力对账）、
`npm run domains:capabilities`（按域盘点）。
