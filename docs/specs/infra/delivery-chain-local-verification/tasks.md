# Tasks Breakdown & WBS: 交付链三件套用嵌入式真实 Postgres（embedded-postgres）本地验证

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

- [ ] **T1**: spike + helper：核实最新版无需 patch（dist 含 getBestLocale 与 process.env 继承）；登记 allowBuilds、精确锁版本；实现 `scripts/lib/ephemeral-pg.cjs`（外部 DATABASE_URL 优先；空闲端口探测 + 以 postmaster.pid 实际端口为准；PG_VERSION 复用判定；persistent:false 的资源在 finally 中 stop 并确认端口释放；失败带最近日志）
  - 归属: `main`
  - 文件白名单: `scripts/lib/ephemeral-pg.cjs, pnpm-workspace.yaml, package.json, pnpm-lock.yaml, docs/04_implementation/sbom.json, docs/04_implementation/software-bill-of-materials.md`
  - 验收要求: 必须携带提交标识 `[T1]` 并附带真实测试验证

- [ ] **T2**: `smoke:login` 改用该 helper（移除 docker exec/容器名/写死 5433），断言逐字保留
  - 归属: `T1`
  - 文件白名单: `scripts/smoke-login.cjs, scripts/lib/ephemeral-pg.cjs`
  - 验收要求: 必须携带提交标识 `[T2]` 并附带真实测试验证

- [ ] **T3**: `security:scan` 同样改用；12 项与两个阴性对照不变
  - 归属: `T2`
  - 文件白名单: `scripts/security-scan.cjs, scripts/lib/ephemeral-pg.cjs`
  - 验收要求: 必须携带提交标识 `[T3]` 并附带真实测试验证

- [ ] **T4**: `load:test` 复用同一 helper，并在输出标注『本机数字≠容量』
  - 归属: `T3`
  - 文件白名单: `scripts/load-test.cjs`
  - 验收要求: 必须携带提交标识 `[T4]` 并附带真实测试验证

- [ ] **T5**: 反向对照测试（起不来必须 fail-loud、清理后端口释放、外部 URL 优先）+ 本机实跑三条命令并记录证据
  - 归属: `T4`
  - 文件白名单: `test/unit/ephemeral-pg.test.ts, docs/specs/infra/delivery-chain-local-verification/evidence.json`
  - 验收要求: 必须携带提交标识 `[T5]` 并附带真实测试验证

- [ ] **T6**: 回写 AGENTS/计划 R3,G7/日志
  - 归属: `T5`
  - 文件白名单: `AGENTS.md, docs/01_management/project-plan.md, docs/features/sprint-prod/1019.md`
  - 验收要求: 必须携带提交标识 `[T6]` 并附带真实测试验证


## 3. CMMI 双向追溯与 Git 提交核实矩阵 (RTM & Git Trace)

> **两条硬规矩**（对齐 CMMI「主线-支线任务树」与「1 Task = 1 Commit」）:
> 1. **归属**必须写 `main`（主线）或某个已存在的任务 ID —— **不允许孤儿任务**
> 2. **文件白名单**必填（逗号分隔）；`-` 表示该任务不改文件（纯验证类）
>
> 完成度**不看"状态"列**，而是从 git 推导: commit message 带 `[T<ID>]`
> 且改动文件落在白名单内，才算这条任务真的做了（`npm run task:verify`）。

| ID | 归属 | 任务 | 文件白名单 | 状态 |
|---|---|---|---|---|
| T1 | main | spike + helper：核实最新版无需 patch（dist 含 getBestLocale 与 process.env 继承）；登记 allowBuilds、精确锁版本；实现 `scripts/lib/ephemeral-pg.cjs`（外部 DATABASE_URL 优先；空闲端口探测 + 以 postmaster.pid 实际端口为准；PG_VERSION 复用判定；persistent:false 的资源在 finally 中 stop 并确认端口释放；失败带最近日志） | scripts/lib/ephemeral-pg.cjs, pnpm-workspace.yaml, package.json, pnpm-lock.yaml, docs/04_implementation/sbom.json, docs/04_implementation/software-bill-of-materials.md | 未开始 |
| T2 | T1 | `smoke:login` 改用该 helper（移除 docker exec/容器名/写死 5433），断言逐字保留 | scripts/smoke-login.cjs, scripts/lib/ephemeral-pg.cjs | 未开始 |
| T3 | T2 | `security:scan` 同样改用；12 项与两个阴性对照不变 | scripts/security-scan.cjs, scripts/lib/ephemeral-pg.cjs | 未开始 |
| T4 | T3 | `load:test` 复用同一 helper，并在输出标注『本机数字≠容量』 | scripts/load-test.cjs | 未开始 |
| T5 | T4 | 反向对照测试（起不来必须 fail-loud、清理后端口释放、外部 URL 优先）+ 本机实跑三条命令并记录证据 | test/unit/ephemeral-pg.test.ts, docs/specs/infra/delivery-chain-local-verification/evidence.json | 未开始 |
| T6 | T5 | 回写 AGENTS/计划 R3,G7/日志 | AGENTS.md, docs/01_management/project-plan.md, docs/features/sprint-prod/1019.md | 未开始 |

## 4. 依赖说明与波次流转 (Dependencies & Progression)

T1 → T2 → T3 → T4 → T5 → T6

## 5. 阶段状态基线 (Phase Baseline)

* 规划：`PLAN_APPROVED`（由 Spec-Kit 生成）
* 开发：待开始
* 独立测试：待开始
