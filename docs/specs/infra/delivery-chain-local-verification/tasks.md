# Tasks Breakdown & WBS: 交付链三件套本地可验证（smoke/security/load）

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`delivery-chain-local-verification`
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

- [ ] **T1**: 抽出数据库端点解析 helper（直连/隧道/失败三态，支持 PGHOST+PGPORT）
  - 归属: `main`
  - 文件白名单: `scripts/lib/pg-endpoint.cjs`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 三件套改用 helper，移除硬编码 5433
  - 归属: `T1`
  - 文件白名单: `scripts/smoke-login.cjs, scripts/security-scan.cjs, scripts/load-test.cjs`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 反向对照：不可达必须 fail-loud；隧道必须被清理且端口释放
  - 归属: `T2`
  - 文件白名单: `test/unit/pg-endpoint.test.ts`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 本机实跑三件套，记录真实 exit code 与输出（含 rps/p95、12 项渗透结果）
  - 归属: `T3`
  - 文件白名单: `docs/specs/infra/delivery-chain-local-verification/evidence.json`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: 回写状态：AGENTS §3.4、项目计划 R3/G7、sprint 日志
  - 归属: `T4`
  - 文件白名单: `AGENTS.md, docs/01_management/project-plan.md, docs/features/sprint-prod/1019.md`
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
| T1 | main | 抽出数据库端点解析 helper（直连/隧道/失败三态，支持 PGHOST+PGPORT） | scripts/lib/pg-endpoint.cjs | 未开始 |
| T2 | T1 | 三件套改用 helper，移除硬编码 5433 | scripts/smoke-login.cjs, scripts/security-scan.cjs, scripts/load-test.cjs | 未开始 |
| T3 | T2 | 反向对照：不可达必须 fail-loud；隧道必须被清理且端口释放 | test/unit/pg-endpoint.test.ts | 未开始 |
| T4 | T3 | 本机实跑三件套，记录真实 exit code 与输出（含 rps/p95、12 项渗透结果） | docs/specs/infra/delivery-chain-local-verification/evidence.json | 未开始 |
| T5 | T4 | 回写状态：AGENTS §3.4、项目计划 R3/G7、sprint 日志 | AGENTS.md, docs/01_management/project-plan.md, docs/features/sprint-prod/1019.md | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4 → T5

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
