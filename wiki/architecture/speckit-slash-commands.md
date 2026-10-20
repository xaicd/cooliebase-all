# 架构百科：GitHub Spec-Kit 企业级扩展与 10 大斜杠指令矩阵 (/speckit.*)

> 对应规则：AGENTS.md Rule 0.9 & Rule 0.10 / .agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md / .specify/

## 一、 为什么基于 GitHub Spec-Kit 进行全量升级与扩展？
Spec-Driven Development (SDD) 已由 GitHub Spec-Kit 与腾讯 CodeBuddy 发展为业界通用的 AI 编程工程规范。
本项目已**全量升级并拥抱 GitHub Spec-Kit 开源标准**，将原有的私有 `spec-ops` 全面收敛升级为 **Enterprise Spec-Kit**：
1. **拓扑标准遵从**：建立 `.specify/memory/constitution.md` 作为项目唯一最高宪法，包含 Rule 0、13 项通用铁律与 6 阶苏格拉底反思；
2. **顶层路径透传**：`specs/ -> docs/specs/` 顶层软链接，与所有原生 Spec-Kit 自动化工具 100% 互通；
3. **原生跨平台驱动**：通过 `pnpm run speckit` / `pnpm run specify` 提供零额外环境依赖的 TypeScript 原生引擎，告别 Python/uv 工具链负担；
4. **唯一真源指令化**：`.agents/commands/speckit.*` 作为唯一物理实体真源，直接面向各类智能体与开发者交付。

## 二、 10 大 /speckit.* 核心斜杠指令矩阵
| 斜杠指令 | 底层执行引擎 | 功能分类 | 核心产物 / 验收标准 |
|---|---|---|---|
| `/speckit.eval` | `dar-decision-matrix` | **[Idea Assessment]** 概念评估 | 需求立项前进行可行性、必要性与 DAR 投资回报率论证 |
| `/speckit.constitution` | `pnpm run socratic:inquire` | **[Constitution]** 核心宪法 | 审查底座宪法并执行 6 阶苏格拉底高阶反问与辩证 |
| `/speckit.specify` | `pnpm run speckit:new` | **[Specification]** 规格立项 | 交互式立项，生成 `brief.json`、`assets/` 与 `prototypes/` 骨架 |
| `/speckit.plan` | `pnpm run speckit:build` | **[Architecture]** 架构展开 | 极简 DSL 自动编译展开 8 份标准工程文档与时序图 |
| `/speckit.tasks` | `scripts/speckit.ts tasks` | **[Task Breakdown]** 任务拆解 | 提取波次任务树，严格贯彻 1 Task = 1 Commit |
| `/speckit.implement` | `pnpm run task:verify` | **[Implementation]** 实施落地 | 真实入库编码，核对 Git 提交白名单，杜绝口头完工 |
| `/speckit.checklist` | `pnpm run speckit:check` | **[Quality Checklist]** 验收清单 | 逐项核验验收标准与 11 阶段交付合规性 |
| `/speckit.gate` | `scripts/speckit.ts gate` | **[SpaceX Gate]** 物理门禁 | CMMI Gate 1~6 物理门禁扫描，100% 真实数据库测试驱动 |
| `/speckit.ops` | `pnpm run agent:ops` | **[Agent Operations]** 无头运营 | 326 份机器契约接口自动化体检、仿真造数与敏感清数 |
| `/speckit.archive` | `pnpm run speckit:archive` | **[Lifecycle Archive]** 归档防污 | 移入 `docs/specs/archive/<YYYY-Qx>/<domain>/<name>/`，保持施工区整洁 |

## 三、 全面收敛统一 (Full Unification)
历史定制过渡层已全部退役清除，所有流程 100% 统一为 Spec-Kit 原生规范：
- 规格立项与编译：统一使用 `pnpm run speckit:new` / `speckit:build`；
- 工作流配方 (Workflows)：`.agents/workflows/` 全部收敛为 Spec-Kit 标准步骤；
- CMMI 01~09 过程资产：全面挂载 Spec-Kit 模板与交付门禁；
- 斜杠指令：全部收敛为 `/speckit.*` 10 大指令矩阵。
