# Tasks Breakdown & WBS: 派生工程是否应携带示例插件 hello-world

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`example-plugin-shipping`
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

- [ ] **T1**: 实测 hello-world 的完整引用面（代码 / 扫描器 / 测试 / 文档），产出可核对清单
  - 归属: `main`
  - 文件白名单: `-`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 按实测结论选定方案并落地（孵化链排除，或标注保留，或移位）
  - 归属: `T1`
  - 文件白名单: `scripts/clone-project-base.cjs, scripts/project-init.cjs, scripts/lib/hatch-profile.cjs`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 处置引用面：让基座与产物两侧的测试与注释都自洽
  - 归属: `T2`
  - 文件白名单: `packages/shared/backend/plugins/package-scanner.ts, packages/shared/backend/plugins/__tests__/plugin-sources.test.ts, packages/shared/backend/plugins/__tests__/runtime-manager.test.ts`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 验收：产物 check 与 test:unit 全绿，且反向对照能发现示例被放回
  - 归属: `T3`
  - 文件白名单: `-`
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
| T1 | main | 实测 hello-world 的完整引用面（代码 / 扫描器 / 测试 / 文档），产出可核对清单 | - | 未开始 |
| T2 | T1 | 按实测结论选定方案并落地（孵化链排除，或标注保留，或移位） | scripts/clone-project-base.cjs, scripts/project-init.cjs, scripts/lib/hatch-profile.cjs | 未开始 |
| T3 | T2 | 处置引用面：让基座与产物两侧的测试与注释都自洽 | packages/shared/backend/plugins/package-scanner.ts, packages/shared/backend/plugins/__tests__/plugin-sources.test.ts, packages/shared/backend/plugins/__tests__/runtime-manager.test.ts | 未开始 |
| T4 | T3 | 验收：产物 check 与 test:unit 全绿，且反向对照能发现示例被放回 | - | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4；T1 是纯实测（无实现），T4 是纯验证（无实现）。

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
