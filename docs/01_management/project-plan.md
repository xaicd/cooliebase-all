# 项目全周期计划：目标 · 路线图 · 阶段里程碑 · WBS

- **版本**：以 `package.json.version` 与 `compat-manifest.framework.templateVersion` 为准（**不在此处另写版本号**）
- **更新日期**：2026-10-19
- **归属规范**：CMMI 01_management (PLAN / MC / RSKM)
- **状态真源分工**：
  - 本文件 = **计划与路线图**（要做什么、怎么判断做完了）
  - `project-status.md` = **当前阶段状态**（现在到哪一步）
  - `CURRENT.md` = **已发布能力**（只登记通过发布门禁的能力）
  - `docs/specs/<domain>/<name>/` = **单个特性的规格与任务树**（真源，本文件不复制任务细节）
  - `docs/architecture/EVOLUTION-ROADMAP-2026.md` = **能力向演化路线**（四环同心：治理→旗舰域→端→微服务）

> **两条账的关系（此前互不引用，已接）**：本文件回答「**要交付什么、怎么算做完**」；
> 演化路线图回答「**能力长到第几环了**」。二者**正交**：一条 WBS 可以同时推进多个环，
> 一个环的达成也可能不新增任何交付项。**判定完成状态时两条都要看**，改任一条都要顺手核对另一条。

---

## 0. 本文的口径（先约定怎么算"完成"）

1. **状态只认证据，不认自述。** `✅` 必须能指向一条命令的当次退出码、一个契约文件、或一次 git 取证。
2. **`❓待核验` 是合法状态。** 没有近期实测证据的项一律标此，不写成"应该没问题"。
3. **本文件不抄细节。** 单个特性怎么做、拆几个 Task、各自文件白名单，一律以 `docs/specs/` 下的规格为准；这里只保留**目标、顺序、判据**。
4. **数字不写死。** 门禁数、域数、工具数一律指向其真源（`compat-manifest.json` / `domain-catalog.json` / 实际命令输出），避免又一次漂移。

---

## 1. 项目目标

### 1.1 North Star（一句话）

> **让任何人或任何 Agent，用一句话业务需求，在本基座上全链路无阻塞地孵化出可运行、可审计、可交付的工程。**

### 1.2 成功判据（每条都可执行验证）

| # | 判据 | 验证方式 |
|---|---|---|
| G1 | 基座自身始终绿 | `pnpm run check` exit=0，且全量 `pnpm exec vitest run` 0 failed |
| G2 | 孵化链路无阻塞 | `pnpm run project:create -- <dir> --profile base/minimal` → 产物自身 `check` + `build` 通过 |
| G3 | 新建业务域只有一条命令 | `pnpm run domain:new <域>` 一条命令完成建表→生成→注册→契约→门禁，无手工补步骤 |
| G4 | Agent 面与代码一致 | `pnpm run compat:check` 交叉校验通过（工具/技能/门禁清单无第二真源） |
| G5 | 供应链只减不增 | `pnpm run deps:audit` exit=0（棘轮），且新增漏洞会被拦下 |
| G6 | 客户端能打包 | `pnpm run clients:build:check` exit=0 |
| G7 | 交付链有证据 | `build` / `smoke:login` / `security:scan` / `load:test` / `fingerprint:verify` 各自 exit=0 | **已全绿（本机零容器，2026-10-20）**：`build` ✅ · `fingerprint:verify` ✅ · `smoke:login` **10/10** ✅ · `security:scan` **20/20** ✅ · `verify:real-db` **45 文件 / 192 用例 exit=0** ✅ · `load:test` **3/3 exit=0**（rps 18,534 / 23,015 / 23,632，护栏 5,000）✅ **· 2026-10-28 全链重跑（真 PostgreSQL + 生产产物）：** `build` exit=0 · `fingerprint:verify` exit=0 · `smoke:login` **10/10** exit=0 · `security:scan` **20/20** exit=0 · `load:test` **3/3** exit=0（rps 15,682 / 17,536 / 18,146，护栏 5,000）✅。重跑的价值在于**它抓到了回归**：三条交付链脚本都在本机起不来 —— 详见下方「交付链自起的三个坑」。 |

> **判据达成情况（2026-10-19 实测）**：
> - **G1 / G4 / G5 / G6** ✅ 已达成（`check` exit=0；`compat:check` 28 gates；`deps:audit` 43→9；`clients:build:check` PASS）。
> - **G2 孵化链路** ✅ 已达成 —— 两条入口均已实测：
>   ① degit 路径端到端：
>   `pnpm dlx degit`（无 `.git`/无 tag，6823 文件）→ `pnpm install` → `project:init` → `check` exit=0
>   → `build` exit=0 → `pnpm dev`：`/healthz` 200、`/readyz` 200、登录 200、受保护接口带 token 200 / 无 token 401。
>   ④ **两条入口的产物都跑通了它们自己的 `check`**（2026-10-20，minimal profile）：
  `project:create` → `create=0 / install=0 / **check=0**`；`project:init --target` → `init=0 / install=0 / **check=0**`。
  这条此前**不成立**：`project:create` 的产物 `check` **exit=1**，报 374 处悬空引用 —— 裁剪删掉了域代码，
  而 **wiki 词条（生成物）与 llms/README 的「规模声明」（手写）不会自己消失**（详见 WBS I17）。
  ③ `project:create` 的 reactor/Postgres 路径 **✅ 已实测**（零 Docker）：此前它把
  `postgresql://cooliebase:…@localhost:5433` **写死在三处**，只在"本机恰有 5433 Docker Postgres"时成立；
  现改为 `PROJECT_PG_ADMIN_URL` 可指到任意可达 Postgres。实测（嵌入式 Postgres）：
  `exit=0` · 目标库真实建出 · 生成 `.env` 的 `DATABASE_URL` 指向**那台可达实例**而非 5433。
>   ② `project:init --target` 的四种 profile（base 5 域 / minimal 5 / vertical 6 / creator 17）
>   各跑 `install`+`check`+`build` **全部 exit=0**。
> - **G3 单命令建域** ✅ 已达成 —— 在 degit 副本里 `domain:new probe` 连跑两次：
>   迁移目录未新增、catalog 条目数不变、插件文件指纹完全一致（第二次 14 写 / 2 跳过）。
> - **G7 交付链** ✅ **全部解除** —— `build` / `fingerprint:verify` / `smoke:login`(10/10) /
>   `security:scan`(20/20) / `verify:real-db` / `load:test` 六项**均在本机零容器跑通**。
>   `smoke:login`（10/10）、`security:scan`（20/20）✅ **已在本机零容器验证**（嵌入式 Postgres，
>   `DATABASE_URL` 优先）—— 先前"colima 端口不可达 ⇒ 本机不可验证"的结论**基于 Docker 路径，已被零容器路径取代**。
>   压测此前在本机多次不达标（1,850–2,855 rps），**原因是机器过载而非代码**：机器负载已由产物自证
>   （`load-test-result.json` 的 `environment.loadavg1` / `busyRatio`），不再靠人写"6.8/13/16"。
>   本次通过时 `loadavg 7.29/10.09/9.83`、`负载/核 = 0.61`（安静窗口）。
>   **新增三态判定**：`passed` / `inconclusive`（未达标且机器过载 ⇒ **不当作回归证据**，要求换环境重跑）/
>   `failed`（机器空闲仍不达标 ⇒ 真回归）。**inconclusive 同样非零退出**，绝不因负载高就放行。

> 注：G2 与 G3 是"基座是否真的可用"的核心判据，历史上多次出现"门禁全绿但孵化出的工程起不来"，故这两条必须**跑产物本身**，不能只看基座自测。

---

## 2. 路线图（阶段划分与出口条件）

| 阶段 | 主题 | 出口条件（全部满足才进入下一阶段） | 当前 |
|---|---|---|---|
| **R0** | 地基：域、契约、门禁 | 17 域登记；跨域只走 Facade；`check` 链可一键跑；`compat:check` 交叉校验生效 | ✅ 已达成（本轮实测 `check` exit=0） |
| **R1** | 可孵化：Profile/Bundle 与裁剪 | `project:create` 四种 profile 产物各自 `check` 通过；裁剪后不残留悬空引用；`clients/` 缺席时门禁**跳过而非失败** | ✅ 已达成（2026-10-20 复核）—— 三条判据均有实测，与 **D4/D5** 一致：① 四种 profile（base/minimal/vertical/creator）各跑 `install`+`check`+`build` **全绿**；② `clients/**` 缺席时门禁**跳过而非失败**（SKIP 分支实测）。**原先的「唯一未验」已消除**：reactor/Postgres 路径已可指到任意可达 Postgres（零 Docker 实测跑通）；**且两条入口的产物都实测跑通了自身 `check`**（见 G2④，此前 `project:create` 的产物是红的）。← 此前的「其余 profile 待逐仓复验」与 D4 的 ✅ **自相矛盾**，属陈旧状态 |
| **R2** | 可驱动：Agent 消费面 | MCP 工具面可用且**不写盘**；Skills 与代码同步（`skills:check`）；提示分段可重建；进化待办可回流 | ✅ 已达成（本轮 MCP 18 工具 + 零落盘反向对照 + `compat:check` 28 gates） |
| **R3** | 可交付：全链路交付与真实验证 | `build` / `smoke:login` / `security:scan` / `load:test` / `fingerprint:verify` 全绿；**真实数据库**（`verify:real-db`）验证通过 | ✅ 达成 —— `build`/`fingerprint`/`smoke:login`(10/10)/`security:scan`(20/20)/`verify:real-db`(45 文件 192 用例)/`load:test`(3/3, 18.5k–23.6k rps) 六项**本机零容器全部 exit=0** |
| **R4** | 可运营：SRE 与持续运营资产 | SLO/灾备/复盘/对账/巡检资产齐备，且**未发生时留空**而不是放假 Demo | ✅ 已核实（2026-10-20）—— **未发生即留空**成立：`06_incidents_postmortem/`、`security-reports/`、`09_operations/`、`09_operations/02_data_ops/` 均为空 `.gitkeep`，无假 Demo；唯一实质资产是 SLO 矩阵，其 §3 原把 `v1.1.0` 历史快照写得像现状，已标注为「历史快照，非当前」并改为**指向产物** `load-test-result.json` |

---

## 3. 阶段里程碑

| 里程碑 | 判据 | 取证方式 | 状态 |
|---|---|---|---|
| **M0 地基绿** | 基座 `check` + 全量测试全绿 | `pnpm run check`；`pnpm exec vitest run` | ✅ 2026-10-19 实测（436 files / 816 tests / 0 failed） |
| **M1 契约不漂** | 工具/技能/门禁清单与代码一致 | `pnpm run compat:check` | ✅ 2026-10-19（17 domains / 38 skills / 18 MCP tools / **28 gates**） |
| **M2 供应链可守** | 生产树无新增漏洞；存量有台账 | `pnpm run deps:audit`；台账 `docs/architecture/cooliebase-all-dependency-policy.md` | ✅ 2026-10-19（43 → 9 条，棘轮生效） |
| **M3 客户端可验证** | 客户端构建有门禁且非空壳 | `pnpm run clients:build:check`（含破坏入口反向对照） | ✅ 2026-10-19 |
| **M4 孵化无阻塞** | 产物能启动并跑通自身门禁 | degit 快照：`install`→`init`→`check`→`build`→`dev`→登录 | ✅ 2026-10-20（degit 路径 + reactor/Postgres 路径**均已实测**，后者零 Docker） |
| **M5 单命令建域** | `domain:new` 全自动、可重复执行 | 连续跑两次结果一致（幂等） | ✅ 2026-10-19（指纹一致、迁移不新增） |
| **M6 可交付发布** | 七项交付门禁 + 指纹一致 | `build`/`smoke:login`/`security:scan`/`load:test`/`fingerprint:verify` | ✅ 2026-10-20（六项本机实测 exit=0；发布前按 CI 再复跑一次） |

---

## 4. WBS（工作分解结构）

> 状态：`✅` 已完成（有证据） / `🟡` 部分 / `⬜` 未开始 / `❓` 待核验
> 证据列只写**可复跑**的入口，不写"已完成"。

### WS-A 基座与域架构

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| A1 | 17 域登记于唯一真源 | `domain-catalog.json` 域数 == `compat-manifest.contracts.domainCatalog.domains` | ✅ | `compat:check` |
| A2 | 15 业务域插件化 | `packages/plugins/plugin-*` 与 catalog `layers.plugin` 一致 | ✅ | `pnpm run domain:check` |
| A3 | 跨域只走 Facade | 禁止跨域 import Service | ✅ | `pnpm run microservice:check` |
| A4 | seam 图不漂移 | 生成物与 catalog/contract 一致 | ✅ | `pnpm run domain:seams` + `domain:check` |
| A5 | 平台地基不插件化 | `system`/`infra` 永不进 plugin 层 | ✅ | `check-harness-bundle.cjs` |

### WS-B 契约与治理门禁

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| B1 | 一键门禁链 | 单一命令跑完全部静态门禁 | ✅ | `pnpm run check` |
| B2 | 消费面交叉校验 | 声明的工具/技能/门禁与代码一致 | ✅ | `pnpm run compat:check` |
| B3 | 域目录单一解析器 | 禁止写死 `packages/domains/<name>` | ✅ | `scripts/lib/domain-catalog.cjs` + `domain:check` |
| B4 | 规范机检化 | enforce / ratchet / report 三模式 | ✅ | `pnpm run standards:check` |
| B5 | 依赖 CVE 棘轮 | 只拦新增；无补丁项入台账 | ✅ | `pnpm run deps:audit` |
| B6 | 客户端构建门禁 | 导出产物存在 + 零污染 + 裁剪跳过 | ✅ | `pnpm run clients:build:check` |
| B7 | 版本策略机检 | 模板版本两处同步；最新 tag 有发布说明；解耦须有据 | ✅ | `pnpm run version:check`（含两条反向对照） |
| B8 | 路由校验覆盖（§4.1） | 写路由且读 body 就必须接 Zod；棘轮只拦新增 | ✅ | `pnpm run routes:validation:check`（已接线 **709/854**，剩 145 条全为非标准端点） |
| B9 | 生成物列覆盖 | 仓储列 ⊇ 元数据；可写列必须真能落库 | ✅ | `pnpm run repo:columns:check`（323 仓储 / 324 表，0 违规） |
| B10 | 包管理器调用统一 | 仓内**可执行** `npx` 归零；三种形态 × 八类文件全覆盖 | ✅ | `no-new-npx`（enforce；条数以 `standards:check` 输出为准；反向对照三条） |
| B11 | **WBS 时效性** | 能力面变化（新增 script / 门禁 / 域）必须在同一次提交里更新计划 | ✅ | `pnpm run plan:freshness`（pre-commit 内执行；硬失败=能力面，软提示=触及 `packages/`） |

### WS-C Agent 消费面

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| C1 | 机器契约 | `agent-profile.json` 声明 kind/role/not 且被门禁强校验 | ✅ | `pnpm run harness:check` |
| C2 | Skills 唯一真源 | 无 `docs/skills` 副本；数量与声明一致 | ✅ | `pnpm run skills:check` |
| C3 | MCP 工具面 | 只读 + plan/preview；**永不落盘** | ✅ | `pnpm run compat:check` + `test/unit` 反向对照 |
| C4 | 提示分段 | 按 order 组装，不整篇灌 AGENTS.md | ✅ | `.agents/context/ASSEMBLY.md` |
| C5 | 进化回流 | 门禁产物聚合为待办 | ✅ | `pnpm run evolution:backlog` |

### WS-D 低代码与孵化

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| D1 | 代码生成引擎 | 按表元数据产出全栈骨架 | ✅ | `pnpm run check`（codegen 相关门禁） |
| D2 | 表定义单一真源 | 新增表先写元数据再生成迁移 | ✅ | `scripts/data/*-tables.ts` + `tables:migration` |
| D3 | 一条命令建域 | `domain:new` 完成建表→生成→注册→契约→门禁 | ✅ | 连跑两次幂等（指纹一致） |
| D4 | Profile 裁剪 | 各 profile 产物各自可跑 | ✅ | **5 个 profile（base/minimal/standard/vertical/creator）** 各跑 `hatch:e2e --only init --fast` → `init + install + 产物 check` **全绿（2026-10-20 复验）**；**两条入口都测了**：`project:init` 与 `project:create` 各 × 5 profile = **10/10 PASS（2026-10-20）**。注：`vertical` 必须带 `--bundle`（harness 已内置默认 `mall,crm`）；全量 `hatch:e2e`（含 build + smoke:login 起服务登录）在 minimal 上亦全绿 |
| D5 | 裁剪安全 | `clients/**` 缺席时相关门禁跳过而非失败 | ✅ | **两个分支都在派生工程里实测（2026-10-20）**：含客户端的 `creator` 产物 → `[client-build] PASS: Expo web 导出成功`；已裁剪的 `minimal` 产物 → `[client-build] SKIP: clients/expo/package.json 不存在`（**跳过而非失败**）。此前只在本仓验过，现已在**产物**里坐实 |

### WS-E 质量与测试

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| E1 | 测试金字塔 | L1–L4 各有入口 | ✅ | L1 `test:unit`(test/unit) · L2 `test:integration`(test/integration) · **L3 `test:contract`**(`packages/shared/contract/__tests__`，3 files/5 tests) · L4 `test:e2e`/`test:agent`；`test:matrix` 已补入契约层。口径为**目录即层次**（与既有约定一致）；协议**实现**测试（rpc-*/messaging/grpc/inventory-facade）归 L1/L2 而非 L3，边界已在 AGENTS §8.1 写明；另有 `contract-layer-entry.test.ts` 守卫入口空跑/漏选（含 2 条反向对照） |
| E2 | 真实库验证 | 一键起库→迁移→种子→全量测试→清场 | ✅ | `pnpm run verify:real-db` |
| E3 | 防假测试 | 关键断言须有**会失败**的反向对照 | ✅ | `no-vacuous-test-assertions`（enforce，字面恒真）+ 各门禁的反向对照测试。**结构性空转已实测排查**：850 个测试块中，零 `expect()` 块 1（助手断言，合法）、对字面量断言 0、全弱断言块 2（人工判读均合法：`not.toBeNull()` 正该用例所需、`toBeTruthy()` 在 12 键×4 语言循环里校验非空）。结论：**不存在结构性空转问题**；`pnpm run vacuity:audit` 为 report-only（三启发式均 100% 误报，设为门禁会逼出无意义豁免） |
| E4 | 全量测试绿 | 0 failed | ✅ | 2026-10-19（816 passed） |
| E5 | 变异测试 | 突变体杀灭率达标并作为门禁 | ✅ | `pnpm run mutation:gate`：3/3 killed；存活即失败（独立 CI job） |

### WS-F 供应链安全

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| F1 | 依赖漏洞清零（尽力） | 生产可达层不新增 | ✅ | `deps:audit`（43 → 9） |
| F2 | 已接受风险台账 | 每条有理由与正解 | ✅ | `cooliebase-all-dependency-policy.md` |
| F3 | 客户端 SDK 升级 | 客户端构建门禁全绿 | ✅ | Expo 52 → 58 |

### WS-G 交付与运维

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| GATE-1 | 生产构建 | `next build` 通过 | ✅ | `pnpm run build` |
| GATE-2 | 登录冒烟 | 自管理环境跑到登录 200 | ✅ | `pnpm run smoke:login`（CI） |
| GATE-3 | 安全扫描 | 20 项 + 阴性对照 | ✅ | `pnpm run security:scan`（**本机零容器** 20/20 + CI） |
| GATE-4 | 压测护栏 | 生产产物打压测并对阈值 | ✅ | `pnpm run load:test`（CI） |
| GATE-5 | 环境指纹 | 盖章→核对→篡改必失败 | ✅ | `pnpm run fingerprint` / `fingerprint:verify` |
| GATE-6 | 容器化部署 | 一体镜像 + 域镜像 + compose | ✅ | `deploy/` |
| GATE-7 | SRE 基线 | SLO/灾备/复盘资产真实存在 | ✅ | `SLO-SLI-ERROR-BUDGET-MATRIX.md`（Tier-1/2 + 错误预算，64 行真内容）；`06_incidents_postmortem`/`security-reports` **按零假 Demo 铁律留空 `.gitkeep`**；`cmmi:asset:check` 0 伪造 |

### WS-H 文档与治理资产

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| H1 | CMMI 01~09 目录 | 九阶段目录齐备且非占位 | ✅ | 01/02/03/04/05/06/07/08 均有实质资产（05 的测试总结报告本轮改为**生成物**）；**02 的 SRS/URS 刻意不产出**（真源：20 份 `docs/specs/*/*/brief.json` + 9 份 `docs/features/sprint-prod/*.md` 需求日志；单体 SRS 会成第二真源），**09_operations 按「三存三不存」留空**（资金对账/复盘须带真实凭证）—— 两者都是**决策**，已写进模板与本节。**这两条决策现在有机检**（`cmmi:asset:check` 的「决策性留空」登记）：理由里**不许写死计数**（数字会漂、路径不会 —— 该登记曾把需求真源写成「12 份 / 5 份」，实际已是 20 / 9，而它是脚本、`docs:claims:check` 扫不到，静默漂移了很久），且**必须指向真实存在的仓内路径**；反向对照见 `test/unit/cmmi-absence-reason.test.ts`（写死计数 / 指向空气 → exit 1） |
| H2 | 规格库 | 活跃规格 11 阶段全过 | ✅ | `pnpm run speckit:check -- --spec <名>` |
| H3 | 文档准确性 | 文档声称的命令/数字可复现 | ✅ | 已修：CMMI 模板 6 处错误事实 · 契约数 324→326 · 「20 道门禁」全线写死 · `docs:sync-context` 等死引用 · `docs/05_verification/test-summary-report.md`（**曾少报约 30 倍**，已改为 `pnpm run test:summary` 生成）· 审计文档与当前版本发布说明里的写死数字。机检：`docs:commands:check`（734 处引用全部真实）+ `llms:check`（事实与真源一致）。**刻意不改写**：历史发布说明（v1.1.0）与施工日志 —— 它们是记录，不是现状；**另**：路径引用准确性——全仓实测 62 处不存在中约 26 处属**合法**（反例语境/外部项目/示例），故只对**生成物**建门禁 `gen:paths:check`（`wiki/**`，95 处引用零误报），并修掉 18 处真实陈旧引用（含生成器把已修掉的测试假数字**写回** wiki 这一回流风险） |
| H4 | 全周期计划 | 目标/路线图/里程碑/WBS 落地 | ✅ | 本文件 |
| H5 | 知识面 | OpenWiki / llms.txt 与代码同步 | ✅ | `openwiki:check` 43 篇 100% 同步；新增 `llms:check` 机检 llms.txt/llms-full.txt/AGENTS.md/README.md 的事实声明与真源一致（修掉 8 处实际漂移） |

---

### WS-I Harness 与流程自动化（2026-10-20 新增）

> 本轮工作的主线：让**任意终端 CLI**（cmd / Claude Code / agy / Hermes）都**自动**走
> 「需求分诊 → 规格 → 门禁」，而不是靠模型自觉。

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| I1 | 需求分诊（三值判定） | 同一输入永远同一结论；判不准时宁严勿宽 | ✅ | `pnpm run agent:route -- "<需求>"`（`SPEC_REQUIRED` / `DIRECT_OK` / `NOT_A_REQUIREMENT`）；`test/unit/agent-route.test.ts` 14 条 |
| I2 | 规则表可测 | 真实历史语料未命中率 ≤ 40% | ✅ | `test/unit/agent-route-corpus.test.ts`（37 条真实原话，65% → **32%**） |
| I3 | 跨 CLI 引擎级守卫 | 三家 hooks 接入；两种协议（exit 2 / stdout JSON） | ✅ | `.agents/hooks/spec-gate.sh` + `.agents/hooks/parse-payload.js`；`test/unit/spec-gate-hook.test.ts` 11 条 |
| I4 | 配置接线机检 | 配置合法 **且** 指向真实脚本、规则单一真源 | ✅ | `test/unit/cli-hook-wiring.test.ts` |
| I5 | 金丝雀自检 | 证明「CLI 真的执行了 hook」，而非只配置合法 | ✅ | `pnpm run harness:health`（✅ 生效 / ⚠️ 配了没跑 / — 无配置） |
| I6 | git 兜底（跨 CLI 唯一层） | 哪个 agent 提交都要过 | ✅ | `.githooks/pre-commit` + `core.hooksPath` |
| I7 | §15 强制落地 | 用户原始输入自动入库（此前只有条文） | ✅ | `agent:route` 自动写 `docs/features/sprint-prod/{MMDD}.md` |
| I8 | Hermes 接入 | 幂等安装 + allowlist + 真实拦截 | ✅ | 已装 `~/.hermes/config.yaml` 并 allowlist；`hermes hooks doctor` 全 ✓；`hooks test` 实测把 `exit 2` 解析为 `{"action":"block"}` |
| I9 | 入口一致性机检 | 6 个入口都必须出现 `agent:route` | ✅ | `pnpm run specs:health`（error 级） |
| I10 | **git 兜底可移植** | `core.hooksPath` 是本机配置、不可提交 → 新克隆默认没有 | ✅ | `pnpm run setup:hooks`（幂等；已接 `postinstall`）；`pnpm run harness:health` 报告启用状态 |
| I11 | **测试入口不被环境污染** | 剔除 `DATABASE_URL` / `DB_DRIVER` / **`NODE_ENV`** 后再跑 | ✅ | `pnpm run test:clean`（跨平台；`env -u` 是 POSIX-only 且漏了 NODE_ENV） |
| I12 | **外部 onboarding 进 CI** | 模拟 degit（无 `.git`）→ 安装 → `project:init` → 全量门禁 | ✅ | CI `onboarding` job（非 PR 触发；两处只在「从零开始」路径暴露的回归都在这里守） |
| I13 | **证据门禁能失败** | 自报 `passed` 必须凭**当前**证据（全规格扫描）+ 三条时效；`delivery:check --strict` 在 `check` 链内 | ✅ | 实测揪出 2 个规格自报 `G5_PRE passed` 而压测产物为 `failed=3/3`；反向对照 2 条（无证据 / 30 天前割接记录）均 exit 1 |
| I14 | **两份规划互引** | 交付计划 ↔ 能力演化路线图 双向链接 + 分工说明 | ✅ | 此前 `EVOLUTION-ROADMAP-2026.md` **全仓零引用**（它自己也不引用任何文档）；现互引并登记 AGENTS §13 |
| I15 | **压测判定分三态** | 记录运行时负载，区分 `passed`/`inconclusive`/`failed` | ✅ | 此前不达标只报「失败」，无法区分「真回归」与「机器被压住」。现产物自证环境（`environment.loadavg1`/`busyRatio`）；**inconclusive 同样非零退出**；单测 5 条含反向对照 |
| I16 | **孵化不再依赖 Docker** | `project:create` 的 PG 地址可覆盖；连不上即**中止**不产坏工程 | ✅ | 此前写死 `localhost:5433` 且**忽略环境**；实测：嵌入式 PG 下 `exit=0`、目标库真实建出；不可达时 `exit=1` 且不写 postgres 配置 |
| I17 | **裁剪不留悬空声明** | 裁剪后重生成 wiki + 重写规模声明，产物自身 `check` 全绿 | ✅ | 实测产物的 `check` 原为 **exit=1**（374 处悬空引用：wiki 词条只写不删、llms/README 仍写「17 域/342 契约」）；现两条入口 `check=0`；wiki 生成器补陈旧清理（check 报红 / write 删除），llms 加 `--restamp` 由**同一脚本**判真值并改写 |
| I18 | **孵化端到端固化** | 产物的 `check` 由常规入口守，而非「某次验过」 | ✅ | 新增 `pnpm run hatch:e2e`（两条入口 × minimal，各自 install + 产物 `check` + `build` + `smoke:login` 起服务登录）+ 独立 CI job；反向对照：关掉 restamp → 产物 `check` 红 → 该入口 `exit=1`（**门禁确实能失败**） |
| I19 | **profile 矩阵复验** | **两条入口 × 5 profile** 的产物各自 `check` 全绿 | ✅ | 实测 **10/10 PASS**（init 侧 5/5 + create 侧 5/5）；过程中发现 harness 未传 `--bundle` 导致 `vertical` 误报（已修，并注明**那是 harness 的调用问题、不是产物问题**） |
| I20 | **全栈拉起与网关部署** | 一条命令拉起全栈并就绪自验；网关片段可部署且失败保留原配置 | ✅ | 收编 coolie 派发员工越界写入的产物（规格 `fullstack-launcher-caddy`）；**验证中发现并修正端口不一致**（拉起器原回退 3000，而网关指向 3200 → 部署后会指到空端口）；实测验：`--check` 输出 3200/3200、`deploy-caddy.sh` 本机只打印指引不改系统 |
| I21 | **校验器与元数据不许漂** | 生成校验器与表元数据字段类型不一致时，`check` 必须失败（改完元数据忘重生成就红） | ✅ | 新增 `validators:align:check`（`--check` 只读、与 `--write` 互斥）。实测全仓**需改 0 处**（348 处 `id`/`*_id` 是有意约定）。**独立价值已证明**：validator 与 DTO **一起**改错时 `typecheck` EXIT 0 抓不到，本门禁 EXIT 1 并点名 `ai-api-key.name → 元数据 varchar` |
| I22 | **生产禁用默认密钥** | `NODE_ENV=production` 且未设密钥时，加密/签名必须**当场失败**，不得静默用仓库里公开的默认值 | ✅ | 新增 `crypto:key:guard:check`（**行为级**：起子进程验 production×有/无密钥、以及「只 import 不调用」四种状态）。覆盖 AES / VAULT / HMAC 三个密钥。**反向对照**：把守卫改成 `if(false)` → 3 项红 + exit 1。设计约束：守卫必须在**调用时**，否则 `next build`（NODE_ENV=production）会炸 |
| I23 | **页面不许绕开统一请求层** | 页面/组件里裸 `fetch(` 会让结构化错误、401 跳转、超时归一全部失效；新增必须被拦 | ✅ | 新增 `frontend:request-contract:check`（棘轮冻结 **10 个**存量文件，理由可豁免但**理由不能为空**）。实测：门禁查出 10 个而我先前 grep 只有 9 个（漏了 `.ts`）—— 清单以门禁输出为准 |
| I24 | **写链路必须声明深度测试** | 规格触及写路由/表单页时，必须在 acceptance 声明「正向写库 + 对抗 4xx」或显式豁免理由 | ✅ | 新增 `write:path:depth:check`（棘轮）。**边界如实标注**：只校验**声明**、不证明测试真写了；且现役 20 个规格**0 个触发**（任务白名单多写 `-`）—— 故反向对照必须存在，否则就是永远绿的门禁 |
| I25 | **红绿对抗 E2E 有标准、有模板、有度量** | 写链路 E2E 必须有正向（真实查库）与对抗（4xx+自愈+库不脏）两层；覆盖度只**度量**不冒充 | ✅ | 新增 `test/e2e/README.md`（标准）+ `write-path.sample.spec.ts`（默认 skip 的模板）+ `write:path:depth:report`（report-only）。**首版度量把 skip 用例算成覆盖（1105:2），已修为 1105:0 并单列「条件 skip」** —— 这条自查记录写进提交，不用它去凑数 |
| I26 | **E2E 一条命令自给自足** | 起库→迁移→种子→起应用→跑测试→清场，不留进程与端口 | ✅ | `pnpm run e2e:run` **跑绿**：真 PostgreSQL + `pnpm build` 的 standalone 产物，`EXIT=0 / 2 passed`（会员注册 ① 正向 ② 对抗）—— 写链路覆盖 **2**（原 0）。调试连修 **7 层**，每层都有确切报错：① **调用方 shell 里的 14 字节 `JWT_SECRET` 被盲目继承**（原假设「产物 `.env` 盖掉运行时值」**是错的**）；② `DB_DRIVER=postgres` 不合法（应 `postgresql`）；③ 漏跑 `plugins:register`；④ `app/` 是作用域层级不进 URL；⑤ 公开会员接口被声明成 `auth: company`（**真 bug**）；⑥ 全新启动的应用从不启动插件（**真 bug**，`reconcile()` 无启动期调用方）；⑦ 业务冲突返回 500 而非 409（**真 bug**）。全程实录见 `test/e2e/README.md` §9。
| I27 | **SRE/运营 NPC 有标准数据库工具（只读）** | DBX MCP 接入 dsh，且**配置层强制只读** | ✅ | 新增 `deploy/dsh/mcp-dbx.patch.yml`（`DBX_MCP_ALLOW_WRITES=0`，覆盖 DBX 界面里的写权限）+ `dbx:readonly:check` 门禁（**先剥注释再判** —— 第一版被注释喂饱，反向对照当场抓到）+ `docs/guides/dbx-mcp-integration.md`。**未验证**：dsh 里 `mcp__dbx__*` 是否出现（本机 DBX 无连接） |

### WS-J 文档真实性 · 测试覆盖 · 门禁可失败（2026-10-21 新增）

> 主线：**本轮所有结论都先实测再落文档**。四项工作的共同点是「门禁看着有、实际是空的」。

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| J1 | 文档写死的数字可机检 | **8** 类计数（活跃规格 / 需求日志 / 门禁 / MCP 工具 / 插件 / Skills / 规范规则 / **agent 契约**）与真源逐项对照 | ✅ | `pnpm run docs:claims:check`（扫 `docs/01_management` + `docs/02_requirements` + **`docs/architecture`**，2026-10-28 扩展 —— 当天即在架构文档抓到一处真漂移：agent 契约数写 326、实际 342；**反向对照实测 exit 1**）。规则**必须写明名词**：「契约」有两个真源（§21=340 / agent=342），只写「N 份契约」不检查 |
| J2 | 测试文件不得「没人跑」 | 每个已跟踪 `*.test.ts` 至少被一个具名入口选中 | ✅ | 实测 **480 个文件中原有 426 个**不被任何具名入口选中（只靠全量 `test`）→ 修入口后 **0**；守卫 `test/unit/test-entry-coverage.test.ts`（3 条，含反向对照） |
| J3 | L3 契约层进主门禁链 | `check` 链包含 `test:contract` | ✅ | 此前只在 CI 的 `gates` job，**门禁绿 ≠ L3 跑过** |
| J4 | 空转规则无盲区 | 扫描面覆盖 `packages/shared/**` 与 `src/**` | ✅ | 此前扫 `test`/`domains`/`plugins`/`scripts`，**漏了这两处**；反向对照：往 `packages/shared` 注入恒真断言 → 补面前 PASS（假绿）/ 补面后 FAIL |
| J5 | 文档数字与真源对齐 | 8 处陈旧数字修正 | ✅ | 活跃规格 8→12 · 需求日志 3→5 · 门禁 13→20→21 · 规则 11→17 · 计划快照 10→12 |
| J6 | compat 自我一致性 | `mcp.count` 必须等于 `mcp.tools` 条数 | ✅ | 实测 `count` 写 17 而 `tools` 已 18；根因是该校验只做了 `skills.count`、**同一模式漏了 mcp** —— 已补 |

| J7 | 枚举由**源头数据字典**驱动 | `dictType` 声明链接；取值来自 `system_dict_data` 生成物 | ✅ | 新增 `scripts/generate-dict-catalog.cjs`（源头 SQL → 210 类型 / 1031 取值）+ `dict:catalog:check` 进 `check` 链（篡改生成物 exit 1，已实测）；`resolveColumnEnum()` 接入契约/校验器/表单/列表四处；**158 张有 status 列 → 43 张唯一命中字典**，契约带 `enums` 1 → **44 份** |
**本轮的元教训（记进 §6）**：四次误判里三次是「用推测代替检索」；
另有一次是**反向对照本身设计错了**（只缩一个入口、其它入口仍在覆盖 → "通过"是假阳性）。
**反向对照必须真的移除被检对象**，否则是自我安慰。

## 5. 当前进展快照（2026-10-21）

- **统一生命周期入口**：新增 `pnpm run all`, `init:all`, `test:all` 与 `scripts/lifecycle.sh` 独立全生命周期执行器。
- **基座**：`pnpm run check` exit=0；全量 `pnpm exec vitest run` **0 failed**。
  **易变数字不写死**：测试 files/tests 数、规范规则条数、接线路由数一律以命令输出为准
  （它们随每次加用例/规则而变化，写死必然漂 —— 本仓已连续四轮栽在这上面）。
  写死且受 `llms:check` 看守的只有**稳定计数**：17 domains / 38 skills / **18 MCP tools** / 28 gates / 342 契约。
  ⚠️ **诚实的边界（此前我写错过一次）**：`llms:check` **确实会读本文件**，但只核**它认得的那几类事实**
  （门禁数、域数等）；**MCP 工具数不在其列** —— 所以本文件曾把 MCP 工具数写成旧值、而 compat 声明已更新时，它照样 exit=0。
  这类它管不到的声明，由 `pnpm run docs:claims:check` 兜底。
  本轮实测：本文件三处曾写 17 MCP tools，而 compat 声明已是 18（工具加了、这里没跟），`llms:check` 依旧 exit=0。
  复算：`pnpm run compat:check`（打印当前条数，勿手抄）。
- **消费面**：17 domains / 38 skills / 18 MCP tools / **28 gates / 3 commands**（`compat:check` 实测）。
- **本体模型**：`layers.foundation.capabilities` **11 项，`foundation:ontology:check` 无漂移**。
  （本轮是工具链/流程工作，不改运行时基座能力 —— **这是判断，不是遗漏**。）
- **路由校验覆盖**：已接线 **709 / 854**（82.9%），剩 145 条全为非标准端点（清单 `non-standard-endpoints.md`）。
- **包管理器**：可执行 `npx` **归零**（三种形态 × 八类文件，`no-new-npx` enforce）。
- **供应链**：漏洞 43 → 9（`deps:audit` 棘轮；`shell-quote` 仍为 critical，属开发调试链）。
- **客户端**：Expo SDK 52 → 58，`clients:build:check` 全绿。
- **规格库**：活跃 **20 条**（复算：`ls docs/specs/*/*/brief.json | wc -l`）；本轮新增 `delivery-chain-local-verification` / `mcp-write-tools` / `validator-type-drift` / `npx-to-pnpm`（已归档）。
- **git 钩子自动启用（补了一处时序缺口）**：`postinstall` 会启用 `core.hooksPath=.githooks` ✓，
  但它要求「`git init` **早于** `pnpm install`」—— 而**孵化路径上这个时序不成立**（实测）。
  已在两处 `git init` 之后**直接**调用 `setup-git-hooks.cjs`（幂等）：`scripts/hatch.sh` 与
  `scripts/clone-project-base.cjs`（`project:create` / `project:init`）。
  另：`pnpm run harness:health` 会报告启用状态，未启用时给出确切修法。
  **端到端已验证（2026-10-22）**：`pnpm run project:create <目标> --profile minimal --no-provision-db`
  实测 **exit=0**；产物里 `.git` ✓、`.githooks/pre-commit` ✓、**`core.hooksPath = .githooks`** ✓
  （改动前此处为空）。并在**产物内**验证钩子真能拦：加一个 npm script 却不改计划 →
  `git commit` **exit=1**；同时更新计划 → **exit=0**（拦得住 + 放得行，两个方向都测）。
- **CLI 无关性（不装任何 CLI 也能守住）**：实测兜底链为
  `postinstall → setup-git-hooks`（`core.hooksPath=.githooks`）→ `.githooks/pre-commit` → CI 的 `pnpm run check`。
  直接跑 `.githooks/pre-commit` 可 exit=0（只用 `npm run`，无 CLI 依赖；逃生阀 `AGENT_ROUTE_SKIP=1` 也无关 CLI）。
  **补了一个真缺口**：`plan:freshness` 此前**只挂在 git hook 上**，`--no-verify` 就完全失效且 **CI 不补**；
  已在 CI 加 `--range` 步骤，并**修掉该模式的 bug** —— 它原先 before 取 HEAD、after 取 index，
  提交后两者恒等，**永远不可能失败**（会是个假绿）。修后反向对照实测 exit 1。
- **类型债第三批：TS1117（重复属性）清零**（204 → **192** 诊断 / 202 → 190 唯一键）
  - 仍是同一份**元数据重复**（`iot-scene-rule` / `mp-message`）传到**校验器**（`z.object({...})`）；
  - 去重必须**按对象作用域**（文件级会误删跨对象合法的同名属性 —— 上一批踩过）。
  - ⚠️ **余下 112 条是同一个类型错误** `Type 'string' is not assignable to type 'PermissionCode'`：
    这是台账里"**338 条未登记权限码**"的类型表现 —— **属产品决策**（要么登记权限码，要么放宽契约），
    不是机械替换能解决的。
- **类型债第二批：TS2300 清零**（264 → **204** 诊断 / 262 → 202 唯一键）
  - 只有 **2 个文件**（`iot-scene-rule.types.ts` 42 条 + `mp-message.types.ts` 18 条）：
    生成器把多组字段拍平进同一个 interface 却**没按列名去重**（`type`/`product_id`/`identifier` 各重复 3 次）。
  - 去重前先**验证重复项类型一致**（全部一致 → 才能安全保留首次出现）。
  - 根因在**模板**：`types.template.ts` 用 `columns.map()` 直接铺开 → 已加 `uniqColumns`（按列名去重），防再生。
  - **我踩的坑（两个，都记在这）**：
    ① 去重作用域写成**整个文件** → 把 `id` 这类**在 DO/VO/DTO 里各自合法**的属性跨接口删掉 → 错误反而 264→298。
       改为**按 interface 作用域**去重才对。
    ② 改模板时写成 `open(p,"w")` **然后**再 `read(p)` —— **写时截断、读到空、再写空**，文件被清成 0 字节。
       改成"一次性读入内存、只写一次"。
- **类型债全量回填**：**1268 → 264** 条诊断（唯一键 1266 → **262**），只跑了一次机械替换
  - 回填 **326 个**列表页（`packages/plugins/*/frontend/pages/*-list.page.tsx`）；
  - 三条替换：`res.items → res.data?.items` · `res.total → res.data?.total` · `handleDelete(item.id) → handleDelete(String(item.id))`；
  - **验证**：`check` exit=0 · **`build` exit=0**（前端改动必须以构建为准，不是以类型数为准）· 基线已收紧为 264/262。
  - 剩余 264 条是**别的模式**（不再是那三条），按错误码看主要是 TS2339（属性不存在）与 TS2300（重复标识符）——
    需逐个看，不能机械替换。
- **类型债第一批：`plugin-ai` 清零**（1268 → **1226** 诊断 / 1266 → 1224 唯一键）
  - 根因在**生成模板**，不在页面：`frontend-list.template.ts` 里
    `res.items` / `res.total` 应取 `res.data?.items` / `res.data?.total`（`request.get` 返回 `ApiResponse<T>` 包装）；
    `handleDelete(item.id)` 里 `VO.id` 是 `number` 而 API 要 `string` → 调用处 `String(item.id)`。
  - **先修模板**（未来生成物自动正确），再按插件回填（本批只回填 `plugin-ai` 的 14 个页面）。
  - 剩下 1184 条仍在 `packages/plugins` —— **同一套模板**还会生成同样的错，
    所以**按插件回填是机械的**，可分批推进（`mes 399 / mall 160 / wms 150 / erp 99`）。
- **D4 落地**：`@` 导入环检测（并入 `harness:integrity:check`）—— 记忆文件用 `@path.md` 内联引用，
  成环会导致**递归内联放大上下文**（症状是越用越慢，很难归因）。
  本仓当前 `@` 导入为 **0 处**（实测），但一旦有人加就会当场发现。反向对照：造一个自环 → exit 1。
- **AI 运行时开关（T2）**：`pnpm harness agent {status,up,down}` —— 默认**不启**，业务界面照常。
  - `status` 只读探测（dsh home / PATH / 本仓进程 / MCP 18 工具是否就绪）；
  - `up` 用 `pnpm dlx @deepseek-ai/dsh web --no-open` 起（未装 dsh 时会下载）；
  - **不实现 loop、不臆造 dsh 配置**：`up` 只打印 MCP 接线步骤（`node scripts/mcp/cooliebase-mcp-server.cjs`，stdio），
    具体配置语法以 dsh 文档为准；**没在 dsh 里看到 18 个工具就说明没通**。
- **D2 + D6 落地**：
  **D2**：`ASSEMBLY.md` 新增「任务路由」表 —— 审计维度 1 的结论是缺的不是文件大小而是**路由**；
  路由只引用已有 `order`、不复制条文（§25），并加了**引用校验**（引用不存在的 order → 失败）。
  **D6**：新增「pre-commit 里不允许有独占检查」机检 —— `--no-verify` 能绕过 pre-commit，
  只存在于那里的检查等于没跑（`plan:freshness` 曾经如此，已补进 CI）。**实测反向对照能红**。
  `harness doctor` 现报告**类型债务**（基线 1268 诊断 / 1266 唯一键，Top 目录）。
- **类型检查纳入门禁（规格 `typecheck-gate`，T1–T3 已交付）**：
  新增 `pnpm run typecheck:check` 并接进 `check` 链 —— **棘轮**语义：
  当前唯一键 − 基线唯一键 = 新增，非空即失败；基线缺失 exit 2；解析失败 exit 2。
  **基线实测：诊断 1268 条 / 唯一键 1266 个**，债务 **96.7% 集中在 `packages/plugins`**（1226 条）。
  **反向对照已进单测**（`test/unit/typecheck-ratchet.test.ts`）：注入一个类型错误 → exit 1 并点名文件。
  踩到并记录了两个坑：`--incremental false` 会丢 2 条错误；`tsc` 会在同一位置报多条诊断（诊断数 ≠ 唯一键数）。
- **D3 + D5 整改**：新增 `harness:integrity:check`（进 `check` 链），把审计维度 2/4/9 的共同缺口变成机检：
  ① **条款 ↔ 机制登记表**（`docs/architecture/artifacts/clause-mechanism-map.json`）：
     **29 条条款全部映射到真实存在的 npm script**（77 个去重机制）；新增条款不登记、或登记不存在的脚本 → 失败；
  ② **孤儿门禁脚本**：`scripts/check-*.cjs` / `audit-*.cjs` 必须被 npm script / check 链 / harness 引用；
  ③ **harness 子命令一致性**：转发到的每个 script 必须存在。
  **反向对照 3 条**：新增未登记条款 / 新增未引用门禁脚本 / 登记不存在的机制 —— 均实测 exit 1。
  首跑即抓到 2 个真孤儿：`check-types.cjs`（→ 接成独立 `typecheck`，**故意不进 check**）与
  `audit-and-format-all-menus.cjs`（一次性工具，已删除）。
- **❗新发现**：`tsc --noEmit` 有 **1268 个存量类型错误**，而 `check` 链里**没有类型检查** ——
  即类型安全从未被强制。已接成独立 `pnpm run typecheck` 暴露出来（不进主干，属另一个量级的工程）。
- **`pnpm harness`：标准全流程的唯一主干入口**（审计维度 5 的整改）：
  `route / spec / check / test / e2e / deliver / ops / evolve` 八条主干 + `doctor` 只读体检。
  **设计约束**：零判定逻辑（只转发，判定真源仍是各脚本）· `harness check` 与 `pnpm run check` 完全等价 ·
  `doctor` 含**孤儿脚本扫描**（默认排除自身与构建产物，避免假阳性）。
  同时落地三份互审交付物：`docs/specs/system/harness-mutual-audit/{audit-report,adopt-plan,contribute-list}.md`。
- **AI 入口可见性**：实测 9 个 `.agents/rules/*.md` 中**有 4 个没在 `ASSEMBLY.md` 注册** ——
  AI 入口（cmd / Claude / DigitalStaff）根本看不到它们（其中两个是本轮刚写的 §21/§22）。
  已全部注册（9/9），并在 `harness:check` 里加**覆盖门禁**：磁盘上的每个 rule 都必须出现在装配表，
  且装配表不得引用不存在的文件（两条反向对照实测均 exit 1）。
- **契约治理（§21/§22）**：新增 `pnpm run contracts:governance:check` —— §21 查契约路径是否落在该域
  `publicPrefixes` 内（enforce，1700 处）与 `permissionPrefix` 是否在 `permissions.ts` 登记（ratchet，基线 338 条）；
  §22 查每个规格 `runbook.json` 的非空 `steps`/`rollback`（14 份）。两个 rule 文件已回引条款号。
  **顺带挖出并修掉两处真实鉴权缺陷**：路由模板兜底到无关权限 `INFRA_ONLINE_DEFINITION_QUERY`（对普通表是越权入口，
  已改为**仅托管表**兜底）、`PERM_PREFIX` 归一化漏中划线导致常量永远查不到。
- **枚举真源**：`status` 这类列的取值真源确认为**数据字典**（`sql/init/...sql` 的 `system_dict_data`，
  210 类型 / 1031 取值）。新增 `pnpm run dict:catalog:check`（生成物与源头不一致即 exit 1）与
  `scripts/data/system-dict-catalog.ts`；`dictType` 只声明链接、**不复制取值**。43 张表已落地。
- **文档真实性**：新增 `pnpm run docs:claims:check`（8 类计数对标真源，含架构文档，**反向对照实测 exit 1**）；
  门禁 20 → **21**；`compat` 自身 `mcp.count` 漂移已修并补校验。
- **测试入口覆盖**：480 个测试文件中**原有 426 个不被任何具名入口选中**，已修至 **0** 并加守卫测试。
- **Harness**：本轮 32 个提交；风险台账新增 RSK-011/012/013 并全部收敛到「已知边界 + 机检」。

---

## 6. 本轮核实到的文档不准确清单（已修 / 待修）

| # | 不准确 | 位置 | 处理 |
|---|---|---|---|
| 1 | 状态文件实际是**另一个项目（DigitalStaff）**的发布/阶段真源 | `CURRENT.md`、`project-status.md` | ✅ 本轮改写为本仓真源 |
| 2 | 声称的脚本不存在：`pnpm run api:guard`、`pnpm run git:sync` | `CURRENT.md` | ✅ 随改写移除 |
| 3 | 版本代号 `v1.1.0` 与实际 `1.2.0` 不符 | `project-charter.md` | ✅ 改为指向契约，不再写死 |
| 4 | "20 道门禁"与实际不符（`check` 链 26 个步骤、契约声明 10 条 gate） | `project-charter.md`、`risk-register.md` | ✅ 改为指向真源，不写死数字 |
| 5 | "100% 由真实数据库支撑"与 §9.4 矛盾（默认内存模式，真实库是独立入口） | `project-charter.md` | ✅ 改为如实表述 |
| 6 | ~~04_implementation 仅 1 个文件、01_management 仅 3 个~~ **（本条本身有误）** | `docs/04_implementation/`、`docs/01_management/` | ✅ 实测两处**各 4 个**真实文件（含 `sbom.json` 616 组件、代码审查清单、插件架构蓝图）。**不写死**，复算：`find docs/0*/ -type f ! -name .gitkeep | wc -l`。`09_operations` 为 0 属 §25「未发生留空」合规，**不补水字数** |
| 7 | 风险台账全部标"已受控"，但依赖 CVE、空壳测试两类此前并无门禁 | `risk-register.md` | ✅ 本轮补登 2 条并修正状态口径 |

| 8 | 活跃规格数写「8 份」（计划 H1 / RTM §4 / `1019.md`），实测 **12** | `docs/01_management/`、`docs/02_requirements/` | ✅ 已改为真源实测值 + 附复算命令 |
| 9 | 需求日志写「3 份」，实测 **5** | `1019.md` | ✅ 同上 |
| 10 | 静态门禁写 13，实测 **20**（本轮又 +1 → 21）；规范规则写 11，实测 **17** | NFR §5 | ✅ 改为真源实测值；并由新增的 `docs:claims:check` 看守 |
| 11 | NFR 自相矛盾：`:64` 称数字「由 `llms:check` 守着」，`:65` 又自认「本文件不在被检列表内」 | NFR §5 | ✅ 合并为一句诚实表述（**自我豁免式漂移**的典型） |
| 12 | RTM §5 写「SRS/URS **尚未落地**」，与计划 H1 的「**刻意不产出**（决策）」互斥 | RTM §5 | ✅ 统一为决策口径并写明理由 |
| 13 | 426 个测试文件**不被任何具名入口选中**（480 中仅 54 被选中） | `package.json` 的 `test:*` | ✅ 修入口（`test:unit/matrix/all` 覆盖 `packages`+`scripts`+`src`）→ 0；并加守卫测试防复发 |
| 14 | `compat-manifest` 自身不一致：`mcp.count` 写 17 而 `mcp.tools` 已 18 | `compat-manifest.json` | ✅ 补 `mcp.count === tools.length` 校验（与既有 `skills.count` 同款，此前**只做了 skills**） |
| 15 | 空转规则声称 enforce，实际不扫 `packages/shared` 与 `src` | `check-engineering-standards.cjs` | ✅ 补扫描面；反向对照证明补前后判据不同 |
---

## 7. 维护规则

1. **改计划**：直接改本文件，并在 `docs/features/sprint-prod/<MMDD>.md` 记一条（AGENTS §15）。
2. **改状态**：只改 `project-status.md`；发布能力只登记到 `CURRENT.md`。
3. **改判据**：任何 `✅` 若失去可复跑的取证入口，必须降级为 `❓`，不得保留。
4. **不写死的数字**：门禁数/域数/工具数一律引用真源文件或命令输出。


---

## 附：交付链自起的三个坑（2026-10-28 重跑 G7 时实测）

重跑 G7 的意义就在这里 —— 旧证据是 10-20 的，而期间改过插件挂载与鉴权。
三条脚本在本机**全起不来**，根因各不相同：

| # | 脚本 | 现象 | 真因 | 修法 |
|---|---|---|---|---|
| 1 | `smoke:login` | `6/7`，卡在「起服务」 | 它起的是 **`pnpm dev`**（`next dev`），依赖 Turbopack 的**文件监听器**；本机报 `TurbopackInternalError: unable to start FSEvent stream` | 有产物时**默认起生产产物**（standalone 不监听文件，且更接近发布态）；`--dev` 可强制回开发态 |
| 2 | `security:scan` | `2/3`，卡在「起服务」 | 同 1；**并且它从来没传 `PORT`** —— `next dev -p 3200` 把端口写死在命令里，而 standalone 认 `PORT`，不给就退回 3000，探针却打 `BASE`(3200) | 同样走生产产物 + **`PORT` 由 `BASE` 推出**（两处永远一致） |
| 3 | `smoke:login` / `security:scan` / `load:test` | 生产分支报 JWT 校验失败 | **盲信继承来的 `JWT_SECRET`** —— 本机 shell 里是 14 字节占位值（`e2e:run` 早先踩过同一个坑） | 继承值 **≥32 字节才用**，否则临时生成 |

> **教训（同一条，第三次出现）**：交付链脚本**不能假设调用方的 shell 是干净的**。
> `DB_DRIVER` / `JWT_SECRET` / `PORT` 这类变量要么显式给、要么先校验再采用 ——
> 这不是洁癖：它让「门禁绿」与「本机环境」纠缠在一起，换台机器结论就变。


---

## 附二：CI 一直红着（2026-10-28 首次实查 `gh run list`）

那条「G7 只能在 CI 验，不要假装跑过」一直挂着。这轮用 `gh` 一查才知道：
**最近每次 push 的 CI 都是 `completed failure`，21 秒就挂**，而且**一直没人看**。
本地 `check` 全绿、G7 本地全绿 —— CI 却从来没绿过。

### 已修的四条（共同点：**只在 CI 的形态下才成立**）

| # | 现象 | 真因 |
|---|---|---|
| 1 | 每个 job 21s 就死 | 工作流写 `version: 12` **且** `package.json` 有 `packageManager: pnpm@12.4.2` → `pnpm/action-setup@v4` 报 `Multiple versions of pnpm specified` |
| 2 | 派生工程 `check` 必红 | 契约测试**写死品牌名** `CoolieBase All`；CI 孵化的叫 `CI Demo` → `expected 'CI Demo' to be 'CoolieBase All'` |
| 3 | 十几个门禁探针测试一起红 | `git clone --local` 默认**硬链接**，**跨文件系统必失败**（CI: `/home/runner/work` vs `/tmp`；本地 macOS 同卷所以永远绿）→ 加 `--no-hardlinks` |
| 4 | Windows job 装不上 | `ERR_PNPM_IGNORED_BUILDS: @embedded-postgres/windows-x64` —— `allowBuilds` 里有 darwin/linux 各变体，**独缺 windows** |

### 进展与剩余

- ✅ `pnpm install` / 门禁 / **派生工程全量门禁**（onboarding 的核心步骤）现在都过；
- ⚠️ `gates` 的「单元与集成测试」：从 ~16 个失败文件 → **已修完**（见下）；
- ⚠️ `hatch`：派生产物的 `check` 里 `[doc-claims] ✗ 发现 1 处声明与真源不符`（裁剪后计数没跟着变）—— **下一轮**；
- ⚠️ `windows`：`--frozen-lockfile` 仍在下载依赖后失败，待查；
- ⚠️ `onboarding`：核心步骤已过，`Post Run actions/setup-node` 仍 ✗（疑似缓存动作，非我们代码）。

### 一条更该记的教训

`pnpm run check` **不含 `test:unit`**（只跑 `test:contract`），而单测**只在 CI 里跑** ——
而 CI 红了很多轮。也就是说：**这段时间里单元测试实际上从来没跑过**。

这轮修完 CI 后，单测立刻抓出**我自己两处**改动留下的破绽
（`write-path-depth` 的豁免逻辑、`plugin-mount-auth` 的 mock）。
**"我只跑了新写的那个测试 + check"不等于验过** —— 这正是本仓反复讲的那句。
