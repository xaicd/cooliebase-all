# 第一方业务插件架构与领域实现蓝图 (Plugin Architecture Blueprint)

- **归属规范**: CMMI 04_implementation (TS) / `.agents/skills/plugin-authoring`
- **版本基线**: v1.2.0（15 个第一方插件，见 §1 实测清单）
- **权威真源**: `packages/shared/backend/constants/domain-catalog.json`（域清单）
  与各插件 `plugin.manifest.json`。本文件是**说明**，不是真源。

---

## 1. 实测清单（15 个第一方插件）

`ai` `aigw` `bpm` `crm` `erp` `im` `iot` `mall` `member` `mes` `mp` `online` `pay` `report` `wms`

平台地基 `system` / `infra` 位于 `packages/domains/`，**永不插件化**（见 §5）。

## 2. 工程拓扑（四件套 + 契约层）

```
packages/plugins/plugin-<domain>/
├── plugin.manifest.json     # 身份、capabilities、domain 段（路由前缀/端口/auth/可打包性）
├── plugin-entry.ts          # 插件入口（merged 形态）
├── package.json             # cooliebasePlugin 指针 + @cooliebase/plugin-sdk 依赖
├── contract/                # Domain Facade 抽象契约（跨域唯一合法入口）
├── backend/                 # service / repository / validator / types
└── frontend/                # api / components / pages
```

`plugin.manifest.json` 的 `domain` 段**必须保留域级特征**：即使域已插件化，
也不要把它从 `domain-catalog.json` 移除 —— 移除等于丢域级特征，broker 会拒收其 subject、
拆分代理与治理门禁都会对不上。正确做法是保留该域、把 `kind` 改为 `"plugin"`，
并登记进 `layers.plugin.domains`。

## 3. 两种运行形态（同一份声明，差别只在"代码在哪跑"）

| 形态 | 派发方式 | 适用 |
|---|---|---|
| `merged` | 同进程直调（`merged-runtime.ts`） | 默认；开发与单体部署 |
| `isolated` | worker 进程，经 worker 协议的可选方法 `invokeRoute` 转发 | 独立拆分部署 |

**声明判定与形态无关**：同一份 manifest、同一份 routes handlers —— 在 `merged` 下成立的路由声明，
在 `isolated` 下同样成立，反之亦然。这是"本地全绿、上线 404"最容易被漏掉的一环。

## 4. 挂载与鉴权

- 挂载点：`/api/v1/plugins/<pluginId>/api/**` 与 `/ui/**`
- 该前缀**不在** admin 下，proxy 直接放行，由挂载点**按 manifest 的 `auth` 声明**执行守卫：
  - `operator` → `requireAdminAuth`
  - `company` → `requireAppAuth`
  - `public` → 不鉴权
- **禁止**"因为路径在 admin 下"就给所有插件路由强加管理员鉴权；
  也**禁止**"因为是插件"就默认放行。

## 5. 三条容易踩的硬约束

1. **仓内第一方插件是 TS，不能用运行期 `import()` 加载**：必须在
   `packages/shared/backend/plugins/first-party-entries.ts` 登记静态入口（当前 15 条）。
   第三方插件产出编译后的 JS，才走运行期 import。
2. **删 Next 转发文件必须用固定路径段**（`src/app/api/v1/<surface>/<domain>/`），
   禁止用"路径里含域名"的子串模式 —— `admin/mes/work-orders/report` 这种会被误删。
3. **拆分部署不受影响**：proxy 的 `matchRemoteDomainUpstream` 位于鉴权与路由**之前**，
   按 `publicPrefixes` 转发；因此删掉 Next 转发文件后，`npm run domain:up -- <domain>`
   的独立部署照样工作（已实测）。

## 6. 迁移一个域（工具优先，不要手抄）

```bash
node scripts/migrate-domain-to-plugin.cjs <domain> --write   # 默认 dry-run，7 步全流程
```

`scaffold-domain-plugin.cjs` 只生成产物，**不碰登记与门禁** —— 生成完仍需自行完成
catalog 登记、静态入口登记与门禁验证。

## 7. 跨域边界（本仓最容易被违反的一条）

- 业务域**只允许**调公开面：数据字典 `getDictDataByType`、登录用户信息 `getPermissionInfoByUser`。
- 其余后台 CRUD 是 BFF 同域 HTTP，**不承诺**跨域 RPC。
- 同进程打包时 Facade 走 SDK 内存调用（不序列化）；跨服务时同一 Facade 切到 RPC。
- 异步必须走 `broker.emit|broadcast`；可靠事件必须走 `broker.publishReliable()` /
  `runUnitOfWork()` + consumer inbox。
- 机器检查：`npm run domain:check`、`npm run microservice:check`、`npm run foundation:ontology:check`。
