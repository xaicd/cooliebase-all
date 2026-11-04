# 派生后可执行性门禁 · purge 口径对齐平台全量清洗面 —— 交付与核销证据

> 规格包: `docs/specs/infra/workspace-executability-purge-scope/`（brief.json 为真源）
> 工单: COO-55-1-2-1（底座侧：母本下发派生后可执行性门禁新版 + 刷新平台母本快照）
> 上游: COO-55-1-2（平台侧接线，`coolie` @ `f3ef139d10`）/ COO-55-1（原始缺陷）/ COO-55-1-3（派生工作区侧实现）
> 本节为**交付方（铁匠 / core-swe）**的交付说明与核销证据；QA 走查结论由门神（FDSE）另立证据。

---

## 一、结论

**母本仓（`/Users/mac/workspace/xaicd/cooliebase-all`）已落地新版门禁并推到远端 main。**
门禁口径从「平台 6 条母港私有规约机文件」扩为「平台 `cleanWorkspaceLeaks` **全量清洗面**」，
并**新增 package.json 维度** —— 这是旧门禁完全看不见、而平台**真的会做**的那条路径
（把 script 键整个删掉 ⇒ 命令变成「不存在」，**静默消失**，不是报错）。

母本侧本地实跑：静态层 exit 0（162 个公开脚本）、运行层 4 条探针全部可启动、
单测 **13/13 PASS**、四条反向对照**全部按预期判红**、母本全量静态门禁链 `pnpm run check` **exit=0**。

## 二、改了什么（母本仓文件清单）

| 文件 | 作用 |
| --- | --- |
| `scripts/lib/workspace-executability-scope.cjs`（新增） | **口径真源**：平台清洗面的机检镜像 + package.json 审计规则。单独成模块以便单测直接调用 |
| `scripts/check-workspace-executability.cjs`（改） | 门禁本体：接入新口径、新增 package.json 维度、新增「路径字面量依赖」扫描 |
| `test/unit/workspace-executability-purge-scope.test.ts`（新增） | 13 条断言，每条正面断言都配反向对照 |
| `docs/01_management/project-plan.md`（改） | B12 行同步口径（B11 计划时效性门禁要求） |
| `docs/specs/infra/workspace-executability-purge-scope/`（新增） | 规格包（母本仓需求分诊判定 SPEC_REQUIRED ⇒ 按 §0 立规格） |
| `docs/05_verification/workspace-executability-purge-scope-evidence.md`（新增） | 本文件 |
| `docs/features/sprint-prod/1104.md`（改） | AGENTS §15 需求分诊留痕 |

### 2.1 口径来源（平台真源 → 底座镜像）

平台真源：`/Users/mac/workspace/xaicd/coolie/server/src/services/harness-delivery-engine.ts`
的 `cleanWorkspaceLeaks`；来源鉴别真源：同仓 `packages/harness/src/delivery/spec-engine-provenance.ts`。

| 平台行为 | 平台位置 | 底座门禁覆盖 |
| --- | --- | --- |
| 删 `scripts/harness.sh`（无条件） | L378-382 | ✅ 新增 |
| 删 4 个母港独有规约机文件（无条件） | L385-390 | ✅ 原有 |
| 删 `scripts/lib/spec-resolver.cjs` / `scripts/speckit.cjs`（**仅母港 fork 版**） | L385-390 + provenance | ✅ 原有（**保守口径**，见 §2.3） |
| 删 `server/src/services/{blueprint-profiles,harness-project-provisioner}.ts` | L393-399 | ✅ 新增 |
| 递归删 `.agents/skills/{fda,core-swe,fdse,ds,pre-sre,cmmi-gatekeeper,local-team-toolchain,coolie-boss-decision-log}`（空了连目录一起删） | L401-419 | ✅ 新增 |
| **改写 package.json：整键删 `harness` / `pre-commit` / `triage` / `doctor` / `gate:fast` / `gate:release` / `speckit` / `spc:audit`** | L422-445 | ✅ **本单新增** |
| **任何值里引用了 `scripts/harness.sh` 的 script 键也会被删** | L422-445 | ✅ **本单新增** |

### 2.2 package.json 维度（本单新增的三条断言）

旧门禁**从不读 package.json**（`grep package.json scripts/check-workspace-executability.cjs` 无命中），
所以「平台把 script 键整个删掉」这条路径底座**完全看不见**。现在断言三条：

1. `package-json-references-purged-file` —— 某个 script 的命令值引用了会被清洗的文件
   ⇒ 平台清洗后**这个键会被整个删掉**，命令变成「不存在」（静默消失，不是报错）。
2. `public-script-key-missing` —— 必须留存的公开 script 键（`harness` / `speckit`）不在 package.json
   ⇒ 它**已经被平台清洗删掉了**。这条在**派生后**（平台 COO-55-1-2 接线：清洗之后自动跑冒烟）
   当场变红，不留给客户去踩。
3. `purge-scope-narrower-than-platform` —— 生效口径比平台已知清洗面**窄**
   ⇒ 口径收窄 = 门禁变弱 = 假绿，门禁**自判红**（见 §2.4）。

另补一条**依赖形态**的扫描：旧门禁只认 `require`/`import`，
`execFileSync("bash", ["scripts/harness.sh"])` 这类**真实依赖**根本看不见（实测反例），
现在按「路径字面量」再扫一遍（`references-purged-file`）。

### 2.3 保守口径的注释已对齐现状

`scripts/lib/spec-resolver.cjs` 与 `scripts/speckit.cjs` 自平台 **COOA-789** 起改为
**按来源鉴别**（母港 fork 版带 `setRoot` / `Coolie Edition` 标记才删，底座原生同名资产**保留**）。
本门禁仍全列 ⇒ **偏严**。偏严只多红、不产生假绿；且底座母本**实测不含**这 6 个文件
（`scripts/speckit.cjs`、`scripts/check-contracts.mjs`、`scripts/lib/spec-resolver.cjs`、
`scripts/lib/spec-ontology-driver.cjs`、`scripts/lib/speckit-issue-verifier.cjs`、
`scripts/lib/ontology-callchain-engine.cjs` 逐条 `ls` 确认）⇒ **本仓零假红**。
口径真源模块里已把两档（无条件删除 / 按来源鉴别删除）分开标注并写明平台源码位置，
下一个维护者不会照着过期事实做决策。

### 2.4 为什么「口径收窄」也要判红

`DE_LEAK_PRIVATE_FILES`（逗号分隔）沿用既有语义：**整表替换**生效口径。
但替换后的口径若**不覆盖**平台已知清洗面，门禁自判红 ——
因为「用环境变量把口径改窄」与「平台把 script 键删掉」是**同一族病**：
**静默地让门禁变弱 ⇒ 假绿**。平台清洗面若真的收缩了，正确出口是改
`scripts/lib/workspace-executability-scope.cjs` 的**常量**（那份常量就是机检镜像）。

## 三、验收口径逐条实跑（母本仓，非引用旧结论）

### 3.1 正常路径

| # | 场景 | exit | 要点 |
| --- | --- | --- | --- |
| A1 | `node scripts/check-workspace-executability.cjs`（静态层，母本干净树） | **0** | `PASS: 162 个公开脚本的相对依赖全部可解析，且无一依赖会被 de-leak 清洗的文件；package.json 的公开 script 键（harness / speckit）完好、也无引用被清洗文件。` |
| A2 | `node scripts/check-workspace-executability.cjs --run`（运行层冒烟） | **0** | `运行层冒烟: 4 条探针全部可启动（无模块解析错误）` |
| A3 | `pnpm exec vitest run test/unit/workspace-executability-purge-scope.test.ts` | **0** | **13/13 PASS**（含 4 条必红反向对照） |
| A4 | `TMPDIR=/tmp pnpm run check`（母本全量静态门禁链） | **0** | `EXIT=0`；尾段 `[delivery] 11 个阶段，独立缺陷 0 项`（本规格包 9 阶段产物齐全） |

### 3.2 反向对照（四条必须判红 —— 绿了就等于门禁没牙齿）

沙箱口径：`scripts/` 真拷贝 + 其余顶层软链 + package.json 可改（与单测 `makeSandbox` 同源）。

| # | 反向对照 | exit | 实际输出 |
| --- | --- | --- | --- |
| R1 | package.json 装 `__probe`（值 = `node scripts/harness.sh`） | **1** | `[package-json-references-purged-file] package.json:scripts.__probe` → 「平台**无条件**删除它；派生清洗后**这个 script 键会被整个删掉**，命令变成「不存在」（静默消失，不是报错）」 |
| R2 | 删掉 `harness` / `speckit` 两个公开键（模拟平台清洗后的 package.json） | **1** | `[public-script-key-missing] package.json:scripts.harness` + `…scripts.speckit` —— **「静默消失」当场变红** |
| R3 | 公开脚本 exec 依赖 `scripts/harness.sh`（require/import 之外的依赖形态） | **1** | `[references-purged-file] scripts/__probe-harness-dep.cjs:2` |
| R4 | `DE_LEAK_PRIVATE_FILES=scripts/harness.sh`（口径被收窄） | **1** | `[purge-scope-narrower-than-platform] package.json` —— 口径收窄 = 门禁变弱 = 假绿 |

## 四、母本下发与平台快照刷新（COO-55-1-2-1 的另一半）

1. **下发**：本规格的代码 + 规格 + 证据以一个原子提交落到母本仓 `main`（提交信息首行带 `[COO-55-1-2-1]`），
   并推到母本远端（`gitee/main`）—— 平台的 `scripts/degit.mjs` 走 **gitee 优先**，
   所以 `gitee/main` 是快照的取源远端（`github` 侧 `origin/main` 落后，本仓既有惯例即只推 gitee）。
2. **刷新**：平台侧以 degit 语义（仅 git 跟踪源码、零 git 历史）把 `xaicd/cooliebase-all#main`
   重新抽到 `/opt/coolie/blueprints/cooliebase-all`，并用平台 `scripts/blueprints-record.mjs`
   重新记录来源快照（`.blueprints-source.json` ⇒ commit / upstream / 文件数）。
3. **刷新后必跑一次派生冒烟**：好样本应绿；派生工作区（含 `scripts/check-workspace-executability.cjs`）
   跑平台侧 `runWorkspaceExecutabilitySmoke` ⇒ **`source=workspace-gate`**（不再走 `platform-static` 兜底）。

> 快照刷新的**机检结论**（提交 SHA / 快照 commit / 冒烟 source）随工单 COO-55-1-2-1 的协同评论留痕，
> 不在本文件二次誊抄，避免「文档追着事实跑」造成两处真相。

## 五、边界与遗留

- 本单**不改**平台侧接线（COO-55-1-2 已完成，`coolie` @ `f3ef139d10`）。
- 若新版门禁在派生侧需要调整（例如运行层在「依赖未安装」时误报红），按工单边界**回单平台侧 SRE**，
  不在本单私改判定口径。
- 母本 `pnpm run check` 需 `TMPDIR=/tmp`：Paperclip 运行目录路径过长时 `tsx` 的 IPC socket 会
  `EINVAL`（`listen EINVAL … /tmp/paperclip-run-…/tsx-501/….pipe`）—— 环境坑，非代码缺陷。
