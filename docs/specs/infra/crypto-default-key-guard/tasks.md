# Tasks Breakdown & WBS: 生产环境必须禁止使用硬编码默认 AES 密钥

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`crypto-default-key-guard`
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

- [ ] **T1**: 红灯：证明当前生产环境缺密钥仍能加密（静默降级），且构建不受影响
  - 归属: `main`
  - 文件白名单: `test/unit/crypto-key-guard.test.ts`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: 实现：两模块改为调用时解析密钥，生产缺密钥抛错（点名变量），非生产保持默认
  - 归属: `T1`
  - 文件白名单: `packages/shared/backend/lib/crypto-engine.ts, packages/shared/backend/lib/crypto-vault.ts`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 门禁：行为级检查脚本（子进程三态验证），接入 check 链与 compat gates
  - 归属: `T2`
  - 文件白名单: `scripts/check-crypto-key-guard.cjs, package.json, packages/shared/contract/compat-manifest.json`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 文档与验收：.env.example 补变量、门禁计数同步、注入必红/摘线必绿
  - 归属: `T3`
  - 文件白名单: `.env.example, llms.txt, project-status.md, docs/01_management/project-plan.md, docs/02_requirements/rtm-traceability-matrix.md, docs/specs/infra/crypto-default-key-guard/, docs/features/sprint-prod/, compat-manifest.json, public/compat-manifest.json, public/llms.txt, .well-known/llms.txt`
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
| T1 | main | 红灯：证明当前生产环境缺密钥仍能加密（静默降级），且构建不受影响 | test/unit/crypto-key-guard.test.ts | 未开始 |
| T2 | T1 | 实现：两模块改为调用时解析密钥，生产缺密钥抛错（点名变量），非生产保持默认 | packages/shared/backend/lib/crypto-engine.ts, packages/shared/backend/lib/crypto-vault.ts | 未开始 |
| T3 | T2 | 门禁：行为级检查脚本（子进程三态验证），接入 check 链与 compat gates | scripts/check-crypto-key-guard.cjs, package.json, packages/shared/contract/compat-manifest.json | 未开始 |
| T4 | T3 | 文档与验收：.env.example 补变量、门禁计数同步、注入必红/摘线必绿 | .env.example, llms.txt, project-status.md, docs/01_management/project-plan.md, docs/02_requirements/rtm-traceability-matrix.md, docs/specs/infra/crypto-default-key-guard/, docs/features/sprint-prod/, compat-manifest.json, public/compat-manifest.json, public/llms.txt, .well-known/llms.txt | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4。

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
