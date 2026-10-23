# Harness 交付闭环全面互审 —— 审计报告

> **立场**：双向互审。既对照 wenlv-next 基线找差距（**取长**），也提炼本项目独有强项反哺通用版（**会友**）。
> **方法**：每维「机器可查 + 抽样走查」双证据（见 `spec.md` §6）。
> **红线**：本报告**不修改**任何代码/脚本/宪法文件。
> **审计时间**：2026-10-24 · 执行者：本项目 AI 数字员工
>
> **特别说明**：本报告大量引用 **本仓近两日真实踩到的故障**。凡标「**实测**」的，
> 都发生在本次审计的执行者的实际操作中，**有提交记录可查** —— 这比"理论上会怎样"硬得多。

---

## 0. 第 0 步：校验 `self-portrait.md` 是否仍与现状一致

**结论：画像基本准确，但有 4 处已过期**（审计从修正画像开始，符合 spec §6 要求）。

| 画像里的说法 | 现状实测 | 处置 |
|---|---|---|
| AGENTS.md 91KB | **91,442 字节** ✓ | 准确 |
| `pnpm run compat:check` | 本仓规范形态是 **`pnpm run compat:check`** | **过期**：本仓 AGENTS §2.1 明令 `npm run`（历史遗留形态），并有 `no-new-npm-run` 棘轮 |
| 契约含 domainCatalog（17 域） | ✓ 准确 | — |
| （未提及）门禁数 | **21**（画像写作时间应为 20） | 补充 |
| （未提及）规则文件数 | **9** 个 `.agents/rules/*.md` | 补充 |
| （未提及）本次新增的 3 道门禁 | `docs:claims:check` / `contracts:governance:check` / `dict:catalog:check` | 补充 |

**画像的定位描述（workspace-bundle / 非 agent-runtime / Agent loop 在 DigitalStaff）与 `agent-profile.json` 一致** ✓ —— 这部分可直接作为互审共识基础。

---

## 1. 首屏入口（**重点维**）

### 结论：⚠️ **部分具备** —— 且**代价可量化**

**机器可查：**

```
AGENTS.md      91,442 字节   ≈ 13.9k tokens（91,442 / 4 粗估，未计中文更高密度 → 实际更高）
CLAUDE.md       3,754 字节
CURRENT.md      3,344 字节
.agents/skills 38 个 · .agents/rules 9 个
.agents/context/ASSEMBLY.md  分段装配表（14 个分段，含 9 个规则）
```

**代价量化（维度 1 的硬要求）：**

| 场景 | 代价 |
|---|---|
| 新 agent 进场读 `AGENTS.md` 全文 | **≈14k tokens（保守；中文实际可能 20k+）** |
| 读 `CLAUDE.md` + `ASSEMBLY.md` | 3.7KB + 装配表 ≈ **2k tokens** |
| **命中一个 skill 要几跳** | `ASSEMBLY.md` → `order 100 skill` 段 → `.agents/skills/<name>/SKILL.md` → **3 跳**（且需模型自己判断该加载哪个） |
| 是否有 8KB 级路由层 | **无** ✗ —— 只有清单式装配表，没有"该读哪个"的**决策路由** |

**⚠️ 本次实测到的具体缺陷（有提交记录）：**

> **9 个规则文件里，有 4 个没在 `ASSEMBLY.md` 注册** —— AI 入口**看不到它们**。
> 其中包含本次刚写的 §21/§22 两个规则。
> 更关键的是：**此前只有一个"点检"**（只断言 `high-order-inverse-thinking` 挂没挂），
> 其余 8 个漏了也全绿。**已修**（补注册 + 改为覆盖检查，反向对照实测能红）。
> 提交：`8527af2c`

**🎁 强项（可反哺）**：`ASSEMBLY.md` 的**分段装配 + order 排序**是正确的方向（避免"整篇灌"），
且已经把**规则文件**纳入装配（比把规则写在单个大文件里更可维护）。

**缺口**：缺"**该读哪个**"的路由层 —— 现在有了"所有东西的清单"，但没有"**当前任务只需要这 3 段**"的判定。

---

## 2. 宪法与门禁的可执行性

### 结论：⚠️ **部分具备**（且本维暴露了最系统性的问题）

**机器可查：**

```
scripts/ 下 check-*/audit-* 脚本：29 个
package.json scripts 总数：188（其中含 "check" 的 46 个）
AGENTS 一级条款：29 条
.agents/rules/*.md：9 个
```

**核心发现（逐条实测）：**

| 检查 | 结果 |
|---|---|
| **29 条 AGENTS 条款，有多少 rule 文件回引？** | **1 条**（仅 `§16`）✗ —— 其余 28 条**没有任何 rule 引用** |
| 其中**真的没有落地机制**的 | §21 / §22（本次审计时**连 rule 文件都不存在**）✗ |
| **条文的机检覆盖率** | 无法自动判定 ✗ —— 因为"哪条对应哪个脚本"**没有登记** |

**本次已修的（提交 `c2ff11fe`）：**

- 为 §21（API 契约第一）与 §22（四类契约族）**补了 rule 文件**，并**回引条款号**；
- 新增 `contracts:governance:check`：§21 查契约路径必须落在该域 `publicPrefixes` 内（**enforce**，1700 处）+ `permissionPrefix` 必须在 `permissions.ts` 登记（**ratchet**，基线 338 条）；§22 查 `runbook.json` 必须有非空 `steps`/`rollback`（14 份）；
- **顺带挖出两处真实鉴权缺陷**：路由模板兜底到**无关权限** `INFRA_ONLINE_DEFINITION_QUERY`（对普通表是越权入口）、`PERM_PREFIX` 归一化漏中划线导致常量永远查不到。

**🎁 强项**：本仓的门禁**真的会失败** —— 本次审计执行者反复验证过（见维度 6）。
且 `standards:check` 的 **enforce / ratchet / report 三模式**设计，比"全 enforce"更可持续。

**❌ 缺口**：
1. **"条款 ↔ 机制"没有登记表** —— 于是"某条铁律是否可执行"只能人工判断（这正是 spec 想消除的）；
2. **有"点检"冒充"覆盖检查"的历史**（规则挂载只查 1 个 → 已修）。

---

## 3. 交付闭环四维（抽样：最近 3 个 feature 型交付）

**抽样池**：最近 20 个提交（截取 3 个"feature/交付"型）。

| 抽样 | 四维检验 | 结论 |
|---|---|---|
| **`f31600e8` 枚举改由源头数据字典驱动** | 需求（源头 SQL 的 `system_dict_data` ✓）· 实现（生成器 + `dictType` 链接 ✓）· 验证（内存生成验三层 ✓ + `dict:catalog:check` ✓）· 交付（43 张表落真值 ✓ 44 份契约 ✓） | ✅ **四维齐** |
| **`cf2a26f6` 改名把产物写坏 + 解析守卫** | 需求（实测 SyntaxError ✓）· 实现（守卫 ✓）· 验证（守卫上线**当场抓到另一处** ✓）· 交付（`check` exit=0 ✓） | ✅ **四维齐**，且"守卫自己抓到自己"是很强的证据 |
| **`1e48d7b8` CI 兜底 plan:freshness** | 需求（`--no-verify` 能绕过 ✓）· 实现（CI 补跑 ✓）· 验证（**发现 `--range` 模式恒不失败** ✓）· 交付（CI 步骤 ✓） | ✅ **四维齐**，且**验证环节推翻了实现**（正是四维该有的样子） |

**⚠️ 但第 3 个样本暴露一个系统性问题**：`plan:freshness` 的 `--range` 模式
**before 取 HEAD、after 取 index，提交后恒等 → 永远不可能失败**。
如果当时只跑"提交时"的钩子路径（能红 ✓），就**永远不会发现这条路径是死的** ✗。
→ **推论**：**每条门禁的每条代码路径都要能被证明会失败**，而不只是"门禁整体能红"。

---

## 4. 五层 × 三元组（脚本 × skill × 硬门禁）

**机器可查（抽样统计）：**

| 层 | 脚本 | skill | 硬门禁 |
|---|---|---|---|
| 开发 | 46 个 `*:check` | `coding` / `new-feature` / `plugin-authoring` | `standards:check`(enforce 13) |
| 测试 | `test:*` 5 个入口 | `automated-testing` / `mutation-tester` | `mutation:gate` / `no-vacuous-test-assertions` |
| 运行 | `smoke:login` / `agent:ops` | `sre-slo-manager` | CI job |
| 交付 | `fingerprint` / `runbook` | `devops` | `delivery:check --strict` |
| 协同 | `.agents/hooks/*` / `setup:hooks` | `agent-harness` | `harness:check` |
| 进化 | `evolution:backlog` | `agent-harness` | （**report-only**，不失败）|

**结论：⚠️ 部分具备。**
- **脚本层最厚**（29 个 check 脚本 ✓，188 个 script ✓）；
- **skill 层齐**（38 个 ✓，且 `.agents/skills/<name>/SKILL.md` 是唯一真源 ✓ 有 `skills:check` 守 ✓）；
- **硬门禁层不均**：
  - ✅ 强：`mutation:gate`（存活即失败 ✓）、`delivery:check --strict`（自报 passed 而证据不支持即失败 ✓）
  - ⚠️ 弱：**进化层是 report-only**（`evolution:backlog` 永不失败）—— 设计上是"暴露欠债不阻断"，合理，但意味着**它无法防止"待办永远不还"**；
  - ❌ 缺：**「三元组是否配齐」没有门禁** —— 某层有脚本没 skill、或有 skill 没门禁，**没人知道**。

---

## 5. 调度自治

### 结论：❌ **缺失（且这正是最该补的一层）**

**机器可查：**

```
scripts/agent-autopilot-daemon.ts     ← 存在，但：
  · 没有对应的 npm script（188 个 script 里搜不到）
  · 没有门禁引用它
  · 没有测试引用它
  · 文档里搜不到它的用法
quick-start-runner.cjs                ← 仅被 quick-start 使用
scripts/ 下共 119 个 cjs/ts 文件
```

**判定**：`agent-autopilot-daemon.ts` 是**孤儿脚本**（❌）——
它存在，但**没有任何入口、门禁或测试提到它**。这正是 spec 第 5 维要查的"运营脚本登记与孤儿情况"。

**🎁 强项**：本仓有**完整的生命周期编排**（`pnpm run all` / `init:all` / `test:all` / `lifecycle.sh`），
且 `agent:ops`（接口体检 + 造数/清数）是真正的"运营动作"，不是文档里的说法。

**❌ 缺口**：
1. **没有"标准全流程"的统一入口** —— 188 个 script 散落，谁是"该走的主干"**没有声明**；
2. **孤儿脚本无门禁**（`agent-autopilot-daemon.ts` 就是一例）。

> **这一维直接对应本次任务方给出的指令**：「所有的标准全流程过程要用 `pnpm harness xxx` 管理与执行」。
> 见 `adopt-plan.md` 的**首要建议**。

---

## 6. 双层测试与假绿

### 结论：🎁 **强项（本项目最强的一维）** —— 但**本次实测到一个真实假绿**

**机器可查：**

```
test:unit         vitest run test/unit packages scripts src
test:integration  vitest run test/integration
test:contract     vitest run packages/shared/contract
test:e2e / test:agent   playwright
test:clean        node scripts/run-tests-clean.cjs（剔除 DATABASE_URL/DB_DRIVER/NODE_ENV）
```

**🎁 强项（真材实料）**：
- **真实库驱动**：`verify:real-db` 用**嵌入式真实 Postgres**（零容器）跑全量；AGENTS §9.4 甚至记录了"内存模式全绿 ≠ 真实库正确"的实测教训；
- **变异测试**：`mutation:gate` 存活即失败（**3/3 killed**）；
- **反假绿的规范**：`no-vacuous-test-assertions`（enforce）+ `vacuity:audit`（**report-only，且明确记载三个启发式 100% 误报** —— 这个"记录误报"的做法本身就是反假绿）。

**❌ 本次实测到的真实假绿（有提交记录）：**

> **480 个测试文件里，有 426 个不被任何具名入口选中** ✗ —— 只靠全量 `pnpm run test` 兜底。
> 也就是说：**跑了 `test:unit` 不等于跑了单元测试**（它只跑 `test/unit/`，54 个文件）。
> 已修（`test:unit` 覆盖 `packages` + `scripts` + `src` → 未覆盖 **0**），
> 并加了**守卫测试**「每个 `*.test.ts` 至少被一个具名入口选中」。提交 `2298c28f`。

**⚠️ 另一处**：`hatch:e2e` 长期**没有覆盖 `project:init`**（只到 `check`/`build`/`smoke:login`），
而实测那里就藏着一个 **SyntaxError**（产物改名把 `scripts/lib/seam-graph.cjs` 写坏）。
**补进 E2E 后，一次跑出 4 个真问题**。提交 `ef69867a`。

**关于"假绿"的方法论沉淀（🎁 可反哺）**：
- 「**反向对照不红时，先怀疑门禁本身**」—— 本次会话中此规律命中 **3 次**（基线键不含取值 / `--range` 恒等 / `$?` 取到了 grep 的退出码）；
- 「**退出码 0 只说明没崩，不说明做了事**」—— 一次元数据插入写成了 `"          enumValues"`（缩进进了引号），生成器 exit=0 但**写入 0 份**。

---

## 7. 部署链

### 结论：⚠️ **部分具备**

**机器可查：**

```
Dockerfile · Dockerfile.domain            ← 双镜像 ✓
deploy/docker-compose.{dev,prod,local,test,domains}.yml   ← 5 套编排 ✓
CI: .github/workflows/ci.yml（gates + onboarding + hatch-e2e jobs）
`--frozen-lockfile` 已切（AGENTS §10.2）
```

**⚠️ 未验证项（诚实标注）**：
- **本次未能验证容器构建与编排**：本机 Docker 是 **colima-on-Linux-VM**，设备端口未转发到 macOS —— 属**环境限制**，不是"验证通过"；
- **`rollback-runbook.json` 与 `runbook -- --run` 未跑**（需目标环境）；
- **`load:test` / `security:scan` 本机可跑**（AGENTS 记录 2026-10-20 全绿：`20/20` + `3/3`），但**本次未复跑**。

**🎁 强项**：`fingerprint` / `fingerprint:verify`（"确认上线的就是测试过的那份"）是**产物级**的交付保证，超出一般项目的做法。

---

## 8. 协同机制（多 agent 门禁协同）

### 结论：🎁 **强项** —— 且本维在本次会话中被显著加固

**机器可查：**

```
.agents/hooks/  spec-gate.sh · parse-payload.js · adapters.json
.commandcode/hooks/ route-contract.sh
adapters.json 登记 6 家适配器
```

**🎁 强项**：
- **唯一守卫脚本**（`spec-gate.sh`）+ **各家薄适配**（不复制判定逻辑）；
- **载荷解析兼容多字段名**（`tool_input.file_path` / `args.path` …）—— 各自实测踩过"只认一种 → 某家静默失效"；
- **四层防线**（L0 脚本 / L1 CLI hook / L2 git hook / L3 CI），并**明确 L2 是唯一跨 CLI 的一层**。

**本次加固（提交 `7e0745f0` / `1e48d7b8` / `b53cd632`）：**
1. **适配器注册表 + 覆盖检查** —— 新增 CLI 目录不登记就红（反向对照实测 exit 1）；
2. **L2 兜底不再有"只挂在 git hook 上"的检查** —— 把 `plan:freshness` 补进 CI，**并修掉它 `--range` 模式的恒不失败 bug**；
3. **孵化产物自动启用 git hook** —— 实测发现 `postinstall` 隐含"`git init` 早于 `install`"，而孵化路径上不成立，
   已改为两处 `git init` 之后**直接启用**（幂等）。

**⚠️ 残留**：L1 **只能拦"写文件"** 这个动作；对只读 rules 的 CLI（如 Cursor 的 `.cursor/rules`）**拦不住**，
只能靠 L2/L3 兜 —— 这是 CLI 能力的边界，不是本仓能修的。

---

## 9. 知识进化

### 结论：⚠️ **部分具备**

**机器可查：**

```
wiki/            architecture · cmmi · domains …（生成物）
openwiki:sync / openwiki:check / llms:check / docs:commands:check / gen:paths:check
evolution:backlog  （report-only）
```

**🎁 强项**：
- wiki 是**生成物**且有 `openwiki:check` 守同步；
- `gen:paths:check` 只查**生成物**的路径引用（实测：全仓查会出 26 处合法误报，收窄到生成物后零误报）—— **这条取舍很成熟**；
- `docs:commands:check` 验"文档声称的命令/脚本真实存在"。

**本次新增（提交 `d31a293a`）**：`docs:claims:check` —— 文档里**写死的数字**与真源逐项对照
（只扫 `docs/01_management` + `docs/02_requirements`，范围窄是零误报的前提）。
**实测动机**：本仓连续多轮栽在写死数字上（「活跃规格 8 份」实际 12、「门禁 13」实际 20）。

**❌ 缺口**：
1. **`evolution:backlog` 是 report-only 且没有"闭环率"指标** —— 待办被修复后应**收紧机检**，现在靠人记得；
2. **没有"知识是否过期"的自动判定** —— 本次审计的起点（校验 `self-portrait.md`）就暴露了：**画像会过期，而没人知道**。

---

## 10. 下游消费契约

### 结论：🎁 **强项**

**机器可查：**

```
compat-manifest.json: templateVersion 1.2.0
  consumptionSurface: gates 21 · mcp 18 · skills 38
  contracts: domainCatalog(17 域) / rpcActions / agentProfile / seamGraph
check-compat-manifest.cjs：强校验（含 skills.count 与 mcp.count 的一致性）
```

**🎁 强项 + 本次实测证据**：
> 本次会话在 `compat-manifest.json` **自身内部**发现一处漂移：
> `mcp.count` 写 **17** 而 `mcp.tools` 已有 **18** —— 而 `compat:check` **是绿的**。
> 根因：该校验**做了 `skills.count` 的一致性检查，但漏了 `mcp.count`**（同一模式漏一处）。
> 已补（补完**当场抓到**，改对后 PASS）。提交 `d31a293a`。

这条的意义：**"强校验"也要按"同一模式全覆盖"来审** —— 只查了一个 `count` 不等于查了所有 `count`。

---

## 11. 十维汇总

| # | 维度 | 结论 | 关键证据 |
|---|---|---|---|
| 1 | 首屏入口 | ⚠️ 部分 | AGENTS.md **91KB ≈14k tokens**；无 8KB 路由层；命中 skill **3 跳**；实测**4/9 规则未注册**（已修） |
| 2 | 宪法与门禁可执行性 | ⚠️ 部分 | **29 条条款仅 1 条有 rule 回引**；§21/§22 原无落地（已补）；**点检冒充满覆盖**（已修） |
| 3 | 交付闭环四维 | ✅ 良好 | 抽样 3 个 feature 四维齐；但暴露"**门禁的每条代码路径都要能被证伪**" |
| 4 | 五层 × 三元组 | ⚠️ 部分 | 脚本 29 / skill 38 齐；**硬门禁分布不均**；**无"三元组配齐"门禁** |
| 5 | 调度自治 | ❌ 缺失 | `agent-autopilot-daemon.ts` **孤儿**；**188 个 script 无主干声明** |
| 6 | 双层测试 | 🎁 强 + 已修 | 真实库/变异测试齐；实测**426/480 测试无人跑**（已修）；`hatch:e2e` **漏覆盖 `project:init`**（已补，一次抓 4 问题） |
| 7 | 部署链 | ⚠️ 部分 | 双镜像 + 5 套编排 ✓；**容器/回滚/压测本次未复跑**（环境限制，明确标注） |
| 8 | 协同机制 | 🎁 强 | 唯一守卫 + 6 家适配 + 四层防线；本次补**注册表覆盖检查**、CI 兜底、孵化自动装钩子 |
| 9 | 知识进化 | ⚠️ 部分 | wiki 有同步门禁 ✓；本次补 `docs:claims:check`；**缺口：闭环率无指标、画像过期无人知** |
| 10 | 下游消费契约 | 🎁 强 | 21 gates / 18 mcp / 38 skills + 强校验；实测**抓到自身 `mcp.count` 漂移**（已修） |

**总判定：⚠️ 部分具备（3 强 / 5 部分 / 1 缺）。**

- **强项集中在**：测试真实性（6）、协同机制（8）、消费契约（10）；
- **最该补的**：**调度自治（5）** —— 而它恰好是任务方点名的那条（`pnpm harness xxx`）；
- **最系统性的隐患**：**"文档宣称"与"机检覆盖"之间的登记缺失**（2、4、9 都指向它）。

---

## 附：抽样即证据（本次审计的独特之处）

本报告与一般审计的最大不同：**报告里的多数缺陷，是审计执行者在本仓实际操作中踩出来的**，
每一条都有**提交记录**可查：

```
f31600e8  枚举改由源头数据字典驱动（43 张表落真值）
cf2a26f6  改名把产物写坏 + 产物脚本必须能解析守卫
ef69867a  project:init 纳入 E2E —— 一次抓出 4 个真问题
2298c28f  426/480 测试文件无人跑 —— 修入口 + 加守卫
c2ff11fe  §21/§22 从散文变成可执行门禁 + 两处真实鉴权缺陷
d31a293a  docs:claims:check + compat 自身 mcp.count 漂移
8527af2c  4 个规则没进 ASSEMBLY（AI 入口看不到）
7e0745f0  CLI 适配器注册表 + 覆盖检查
1e48d7b8  CI 兜底 plan:freshness + 修掉 --range 恒不失败
b53cd632  孵化产物没启用 git 钩子
```

**这些提交本身就是"交付闭环"的样本**：报告可交叉验证，而不是自说自话。
