# DigitalStaff — 正式发布版本与特性真源 (Release Source of Truth)

> **规范指引**：严格遵循 `AGENTS.md` Rule 17。仅通过 `RELEASE_APPROVED` 门禁的已发布特性方可在此登记。
> **当前版本**：v2.134.4 (LTS)

---

## 🚀 已正式发布核心能力大典

### 1. 原生 Coding Agent 引擎 (Native ReAct Loop)
- **Node.js 大脑主控**：动态 Prompt 装配、ReAct 认知循环、HITL 人在环审批时间线持久化；
- **Google AI Studio 式预热引擎 (`ScaffoldRegistry`)**：秒级预铺设样板底座，Token 消耗削减 85%+；
- **Rust 底层高算力工具**：全文正则检索、AST 提取、高精度 Patch 合并与微沙箱守护。

### 2. 多模型三阶段流水线与自动化质量门禁
- **规划阶段**：Pro/高推理大脑输出 `requirements.md`、`design.md`、`tasks.md`，状态收敛为 `PLAN_APPROVED`；
- **开发阶段**：Coder 高吞吐模型基于冻结规格精准编码，交付不可变候选 Commit SHA，状态收敛为 `DEV_READY`；
- **独立测试阶段**：TestingKit 4 层测试金字塔（L1-L4）独立客观验收，状态收敛为 `TEST_PASSED`；
- **物理门禁防御**：`pnpm run api:guard` 保证 23 模块 RESTful 路由与常量字典 100% 对齐。

### 3. Build 顶级全栈模板 (`cooliebase-all-base`)
- **独立 Git Submodule 挂载**：`templates/cooliebase-all-base`；
- **零配置 SQLite 驱动**：秒级冷启动与种子数据注入；
- **4 层测试金字塔与 Playwright 自动化 Agent 探针**。

### 4. 多仓库级联同步工具
- **单命令全闭环**：`pnpm run git:sync -- "message"` 全自动检测子模块变动、推送远端、更新主仓指针并同步 GitHub/Gitee 双远端。
