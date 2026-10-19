# cooliebase-all Harness 演进规范

更新时间：2026-08-25

本仓库学习 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的设计决策，把底座做成 **Agent 可读、可组合、可追溯** 的业务工程模板。权威机器契约：`packages/shared/contract/agent-profile.json`。

## 1. 三层定位（禁止混角色）

DeepSeek 的公式是 `Agent = Model + Harness`。落到本体系是三层，而不是把 Cordis 塞进 Next.js：

| 层 | 谁 | 职责 | 不是什么 |
|---|---|---|---|
| **Model** | LLM | 推理与决策 | 不持有业务契约 |
| **Harness / Runtime** | DigitalStaff NativeCodingEngine | Agent Loop、工具管道、Session 事件流、子 Agent、审批 | 不持有 CoolieBase 域模型 |
| **Workspace Bundle** | **本仓库 cooliebase-all** | 域插件、契约缝、Skill、门禁、ProjectReactor 孵化 | 不是 Agent 运行时 |

DigitalStaff 已有独立分析：`D:\workspace\cw\ai\DigitalStaff\docs\design\deepseek_harness_analysis.md`。本文件只规定 **基座侧** 吸收什么、拒绝什么。

NPC 员工开发独立项目时：

```
NPC = Model + DigitalStaff Native Harness + cooliebase-all Workspace Bundle
孵化入口：npm run project:create -- <目标路径>
```

## 2. 从 dsh 吸收的 7 条决策（学思想，不搬框架）

dsh 口号是 **Everything is a Plugin / Every run is traceable**。对应到本仓库已有边界：

| dsh 决策 | 本仓库落点 | 后期进化方向 |
|---|---|---|
| Everything is a Plugin | `packages/domains/<domain>/` + Domain Facade；无特权核心可打补丁 | 域按 Bundle 组合，而不是永远整仓克隆 |
| Capability Seam（定义 / 提供者 / 消费者） | Contract Facade + Service + Route；跨域只走 Facade | `agent-profile.json` 暴露 seam 图，NPC 先发现再调用 |
| Profile + Bundle + Patch | `project-profile.json` + `domain-catalog.json` + ProjectReactor | `project:create --profile/--bundle` 按需叠域 |
| Prompt Section Assembly | `.agents/context/*` + Skill 注册表 + AGENTS.md | DigitalStaff 按 order 组装，禁止把 AGENTS.md 当唯一大字符串 |
| Scoped tools | 权限码 + 租户上下文 + Admin/CPC/Open 三面 | NPC 角色只加载对应 Skill / 域白名单 |
| Skills as plugins | `.agents/skills`（唯一真源） | Skill 声明 `inject` 依赖，未满足不启用 |

## 3. 明确不引入

与 DigitalStaff 分析一致，基座侧同样禁止：

1. **Cordis 运行时** — 与 Next.js App Router、Kysely、Domain Facade 双模冲突。
2. **把 Agent Loop 写进本仓库** — Loop 属于 DigitalStaff Native；本仓库只提供环境与契约。
3. **运行时自挂载 / self-modification** — 企业模板不允许 Agent 热改自己的内核。
4. **用 SQLite 会话日志替代业务库** — 业务数据仍走 PostgreSQL + 多租户；会话事件归 Harness。
5. **绕过 `npm run check` 的“智能进化”** — 插件可组合不等于门禁可跳过。

## 4. Profile / Bundle 叠层（对标 dsh boot）

dsh 启动顺序：`bundle 列表 → profile patch → home patch → --patch`。本仓库对应：

```
dsh-base          →  shared SDK（永不独立部署）
dsh-web-app       →  system + infra + Admin/CPC 页面
业务 bundle        →  catalog 中的业务域（mall/crm/erp/... 按项目勾选）
client bundle     →  clients/<channel>
cordis.patch.yml  →  project-profile.json（品牌/租户身份，不改契约）
```

当前 `npm run project:create` 支持 Profile / Bundle 叠层：

```bash
npm run project:create -- <路径> --profile minimal
npm run project:create -- <路径> --profile vertical --bundle mall,crm
```

| Profile | 包含 | 适用 |
|---|---|---|
| `minimal` | shared + system + infra + 伴生域 `online/ai/aigw` | 空业务、只改身份 |
| `standard` | catalog 全部原生业务域 + 客户端 | 全能力演示 / 数字工厂默认模板 |
| `vertical` | minimal + `--bundle` 白名单 | NPC 按本体域孵化 |
| `creator` | 等同 standard | 低代码与代码生成并存 |

`online/ai/aigw` 是 **平台伴生域**：system 菜单目录与 infra codegen 通过 Facade 依赖它们，P1 不能从 minimal 裁掉。Prisma 迁移仍部署全量基座表；裁剪的是代码目录与 catalog 发现面。产物：`packages/shared/contract/hatch-manifest.json`。

身份补丁只允许改 `project-profile.json` 与 `public/branding/`，禁止改权限语义、RPC subject、租户隔离规则。

## 5. Capability Seam（NPC 发现面）

dsh：一个能力必须同时有 Service Definition、Provider、Consumer。本仓库已具备，但要对 NPC **显式**：

```
定义     contract/{entity}.actions.ts + {domain}.facade.ts
提供者   backend/services + repositories（本域）
消费者   app/api Route、前端 api/*.api.ts、其他域 Facade
```

新增能力时 NPC / Agent 必须补齐三角色，禁止只加 Service 或只加页面。跨域消费者禁止 import 其他域 Service。

机器可读入口：`agent-profile.json` 的 `seams[]`（缝类型）与生成文件 `seam-graph.json`（每域三角色）。运行时真源仍是 `domain-catalog.json`，profile 不得另造一套域名。`npm run domain:seams` 生成图，`npm run domain:check` 校验不得漂移。

## 6. Prompt 分段组装（给 DigitalStaff Native）

禁止把 `AGENTS.md` 整文件灌进每一次模型请求。按 `.agents/context/ASSEMBLY.md` 的 order 组装：

| order | 分段 | 文件 |
|---|---|---|
| -100 | 身份 | `.agents/context/IDENTITY.md` |
| 0 | 行为约束 | `.agents/context/SOUL.md` |
| 50 | 域与缝 | `domain-catalog.json` + `agent-profile.json` + `seam-graph.json` |
| 100 | 当前任务 Skill | `.agents/skills/<name>/SKILL.md`（按需 `loadSkill`） |
| 150 | 项目身份 | `packages/shared/contract/project-profile.json` |
| 200 | 门禁与禁止项 | AGENTS.md 对应章节的短引用，不整篇复制 |

模型可见的输入必须能从仓库文件重建（对标 dsh：Model-visible means logged）。

## 7. NPC 员工标准作业路径

1. **发现**：读取 `agent-profile.json`，确认本仓库是 Workspace Bundle。
2. **孵化**：`npm run project:create -- <目标路径> [--profile ...] [--bundle ...]`，保留目标目录已有规格文档。
3. **身份**：只改 `project-profile.json` 与 branding，然后 `npm run db:seed`。
4. **开发**：只在 Business Zone 增域/增表；跨域走 Facade；启用对应 Skill 管道。
5. **门禁**：`npm run check`；发布前 strict。
6. **反哺**：通用能力按五要素清单迁回本基座（AGENTS.md §17.2）。

NPC 角色与 Skill 映射（DigitalStaff L0–L8 对基座 Skill；真源在本仓 `npc.layers`，DigitalStaff 只读取）：

| NPC 层 | 角色 | 必开 Skill |
|---|---|---|
| L0 | 代码维护 | coding、automated-testing、agent-harness |
| L1 | 服务治理 | service-governance、microservice-evolution |
| L2 | API 契约 | api-design、architecture-design |
| L3 | 可观测 | devops、security |
| L4 | 部署 | devops |
| L5 | 文档 | product-requirements |
| L6 | 数据库 | database-design、database-compatibility |
| L7 | UI | ui-design、ui-framework-governance |
| L8 | 测试 | automated-testing |
| 业务开发 | 全链路 | product-requirements → new-feature |

机器真源：`agent-profile.json` 的 `npc.layers`。DigitalStaff 只读此表，禁止把 Crush 技能名写进 cooliebase 工作区。

## 8. 后期进化批次（证据驱动，未落地不得标 DONE）

| 批次 | 目标 | 验收 |
|---|---|---|
| **P0** | 契约 + 分段 + Skill + 文档 | 已落地 |
| **P1** | `project:create --profile/--bundle` | 已落地：可孵出 minimal（保留 online/ai/aigw 伴生域） |
| **P2** | 由 catalog + contract 生成 seam 图 | 已落地：`npm run domain:seams`，`domain:check` 禁止漂移 |
| **P3** | Agent 动作轨迹与 sprint-prod / check 产物对齐 | 已落地（本仓）：`npm run check` 写 `harness-trace-latest.json`；会话事件仍归 DigitalStaff |
| **P4** | DigitalStaff Native 读取本仓库 `agent-profile.json` 作为 workspace plugin | A1–A4 已在 DigitalStaff 落地；A5 技能映射真源在 `npc.layers` |

## 9. 检查清单

1. [ ] 用户原始输入已写入 `docs/features/sprint-prod/{MMDD}.md`。
2. [ ] 未把 Cordis / Agent Loop 引入 `src/`。
3. [ ] 新域仍登记 `domain-catalog.json`，并出现在 seam 发现面。
4. [ ] 新 Skill 已注册（`.agents/skills/README.md` + AGENTS.md §6.1）。
5. [ ] 业务项目身份只改 `project-profile.json`，不改契约真源。
6. [ ] 孵化/反哺后执行 `npm run check`。

## 10. 权威文件

- 机器契约：`packages/shared/contract/agent-profile.json`
- 提示分段：`.agents/context/`
- Skill：`.agents/skills/agent-harness/SKILL.md`
- 孵化：AGENTS.md §16、`scripts/clone-project-base.cjs`
- 域真源：`packages/shared/backend/constants/domain-catalog.json`
- 参考实现（Harness 侧，勿复制进本仓）：DigitalStaff `docs/design/deepseek_harness_analysis.md`

## 11. Agent 消费面（MCP）：只读 + plan/preview，永不落盘

本仓对外的机器可读工具面是 `scripts/mcp/cooliebase-mcp-server.cjs`（stdio，零依赖），
声明登记在 `packages/shared/contract/compat-manifest.json` 的 `consumptionSurface.mcp`，
由 `npm run compat:check` 与服务**实际注册的工具清单**交叉校验（防第二真源）。

工具只有两种形态，**都不写盘**：

| 形态 | 语义 | 例子 |
|---|---|---|
| 只读查询 | 返回既有契约/目录事实 | `cooliebase_domain_list`、`cooliebase_codegen_targets` |
| plan / preview | 返回"真跑**会**做什么"，把写盘留给显式命令 | `cooliebase_scaffold_plan`、`cooliebase_codegen_preview`、`cooliebase_table_migration_plan` |

铁律（B1 二期确立，见 `docs/specs/infra/mcp-write-tools/write-tool-contract.md`）：

1. **零落盘**：plan/preview 工具的 `inputSchema` 不含 `write` 类入参，实现内部**永不**透传
   `--write`。不给入口，而不是靠调用方自觉。
2. **不自判通过**：工具只返回 `followUpGates`（该跑哪条门禁），绝不代跑、绝不自称通过
   （守 §3 明确不引入第 5 条）。
3. **不猜路径**：拿不到完整清单时返回空数组并说明原因，不允许为了"看起来有用"而推断路径 ——
   插件域上猜错路径是**静默失效**，不是报错。
4. **落盘命令写在 `manualSteps` 里**，由人执行；MCP 不承担提交与推送。

回归保护：`scripts/mcp/__tests__/cooliebase-mcp-server.test.ts` 的「★ 零落盘」用例用工作区快照
delta 断言"调用全部工具后无变化"。该用例**必须保持为本 describe 的第一个 it**，且快照需带
`--ignored=matching` —— 否则断言会假通过（实测：注入写文件探针后依然全绿）。

> 去品牌改名（2026-10-19 已完成）：本仓 active 文件曾大面积沿用上游文件名前缀，而
> `AGENTS.md §13` 按去品牌名书写，故引用是**断的**。修法统一为**改文件名去迁就文档**，
> 不是反过来把文档改回上游名。已处理：`ruoyi-all-next-*`（12 份 → `cooliebase-all-*`）、
> `ruoyi-full-migration-board.md`、`ruoyi-module-first-migration.md`、
> `docs/03_design/diagrams/ruoyi-architecture.arch.*`、`sql/init/ruoyi_all_next_*.sql`、
> `scripts/mcp/__tests__/ruoyi-mcp-server.test.ts`。
> 归档目录 `docs/architecture/archive/upstream-2026-Q3/` 与历史 release notes 属上游研究存档，
> **保留原名不改**（两者被引用时按归档路径引用并标注「已归档」）。
>
> 顺带修好一个**静默失效**：`sql/init/` 那份 SQL 长期叫上游名，而生成器
> （`build-v1-init-sql.ts`）与门禁规则（`standards:check` 的 `init-sql-seed-columns`）都已按去品牌名
> 读写 —— 规则里 `if (!fs.existsSync(sqlFile)) return []` 于是一直**空转**，门禁却是绿的。
> 改名后该规则恢复生效（已用注入坏 INSERT 的反向对照验证会真的失败）。
