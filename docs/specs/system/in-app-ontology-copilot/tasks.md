# Tasks Breakdown & WBS: 底座内嵌活体本体自省与AI Copilot抽屉

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`system` | 规格标识：`in-app-ontology-copilot`
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

- [x] **T1**: 内嵌活体本体自省路由落地: 创建 src/app/api/ontology/route.ts 动态扫描并输出当前系统的 M1/M2/M3/M6 自省元数据
  - 归属: `main`
  - 文件白名单: `src/app/api/ontology/route.ts`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [x] **T2**: 只读 SQL 沙箱查询端点与安全防御: 创建 src/app/api/copilot/query/route.ts 实现仅限 SELECT 的 AST 审计、租户隔离过滤与硬行数限制
  - 归属: `T1`
  - 文件白名单: `src/app/api/copilot/query/route.ts`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [x] **T3**: 前端 AI Copilot 抽屉组件与单元测试: 编写 packages/shared/frontend/components/ontology-copilot-drawer.tsx 并在 layout.tsx 挂载，补齐 test/unit/ontology-copilot.test.ts 并在 tasks.md 完成核销
  - 归属: `main`
  - 文件白名单: `packages/shared/frontend/components/ontology-copilot-drawer.tsx, src/app/layout.tsx, test/unit/ontology-copilot.test.ts, docs/specs/system/in-app-ontology-copilot/tasks.md`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`pnpm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | 内嵌活体本体自省路由落地: 创建 src/app/api/ontology/route.ts 动态扫描并输出当前系统的 M1/M2/M3/M6 自省元数据 | src/app/api/ontology/route.ts | 已完成 |
| T2 | T1 | 只读 SQL 沙箱查询端点与安全防御: 创建 src/app/api/copilot/query/route.ts 实现仅限 SELECT 的 AST 审计、租户隔离过滤与硬行数限制 | src/app/api/copilot/query/route.ts | 已完成 |
| T3 | main | 前端 AI Copilot 抽屉组件与单元测试: 编写 packages/shared/frontend/components/ontology-copilot-drawer.tsx 并在 layout.tsx 挂载，补齐 test/unit/ontology-copilot.test.ts 并在 tasks.md 完成核销 | packages/shared/frontend/components/ontology-copilot-drawer.tsx, src/app/layout.tsx, test/unit/ontology-copilot.test.ts, docs/specs/system/in-app-ontology-copilot/tasks.md | 已完成 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：`DEV_COMPLETED`
* 独立测试：`TESTS_PASSED`
