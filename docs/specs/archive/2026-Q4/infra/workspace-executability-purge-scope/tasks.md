# Tasks Breakdown & WBS: 派生后可执行性门禁口径对齐平台 cleanWorkspaceLeaks 全量清洗面（补 package.json 维度）

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`DONE` | 所属领域：`infra` | 规格标识：`workspace-executability-purge-scope`
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

- [x] **T1**: 新增口径真源模块 scripts/lib/workspace-executability-scope.cjs（平台 cleanWorkspaceLeaks 全量清洗面镜像 + package.json 审计函数）
  - 归属: `main`
  - 文件白名单: `scripts/lib/workspace-executability-scope.cjs`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [x] **T2**: 升级门禁脚本 scripts/check-workspace-executability.cjs：口径换全量清洗面 + package.json 维度 + 路径字面量依赖扫描
  - 归属: `T1`
  - 文件白名单: `scripts/check-workspace-executability.cjs`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [x] **T3**: 补反向对照单测 test/unit/workspace-executability-purge-scope.test.ts（13 条断言，四条必红对照）
  - 归属: `T2`
  - 文件白名单: `test/unit/workspace-executability-purge-scope.test.ts`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [x] **T4**: 口径同步到文档（计划 B12 行）+ 母本 main 提交并推远端 + 刷新平台母本快照 /opt/coolie/blueprints/cooliebase-all + 派生冒烟复验（source=workspace-gate）
  - 归属: `T3`
  - 文件白名单: `docs/01_management/project-plan.md, docs/05_verification/workspace-executability-purge-scope-evidence.md`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`pnpm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | 新增口径真源模块 scripts/lib/workspace-executability-scope.cjs（平台 cleanWorkspaceLeaks 全量清洗面镜像 + package.json 审计函数） | scripts/lib/workspace-executability-scope.cjs | 已完成 |
| T2 | T1 | 升级门禁脚本 scripts/check-workspace-executability.cjs：口径换全量清洗面 + package.json 维度 + 路径字面量依赖扫描 | scripts/check-workspace-executability.cjs | 已完成 |
| T3 | T2 | 补反向对照单测 test/unit/workspace-executability-purge-scope.test.ts（13 条断言，四条必红对照） | test/unit/workspace-executability-purge-scope.test.ts | 已完成 |
| T4 | T3 | 口径同步到文档（计划 B12 行）+ 母本 main 提交并推远端 + 刷新平台母本快照 /opt/coolie/blueprints/cooliebase-all + 派生冒烟复验（source=workspace-gate） | docs/01_management/project-plan.md, docs/05_verification/workspace-executability-purge-scope-evidence.md | 已完成 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：已完成
* 独立测试：已通过
