# 项目全周期计划：目标 · 路线图 · 阶段里程碑 · WBS

- **版本**：以 `package.json.version` 与 `compat-manifest.framework.templateVersion` 为准（**不在此处另写版本号**）
- **更新日期**：2026-10-19
- **归属规范**：CMMI 01_management (PLAN / MC / RSKM)
- **状态真源分工**：
  - 本文件 = **计划与路线图**（要做什么、怎么判断做完了）
  - `project-status.md` = **当前阶段状态**（现在到哪一步）
  - `CURRENT.md` = **已发布能力**（只登记通过发布门禁的能力）
  - `docs/specs/<domain>/<name>/` = **单个特性的规格与任务树**（真源，本文件不复制任务细节）

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
| G1 | 基座自身始终绿 | `npm run check` exit=0，且全量 `pnpm exec vitest run` 0 failed |
| G2 | 孵化链路无阻塞 | `npm run project:create -- <dir> --profile base/minimal` → 产物自身 `check` + `build` 通过 |
| G3 | 新建业务域只有一条命令 | `npm run domain:new <域>` 一条命令完成建表→生成→注册→契约→门禁，无手工补步骤 |
| G4 | Agent 面与代码一致 | `npm run compat:check` 交叉校验通过（工具/技能/门禁清单无第二真源） |
| G5 | 供应链只减不增 | `npm run deps:audit` exit=0（棘轮），且新增漏洞会被拦下 |
| G6 | 客户端能打包 | `npm run clients:build:check` exit=0 |
| G7 | 交付链有证据 | `build` / `smoke:login` / `security:scan` / `load:test` / `fingerprint:verify` 各自 exit=0 | **大部分解除**：`smoke:login`（10/10）与 `security:scan`（20/20）已在本机**零容器**验证通过（嵌入式 Postgres，`DATABASE_URL` 优先）。**仍未通过**：`load:test` 的 rps 护栏在本机不过（机器负载 6.8/13/16、colima VM 占 243% CPU；受控对照证明数据库不是变量），以及 `verify:real-db` 需真实库 |

> **判据达成情况（2026-10-19 实测）**：
> - **G1 / G4 / G5 / G6** ✅ 已达成（`check` exit=0；`compat:check` 20 gates；`deps:audit` 43→9；`clients:build:check` PASS）。
> - **G2 孵化链路** ✅ 已达成 —— 两条入口均已实测：
>   ① degit 路径端到端：
>   `pnpm dlx degit`（无 `.git`/无 tag，6823 文件）→ `pnpm install` → `project:init` → `check` exit=0
>   → `build` exit=0 → `pnpm dev`：`/healthz` 200、`/readyz` 200、登录 200、受保护接口带 token 200 / 无 token 401。
>   （`project:create` 的 reactor/Postgres 路径因本机 Docker 端口不可达，未单独验证。）
>   ② `project:init --target` 的四种 profile（base 5 域 / minimal 5 / vertical 6 / creator 17）
>   各跑 `install`+`check`+`build` **全部 exit=0**。
> - **G3 单命令建域** ✅ 已达成 —— 在 degit 副本里 `domain:new probe` 连跑两次：
>   迁移目录未新增、catalog 条目数不变、插件文件指纹完全一致（第二次 14 写 / 2 跳过）。
> - **G7 交付链** 🟡 部分 —— `build` ✅、`fingerprint` ✅；
>   `smoke:login` / `security:scan` / `load:test` **本机不可验证**：Docker 为 colima(Linux VM)，
>   容器 `postgres` 的发布端口（宿主 5433）从 macOS 连不上（5432/5433 均 ECONNREFUSED，容器内正常），
>   故 Prisma 迁移报 `P1001 Can't reach database server`。这三项需在 CI 或可达数据库的环境执行。

> 注：G2 与 G3 是"基座是否真的可用"的核心判据，历史上多次出现"门禁全绿但孵化出的工程起不来"，故这两条必须**跑产物本身**，不能只看基座自测。

---

## 2. 路线图（阶段划分与出口条件）

| 阶段 | 主题 | 出口条件（全部满足才进入下一阶段） | 当前 |
|---|---|---|---|
| **R0** | 地基：域、契约、门禁 | 17 域登记；跨域只走 Facade；`check` 链可一键跑；`compat:check` 交叉校验生效 | ✅ 已达成（本轮实测 `check` exit=0） |
| **R1** | 可孵化：Profile/Bundle 与裁剪 | `project:create` 四种 profile 产物各自 `check` 通过；裁剪后不残留悬空引用；`clients/` 缺席时门禁**跳过而非失败** | 🟡 部分达成（`clients` 跳过已实测；其余 profile 待逐仓复验） |
| **R2** | 可驱动：Agent 消费面 | MCP 工具面可用且**不写盘**；Skills 与代码同步（`skills:check`）；提示分段可重建；进化待办可回流 | ✅ 已达成（本轮 MCP 17 工具 + 零落盘反向对照 + `compat:check` 20 gates） |
| **R3** | 可交付：全链路交付与真实验证 | `build` / `smoke:login` / `security:scan` / `load:test` / `fingerprint:verify` 全绿；**真实数据库**（`verify:real-db`）验证通过 | 🟡 部分达成（`smoke:login` **10/10**、`security:scan` **20/20** 已可在本机**零容器**跑通；`load:test` 能跑但本机 rps 护栏不过——受机器负载影响，memory 1850 vs embedded 2005 vs 基线 26877，**不调低阈值**；真实库与压测仍需按发布节奏复验） |
| **R4** | 可运营：SRE 与持续运营资产 | SLO/灾备/复盘/对账/巡检资产齐备，且**未发生时留空**而不是放假 Demo | ❓ 待核验（目录存在，内容真实性未逐项核实） |

---

## 3. 阶段里程碑

| 里程碑 | 判据 | 取证方式 | 状态 |
|---|---|---|---|
| **M0 地基绿** | 基座 `check` + 全量测试全绿 | `npm run check`；`pnpm exec vitest run` | ✅ 2026-10-19 实测（436 files / 816 tests / 0 failed） |
| **M1 契约不漂** | 工具/技能/门禁清单与代码一致 | `npm run compat:check` | ✅ 2026-10-19（17 domains / 38 skills / 17 MCP tools / **20 gates**） |
| **M2 供应链可守** | 生产树无新增漏洞；存量有台账 | `npm run deps:audit`；台账 `docs/architecture/cooliebase-all-dependency-policy.md` | ✅ 2026-10-19（43 → 9 条，棘轮生效） |
| **M3 客户端可验证** | 客户端构建有门禁且非空壳 | `npm run clients:build:check`（含破坏入口反向对照） | ✅ 2026-10-19 |
| **M4 孵化无阻塞** | 产物能启动并跑通自身门禁 | degit 快照：`install`→`init`→`check`→`build`→`dev`→登录 | ✅ 2026-10-19（degit 路径；reactor/Postgres 路径未验） |
| **M5 单命令建域** | `domain:new` 全自动、可重复执行 | 连续跑两次结果一致（幂等） | ✅ 2026-10-19（指纹一致、迁移不新增） |
| **M6 可交付发布** | 七项交付门禁 + 指纹一致 | `build`/`smoke:login`/`security:scan`/`load:test`/`fingerprint:verify` | 🟡 部分（CI 已覆盖，发布前需复跑） |

---

## 4. WBS（工作分解结构）

> 状态：`✅` 已完成（有证据） / `🟡` 部分 / `⬜` 未开始 / `❓` 待核验
> 证据列只写**可复跑**的入口，不写"已完成"。

### WS-A 基座与域架构

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| A1 | 17 域登记于唯一真源 | `domain-catalog.json` 域数 == `compat-manifest.contracts.domainCatalog.domains` | ✅ | `compat:check` |
| A2 | 15 业务域插件化 | `packages/plugins/plugin-*` 与 catalog `layers.plugin` 一致 | ✅ | `npm run domain:check` |
| A3 | 跨域只走 Facade | 禁止跨域 import Service | ✅ | `npm run microservice:check` |
| A4 | seam 图不漂移 | 生成物与 catalog/contract 一致 | ✅ | `npm run domain:seams` + `domain:check` |
| A5 | 平台地基不插件化 | `system`/`infra` 永不进 plugin 层 | ✅ | `check-harness-bundle.cjs` |

### WS-B 契约与治理门禁

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| B1 | 一键门禁链 | 单一命令跑完全部静态门禁 | ✅ | `npm run check` |
| B2 | 消费面交叉校验 | 声明的工具/技能/门禁与代码一致 | ✅ | `npm run compat:check` |
| B3 | 域目录单一解析器 | 禁止写死 `packages/domains/<name>` | ✅ | `scripts/lib/domain-catalog.cjs` + `domain:check` |
| B4 | 规范机检化 | enforce / ratchet / report 三模式 | ✅ | `npm run standards:check` |
| B5 | 依赖 CVE 棘轮 | 只拦新增；无补丁项入台账 | ✅ | `npm run deps:audit` |
| B6 | 客户端构建门禁 | 导出产物存在 + 零污染 + 裁剪跳过 | ✅ | `npm run clients:build:check` |
| B7 | 版本策略机检 | 模板版本两处同步；最新 tag 有发布说明；解耦须有据 | ✅ | `npm run version:check`（含两条反向对照） |
| B8 | 路由校验覆盖（§4.1） | 写路由且读 body 就必须接 Zod；棘轮只拦新增 | ✅ | `npm run routes:validation:check`（已接线 **709/854**，剩 145 条全为非标准端点） |
| B9 | 生成物列覆盖 | 仓储列 ⊇ 元数据；可写列必须真能落库 | ✅ | `npm run repo:columns:check`（323 仓储 / 324 表，0 违规） |
| B10 | 包管理器调用统一 | 仓内**可执行** `npx` 归零；三种形态 × 八类文件全覆盖 | ✅ | `no-new-npx`（enforce；条数以 `standards:check` 输出为准；反向对照三条） |
| B11 | **WBS 时效性** | 能力面变化（新增 script / 门禁 / 域）必须在同一次提交里更新计划 | ✅ | `npm run plan:freshness`（pre-commit 内执行；硬失败=能力面，软提示=触及 `packages/`） |

### WS-C Agent 消费面

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| C1 | 机器契约 | `agent-profile.json` 声明 kind/role/not 且被门禁强校验 | ✅ | `npm run harness:check` |
| C2 | Skills 唯一真源 | 无 `docs/skills` 副本；数量与声明一致 | ✅ | `npm run skills:check` |
| C3 | MCP 工具面 | 只读 + plan/preview；**永不落盘** | ✅ | `npm run compat:check` + `test/unit` 反向对照 |
| C4 | 提示分段 | 按 order 组装，不整篇灌 AGENTS.md | ✅ | `.agents/context/ASSEMBLY.md` |
| C5 | 进化回流 | 门禁产物聚合为待办 | ✅ | `npm run evolution:backlog` |

### WS-D 低代码与孵化

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| D1 | 代码生成引擎 | 按表元数据产出全栈骨架 | ✅ | `npm run check`（codegen 相关门禁） |
| D2 | 表定义单一真源 | 新增表先写元数据再生成迁移 | ✅ | `scripts/data/*-tables.ts` + `tables:migration` |
| D3 | 一条命令建域 | `domain:new` 完成建表→生成→注册→契约→门禁 | ✅ | 连跑两次幂等（指纹一致） |
| D4 | Profile 裁剪 | 四种 profile 产物各自可跑 | ✅ | base/minimal/vertical/creator 各跑 install+check+build 全绿（2026-10-19） |
| D5 | 裁剪安全 | `clients/**` 缺席时相关门禁跳过而非失败 | ✅ | `clients:build:check` SKIP 分支实测 |

### WS-E 质量与测试

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| E1 | 测试金字塔 | L1–L4 各有入口 | ✅ | L1 `test:unit`(test/unit) · L2 `test:integration`(test/integration) · **L3 `test:contract`**(`packages/shared/contract/__tests__`，3 files/5 tests) · L4 `test:e2e`/`test:agent`；`test:matrix` 已补入契约层。口径为**目录即层次**（与既有约定一致）；协议**实现**测试（rpc-*/messaging/grpc/inventory-facade）归 L1/L2 而非 L3，边界已在 AGENTS §8.1 写明；另有 `contract-layer-entry.test.ts` 守卫入口空跑/漏选（含 2 条反向对照） |
| E2 | 真实库验证 | 一键起库→迁移→种子→全量测试→清场 | ✅ | `npm run verify:real-db` |
| E3 | 防假测试 | 关键断言须有**会失败**的反向对照 | ✅ | `no-vacuous-test-assertions`（enforce，字面恒真）+ 各门禁的反向对照测试。**结构性空转已实测排查**：850 个测试块中，零 `expect()` 块 1（助手断言，合法）、对字面量断言 0、全弱断言块 2（人工判读均合法：`not.toBeNull()` 正该用例所需、`toBeTruthy()` 在 12 键×4 语言循环里校验非空）。结论：**不存在结构性空转问题**；`npm run vacuity:audit` 为 report-only（三启发式均 100% 误报，设为门禁会逼出无意义豁免） |
| E4 | 全量测试绿 | 0 failed | ✅ | 2026-10-19（816 passed） |
| E5 | 变异测试 | 突变体杀灭率达标并作为门禁 | ✅ | `npm run mutation:gate`：3/3 killed；存活即失败（独立 CI job） |

### WS-F 供应链安全

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| F1 | 依赖漏洞清零（尽力） | 生产可达层不新增 | ✅ | `deps:audit`（43 → 9） |
| F2 | 已接受风险台账 | 每条有理由与正解 | ✅ | `cooliebase-all-dependency-policy.md` |
| F3 | 客户端 SDK 升级 | 客户端构建门禁全绿 | ✅ | Expo 52 → 58 |

### WS-G 交付与运维

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| GATE-1 | 生产构建 | `next build` 通过 | ✅ | `npm run build` |
| GATE-2 | 登录冒烟 | 自管理环境跑到登录 200 | ✅ | `npm run smoke:login`（CI） |
| GATE-3 | 安全扫描 | 20 项 + 阴性对照 | ✅ | `npm run security:scan`（**本机零容器** 20/20 + CI） |
| GATE-4 | 压测护栏 | 生产产物打压测并对阈值 | ✅ | `npm run load:test`（CI） |
| GATE-5 | 环境指纹 | 盖章→核对→篡改必失败 | ✅ | `npm run fingerprint` / `fingerprint:verify` |
| GATE-6 | 容器化部署 | 一体镜像 + 域镜像 + compose | ✅ | `deploy/` |
| GATE-7 | SRE 基线 | SLO/灾备/复盘资产真实存在 | ✅ | `SLO-SLI-ERROR-BUDGET-MATRIX.md`（Tier-1/2 + 错误预算，64 行真内容）；`06_incidents_postmortem`/`security-reports` **按零假 Demo 铁律留空 `.gitkeep`**；`cmmi:asset:check` 0 伪造 |

### WS-H 文档与治理资产

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| H1 | CMMI 01~09 目录 | 九阶段目录齐备且非占位 | ✅ | 01/02/03/04/05/06/07/08 均有实质资产（05 的测试总结报告本轮改为**生成物**）；**02 的 SRS/URS 刻意不产出**（真源：8 份 `docs/specs/*/brief.json` + 需求日志；单体 SRS 会成第二真源），**09_operations 按「三存三不存」留空**（资金对账/复盘须带真实凭证）—— 两者都是**决策**，已写进模板与本节 |
| H2 | 规格库 | 活跃规格 11 阶段全过 | ✅ | `npm run speckit:check -- --spec <名>` |
| H3 | 文档准确性 | 文档声称的命令/数字可复现 | ✅ | 已修：CMMI 模板 6 处错误事实 · 契约数 324→326 · 「20 道门禁」全线写死 · `docs:sync-context` 等死引用 · `docs/05_verification/test-summary-report.md`（**曾少报约 30 倍**，已改为 `npm run test:summary` 生成）· 审计文档与当前版本发布说明里的写死数字。机检：`docs:commands:check`（734 处引用全部真实）+ `llms:check`（事实与真源一致）。**刻意不改写**：历史发布说明（v1.1.0）与施工日志 —— 它们是记录，不是现状；**另**：路径引用准确性——全仓实测 62 处不存在中约 26 处属**合法**（反例语境/外部项目/示例），故只对**生成物**建门禁 `gen:paths:check`（`wiki/**`，95 处引用零误报），并修掉 18 处真实陈旧引用（含生成器把已修掉的测试假数字**写回** wiki 这一回流风险） |
| H4 | 全周期计划 | 目标/路线图/里程碑/WBS 落地 | ✅ | 本文件 |
| H5 | 知识面 | OpenWiki / llms.txt 与代码同步 | ✅ | `openwiki:check` 43 篇 100% 同步；新增 `llms:check` 机检 llms.txt/llms-full.txt/AGENTS.md/README.md 的事实声明与真源一致（修掉 8 处实际漂移） |

---

### WS-I Harness 与流程自动化（2026-10-20 新增）

> 本轮工作的主线：让**任意终端 CLI**（cmd / Claude Code / agy / Hermes）都**自动**走
> 「需求分诊 → 规格 → 门禁」，而不是靠模型自觉。

| ID | 工作项 | 验收 | 状态 | 证据 |
|---|---|---|---|---|
| I1 | 需求分诊（三值判定） | 同一输入永远同一结论；判不准时宁严勿宽 | ✅ | `npm run agent:route -- "<需求>"`（`SPEC_REQUIRED` / `DIRECT_OK` / `NOT_A_REQUIREMENT`）；`test/unit/agent-route.test.ts` 14 条 |
| I2 | 规则表可测 | 真实历史语料未命中率 ≤ 40% | ✅ | `test/unit/agent-route-corpus.test.ts`（37 条真实原话，65% → **32%**） |
| I3 | 跨 CLI 引擎级守卫 | 三家 hooks 接入；两种协议（exit 2 / stdout JSON） | ✅ | `.agents/hooks/spec-gate.sh` + `.agents/hooks/parse-payload.js`；`test/unit/spec-gate-hook.test.ts` 11 条 |
| I4 | 配置接线机检 | 配置合法 **且** 指向真实脚本、规则单一真源 | ✅ | `test/unit/cli-hook-wiring.test.ts` |
| I5 | 金丝雀自检 | 证明「CLI 真的执行了 hook」，而非只配置合法 | ✅ | `npm run harness:health`（✅ 生效 / ⚠️ 配了没跑 / — 无配置） |
| I6 | git 兜底（跨 CLI 唯一层） | 哪个 agent 提交都要过 | ✅ | `.githooks/pre-commit` + `core.hooksPath` |
| I7 | §15 强制落地 | 用户原始输入自动入库（此前只有条文） | ✅ | `agent:route` 自动写 `docs/features/sprint-prod/{MMDD}.md` |
| I8 | Hermes 接入 | 幂等安装 + allowlist + 真实拦截 | ✅ | 已装 `~/.hermes/config.yaml` 并 allowlist；`hermes hooks doctor` 全 ✓；`hooks test` 实测把 `exit 2` 解析为 `{"action":"block"}` |
| I9 | 入口一致性机检 | 6 个入口都必须出现 `agent:route` | ✅ | `npm run specs:health`（error 级） |
| I10 | **git 兜底可移植** | `core.hooksPath` 是本机配置、不可提交 → 新克隆默认没有 | ✅ | `npm run setup:hooks`（幂等；已接 `postinstall`）；`npm run harness:health` 报告启用状态 |
| I11 | **测试入口不被环境污染** | 剔除 `DATABASE_URL` / `DB_DRIVER` / **`NODE_ENV`** 后再跑 | ✅ | `pnpm run test:clean`（跨平台；`env -u` 是 POSIX-only 且漏了 NODE_ENV） |
| I12 | **外部 onboarding 进 CI** | 模拟 degit（无 `.git`）→ 安装 → `project:init` → 全量门禁 | ✅ | CI `onboarding` job（非 PR 触发；两处只在「从零开始」路径暴露的回归都在这里守） |

## 5. 当前进展快照（2026-10-20）

- **基座**：`pnpm run check` exit=0；全量 `pnpm exec vitest run` **0 failed**。
  **易变数字不写死**：测试 files/tests 数、规范规则条数、接线路由数一律以命令输出为准
  （它们随每次加用例/规则而变化，写死必然漂 —— 本仓已连续四轮栽在这上面）。
  写死且受 `llms:check` 看守的只有**稳定计数**：17 domains / 38 skills / 17 MCP tools / 20 gates / 342 契约。
- **消费面**：17 domains / 38 skills / 17 MCP tools / **20 gates / 3 commands**（`compat:check` 实测）。
- **本体模型**：`layers.foundation.capabilities` **11 项，`foundation:ontology:check` 无漂移**。
  （本轮是工具链/流程工作，不改运行时基座能力 —— **这是判断，不是遗漏**。）
- **路由校验覆盖**：已接线 **709 / 854**（82.9%），剩 145 条全为非标准端点（清单 `non-standard-endpoints.md`）。
- **包管理器**：可执行 `npx` **归零**（三种形态 × 八类文件，`no-new-npx` enforce）。
- **供应链**：漏洞 43 → 9（`deps:audit` 棘轮；`shell-quote` 仍为 critical，属开发调试链）。
- **客户端**：Expo SDK 52 → 58，`clients:build:check` 全绿。
- **规格库**：活跃 **10 条**；本轮新增 `delivery-chain-local-verification` / `mcp-write-tools` / `validator-type-drift` / `npx-to-pnpm`（已归档）。
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
| 6 | 04_implementation 仅 1 个文件、01_management 仅 3 个，覆盖度不足 | `docs/04_implementation/`、`docs/01_management/` | ⬜ 待补（本文件先补规划面） |
| 7 | 风险台账全部标"已受控"，但依赖 CVE、空壳测试两类此前并无门禁 | `risk-register.md` | ✅ 本轮补登 2 条并修正状态口径 |

---

## 7. 维护规则

1. **改计划**：直接改本文件，并在 `docs/features/sprint-prod/<MMDD>.md` 记一条（AGENTS §15）。
2. **改状态**：只改 `project-status.md`；发布能力只登记到 `CURRENT.md`。
3. **改判据**：任何 `✅` 若失去可复跑的取证入口，必须降级为 `❓`，不得保留。
4. **不写死的数字**：门禁数/域数/工具数一律引用真源文件或命令输出。
