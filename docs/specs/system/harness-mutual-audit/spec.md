# Spec — Harness 交付闭环全面互审 (以武会友, 取长补短)

> **类型**: audit | **状态**: DRAFT (待本项目 AI 数字员工执行)
> **立场**: 双向互审 — 既对照 wenlv-next harness 基线找差距 (**取长**), 也提炼本项目独有强项反哺通用版 (**会友**)。**严禁预设结论、严禁只找差距不看强项。**
> **红线**: 本 spec 只产出审计报告与建议, 不改任何代码/脚本/宪法文件。

---

## 1. 背景与动机

wenlv-next 近期沉淀 harness 标准交付流程 (四维门禁 + 五层×三元组矩阵 + 交付闭环守卫 + HARNESS.md 首屏 8KB 门禁)。经三方会商, 先立"全面视角审计 spec"由本项目 AI 自审产出事实, 再决定吃哪几层——**不直接移植**。

**本项目特殊上下文**: AGENTS.md 已达 91KB (wenlv 64KB 硬门禁的 1.4 倍), 首屏路由层缺位是结构性问题, 审计维度 1 需重点展开。

## 2. 对照基线 (wenlv-next 出的"武艺", 摘要)

1. **四维一体交付硬门禁** ("无触达不立项, 无内生自治不交付"):
   - 使用者触达闭环 (入口可发现→交互可触发→协同可履约→结果有反馈)
   - 自动化资产内生 (0-1 全生命周期 operate 脚本, 禁脱离交付物/手点测/假 mock)
   - 日常巡检定时挂载 (登记调度中心, 禁写完即丢)
   - 双层测试 (领域不变式单测 100% + 真实终端 E2E)
2. **T1-T8 通用任务骨架** (Schema→服务→UI→协同→运营脚本→cron→E2E→双环境交付)
3. **五层×三元组固化矩阵** (开发/测试/运行/交付/协同/进化 × 脚本×skill×MCP + 硬门禁)
4. **Harness 工具箱**: `harness:scaffold / verify / closure / fix-cron` (孤儿脚本检测→自动登记 cron→串联验证)
5. **HARNESS.md 首屏**: 8KB 门禁, 三 CLI 共享, "路径+1 行能力"不抄 skill 全文
6. **(2026-10-23 WEN-500 T1-T7 增补)**: `gate.sh` 全局门禁总闸 (commit/delivery/full 三档单一清单, pre-commit 与交付链均委派, 消双份漂移); `pointer-cycle-guard` 规范文档 @导入环检测 (防 memory 递归内联放大上下文); `pnpm install` prepare 自动装门禁钩子 (堵"新 clone 门禁假绿"); CLAUDE.md `@HARNESS.md` 内联总纲伞 + 单向不回跳约定

## 3. 审计维度 (10 维全面视角, 逐维产出: ✅已备 / ⚠️部分 / ❌缺失 / 🎁强项)

| # | 维度 | 审什么 |
|---|---|---|
| 1 | 首屏入口 | **重点维**: 91KB AGENTS.md 无 8KB 级路由层的代价量化 (新 agent 进场要读多少 token? 命中一个 skill 要几跳?) |
| 2 | 宪法与门禁 | 13 条铁律的可执行性: 哪些有脚本拦截 (如 audit-test-vacuity.cjs), 哪些仅文档宣示 |
| 3 | 交付闭环四维 | 任取最近 3 个已交付 feature 逐维检验 |
| 4 | 五层×三元组 | 各层有无"固化脚本+skill+硬门禁"组合 (本项目 scripts/ 下 check-*.cjs 家族是雏形?) |
| 5 | 调度自治 | agent-autopilot-daemon.ts 等运营脚本登记与孤儿情况 |
| 6 | 双层测试 | 嵌入式 SQLite 驱动单测 + E2E 的真实覆盖; 有无假绿案例 |
| 7 | 部署链 | Dockerfile/Dockerfile.domain 双镜像的锁/断言/回滚 |
| 8 | 协同机制 | hooks.json + .agents/hooks 的多 agent 门禁协同 |
| 9 | 知识进化 | wiki/ 与代码同步机制 (有无同步门禁) |
| 10 | 下游消费契约 | compat-manifest.json 覆盖度与 `check-compat-manifest.cjs` 强校验 |

## 4. 本项目强项反哺候选 (预填观察, 待自审确认/补充 — 🎁)

- **13 条 Top-Priority Universal Directives**: 铁律成体系且编号可引用, 比 wenlv 分散在多文件更凝练, **通用版应吸收其"编号铁律"形态**
- **Zero Token Waste / 低代码引擎展开** (Schema/DSL 声明式 <500 token 生成): 对 AI 原生开发的成本观, wenlv 无此物
- **42 个 skill 中的成熟资产**: spec-driven-development / cmmi-asset-authoring / audit-test-vacuity / strix-penetration-testing 等, 评估哪些可反哺通用 skill 库
- **四类契约族收敛** (API/数据/流程/预案): 把非编码需求也收敛为可审计契约, 是四维门禁的姊妹篇
- **过程资产 01_management~09_operations 目录学**: CMMI 式过程资产防污染法则

## 5. 缺口假设 (待验证, 非结论)

- 无 HARNESS.md 首屏 → 新 agent 进场成本高 (量化之)
- AGENTS.md 91KB 无体积门禁 → 持续膨胀风险 (wenlv 有 36KB WARN/64KB FAIL + rules:check)
- operate 类运营脚本可能无统一调度登记 → 孤儿风险
- T1-T8 骨架未用于 spec 包 tasks.md

## 6. 审计方法 (每维"机器可查 + 抽样走查"双证据)

> **第 0 步**: 先读本目录 `self-portrait.md` (2026-10-23 已产出的本国事实底座), 审计从校验它是否仍与现状一致开始 (画像过期先修正画像再打分)。

```bash
wc -c AGENTS.md CLAUDE.md CURRENT.md && ls .agents/skills | wc -l
ls scripts/ | grep -cE '^check-|^audit-'        # 门禁脚本面
grep -rn "schedule\|cron" scripts/*.json 2>/dev/null | head
git log --oneline -20                             # 抽样池
```

抽样走查: 从最近 20 commit 挑 3 个 feature 型交付, 逐维打分并附证据。

## 7. 产出与 DoD

1. `audit-report.md` (本目录): 10 维 × 4 态结论 + 证据 (维度 1 需含量化 token 成本)
2. `adopt-plan.md`: 分层采纳建议 (原则层/契约层/引擎层三层分离框架; 含"是否建 HARNESS.md 首屏"独立议题)
3. `contribute-list.md`: 反哺通用版强项清单 (含论证)
4. 汇总回 wenlv-next 侧, 合入 `harness-delivery-closure-universal V1` 编写输入

**DoD**: 10 维全有证据结论; 维度 1 有量化数据; 采纳建议经项目负责人拍板; 反哺清单 ≥3 条有论证。
