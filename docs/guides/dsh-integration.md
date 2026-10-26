# 与 DeepSeek Harness (dsh) 的深度融合：接在哪一层

> **一句话**：**在契约层融合，不在运行时层融合。**
> dsh 是**交付环节的 agent**；本仓是**交付给客户的工程模板**。
> 两者通过 **MCP / skills / AGENTS.md** 三个**标准契约**对接 —— 这三个面本仓**已经有了**，
> 所以融合**不会废掉任何既有努力**，反而让它们对 dsh 可用。
>
> 逐条论证见 `docs/architecture/dsh-research-2026-10.md`；边界条文见 `AGENTS.md §18.1`。

---

## 1. 两个方向上的东西（先分清，避免白干）

| 方向 | 是什么 | 状态 |
|---|---|---|
| **dsh → 本仓**（dsh 消费我们的能力） | dsh 通过 MCP 调我们的工具、读我们的 skills 与 AGENTS 规则 | **本仓已具备，待接线验证** |
| **本仓 → dsh**（把 dsh 当规范来源） | 学它的做法（空 catch 具名 / 断言穷尽 / 品牌化 id / 重复检测） | 已在做（`AGENTS §18.1`） |
| **把 dsh 嵌进产物** ❌ | 把 Cordis / agent-loop 放进客户要部署的包 | **禁止**（`doNotVendor`，门禁会红） |

---

## 2. 三个对接面（本仓已有的资产，不需要新写）

### 2.1 MCP（最强的一条）

```
实现:     scripts/mcp/cooliebase-mcp-server.cjs   （stdio server）
声明:     packages/tools/mcp-server/package.json  （bin: cooliebase-mcp-server）
工具数:   18   （compat-manifest 的 consumptionSurface.mcp.tools）
协议版本: 2025-06-18 / 2024-11-05
```

**dsh 侧要做的**：把本仓的 MCP server 加进它的 MCP 配置，stdio 方式启动即可。
**具体配置语法请以 dsh 自己的文档为准**（`deepseek-harness/docs/` 与 `packages/mcp/`）——
**本文不臆造它的配置格式**（写错的配置比没有更糟）。

**工具面为什么有吸引力**：这 18 个工具不是"聊天"，而是**本仓的真实能力** ——
契约生成、门禁查询、孵化、运营探活。dsh 接上之后，它调的是**真东西**，不是 demo。

### 2.2 Skills

```
位置:     .agents/skills/<name>/SKILL.md   （38 个，唯一真源，skills:check 守着）
格式:     YAML frontmatter（name / description）+ markdown 正文
```

这个格式与 `agent-skills` 生态的约定一致（dsh 的 skill 加载器认 markdown + frontmatter）。
**要验证的**：dsh 的 skill 目录发现规则（目录名 vs frontmatter 的 `name` 谁优先）——
**未验证**，不要假设。

### 2.3 AGENTS.md

dsh **自己就在用 `AGENTS.md`** 作为 agent 指令文件（它仓库根也有一份）。
本仓的 `AGENTS.md` 是**工程铁律**（29 条编号条款 + 每条都登记了机检机制）。

**注意**：本仓**禁止把 AGENTS.md 整篇灌进每次请求**（`ASSEMBLY.md` 的分段装配就是为此）。
接 dsh 时同样要遵守这条 —— 用分段，不要整篇。

---

## 3. "之前努力别废掉"是什么意思（逐项对照）

| 既有努力 | 融合后 |
|---|---|
| 17 个业务域 / 15 个插件 | **不变** —— dsh 通过 MCP 调它们的**能力**，不碰它们的代码 |
| codegen / 表元数据 / 342 份契约 | **不变**，且成为 dsh 可调用的工具（"按元数据生成全栈"） |
| 22 道门禁 / 20 条规范规则 | **不变** —— dsh 调 `check` 类工具时跑的就是这些 |
| 38 个 skills | **不变**，且 dsh 可直接加载 |
| `pnpm harness`（8 条主干） | **不变**，且可包装成 MCP 工具给 dsh 用 |
| 交付产物（Next + Postgres） | **不变** —— 产物里没有任何 agent 依赖（`delivery:boundary:check` 守着） |

**没有任何一项需要推倒重来。** 融合发生在**接口层**，不在实现层。

---

## 4. 待验证清单（诚实标注）

以下**我没有条件验证**（本机没有装 dsh，也没有它的完整文档），必须由实际接入时确认：

1. dsh 的 **MCP server 配置语法**（stdio 命令 + 参数怎么写）；
2. dsh 的 **skill 发现规则**（目录名优先还是 frontmatter `name` 优先；是否要求特定子目录）；
3. dsh 加载 `AGENTS.md` 时**是否也支持分段**（还是只能整篇）；
4. 我们的 **18 个工具的返回结构**是否满足 dsh 对 tool result 的期望
   （`compat-manifest` 声明的协议是 `2025-06-18`，需确认 dsh 支持该版本）。

**验证方式**：装 `npx @deepseek-ai/dsh web` 起本地实例，按它的 UI 加一个 MCP server 指向
`node scripts/mcp/cooliebase-mcp-server.cjs`，看工具列表是否出现 18 个。
**在这一步完成之前，本文不声称"已接通"。**

---

## 5. 一句话总结

**dsh 深融 = 让它的 agent 用上我们的 18 个工具 / 38 个技能 / 29 条铁律**，
而**我们的业务代码、契约、门禁一个字都不改**。
这比"把它的 runtime 搬进来"**得到得多、失去得少** —— 后者会带来两套运行时、
两套升级节奏，以及一个立刻变红的门禁。
