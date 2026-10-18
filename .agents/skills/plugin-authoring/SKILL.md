---
name: plugin-authoring
description: 编写、安装、排障与评审 §6.2 可安装插件（插件包结构、manifest 契约、capability 白名单、worker stdio 协议、生命周期状态机）。接到"写插件/装插件/插件报错了/manifest 怎么填/插件和 module 有什么区别"时启用。
---

# 插件编写与接入规范 (Plugin Authoring & Installation)

## 1. 适用场景

- 要**写**一个新插件（第三方扩展、客户定制能力、按客户隔离的功能包）。
- 要**装**一个插件进实例，或排查"装了但状态不是 ready"。
- 要评审某段扩展代码：它应该是 Plugin，还是 Platform Module？

**先做这个判断，方向错了后面全错。**

## 2. 先分清三类东西（旧文档说"不要插件化域"，**已作废**）

> ⚠️ 本仓已把 **15 个业务域**改造成**第一方插件**（`packages/plugins/plugin-<domain>/`）。
> 旧版 skill 写的"不要把域改造成插件"是**迁移前**的结论，已不成立。以下为准。

| | 平台地基 | **第一方插件**（域插件化后的形态） | 第三方插件 |
|---|---|---|---|
| 目录 | `packages/domains/<name>/` | `packages/plugins/plugin-<name>/` | 实例插件目录（`COOLIEBASE_PLUGIN_DIR`） |
| 当前成员 | `system` / `infra`（**永不插件化**） | 15 个业务域 | 客户/外部扩展 |
| 语言 | TS | **TS**（必须登记静态入口） | 编译后的 JS（运行期 import） |
| 信任 | 可信 | 可信（第一方） | **capability 受限** |
| 默认形态 | 同进程 | `merged` | `isolated` |
| 声明面 | `contract/module.manifest.json`（**派生生成**，勿手改） | `plugin.manifest.json`（**生成**，勿手改）+ `domain` 域级特征段 | `plugin.manifest.json`（**手写**） |
| 数据库 | 自有表 + 迁移 | 自有表 + 迁移 | **禁止直连 DB**，走宿主扩展表 |
| 可独立部署 | ✅ `npm run domain:up -- <name>` | ✅ 同上（proxy 按 `publicPrefixes` 转发） | 实例内启停 |

**判断规则：**

- 加**新的业务能力** → 走 `new-feature` skill；落在哪个域由该域当前形态决定，**别猜路径**
  （用 `cooliebase_domain_resolve` / `domainDirOf` 解析）。
- 把某个**还没插件化的业务域**变成插件 → 见 §12「域 → 插件迁移」。`system`/`infra` 除外。
- 客户定制、按实例启停、来源不完全可信、要进程级隔离 → **第三方插件**（本 skill 其余章节）。

**铁律：`system` / `infra` 是平台地基，永不插件化** —— 它们没有域级插件语义，
业务域才需要"可装卸"。

## 3. 插件包结构

一个插件包 = 一个 npm 包目录。宿主**不从源码树读插件**，只读插件目录。

```
<插件目录>/<你的插件>/
├── package.json          ← 必须含 cooliebasePlugin 指针
├── plugin.manifest.json  ← 必须；必须是 JSON（不能是 .js）
├── worker.js             ← 可选；独立运行入口（out-of-process，stdio JSON-RPC）
├── merged.js             ← 可选；合并运行入口（in-process，宿主直接 import）
└── (可选) ui/            ← 预构建 UI bundle；宿主不编译，只静态分发

**worker 与 merged 至少声明一个**；两个都声明 = 该插件同时支持两种形态。
```

`package.json` 的入口指针（键名固定 **`cooliebasePlugin`**）：

```json
{
  "name": "@yourorg/plugin-foo",
  "type": "module",
  "cooliebasePlugin": {
    "manifest": "./plugin.manifest.json",
    "worker": "./worker.js",
    "merged": "./merged.js"
  }
}
```

**硬性要求：**

1. `manifest` 必须是 **JSON 文件**。宿主若允许 JS 模块，读 manifest 就等于在宿主进程里执行你的代码 —— 这条不会放开。
2. `manifest` / `worker` 路径**必须落在插件包目录内**。用 `../` 越界会被拒（防路径穿越）。
3. `worker` 指向的文件必须**真实存在**，否则安装期就被拒。
4. worker 里 `import` 的依赖必须能从插件包位置上溯解析到（宿主不代你安装依赖）。

参考实现：`packages/plugins/examples/hello-world/`（最小可运行示例）。

## 4. manifest 契约

```json
{
  "id": "yourorg.foo",
  "apiVersion": 1,
  "version": "0.1.0",
  "displayName": "Foo",
  "description": "一句话说明",
  "author": "Your Org",
  "categories": ["automation"],
  "capabilities": ["plugin.state.read"],
  "entrypoints": { "worker": "./worker.js" }
}
```

| 字段 | 规则 |
|---|---|
| `id` | `/^[a-z0-9][a-z0-9._-]{1,127}$/`，建议 `<org>.<name>` |
| `apiVersion` | **必须精确等于宿主值（当前 1）**，不做范围推断，不匹配即拒装 |
| `version` | semver |
| `categories` | `connector` / `workspace` / `automation` / `ui` 至少一个 |
| `capabilities` | 见下节，**声明是请求，不是授权** |
| `entrypoints.worker` | 必填 |
| `entrypoints.ui` | 可选；**声明了 `ui.slots` 就必须填**，否则宿主无处加载组件 |
| `ui.slots[].id` | 同一 manifest 内不可重复（跨插件重复由宿主命名空间化，不必自己加前缀） |

## 5. capability：白名单 + 禁忌清单

**白名单（只能声明这些）：**

`api.routes.register`、`events.subscribe`、`http.outbound`、`jobs.schedule`、
`plugin.state.read`、`plugin.state.write`、`ui.page.register`、`webhooks.receive`

**禁忌（声明即拒，且拒绝理由会明确写"属禁忌能力"而不是含糊的"未知能力"）：**

`auth.bypass`、`budget.override`、`database.direct`、`issue.checkout_override`

**只声明你真正要用的能力。** 未在白名单内的能力一律拒装；重复声明也拒。
宿主在网关派发处按声明的 capability 做授权判定 —— 没声明就调，得到的是 403。

> 现状边界（不要假设更多）：capability 目前在**网关派发**处强制，尚未下沉到 SDK 内部。
> 因此"声明了 A 却去用 B"不会被 SDK 拦住。写插件时请自行遵守声明，别把它当成沙箱。

## 6. worker 协议

宿主与 worker 之间走 **stdio 上的逐行 JSON-RPC**：一行一个 JSON 对象，`\n` 分隔。

**三个必选方法**（缺任一个即不合格 worker）：

| 方法 | 语义 |
|---|---|
| `initialize` | 启动时调一次。参数含 `manifest` / `config` / `hostApiVersion` / `instance` |
| `health` | 返回 `{ status: "ok" \| "degraded" \| "error", message?, diagnostics? }` |
| `shutdown` | 收到后应尽快自行退出 |

**用 SDK 就不用手写这些：**

```js
import { definePlugin, runWorker } from "@cooliebase/plugin-sdk"

const plugin = definePlugin({
  async setup(ctx) { ctx.logger.info("ready") },
  async onHealth() { return { status: "ok" } },
  async onShutdown() { /* 快速收尾 */ },
})

runWorker(plugin)
```

**两条必须遵守的约定：**

1. **stdout 只走协议，诊断信息一律写 stderr。** 往 stdout 打普通日志会污染协议流。
2. **不要自己实现并发调度。** 协议的 dispatch 是严格按序的 —— `initialize` 必须最先、
   `shutdown` 必须最后。若你绕过 SDK 自己写，务必保证同样的顺序：早期实现因为并发分发，
   导致 `health`/`shutdown` 的响应先于 `initialize` 返回，`health` 还会误报"尚未 initialize"。

**宿主侧时限（可配）：** 单请求 15s；`initialize` 20s；停机阶梯 `shutdown()` → 10s → SIGTERM → 5s → SIGKILL。

## 6.5 运行形态：独立（isolated）与合并（merged）

**一份业务逻辑，两种跑法** —— 与域的双模 Facade（同进程 SDK ↔ 跨进程 RPC）是同一个原则。
你在 SDK 里只写一份 handler，两种形态由**宿主**按插件实例的 `runtimeMode` 决定：

| | `isolated`（默认） | `merged` |
|---|---|---|
| 进程 | 独立子进程 | 与宿主同进程 |
| 传输 | stdio 逐行 JSON-RPC | 直接函数调用 |
| 隔离 | ✅ 插件崩溃/挂死**只影响自己**（宿主有超时与停机阶梯） | ❌ 插件崩溃/死循环**会带走宿主** |
| 入口 | `entrypoints.worker` | `entrypoints.merged` |
| 适用 | 第三方 / 来源不完全可信 | 第一方 / 自研，且要零 IPC 开销 |

**关键约束：能不能合并是运营的选择，不是插件说了算。**
宿主侧的 `plugin.runtime_mode` 决定形态；你只能通过"是否声明 merged 入口"表达**能力**：

- 只声明 `worker` → 只能独立跑
- 只声明 `merged` → 只能合并跑
- 两个都声明 → 由运营按插件配置选择（默认 isolated）

宿主对不匹配的配置**报错而不静默降级**：比如运营把插件配成 `merged`，而 manifest 没声明
`merged` 入口 → 该插件状态置 `error` 并给出明确原因。

**合并入口的写法**：不要 import SDK 的 `runWorker`（那是 stdio 专用），
只要把 handler 对象**导出**即可：

```js
import { definePlugin } from "@cooliebase/plugin-sdk"

export default definePlugin({
  async setup(ctx) { ctx.logger.info("ready") },   // ctx.mode === "merged"
  async onHealth() { return { status: "ok" } },
  async onShutdown() {},
})
```

宿主接受 `default` 或 `plugin` 具名导出。

### 两种形态都能对外服务路由

**声明判定与运行形态无关**：同一份 manifest、同一份 `routes` handlers，差别只在
派发时"代码在哪里跑"：

| 形态 | 路由派发路径 |
|---|---|
| `merged` | 宿主同进程直接调用 `routes[routeKey]`（零序列化） |
| `isolated` | 宿主经 worker 协议的**可选方法** `invokeRoute` 转发（stdio 逐行 JSON-RPC） |

`invokeRoute` 是**可选方法**：没实现它不算不合格 worker，但那种插件在 isolated 形态下
**路由不可达**（调用返回 `methodNotFound`，而不是静默返回空）。
如果你声明了 `apiRoutes` 又打算跑 isolated，就必须实现 `routes`。

## 7. 生命周期状态机

```
磁盘扫描通过 ──> installed ──> ready        （worker 起来且 initialize 成功）
                    │
                    └────────> error        （任一环节失败，原因写 lastError）
```

- 扫描不过的包**不落库**（它出现在 `rejected` 里，理由就是诊断面）。
- 状态**只由生命周期推进**：重新同步磁盘**不会**把 `error` 悄悄重置回 `installed`。
- 插件包从磁盘消失 → 逻辑删除并标 `error`，**不会继续谎报 ready**。

> 尚未实现：`upgrade_pending` → 运营显式批准新增 capability 后才转 `ready` 的升级审批流。
> 当前升级直接走 `installed → ready`。**不要**假设新增 capability 前会有一次审批。

## 8. 安装与验证

```bash
# 1. 把插件包放进实例插件目录（默认 .cooliebase/plugins，已 gitignore）
#    或用 COOLIEBASE_PLUGIN_DIR 指定别处
# 2. 触发扫描 + 启停 worker（需要 PLATFORM_PLUGIN_MANAGE 权限）
curl -X POST /api/v1/admin/plugins
# 3. 看状态（需要 PLATFORM_PLUGIN_QUERY 权限）
curl /api/v1/admin/plugins
```

响应里三类信息都要看：

- `plugins[].status` —— 期望 `ready`
- `plugins[].lastError` —— 非 null 就是失败原因
- `rejected[]` —— **被拒的包不落库**，只能从这里看到，容易漏看

## 9. 常见拒装原因速查

| 现象 | 原因 |
|---|---|
| `缺少合法的 cooliebasePlugin 指针` | `package.json` 没有 `cooliebasePlugin`，或缺 `manifest`/`worker` 字段 |
| `apiVersion N 与宿主支持的 1 不兼容` | 精确匹配失败，改 `apiVersion` |
| `capability "x" 不在宿主能力白名单内` | 拼写错，或该能力确实不提供 |
| `capability "x" 属禁忌能力` | 你在申请宿主明确不给的能力 |
| `entrypoints.worker 指向的路径不存在` | 路径写错，或忘了提交该文件 |
| `manifest 越出插件包目录` | 用了 `../` |
| 状态 `error` 且 lastError 提 spawn/超时 | worker 起不来、没回应 `initialize`、或语法/依赖解析错误（看 worker 的 stderr） |

## 10. 禁止项

1. 禁止把 manifest 写成 `.js` 模块（只接受 JSON）。
2. 禁止用 `../` 让 manifest / worker 越出插件包目录。
3. 禁止往 stdout 写非协议内容。
4. 禁止直连**宿主**数据库（含用宿主的 DB 客户端）—— capability `database.direct` 会被拒。
   **但这不是说插件永远不能有自己的存储**：插件自有数据的默认落点是宿主的通用扩展表
   （`plugin_state` / `plugin_config`，按插件与租户隔离，宿主保证作用域）。
   "插件拥有独立库"是另一件独立的事（独立库名 + 自己的表结构），需要宿主在**供给凭据与
   生命周期**上配套；在当前版本尚未提供，届时会以独立 capability 开放，而不是把宿主库连接串给你。
5. 禁止假设 cap A 能换 cap B 的权限：只声明你要用的。
6. 禁止把域的能力塞进插件来实现（该走 Platform Module）。
7. 禁止为"以后可能需要"声明白名单外的能力 —— 拒装。

## 11. 本 skill 不覆盖（诚实边界）

- **插件 UI slot host 尚未实现**：manifest 可声明 `ui.slots`，宿主会校验，但**还不会渲染**。
- §13 可选方法（`onEvent` / `runJob` / `handleWebhook` / `getData` / `performAction` / `executeTool`）及其声明面未实现。
- manifest 的 `apiRoutes` **已可挂载** ✅ —— 宿主把它们挂到
  `/api/v1/plugins/<pluginKey>/api<path>`（**非 admin 前缀**，见下方说明），处理器由插件导出。
  `auth` 三种声明**都支持**：`operator` → 管理员鉴权、`company` → 会员鉴权、`public` → 不鉴权。
  仍未支持：`isolated` 形态的路由转发（需要 worker 协议新增方法，会得到 **501** 并说明原因）。

### 怎么声明与实现路由

manifest：

```json
"capabilities": ["api.routes.register"],
"apiRoutes": [{ "routeKey": "hello", "method": "GET", "path": "/hello", "auth": "operator" }]
```

插件入口导出同名 `routeKey` 的处理器（合并形态）：

```js
export default definePlugin({
  routes: {
    async hello({ method, path, query, body, headers, pluginKey }) {
      return { status: 200, body: { ok: true } }
    },
  },
})
```

约定：**路由声明与处理器都留在插件包内**，宿主只做挂载 —— 这样插件目录才是自包含的，
不必把路由文件塞进宿主 `app/`。

**为什么挂载点不在 `/api/v1/admin` 下**：admin 前缀由 proxy 的 perimeter 统一要求管理员鉴权，
而你的 `auth` 是**运行期按 manifest 声明**的 —— 静态的"精确路径 + 方法"白名单表达不了动态声明。
放在 `/api/v1/plugins/` 下（proxy 不放压），由**挂载点按声明鉴权**。
所以：**声明什么就查什么**，既不因为"是插件"而默认放行，也不因为路径在 admin 下而一律收紧。

UI bundle 也走同一前缀：`/api/v1/plugins/<pluginKey>/ui/<path>`（这样 `public` 页面的插件也能取到自己的 bundle）。
- 插件升级审批流（§15.3）未实现。

### 第一方插件的自带迁移（已实现，但有严格边界）

如果你写的是**第一方**插件（宿主运营明确信任），可以在包内放 `migrations/` 并声明：

```json
"migrations": { "dir": "./migrations" }
```

宿主会在**启动运行时之前**执行它们，三条硬边界：

1. **只执行宿主信任的插件** —— 信任来自运营配置 `COOLIEBASE_TRUSTED_PLUGIN_KEYS`，
   **manifest 不能自封**（否则任何插件都能自带迁移）。未信任则跳过并给出原因。
2. **严格隔离在插件自己的 schema**（`plugin_<插件key>`）。所以迁移里**不要加 schema 限定**：
   未限定的表名会落在你自己的 schema 里，`public`（宿主表）对你不可见。
   带 `public.` 限定、`DROP SCHEMA`、`GRANT/REVOKE`、角色/扩展 DDL、`ALTER SYSTEM`、
   `COPY ... PROGRAM`、写 `pg_*` 系统目录 —— 这些会被宿主**静态拒绝**（注释里的字样不算）。
3. **幂等**：按文件名记录，同名文件不重复执行。宿主不假定迁移文件不可变。

第三方插件不要用这条路 —— 走 `plugin_state` / `plugin_config` 扩展表。

## 12. 域 → 插件迁移（第一方插件化）

把一个**还没插件化**的业务域改造成第一方插件。`system` / `infra` 永不适用。

**用工具，不要手敲**：

```bash
node scripts/migrate-domain-to-plugin.cjs <domain>            # dry-run，先看影响面
node scripts/migrate-domain-to-plugin.cjs <domain> --write    # 落盘（可一次传多个域）
```

它执行完整 7 步：生成 manifest+入口 → 搬家并清干净旧目录 → package.json 指针与依赖 →
登记静态入口 → catalog 与治理表改插件语义 → tsconfig+vitest 别名 → 删 Next 转发文件。
`scaffold-domain-plugin.cjs` 只生成产物、**不碰**登记与门禁，是它的下游。

### 迁移后必须做的收尾

```bash
pnpm run domain:contracts && pnpm run domain:seams && pnpm run domain:manifests && pnpm run admin:routes:manifest
pnpm run check && npx vitest run && pnpm run build
```

### 六条**踩过坑**才写下来的铁律

1. **catalog 保留该域，`kind` 改 `"plugin"`，登记进 `layers.plugin.domains`。**
   不要把它从 `domain-catalog.json` **移除** —— 移除等于丢掉域级特征，
   broker 会拒收它的 subject、拆分代理与治理门禁全对不上。
2. **`layers.plugin` 就是"可插拔的业务域"。** 凡是遍历"业务域"的地方
   （孵化裁剪、跨域分层检查、测试覆盖统计、机检扫描根…）都必须把
   `layers.business` 与 `layers.plugin` **合并**看待。只读 business 会让规则
   **空转**——一个文件都不检查，而门禁仍然是绿的。
3. **禁止写死 `packages/domains/`。** 一律用共享解析器
   （脚本侧 `domainDirOf`/`domainPathOf`，服务端 TS 侧 `domainBaseDir`）。
   写死的后果通常**不是报错，而是静默失效**：生成物落到旧路径、检查器扫不到而被跳过、
   打包漏拷。判定顺序必须**插件优先** —— 否则残留的旧目录会造成反馈回路
   （解析器误判域还在原地）。
4. **搬家后必须清干净旧目录**（含生成物重建出来的），否则第 3 条的反馈回路会真的发生。
5. **删 Next 转发文件必须用固定路径段**（`src/app/api/v1/<surface>/<domain>/`）。
   禁止用"路径里含域名"的子串模式 —— `admin/mes/work-orders/report` 这种会被误删。
6. **仓内 TS 插件必须登记静态入口**（`first-party-entries.ts`）。
   运行期 `import()` 加载不了 TS；模板串拼路径打包器也追踪不到。

### 迁移后的验证矩阵（必须**全绿**才算完成）

对一个域逐个跑，按**响应体**判定而不是只看状态码：

| 断言 | 期望 |
|---|---|
| `operator` 声明 + 无 token | **401**，且响应体是宿主守卫信封（`code: UNAUTHENTICATED`） |
| `operator` 声明 + 有 token | 不是宿主 401（业务状态码随意） |
| `company` 声明 + 无 token | 401 |
| `public` 声明 + 无 token | **不被宿主拦**（处理器自己的 401 不算：那是业务自身的凭据校验） |
| 未声明的路由 | **404**，且带精确原因 |

另外抽查 1-2 个**已插件化的域**确认无回归；并确认 `npm run domain:up -- <domain>`
的独立部署仍工作（proxy 的转发在鉴权与路由**之前**，不受删文件影响）。

### AI 侧怎么拿到这些信息（别靠记忆）

- `cooliebase_domain_resolve` —— 域名 → 真实目录 + 是否插件
- `cooliebase_plugin_list` —— 全部插件 + 声明路由数 + auth 面 + 域级特征
- `cooliebase_codegen_targets` —— 低代码对该域的**落点**（按真实目录解析）
