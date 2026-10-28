# Tasks Breakdown & WBS: 吸收 SDD 四重铁律：写链路闭环 / 统一请求契约 / 红绿对抗 E2E / 无深度测试不发布

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`sdd-write-path-discipline`
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

- [ ] **T1**: 实测清单：写路由/表单页/裸 fetch/E2E 深度，产出可核对基线（含逐条存量）
  - 归属: `main`
  - 文件白名单: `-`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 门禁 A：页面禁止裸 fetch（棘轮冻结 9 处存量），带注入反向对照
  - 归属: `T1`
  - 文件白名单: `scripts/check-frontend-request-contract.cjs, test/unit/frontend-request-contract.test.ts, docs/architecture/artifacts/frontend-raw-fetch-baseline.json, package.json, scripts/harness.cjs, docs/01_management/project-plan.md`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 门禁 B：写链路测试深度（规格触及写路由/表单页时必须声明写事务旅程 + 深度测试或显式豁免），棘轮
  - 归属: `T2`
  - 文件白名单: `scripts/check-write-path-depth.cjs, test/unit/write-path-depth.test.ts, docs/architecture/artifacts/write-path-depth-baseline.json, package.json, scripts/harness.cjs, docs/01_management/project-plan.md`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 标准与样例：把『红绿对抗双层 E2E』写成可复用模板，并给出 E2E 深度度量（report-only）
  - 归属: `T3`
  - 文件白名单: `test/e2e/README.md, test/e2e/write-path.sample.spec.ts, scripts/check-write-path-depth.cjs, package.json, scripts/harness.cjs, tsconfig.json, docs/architecture/artifacts/typecheck-baseline.json, docs/01_management/project-plan.md`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: 接线 + 验收：check 链 / compat gates / 镜像与计数同步；注入必红、摘线必绿
  - 归属: `T4`
  - 文件白名单: `package.json, packages/shared/contract/compat-manifest.json, llms.txt`
  - 验收要求: 必须携带提交标识 `[T5]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`pnpm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | 实测清单：写路由/表单页/裸 fetch/E2E 深度，产出可核对基线（含逐条存量） | - | 未开始 |
| T2 | T1 | 门禁 A：页面禁止裸 fetch（棘轮冻结 9 处存量），带注入反向对照 | scripts/check-frontend-request-contract.cjs, test/unit/frontend-request-contract.test.ts, docs/architecture/artifacts/frontend-raw-fetch-baseline.json, package.json, scripts/harness.cjs, docs/01_management/project-plan.md | 未开始 |
| T3 | T2 | 门禁 B：写链路测试深度（规格触及写路由/表单页时必须声明写事务旅程 + 深度测试或显式豁免），棘轮 | scripts/check-write-path-depth.cjs, test/unit/write-path-depth.test.ts, docs/architecture/artifacts/write-path-depth-baseline.json, package.json, scripts/harness.cjs, docs/01_management/project-plan.md | 未开始 |
| T4 | T3 | 标准与样例：把『红绿对抗双层 E2E』写成可复用模板，并给出 E2E 深度度量（report-only） | test/e2e/README.md, test/e2e/write-path.sample.spec.ts, scripts/check-write-path-depth.cjs, package.json, scripts/harness.cjs, tsconfig.json, docs/architecture/artifacts/typecheck-baseline.json, docs/01_management/project-plan.md | 未开始 |
| T5 | T4 | 接线 + 验收：check 链 / compat gates / 镜像与计数同步；注入必红、摘线必绿 | package.json, packages/shared/contract/compat-manifest.json, llms.txt | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4 → T5；T1 纯实测、T5 含接线与验收。

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
