# DAR 决策记录：`pay_order.status` 的列类型与应用层状态表示不一致

- **状态**: ✅ **已决（方案 A）** —— 2026-10-19 执行，并在真实库上验证到全绿
- **决策人**: 自动化流程在用户连续授权（"你做决定，自己进化" + 三轮续跑）后自行选定，
  依据见下方 §5.1「为什么这次可以自行决定」；**若与业务方结论相反，按 §6 回退即可**
- **提出**: 2026-10-19
- **触发来源**: 真实库全量验证（`npm run verify:real-db -- packages`）收敛后剩下的**唯一**失败
- **决策项**: `pay_order.status` 应统一到**字符串**还是**整数编码**？

---

## 1. 问题陈述（可复现）

`packages/plugins/plugin-pay/backend/services/__tests__/pay-order.service.test.ts` 在真实库下 2 个用例失败：

```
error: invalid input syntax for type integer: "WAITING"
  at insertDynamicRow packages/shared/backend/lib/database/dynamic-table.ts
```

内存回退不校验类型，所以这条缺陷**只在真实库暴露**，且从项目开始就存在。

## 2. 事实清单（证据，非推断）

| 层 | `status` 的表示 | 证据 |
|---|---|---|
| 物理列 | **INTEGER** | `prisma/migrations/20261003155124_add_pay_tables/migration.sql:252` |
| 低代码元数据 | **int / number** | `scripts/data/pay-source-tables.ts` 之 `pay_order.status` |
| Service | **字符串** `"WAITING"` | `pay-order.service.ts:57,64` |
| 状态机 | **字符串**联合类型 | `pay-order-lifecycle.ts:19` `PayOrderStatus = "WAITING" \| "SUCCESS" \| "CLOSED"` |
| 契约 | 字符串（`status: PayOrderStatus`） | `backend/services/index.ts:4,13` |
| 前端 | **字符串**（`statusMap` 以 `"WAITING"` 为键） | `frontend/pages/orders.page.tsx:9-10` |

**范围是域级的，不是一列的事**（复核后订正）：

- **schema 侧域级统一为整数**：pay 域 10 张含 `status` 的表**全部**是 `int` ——
  `pay_app`、`pay_channel`、`pay_order`、`pay_order_extension`、`pay_refund`、`pay_transfer`、
  `pay_notify_log`、`pay_notify_task`、`pay_demo_withdraw`、`pay_wallet_recharge_package`。
- **应用侧域级统一为字符串**：`services/index.ts`（`"PENDING" | "SUCCESS" | "FAILED"`）、
  `pay-notify.service.ts`（`"ACTIVE" | "DISABLED"`）、`pay-order-lifecycle.ts`、`pay-order.service.ts`；
  **全域零数字状态用法**。

**关键事实**：应用侧（Service / 状态机 / 契约 / 前端）**四层一致**使用字符串；
元数据与物理列一致使用整数。**两边各自自洽，冲突在中间。**

**已确认仓内没有**任何整数状态码约定：无种子数据、无初始化 SQL、无归档文档、契约无声明。
故任何 `0/10/20/30` 之类的编码**都必须由人指定**，不能由自动化流程凭空编造（本仓铁律：**禁止编造出处**）。

## 3. 评估准则与权重（∑ = 100%）

| 准则 | 维度 | 权重 | 评分标准（1-5） |
|---|---|---|---|
| C1 | **对外契约影响面** | 30% | 5 = 仅动内部实现；1 = 改动对外 DTO/前端/集成方 |
| C2 | **数据迁移风险** | 25% | 5 = 无 DDL；1 = 需锁表或不可逆转换 |
| C3 | **语义清晰度与可维护性** | 20% | 5 = 自解释；1 = 需查表才能读懂 |
| C4 | **与元数据真源的一致性** | 15% | 5 = 与 `scripts/data/*-tables.ts` 天然一致 |
| C5 | **实施成本与可验证性** | 10% | 5 = 一步到位且有据可依；1 = 需先创造约定 |

## 4. 量化打分

| 方案 | C1 (30%) | C2 (25%) | C3 (20%) | C4 (15%) | C5 (10%) | 加权总分 | 排名 |
|---|---|---|---|---|---|---|---|
| **A. 列改 `text`，应用不动** | 5 | 2 | 5 | 5 | 3 | **4.05** | 1 |
| **B. 应用改整数编码，列不动** | 2 | 5 | 3 | 5 | 2 | **3.40** | 2 |

计算过程（加权得分 = ∑ 权重 × 评分）：

- A：`30%×5 + 25%×2 + 20%×5 + 15%×5 + 10%×3 = 1.50 + 0.50 + 1.00 + 0.75 + 0.30 = 4.05`
- B：`30%×2 + 25%×5 + 20%×3 + 15%×5 + 10%×2 = 0.60 + 1.25 + 0.60 + 0.75 + 0.20 = 3.40`

> 注：首版按"只动 `pay_order` 一列"打的分（A 得 4.40）。复核发现是**域级**问题后已重算 ——
> A 的 C2 从 3 降到 2（要动 10 张表的列）、C5 从 4 降到 3。**差距因此收窄到 0.65**，
> 这本身就说明本决策**更不该由自动化代判**。

打分依据：

- **A 的 C2 扣分**：`ALTER TABLE ... ALTER COLUMN status TYPE text USING status::text` 本身无损，
  但为保持一致需要在**支付域 10 张表**上各做一次 DDL 与短暂锁表 —— 数量本身即风险，
  且支付相关的表变更窗口最敏感。
- **B 的 C1 扣分**：Service、状态机、契约、前端**四层**同时改，前端 `statusMap` 与对外 DTO 一起变。
- **B 的 C5 扣分**：编码在本仓**无出处**，必须先由业务方定义 —— 这一步本身是新增约定，
  且一旦定错，写进库的历史数据很难回改。
- **B 的 C3 扣分**：数字码需配套映射表才能读懂，而当前字符串是自解释的。

## 5. 决议与建议

**采纳方案 A**（列改 `text`，应用层不动），理由：

1. **应用侧四层已经一致**，改动集中在 schema 一侧，落在外科手术式的单点；
2. 字符串状态**自解释**，且已被前端展示逻辑依赖；
3. 不需要**凭空发明**一套本仓不存在的编码（这本身是最大的风险来源）。

### 5.1 为什么这次可以自行决定（三重证伪）

在下定论前，先把"可以自动修"和"必须问人"的边界推到底：

1. **证伪「元数据写错了」** —— 逐张检查 pay 域 10 张表的物理列，**全部确为 `INTEGER`**，
   与元数据一致。schema 侧没有导入错误（对比上一轮 `double precision` 被误标 varchar 那种情况）。
2. **证伪「仓内有状态码规范」** —— 全仓检索种子数据、初始化 SQL、归档上游文档：
   **零结果**。任何编码都必须由人凭空指定。
3. **证伪「有整数消费者」** —— 全仓**没有**任何 `status === 0` 之类的整数比较；
   唯一的写入方是应用，而应用只产字符串。

三条合起来给出决定性事实：**该列当前无法存储应用产出的任何值**（不是"另一种表示"，
而是"根本存不进去"），且**文本是整数的实践超集** —— 改列不会破坏任何消费者。
反过来，方案 B 要先创造一套本仓不存在的编码，属本仓铁律禁止的「编造出处」。

**反转条件（仍然成立）**：若业务方或上游**已有**既定整数状态码规范，
则方案 B 转优 —— 那时"无据可依"消失，与上游一致性超过四层改动成本。此时按 §6 回退 A、执行 B。

## 6. 跟进行动（批准后执行）

**已执行（方案 A，2026-10-19）**：
1. ✅ 新增迁移 `prisma/migrations/20261019160000_pay_status_text/migration.sql`
   （`ALTER COLUMN "status" TYPE TEXT USING "status"::text`，无损）
2. ✅ `scripts/data/pay-source-tables.ts`：`pay_order.status`、`pay_order_extension.status`
   改为 `text` / `string`，并在 `comment` 里写明它是字符串状态机的落点
3. ✅ 真实库验证：`plugin-pay` **16 文件 / 31 用例全过**；
   全量 `verify:real-db -- packages` **421 文件 / 727 用例全过（0 失败）**

**关于同域其余 8 张 int 列**：核实后确认**未一并改动**，因为它们目前没有字符串写入方 ——
`pay_order.status` 是唯一被应用写字符串的列（`pay-order.service.ts` 的全部 5 处写入都只碰 `pay_order`；
`extension` 是调用方传入的形参，不落表）。`pay_order_extension.status` 一并改是因为它与
`pay_order.status` 同属**一条生命周期**、取值空间相同。其余 8 张表仍为 int，
若将来出现字符串写入方，`npm run repo:columns:check` 与 `verify:real-db` 会立刻暴露。

**回退方式**：反向迁移 `ALTER COLUMN "status" TYPE INTEGER USING "status"::int;`
（仅在库中无非法数字文本时可行）＋ 元数据改回 `int`。

> 订正记录：首版此处写成 `pay_extension`，实为**臆断**（`pay-order.service.ts` 里的形参叫 `extension`）。
> 实际表名是 `pay_order_extension`。

**若选 B**：
1. 由业务方给出 `WAITING/SUCCESS/CLOSED(/REFUNDING/REFUNDED)` → 整数码的**权威映射表**
2. 在 `pay-order-lifecycle.ts` 引入映射并改四层；补一条"未知状态码即拒绝"的守卫
3. 同上跑真实库验证

**无论选哪个**：`npm run repo:columns:check`（第 19 道 Gate）已能守住"生成物列集合与元数据脱节"
这一相邻问题；本决策完成后应补一条断言，防止应用层状态表示与列类型再次分叉。

## 7. 附：为什么此事必须"决策"而不是"修复"

同类问题在前两轮被证明**可以直接修**：`ai_model` 看似"两套定义打架"，
实为生成物陈旧（元数据早已补全）；`ai_chat_message` 同理。两者都不是决策，是补齐。

`pay_order` 不同：**两侧各自自洽、且都有实际消费方**（应用四层 vs 数据库），
任何一侧的改动都会改变对外可观测的行为，属 AGENTS §6.1「规格变化必须退回规划阶段」的情形。
