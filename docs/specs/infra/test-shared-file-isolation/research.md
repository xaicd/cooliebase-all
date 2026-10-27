# 研究：测试共享文件隔离（T1 实测）

> **本文件是 T1 的产物**（纯实测 + 红灯判据，无实现）。所有数据在真仓跑出来。

## 1. 红灯判据：先证明「中间态会被读到」

`fileParallelism: false` 只保证**文件之间**不并行，文件内的用例本来就是串行的。
所以用一个最小探针直接验证「写方留下的状态，读方能看到」：

```ts
it("A 写入标记且**不还原**", () => { fs.writeFileSync(F, "A-wrote"); expect(fs.existsSync(F)).toBe(true) })
it("B 是否读到 A 的中间态", () => { const s = fs.readFileSync(F, "utf8"); fs.rmSync(F, {force:true}); expect(s).toBe("A-wrote") })
```

**实测**：`2 passed` —— B 确实读到了 A 留下的内容。

> **这就是红灯**：只要「写方改动共享仓库文件」与「读方读它」出现在同一次运行里，
> 读方就能观察到中间态。隔离性完全依赖调度顺序，而调度顺序**不是契约**。

## 2. 共享文件清单（实测，不是推测）

### 会**写**的测试（7 个文件）

| 文件 | 改什么 |
|---|---|
| `test/unit/deps-audit-gate.test.ts` | `docs/architecture/artifacts/deps-audit-baseline.json` |
| `test/unit/plan-freshness-gate.test.ts` | `package.json` |
| `test/unit/speckit-task-attribution.test.ts` | `package.json`（临时仓库，风险低） |
| `test/unit/version-consistency.test.ts` | `package.json` |
| `packages/shared/backend/plugins/__tests__/plugin-package.test.ts` | `package.json` |
| `packages/shared/backend/plugins/__tests__/plugin-registry.service.test.ts` | `package.json` |
| `packages/shared/backend/plugins/__tests__/plugin-sources.test.ts` | `package.json` |

### 会**读**这些文件的测试（5 个文件）

`test/unit/` 下的 `harness-entry` / `frontend-api-url-shape-rule` /
`route-update-arity-rule` / `vacuous-assertion-rule` / `json-duplicate-keys`
—— 它们都通过 **spawn 门禁脚本**（`check-engineering-standards` /
`check-harness-integrity` / `check-harness-trunk-dispatch` …）间接读真仓。

## 3. 闭环证据（这是 T1 最硬的一条）

把「读者清单」与「实测见过的 flaky 文件」对照：

| 实测 flaky 的文件 | 在读者清单里？ |
|---|---|
| `route-update-arity-rule.test.ts` | ✓ |
| `vacuous-assertion-rule.test.ts` | ✓ |
| `frontend-api-url-shape-rule.test.ts` | ✓ |
| `harness-entry.test.ts` | ✓ |

**读者清单 = flaky 清单。** 而写者与读者的交集正是 `package.json`。
这不是相关性猜测：探针证明了机制，清单提供了匹配。

## 4. 已实测否掉的方案（避免后人重试）

| 方案 | 实测结果 |
|---|---|
| `describe.sequential` | **vitest 5.0.5 没有这个 API** → `TypeError: describe.sequential is not a function` |
| `poolOptions.forks.singleFork: true` | **两遍全量都红，比修之前更糟** → 已回退 |
| 测试拷到临时根（软链只读件） | **3/7 红**，更糟 —— 只读件用软链会顺着链接读回真仓 |
| 直接改真仓（现状） | 随机红；且 `git stash` 后**基线本身就红**（3 failed / 476 passed） |

## 5. 一条关键的观察

`fileParallelism: false` **没能阻止** `packages/**` 下的写者与 `test/unit/**` 下的读者互相干扰
—— 说明这条配置在当前 vitest 5 + 当前 include 组合下**不足以提供隔离**。
T2 不能依赖「串行就安全」这个假设，必须做到**读方根本读不到真仓的中间态**。

## 6. 对 T2 的直接输入

- 被污染的核心是 **`package.json`**（写者 6 个、读者 5 个）与
  **`docs/architecture/artifacts/*baseline*.json`**（写者 1 个）；
- 所以候选①（门禁接受 `--root`）与候选②（窄口径 `--package-json` / `--baseline`）
  **都覆盖不到全部读者** —— 读者是**间接**读的（spawn 门禁脚本），必须让**门禁整体**能在临时根上跑；
- 「只读件用软链」已实测更糟，T2 必须改成**真拷贝**或**只拷门禁真正读的那几份**。


## 7. 决定性观测：谁在改真仓（探针实测）

T2 迁移读者受阻（同一个 helper 手动跑绿、测试里跑红），于是装了一个**每 50ms 观测文件哈希**的探针，
在整套 `pnpm run test:clean` 运行期间抓改动。结果：

```
[+ 16789ms] deps-audit-baseline.json   存在 → 删除
[+ 24267ms] deps-audit-baseline.json   7.5 秒后才恢复     ← 窗口巨大
[+ 93865ms] AGENTS.md  改 → 原
[+ 94068ms] AGENTS.md  改 → 原
[+ 99962ms] AGENTS.md  改 → 原
[+100116ms] AGENTS.md  改 → 原
[+104549ms] package.json  改 → 原（约 102ms）
```

**而且这一次套件是绿的** —— 说明 flake 取决于「读者有没有恰好落进窗口」。
这解释了它为什么随机、为什么红的文件每次不一样。

### 写方完整清单（实测）

| 被改文件 | 写方测试 |
|---|---|
| `docs/architecture/artifacts/deps-audit-baseline.json` | `deps-audit-gate`（**窗口约 7.5 秒**） |
| `AGENTS.md` | `docs-commands-gate` / `llms-sync-gate` / `vacuous-assertion-rule` |
| `package.json` | `generated-paths-gate` / `plan-freshness-gate` / `speckit-task-attribution` / `version-consistency` / `plugin-package` / `plugin-registry.service` / `plugin-sources` |

## 8. 设计因此被纠正（这一条推翻了我原来的方向）

我原先想迁移**读者**（让它们在隔离根里跑门禁）。探针证明那是绕远路：

> **该迁移的是写方。**
> 写方一旦改的是**临时根的拷贝**，读者在真仓上读到的就**永远是原状** ——
> 窗口根本不存在，读者一个都不用改。

而且这个方向**代价小得多**：11 个写方测试，而不是「所有 spawn 门禁的读者」。
T2 的下一步据此改成：把上面 11 个写方迁到 `makeIsolatedRoot()` 上，
按**窗口大小**排序先做 `deps-audit-gate`（7.5 秒那个）。
