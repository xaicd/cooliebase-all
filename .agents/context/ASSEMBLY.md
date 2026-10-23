# Prompt Section Assembly

对标 DeepSeek Harness 的 system-prompt 分段：按 `order` 组装，禁止把 `AGENTS.md` 整文件作为每一次请求的系统提示。

DigitalStaff Native / Cursor / 其他 Agent 应按下面顺序加载。`inject` 不满足则跳过该 Skill，而不是忽略约束。

| order | name | path | inject | 何时加载 |
|---|---|---|---|---|
| -100 | identity | `.agents/context/IDENTITY.md` | 无 | 每次进入本仓库 |
| -60 | rule-0-universal-directives | `.agents/rules/RULE-0-UNIVERSAL-DIRECTIVES.md` | 无 | 每次进入本仓库（最高优先级 Rule 0 通用底线） |
| -50 | high-order-inverse-thinking | `.agents/rules/HIGH-ORDER-INVERSE-THINKING.md` | 无 | 每次进入本仓库（高阶反向思维：敲代码/写单测/改接口全程监督） |
| -45 | spec-first-artifacts | `.agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md` | 无 | 每次进入本仓库（0-1工程交付资产与No Artifact No Done硬规矩） |
| -43 | project-init-and-refactor | `.agents/rules/PROJECT-INIT-AND-REFACTOR.md` | 无 | 涉及项目重塑与底座初始化时 |
| -42 | multi-tenant-isolation | `.agents/rules/MULTI-TENANT-ISOLATION.md` | 无 | 涉及仓储层、数据访问与租户隔离时 |
| -41 | api-contract-first | `.agents/rules/API-CONTRACT-FIRST.md` | 无 | 涉及接口/契约/路由/权限码时（§21：契约必须可执行，路径与权限码都得真实） |
| -39 | all-role-contract-families | `.agents/rules/ALL-ROLE-CONTRACT-FAMILIES.md` | 无 | 涉及数据同步/BI/运营编排/运维发布时（§22：四类契约族各自的质量门禁） |
| -37 | feature-spec-and-prototype | `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md` | 无 | 开规格、写原型、切图归档时 |
| -36 | project-reactor | `.agents/rules/PROJECT-REACTOR.md` | 无 | 孵化新工程（project:create / degit / hatch）或调整派生工程 profile 时 |
| -40 | high-order-prompts | `docs/architecture/universal-high-order-inverse-prompts.md` | 无 | 每次进入本仓库（高阶反向通用提示词库：实体溯源/多租户防线/两字交互/因果归因/插件反向传播） |
| 0 | soul | `.agents/context/SOUL.md` | 无 | 每次进入本仓库 |
| 40 | ontology-navigation | `docs/architecture/cooliebase-all-ontology-navigation.md` | 无 | 每次进入本仓库（导航总纲：定位模块/工具/预览/skills + 新应用派生 + 基座自进化） |
| 50 | agent-profile | `packages/shared/contract/agent-profile.json` | 无 | 孵化、NPC、架构演进 |
| 55 | seam-graph | `packages/shared/contract/seam-graph.json` | 无 | 发现域能力三角色（由 catalog 生成） |
| 60 | domain-catalog | `packages/shared/backend/constants/domain-catalog.json` | 无 | 涉及域边界时 |
| 100 | skill | `.agents/skills/<name>/SKILL.md` | 见各 Skill description | 任务匹配时 `loadSkill` |
| 120 | legacy-migration | `docs/architecture/legacy-migration-playbook.md` + `packages/shared/contract/ontology-mapping.schema.json` | 老系统迁移/服务盘点任务时 | 迁移 100+ 微服务、按本体域数字化映射时 |
| 150 | project-identity | `packages/shared/contract/project-profile.json` | 无 | 改品牌、租户显示名、登录文案 |
| 200 | gates | `AGENTS.md` 对应章节 | 无 | 引用章节，不整篇复制 |

## 任务路由（D2：**该读哪几段**，而不只是"有哪些段"）

> 上表是**清单**（有什么）；本表是**路由**（当前任务读什么）。
> 审计维度 1 的结论：缺的不是"文件太大"，而是**没有路由** ——
> 新 agent 要么读全 `AGENTS.md`（91KB ≈ 14k tokens），要么自己判断该看哪几段。
> **本表不新增任何真源**：只引用上面已注册的 `order`，条文仍在原处（§25 单一真源）。

| 当前任务 | 读这几段（按 order 升序） | 跳过的 |
|---|---|---|
| **首次进场 / 陌生代码库** | -100 identity · -60 Rule 0 · 0 soul · 40 本体导航 | 具体规则的细节 |
| **写业务代码（新增/改功能）** | -60 · -50 高阶反思维 · -45 spec-first · -43 project-init · -42 多租户 · -41 api-contract-first · -39 四类契约族 · 40 本体导航 | 60 domain-catalog（非跨域时） |
| **写/改接口** | -41 api-contract-first · 55 seam-graph · 60 domain-catalog · 100 对应 skill | 前端/客户端相关段 |
| **写测试** | -50 高阶反思维（含"禁止空转断言"）· 100 `automated-testing` | 契约族（除非是契约测试） |
| **孵化新工程** | -36 project-reactor · -43 project-init · 50 agent-profile | 业务规则细节 |
| **交付 / 发布** | -50 · -45 §24 · 100 `devops` · `pnpm harness deliver` 的输出 | 设计类段 |
| **只问一个问题（不写代码）** | -100 identity · -60 Rule 0 | 其余全部 |

**硬约束（可机检）**：

1. 本表引用的每个 `order` 必须**真实存在于上表**（引用不存在的段 → `harness:integrity:check` 失败）；
2. **不允许**在这里复制条文内容 —— 只允许引用 `order` + 一句话说明"为什么读它"（否则成为第二真源）；
3. 路由只是**建议的读取顺序**，不是**权限**：任何段都可以随时读，路由解决的是"先读什么"。


组装规则：

1. 同名 section 不可重复注册。
2. 动态段（Skill）按当前任务启用，不要一次塞入全部 Skill。
3. 模型可见内容必须能从上述文件重建（Model-visible means logged）。
4. 与 `AGENTS.md` 冲突时，以 `AGENTS.md` + catalog 为准，改 Skill / 分段，不改运行时契约迁就提示词。
