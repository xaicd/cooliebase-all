# Tasks Breakdown & WBS: 依赖漏洞治理：生产树止血 + 依赖 CVE 门禁 + dev 树欠债冻结

> **Spec-Kit 任务拆解与工单跟踪矩阵 (WBS & Task Dependency Plan)**
> 上游真源：`plan.md`。必须严格贯彻 **1 Task = 1 Commit** 铁律，Commit 消息必须包含 `[T<ID>]`。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`deps-vuln-remediation`
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

- [ ] **T1**: 实现依赖 CVE 门禁脚本（prod enforce + 全树 ratchet + --write-baseline）
  - 归属: `main`
  - 文件白名单: `scripts/check-deps-audit.cjs`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: S1 生产树止血：next 升至 >=16.3.8、mysql2 升至 >=3.23.1
  - 归属: `T1`
  - 文件白名单: `package.json, pnpm-lock.yaml, packages/plugins/plugin-pay/package.json`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: 由门禁脚本产出基线（此时残留即 dev 树欠债）
  - 归属: `T2`
  - 文件白名单: `docs/architecture/artifacts/deps-audit-baseline.json`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: 门禁接线：npm script + check 链 + 轨迹证据
  - 归属: `T3`
  - 文件白名单: `package.json, scripts/write-harness-trace.cjs`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: 门禁正反向测试（证明会 fire）
  - 归属: `T4`
  - 文件白名单: `test/unit/deps-audit-gate.test.ts`
  - 验收要求: 必须携带提交标识 `[T5]` 并附带真实测试验证

- [ ] **T6**: S3 dev/构建树升级（Expo/CLI/测试工具链）
  - 归属: `T5`
  - 文件白名单: `package.json, pnpm-lock.yaml, clients/expo/package.json`
  - 验收要求: 必须携带提交标识 `[T6]` 并附带真实测试验证

- [ ] **T7**: 无补丁三项已接受风险台账 + 规范登记
  - 归属: `T6`
  - 文件白名单: `docs/architecture/cooliebase-all-dependency-policy.md, AGENTS.md`
  - 验收要求: 必须携带提交标识 `[T7]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`npm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | 实现依赖 CVE 门禁脚本（prod enforce + 全树 ratchet + --write-baseline） | scripts/check-deps-audit.cjs | 未开始 |
| T2 | T1 | S1 生产树止血：next 升至 >=16.3.8、mysql2 升至 >=3.23.1 | package.json, pnpm-lock.yaml, packages/plugins/plugin-pay/package.json | 未开始 |
| T3 | T2 | 由门禁脚本产出基线（此时残留即 dev 树欠债） | docs/architecture/artifacts/deps-audit-baseline.json | 未开始 |
| T4 | T3 | 门禁接线：npm script + check 链 + 轨迹证据 | package.json, scripts/write-harness-trace.cjs | 未开始 |
| T5 | T4 | 门禁正反向测试（证明会 fire） | test/unit/deps-audit-gate.test.ts | 未开始 |
| T6 | T5 | S3 dev/构建树升级（Expo/CLI/测试工具链） | package.json, pnpm-lock.yaml, clients/expo/package.json | 未开始 |
| T7 | T6 | 无补丁三项已接受风险台账 + 规范登记 | docs/architecture/cooliebase-all-dependency-policy.md, AGENTS.md | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4 → T5 → T6 → T7

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
