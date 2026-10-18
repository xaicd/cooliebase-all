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

组装规则：

1. 同名 section 不可重复注册。
2. 动态段（Skill）按当前任务启用，不要一次塞入全部 Skill。
3. 模型可见内容必须能从上述文件重建（Model-visible means logged）。
4. 与 `AGENTS.md` 冲突时，以 `AGENTS.md` + catalog 为准，改 Skill / 分段，不改运行时契约迁就提示词。
