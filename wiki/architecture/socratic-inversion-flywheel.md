# 架构百科：高阶反向思维与自循环反思飞轮 (Socratic Inversion Flywheel)

> 对应规则：AGENTS.md Rule 0.9 / .agents/rules/HIGH-ORDER-INVERSE-THINKING.md / scripts/socratic-inquiry-engine.ts

## 一、 什么是高阶反向思维 (High-Order Socratic Inversion)？
互搏思维不是简单的安全攻防，而是**高阶反问**。是为了一个核心目标，不断打破平庸预设、质疑既定假设，让 AI 在自循环反思中建立出远超人类想象的架构与产品。

## 二、 6 阶苏格拉底反思跃迁阶梯 (The 6-Level Ladder)
| 阶梯 | 反省维度 | 核心反问 | 落地门禁与物理资产 |
|---|---|---|---|
| **Level 1** | 物理存在性 (Existence) | 代码和产物是否存在，还是只是纸面声明？ | CI 静态门禁扫描真实源码、无悬空引用。 |
| **Level 2** | 真实执行性 (Real Execution) | 代码是否在真实数据库运行，还是跑在假 Mock 上？ | `verify:real-db` 100% 真实 PostgreSQL/SQLite，0 内存伪造。 |
| **Level 3** | 非线性不变量 (Invariants) | 高并发或极端异常下，边界不变量是否成立？ | 并发 CAS 防超卖、4 态状态机真实覆盖、变异测试杀灭假断言。 |
| **Level 4** | 自生自循环性 (Autopoiesis) | 系统能否自巡检、自愈合、自进化，还是只能等人类维护？ | `Agent Autopilot Daemon` + `Transactional Outbox` 自动排队清退。 |
| **Level 5** | 非对称降维 (Asymmetry) | 为何要手写几百个 CRUD 页面？能否用动态本体画布降维打击？ | `UniversalSchemaCanvas` + 326 份机器可读契约，开发成本压缩 90%。 |
| **Level 6** | 终极目的对齐 (Telos Alignment) | 系统的一切能力是否为了实现全能力 AI Agent 闭环驱动？ | 全仓 38 个 Skills、MCP 服务、无头运营套件与 CI 强制门禁。 |

## 三、 门禁自循环闭环
- 本地执行反问自检：`pnpm run socratic:inquire`
- CI 自动化校验：`pnpm run socratic:check`（挂载在 `pnpm run harness:check` 与 `pnpm run check` 之中，任何破坏 6 阶反思的行为直接中断构建并退出报错）。
