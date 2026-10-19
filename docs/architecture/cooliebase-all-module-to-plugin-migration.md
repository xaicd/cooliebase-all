# Module 架构 → Plugin 架构 迁移设计

> 参考实现：Paperclip（`paperclipai/paperclip`，本地 fork 见 `workspace/xaicd/coolie`）
> 设计依据：Paperclip 的 `doc/plugins/PLUGIN_SPEC.md`（1846 行）—— **该文件在 coolie fork 内，不在本仓**；
> 本仓代码不引用它的章节号，实现理由一律写在代码注释里，本文只承担血缘记录与取舍分析。
> 状态：**设计草案**。本文只做架构分析与路线，不含实现承诺。

## 0. 先修正框架：本仓的 domain 对应的是 Platform Module，不是 Plugin

Paperclip 在 `§6 Extension Classes` 明确划分了**两个**扩展类，定位完全不同：

| 维度 | §6.1 Platform Module | §6.2 Plugin |
|---|---|---|
| 信任 | trusted | **capability-gated** |
| 进程 | **in-process** | **out-of-process worker** |
| 接入方式 | **显式注册表**（`registerAgentAdapter()` / `registerStorageProvider()` / `registerSecretProvider()` / `registerRunLogStore()`），**不走插件 worker 协议** | 插件运行时 + host-worker 协议 |
| 数据 | 一方表（first-party tables） | 通用扩展表（`plugin_state` 等），**不允许任意迁移** |
| 定位 | 需要直接进程/DB 集成的宿主内部系统 | 全局安装的**加法式**扩展 |

**本仓 `packages/domains/<domain>` 对应的是 §6.1 Platform Module**（可信、进程内、有独立业务表、需要直接 DB 集成），
而不是 §6.2 Plugin。

因此「把 module 架构改成 plugin 架构」这个命题需要重构：**不是把域改造成插件，而是并列引入第二个扩展类**。
Paperclip 自己就是两者并存（core platform modules + 插件），并且 `§9` 规定加载顺序为
core platform modules → built-in first-party plugins → installed plugins。

### 那本仓已有的一半是什么

本仓的 Domain Facade / `.proto` / `actions` / `route.manifest` / `domain-catalog` / seam-graph / broker
——这些是**Platform Module 的显式注册表**，恰好对应 §6.1 的做法（`register*` 系列）。
它们**已经是正确的一侧**，不需要被"改造成插件"。

### 真正缺的是 §6.2 那一侧

一个可安装的插件运行时：manifest 安装与校验、per-plugin worker 进程、capability 强制、
通用扩展表状态、UI slot 宿主、生命周期（install/upgrade/enable/disable）。

## 1. 两种架构的本质差异（保留，用于对照）

| 维度 | 本仓现状（module） | Paperclip Plugin（§6.2） |
|---|---|---|
| 组合方式 | **静态**：域代码编译进同一个 Next 应用 | **动态**：manifest 声明 + 外部包 + 运行时加载 |
| 契约真源 | Domain Facade + `.proto` + `actions.ts` | `PaperclipPluginManifestV1` |
| 隔离级别 | 逻辑隔离（Facade / broker），**单进程** | **一插件一 worker 进程**；host↔worker 走 **stdio JSON-RPC**（§12.1） |
| 数据 | 单库单 schema，一方表 | **默认落通用扩展表**；任意第三方迁移**不在范围内**（§21.1/§21.5） |
| UI | App Router 文件路径 | **预构建 ESM bundle**，host 从 `/_plugins/:pluginId/ui/*` 动态 import，按 `exportName` 挂载（§19.0.3）；非 iframe |
| 权限 | permission code | **capability**：强制静态声明，宿主在 SDK 层拒绝越权调用（§15） |
| 状态 | 各域自有业务表 | `plugin_state` 五段复合键 scoped KV（§21.3） |
| 生命周期 | 编译期 | install → validate manifest → 拒绝不兼容 apiVersion → **向操作员展示申请的 capability** → 启动 worker + health → ready/error（§8.3） |

### 值得直接照搬的几个硬性设计

1. **capability 强制在 SDK 层**（§15）：不是"调用点各自判断"，而是宿主统一拒绝授权集之外的调用。
   且**升级若新增 capability** → 标 `upgrade_pending` → **操作员显式批准**前不得 ready（§15.3）。
   本仓当前只做到"声明 + 单一判定点"，没有升级审批。
2. **禁忌能力清单**（§15.2）：宿主**不得**暴露审批决策、预算覆盖、**鉴权绕过**、检出锁覆盖、**直接 DB 访问**。
   本仓若要引入插件，这条必须前置落地。
3. **UI slot ID 按 plugin ID 自动命名空间化**（§9）：跨插件冲突**结构上不可能**；同一 manifest 内重复 slot ID → 安装时即拒。
   这比"约定前缀"强得多。
4. **`onEvent` 至少一次投递**（§13.5）：插件必须幂等，无全局顺序保证，per-entity 顺序 best-effort。
5. **插件不直连 DB、不读原始密钥**（§14/§22）：密钥只存 `{type:"secret_ref", secretId, version?}`，
   执行时解析并写 `secret_access_events`。
6. **优雅停机阶梯**（§12.5）：`shutdown()` → 10s → SIGTERM → 5s → SIGKILL；在途 job 标 `cancelled`。
7. **失败隔离**（§12.4）：单个 worker 失败只标该插件 `error` + 有界退避重试，不影响其它插件与核心。

## 2. 本仓已有的「准插件」资产（迁移的最大有利条件）

| 已有资产 | 对应物 |
|---|---|
| Domain Facade | Platform Module 的显式注册面（§6.1 一侧，已正确） |
| route manifest + `.proto` + `actions.ts` | 可复用来生成插件 manifest 的 `apiRoutes` / `tools` 声明 |
| `domain-catalog.json` | 域注册表（Platform Module 清单） |
| seam-graph | 域间耦合图 |
| broker / serviceBus（`cooliebase.cmd.<domain>.<method>`） | 与 worker 通信的 subject 寻址——**已同构** |
| 本体域导航 + `foundation:ontology:check` | Paperclip 亦以 `packages/ontology-core` 承载本体 |

## 3. 五个硬缺口（要引入 §6.2 插件侧才需解决）

1. **动态 API 装载**：App Router 是静态文件路由 → 需统一 catch-all 网关按 manifest 分发。
   Paperclip 的形态：`/api/plugins/:pluginId/api/*`，JSON-only，**插件不得遮蔽核心路由**。
2. **UI slot 宿主**：需 bridge + 按 `exportName` 动态 import 插件预构建 ESM bundle。
3. **状态隔离**：需 `plugin_state` 式五段 scoped KV，**而不是给每个域开 DB namespace**。
4. **权限 → capability**：把 permission code 与 manifest `capabilities` 建立映射，并在 SDK 层做交集强制。
5. **worker 运行时**：进程管理 + stdio JSON-RPC + 健康检查 + 停机阶梯 + 失败隔离。

## 4. 分阶段路线（修正版）

原来的 P2b「插件化域引入 namespace 迁移」**方向错误**，已删除 —— 依据 §21.1（插件数据先落通用扩展表）
与 §21.5（不允许任意第三方迁移；`database.namespace.*` 仅对受信任编排插件开放，且 namespace 由宿主派生）。

| 阶段 | 内容 | 状态 |
|---|---|---|
| **P0** | manifest 生成器：聚合既有真源产出每域 `plugin.manifest.json` + 静态注册表索引 + 漂移门禁 | ✅ 已完成 |
| **P1** | 插件 API 网关（按 manifest 分发，复用 `invokeAction` 双模）+ capability 强制 | ✅ 网关与能力判定已完成；UI slot 宿主暂缓 |
| **P2（修正）** | **引入插件状态表**（`plugin_state` 式五段 scoped KV）+ 插件注册表持久化（`plugins` 表）+ 生命周期（install/enable/disable/upgrade_pending） | 未开始 |
| **P3** | **per-plugin worker 进程**（stdio JSON-RPC、健康检查、停机阶梯、失败隔离）；broker 从进程内切跨进程 | 未开始 |
| **P4** | **UI slot 宿主**：bridge（`getData`/`performAction`）+ `/_plugins/:pluginId/ui/*` 静态分发 + 按 `exportName` 动态 import | 未开始 |

### P0 实现说明

产物：`packages/domains/<domain>/contract/plugin.manifest.json`（16 份；`online` 为 handwritten 跳过）。
入口：`npm run domain:manifests`（与 route manifest 同一条管线）。
漂移门禁：`npm run domain:manifests:check`，置于 `check` 的 `contracts:sync` **之前**
（因为 `contracts:sync` 会重新生成，放其后永远通过）。

**设计要点：不引入第二份真源。** 每个字段都从仓库既有文件解析：

| manifest 字段 | 真源 |
|---|---|
| `kind/stage/owner/auth/messaging/invoke/pack/dependsOn/upstream` | `domain-catalog.json` |
| `displayName` | `admin-menu.ts` 顶层 `key`+`label` |
| `facadeMethods` | `<domain>*.facade.ts` 的 `*_FACADE_METHODS` |
| `rpc` | `<domain>.proto` 的 `service`/`rpc` |
| `actions` | `actions.ts` 的 `"<domain>.*"` 键 |
| `permissions` | `permissions.ts` 中 `<domain>:<res>:` 前缀 |
| `capabilities` | 由上述真实声明推导（有 facade → `facade.invoke` 等） |

**已知限制**：`aigw` / `mall` 的 `displayName` 回退为域名（不在 `admin-menu.ts` 顶层）。

### P1 实现说明

| 件 | 位置 |
|---|---|
| 静态注册表索引（生成物） | `packages/shared/backend/plugins/plugin-registry.service.ts` 与 `first-party-entries.ts`（静态入口登记） |
| 注册表与路由解析 | 挂载点 `/api/v1/plugins/<pluginId>/api/**`（见 `packages/shared/backend/plugins/route-mount.ts`） |
| 网关 | `GET /api/v1/admin/plugins`；`GET`、`POST` `/api/v1/admin/plugins/<domain>[/<method>]` |

**为什么注册表住在 `src/app`（组合根）而不是 `modules/shared`**：初版实现的分层错误，已修正。
`shared` 是 L0 基础 SDK，依赖纪律是「只允许依赖 `system`/`infra` 的平台/公开面，其余走动态 import」，
而注册表**静态 import 全部 16 个域**，把依赖方向倒了过来。更关键的是有实害：`domain:pack` 只打包
`[domain, ...dependsOnModules]`，索引若在 `shared` 内，打包后会 import 到未随包拷贝的其它域而构建失败。

**与 Paperclip 的差异（当前未对齐项）**：
- 挂在 `/api/v1/admin/` 下而非 `/api/plugins/`。理由：`proxy.ts` matcher 只覆盖 `/api/v1/**`，
  新前缀会落在默认鉴权与 `admin:routes:check` 基线之外，凭空造未受保护面。
  若将来要贴齐 Paperclip 的 `/api/plugins/*`，必须同时把该前缀纳入鉴权 matcher 与路由基线。
- 只支持 `<domain>/<method>` 两级；Paperclip 的是插件自有 `apiRoutes` 子路径（含
  `auth` / `checkoutPolicy` / `companyResolution` 声明）。子路径属 P4。

## 5. 包结构对照：插件真正的交付面

精读 Paperclip 的包组织后，发现**我此前的 P0 产物形状与插件交付契约并不一致**，这里如实记录。

### 5.1 Paperclip 的包结构

| 项 | 做法 |
|---|---|
| 包管理 | **pnpm workspace**（`pnpm-workspace.yaml`），`packageManager: pnpm@9.15.4` |
| workspace globs | `packages/*`、`packages/adapters/*`、`packages/plugins/*`、`packages/plugins/examples/*`、`server`、`ui`、`cli`、`clients/api-client`、`clients/expo` |
| **负向排除** | `"!packages/plugins/sandbox-providers/**"`、`"!packages/plugins/examples/plugin-orchestration-smoke-example"` —— 附注释说明是为了**避免 lockfile churn** |
| 插件包形态 | `packages/plugins/plugin-<name>/`，`"type": "module"`，`files: ["dist","migrations","README.md"]`，`engines.node >= 24.11.0`，`peerDependencies: { react: ">=18" }` |
| **入口契约** | `package.json` 里的 **`paperclipPlugin`** 指针：`{ manifest: "./dist/manifest.js", worker: "./dist/worker.js", ui: "./dist/ui/" }`；host 由 `plugin-loader.ts` 读该键定位入口 |
| 产物 | **预构建 ESM**：`dist/manifest.js` + `dist/worker.js` + `dist/ui/`（`esbuild.config.mjs` 或 `tsc`） |
| SDK | `@paperclipai/plugin-sdk`，**子路径 exports**：`.`、`./protocol`、`./types`、`./ui`、`./ui/hooks`、`./ui/types`、`./testing`、`./bundlers`、`./dev-server` |
| 脚手架 | `packages/plugins/create-paperclip-plugin` 生成上述 `paperclipPlugin` 块 |
| 版本/覆盖治理 | 根 workspace manifest 的 `patchedDependencies` 与 `overrides`，每条附**理由注释**（如 CodeMirror 必须单副本、Lezer NodeProp ID 必须同源） |

### 5.2 本仓的包组织

| 项 | 现状 |
|---|---|
| 包管理 | **npm 单包**（`package-lock.json`，`workspaces: null`，无 `packageManager`） |
| `clients/*` | 目录式独立包（`@cooliebase/client-h5` 等），**游离于任何 workspace**；`clients/expo` 还有自己的 lockfile |
| 域声明面 | 在 **app 源码树内**：`packages/domains/<domain>/contract/plugin.manifest.json` |
| 插件入口契约 | **无**（没有 `paperclipPlugin` 之类的指针，也没有预构建 dist） |
| SDK | 无独立包（`shared` 是源码内模块，非可发布包） |

### 5.3 由此得出的三个诚实结论

1. **我 P0 的产物不是插件交付契约，而是源内声明面。**
   Paperclip 的 manifest 是**构建产物**（`dist/manifest.js`），由 `package.json.paperclipPlugin` 指向；
   我产出的是源码树里的 JSON。对 Platform Module 而言源内声明是合理的，但**它不能被"安装"**。

2. **把它命名为 `plugin.manifest.json` 会误导** —— 依 §6.1/§6.2，本仓的域是 **Platform Module**，
   不是 Plugin。用一个只属于 §6.2 的词命名 §6.1 的声明面，正是规范刻意分开的那件事。
   建议：要么改名为 `module.manifest.json`（准确），要么在文件内显式标注「§6.1 Platform Module 声明，非可安装插件」。
   本文档保留现状不改名，但把结论记录在此，避免后来者误以为它已可用于插件安装。

3. **真要引入 §6.2 插件，先得补包基础设施。** 最小前置是二者之一：
   - **workspace 化**（npm/pnpm workspaces）+ `packages/plugins/*`，插件作为 workspace 成员；
   - 或 **实例插件目录 + 运行时安装**（Paperclip 的
     `~/.paperclip/instances/default/plugins/` 形态：包安装目录与插件数据目录分离）。

   无论哪条，都要先有 `paperclipPlugin` 式入口指针 + 预构建 dist + 独立 SDK 包，
   而这些本仓目前一个都没有。

## 6. 建议

1. **不要把域改造成插件。** 它们是 §6.1 的 Platform Module，改造会丢掉一方表、事务与直接 DB 集成，
   而 Paperclip 的插件模型恰恰**不允许**这些东西（§15.2 禁直接 DB 访问、§21.5 禁任意迁移）。
2. **要引入的是并列的第二个扩展类**，从 P2（状态表 + 生命周期）开始，再 P3（worker 进程）。
3. **P1 的 capability 强制要向 §15.3 对齐**：补"升级新增 capability 需操作员显式批准"。
4. **UI slot 宿主（P4）在出现第一个真实插件 UI 前不实现** —— 无验证对象，只会得到无人使用的脚手架。
5. 新引入的 manifest 必须纳入 `compat:check` / `foundation:ontology:check` 口径，否则重演「写进 AGENTS.md 却没人执行」。
6. **不要为了插件化牺牲已有能力**：`BaseMapper` / `QueryWrapper` / 8 大审计底座字段是 §19 明确要求复用的资产。
7. **先把命名与交付面分清**（见 §5.3）：域的声明面按 §6.1 定位，不要用只属于 §6.2 的 `plugin` 词汇；
   真要可安装的插件，先补包基础设施（workspace 或实例插件目录 + `paperclipPlugin` 式入口 + 预构建 dist + 独立 SDK 包）。
8. **借鉴 Paperclip 的 workspace 治理手法**：glob 负向排除并**写明理由**（lockfile churn），
   `patchedDependencies` / `overrides` 每条附原因——这类注释是后来者唯一的上下文来源。
