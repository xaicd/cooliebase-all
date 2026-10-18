# cooliebase-all 本体域导航总纲（Ontology Navigation）

> **这是本模板的唯一认知入口与全息导航中枢。** 任何 Agent / IDE 进入本仓库，先读这一页定位「改哪个模块、复用哪个工具、跑哪条预览、加载哪个 skill」，再按 `.agents/context/ASSEMBLY.md` 的 `order` 精准加载所需分段——**不要每次把整篇 `AGENTS.md` 塞进 system prompt**（省 token、防臆测）。
>
> **本体域即基线**：基于本模板孵化的**每一个新线上应用，都天然继承本页描述的本体域**（域目录 + 能力三角 + 低码底座 + 可切换中间件 + skills）。新应用只在此本体域上做**增量扩展**（见 §9），严禁另起炉灶各搞一套。

---

## 0. 一句话定位

Next.js 16 (App Router) + React 19 + TypeScript + **Kysely**（运行时数据访问）+ Prisma（建模/迁移）的企业级低代码起步模板（CoolieBase / yudao 式 all-in-one）。**预览零外部依赖即用，生产切真实中间件业务代码不改。**

---

## 1. 顶层目录地图

| 路径 | 职责 |
|---|---|
| `src/app/` | Next App Router。路由组：`(admin-pages)/`(B 端后台)、`(portal-pages)/`(C 端门户)、`(cpc-pages)/`；`api/v1/...`(路由处理器，`admin/*` 写、`open/*` 公开读)；`login/`、`healthz/`、`readyz/`。 |
| `packages/domains/` | ⭐ **核心**。18 业务域 + 1 个跨切面 `shared` 模块（见 §2）。 |
| `clients/` | 多端脚手架子工程：`expo/`(RN，Schema 驱动，可 web-export 预览)、`h5/`、`uniapp/`、`desktop-pc/`、`flutter/`。 |
| `scripts/` | ~50 构建/脚手架/治理脚本。关键：`bootstrap-sqlite.ts`(零配置建库)、`scaffold-feature.ts`(域脚手架)、`pack-domain.cjs`/`domain-up.cjs`(域打包/拆分运行)。 |
| `docs/` | `architecture/`(40+ 架构文档 + 本页) · `skills/cooliebase-all/`(SKILL 镜像) · `features/` · `guides/` · `operations/` · `spec(s)/`。 |
| `.agents/` | `context/`(`IDENTITY.md`/`SOUL.md`/`ASSEMBLY.md` 分段装配顺序) + `skills/`(16 个可执行 SKILL.md)。 |
| `.kiro/` | `steering/`(`plugin-domain-structure.md` 权威模块布局、`coding-standards.md`、`feature-scaffold.md`、`ui-*`) + `specs/`。 |
| `prisma/` | `schema.prisma`(含 `member_user.extra_fields Json?`) + migrations。 |
| `sql/` `deploy/` `test/` `public/` | init SQL · docker-compose(local/dev) · 测试根(`test/{unit,integration,e2e,agent}`) · 静态资源。 |
| 根文件 | `AGENTS.md` · `README.md` · `CURRENT.md` · `project-status.md` · `.env.example` · `next.config.mjs` · `vitest.config.ts` · `playwright.config.ts`。 |

---

## 2. 本体域：域目录与能力三角（机器真源 + 本页人读索引）

**机器可读真源**（勿手改域名，改后跑 `npm run domain:seams` 重新生成）：
- `packages/shared/backend/constants/domain-catalog.json` —— 域目录真源（分层、RPC、消息、每域端口/前缀/依赖/鉴权/弹性）。
- `packages/shared/contract/seam-graph.json` —— 每域**能力三角**（契约定义 `definition` / 提供方 `provider` / 消费方 `consumer`），由 catalog 生成。

**分层（来自 domain-catalog.json）**：
- `foundation`：`shared`（打进每个进程的运行时 SDK，**永不做微服务、永不 RPC**，`facadeRequired`）。
- `platform`：`system`、`infra`（可部署，默认与 BFF 同置）。
- `business`：`online` `bpm` `pay` `report` `mp` `mall` `member` `crm` `erp` `wms` `mes` `ai` `aigw` `iot` `im`。

**18 模块人读索引**（每域布局遵循三件套 `contract/` · `backend/` · `frontend/`；成熟域再加 `repositories/`、`lib/`、`adapters/{persistence,transport}`、`ports/`、`application/`）：

| 模块 | 层 | 职责 | 备注 |
|---|---|---|---|
| **shared** | foundation | ⭐ 跨切面基础设施（见 §3） | 非业务域 |
| **online** | business | ⭐ 低码引擎（见 §4） | page-schema / schema-ddl / puck 设计器 |
| **system** | platform | RBAC 核心：用户/角色/菜单/部门/字典/配置 | 公开 RPC：`getDictDataByType`、`getPermissionInfoByUser` |
| **infra** | platform | 基础设施控制台：外观配置、代码生成、模板预设、字典 | 外观配置见 §4 |
| **member** | business | C 端会员（注册/登录、资料、Schema 动态字段） | 含 `SchemaFieldRenderer.tsx` |
| **crm / erp / mall / pay / bpm** | business | CRM / ERP / 商城 / 支付 / 流程 | |
| **im / iot / mp / mes** | business | 即时通讯 / 物联网 / 公众号 / 制造执行 | |
| **wms** | business | 仓储管理（较全，含 `types/`、`api/`） | |
| **report** | business | 报表 / BI | |
| **ai / aigw** | business | AI 能力 / AI 网关（new-api 式） | |

> 布局与命名的**权威**定义见 `.kiro/steering/plugin-domain-structure.md`（六边形分层 Ports/Adapters/Application、`page.tsx` 纯桥接）与 `packages/domains/README.md`（module-first：新业务只落 `packages/domains/<domain>/`，旧路径仅 re-export）。

---

## 3. 跨切面基础设施 —— `packages/shared/backend/lib/`

各能力经 `index.ts` barrel 暴露。四大**可切换中间件**见 §5。

> **本体建模视角**：基础设施域**不按业务域的「边界/端口/RPC」建模**，而按「**契约面 + 可切换 + 被依赖(扇入 fanIn) + 稳定等级**」建模。机器真源在 `domain-catalog.json → layers.foundation.capabilities[]`（下表是其人读投影，随代码演进由扫描更新，勿手改 fanIn/dependents）。
>
> **节点分三层**：`L0-driver`（可切换资源，必有本地兜底）· `L1-fabric`（域间通信编织，高扇入、契约版本化）· `L2-aspect`（横切全局，隐式贯穿所有调用）。
>
> **state 是本体核心信号**：`load-bearing`=已被真实消费、改动破坏性大；`provisioned`=已就绪但消费方尚未接入，是新域应主动采用的接缝。fanIn=真实 import 计数(排测试/自引)，客观反映破坏半径。

> 下表 fanIn/state 由 `npm run foundation:ontology` **扫描真实 import 自动生成**（勿手改）；改代码后刷新、`npm run foundation:ontology:check` 门禁对账漂移。

| 能力 | tier | fanIn | state | 可切换(env) | changeRisk |
|---|---|---:|---|---|---|
| `domain-log` | L2-aspect | **420** | load-bearing | 否 | 极高（扇入最广，签名变更波及全域） |
| `database` | L0-driver | 74 | load-bearing | `DB_DRIVER`（全库+国产库） | 高（方言映射改动需回归国产库） |
| `biz-tenant` | L2-aspect | 46 | load-bearing | 否 | 高（租户隔离，破坏=越权风险） |
| `trace-context` | L2-aspect | 8 | load-bearing | 否 | 中（全链路 traceId 透传） |
| `messaging-protocol` | L1-fabric | 5 | load-bearing | 否 | 高（契约级，变更须 contractVersion 递增+兼容） |
| `transactional-outbox` | L1-fabric | 4 | load-bearing | 否 | 中（可靠事件落地，依赖 database+messaging-protocol） |
| `service-broker` | L1-fabric | 2 | load-bearing | 否（local sdk↔nats-rr） | 中（拆域/远程化核心接缝） |
| `storage` | L0-driver | 1 | load-bearing | `STORAGE_DRIVER` local↔s3 | 低（仅 file.service 消费） |
| `event-bus` | L1-fabric | 1 | load-bearing | 否 | 中（被 service-broker 编织，域发领域事件必经） |
| `cache` | L0-driver | 0 | **provisioned** | `CACHE_DRIVER` memory↔redis | 低（新域需分布式缓存时采用） |
| `mq` | L0-driver | 0 | **provisioned** | `MQ_DRIVER` memory↔redis | 低（新域需跨进程消息时采用） |

> **本体洞察（扫描修正了初版手工估算）**：L1-fabric 的 `event-bus/messaging-protocol/service-broker/transactional-outbox` 实际已在 fabric 层内部相互编织（真实 import），是 **load-bearing** 而非"就绪待接入"。真正尚未被消费的仅 `cache`/`mq`（本次新建）——它们是新域需要分布式缓存/跨进程消息时应主动采用的接缝。**这正是自动扫描的价值：人工估算会漏掉别名 `@/` 与 lib 内部相对 import。**

**database/**（`index.ts` 汇出）
- `datasource-manager.ts` —— env→驱动解析：`getDataSourceConfig()`、`getProtocolFamily()`、`getCompatibilityTier()`、`isMemoryMode()`、`assertProductionDataSourceConfiguration()`、`resetDataSourceConfig()`；`DRIVER_PROTOCOL_MAP`（含国产库 达梦/金仓/高斯/OceanBase/TiDB 映射到 postgresql/mysql/proprietary）。
- `kysely-client.ts` —— `getKyselyDb()`、`hasRealDatabase()`、`destroyKyselyDb()`。
- `dynamic-table.ts` —— 方言安全动态 CRUD：`selectDynamicPage/ById`、`insertDynamicRow`、`updateDynamicRow`、`deleteDynamicRow`、`sqlTable/sqlColumn/likePredicate`。
- `base-mapper.ts` —— 泛型 `BaseMapper` / `QueryWrapper` / `BaseService`（MyBatis-Plus 式复用底座）。
- `schema.ts` —— `DB` Kysely 表接口（含 `member_user.extra_fields`）；`types.ts` —— `DatabaseDriver`/`ProtocolFamily`/`PageResult`/`BaseRepository`；`tenant-isolation-plugin.ts` —— 自动注入 `tenant_id`。

**cache/ · mq/ · storage/** —— 各含 `<x>-manager.ts`（`get<X>()`/`get<X>DriverName()`/`reset<X>()`）+ `<x>-driver.ts` 接口 + 内存(默认)与生产驱动。

**顶层跨切面服务**（`lib/*.ts`）：`event-bus.ts`(进程内事件总线) · `service-broker.ts` + `broker-*`(`broker.call` 跨域) · `messaging-protocol.ts`(统一 Command/Query/Event/Stream 契约) · `transactional-outbox.ts` + `outbox-*`(事务发件箱) · `trace-context.ts`(traceId) · `domain-log.ts`(`domainLog.event/audit`，服务层普遍使用) · RPC/fabric(`rpc-*`、`grpc-fabric`、`nats-fabric`、`nats-stream`、`platform-mq`、`platform-websocket`) · 安全防护(`crypto*`、`web-xss`、`rate-limiter`、`permission-guard`、`protection-{idempotent,lock,signature}`) · 平台运维(`config-center`、`observability`、`platform-monitor`、`runtime-readiness`)。

---

## 4. 低码能力（online + infra + Schema 渲染器）

**加字段两条互补路径**：

**(a) 零 DDL JSON 路径（默认、跨库、预览安全）** —— 字段值存实体 `extra_fields` JSON 列；页面布局是 `PageSchema` JSON 存 `system_config`（键 `page.schema.<entity>`）。
- 代码：`packages/domains/online/backend/services/page-schema.service.ts`（`PageSchemaService.get/update/addField`，`hasRealDatabase()?Kysely:内存兜底`）；校验 `.../validators/page-schema.validators.ts`（`pageSchemaSchema`/`fieldDefSchema`/`FieldDef`）。加字段 = 往 `fields[]` 追加，不 ALTER TABLE。

**(b) "加字段就真加列"（真 DDL）** —— `packages/domains/online/backend/adapters/persistence/schema-ddl.ts`：
- 流程：`PageSchemaService.update()` 校验后调 `ensureColumns(entity, fields)` → 逐字段 `ensureColumn`（先 `listColumns(table)` 幂等检查，再 `sql.raw("ALTER TABLE ... ADD COLUMN ...")`）。
- 方言：`columnType()` 按 `getProtocolFamily()` 把 `FieldDef.type`(text/number/boolean/date/select/image...) 映射到 sqlite/postgresql/mysql/sqlserver/proprietary(达梦/Oracle) 的列类型；`listColumns()` 分别用 `pragma_table_info`/`information_schema.columns`/`USER_TAB_COLUMNS`。
- 安全：`assertSafeIdentifier()` 白名单 `^[a-zA-Z][a-zA-Z0-9_]{0,39}$` 防注入。
- 预览兜底：纯内存(`hasRealDatabase()===false`)时 `ensureColumns` 抛错被 `update` 捕获、记 `online.pageSchema.ddlSkipped` 并仍持久化 JSON schema —— **预览不因缺库而挂**。

**Schema 渲染器（一份 PageSchema → 多端渲染）**：
- Portal Web：`packages/domains/member/frontend/components/SchemaFieldRenderer.tsx`（导出 `SchemaForm`/`SchemaDetailView`），被 `portal-profile.page.tsx` 消费。
- Expo(RN)：`clients/expo/src/SchemaFieldRenderer.tsx`（同 `SchemaForm`/`SchemaDetailView` 接口），拉 `open/meta/page-schema/member_user`。online 加个字段，移动端表单**零改代码**多出该字段。

**外观配置（WordPress 式后台配置→C 端渲染）**：`packages/domains/infra/backend/services/appearance.service.ts`（`AppearanceService.get/update/getPublic`，`SiteAppearance` JSON 存 `system_config` 键 `site.appearance`）；校验 `appearance.validators.ts`（`siteAppearanceSchema`/`DEFAULT_APPEARANCE`）；API `api/v1/admin/infra/appearance`(写) + `api/v1/open/meta/appearance`(公开读)。

---

## 5. 可切换中间件（4 层，均 env 切换，懒单例 + reset()）

| 层 | env 开关 | 默认(本地零配置) | 可切换(生产) | manager |
|---|---|---|---|---|
| 数据库 | `DB_DRIVER`(+ `DATABASE_URL` 自动探测) | `memory`→sqlite 族 | postgresql/mysql/mariadb/sqlserver/sqlite/tidb/oceanbase/opengauss/gaussdb/kingbase/dm/oracle | `database/datasource-manager.ts` |
| 缓存 | `CACHE_DRIVER` | `memory` | `redis`(读 `CACHE_REDIS_URL`/`REDIS_URL`) | `cache/cache-manager.ts` |
| 文件存储 | `STORAGE_DRIVER` | `local`(磁盘) | `s3`(S3/MinIO/OSS，读 `S3_BUCKET`/`S3_ENDPOINT`/...) | `storage/storage-manager.ts` |
| 消息队列 | `MQ_DRIVER` | `memory`(进程内) | `redis` Pub/Sub(读 `MQ_REDIS_URL`/`REDIS_URL`) | `mq/mq-manager.ts` |

统一哲学：默认零外部依赖本地驱动供预览/开发；生产经 env 切生产驱动，**业务代码不改**。生产守卫：`assertProductionDataSourceConfiguration()` 在 `NODE_ENV=production` 缺 `DATABASE_URL` 或仍 `memory` 时抛错。可选依赖(`ioredis`、`@aws-sdk/client-s3`)懒加载，未装不影响默认路径、切换时报清晰安装提示。

---

## 6. 零配置预览快启

```bash
# 1) SQLite 建库（零外部依赖）
DATABASE_URL=file:./data/cooliebase.db DB_DRIVER=sqlite npm run db:bootstrap:sqlite
# 建 system_user/role/dept/menu/... + C 端 member_user(含 extra_fields)，全表带 8 大审计字段
# 种子：admin/admin123、C 端 demo/demo123、核心菜单
# 2) 起前后端
DATABASE_URL=file:./data/cooliebase.db DB_DRIVER=sqlite npm run dev   # next dev -p 3200
```
- 完全不配 DB env 时，`datasource-manager` 退化 `memory` 模式、服务走内存存储，仍可跑。
- Expo web-export 预览：`clients/expo/`（Schema 驱动 RN），按其 README 导出 web 预览与 portal Web 同一份 PageSchema 驱动的表单。
- 常用脚本：`dev` · `build` · `start`(standalone) · `test`(vitest) · `test:{unit,integration}` · `test:{e2e,agent}`(playwright) · `db:{migrate,seed}` · `scaffold` · `domain:*`/`runtime:*` · `cooliebase:*:scan/check`(治理门禁)。

---

## 7. Skills 索引（`.agents/skills/`，16 个可执行 SKILL.md）

任务匹配时经 `loadSkill` 按需加载（**勿一次全塞**）：`agent-harness` · `api-design` · `architecture-design` · `automated-testing` · `coding` · `database-compatibility` · `database-design` · `devops` · `microservice-evolution` · `new-feature` · `product-requirements` · `security` · `service-governance` · `skill-authoring` · `ui-design` · `ui-framework-governance`。（`.agents/skills/` 为全仓唯一真源）

**常用映射**：加字段/新页面→`new-feature`；换库/国产库→`database-compatibility`；拆域/RPC→`microservice-evolution`+`service-governance`；测试→`automated-testing`；UI→`ui-design`+`ui-framework-governance`。

---

## 8. "按需加载"装配顺序（对齐 `.agents/context/ASSEMBLY.md`）

进入本仓库按 `order` 组装 system prompt，**禁止整篇灌 AGENTS.md**：

`identity(-100)` → `soul(0)` → `ontology-navigation(40，本页)` → `agent-profile(50)` → `seam-graph(55)` → `domain-catalog(60)` → `skill(100，按任务)` → `project-identity(150)` → `gates(200，引用 AGENTS.md 章节)`。

规则：同名 section 不重复注册；动态段(Skill)按当前任务启用；与 `AGENTS.md`/catalog 冲突时以后者为准，改 Skill/分段而非改运行时契约。

---

## 9. 新应用如何在此本体域上派生（基线继承 + 增量扩展）

基于本模板孵化的每个新线上应用**默认就是本体域的成员**，派生时：

1. **继承基线**：直接获得 `shared` SDK（4 层可切换中间件 + broker/事件总线/审计底座 + 8 大审计字段）、低码引擎(online)、RBAC(system)、外观(infra)、C 端(member)、多端脚手架(clients)。
2. **增量建域**：新业务只在 `packages/domains/<新域>/` 落地（`contract/`+`backend/`+`frontend/` 三件套），跑 `npm run scaffold` 生成骨架；在 `domain-catalog.json` 注册新域（层/端口/前缀/依赖/鉴权），跑 `npm run domain:seams` 重生成 `seam-graph.json`。
3. **复用而非重写**：数据访问走 `BaseMapper`/`getKyselyDb`+`dynamic-table`；跨域走 `broker.call`/`eventBus`（禁反向依赖、禁裸 SQL、禁绕过 facade）；字段扩展优先 `extra_fields`/PageSchema，需真列才走 `schema-ddl`。
4. **换库/换中间件零改码**：新应用部署到独立环境时，仅改 env(`DB_DRIVER`/`CACHE_DRIVER`/`STORAGE_DRIVER`/`MQ_DRIVER` + 连接串) 即切生产中间件（含国产数据库）。
5. **门禁一致**：tsc 零增量、vitest 4 层金字塔、`cooliebase:*:check` 治理门禁、真实数据库驱动零假 Mock。

> 一句话：**新应用 = 本体域基线（不动） + `packages/domains/<新域>` 增量 + `domain-catalog` 注册**。地图、能力、门禁全继承，无需给客户额外说明。

---

## 10. 本体基座自进化机制（Closed Learning Loop）

本体基座**不是静态文档，而是可自我进化的活资产**（对齐 AGENTS.md Rule 16 Closed Learning Loop / Rule 18 工具先行）。每次孵化新域、抽象新能力、解决新架构难题后，必须把经验**回写沉淀**到基座真源，让"一次进化、全生态永久受益"。

### 10.1 进化的四类真源与回写动作

| 进化类型 | 真源（写这里） | 回写动作 | 一致性门禁 |
|---|---|---|---|
| **新增/调整业务域** | `packages/shared/backend/constants/domain-catalog.json` | 注册域（层/端口/前缀/依赖/鉴权/弹性） | `npm run domain:seams` 重生成 `seam-graph.json`；`npm run *:scan/check` 校验 |
| **新增跨切面能力** | `packages/shared/backend/lib/<能力>/`（含 `index.ts` barrel） | 加驱动/管理器（按 §5 可切换范式），并在本页 §3/§5 登记一行 | tsc 零增量；`__tests__` 覆盖 |
| **沉淀高频研发经验** | `.agents/skills/<name>/SKILL.md` | 用 `skill-authoring` 结晶新 SKILL；在 §7 索引补一行 | `.agents/context/ASSEMBLY.md` 注册 order（若需自动加载） |
| **能力/架构画像变更** | `packages/shared/contract/{agent-profile,project-profile}.json` | 更新画像；本页对应节同步 | 与 `AGENTS.md`/catalog 冲突时以后者为准 |

### 10.2 进化闭环（每轮进化必走）

1. **探测**：改动前先读本页定位影响半径 + 读对应真源（catalog / seam-graph / lib barrel）。
2. **增量**：按开闭原则扩展（新域/新驱动/新 skill），**严禁改既有运行时契约迁就提示词**。
3. **回写**：把新域/新能力写进 §10.1 对应真源，并**同步更新本页对应小节**（本页与真源必须始终一致）。
4. **重生成**：catalog 变更后跑 `npm run domain:seams`；能力变更跑 tsc + vitest；skill 变更在 ASSEMBLY.md 注册。
5. **门禁**：`npm run cooliebase:*:check` 等治理门禁全绿 → 走 PR 合并。

### 10.3 铁律

- **本页 = 真源的人读投影**：本页任何一节若与 `domain-catalog.json` / `seam-graph.json` / lib barrel 不一致，以**真源为准**并立即回写本页；域名等机器字段**勿在本页手改**，改真源后重生成。
- **基线只增不破**：进化只做增量扩展；既有域契约、审计底座 8 字段、可切换 env 语义向下兼容，破坏性变更须退回规划阶段（三阶段门禁）。
- **进化即沉淀**：解决复杂问题后不结晶 SKILL / 不回写基座，视为进化未完成。

### 10.4 基础设施域（foundation）专属进化规则

基础设施域高扇入、被所有域依赖，破坏面远大于业务域，进化须**更谨慎**，按节点层级分规则：

- **新增 L0-driver 能力**：必走六件套 —— `<x>-driver.ts` 接口 → `memory/local` 默认零配置驱动 → 生产驱动(懒加载可选依赖) → `<x>-manager.ts`(`get<X>/reset<X>/get<X>DriverName`) → `ENV` 开关 → 本地兜底；`__tests__` 覆盖「默认路径 + 切换选驱动」；在 `foundation.capabilities[]` 注册（`tier=L0-driver`, `state=provisioned`, 填 `swappable` 五元组）。
- **改 L1-fabric 契约**：动的是所有域的"通信神经"。`messaging-protocol` 等契约变更**必须 `contractVersion` 递增 + 向下兼容**，改前 grep 全量 `dependents` 评估爆炸半径；跑 `npm run domain:seams` 重生成能力三角。
- **加/改 L2-aspect 切面**：隐式全局（不出现在业务签名里）。必须声明 `scope`（作用路径）与"是否默认开启"，**严禁悄改全局调用语义**（如 traceId 透传、审计、租户隔离）；`domain-log`(fanIn 420)/`biz-tenant`(fanIn 34) 这类高扇入切面变更等同破坏性变更，须退回规划阶段。
- **state 跃迁自动检测 + 回写**：`provisioned` 能力一旦被首个消费方接入，`fanIn>0` → `state` 自动跃迁 `load-bearing`。**由扫描脚本闭环，不靠手记**：
  - `npm run foundation:ontology` —— 扫描真实 import(含 `@/` 别名与 lib 内部相对 import)，把最新 `fanIn/state/dependents` 回写 catalog；
  - `npm run foundation:ontology:check` —— 只对账不写，catalog 与真实代码漂移则退出码 2（可接入 `check:gates` 门禁），并提示该跃迁的能力；
  - 回写后同步本页 §3 能力表（人读投影须等于机器真源）。新增能力节点在 `capabilities[]` 注册后，`fanIn/state/dependents` 交给脚本维护，人工只填 `contract/swappable/stability/changeRisk`。
- **只增不破**：既有 `swappable` 的 ENV 语义与默认值向下兼容；删除/重命名 barrel 导出属破坏性变更，须评估全部 `dependents`。


---

## 11. 老系统迁移（100+ 微服务 → 本体域数字镜像）

本底座的终极用途之一：承接大型老系统（Spring Cloud / Node / Dubbo + MySQL / Redis / Kafka / Hazelcast）迁移。**本体域是老系统的数字镜像 + 体检，不是重写计划书**——如实映射，默认 `keep` 不动代码，只对有经济价值处标 `optimize` 才改造。

- **方法论**：`docs/architecture/legacy-migration-playbook.md`（5 步穿透 / 中间件锚点 / gap 处置 / 分批盘点）。
- **映射契约 schema**：`packages/shared/contract/ontology-mapping.schema.json`（`legacyService → ontologyDomain/catalogDomain → entity/action/eventMap → fidelity + valueTag`）。
- **首个样板**：`packages/shared/contract/mappings/ecommerce.mapping.json`（ecommerce 本体域 ↔ cooliebase mall/pay，含实体/action 对齐、事件从状态机派生、system/infra 标注为跨域底座；已结构校验通过）。
- **关键映射结论**：mall+pay ≈ 电商本体域骨架子集（`IssueCoupon↔mall.issueCoupon` 逐字对齐）；system/infra 是**跨域公共底座**（不属电商域）；事件两边形状不同（本体域=状态机生命周期事件，业务侧=动词事件），用 `eventMap.derivedFromAction` 从 action 状态迁移派生打通。
- **中间件映射**：MySQL→database / Redis→cache / Kafka/Redis-PubSub→mq / Hazelcast→cache / 文件→storage（换环境只改 env，见 §5）。
