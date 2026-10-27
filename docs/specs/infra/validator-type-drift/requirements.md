# Requirements Specification: 校验器类型漂移：检测工具已能对齐，但它不是门禁、且有识别盲区

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`bugfix` | 所属领域：`infra` | 规格标识：`validator-type-drift`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

把「生成校验器与表元数据的字段类型一致」从『一个人工可跑的对齐工具』变成『一条会失败的机检』，并补上它看不见的写法，使漂移无法再悄悄回来。


### 缺陷现象 (Symptom)

两条，都是实测出来的（2026-10-27）：
① **工具不设失败退出码**：`scripts/align-validator-types.ts` 检测到漂移时只打印「需改: N 处」，然后 **exit 0**（源码第 168-175 行之后直接结束）。因此它**不能**接进 `check` —— 接了也会永远绿。实测：注入一处漂移后，工具正确报出`ai-api-key.name: z.coerce.number → 元数据 varchar`、`需改: 1 处`，但进程退出码仍是 0。
② **识别盲区**：它的正则只认 `z.coerce.number()` / `z.string()` / `z.boolean()` 三种写法（第 137 行）。手写的 `z.number()`（**没有 coerce**）**完全不被识别** —— 实测注入 `name: z.number().optional()`（元数据是 varchar）时工具报「需改: 0 处」，看起来像『没问题』，实际是『没看见』。

### 根因分析 (Root Cause - 5-Whys)

5-Whys：
1. 为什么漂移能悄悄回来？→ 因为没有任何门禁在检查它。
2. 为什么没有门禁？→ 因为对齐工具 `align-validator-types.ts` 是 **codemod 语义**（dry-run / --write），从设计上就没有『检查并失败』这个模式。
3. 为什么当初做成 codemod 而不是门禁？→ 因为当时有 **1117 处**待改，先要能批量落盘；门禁是第二步。实测现在**待改 = 0 处**（348 处是 id/_id 的有意约定），所以**第二步的时机已经到了**。
4. 为什么 0 处也要上锁？→ 生成物会停在旧版本：元数据改了、生成物没重跑，就会重新漂移（这正是原始缺陷的成因）。没有门禁时，漂移只会在**真实消费路径**上表现为「合法字符串被 400 拒绝」。
5. 为什么还有盲区？→ 正则按『生成器产出的写法』枚举，而手工改过的校验器会用别的写法（`z.number()`、`z.number().int()`…），落在这套枚举之外 —— 盲区处的漂移对门禁不可见。

### 保持既有行为 (Preserved Behavior)

已有正常业务功能与数据保持严格兼容。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 校验器类型漂移：检测工具已能对齐，但它不是门禁、且有识别盲区 | validator-type-drift | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为后端开发者] 作为改表元数据的人，如果我改了列类型却没重生成校验器，门禁必须失败并指出是哪张表哪个字段。

2. **P0** [作为后端开发者] 作为 reviewer，我要能一眼看出门禁的识别范围 —— 它看不懂的写法必须写清楚，而不是假装全覆盖。

3. **P1** [作为后端开发者] 作为维护者，对齐工具仍然要能 `--write` 修好（门禁只负责报警，不替我改代码）。

## 4. 关键业务不变量 (Key Business Invariants)

1. **门禁只报警、不落盘** —— `--check` 分支不调用 `fs.writeFileSync`；由「跑完 git status 干净」守。
2. **既有约定不被当漂移** —— `id` / `*_id` 仍走 `convention` 计数分支；由现有 348 处跳过数不变来守。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：`--check` 模式下：仓库当前 exit=0；注入一处漂移后 exit≠0 且**点名表.字段**
3. **THE system SHALL** 验证：`--check` 模式**不写盘**：跑完 `git status --porcelain` 为空
4. **THE system SHALL** 验证：盲区关闭：`name: z.number()` 这类手写写法也能被检出（有对应用例）
5. **THE system SHALL** 验证：门禁数同步：`compat-manifest.json` 的 gates / `llms.txt` / `.well-known` 镜像一致
6. **THE system SHALL** 验证：反向对照可复现：把门禁从 `check` 链里摘掉，注入漂移后 `check` 必须仍然绿 → 证明接线真的有用

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 多租户：业务表带 tenant_id，从全局上下文取，禁止调用方透传（§4.8）。
* **THE system SHALL COMPLY WITH**: 跨域：只走 Domain Facade，不 import 别的域 Service（§3.3）。
* **THE system SHALL COMPLY WITH**: **门禁只读**：接入 `check` 的模式不得写任何文件（`--write` 是人工动作，不能进门禁）。
* **THE system SHALL COMPLY WITH**: **不许放宽语义**：不能为了变绿把 `id` / `*_id` 的既有约定改掉（它们在 API 边界以字符串传输是**约定**，不是漂移）。
* **THE system SHALL COMPLY WITH**: 新增门禁必须带反向对照（注入必须红），并接入 `check` 链 + `compat` gates + `llms.txt` 门禁数（`surface:sync` 会重生成镜像）。

### 明确不做与负向范围 (Non-Goals)
* 不重写生成器，不改 codegen 模板的产出形态。
* 不追求 100% 覆盖所有可能的 zod 写法 —— 只覆盖**本仓实际出现过**的形式，并把边界写清。
* 不在本规格里顺手清类型债（那是独立待办）。
* 不动 `id` / `*_id` 的字符串约定。
