# DeepSeek Harness 研究：可吸收 / 不可吸收 / 已吸收

> **性质**：只读研究。**不改本仓任何代码**。所有引文来自
> `deepseek-ai/deepseek-harness` 的 `docs/architecture.md` 与 `AGENTS.md`（2026-10 抓取）。
> **边界前提**：本仓 `agent-profile.json` 的 `doNotVendor` 是
> `["cordis", "dsh-agent-loop", "self-modification"]` —— **本文不改这个前提**。
> 目的恰恰是给这条边界提供**逐条的依据**，避免下一个人"看起来该学"就搬进来。

---

## 0. 结论先行

**dsh 是运行时，本仓是模板。** 它 90% 的设计（Agent Loop / Session Log / Cordis / 事件瀑布 / 快照回放）
都建立在"**进程里有一个跑着的 agent**"之上 —— 而本仓**没有**这个进程（`runtime` 在 DigitalStaff）。

所以：

| 类别 | 数量 | 说明 |
|---|---|---|
| **已吸收（思想层面）** | 5 | 本仓已有对应落地，且**有门禁** |
| **可吸收（工程做法）** | 6 | 与运行时无关，是**编码/门禁**层面的做法 |
| **不可吸收（运行时）** | 7 | 搬进来会直接违反 `doNotVendor` 或 `kind=workspace-bundle` |

---

## 1. 已吸收的 5 条（有本仓落地 + 门禁）

| dsh 的表述 | 本仓的落地 | 门禁 |
|---|---|---|
| **Everything is a Plugin** | 15 个第一方插件 + `plugin.manifest.json` + `layers.plugin` | `domain:check` / `plugin` 相关门禁 |
| **Capability Seam** | `packages/shared/contract/seam-graph.json` + 11 项 foundation 能力 | `domain:seams` / `foundation:ontology:check` |
| **Profile / Bundle / Patch** | `project-profile.json` · `hatch --profile --bundle` · `patches` | `project:create` / `hatch:e2e` |
| **Prompt section assembly** | `.agents/context/ASSEMBLY.md`（按 `order` 组装，禁止整篇灌） | `harness:integrity:check`（覆盖检查） |
| **Every run is traceable** | `harness-trace-latest.json` · `agent:route` 记录 · `delivery:check` 证据链 | `delivery:check --strict` |

**这 5 条不是"打算学"，是已经在跑、且能失败。** 引用自 `agent-profile.json` 的
`referencePhilosophy: "Everything is a Plugin. Every run is traceable."` —— 两条都落地了。

---

## 2. 可吸收的 6 条（与运行时无关）

> 判断标准：**它不要求本仓跑 agent**，只要求"代码/门禁怎么写"。

### 2.1 「空 catch 必须写明这个错误是什么，以及为什么忽略」★★★★

dsh 原话：**"An empty `catch` names the error and why; keep its `try` to one statement."**

**本仓现状**：`standards:check` 有 `backend-no-console`，但**没有**针对空 `catch` 的规则。
第 23 条铁律要求"严禁空 catch 吞异常"，**但只有散文，没有机检** —— 正是本仓反复栽的那类。
`} catch {}` 可被一条 enforce 规则拦住。**成本极小，收益直接。**

### 2.2 「封闭联合类型必须 `assertNever`」★★★

dsh 原话：**"Switch on discriminant tags. Closed unions end in `assertNever`。"**

**本仓现状**：有大量 `switch (status)` 风格的代码（状态机、字典枚举），
**漏一个分支就静默落到 default**。`assertNever` 让"改枚举忘改 switch"变成**编译错误**。
配合本仓刚做的「枚举来自数据字典」，这条正好补上闭环。

### 2.3 「跨边界的不透明 id 用 branded 类型」★★

dsh 原话：**"Opaque cross-boundary ids are branded (`Branded<B>`), never bare `string`."**

**本仓现状**：`tenantId` / `userId` / `orderId` / `roleId` 全是 `string` ——
**把 userId 传给 orderId 的参数，编译器毫无意见**。本仓刚被"权限码三套命名"咬过一口，
这是同一类问题的更根本版本。**成本中等**（需要引入 branded 类型并逐步改签名）。

### 2.4 「不加戏：在 typed 同进程边界上信任 TypeScript」★★

dsh 原话：**"Do not add runtime validation, fallback behavior, or hostile-input tests
solely for values the static interface requires; validate at parser/config, queued,
model/tool JSON, durable/file, worker, process, and wire boundaries."**

**本仓现状**：既有"宁严勿宽"的好习惯，也有**过度防御**的地方
（对内部函数入参做重复校验）。这条给出**明确的边界清单**，
可以据此写一条 code review 准则，而不是又加一层校验。

### 2.5 「跨文件重复检测」★★★

dsh 有 `pnpm run duplication`（cross-file TypeScript clone detection）。

**本仓现状**：**没有**。而本轮就**实证了它的价值** ——
我在 `speckit` 生成器里发现 **3 对字节级完全相同的文件**（38K → 29K），
那是**人眼没看出来、机器一眼看出**的重复。
（注意：这条是**报告式**，不是门禁 —— 重复有时是合理的。）

### 2.6 「每文件 100% 覆盖率作为 CI 门禁」★（谨慎）

dsh 的 `test:coverage` 是 **per-file 100% on `packages/*/*/src`**。

**本仓现状**：**没有覆盖率门禁**；而且本轮实测类型债 **1268 → 192** 说明
存量质量参差。**直接照搬会红一片**。建议：先做**覆盖率报告**（report-only），
看清分布再决定要不要棘轮。**这是"可吸收但需要分阶段"的典型**。

---

## 3. 不可吸收的 7 条（搬进来会违规）

| dsh 的机制 | 为什么不能搬 |
|---|---|
| **Cordis**（everything-is-a-plugin 的**运行时**） | `doNotVendor` **第一项**。本仓的"插件"是**构建期域包**，不是运行时可热插拔的服务容器 |
| **Agent Loop**（`core/agent-loop`） | `doNotVendor` 第二项 + `kind=workspace-bundle`。Agent loop 在 DigitalStaff |
| **Session Log**（append-only `SessionEvent` / "Model-visible ⟺ logged"） | 本仓**没有运行时**，也就没有 session。硬搬等于自建运行时 |
| **事件瀑布**（`waterfall` 必须 `next()`） | 依赖 Cordis 的事件模型 |
| **`ctx.*` 服务注册 / `scope` / `effect` 可逆注册** | 同上 |
| **`extensions/`（runtime self-modification）** | `doNotVendor` 第三项 |
| **`test:snapshot`（录制会话回放）** | 需要真实 agent 会话；本仓无会话可录 |

> **判断口诀**：**需要"进程里有个 agent 在跑"的，一律不搬**；
> 只需要"代码怎么写 / 门禁怎么卡"的，可以学。

---

## 4. 建议的优先级（按 ROI）

| # | 做什么 | 成本 | 收益 | 形态 |
|---|---|---|---|---|
| 1 | **空 catch 必须具名** | 极小 | 高（第 23 条铁律目前无机检） | enforce 规则 |
| 2 | **跨文件重复检测** | 小 | 高（本轮已实证） | report-only |
| 3 | **`assertNever` 强制** | 小 | 中高（配合字典枚举） | 规则 + 少量改造 |
| 4 | **覆盖率报告**（先不做门禁） | 小 | 中（先看分布） | report-only |
| 5 | **branded id** | 中 | 高（但影响面大） | 需独立 spec |
| 6 | **"不加戏"的边界清单** | 极小 | 中（写进 review 准则） | 文档 |

---

## 5. 这次研究**没有**回答的问题（诚实标注）

- **它的插件生态里有没有"非运行时插件"** —— 我只读了架构与 AGENTS，**没逐个子包读**。
  如果要确认"`dsh-plugin` 里有没有能直接用的"，需要逐个看 `packages/*/*/README.md`。
- **它的 `benchmarks/` 具体测什么** —— 未读。
- **它的 `python/` 桥是否能被本仓用作客户端** —— 未评估（但那是**消费 dsh**，不是**嵌入本仓**，
  方向上不违反 `doNotVendor`，值得单独立项）。

---

## 6. 一句话

**dsh 最值得本仓学的不是"插件化"（已经学了），而是"把纪律写成能失败的机检"** ——
`assertNever`、空 catch 具名、重复检测，都是**用编译期/门禁把人的自觉替换掉**。
这恰好是本仓这一整轮反复印证的主题：**规范必须可执行，否则必然漂移**。
