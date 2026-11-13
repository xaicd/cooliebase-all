# Tasks: 开源顶流技能吸收：Archify 架构可视化与 Strix 自主渗透防御

上游：`design.md`。规格变化必须退回规划阶段（§6.1）。

## 1. 任务依赖波次图 (Task Dependency Graph - Kiro Waves)

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

- [x] **T1**: 接入 Archify 技能规范并生成交互式架构拓扑产物
  - 归属: `main`
  - 文件白名单: `.agents/skills/archify/, docs/03_design/diagrams/`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [x] **T2**: 接入 Strix 渗透测试技能规范并定义四大核心防御靶标规约
  - 归属: `main`
  - 文件白名单: `.agents/skills/strix-penetration-testing/`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [x] **T3**: 集成 K6 负载压测场景脚本并跑通 20 道门禁核验
  - 归属: `main`
  - 文件白名单: `test/load/k6-load-benchmark.js, wiki/`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`npm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | 接入 Archify 技能规范并生成交互式架构拓扑产物 | .agents/skills/archify/, docs/03_design/diagrams/ | 已完成 |
| T2 | main | 接入 Strix 渗透测试技能规范并定义四大核心防御靶标规约 | .agents/skills/strix-penetration-testing/ | 已完成 |
| T3 | main | 集成 K6 负载压测场景脚本并跑通 20 道门禁核验 | test/load/k6-load-benchmark.js, wiki/ | 已完成 |

## 4. 依赖说明

T1 → T2 → T3

## 5. 阶段状态

* 规划：`PLAN_APPROVED`（由 brief 展开）
* 开发：已完成
* 独立测试：已通过
