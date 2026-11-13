# Tasks Breakdown & WBS: SWARM多智能体协同法典、8动词service.sh与4字菜单门禁对齐

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`DONE` | 所属领域：`infra` | 规格标识：`swarm-and-4char-menu-alignment`
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

- [x] **T1**: 落地环境无关根级 SWARM.md 多智能体协同法典并对齐派生孵化器保留策略
  - 归属: `main`
  - 文件白名单: `SWARM.md, scripts/clone-project-base.cjs, scripts/project-init.cjs, docs/specs/_baseline/runbook.json`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [x] **T2**: 升级标准 8 动词 scripts/service.sh 与 deploy/service.sh 并贯通 .env.ports 及 harness
  - 归属: `T1`
  - 文件白名单: `scripts/service.sh, deploy/service.sh, scripts/harness.cjs, scripts/speckit.ts, package.json`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [x] **T3**: 实现可见菜单 <=4 字门禁守卫、历史棘轮基线、蓝图编译自愈与正反向单测
  - 归属: `T2`
  - 文件白名单: `scripts/lib/menu-title-guard.cjs, scripts/generate-admin-nav.cjs, scripts/blueprint-engine.cjs, docs/architecture/artifacts/menu-title-length-baseline.json, test/unit/swarm-and-4char-menu-alignment.test.ts`
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
| T1 | main | 落地环境无关根级 SWARM.md 多智能体协同法典并对齐派生孵化器保留策略 | SWARM.md, scripts/clone-project-base.cjs, scripts/project-init.cjs, docs/specs/_baseline/runbook.json | 已完成 |
| T2 | T1 | 升级标准 8 动词 scripts/service.sh 与 deploy/service.sh 并贯通 .env.ports 及 harness | scripts/service.sh, deploy/service.sh, scripts/harness.cjs, scripts/speckit.ts, package.json | 已完成 |
| T3 | T2 | 实现可见菜单 <=4 字门禁守卫、历史棘轮基线、蓝图编译自愈与正反向单测 | scripts/lib/menu-title-guard.cjs, scripts/generate-admin-nav.cjs, scripts/blueprint-engine.cjs, docs/architecture/artifacts/menu-title-length-baseline.json, test/unit/swarm-and-4char-menu-alignment.test.ts | 已完成 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：已完成
* 独立测试：已通过
