# Tasks Breakdown & WBS: 统一包管理器调用：仓内 npx 全部改为 pnpm exec / pnpm dlx

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`npx-to-pnpm`
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

- [ ] **T1**: 清点并分类全部 npx 形态（验证类，不改文件）
  - 归属: `main`
  - 文件白名单: `-`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 文档 / .sh 层替换（含隐藏目录）
  - 归属: `T1`
  - 文件白名单: `AGENTS.md, docs/guides/agent-cli-onboarding.md, .agents/rules/PROJECT-REACTOR.md, scripts/hatch.sh, docs/architecture/GEO-AGENT-NATIVE-ONBOARDING-GUIDE.md`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 运行时调用替换为 pnpm exec（6 个脚本 + 2 个工具脚本）
  - 归属: `T2`
  - 文件白名单: `scripts/build-feature.cjs, scripts/check-client-build.cjs, scripts/clone-project-base.cjs, scripts/deliver.cjs, scripts/load-test.cjs, scripts/mcp/cooliebase-mcp-server.cjs, scripts/mutation-gate.cjs, scripts/write-test-summary.cjs`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: package.json 里 36 条 script 的 npx 替换
  - 归属: `T3`
  - 文件白名单: `package.json`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: no-new-npx 升级为 enforce 并覆盖 package.json
  - 归属: `T4`
  - 文件白名单: `scripts/check-engineering-standards.cjs, docs/architecture/artifacts/engineering-standards-baseline.json`
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
| T1 | main | 清点并分类全部 npx 形态（验证类，不改文件） | - | 未开始 |
| T2 | T1 | 文档 / .sh 层替换（含隐藏目录） | AGENTS.md, docs/guides/agent-cli-onboarding.md, .agents/rules/PROJECT-REACTOR.md, scripts/hatch.sh, docs/architecture/GEO-AGENT-NATIVE-ONBOARDING-GUIDE.md | 未开始 |
| T3 | T2 | 运行时调用替换为 pnpm exec（6 个脚本 + 2 个工具脚本） | scripts/build-feature.cjs, scripts/check-client-build.cjs, scripts/clone-project-base.cjs, scripts/deliver.cjs, scripts/load-test.cjs, scripts/mcp/cooliebase-mcp-server.cjs, scripts/mutation-gate.cjs, scripts/write-test-summary.cjs | 未开始 |
| T4 | T3 | package.json 里 36 条 script 的 npx 替换 | package.json | 未开始 |
| T5 | T4 | no-new-npx 升级为 enforce 并覆盖 package.json | scripts/check-engineering-standards.cjs, docs/architecture/artifacts/engineering-standards-baseline.json | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
