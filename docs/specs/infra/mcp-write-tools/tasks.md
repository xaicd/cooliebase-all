# Tasks Breakdown & WBS: 低代码 MCP 写类工具（B1 二期）：scaffold.plan / codegen.preview

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`mcp-write-tools`
> 对应项目宪法：`.specify/memory/constitution.md` (Gate 3 任务原子性 / Gate 4 真实入库测试)

---

## 1. 任务依赖波次图 (Task Dependency Waves)

```json
{
  "waves": [
    {
      "id": "wave-1",
      "title": "地基与契约准备",
      "tasks": [
        "T1"
      ],
      "dependsOn": []
    },
    {
      "id": "wave-2",
      "title": "核心服务与数据流落地",
      "tasks": [
        "T2"
      ],
      "dependsOn": [
        "wave-1"
      ]
    },
    {
      "id": "wave-3",
      "title": "端到端测试与集成验证",
      "tasks": [
        "T3"
      ],
      "dependsOn": [
        "wave-2"
      ]
    }
  ]
}
```

## 2. 交互式任务清单 (Interactive Execution Tasks)

- [ ] **T1**: 定义写类工具边界与统一返回契约
  - 归属: `main`
  - 文件白名单: `docs/specs/infra/mcp-write-tools/`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 实现 scaffold_plan / codegen_preview / table_migration_plan 三个工具
  - 归属: `T1`
  - 文件白名单: `scripts/mcp/cooliebase-mcp-server.cjs`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 同步 compat-manifest additive 策略与交叉校验
  - 归属: `T2`
  - 文件白名单: `packages/shared/contract/compat-manifest.json`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 正反向测试与不落盘断言
  - 归属: `T2`
  - 文件白名单: `scripts/mcp/__tests__/cooliebase-mcp-server.test.ts`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: 规范同步登记（交付链与 harness 演进规范）
  - 归属: `main`
  - 文件白名单: `AGENTS.md, docs/architecture/cooliebase-all-harness-evolution.md`
  - 验收要求: 必须携带提交标识 `[T5]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`npm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | 定义写类工具边界与统一返回契约 | docs/specs/infra/mcp-write-tools/ | 未开始 |
| T2 | T1 | 实现 scaffold_plan / codegen_preview / table_migration_plan 三个工具 | scripts/mcp/cooliebase-mcp-server.cjs | 未开始 |
| T3 | T2 | 同步 compat-manifest additive 策略与交叉校验 | packages/shared/contract/compat-manifest.json | 未开始 |
| T4 | T2 | 正反向测试与不落盘断言 | scripts/mcp/__tests__/cooliebase-mcp-server.test.ts | 未开始 |
| T5 | main | 规范同步登记（交付链与 harness 演进规范） | AGENTS.md, docs/architecture/cooliebase-all-harness-evolution.md | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → {T3, T4} → T5

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
