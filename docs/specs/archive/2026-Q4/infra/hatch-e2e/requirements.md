# Requirements Specification: 孵化端到端：产物自身门禁固化

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`hatch-e2e`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让「孵化出的产物能否跑通它自己的门禁」成为一个**可常规执行**的入口（`npm run hatch:e2e` + 独立 CI job），而不是某次手工验证的结论。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 孵化端到端：产物自身门禁固化 | hatch-e2e | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为开发者 / 维护者] 作为维护者，我跑 `npm run hatch:e2e` 就能知道两条孵化入口的产物**是否通过了它自己的 check**。

2. **P0** [作为开发者 / 维护者] 作为门禁维护者，我要能证明这个 harness **会失败**（注入真实缺陷后它必须非 0），否则它是装饰。

3. **P1** [作为开发者 / 维护者] 作为 CI，我希望它在非 PR 触发时独立成 job，与 onboarding（守「从零 clone」）分工明确。

## 4. 关键业务不变量 (Key Business Invariants)

1. **harness 必须能失败** —— 反向对照：注入真实缺陷（关掉 restamp）后 `--only create` 必须 exit=1 并报出「产物自身 check 失败」。
2. **基座自身不被污染** —— 所有产物写在 mkdtemp 目录，跑完 `rmSync`；`--keep` 才保留。
3. **退化为「某次验过」即失败** —— 接进 CI 独立 job（非 PR），而不是留在文档里的结论。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：`npm run hatch:e2e` exit=0（init + create 两条入口的产物均通过自身 check）
3. **THE system SHALL** 验证：反向对照可复现：临时关掉 reactor 的 facts restamp → `npm run hatch:e2e -- --only create` 必须 exit=1，且输出 `create: 产物自身 check 失败`（已实测；还原后复跑 exit=0）
4. **THE system SHALL** 验证：`node scripts/sync-openwiki.cjs --check` exit=0；`node scripts/check-llms-sync.cjs` exit=0

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: **零 Docker**：`project:create` 需要真实 Postgres，必须走嵌入式（`scripts/lib/ephemeral-pg.cjs`），与 verify:real-db / smoke:login 同一条路。
* **THE system SHALL COMPLY WITH**: **不降级**：任一环节非 0 即整体非 0；不因「环境不便」放宽判据。
* **THE system SHALL COMPLY WITH**: **不造第二真源**：改写规模声明由 `check-llms-sync.cjs --restamp` 完成（判真值与改写同一个脚本）；wiki 陈旧清理由生成器自己做。
* **THE system SHALL COMPLY WITH**: **不改产品代码**：本规格只动工具链与门禁接线。

### 明确不做与负向范围 (Non-Goals)
* **不覆盖 profile 矩阵**：默认只跑 minimal，`--profile` 可切换；四 profile × 两入口 × 全量 check 成本过高，不设为默认。
* **不替代 onboarding job**：后者守「别人从零 clone（无 .git）」，职责不同。
* **不做业务域交付**：本规格不新增任何业务表、页面、API。
* **不追求「本地也能压测出容量」**：与本规格无关。
