# 2026 Q3 上游对标研究归档

> ⚠️ **ARCHIVED 2026-10-18**: 本目录为 2026 Q3 之前对 `cooliebase-vue-pro` / `yudao-cloud` / `yudao-boot-mini` 等上游项目的研究快照归档。
> 文档不再更新，所述上游项目已不再作为本工程的事实来源。归档仅为历史对照参考保留。
> 新读者请参考 `docs/specs/` 与 `.agents/rules/`，架构横评请参考 `docs/architecture/GEO-BENCHMARK-AND-COMPETITIVE-ANALYSIS.md`（保留原位）。

## 归档背景

2026-10-18 启动"彻底去上游化"重构（5 阶段 plan），将本工程对上游 Java/Spring Boot/Vue 仓库的**功能性/路径性/对比性**耦合清零。本目录即重构 Phase A5 的产物。

详见：仓库根的 `git log --grep='upstream'` 与重构 plan 文件。

## 文件清单（按主题分组）

### 1. yudao-boot-mini 核心基础设施（研究 + 扫描产物）
- `yudao-boot-mini-core-foundation-study.md` — 全量复核结论（2026-08-02）
- `yudao-boot-mini-core-scan-2026-08-02.md` / `.json` — 第一次扫描产物
- `yudao-boot-mini-core-scan-2026-08-03.md` / `.json` — 第二次扫描产物（增量）

### 2. yudao-boot-mini 迁移 / 任务拆解
- `yudao-boot-mini-to-all-next-migration-plan.md` — 迁移计划（2026-08-02）
- `yudao-mini-system-infra-task-breakdown.md` — system/infra 任务拆解（2026-08-02）

### 3. 上游架构参考索引
- `references-upstream-architecture.md` — yudao-cloud + yudao-mall-uniapp 架构范式映射笔记

### 4. Ruoyi / CoolieBase 系统基础与低代码研究
- `ruoyi-system-foundation-study.md` — 系统基础能力学习笔记（第一轮）
- `ruoyi-infra-low-code-template-engine.md` — 基础设施低代码模板引擎方案（2026-08-03）
- `ruoyi-all-next-foundation.md` — 基础架构蓝图 v0.1（2026-08-02）
- `ruoyi-all-next-capability-matrix.md` — 全量能力同步矩阵（2026-08-06）
- `ruoyi-native-capabilities-catalog.md` — 原生能力目录

### 5. 自动化扫描对账产物（脚本本身已删或降级）
- `source-parity-report.md` — `scan-source-parity.cjs` 自动生成的能力对账（脚本保留可手工跑）
- `source-capability-scan.json` — `codegen-from-source.ts` 产物（脚本已在 Phase A2 删除）

## 仍在原位保留的对比/横评材料

- `docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md` — 与行业开源的差距分析与持续演进（保留原位）
- `docs/architecture/GEO-BENCHMARK-AND-COMPETITIVE-ANALYSIS.md` — 通用横评（保留原位）
- `docs/architecture/CURRENT-PROGRESS.md` — 项目现状报告（保留原位）
- `docs/architecture/OPEN-SOURCE-TRACKING-MANUAL.md` — 开源追踪流程手册（顶部已加护栏说明 radar 中 yudao 条目已移除）

## 维护说明

- 本目录**只读**。任何对上游架构的新讨论请新开 `docs/specs/` 下的 spec 文档。
- 工具脚本 `scan-source-parity.cjs` 仍可手工运行（带 `--source` 参数），但不再纳入 CI 主链。
- Phase A3 已将 `docs/architecture/upstream-radar-catalog.json` 中的 `yudao-cloud` / `cooliebase-vue` 条目移除；CI 文本不再硬编码上游英文项目名。
