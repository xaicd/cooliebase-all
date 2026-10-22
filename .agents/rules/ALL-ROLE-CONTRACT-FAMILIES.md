# §22 全工种四类契约族 —— 落地规则

> 对应 AGENTS.md **§22**（All-Role Contract Families & Job-Function Matrix）。
> 四类契约族：**API 契约 / 数据契约 / 流程契约 / 预案契约**。

## 各族的机检现状（逐族说清，不含"人工判断"）

| 族 | 代表产物 | 机检 | 说明 |
|---|---|---|---|
| **API 契约** | `agent/*.agent.json`、route、validator | `contracts:governance:check` · `routes:validation:check` · `agent:routes:check` | 见 §21 规则文件 |
| **预案契约** | `docs/specs/*/*/runbook.json` | `contracts:governance:check` | 必须有非空 `steps` 与 `rollback` |
| **数据契约** | `docs/09_operations/02_data_ops/**` | `cmmi:asset:check` | 该阶段资产存在性由 CMMI 覆盖校验看守 |
| **流程契约** | `bpm` 域状态机 / 编排 | `domain:check` · `microservice:check` | 编排落在 `bpm` 域，域边界与 Facade 由这两道门禁守 |

## 明确「当前无实例」的族（不是"人工判断"，是**零实例**）

数据契约与流程契约目前**没有实例产物**（`09_operations` 按「三存三不存」留空：
资金对账/数据管道须带**真实凭证**，未发生时留空）。

**这带来一个诚实性要求**：在缺少实例时，**不能声称这两族"已被机检覆盖"**。
`cmmi:asset:check` 的 `ACCEPTED_ABSENCES` 表把这层意思写成了机检可读的形式 ——
每处留空都必须带**理由**，且新增缺口不在表里就**直接失败**。

## 数据同步/ETL 五大铁律（条款原文，落地时逐条对照）

① 严禁一次性搬运脚本入库 ② 必须幂等可重放（按主键/版本 upsert）
③ 必须断点续传（checkpoint/增量水位）④ 血缘自动登记本体域
⑤ **对账报告即验收**（行数/空值/唯一性对账通过才算交付）

> 这五条在**有实例之前无法机检** —— 因此当前**不声称已覆盖**。
> 首个数据契约实例落地时，必须同步补上对应机检，而不是只写文档。

--- 回引：AGENTS.md §22 · 机检 `pnpm run contracts:governance:check` + `pnpm run cmmi:asset:check`
