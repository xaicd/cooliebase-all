---
name: mutation-tester
description: 变异测试与反假 Mock 验证（对标 Stryker / PIT / SpaceX 级航天测试标准）。接到“变异测试 / 杀灭假 Mock / 验证测试充分性 / 检查空洞测试 / 测试质量打假”时启用。
---

# Mutation Testing 变异测试与反假 Mock 验证规范

遵循 Stryker / PIT 变异测试理论及 SpaceX 关键任务软件工程原则（Fail-Safe Verification）。传统行覆盖率（Line Coverage）存在巨大欺骗性（断言为空或假 Mock 同样能达到 100% 覆盖），变异测试通过在被测业务代码中主动注入微小语法变异（Fault Injection），验证自动化测试用例是否能够精准识别并将其击杀（Kill Mutant），彻底杜绝“假测试”、“纸面覆盖率”与“空洞断言”。

---

## 1. 何时启用

- **核心业务状态机发布前**：涉及资金扣减、支付回调、库存 CAS、审批流跳转等零容错场景。
- **反假 Mock 审查**：排查测试用例是否脱离真实数据库、是否在单测中进行了无意义的自身模拟（Self-Mocking）。
- **重构后测试有效性评估**：评估重构代码后，存量测试套件是否真正具备守卫边界条件的能力。
- **SpaceX 级全链路测试门禁验收**：对关键核心 Service 进行变异评分（Mutation Score >= 85%）。

---

## 2. 变异测试核心理论与度量指标

```mermaid
flowchart TD
    A["原始生产代码 (Passes Tests)"] --> B["AST 故障变异注入 (Mutator)"]
    B --> C["生成突变体 (Mutant)"]
    C --> D["运行现有测试套件 (Test Runner)"]
    D -->|测试失败 (RED)| E["Mutant Killed (变异体被杀灭: 验证有效)"]
    D -->|测试通过 (GREEN)| F["Mutant Survived (变异体存活: 发现测试漏洞/假Mock!)"]
```

### 变异得分公式 (Mutation Score Indicator)
$$\text{MSI} = \frac{\text{Killed Mutants} + \text{TimedOut Mutants}}{\text{Total Mutants} - \text{Equivalent Mutants}} \times 100\%$$

- **Killed (击杀)**：测试用例失败并报错，证明单测能够捕获该逻辑错误（优秀）。
- **Survived (存活)**：注入了逻辑故障但测试居然依然全绿，**直接证明测试存在断言缺失或假 Mock！**
- **Timeout (超时)**：变异导致死循环被测试运行器超时终止，计入有效杀灭。

---

## 3. 四大核心变异算子 (Mutation Operators)

变异测试重点对以下 4 类关键业务代码进行故障注入：

| 算子类别 | 变异手法 | 模拟现实缺陷 | 击杀要求 |
|---|---|---|---|
| **1. 条件边界变异 (Boundary Mutator)** | `x > 0` $\to$ `x >= 0`<br>`stock < qty` $\to$ `stock <= qty` | 临界值边界条件处理失误（如库存刚好为 0 时被超卖） | 单测必须显式包含临界值（0、1、上限边界）的边界断言 |
| **2. 逻辑/条件反转 (Boolean/Invert Mutator)** | `if (status === 'PAID')` $\to$ `if (status !== 'PAID')`<br>`a && b` $\to$ `a \|\| b` | 业务状态守卫旁路、越权检查被跳过 | 必须有非预期状态的拒绝测试（如 `REJECTED` 必须抛异常） |
| **3. 租户与隔离旁路 (Tenant/Security Mutator)** | 移除 `.where('tenant_id', '=', tenantId)`<br>移除 CAS `where('version', '=', v)` | 跨租户数据泄漏、并发脏写防线失效 | 多租户测试必须交叉验证 Tenant B 无法查到 Tenant A 的数据 |
| **4. 审计与返回值篡改 (Void/Return Mutator)** | 返回 `null` 替代实体对象<br>清空 8 大审计字段写入逻辑 | 审计链路断裂、接口假成功（只返回 200 无数据） | 断言必须深比较返回对象的关键字段，禁止仅仅 `expect(res).toBeDefined()` |

---

## 4. 实战反假 Mock 审计案例

### 典型假 Mock（变异体存活）：
```ts
// ❌ 假 Mock 典型：把被测逻辑的底层彻底 mock 掉，甚至 mock 了返回值
it('should deduct balance', async () => {
  const fakeRepo = { deduct: vi.fn().mockResolvedValue(true) }
  const service = new WalletService(fakeRepo)
  await service.deduct('acc-1', 100)
  expect(fakeRepo.deduct).toHaveBeenCalled() // ❌ 仅断言调用过，哪怕方法被改成死循环或扣了负数测试也能过！
})
```

### 真实数据库变异测试（变异体必杀）：
```ts
// ✅ 真实嵌入式 SQLite / 真实数据库事务驱动
it('should atomically deduct balance and prevent overdraft', async () => {
  const db = await createTestDatabase()
  await seedAccount(db, { id: 'acc-1', balance: 100, version: 1 })
  const service = new WalletService(db)

  // 1. 正常扣减
  await service.deduct('acc-1', 40)
  const after1 = await getAccount(db, 'acc-1')
  expect(after1.balance).toBe(60) // 真实数据库余额验证
  expect(after1.version).toBe(2)  // CAS 乐观锁版本号自增验证

  // 2. 边界透支测试 (变异算子注入 > 0 变 >= 0 时必被捕获)
  await expect(service.deduct('acc-1', 70)).rejects.toThrow('INSUFFICIENT_BALANCE')
  
  // 3. 验证数据库状态未污染 (回滚/不变量保障)
  const after2 = await getAccount(db, 'acc-1')
  expect(after2.balance).toBe(60)
})
```

---

## 5. 变异测试执行与验证命令

在 cooliebase-all 中结合真实数据库执行变异与金字塔测试：

```bash
# 1. 执行真实数据库集成测试矩阵
npm run test:matrix

# 2. 针对指定领域执行高强度并发原子测试 (如库存超卖/CAS)
npx vitest run test/integration/inventory-atomic.integration.test.ts

# 3. 针对 RBAC 与租户隔离执行穿透测试
npx vitest run test/integration/sqlite-rbac.integration.test.ts

# 4. 全仓门禁合规检查
npm run check
```

---

## 6. 检查清单与门禁

- [ ] 变异测试断言是否基于**真实数据库状态**（真实 SQLite/PostgreSQL），而非内存伪造的对象桩？
- [ ] 是否消灭了所有的空断言（如仅检查 `toBeDefined()`、`toBeTruthy()`）？
- [ ] 关键状态流转（如订单新建 $\to$ 支付 $\to$ 发货 $\to$ 结算）是否包含非法跃迁拒绝测试？
- [ ] 涉及租户与审计字段（`tenant_id`, `created_by` 等）的代码在注入变异后能否被测试拦截？
- [ ] 核心领域变异得分（MSI）是否达到 $\ge 85\%$？

---

## 7. 严禁事项

1. **严禁无断言的裸奔测试**：严禁只执行被测方法而没有任何 `expect()` 断言以骗取覆盖率。
2. **严禁在单测中 Mock 真实数据库引擎**：严禁把 `better-sqlite3`、Kysely AST QueryBuilder 整体 Mock 成静态 Promise 返回值。
3. **严禁捕获异常后吞掉不报错**：在测试用例的 `catch` 块中必须有显式失败断言，严禁空 `catch {}` 导致断言被漏过。
