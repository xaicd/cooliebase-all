# 采纳计划（分层，含 `pnpm harness` 统一入口）

> **依据**：`audit-report.md` 的 10 维结论。
> **立场**：**不直接移植** wenlv-next 的做法 —— 按「原则 / 契约 / 引擎」三层分别决定吃什么。
> **红线**：本文件是**建议**，采纳与否由项目负责人拍板；文档本身不改任何代码。

---

## 0. 先回答任务方点名的那条

> **「最后，所有的标准全流程过程要用 `pnpm harness xxx` 管理与执行」**

这条与审计结论**完全吻合**：本仓当前的痛点是 **188 个 npm script、46 个 check 类、
但"哪一条是主干"没有任何声明**（维度 5 判定为 ❌）。
`pnpm harness` 正是解决它的入口层。

### 0.1 建议的命令面（✅ 全部委托给已有脚本，不新增判定逻辑）

```
pnpm harness                        # 等价于 harness help：打印主干与当前状态
pnpm harness doctor                 # 体检：环境 + 钩子 + 真源 + 孤儿扫描（只读，不跑构建）
pnpm harness route -- "<需求>"       # L0 需求分诊（委托 agent:route）
pnpm harness spec new|build|check    # 规格链（委托 speckit:new/build/check）
pnpm harness check                  # 全量静态门禁（委托 check）
pnpm harness test [--fast]           # 测试金字塔（unit → integration → contract → e2e）
pnpm harness e2e --only init|create|both   # 孵化端到端（委托 hatch:e2e）
pnpm harness deliver                # 交付门（build + smoke + security + load + fingerprint）
pnpm harness ops -- <域>.<实体> <action>   # 运营动作（委托 agent:ops）
pnpm harness evolve                 # 进化待办（委托 evolution:backlog，**report-only**）
```

**设计约束（三条，缺一就可能变成第二个"总闸"灾难）**：

1. **零判定逻辑**：`harness` 只做**转发与状态汇总**。判定仍在各脚本里 ——
   否则会出现"两处判定"，正是本仓反复踩过的 `spec-gate.sh` 与 `pre-commit` 同源问题。
2. **`harness check` 必须与 `pnpm run check` 完全等价**：`harness` 不能"放宽"任何一步。
3. **每条子命令都要能被"证明会失败"**（反向对照）—— 见 §2.3。

### 0.2 要解决的具体缺口（来自审计维度 5）

| 缺口 | `pnpm harness` 如何解决 |
|---|---|
| 188 个 script 无主干声明 | `harness help` 输出**唯一主干**（10 条），其余标为"内部/子步骤" |
| `agent-autopilot-daemon.ts` 是孤儿 | `harness doctor` 增加**孤儿扫描**：`scripts/**` 里既无 npm script、无门禁、无测试引用者 → 列出 |
| "标准全流程"靠人记 | `harness` 的**主干顺序**即流程声明；`harness doctor` 报告"当前处于哪一步" |

### 0.3 建议的门禁（让"主干"不会漂）

新增一条 `harness:surface:check`：

- **每个 `scripts/check-*.cjs` 必须被某个 `pnpm harness` 子命令或 `check` 链引用**（否则是孤儿）；
- **`harness` 的子命令集合必须与 `package.json` 的真实脚本一致**（不能引用不存在的）；
- **反向对照**：故意加一个未被引用的 `check-*.cjs` → 必须 exit 1。

> 这一条把"维度 5 的孤儿问题"变成**可失败**的机检，而不是又一份清单。

---

## 1. 三层分离：吃什么、不吃什么

### 1.1 原则层（**建议全吃**，成本低、收益高）

| wenlv-next 的原则 | 本仓现状 | 建议 |
|---|---|---|
| **「无触达不立项，无内生自治不交付」** | 本仓有 `agent:route` 三值判定（`SPEC_REQUIRED`/`DIRECT_OK`/`NOT_A_REQUIREMENT`）✓ | ✅ **吃**：这与本仓 §3.4 第 0 步同源，只是**表述更狠**。建议把这句话写进 `AGENTS` §5 的一句话摘要 |
| **交付必须自带运营脚本（禁手点测/假 mock）** | 本仓 `agent:ops` ✓、`smoke:login` 起真服务 ✓ | ✅ **吃**：本仓已经做到了，缺的是**表述**与**门禁**（见维度 5） |
| **`pnpm install` 自动装门禁钩子** | 本仓 `postinstall → setup-git-hooks` ✓，但**孵化路径时序不成立**（已修） | ✅ **已吃并加固**（`b53cd632`） |
| **`gate.sh` 全局门禁总闸（三档单一清单）** | 本仓 `check` 是一条长链 ✓ + `.githooks/pre-commit` ✓ | ⚠️ **部分吃**：本仓已有"单一清单"（`check`），但**pre-commit 里还有 `check` 之外的检查**（`plan:freshness`）→ 这正是本次修的 `--no-verify` 缺口。**建议让 pre-commit 只做 `harness check` 的子集调用**，消除"两份清单" |
| **`@` 导入环检测（防 memory 递归内联）** | 本仓**无** | ✅ **吃**（见 §1.2，做得起且便宜） |

### 1.2 契约层（**部分吃**，按缺口选）

| 项 | 本仓缺口 | 建议 |
|---|---|---|
| **四维交付硬门禁** | 维度 3 抽样显示"四维齐"，但**无门禁保证**（靠人自觉） | ✅ **吃**：把四维落成 `harness deliver` 的**必跑清单**（不是新判定，是**编排**） |
| **T1–T8 通用任务骨架** | 本仓有 `speckit` 的 11 阶段 ✓（更细） | ❌ **不吃**：本仓的阶段划分已更细，移植会变成两套骨架 |
| **五层×三元组矩阵** | 维度 4：**无"配齐"门禁** | ⚠️ **吃一半**：只加**孤儿检测**（见 §0.3），**不做**"每层必须三件齐"的硬性要求 —— 那会逼出凑数的 skill |
| **HARNESS.md 首屏 8KB 门禁** | 维度 1：**无路由层** | ⚠️ **独立议题**，见 §3 |
| **pointer-cycle-guard（@ 导入环）** | **无** | ✅ **吃**：便宜且有真实风险（`CLAUDE.md` 已用 `@` 导入风格） |
| **交付闭环守卫** | 本仓 `delivery:check --strict` ✓（更严：扫全规格+时效） | ✅ **已具备，无需移植** |

### 1.3 引擎层（**基本不吃**，架构不同）

| 项 | 判断 |
|---|---|
| wenlv-next 的 daemon / 调度实现 | ❌ **不吃**。本仓是 **workspace-bundle**，`agent-profile.json` 明文禁止 `agent-runtime`；Agent loop 在 DigitalStaff。**移植调度引擎会直接违反本仓宪法**（`check-harness-bundle.cjs` 会 fail） |
| 他们的 skill 内容 | ❌ 不吃（本仓 38 个 skill 自成体系） |
| 他们的门禁脚本实现 | ⚠️ 只**读思路**，不搬代码（判定真源必须单一） |

> **这一层是互审最容易出错的地方**：wenlv-next 的"调度自治"是**运行时**能力，本仓的定位是**模板/env**。
> **同样的话在不同架构里含义不同** —— 本仓能做的是"**把主干声明清楚**"（`pnpm harness`），
> 而不是"自己跑一个 daemon"。

---

## 2. 落地顺序（建议，按性价比）

| 步 | 做什么 | 验收（可执行） | 成本 |
|---|---|---|---|
| 1 | `pnpm harness` 入口（§0.1 的 10 条） | `pnpm harness help` 打出主干；`harness check` 与 `check` **等价**（逐字比对） | 小 |
| 2 | `harness doctor`（环境 + 钩子 + 真源 + **孤儿扫描**） | 造一个孤儿脚本 → 报告里出现它 | 小 |
| 3 | `harness:surface:check`（§0.3） | 未引用的 `check-*.cjs` → **exit 1** | 小 |
| 4 | `@` 导入环检测（`pointer-cycle-guard`） | 造一个环 → exit 1 | 小 |
| 5 | pre-commit 改为「`harness check` 的子集」 | 反向：删掉一处子集调用 → 某条检查在提交时不再跑（**必须能被发现**） | 中 |
| 6 | 维度 2 的**条款 ↔ 机制登记表** | 未登记的条款 → 机检失败，或**显式标注"仅文档"并给理由** | 中 |
| 7 | 维度 1 的路由层（§3 独立决策） | 见 §3 | 大，需拍板 |

---

## 3. 独立议题：要不要建 `HARNESS.md` 首屏（8KB 级）

**现状（量化）**：`AGENTS.md` **91KB ≈ 14k tokens**（中文实际更高）；
`CLAUDE.md` 3.7KB；`ASSEMBLY.md` 已是分段清单，**但没有"该读哪个"的路由**。

**三个选项**：

| 选项 | 做法 | 代价 | 风险 |
|---|---|---|---|
| **A. 不建**（现状） | 维持 91KB + 装配表 | 0 | 新 agent 每次要么读全（14k tokens），要么靠装配表**自己判断** |
| **B. 建 8KB 首屏 `HARNESS.md`** | 只放"**主干 10 条 + 当前该读哪 3 段**"，并让 `CLAUDE.md`/`AGENTS.md` 都指向它 | 中（要维护"指向"不漂） | **第二真源**风险 —— 8KB 若开始复制 AGENTS 的条文，就会漂（本仓 `§25` 的红线） |
| **C. 不建新文件，只给 `ASSEMBLY.md` 加"路由列"** | 在现有装配表上加一列「当前任务类型 → 该读哪几段」 | 小 | 需要有人填路由规则；填错会误导 |

**我的建议：C**。理由：

1. 本仓 `§25` 明令**单一真源** —— B 选项天然有复制风险；
2. 审计维度 1 的真实缺口**不是"文件太大"，而是"没有路由"** —— C 直接补路由，不新增文件；
3. C 可机检（路由列非空 + 引用的段真实存在），B 的"8KB 上限"是个**脆弱指标**（凑字数即可满足）。

**若最终选 B**，必须同时加一条门禁：`HARNESS.md` **只允许指向** `AGENTS.md` 的章节锚点，**不得复制条文内容**（否则 fail）。

---

## 4. 明确不做的（避免"采纳"变成"背债"）

| 不做 | 理由 |
|---|---|
| 移植 wenlv-next 的调度引擎/daemon | 违反本仓 `agent-profile.json` 的 `kind=workspace-bundle`，`check-harness-bundle.cjs` 会 fail |
| 移植 T1–T8 骨架 | 本仓 `speckit` 11 阶段更细，两套骨架必然漂 |
| 强制"五层×三元组全配" | 会逼出凑数的 skill / 空门禁 —— 本仓已吃过"骨架不算完成"的教训 |
| 把 `vacuity:audit` 改成门禁 | 三个启发式在本仓 **100% 误报**（已实测记录），设成门禁只会逼出豁免 |
| 把 `evolution:backlog` 改成失败 | 设计如此（暴露欠债不阻断）；但应补**闭环率**指标（见审计维度 9） |

---

## 5. 拍板清单（给项目负责人）

| # | 决策 | 建议 |
|---|---|---|
| D1 | 是否建 `pnpm harness` 统一入口（§0） | ✅ **强烈建议**（任务方已点名） |
| D2 | 首屏路由：A 不建 / B 建 8KB `HARNESS.md` / C 加路由列 | **C** |
| D3 | 是否加 `harness:surface:check`（孤儿 + 子命令一致性） | ✅ 建议 |
| D4 | 是否加 `@` 导入环检测 | ✅ 建议（便宜） |
| D5 | 条款 ↔ 机制登记表（维度 2） | ✅ 建议（这是最系统性的缺口） |
| D6 | pre-commit 是否收敛为 `harness check` 的子集 | ⚠️ 建议，但要先证明"收敛后没有检查被丢掉" |

---

## 6. 与本次审计的对应关系

- **审计维度 5（调度自治 ❌）** → §0 `pnpm harness` + §0.3 孤儿门禁
- **审计维度 1（首屏 ⚠️）** → §3 独立议题（建议 C）
- **审计维度 2/4/9（登记缺失）** → §5 D5「条款 ↔ 机制登记表」
- **审计维度 6/8/10（强项）** → 无需移植，只需在 `contribute-list.md` 反哺出去
