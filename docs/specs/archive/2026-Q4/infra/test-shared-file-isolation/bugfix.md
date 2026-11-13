# Bugfix: 测试之间通过仓库共享文件互相可见，导致 test:clean 间歇随机变红

状态：`PLAN_APPROVED`

## 1. 现象 (Symptom)
同一份代码、同一台机器，`pnpm run test:clean` 时而全绿、时而红；红的文件**每次都不一样**（实测见过 route-update-arity-rule / vacuous-assertion-rule / frontend-api-url-shape-rule / harness-entry）。单跑那个文件又是绿的。另一条线索：全量跑完**立刻**单跑 `node scripts/check-harness-integrity.cjs` 是绿的、`git status` 也干净 —— 说明失败只发生在**套件运行期间**。

## 2. 根因 (Root Cause)
多个测试要临时改写仓库里的**共享文件**（`package.json` / `scripts/harness.cjs` / `docs/architecture/artifacts/*baseline*.json`），而另一些测试要**读**它们；`vitest.config.ts` 的 `fileParallelism: false` 只保证「文件之间不并行」，**挡不住「A 改动 → B 读到中间态」这类顺序耦合**。5-Whys 收敛到：测试用「就地改写真仓文件」来验证门禁行为，而门禁本身只接受真仓路径 —— 于是隔离性完全依赖调度顺序，而调度顺序不是契约。**已实测**：`git stash` 掉本规格全部改动后基线**本身就是红的**（3 failed / 476 passed），所以这是既有缺陷，不是某次改动引入的。

## 3. 防御不变量 (Invariants)
1. **测试互不污染** —— 任一测试改写共享文件后，其它测试看到的必须是原状；由「连跑 3 次结果一致」与「跑完 git status 干净」共同守。
2. **门禁判定语义不变** —— 修复前后对同一份违规输入，门禁必须给出同样的结论（用一条固定 fixture 对照）。
