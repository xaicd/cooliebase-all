# Requirements Specification: UI 设计规范可执行化：design tokens + 裸 px/py 门禁 + 基线页与 codegen 共用

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`enhancement` | 所属领域：`infra` | 规格标识：`ui-design-tokens`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让 AGENTS §5.2 的设计规范从散文变成代码：一份 design-tokens 模块，基线页与 codegen 模板都引用它，裸写的间距类由门禁拦住。


### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 未明确
- 目标指标 (Target): 未明确


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| UI 设计规范可执行化：design tokens + 裸 px/py 门禁 + 基线页与 codegen 共用 | ui-design-tokens | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为前端开发者] 作为前端，页面布局用 UI.table.cell 这类 token，而不是自己写 px-4 py-2.5

2. **P0** [作为前端开发者] 作为前端，codegen 生成的列表页与 channels.page.tsx 视觉一致（同一套 token）

3. **P1** [作为前端开发者] 作为交付负责人，新增页面里出现裸 px-*/py-* 会被门禁拦下（棘轮，存量冻结）

## 4. 关键业务不变量 (Key Business Invariants)

1. **单一真源** —— 间距只来自 design-tokens.ts；模板与页面都引用，不各自硬编码。
2. **门禁必须能失败** —— 反向对照：写一个裸 px-4 到任一列表页 → check 必须红。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：packages/shared/frontend/lib/design-tokens.ts 存在且导出 UI 分组（page/table/button/card）
2. **THE system SHALL** 验证：pnpm run check exit=0（含新门禁）
3. **THE system SHALL** 验证：反向对照：在某个页面里写裸 px-4 → 门禁 exit=1；改用 UI.token → exit=0
4. **THE system SHALL** 验证：codegen 模板引用 token（frontend-list.template.ts 不再硬编码 px-*）
5. **THE system SHALL** 验证：pnpm run build exit=0

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 本次只做 token 与门禁，不改视觉方向（颜色/字体/圆角的选择保持现状）。
* **THE system SHALL COMPLY WITH**: 存量页面不强制立刻改 —— 裸 px/py 走棘轮（冻结既有，只拦新增）。
* **THE system SHALL COMPLY WITH**: 生成器模板必须与手写页面共用同一份 token，禁止各自硬编码。

### 明确不做与负向范围 (Non-Goals)
* 不做视觉重塑（配色/品牌/插画）—— 那是独立的品牌议题
* 不改 clients/expo（目前只有 2 个 tsx 文件，先不动）
* 不强制一次性迁移 340 个存量页面的间距，走棘轮
