# Requirements Specification: 吸收 SDD 四重铁律：写链路闭环 / 统一请求契约 / 红绿对抗 E2E / 无深度测试不发布

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`sdd-write-path-discipline`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

把外部项目验证过的四条 SDD 硬约束，按**本仓的真实形态**改写后落成可失败的机检：即使有人只改文案、只写静态断言、或绕开统一请求层，也能在提交前被拦住。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 吸收 SDD 四重铁律：写链路闭环 / 统一请求契约 / 红绿对抗 E2E / 无深度测试不发布 | sdd-write-path-discipline | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为需求方] 作为 reviewer，凡是动了含业务动作的页面，我要能一眼看到它声明的**写事务全流程**（校验 → 落库 → 可验证的落库证据），而不是只有 UI 截图。

2. **P0** [作为需求方] 作为维护者，页面组件里不许出现裸 `fetch(`/裸 `response.json()` —— 必须走 `packages/shared/frontend/lib/request.ts`，否则错误码、messageKey、401 跳转全都拿不到。

3. **P0** [作为需求方] 作为发版人，改动了写路由（POST/PUT/PATCH）却只有静态断言的，必须被 `check` 拦住，而不是靠人记得。

4. **P1** [作为需求方] 作为后来者，我要看到『红绿对抗』的具体写法（正向写库 + 对抗 4xx + 弹窗自愈），而不是一句口号。

## 4. 关键业务不变量 (Key Business Invariants)

1. **存量不被误伤** —— 所有新门禁都是 ratchet：基线逐条列出存量，新增才红；由「修复前全量跑一遍，红线只在新增项」守。
2. **不伪造覆盖** —— E2E 深度只做度量与报告，不声称覆盖率达标；由文档与 report-only 输出守。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：**裸 fetch 棘轮**：现有 9 个文件的存量被冻结；**新增**一处页面内裸 `fetch(` 必须让 `check` 变红（有注入对照）
3. **THE system SHALL** 验证：**写链路测试深度**：规格触及写路由/表单页时，`speckit spec check` 或 delivery 门禁必须给出可执行判据（缺 E2E 深度即红或需显式豁免理由）
4. **THE system SHALL** 验证：存量不被误伤：在修复前跑一遍全量，红线只出现在新增项上，存量条目逐条列在基线文件里
5. **THE system SHALL** 验证：门禁数同步：`compat-manifest.json` / `llms.txt` / `.well-known` 镜像一致
6. **THE system SHALL** 验证：反向对照可复现：把新门禁从 `check` 链里摘掉，注入违规后 `check` 仍绿 → 证明接线本身有效

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: **必须机检**：四条里凡不能机检的，不得写进 AGENTS 当规矩（本仓铁律：禁止口头规范）。
* **THE system SHALL COMPLY WITH**: **棘轮优先**：存量规模极大（写路由 955、含表单页面 360、E2E 近乎为零），一刀切会让全仓立刻红 → 必须冻结存量、只拦新增。
* **THE system SHALL COMPLY WITH**: **不改判定语义**：新门禁只能新增约束，不得放宽既有门禁。
* **THE system SHALL COMPLY WITH**: 多租户 / 跨域约束沿用 §4.8 与 §3.3。
* **THE system SHALL COMPLY WITH**: 新门禁必须带反向对照（注入违规必须红），并接入 `check` 链 + `compat` gates + `llms.txt` 计数。

### 明确不做与负向范围 (Non-Goals)
* **不伪造 E2E 覆盖**：本规格不会声称『955 个写路由都有测试』。第 3 条的目标是**标准 + 一条真实样例 + 深度度量**，覆盖扩张是后续规格。
* 不引入 AES 传输信封 —— 本仓 crypto 是**字段级/静态**加密（`crypto-engine` 仅被 data-source-config 与 custom-sql-report 使用），没有全局传输加密，照搬会造出不存在的契约。
* 不重写 E2E 框架（继续用 Playwright）。
* 不要求所有历史规格补齐 brief（历史不可改）。
* 不在本规格里清 955 条存量债。
