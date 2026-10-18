<!-- rename/ruoyi-to-cooliebase active -->

# ruoyi-all-next 开发工作手册

更新时间：2026-09-02

本文件是 ruoyi-all-next 的独立开发规范，覆盖架构边界、研发流程、测试门禁、运行部署与交付标准。当前仓库根目录即本项目，命令均在仓库根执行。

---

## 🚨 Top-Priority Universal Directives (最高优先级核心工程铁律 — 所有 IDE / Agent 必读必遵)

> **MANDATORY RULE 0: ZERO TOKEN WASTE, ZERO DUPLICATE CODE & TOOL-FIRST LOW-CODE ARCHITECTURE**
> 任何 AI Agent / IDE 接入本模板与工程时，**第一优先级必须执行以下 8 项不可动摇的底线法则**：
> 1. **严禁 Token 与算力浪费 (Zero Token Waste)**：严禁大模型人肉逐行生成几百行千篇一律的重复 CRUD、样板代码、冗余 DDL 或静态 HTML 骨架；业务开发与需求实现必须采用 **Schema / DSL 极简声明式驱动**（大模型输出压缩至 <500 Tokens），由底层通用引擎自动展开！
> 2. **架构模式极致复用 (Architectural Pattern Mastery)**：必须复用泛型 `BaseMapper<T>`、`QueryWrapper<T>`、`BaseService<T>` 与 `createBaseSchema`，自动继承多租户隔离、逻辑删除与 8 大基础审计底座字段，严禁手写重复 SQL/CRUD！
> 3. **存量低代码工具优先 (Prioritize Existing Low-Code Tooling)**：在编写任何代码前，必须优先检索并复用模板内已有域能力、脚手架工具（`scripts/scaffold-feature`）、CRUD 生成器与内置 Skills！
> 4. **缺少工具就造工具 (Build Tools When Missing)**：遇到可抽象的高频研发需求，必须优先沉淀为通用工具与生成脚本，让工具自动化执行，**绝不能重复手写无效无意义代码**！
> 5. **开源成熟方案优先与竞品性价比选型 (Open-Source First & Best ROI Selection)**：若自研工具周期过长、复杂度高或 Token 消耗大，**严禁盲目从零造轮子**；必须优先检索开源成熟工业级方案，进行多维竞品横评并遴选出**最高性价比（ROI）与改造成本最小**的方案进行集成！
> 6. **SpaceX 级全链路测试验证与真实数据库驱动 (SpaceX-Grade Testing & Zero Fake Mock)**：代码变更必须跑通 4 层金字塔测试矩阵（L1单测、L2集成、L3契约、L4 E2E）；100% 由真实数据库/嵌入式 SQLite 支撑，严禁前端伪造 Mock！
> 7. **本体域全息导航与 API 契约第一切入 (Ontology & API-Contract-First, 详见 §21)**：任意需求必须先在本体域（实体网、Domain Facade、route manifest、权限码）中秒级定位目标域与影响半径，以 API 契约为探针执行 5 步穿透闭环；一切需求终局 100% 收敛于真实 API 支撑，严禁无 API 支撑的假界面与硬编码 Mock！
> 8. **全工种四类契约族收敛 (All-Role Contract Families, 详见 §22)**：数据同步/ETL、BI 查询、运营编排、运维发布等非编码需求同样必须收敛为可审计契约——API 契约 / 数据契约 / 流程契约 / 预案契约四选一，并过专属质量门禁（数据族=对账+血缘完整；流程族=沙箱+回滚演练）；严禁一次性搬运脚本与口径打架的野 SQL！
> 9. **全局高阶反向思维与 AI-Driven Harness 全程监督 (High-Order Inverse Thinking & DeepSeek Harness Invariants, 详见 §23 & .agents/rules/HIGH-ORDER-INVERSE-THINKING.md)**：严禁以初级外包码农视角就事论事贴补丁；敲代码必须业务对象溯源且由通用引擎展开；写单测必须 4 态状态机真实入库覆盖与反假 Mock；修改接口必须契约先验、零破坏性变更与挂载不可变操作审计！
> 10. **0-1 软件工程交付资产与 No Artifact, No Done 铁律 (Spec-First Artifacts, 详见 §24 & .agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md)**：严禁将上线运行期业务数据（订单数据、图纸、运营指标）当成交付资产；严禁口头声明完工；每个工单必须基于 8 要素 Brief 派发，且必须产出 7 类物理工程资产之一（SRS/RTM、OpenAPI 契约、0 报错源码、真实 DB 状态机单测报告、生产回滚 SOP、SRE 稳定性基线、持续运营对账单）！
> 11. **单一真源与全生命周期过程资产防污染铁律 (Single Source of Truth & Anti-Pollution, 详见 §25 & docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md)**：技能唯一真源为 `.agents/skills/<name>/SKILL.md`，严禁在 `docs/skills` 等建立任何重复副本；业务规格按域隔离于 `docs/specs/<domain>/<name>/`（支持 feature/bugfix/enhancement/refactor 四态）并支持自动归档；过程资产收敛于 `docs/01_management` ~ `09_operations`（含 08_sre 全栈保障与 09_operations 持续运营），执行三存三不存法则，杜绝 Git 仓库被二进制撑爆与认知污染！
> 12. **OpenWiki (LLM-Wiki) 动态百科首屏导航 (OpenWiki First, 详见 wiki/index.md)**：任何外部 AI 助手进场时，优先阅读 `wiki/index.md` 与目标域百科 `wiki/domains/<domain>.md`，基于机器可读契约与架构词条开展工作，严禁全盘盲扫代码浪费 Token 与引起漂移！
> 13. **全能力 AI Agent 驱动公理 (All Capabilities Must Be AI Agent Driven)**：系统内的一切能力（需求立项、代码实现、API 契约、页面交互、接口运营、自动化测试、容器发版、故障自愈）必须具备 **100% 机器可读与 AI Agent 闭环驱动能力**；严禁设计仅供人类手点、无法被 AI Agent 编排或无头探针访问的孤岛能力；前端必须挂载机器可读 Page Schema，后端必须挂载 324 份 Agent 契约并支持 `npm run agent:ops` 无头运营，测试必须支持 Strix 多智能体自主红队渗透演练！

---

## 1. 项目定位


1. ruoyi-all-next 是基于 Next.js 的 RuoYi 能力迁移与复用基座。
2. 目标是以模块化单体方式先完成全域能力吸收，再按域支持独立拆分。
3. 当前阶段坚持“证据驱动迁移”：任何能力声明必须有扫描产物与代码落地。
4. 本仓库同时是新业务项目与 DigitalStaff NPC 员工独立开发的底层模板（Workspace Bundle）。Agent Loop 留在 DigitalStaff；本仓按 DeepSeek Harness 思想做可组合、可追溯进化，见 §18。

## 2. 适用范围与边界

1. 本规范作用于本仓库根目录（即 ruoyi-all-next）。
2. all-next 当前阶段只允许建设 RuoYi 原生域，不接收非原生扩展域。
3. 原生域清单、规模证据、迁移阶段以扫描结果为准。权威运行时清单：`packages/shared/backend/constants/domain-catalog.json`。

原生域（15）：

1. system
2. infra
3. bpm
4. pay
5. report
6. mp
7. mall
8. member
9. crm
10. erp
11. wms
12. mes
13. ai
14. iot
15. im

低代码域 `online` 已在 catalog 业务层登记，跨域必须走 Domain Facade，不得直接 import 其他域 Service。`shared` 是核心基础 SDK，不是域、不是微服务。

## 2.1 包管理器与工作区（强制）

1. 包管理器统一为 **pnpm workspaces**；锁文件真源是 `pnpm-lock.yaml`（**不再有 `package-lock.json`**）。
2. 工作区成员的真源是 `pnpm-workspace.yaml`，**不是** `package.json` 的 `workspaces` 字段（迁移时已移除，避免两处真源）。
3. 工作区内部依赖必须写 **`workspace:*`** 协议。
   注意 pnpm 10+ 起旧的 `"*"` + `link-workspace-packages=true` 组合**已失效**，会让 pnpm 去 registry 找未发布的工作区包并报 404。
4. 依赖的构建脚本（原生/工具依赖）必须登记在 `pnpm-workspace.yaml` 的 **`allowBuilds`**。
   pnpm 12 已用 `allowBuilds`（pkg→true 映射）取代 `onlyBuiltDependencies`；漏登记会让
   better-sqlite3 没有二进制、prisma 没有引擎、esbuild 没有可执行文件，构建与测试随之失败。
5. CI/镜像构建一律用 `pnpm install --frozen-lockfile`（Dockerfile 已切）。
6. 脚本仍可用 `pnpm run <script>` 或 `npm run <script>`（后者在 pnpm 布局下同样可用），
   但**安装与锁文件操作只允许用 pnpm**。

## 3. 架构总览

### 3.1 分层架构

1. Route 层：`src/app/api/v1/**/route.ts`（另有内部 RPC：`src/app/api/internal/rpc/route.ts` 与开放接口 `src/app/api/v1/open/**`）
2. Service 层：`packages/domains/<domain>/backend/services/**`
3. Validator 层：`packages/domains/<domain>/backend/validators/**`
4. Page 层（Admin 运营后台）：
   - Admin 运营后台：`src/app/(admin-pages)/admin/**` + `packages/domains/<domain>/frontend/pages/**`
5. 基座层：`packages/shared/backend/constants`、`packages/shared/backend/lib`
6. Contract 层：`packages/domains/<domain>/contract/`（Facade、actions、proto、route manifest）

### 3.2 目录约束

1. 业务域落在两处之一，**不要凭记忆猜**：
   - `packages/domains/<domain>/` —— 尚未插件化的域与**平台地基**（`system` / `infra`）；
   - `packages/plugins/plugin-<domain>/` —— **已插件化的第一方插件**（当前 15 个业务域）。
   解析域名对应的真实目录一律用共享解析器（脚本侧 `scripts/lib/domain-catalog.cjs` 的
   `domainDirOf` / `domainPathOf`；服务端 TS 侧 codegen 用 `domainBaseDir`），
   **禁止写死 `packages/domains/`** —— 写死的后果通常不是报错，而是**静默失效**
   （生成物落到旧路径、检查器扫不到而被跳过、打包漏拷）。
2. 公共基座（constants/lib/templates）统一放 `packages/shared/`。`shared` **不是域**，
   是核心基础 SDK；任何把它当域拼路径的地方都是错的。

#### 3.2.1 第一方插件（强制）

域→插件的迁移是**已落地的常态**，不是实验。要点：

1. **插件身份**：`id = ruoyi.<域名>`；目录 `packages/plugins/plugin-<域名>`；
   manifest 为 `plugin.manifest.json`，入口 `plugin-entry.ts`；`package.json` 需带
   `ruoyiPlugin` 指针与 `@ruoyi/plugin-sdk` 依赖。
2. **插件仍保留域级特征**：manifest 的 `domain` 段携带 `publicPrefixes` / `defaultPort` /
   `upstreamEnv` / `packable` / `auth` / `resilience`。**不要**把已插件化的域从
   `domain-catalog.json` 移除 —— 移除等于丢域级特征（broker 会拒收它的 subject、
   拆分代理与治理门禁也对不上）。正确做法是保留该域、把 `kind` 改为 `"plugin"`，
   并登记进 `layers.plugin.domains`。`system` / `infra` 是平台地基，**永不**插件化。
3. **`layers.plugin` 就是"可插拔的业务域"**：凡是要遍历"业务域"的地方
   （孵化裁剪、跨域分层检查、测试覆盖统计…）都必须把 `layers.business` 与
   `layers.plugin` **合并**看待。只读 `layers.business` 会让规则**空转**
   （一个文件都不检查，而门禁仍然是绿的）。
4. **两种运行形态都受支持**：`merged`（同进程直调）与 `isolated`（worker 进程，
   经 worker 协议的可选方法 `invokeRoute` 转发）。声明判定与形态无关 ——
   同一份 manifest、同一份 `routes` handlers，差别只在"代码在哪里跑"。
5. **仓内第一方插件是 TS，不能用运行期 `import()` 加载**：必须在
   `packages/shared/backend/plugins/first-party-entries.ts` 登记静态入口
   （第三方插件产出编译后的 JS，走运行期 import）。
6. **挂载点**：`/api/v1/plugins/<pluginId>/api/**` 与 `/ui/**`。该前缀**不在** admin 下，
   proxy 直接放行，由挂载点**按 manifest 的 `auth` 声明**执行守卫
   （`operator`→`requireAdminAuth`，`company`→`requireAppAuth`，`public`→不鉴权）。
   禁止"因为路径在 admin 下"就给所有插件路由强加管理员鉴权，也禁止"因为是插件"默认放行。
7. **迁移一个域**：`node scripts/migrate-domain-to-plugin.cjs <domain> --write`
   （默认 dry-run）。它执行完整 7 步并打印需要人做的收尾；`scaffold-domain-plugin.cjs`
   只生成产物、不碰登记与门禁。
8. **删 Next 转发文件**必须用**固定路径段**（`src/app/api/v1/<surface>/<domain>/`），
   禁止用"路径里含域名"的子串模式 —— `admin/mes/work-orders/report` 这种会被误删。
9. **拆分部署不受影响**：proxy 的 `matchRemoteDomainUpstream` 位于鉴权与路由**之前**，
   按 `publicPrefixes` 转发；因此删掉 Next 转发文件后，`npm run domain:up -- <domain>`
   的独立部署照样工作（已实测）。

3. `src/` 下只允许 `app/`（Next.js 路由 = BFF 层）与 `proxy.ts`。
   **业务与基座代码一律在 `packages/` 下** —— `src/modules/` 是历史单体遗留的空壳，已彻底物理删除。严禁在 `src` 下重建 `modules/`。
4. 禁止在 src 下新建 backend/、frontend/、components/、lib/ 等平铺目录。

> **一等公民路径别名与包规范（强制，彻底清除 modules 遗留心智污染）**：
> - **第一方业务插件（15 个业务域）**：`@/plugins/plugin-<domain>/*`（物理位于 `packages/plugins/plugin-*`）
> - **平台地基（2 个平台域）**：`@/domains/<domain>/*`（`system`、`infra` 位于 `packages/domains/*`）
> - **核心公共 SDK**：`@/shared/*`（位于 `packages/shared/*`）
> - **历史兼容**：`tsconfig.json` 仅保留 `@/modules/*` 作为向后兼容过渡别名，**全局文档、AI 规范与新写代码严禁继续散播 `@/modules/*` 历史旧习惯**！
5. 通用模板统一放 `packages/shared/frontend/templates`。
6. **前端双轨页面规范（强制）**：
   - `packages/domains/<domain>/frontend/pages/` 专用于 **Admin 运营管理端页面**；
7. C 端与桌面壳必须落在仓库根 `clients/<channel>/`，一渠道一包；当前只保留 `expo`（其余渠道 h5/uniapp/flutter/desktop-pc 已按决策删除）。
8. 独立客户端包内固定 `app/`、`shared/`、`modules/<domain>/`；域名与 `domain-catalog.json` 一致，禁止把新域堆进 `app`、`shared` 或根 `pages`。细则见 docs/architecture/ruoyi-all-next-client-channels.md。

### 3.3 可替换后端与微服务边界（强制）

1. 对外 HTTP API 必须保持版本化的 `/api/v{n}/` 契约；React 页面只能依赖前端 API Port 与版本化 DTO，禁止依赖 Next Service、Repository、Prisma/Kysely 类型或本地路由实现。
2. 每个可拆分域必须拥有版本化 API Contract、route manifest、application port 与 adapter 边界；Contract 是 TypeScript、Go 及其他实现共享的权威协议，数据库表结构不是浏览器 DTO 的来源。
3. 同域业务调用可使用本地 application port；跨域同步必须走 Domain Facade / `broker.call()` / `serviceBus.call()`（subject=`ruoyi.cmd.<domain>.<method>`），禁止直接 import 其他域 Service 或 Repository。`system` / `infra` **不对业务域整体开放**：业务域只允许调公开面（数据字典 `getDictDataByType`、登录用户信息 `getPermissionInfoByUser`）。其余后台 CRUD 是 BFF 同域 HTTP，不承诺跨域 RPC。`shared` 鉴权走平台面 `resolveTenantEntitlement`。同进程打包时 Facade 走 SDK 内存调用（不序列化）；跨服务独立部署时同一 Facade 切到 RPC，由 `POST /api/internal/rpc` 承载（生产需 `RUOYI_RPC_TOKEN`）。默认远程协议是自研 NATS request-reply + JSON；`RUOYI_RPC_PROTOCOL=grpc` 时走自研 gRPC unary + protobuf frame（无 `@grpc/grpc-js`）。不采用 Dubbo/Thrift 作为默认真源。`shared` 是核心基础 SDK，不是微服务。跨域异步必须走 `broker.emit|broadcast`（subject=`ruoyi.evt.<domain>.<entity>.<action>`）。同步调用必须经过 registry、timeout、retry、bulkhead、circuitBreaker；写命令重试必须带 idempotency。可靠跨域事件必须走 `broker.publishReliable()` / `runUnitOfWork()` + consumer inbox，禁止只靠内存 emit/broadcast。同库同事务 outbox 走 Kysely（无真实库时为可回滚内存事务）；跨库拆分仍属阶段 C。服务间总线使用自研 NATS 语义（inbox / queue group / stream ack），禁止引入 Moleculer、NestJS 或 nats.io 运行时。
4. Next.js Route 在阶段 A/B 是 BFF adapter，不是领域真源；迁移某域到 Go 时，只允许替换该域 upstream adapter / manifest 路由，浏览器 API 路径、DTO、权限、tenant scope 和错误契约不得变化。
5. 新 Go 服务必须验证受信任的服务身份、传递 trace、tenant 与 actor context；禁止信任调用方伪造的 tenant、user 或 permission header。服务间认证、健康/readiness、指标和契约兼容检查是上线前置条件。
6. 以域为独立扩展单元，支持独立构建、部署、水平扩缩、配置和迁移所有权；不得承诺无边界的“无限扩展”，容量目标须由 SLO、压测和资源预算确定。
7. 低代码模板、Codegen ZIP 与 Online 代码下载必须遵守同一双模：生成 Service 可被 broker 调用；跨域走 Domain Facade；同进程 SDK，拆分后 RPC。禁止生成跨域直接 import Service 的代码。Online 预览/下载必须走 `infraPlatformFacade`，不得 import `CodegenEngineService`；字典选项必须走 `systemPublicFacade.getDictDataByType`，不得 import `SystemDictService`。`shared` 鉴权必须走 `systemPlatformFacade.resolveTenantEntitlement`，不得 import `TenantEntitlementService`。

## 3.4 AI-Driven 交付链（**给一句话需求，按这个顺序走**）

> 这套机制的存在意义: 从「一句话需求」到「交付」之间，**每一步都可执行、可校验、可追溯**，
> 且凡「我说做过了」都换成**可核验的记录**（产物看文件、任务看 git、门禁看退出码、
> gate 看证据、上线看指纹、实施看实测记录）。**不要手写文档，也不要凭记忆猜顺序。**

| 步骤 | 命令 | 产物 / 证据 |
|---|---|---|
| 1. 规格立项 | `npm run speckit:new -- --name <名> --domain <域> --title "<标题>" [--type feature\|bugfix\|enhancement\|refactor\|security]` | `brief.json` + `assets/` + `prototypes/`（**按域隔离于 docs/specs/<域>/<名>，由 Spec-Kit 原生引擎 scripts/speckit.ts 统一驱动**） |
| 2. 填 brief | 编辑 `docs/specs/<域>/<名>/brief.json` | 目标/角色/故事/约束/验收/不变量/表/任务（bugfix 特化 symptom/rootCause/RedTest） |
| 3. 展开 | `npm run speckit:build -- --name <名>` | 10~15 份标准资产 + `evidence.json` + `runbook.json`（**由 Spec-Kit 引擎 scripts/speckit.ts 展开，结构不可能缺**） |
| 4. 看进度 | `npm run speckit:check -- --spec <名>` | 11 阶段 / 6 gate / 任务树 / 缺陷，逐条「还缺什么」 |
| 5. 建域 | `npm run domain:new <域>` | 建表迁移 + codegen + 注册插件（**按域，不按特性**） |
| 6. 门禁 | `npm run check` / `build` / `domain:pack <域>` | **退出码** |
| 7. 建库 | `npx prisma migrate deploy` + 种子 + `npm run plugins:register` | 表 / 菜单 / 授权 / **插件登记**（不登记则插件接口全 404） |
| 8. 业务逻辑 | 写成 Service + 测试 | 复用既有原语（条件更新、状态机、幂等、Red Test） |
| 9. 任务追溯 | `npm run speckit:tasks -- --spec <名> [--summary\|--task T1]` | **从 git 历史推导**真实完成度；核验原子提交 `[T<ID>]` 与文件白名单（1 Task = 1 Commit） |
| 10. 上线 | `npm run fingerprint` → `fingerprint:verify` | 确认上线的就是测试过的那份 |
| 11. 实施 | `npm run runbook -- --feature <名> --check/--dry-run/--run` | 割接 + **失败自动回滚** + **实测**耗时 |
| 12. 归档防污染 | `npm run speckit:archive -- --name <名>` | 移动至 `docs/specs/archive/<YYYY-Qx>/<域>/<名>/`，保持活跃区清爽 |
| 13. 运营 | `npm run agent:ops -- <域>.<实体> health/seed-sample/purge-sample` | 接口体检 + 造数/清数 |
| 14. 冒烟（**平台可用性**） | `npm run smoke:login` | 建库→迁移→种子→登记插件→起服务→**登录 200**→受保护接口 200。自管理环境，跑完清场 |
| 15. **渗透** | `npm run security:scan` | 12 项: 未认证/伪造 token/伪造 tenant/插件挂载/不泄露栈/安全响应头/错误口令/两个**阴性对照**。接进 CI + G5 |
| 16. **压测**（容量护栏） | `npm run load:test` | 打**生产产物**，出 rps/p95/失败率并对阈值。接进 CI + G5 |

要点（都是实测踩出来的）:

1. **规格包是两半**: 规划链在 `docs/specs/<域>/<名>/`（按域垂直隔离，含切图 `assets/` 与 HTML 原型 `prototypes/`，割接后归档；向下兼容 `docs/features/`，详见 `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md`），**实现在域目录**（`packages/plugins/plugin-<域>/` 等）。
   规格目录里**不该**有业务代码 —— 打包/拆分部署/边界门禁都按**域**工作。
2. **定制业务不回写基座**（§17.3）。基座只建原生域；`shop`/`points` 这类落在**衍生工程**。
3. **骨架不算完成**: 检查器认得出「还有 N 处 待填」，不会假绿。
4. **孵化出的工程必须有 git 仓库** —— 任务痕迹与指纹都建立在 git 上（孵化器已自动 `git init`）。
5. **提交必须带 `[T<ID>]`**（方括号），并在该任务的文件白名单内 —— 否则 `task:verify` 会拦，
   裸 `T1` 会误匹配到「顺口提到」的提交。
6. **G5 说 passed ⇒ 三样齐全**: 全过的 `runbook-result.json` + 全过的 `security-scan-result.json`
   + 达阈值的 `load-test-result.json`，且**都不超过 7 天**（`not_applicable` 必须给理由）。
7. **压测的阈值是回归护栏，不是跑分**: 实测 standalone ~25–30k rps，阈值只设 5,000 ——
   目的是拦"吞吐被打成十分之一"。真实容量必须在生产用真实流量压，**本地压不出来也不该假装压出来**。
8. **压测前必须清端口**: 否则会打到残留的 dev 进程，拿到低一个数量级的数字
   （实测: 报 588 rps，实际 26,877 —— **不是产品慢，是打错了进程**）。
7. **平台级冒烟必须进 CI**（`npm run smoke:login`）。教训: 门禁（check/build/fingerprint/
   task:verify）**全绿而登录链是断的** —— 因为门禁测的是**机制**，不是**产品能不能用**。
8. **`TENANT_PLATFORM_USERNAMES` 必须包含引导管理员**。基座的 `.env` 里曾是一台机器的残留
   （`vps_adm`），`admin` 不被认作平台用户 → 登录按租户找用户 → 找不到 → **401**。
   孵化器已为衍生工程处理（`clone-project-base.cjs` 写 `bootstrap.username`），基座自身也已修正。

## 4. 编码规范（强制）

### 4.1 Route 薄层

1. Route 只做参数解析、鉴权、调用 Service、统一响应。
2. 禁止在 Route 写业务编排、事务、资源分配。
3. 所有输入必须接 Validator，不允许裸参数直传 Service。

### 4.2 Service 内聚

1. 复杂业务、事务边界、状态机、审计统一放 Service。
2. Service 必须输出结构化日志；关键动作至少 event，敏感动作增加 audit。
3. 跨域调用必须声明超时、重试、幂等策略。

### 4.3 Validator 与契约

1. 所有写接口必须有 schema。
2. 统一错误语义：参数错 400、未登录 401、无权 403、冲突 409、限流 429。
3. API 成功与失败结构统一，禁止同域内响应形状漂移。

### 4.4 权限规范

1. 新增 API 必须使用 permission code。
2. 禁止新增 roles 硬编码作为长期方案。
3. 菜单与页面可见性必须与权限码一致。

### 4.5 日志规范

1. 禁止使用 console.*（测试代码除外）。
2. 关键路径必须记录 event。
3. 审核、权限变更、资金与风控相关操作必须补 audit。
4. 日志禁止输出密码、密钥、token、完整隐私数据。

### 4.6 Service 设计模式规范

1. all-next Service 必须遵循独立模式规范文档。
2. 每个域必须有稳定 Service 门面，子能力按策略/子服务拆分。
3. 涉及状态迁移必须使用状态守卫，禁止无守卫直接写状态。
4. 复杂流程建议统一执行管道：authorize -> guard -> transaction -> log。
5. 规范文档：docs/guides/service-design-patterns.md。

### 4.7 Repository & Service 导出规范与大小写防混淆（强制）

1. 所有 Repository 与 Service 文件，必须同时导出 **PascalCase（类名/对象）** 与 **camelCase（单例别名）**，杜绝消费端因大小写风格差异引发 Turbopack / Next.js 构建错误：
   ```ts
   // 规范示例：aigw-usage.repository.ts
   export const AigwUsageRepository = { ... }
   export const aigwUsageRepository = AigwUsageRepository
   ```
2. 模块级 `repositories/index.ts` 与 `services/index.ts` 集中重导出时，必须同时保留 PascalCase 和 camelCase 导出；
3. 代码生成器（Codegen Engine）模板强制默认输出 camelCase 单例别名。

### 4.8 多租户隔离规范（强制）

**租户来源唯一权威 = 全局上下文 `getCurrentTenantId()`**（`packages/shared/backend/lib/biz-tenant.ts`，由 `withAdminRoute` 对每个 admin 请求自动注入 `runWithTenantContext`）。禁止用"显式 tenantId 参数透传"作为长期姿势——透传断链即数据泄露，已在 aigw usages 域实证。

1. **Repository 取租户（强制）**：所有业务表 Repository 在查询（select/update/delete）与写入（insert）时，一律从全局上下文取租户，禁止依赖调用方显式传 `tenantId` 参数。对齐 system 域先例（`user/role/post/dept.repository.ts` 的 `currentTenantId()` helper）：
   ```ts
   import { getCurrentTenantId, isTenantRequired, isPlatformContext } from "@/shared/backend/lib/biz-tenant"

   function currentTenantId(): string | undefined {
     const tenantId = getCurrentTenantId()
     if (tenantId) return tenantId
     if (isTenantRequired() && !isPlatformContext()) throw new Error("业务数据访问缺少租户上下文")
     return undefined
   }
   // 查询：有值即过滤（真实库 where tenant_id = ?，内存 filter 同语义）
   // 写入：tenant_id 必须取上下文值，禁止硬编码默认租户
   ```
2. **无上下文场景（open/relay/内部任务）**：租户必须从**已验证的资源归属**取（如 relay 从解析出的 API Token 取 `token.tenantId`），禁止落默认值 `"1"`；平台上下文（`isPlatformContext()`）跳过过滤。
3. **内存 Repository 与真实库 Repository 必须同语义**：内存 filter 条件 `(!row.tenantId || row.tenantId === current)` 与真实库 `where tenant_id` 等价，禁止出现"内存不过滤、真实库过滤"或反之。
4. **`TENANT_MODE=required` 生产兜底**：生产环境必须设置，此时缺租户上下文的业务访问直接抛错（`requireTenantId()` / `requireTenantContext()`），把"静默全量返回"变成显性 bug。
5. **低代码生成器（Codegen Engine）与静态模板包（codegen/module-pack）**：生成/示例代码必须遵守第 1-3 条；route 模板必须接收 `(request, auth)` 并把租户传入 Service/Repository，禁止生成断链代码。
6. **禁止项**：禁止业务 Repository 出现无 `tenant_id` 过滤的 select/update/delete；禁止 insert 时 `tenant_id` 硬编码 `"1"` 或 `null`；禁止信任调用方伪造的 `x-tenant-id` Header（必须从已验证 JWT / 资源归属解析）。

## 5. Domain-First 研发流程与“开箱即用”闭环规范（强制）

每个域与新功能按完整闭环推进，**严禁仅生成只读骨架或占位页面（Forbidden Skeleton-Only Delivery）**。

### 5.1 完整六要素交付标准
1. **API 层（Full Verbs）**：必须完整实现 `GET`（分页查询）、`POST`（创建）、`PUT`（更新）、`DELETE`（删除），禁止仅写读接口遗漏写与删。
2. **Service & Repository 层**：必须具备 `page`、`get`、`create`、`update`、`delete` 全套方法，支持多租户隔离与操作审计。
3. **Validator 层**：写操作与查询必须有完整的 Zod Schema 校验。
4. **Page & Component 交互层（禁止只读无按钮页面）**：
   - 必须配备 **顶部操作栏**（`+ 新增` 按钮、刷新、多条件搜索与重置）；
   - 必须配备 **高辨识度状态 Badge**（如 ACTIVE 绿色、DISABLED 灰色）与 Key 复制工具；
   - 必须配备 **表格操作列（Actions）**：至少包含 `[编辑]`、`[启用/禁用]`、`[删除]` 及业务专有按钮（如连通性测试、联调探测）；
   - 必须配备 **新增/编辑弹窗表单（Modal Form）**，支持参数录入与表单校验，确保用户开箱即用。
5. **Permission 权限层**：完整绑定 `VIEW`、`CREATE`、`UPDATE`、`DELETE` 权限码。
6. **Log + Test 层**：至少包含关键路径与 CRUD 自动化测试。

标准推进顺序：
1. 确认域边界与数据模型（多租户 + 审计 6 大字段）。
2. 构建完整的 API、Service、Repository 与 Validator（GET/POST/PUT/DELETE）。
3. 构建完整交互的 Frontend API 与前端管理页面（含操作列与 CRUD 弹窗）。
4. 补齐权限、日志与自动化测试。
5. 门禁检查与文档记录回写。

### 5.2.1 Agent-Native 属性规范（强制）

所有 UI 组件必须带 Agent-Native 属性，供 agent-device / agent-browser 做自动化测试与运营：

1. 交互元素必带 `data-agent-target="<模块>:<动作>"`；根节点带 `data-agent-scope`；元素状态走 `data-agent-state`。
2. 页面顶层必须暴露 `data-agent-page-ready` 就绪信号。
3. 多层弹窗打开时，**底层容器必须打 `inert`** 实现节点剪枝隔离。
4. 移动端（clients/expo）testID 统一 `[Screen]__[Component]__[Action]` 命名空间。
5. **严禁**让 agent 依赖无文本 CSS 或坐标定位。
6. 每张表随代码产出 Agent 操作契约 `<插件根>/agent/<kebab>.agent.json`；汇总 `npm run agent:contracts`。
7. 机检: `npm run agent:native:check` + `npm run agent:contracts:check`（ratchet，只拦新增）。

### 5.2 前端 UI Design System 与低代码 Codegen 模板对齐规范（强制）

所有手动编写与低代码生成器 (Codegen Engine) 产出的前端页面，必须严格遵循平台统一 UI Design System 风格指南（以 `channels.page.tsx` 为视觉基准）：
1. **页面 Header 规范**：
   - 主标题: `text-xl font-bold tracking-tight text-slate-900`
   - 副标题: `text-xs text-slate-500 mt-0.5`
   - 右侧按钮顺序: 【刷新】(白色 `bg-white border-slate-300`) 在左，【+ 新增】(`bg-blue-600 hover:bg-blue-700 text-white`) 在右。
2. **搜索栏 Search Container 规范**：
   - 容器: `p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3`
   - 控件: `bg-slate-900 text-white` 查询按钮 + `bg-slate-100 text-slate-600` 重置按钮
   - 右侧统计: `共 X 个节点/开户` 数据面板。
3. **表格 Table & 操作列 规范**：
   - 表头: `bg-slate-50/80 text-[11px] uppercase text-slate-500 font-semibold tracking-wider`
   - 单元格: `px-5 py-3 text-xs text-slate-600`
   - 操作列: 固定 `text-right whitespace-nowrap min-w-[190px]`，按钮为 `[编辑]` (Blue)、`[启用/停用]` (Amber/Emerald)、`[删除]` (Rose)。
4. **Codegen Engine 低代码模板**：
   - 代码生成器模板 (`packages/domains/infra/backend/services/codegen-engine.service.ts`) 与生成脚手架必须硬化使用上述 DOM 结构与 Token，确保生成的代码开箱与原生模版 100% 视觉一致。

## 6. 能力同步与治理门禁

1. 能力状态必须对照 docs/architecture/ruoyi-all-next-capability-matrix.md。
2. 域声明必须同步 docs/architecture/ruoyi-all-next-domain-governance.md。
3. 未登记能力不得标记 DONE。
4. PARTIAL 与 DONE 域必须带 TestRefs。
5. 微服务阶段为 B/C 的域必须填写 SplitNote。

CI 前置检查：

1. npm run ruoyi:matrix:check
2. npm run ruoyi:governance:check
3. npm run domain:check
4. npm run microservice:check
5. npm run harness:check
6. npm run admin:routes:check
7. npm run foundation:ontology:check
8. npm run skills:check
9. npm run compat:check
10. npm run standards:check
11. npm run evolution:backlog（非门禁：把上述证据聚合为进化待办，永不失败）
12. 合并前建议执行 strict：
	- npm run ruoyi:matrix:check:strict
	- npm run ruoyi:governance:check:strict

一键门禁：`npm run check`（先执行 `contracts:sync` 幂等再生成契约，再依次跑上述 10 道门禁，随后生成进化待办，最后写 `docs/architecture/artifacts/harness-trace-latest.json`）。

注意：`gen/**` 被 `.gitignore` 排除，干净检出上 `domain:check` / `microservice:check` 依赖的 Go 桩须由 `contracts:sync` 先生成，故这两道门禁不可单独在干净检出上直接执行。

### 6.3 工程规范机检（`standards:check`）

`AGENTS.md` 的散文条款只有变成可执行检查才算“沉淀”。`scripts/check-engineering-standards.cjs` 用规则注册表承载，每条规则声明一种模式：

| 模式 | 语义 |
|---|---|
| `enforce` | 有违规即失败 |
| `ratchet` | 冻结既有欠债于 `docs/architecture/artifacts/engineering-standards-baseline.json`，**只拦新增**；修复后跑 `npm run standards:baseline` 并复核增量 |
| `report` | 仅供人工判断，永不失败 |

当前规则：§3.2 顶层目录约束（enforce）、§3.2/§14.3 禁止平铺 `modules/<domain>/services`（enforce）、§4.7 对象单例 Repository/Service 双导出（enforce，类与 `MEMORY_*`/`SEED_*` 常量不在范围内）、§4.5 后端禁 `console.*`（ratchet，日志实现与 codegen 模板豁免）、§4.8 业务仓储租户作用域（report）、§9.5 表定义覆盖（enforce，已知欠债在规则内显式列出）、§2/§17 基座原生域边界（enforce，已知越界在规则内显式列出）。

判定要点：规则必须贴合条款本意，误报会逼出无意义豁免。`§4.7` 只约束对象单例模式（`export const XxxRepository = {...}` 需配 `export const xxxRepository`），`export class XxxService` 这类单一标识符由消费端一致以 PascalCase 引用，不属于条款范围。新增规则前必须先在真实代码库跑 `--audit`，确认当前符合度再决定 enforce / ratchet / report。

新增规范条款时必须同时给出机检规则或说明为何只能人工判断；禁止口头规范。

### 6.4 进化回流闭环（`evolution:backlog`）

本仓库**不托管 Agent Loop**（§18）。闭环由「门禁产出证据 → 聚合为待办 → 外部 Agent 消费并修复 → 重跑门禁」构成，模型始终在仓外：

```
npm run check                 # 门禁产出证据 + 轨迹
  ├─ docs/architecture/artifacts/harness-trace-latest.json
  └─ docs/architecture/artifacts/evolution-backlog.json
        ↑ scripts/build-evolution-backlog.cjs 聚合：
          门禁轨迹状态 / standards report 项与冻结欠债 /
          各域测试覆盖（§8）/ 超 200 行文件（§11.2）/ TODO 标记（§12）
        ↓ 外部 Agent 读取（MCP 工具 ruoyi_evolution_backlog）
        修复 → 再跑 npm run check 验证
```

铁律：

1. 待办项必须可追溯到真实产物，并携带**验证该修复的确切命令**；禁止凭空生成任务。
2. 待办**永不失败构建**——它暴露欠债，不隐藏也不阻断；阻断只由门禁负责。
3. 领域知识只在 Skill、契约与门禁里沉淀；禁止把「智能进化」实现为运行时自修改。
4. 待办项被修复后，应通过新增/收紧机检规则固化，而不是靠记忆维持。

## 6.1 多模型三阶段协作规范（强制）

为杜绝多模型协同过程中的越权修改、规格漂移与虚假测试，全平台严格贯彻「规划 -> 开发 -> 独立测试」不可逾越的三阶段流水线与门禁铁律：

### 1. 规划阶段 (Planning Phase)
- **定位**：由 Pro / 高推理模型主导，严禁直接编写产品代码；
- **产物**：必须完整产出 `requirements.md`、`design.md`、`tasks.md`；
- **状态收敛**：`PLAN_APPROVED`；
- **声明权限**：只能声明“规划完成，可进入开发”，严禁越权声明已实现。

### 2. 开发阶段 (Development Phase)
- **定位**：严格按照已冻结的规格和任务 DAG 实现；
- **交付内容**：必须提供候选 Commit SHA、精确变更范围、开发自测记录和风险说明；
- **状态收敛**：`DEV_READY`；
- **声明权限**：只能声明“开发完成，等待独立测试”，严禁自行宣布测试通过或上线。

### 3. 独立测试阶段 (Independent Testing Phase)
- **定位**：针对不可变候选 SHA 进行独立客观验收；
- **判定结果**：限定为 `PASS` / `CONDITIONAL` / `FAIL` / `BLOCKED` 四种状态；
- **状态收敛**：`TEST_PASSED`；
- **自愈回归**：若修改任何产品代码，必须生成新的候选 SHA 并重新执行完整测试矩阵。

### 4. 门禁与协作铁律
1. **权威推导链**：`requirements.md` → `design.md` → `tasks.md` 为唯一权威单向推导链，规格变化必须退回规划阶段，严禁开发模型暗改需求；
2. **测试隔离**：开发自测绝对不能替代独立测试；单个 `[x]` 严禁同时代表实现、测试和上线；
3. **状态真源**：项目阶段状态以 `project-status.md` 为准，正式发布状态只看 `CURRENT.md`；
4. **发布审批门禁**：`RELEASE_APPROVED` 属于三阶段之后的人工/运维门禁，不属于测试模型自动权限；
5. **提交与推送授权**：规划、开发、测试模型默认不得擅自提交或推送，必须经过授权和阶段门禁；
6. **交接六要素**：跨模型交接必须完整记录 **SHA、变更范围、开发验证、风险说明、环境限制、下一阶段入口**。

## 6.2 Skill Registry（强制）

以下 Skill 为 all-next 的治理必备项，AGENTS 必须注册并在对应场景启用：

1. new-feature：.agents/skills/new-feature/SKILL.md
2. database-compatibility：.agents/skills/database-compatibility/SKILL.md
3. ui-framework-governance：.agents/skills/ui-framework-governance/SKILL.md
4. microservice-evolution：.agents/skills/microservice-evolution/SKILL.md
5. ui-ux-pro-max：.kiro/steering/ui-ux-pro-max/SKILL.md
6. agent-harness：.agents/skills/agent-harness/SKILL.md
7. plugin-authoring：.agents/skills/plugin-authoring/SKILL.md

启用规则：

1. 涉及新增功能、业务模块扩展或新表落地时，**必须强制启用 new-feature**，执行 RBAC 权限、全动词 API、单行 UI 规范与 CRUD 弹窗一体化交付。
2. 涉及数据库选型、兼容等级或迁移时，启用 database-compatibility。
3. 涉及页面模板、组件结构或交互规范时，启用 ui-framework-governance + ui-ux-pro-max。
4. 涉及域拆分、独立发布或阶段演进时，启用 microservice-evolution。
5. 涉及 C 端页面、视觉设计、UX 交互或前端组件开发时，必须启用 ui-ux-pro-max。
6. 涉及新业务项目孵化、DigitalStaff NPC 模板、DeepSeek Harness 学习或基座智能进化时，启用 agent-harness。
7. 涉及编写/安装/排障/评审 §6.2 可安装插件（插件包结构、manifest、capability、worker 协议、生命周期状态）时，必须启用 plugin-authoring。注意先判断该扩展应落 Platform Module 还是 Plugin —— 域**不得**改造成插件。


## 7. 扫描与迁移节奏（证据驱动）

推荐每个批次都执行以下命令链：

1. npm run ruoyi:full:scan
2. npm run ruoyi:deep:scan
3. npm run ruoyi:mini:scan
4. npm run ruoyi:migration:board

产物目录：docs/architecture/artifacts/

迁移节奏：

1. P0-Foundation：system + infra 先闭环
2. P1-CloseGaps：已有骨架域补齐日志与测试
3. P2-Bootstrap：从 0 到 1 建立域骨架
4. P3-NewDomain：TODO 域按六要素启动

## 8. 测试规范

1. 每个新域至少补 1 条关键路径自动化测试。
2. 涉及日志规范时必须有 log/audit 断言。
3. 涉及权限边界时必须有拒绝路径测试。
4. 涉及事务时必须有失败回滚测试。

建议命令：

1. npm test -- --run packages/domains/infra/backend/services/__tests__/template-engine.service.test.ts
2. npm test -- --run packages/shared/backend/lib/__tests__/rpc-protocol.test.ts
3. npm test -- --run packages/domains/infra/backend/services/__tests__/codegen-engine.rpc.test.ts
4. npm test

## 9. 本地开发与运行步骤

说明：命令统一在仓库根目录执行。

一键入口（推荐）：

1. npm run quick-start

该入口会自动执行基础设施启动、数据库初始化、治理检查与开发服务器启动。

### 9.1 首次启动

1. 首次初始化：npm run init
2. 门禁检查：npm run check
3. 启动应用：npm run dev

### 9.2 all-next 研发常用命令

1. 能力扫描：npm run ruoyi:full:scan
2. 证据扫描：npm run ruoyi:deep:scan
3. mini 基座扫描：npm run ruoyi:mini:scan
4. 迁移作战板：npm run ruoyi:migration:board
5. 治理检查：npm run check
6. strict 治理：npm run ruoyi:matrix:check:strict && npm run ruoyi:governance:check:strict
7. 域独立打包：npm run domain:list && npm run domain:pack -- pay
8. 一体运行：npm run dev（或 npm run runtime:all）
9. 域独立运行：npm run domain:dev -- pay
10. 拆分部署（BFF + pay，Facade RPC）：npm run runtime:split 或 npm run domain:up -- pay
11. 域 RPC 契约：npm run domain:contracts（生成 TS Facade / proto / gen/go 桩）
12. 微服务治理门禁：npm run microservice:check
13. 全域初始化与最新 SQL 编译（唯一官方标准入口）：`npm run build:init-sql`（对应 `scripts/build-v1-init-sql.ts`，严禁编写临时 scratch 导出脚本！）

本地命令面（package.json）：

1. npm run quick-start
2. npm run check
3. npm run build:init-sql  (编译最新官方全量 PostgreSQL V1.0.0 初始化 SQL)
4. npm run project:create -- <目标路径>  (一键孵化新工程与独立数据库)
5. npm run scaffold
5. npm run domain:list
6. npm run domain:up -- pay


### 9.3 本地验证最小闭环

1. 打开 /admin/system、/admin/infra 与当前域页面。
2. 验证列表、筛选、分页、详情、保存等核心路径。
3. 校验无权限用户访问被正确拒绝。

### 9.4 跑测试**必须用内存模式**（反直觉，但是实测结论）

**本地跑 `vitest` 不要设 `DATABASE_URL`，也不要设非 memory 的 `DB_DRIVER`。**

```bash
env -u DATABASE_URL -u DB_DRIVER npx vitest run    # 353 通过 / 0 失败
npm run verify:real-db                             # 真实库验证（改过仓储/迁移/多租户后必跑）
```

**内存模式全绿 ≠ 真实库正确** —— 内存回退不校验任何数据库约束。改过仓储、迁移、
多租户或 codegen 模板后，必须再跑 `npm run verify:real-db`
（一键: 起库 → 重建独立验证库 `ruoyi_verify` → 迁移 → 种子 → 全量测试 → 停库；
`--keep` 保留现场、`--reuse` 复用库）。它会**显式设置 `DATABASE_URL`** ——
shell 里若已有该变量，其优先级高于 `.env`，否则迁移与测试会悄悄跑到另一个库上。

原因（实测，不是理论）：仓储用 `hasRealDatabase()`（= `driver !== "memory"`）决定
"查真实库还是走内存回退"。而本仓有三份**互相矛盾**的表定义来源
（`prisma/schema.prisma` @@map / `prisma/migrations` / `scripts/bootstrap-sqlite.ts`），
其中有一批表被仓储查询、三份里却一张都没有定义（`node scripts/report-table-inventory.cjs`
会逐张列出）。**已修掉有权威定义可循的部分**（WMS 16 张已补建表迁移、
`system_config` 已按 sqlite 定义 + Kysely schema 类型移植到 postgres）；
剩下的 `aigw_*` / `system_partner` **没有定义来源**，补 DDL 等于凭空造 schema，
故仍留在报告里等真源确定。

于是出现这个**静默陷阱**：你按常规"先配好数据库再跑测试"，测试反而从全绿变成一片红
（`relation "wms_item" does not exist`），而且看起来像是自己改坏了代码。

### 9.5 表定义真源 = **低代码元数据**（已定，2026-10）

本仓的表定义真源**已确定为低代码元数据**（`CodegenConfig`，见 `scripts/data/*-tables.ts`）。

- `packages/shared/backend/constants/...` 之外的表定义**只有这一个源**；
- `prisma/migrations` 与 `scripts/bootstrap-sqlite.ts` 是它的**落地产物**，不是真源；
  `prisma/schema.prisma` 的 `@@map` 只用于 Prisma 自身客户端，同样不是真源。
- **新增/修改表：先写元数据，再生成迁移**：

  ```bash
  tsx scripts/generate-table-migration.ts --tables scripts/data/<x>-tables.ts --export <X> --name add_<x>_tables --write
  ```

  已有定义的域（`wms` / `partner`）就这样产出迁移；元数据在 `scripts/data/` 下，
  **不要**把定义写回 `scripts/scaffold-*.ts` —— 那些脚本导入即执行，会写一堆文件。

- **§14.5 的 codegen 同一份元数据**既生成全栈代码、也生成建表迁移，
  所以"定义在哪、表就在哪"重新成立。

**谁来保证它不再漂移**：`standards:check` 的 `table-definition-coverage` 规则（enforce）。
它拦的是最危险的一类：**仓储在查、却没有任何地方创建**的表 ——
内存回退下全绿，一配真实库必然 `relation "..." does not exist`，看起来却像自己改坏了代码。
新增此类缺口会直接**失败**；已存在的 7 张（`aigw_*` / `system_partner`）在规则里显式列为欠债，
补齐元数据后从列表删除。

**相关入口**：

| 命令 | 用途 |
|---|---|
| `npm run tables:inventory` | 盘点四种来源 + "仓储在查但无处创建" |
| `npm run tables:migration -- --tables … --export … --name … [--write]` | 元数据 → 建表迁移 |
| `npm run tables:metadata-draft` | 为缺元数据的表导出**待评审草稿**（`docs/architecture/artifacts/table-metadata-draft.md`） |

草稿工具的存在意义：给这 7 张表补元数据需要人判断 PG 类型（`number` 可能是 int 也可能是
decimal，`createdAt: string` 语义上是 timestamp）。草稿从仓储的 `*Row` 接口推导列，
把不确定处标 `?` —— 但它**只产出评审产物，绝不直接进 `scripts/data/`**，
否则等于凭空造 schema 并自动生成迁移。

## 10. 构建与部署步骤

### 10.1 预发/生产构建

1. npm run lint
2. npm test
3. npm run build
4. npm run start  # 运行 `.next-ruoyi/standalone/server.js`，验证生产构建

### 10.2 Docker 部署

1. 一体镜像：docker build -t ruoyi-all-next .
2. 域镜像：docker build -f Dockerfile.domain -t ruoyi-all-next-domain .
3. 生产编排：docker compose -f deploy/docker-compose.prod.yml up -d
4. 开发编排：docker compose -f deploy/docker-compose.dev.yml up -d
5. 拆分编排（BFF + 域）：npm run domain:up -- pay

详见 deploy/README.md。

### 10.3 发布门禁

1. 发布前必须通过 strict 治理检查。
2. 发布前必须生成最新扫描证据与迁移作战板。
3. 发布前必须同步文档索引：npm run docs:sync-context。

## 11. 代码规模与拆分约束

1. 单模块包含 3 个以上子能力时，Service 与 Validator 必须目录化拆分。
2. 单文件超过 200 行优先拆分为子服务并保留门面入口。
3. 新开发禁止继续向兼容门面堆业务代码。
4. 域稳定后应具备独立拆分为 app/service 的最小条件。

## 12. 常见禁止项

1. 禁止绕过 Validator 直连 Service。
2. 禁止在 Route 写事务。
3. 禁止未登记能力宣称完成。
4. 禁止只做页面不补权限与测试。
5. 禁止输出无审计证据的高风险变更。

## 13. 参考文档

1. README.md
2. packages/domains/README.md
3. docs/architecture/ruoyi-native-capabilities-catalog.md
4. docs/architecture/ruoyi-full-migration-board.md
5. docs/architecture/system-core-implementation-checklist.md
6. docs/architecture/ruoyi-all-next-capability-matrix.md
7. docs/architecture/ruoyi-all-next-domain-governance.md
8. docs/guides/api-route-conventions.md
9. docs/guides/tenant-catalog-bootstrap.md
10. docs/guides/service-design-patterns.md
11. scripts/quick-start.sh
12. scripts/scaffold-feature.ts
13. docs/architecture/ruoyi-all-next-domain-pack.md
14. docs/architecture/ruoyi-all-next-messaging-constraints.md
15. docs/architecture/ruoyi-all-next-microservice-governance.md
16. docs/architecture/ruoyi-all-next-plugin-rpc.md
17. deploy/README.md
18. docs/architecture/ruoyi-all-next-client-channels.md
19. docs/guides/project-profile-bootstrap.md
20. docs/architecture/ruoyi-all-next-harness-evolution.md

## 14. 代码生成器架构规范

### 14.1 生成器入口

- 引擎：`packages/domains/infra/backend/services/codegen-engine.service.ts`
- 前端页面：`/admin/infra/codegen`
- API：`/api/v1/admin/infra/codegen`（导入表、预览、下载 ZIP）
- 注入脚本：`scripts/inject-codegen-output.cjs`

### 14.2 生成产物目录结构

代码生成器对每张表输出以下文件，严格遵循 modules-first 分层：

```
packages/domains/{domain}/
├── contract/
│   └── {kebab}.actions.ts            ← ACTION_SCHEMAS（HTTP 与 broker 共用）
├── backend/
│   ├── types/{kebab}.types.ts        ← DO/VO/CreateInput/UpdateInput/PageQuery
│   ├── validators/{kebab}.validator.ts ← Zod Schema (create/update/pageQuery)
│   ├── repositories/{kebab}.repository.ts ← Kysely 真实库 + 内存回退
│   ├── services/{kebab}.service.ts    ← Service（调本域 Repository；托管表走 onlineFacade）
│   ├── services/{kebab}.rpc.ts        ← 双模 RPC binding（同进程 SDK / 拆分 RPC）
│   └── services/__tests__/{kebab}.service.test.ts ← Vitest 测试
├── frontend/
│   ├── api/{kebab}.api.ts            ← 前端 API 封装 (page/get/create/update/delete)
│   ├── components/{ClassName}Form.tsx ← 弹窗表单组件
│   └── pages/{kebab}-list.page.tsx   ← 列表页 (搜索+表格+分页+CRUD)
src/app/
├── api/v1/admin/{domain}/{kebab}/route.ts       ← API Route (GET/POST/PUT/DELETE)
└── (admin-pages)/admin/{domain}/{kebab}/page.tsx ← App Router 入口
```

### 14.3 路径约束（强制）

1. 后端文件必须在 `packages/plugins/plugin-{domain}/backend/`（第一方插件）或 `packages/domains/{domain}/backend/`（平台地基）下，禁止平铺。
2. 前端文件必须在 `packages/plugins/plugin-{domain}/frontend/`（第一方插件）或 `packages/domains/{domain}/frontend/`（平台地基）下，api/components/pages 三级分离。
3. 插件 API 统一由 `/api/v1/plugins/[pluginKey]/api/*` 挂载分发，页面由 `admin-pages.json` 声明注册。
4. 类型与组件 import 使用 `@/plugins/plugin-{domain}/...` 或 `@/domains/{domain}/...` 前缀，禁止相对路径跨层。

### 14.4 前端模板规范（对标 RuoYi Vue3）

| 模板 | 职责 | 对标 Vue3 |
|---|---|---|
| `api/{kebab}.api.ts` | request 封装，暴露 page/get/create/update/delete | `src/api/system/user.ts` |
| `components/{ClassName}Form.tsx` | 弹窗表单（新增/编辑复用） | `views/system/user/UserForm.vue` |
| `pages/{kebab}-list.page.tsx` | 列表页（搜索+表格+分页） | `views/system/user/index.vue` |

### 14.5 注入与加载流程

```bash
# 1. 在 /admin/infra/codegen 页面导入表 → 预览 → 下载 ZIP
# 2. 解压到 tmp/ 目录
# 3. 先在临时目录审阅清单与源码，再受控注入（默认遇到冲突即失败，不覆盖）
node scripts/inject-codegen-output.cjs tmp/codegen-{ClassName} --dry-run
node scripts/inject-codegen-output.cjs tmp/codegen-{ClassName}
# 4. Next.js hot reload 自动检测新文件 → 浏览器刷新可用
# 5. 侧边栏动态加载：GET /api/v1/admin/system/menus/sidebar
```

### 14.6 生成器禁止项

1. 禁止覆盖已有 Service/Repository/Page（inject 脚本会跳过 exists 文件）。
2. 禁止生成 `modules/{domain}/services/` 路径（必须是 `backend/services/`）。
3. 禁止前端页面直接 fetch，必须通过 `api/{kebab}.api.ts` 封装。
4. 禁止生成不带 Zod Validator 的 API Route。

### 14.7 种子数据位置

- 种子数据统一放 `prisma/data/`，通过 `@prisma/data` alias import。
- 各 Repository 通过 `import { SEED_XXX } from "@prisma/data"` 初始化 MEMORY_STORE。
- 生成脚本：`scripts/inject-seed-to-repositories.cjs`。


### 15. User Conversation & Requirement Logging (MANDATORY)

**所有用户对话输入与需求内容必须实时记录汇总：**
- 任何 AI Agent / IDE（Antigravity、Cursor、Windsurf、Claude Code、Copilot、Kiro、Trae、Codex 等）在接收到用户的每次对话输入与需求时，**必须**将用户的原始输入内容完整记录并追加汇总到 `docs/features/sprint-prod/{MMDD}.md`（例如 8月17日记录到 `docs/features/sprint-prod/0817.md`）。
- 保持需求序号递增与用户输入的完整性，确保需求历史与上下文严格可追溯。

### 16. ProjectReactor 脚手架与 GitHub Template 规范（供 DigitalStaff AI NPC 员工与全自动工程孵化）

**外部 AI / 开发者免下载 500MB+ 全量历史包的“极速骨架派生”：**
- 外部 AI 如果决定使用本底座，**根本不需要下载 500MB+ 的全量历史包**，可直接向用户建议或自动执行：
  ```bash
  # 1. 仅下载干净的代码骨架（10秒内完成，0MB Git 冗余历史）
  npx degit xaicd/ruoyi-all-next#main my-app

  # 2. 进入目录并一键重命名业务品牌、生成 SQLite 本地库
  cd my-app && pnpm install
  npm run project:init -- --name "my-app" --title "我的新业务系统"
  npm run dev
  ```
  > `project:init` 会自动完成：品牌身份重构、`.env` 配置、SQLite `data/ruoyi.db` 真实单文件库生成（预置平台管理员 `supervip` 账号与安全随机密码，彻底剔除 `admin` 运营商关键字与弱口令）、契约图谱重新编译对齐。

**本地已克隆环境下的衍生创建机制：**
- 当 `DigitalStaff` AI NPC 员工或开发者已在底座仓库内时，统一调用：
  ```bash
  npm run project:create -- <目标路径>
  npm run project:create -- <目标路径> --profile minimal
  npm run project:create -- <目标路径> --profile vertical --bundle mall,crm
  # 或使用一键孵化脚本：
  bash scripts/hatch.sh <目标路径> --profile base --title "我的业务系统"
  ```
  - `base`（推荐白板）：shared + system + infra，体积 ~50MB，秒级极速编译；
  - `standard`（默认）：整仓原生域，数字工厂全能力模板；
  - `minimal`：shared + system + infra + 平台伴生域 `online/ai/aigw`（菜单目录与 codegen Facade 依赖，不能裁）；
  - `vertical`：minimal + `--bundle` 业务域白名单；
  - `creator`：等同 standard（含 online/codegen）；
  - 产物写入 `packages/shared/contract/hatch-manifest.json`。Prisma 迁移仍为全量基座表。
- **自动化工作流水线（全托管零配置）：**
  1. **反应堆克隆与包名重塑**：自动将 `ruoyi-all-next` 转换为目标工程名，重塑 `package.json`（自动分配独立 `PORT=3200` 避开冲突）；
  2. **二进制防损坏保护**：图片、字体、压缩包与数据库 dump 文件走二进制流白名单拷贝，绝不进行文本正则替换；
  3. **数据库物理隔离与全量就绪**：自动连接 PostgreSQL 服务，创建目标独立数据库（如 `agent_zqall`），并默认部署全量 27 项基准 SQL 迁移与 RBAC 菜单权限；
  4. **目标设计文档保护**：自动识别并完好保留目标目录下已有的业务规格文档（如 `应算通-*`、`*.md`），严禁覆盖用户既有设计；
  5. **开箱即用**：产出工程可直接通过 `start.bat` / `./start.sh` 一键运行，无需人工执行初始化 SQL！后续有新表结构变更仅需执行增量 `npm run db:migrate`。

### 17. 目录职责划分与基座/业务边界规范（Core Base vs Business Domain）

为了保证业务工程（如 `agent-zqall`）与通用基座（`ruoyi-all-next`）之间既能**独立演进**，又能**通过版本化升级平滑同步底座能力与双向反哺功能**，严格执行以下目录与边界规范：

#### 17.1 目录职责分类矩阵

| 目录属性 | 包含文件与路径 | 职责定位与变更权限 | 升级与反哺规则 |
|---|---|---|---|
| 🟢 **业务开发区<br>(Business Zone)** | • `packages/domains/<domain>/`<br>• `src/app/api/v1/admin/<domain>/`<br>• `src/app/(admin-pages)/admin/<domain>/`<br>• `clients/<channel>/modules/<domain>/` | **具体业务开发区域**。<br>包含业务 DTO、Validator、Repository、Service、前端页面与弹窗组件。按域完全自包含。 | **单模块热拔插移植**：将业务域移植回基座时，按「五要素清单」整包拷贝，不影响其他业务域。 |
| 🛡️ **基座公共内核<br>(Core Base Zone)** | • `packages/shared/`<br>• `packages/domains/system/` (公开面外)<br>• `packages/domains/infra/` (公开面外)<br>• `scripts/`, `deploy/`, `prisma/data/` | **通用技术底座与公共 SDK**。<br>包含通信总线、RBAC 鉴权、签名加密、Kysely 引擎、Docker 编排。 | **基座版本化升级（Base Upgrade）**：通过基座版本升级统一更新，严禁在业务开发中向 `shared` 堆砌业务逻辑。 |
| 📋 **全局路由与契约<br>(Registry Zone)** | • `packages/shared/backend/constants/domain-catalog.json`<br>• `packages/shared/backend/constants/permissions.ts`<br>• `prisma/schema.prisma` | **全局权威契约与数据模型**。<br>记录系统全部合法域、RBAC 权限白名单与 Prisma 模型。 | **追加式维护（Append-Only）**：新业务仅可在此追加条目，严禁破坏既有数据字典与权限语义。 |

#### 17.2 业务功能反哺与移植「标准五要素清单」（The 5-Element Porting Package）

当衍生业务工程孵化出通用功能并需移植回基座时，仅需同步以下 5 项：
1. **模块目录**：`packages/domains/{domain}/`（前后端业务代码与 Contract）
2. **Next.js 路由**：`src/app/api/v1/admin/{domain}/` 与 `src/app/(admin-pages)/admin/{domain}/`
3. **数据库增量迁移**：`prisma/migrations/2026MMDD000000_{feature}/` 与 `prisma/schema.prisma` 新增模型
4. **权限码追加**：`packages/shared/backend/constants/permissions.ts`
5. **Catalog 登记**：`packages/shared/backend/constants/domain-catalog.json`

#### 17.3 基座只建原生域，**定制业务不得进基座**（强制）

基座（本仓）= RuoYi 原生能力。**定制业务属于由基座衍生出的业务工程**（例如同源的
`rome-all` 那一脉），不属于基座 —— 否则每改一次业务都要回改基座，基座就不再是
「可复用的底座」。

§2 早就写了「不接收非原生扩展域」，但一直只靠人记。现已机检：
`standards:check` 的 `base-native-domain-boundary`（enforce）。

**已实测到的越界（2026-10）与处理进度**：

| 位置 | 规模 | 性质 | 状态 |
|---|---|---|---|
| `plugins/plugin-aigw/` | 102 文件 / 60 条路由 / 20 个页面 | AI 网关渠道业务（企业入驻、配额、坐席、资费、分账、结算） | **已剥离**，只留核心 AI 网关（模型/渠道/令牌/用量/转发），路由 60→17 |
| `domains/system/` 的 `partner` 功能 | repository + service + route + 页面 + 种子 | 渠道合作伙伴 | **已剥离** |
| `shared/lib/biz-data-permission.ts` | 51 行 | 业务概念（`PartnerDataScope`）混进平台数据权限模型 | **已剥离**（剥离 partner 后已无消费方） |
| `system_tenant_package_ai_*` 三张表 | 迁移 + `schema.ts` 类型 | 租户套餐里的 AI 配额/坐席/资费 | **已剥离**：只在 `schema.ts` 声明、无任何代码查询（概念声明了但从未实现），实测空表后 DROP |
| `aigw_carrier_agent` / `aigw_isv_app` / `aigw_mcp_asset` / `aigw_member_allocation` / `aigw_tenant_quota_ledger` | 迁移（含种子）+ 已删的仓储 | 渠道/ISV/MCP 资产/席位分配 | **已剥离**（DROP；其中 3 张的 5 行种子随表删除，未改写历史迁移） |

判定依据不是"看着像业务"，而是业务词汇在**原生域**中的分布（渠道/代理/佣金/推广码/
算力/坐席/资费/入驻企业）——`plugin-aigw` 命中 16 个文件，`system` 命中 4 个，
而原生域（user/role/menu/dept/post/dict/config/notice/log）一个都不该有。

**剥离它们不是重命名，是一次产品级搬迁**：表、路由、页面、菜单、权限码要一起挪到
业务工程，并保持 API 契约不变（§17.2 的五要素清单就是为此设计的）。
在搬迁完成前，`aigw` 在规则里显式列为已知越界；**新增越界会直接失败**。

> 注意区分：`§2` 的原生域清单里的 `ai` 是原生域；`aigw`（AI 网关 + 渠道/分账）不是。
> 二者名字相近，不要因为"看起来像同一类"就放行。

#### 17.4 移植合规门禁三步法
```bash
# 1. 部署增量迁移
npm run db:migrate

# 2. 重新生成 RPC 与路由 Manifest
npm run domain:contracts
npm run domain:manifests

# 3. 执行全量合规与单元测试检查
npm run check
```

### 18. Harness 进化规范（DeepSeek Harness 思想 × DigitalStaff NPC 模板）

本仓库是 **Workspace Bundle**（业务工程模板），不是 Agent 运行时。公式：`NPC = Model + DigitalStaff Native + 本仓库`。

1. **学思想，不搬框架**：吸收插件化域、Capability Seam、Profile/Bundle/Patch、Prompt 分段组装、可追溯轨迹。禁止引入 Cordis、禁止在 `src/` 实现 Agent Loop、禁止运行时自挂载插件。
2. **机器可读入口**：`packages/shared/contract/agent-profile.json`。域名真源仍是 `domain-catalog.json`。
3. **提示分段**：`.agents/context/ASSEMBLY.md`。禁止把本文件整篇灌进每一次模型请求。
4. **NPC 孵化**：只允许 `npm run project:create -- <目标路径>`；身份只改 `project-profile.json` 与 `public/branding/`。
5. **后期进化**：P1 `--profile/--bundle`、P2 seam 图、P3 门禁轨迹已落地；P4 由 DigitalStaff 读取本仓 `agent-profile.json`。细则见 `docs/architecture/ruoyi-all-next-harness-evolution.md`。

### 19. 严禁 Token 浪费、零重复代码与“工具先行”低代码架构铁律 (MANDATORY Zero Waste & Tool-First Architecture)

**本模板工程坚决贯彻极简工程哲学，严禁任何形式的 Token 浪费、重复造轮子与生成无意义冗余样板代码：**
- **严禁 Token 与算力浪费 (Zero Token Waste)**：
  - 严禁大模型人肉逐行生成几百行千篇一律的重复 CRUD、样板代码、冗余 DDL 或静态 HTML 骨架；
  - 业务开发与需求实现必须采用 **Schema / DSL 极简声明式驱动**（将大模型输出压缩至 <500 Tokens），由底层通用引擎与脚手架工具自动展开；
- **架构模式极致复用 (Architectural Pattern Mastery)**：
  - **持久层**：必须复用泛型 `BaseMapper<T>`、`QueryWrapper<T>` 与 `BaseService<T>`，自动获得多租户隔离、逻辑删除与 8 大基础审计底座字段，严禁手写重复 SQL/CRUD；
  - **测试层**：必须复用 `TestingKit` 与 4 层金字塔自动化脚手架，严禁复制粘贴重复的 Mock 环境初始化逻辑；
  - **微服务与跨域**：跨域调用统一走 `Domain Facade` 与自研服务总线，严禁破坏模块隔离；
- **存量低代码工具优先 (Prioritize Existing Low-Code Tooling)**：
  - 在编写任何新业务代码前，必须先检索并优先使用模板内已有域能力、脚手架工具（`scripts/scaffold-feature`）、CRUD 生成器与内置 Skills；
- **缺少工具就造工具 (Build Tools When Missing)**：
  - 遇到可抽象的高频业务或研发需求，必须优先沉淀为通用工具与生成脚本，让工具自动化执行，**绝不能重复手写无效、低效、无意义代码**；
  - 沉淀的高价值工具必须结晶沉淀为标准资产，实现“一次造工具，后续业务开发永久受益”；
- **开源成熟方案优先与竞品性价比选型 (Open-Source First & Best ROI Selection)**：
  - **严禁盲目从零造轮子**：若自研工具周期过长、复杂度过高或 Token 消耗过大，必须**优先检索开源成熟方案与工业级类库/工具**；
  - **多维竞品横评**：主动从成熟度、轻量性、维护活跃度、Token 消耗比与 License 兼容性进行客观竞品分析；
  - **遴选最高性价比解法**：选择综合 ROI（性价比）最高、改造成本最小的最佳开源方案进行集成适配，实现极致工程效能。

### 20. 需求场景三叉戟分流与存量功能改造铁律 (Requirement Classification & Brownfield Evolution)

**严禁机械教条地“凡开发必先建表”，所有业务需求开发前必须先执行「场景分流决策」：**
- **场景 A：全新业务域/全新核心实体 (Greenfield)**：
  - 流程：Schema / DSL 极简定义 -> 实体模型与 8 大审计底座字段注入 -> 自动化 DDL / BaseMapper 展开 -> RESTful 契约与 BFF Route -> 前端页面；
- **场景 B：存量系统/旧功能/旧接口 业务逻辑改造 (Brownfield Evolution)**：
  - **严禁擅自改表/破坏既有 DDL**：保持数据表结构稳定，杜绝数据库锁表与历史数据迁移风险；
  - **开闭原则与无侵入扩展 (OCP)**：通过**策略模式 (Strategy Pattern)、Hook 拦截器、Domain Facade、事件总线 (broker.emit) 或装饰器**进行增量业务扩充，严禁在旧 Service 中塞入大段硬编码 `if-else`；
  - **契约严格向下兼容 (Backward Compatibility)**：旧接口入参、错误码与返回 DTO 必须 100% 向下兼容，严禁破坏既有前端或外部三方系统的契约；
- **场景 C：轻量业务属性增量扩展 (Lightweight Extension)**：
  - **零 DDL 优先**：新增轻量、动态或临时业务属性时，优先复用实体既有的 `metadata` / `extraParams` / JSON 扩展字段，彻底免去 DDL 变更与多端同步负担；
- **逆向调用链防守与全量回归**：
  - 修改存量函数或接口前，**必须先执行全文 Grep 扫描全部调用方与依赖方**，评估影响面并跑通存量单元/集成回归测试，确保既有业务功能 100% 零破损！

### 21. 业务域与全协议 API 契约驱动“多维最优解”执行大典 (Ontology & Polyglot API-Contract-First Execution)

**本工程所有研发与功能变更以「业务域与全协议 API 契约网」为唯一真源，任意需求必须以全协议 API 为探针精准导航并执行五维最优解：**
- **1. 全协议通信矩阵认知与统一契约映射 (Polyglot Protocol Matrix & Adapter Pattern)**：
  - **API 是跨边界通信的统一行为契约**，本工程无缝适配 5 大通信协议簇：
    ① **Web 互联网应用层**：`HTTP/1.1`, `HTTP/2`, `HTTP/3 (QUIC)`, `RESTful`, `WebSocket`, `SSE`；
    ② **高性能微服务 RPC 层**：`gRPC (HTTP/2 + Protobuf)`, `Apache Dubbo`, `Thrift`, `JSON-RPC`；
    ③ **异步消息与事件总线层 (MQ)**：`MQTT (EMQX)`, `NATS (Request-Reply / JetStream)`, `Kafka`, `RabbitMQ`；
    ④ **数据存储与网络套接字层 (DB Wire & Socket)**：`MySQL Socket/Protocol`, `PostgreSQL Wire`, `Redis RESP`, `Raw TCP/UDP`；
    ⑤ **边缘物联与硬件总线层 (IoT & Hardware)**：`Bluetooth Low Energy (BLE 蓝牙)`, `Modbus RTU/TCP`, `RS485/COM 串口`, `CAN Bus`；
  - **协议适配器标准化**：底层多模协议统一在领域契约（Contract）中抽象为强类型 `Command`、`Query`、`Event` 与 `Stream`；
- **2. API 契约第一切入点与 5 步全息穿透闭环 (API-Contract-First 5-Step Traceability)**：
  - 无论底层采用何种协议，需求进入时统一执行 5 步穿透：
    ① **【协议与端点定位】**：确定协议类型（HTTP/gRPC/MQTT/BLE/Socket），秒级锁定目标契约；
    ② **【契约剖析 (Contract Diff)】**：提取 Request/Response DTO、Protobuf Schema、校验规则与权限码；
    ③ **【向下垂直穿透 (Trace Down)】**：从 Protocol Adapter -> Service 业务逻辑 -> Domain Facade / RPC -> BaseMapper / DAL 存储底座；
    ④ **【向上逆向影响面 (Blast Radius)】**：检索所有前端/移动端/硬件端调用点与跨服务调用方，评估破坏性风险；
    ⑤ **【契约化测试回归】**：以协议契约为基准，自动生成/执行集成与 E2E 验证，确保零破坏。
- **3. 五维帕累托最优决策执行法则 (5-Dimension Pareto Optimal Decision)**：
  - 💰 **最省 Token 算力 (Minimum Cost)**：极简 Schema/DSL 驱动，杜绝长篇样板生成；优先使用 `scaffold-feature` 与存量领域 Facade；
  - 🛡️ **风险最低与零破坏 (Minimum Risk & Zero Breakage)**：开闭原则扩展，旧接口契约 100% 向下兼容；轻量字段复用 `metadata` 零迁移；
  - 🏛️ **最符合系统架构 (Architectural Purity)**：跨域调用强制走 Domain Facade / RPC，持久层复用 BaseMapper / QueryWrapper 自动获得 8 大审计底座字段；
  - 🔒 **安全最高防护 (Opt-in Security & Least Privilege)**：API 强制绑定 permission code，参数必接 Validator，防越权与注入；
  - 🧪 **交付质量最高 (SpaceX-Grade Testing & Zero Fake Mock)**：4 层测试金字塔矩阵，嵌入式 SQLite 真实实例校验，严禁前端伪造 Mock。

### 22. 全工种四类契约族大典 (All-Role Contract Families & Job-Function Matrix)

**一切工作终局收敛为四类可验证、可审计契约之一；非编码需求（数据同步、BI 查询、运营编排、运维发布）同样受本体域导航与五维决策约束：**

1. **四类契约族统一理论**：
   ① **API 契约**：`Command`/`Query`/`Event`/`Stream`（开发工种，详见 §21）；
   ② **数据契约 (Data Contract)**：Source/Transform/Sink Schema + 增量水位 + 幂等主键 + 质量规则 + 血缘 + 业务平账对账单（数据同步/ETL/数仓/BI/持续运营工种，落位 `report` 域与 `docs/09_operations/02_data_ops/`）；
   ③ **流程契约 (Process Contract)**：状态机/BPMN/DAG + 事件/定时/API/人工四类触发器 + 补偿回滚路径 + 租户审批流治理（运营编排/审批流/工单工种，落位 `bpm` 域与 `docs/09_operations/01_biz_ops/`）；
   ④ **预案契约 (Runbook Contract)**：变更步骤 + 校验点 + 回滚脚本 + 演练记录 + SRE 全栈保障（涵盖 IaaS/PaaS/应用三层指标、APM 链路穿透、业务日志脱敏、分布式定时任务排他锁治理与无指责复盘，落位 `docs/08_sre/` 与 `.agents/skills/devops/SKILL.md`）。
2. **IT 全工种工作内容矩阵**：产品（需求契约，`product-requirements.SKILL.md`）、设计（设计契约，`ui-design.SKILL.md`/组件复用）、开发（API 契约/5 步穿透）、数据（数据契约/管道 DSL + 指标语义层，`database-design.SKILL.md`）、测试（测试契约/4 层金字塔，`automated-testing.SKILL.md`）、运维（预案契约/Runbook + 灰度回滚，`devops.SKILL.md`）、运营编排（流程契约/状态机 + HITL 人工节点）、安全（安全基线/威胁建模，`security.SKILL.md`）；每族明确契约真源、执行范式与低代码/开源工具优先清单。
3. **数据同步/ETL 五大铁律**：① 严禁一次性搬运脚本入库；② 必须幂等可重放（按主键/版本 upsert）；③ 必须断点续传（checkpoint/增量水位）；④ 血缘自动登记本体域；⑤ 对账报告即验收（行数/空值/唯一性对账通过才算交付）。工具决策顺序：内置管道 DSL ➔ 开源成熟方案（SeaTunnel/DataX 批量、Flink CDC 实时）➔ 才允许自写代码。
4. **BI 查询与指标语义层范式**：指标口径定义一次（口径/维度/过滤）、处处复用，严禁各报表各写 SQL 口径打架；即席查询三防线（行级权限 ➔ 超时/限行/只读副本资源隔离 ➔ 全量审计）；AI NL-to-SQL 只允许生成绑定语义层白名单指标的查询，严禁裸拼 SQL。
5. **运营编排铁律**：编排 = 状态机 DSL + 四类触发器，人工节点复用 HITL 审批；每节点强制携带 traceId 可观测可回放；长流程必须定义补偿/回滚路径；定时任务必须分布式幂等锁防重入。工具决策顺序：`bpm` 域内置编排 ➔ n8n/Node-RED（轻量）➔ Temporal/Camunda（企业级）。
6. **五维决策普适化与专属质量门禁**：五维帕累托从编码需求普适至全工种；每族契约配专属门禁——数据族 = 对账通过 + 血缘完整 + 质量规则 100% 执行；流程族 = 沙箱演练 + 回滚演练双通过；预案族 = 预演环境演练 + 回滚计时达标；API 族 = 4 层测试全绿。本体域一等公民同步扩展登记**数据资产**（表/管道/指标/报表）、**流程拓扑**与**预案库**。

### 23. 全局高阶反向思维与 AI-Driven 基座 Harness 进化规范 (High-Order Inverse Thinking & DeepSeek Harness Invariants)

作为面向生产级的重型业务开发模板，本工程深度吸收 Palantir 体系与 DeepSeek Harness (dsh) 核心架构精髓，对代码、单测、接口执行全生命周期自动化守卫监督：

1. **四大合一反向穿透协议**：
   - **业务本体溯源**：任何代码变更必须对应明确的业务对象（Object）与状态机流转动词（ActionType），消灭死报表与死接口；
   - **极简减法原则**：能删代码修绝不贴补丁，强制复用 `BaseMapper` / `BaseService` 与低代码引擎展开，严禁大模型生成样板代码；
   - **真实场景复原**：兼顾 PC 运营端与移动端真实环境，严禁由于代码变更引发物理遮挡、断层或盲点击；
   - **不可变证据闭环**：所有修改必须提供编译 0 报错、测试全覆盖与不可变审计流水证据。

2. **三大全程监督铁律 (敲代码 / 写单测 / 改接口)**：
   - **敲代码时**：单函数圈复杂度 < 10、函数行数 < 50 行；跨域必走 Domain Facade；严禁空 catch 吞异常；
   - **写单测时**：严禁 `expect(true).toBe(true)` 或只断言 `toBeDefined` 等空壳测试；必须基于真实 SQLite/Postgres 测试数据库进行 4 态状态机正反向断言；
   - **改接口时**：接口必接 Zod/DTO 强类型校验；零破坏性向下兼容；所有写操作必接不可变操作审计（Audit Log）。

3. **静态守卫与持续门禁**：
   - 守卫规则物理落盘于 `.agents/rules/HIGH-ORDER-INVERSE-THINKING.md` 并通过 `.agents/context/ASSEMBLY.md` 首帧注入；
   - 执行 `node scripts/guard-high-order-invariants.cjs` 实施工程守卫扫描，保障重型业务模板的纯洁性与确定性演进。

### 24. 0-1 软件工程交付资产与 8 要素 Brief 派单规范 (Spec-First Artifacts & Brief Dispatching)

吸收 Coolie 商业级软件工厂核心实践，杜绝大模型“口头完成”与“将运行时业务数据当成工程产物”：

1. **两大阵营绝对物理隔离**：
   - **0-1 软件工程交付资产 (Build-Time Assets)**：SRS 规格书、OpenAPI 契约、0 报错源码、真实 DB 状态机测试报告、部署回滚 SOP、SRE 全栈可观测台账、持续运营对账平账单；
   - **上线运行业务数据 (Runtime Business Outputs)**：订单、支付流水、用户数据。严禁以“数据库加了模拟数据”代替工程产物！
2. **8 要素 Brief 派单标准 (Task Dispatching)**：
   - 任何任务必须包含：1.任务目标 2.为什么要做 3.文件范围白名单 4.绝对不动项黑名单 5.责任工种工具池 6.验收门禁 7.单写者锁 8.物理工程资产 7 选 1。
3. **No Artifact, No Done 结项铁律**：
   - 任何状态转为完成，必须挂载不可变工程产物（Git SHA、契约文件、测试结果、SRE 巡检台账、对账平账单）。
   - 规范落地于 `.agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md` 与 `docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md`。

### 25. 单一真源与全生命周期过程资产防污染规范 (Single Source of Truth & Process Asset Anti-Pollution)

1. **技能单一真源法则**：
   - 全仓技能有且仅有唯一真源：`.agents/skills/<name>/SKILL.md`（共 26 个技能），严禁在 `docs/skills/` 等建立任何镜像或重复目录；
   - 技能注册表统一维护于 `.agents/skills/README.md`，上游开源许可溯源落位 `.agents/skills/UPSTREAM-NOTICE.md`；
   - 门禁脚本 `sync-skills.cjs` 与 `check-specs-health.cjs` 实时强制拦截重复目录。
2. **统一规格 (Spec) 与生命周期管理**：
   - 彻底摒弃以单纯 "Feature" 命名一切的局限思维，全面采用 **4 类规格演进类型**：`feature`（新特性）、`bugfix`（缺陷修复，必须携带 Symptom、Root Cause 与红灯复现用例 Red Test）、`enhancement`（增量增强）、`refactor`（架构重构）；
   - 施工区按域严格隔离于 `docs/specs/<domain>/<name>/`，原型资产按静态切图 `assets/` 与动态可点击 `prototypes/` 分离；
   - 投产后通过 `npm run speckit:archive -- --name <name>` 统一沉淀归档至 `docs/specs/archive/<YYYY-Qx>/<domain>/<name>/`，保持施工区清爽。
3. **CMMI 01~09 过程资产全生命周期库与技能标准化作业 (SOP)**：
   - 全生命周期 9 大阶段均有确定性专属 Skill 驱动专业作业（`.agents/skills/cmmi-asset-authoring/SKILL.md`）：
     - `01_management`: `dar-decision-matrix`（立项、研发计划、风险台账、DAR 加权决策分析）
     - `02_requirements`: `ears-spec-writer`（EARS 5 态需求规格、RTM 跟踪矩阵、NFR 非功能指标）
     - `03_design`: `adr-architect`, `archify`, `database-design`（MADR 决策、8 大审计列、交互拓扑）
     - `04_implementation`: `coding`, `plugin-authoring`（插件架构实现蓝图、代码审查清单、SBOM 物料）
     - `05_verification`: `automated-testing`, `mutation-tester`（真实库测试大盘、变异测试打假、同行评审）
     - `06_quality_assurance`: `compliance-auditor`（FCA/PCA 双基石审计、20 道质量门禁数字凭证）
     - `07_release`: `devops`（6 步零停机割接 SOP、秒级自动回滚 Runbook、版本发布说明）
     - `08_sre`: `sre-slo-manager`, `postmortem-analyzer`（SLO/SLI 矩阵、5-Whys 免责复盘、Strix 渗透演练）
     - `09_operations`: `financial-reconciliation-agent`（日常资金轧差平账、AI 数字员工台账、健康巡检）
   - **CLI 标准作业**: 统一通过 `npm run cmmi:asset new -- --phase <01~09> --type <type>` 展开，`npm run cmmi:asset list` 盘点，`npm run cmmi:asset:check` 合规巡检；
   - **MCP 机器可读**: 提供 `ruoyi_cmmi_list` 工具，外部智能体（Claude Code/Cursor/DSH）可秒级查询 9 大阶段规范与资产状态；
   - **三存三不存与反造假**: 文本、Schema 契约与测试脚本入 Git；事故复盘、资金对账与渗透演练必须带 `--real` 真实凭证，未发生时保留 `.gitkeep` 严格留空，坚守零假 Demo 铁律！

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
