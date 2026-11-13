# Tasks Breakdown & WBS: CMMI 全生命周期交付治理与 8 大工程技能体系

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`DONE` | 所属领域：`system` | 规格标识：`cmmi-governance`
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
      "title": "E2E 页面拟人操作运营配置（严禁直接 Seed 数据库）",
      "tasks": [
        "T3"
      ],
      "dependsOn": [
        "wave-2"
      ]
    },
    {
      "id": "wave-4",
      "title": "端到端自动化测试与集成验证",
      "tasks": [
        "T4"
      ],
      "dependsOn": [
        "wave-3"
      ]
    }
  ]
}
```

## 2. 交互式任务清单 (Interactive Execution Tasks)

- [x] **T1**: 沉淀 8 大 CMMI 原生工程技能至 .agents/skills/ 并接入单一真源校验
  - 归属: `main`
  - 文件白名单: `.agents/skills/`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [x] **T2**: 规范 docs/01~09 标准目录拓扑，落地真实交付资产并执行零假 Demo 留空清理
  - 归属: `main`
  - 文件白名单: `docs/01_management/, docs/03_design/, docs/05_verification/, docs/06_quality_assurance/, docs/07_release/, docs/08_sre/`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [x] **T3**: 更新 CMMI 交付规约与 OpenWiki 百科词条，跑通 20 道质量门禁总检
  - 归属: `main`
  - 文件白名单: `docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md, scripts/check-generated-paths.cjs, wiki/cmmi/cmmi-lifecycle.md`
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
| T1 | main | 沉淀 8 大 CMMI 原生工程技能至 .agents/skills/ 并接入单一真源校验 | .agents/skills/ | 已完成 |
| T2 | main | 规范 docs/01~09 标准目录拓扑，落地真实交付资产并执行零假 Demo 留空清理 | docs/01_management/, docs/03_design/, docs/05_verification/, docs/06_quality_assurance/, docs/07_release/, docs/08_sre/ | 已完成 |
| T3 | main | 更新 CMMI 交付规约与 OpenWiki 百科词条，跑通 20 道质量门禁总检 | docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md, scripts/check-generated-paths.cjs, wiki/cmmi/cmmi-lifecycle.md | 已完成 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：已完成
* 独立测试：已通过
