# 依赖漏洞治理规范与已接受风险台账

更新时间：2026-10-19

本文件规定本仓**依赖供应链 CVE** 的治理方式，并逐条登记**当前未修复**的项及其理由与正解。

## 1. 为什么需要这份文档

本仓曾同时存在 4 critical / 31 high 的依赖漏洞，而**没有任何门禁看得见它们**：
`scripts/security-scan.cjs` 的 12 项全是运行时检查（能不能被打），不含 CVE（带的组件有没有已知洞）。
两者职责不同，都要有 —— 现在后者由 `npm run deps:audit` 承担。

另一个教训：**以 GitHub Dependabot 的告警数为准会严重低估**。它当时报 4 条（2 high / 2 moderate），
而 `pnpm audit` 实测 53 条；抽查三条 GHSA 确认全部是 GitHub 已审阅且带 CVE 编号的真实通告，
即**Dependabot 没扫全这个 pnpm workspace**。所以本仓的门禁直接读 `pnpm audit`，不依赖平台告警面。

## 2. 门禁：`npm run deps:audit`（棘轮语义）

实现：`scripts/check-deps-audit.cjs`。已接入 `npm run check`（见 AGENTS.md §6）。

| 行为 | 说明 |
|---|---|
| `npm run deps:audit` | 与基线逐条比对，**只拦新增**；有新增则 exit 1 |
| `npm run deps:audit:baseline` | 重新冻结基线（**等于接受当前所有洞**，必须逐条复核增量后再提交） |
| `node scripts/check-deps-audit.cjs --audit` | 打印全量分层结果，**永不失败** |
| `--json` | 机器可读（供 MCP / CI 消费） |

**棘轮不是"没问题"。** 门禁通过的确切含义是「相对基线没有**新增**」，不是「仓库没有漏洞」。
基线 `docs/architecture/artifacts/deps-audit-baseline.json` 是**生成物**，由脚本产出，禁止手改。

分层由**锁文件的依赖图离线推导**（不写死包名，也不读审计输出的采样字段）：

- `runtime` —— 可从本仓项目（`.` 与 `packages/**`）的依赖图走到，即**出现在本仓自己的依赖图里**；
- `client-toolchain` —— 其余（当前即 `clients/expo → @expo/cli / react-devtools-core`）。

> ⚠️ 标签 `runtime` **不等于「生产运行时」**：它只表示"能从本仓项目的依赖图走到"，
> **包含 devDependencies 链**。例如 `braces` 之所以是 `runtime`，走的是
> `tailwindcss → chokidar → braces`（tailwindcss 是根项目的 devDependency），
> 并不在生产运行时路径上。读这个标签时请按此语义理解。

`runtime` 是全体子集，故门禁只实现「全树不新增」一条规则：它严格强于「runtime 层不新增」。
分层只用于**展示影响半径**，不参与判定。

当前总量：**43** 条（critical 2 / high 30 / moderate 11）= **runtime 10 + client-toolchain 33**，
由基线逐条记录，**总数、逐包与逐层计数均可复现**。

> 分层判据的历史（2026-10-19 已修）：原先取自 `pnpm audit` 的 `findings[].paths`，而 pnpm
> **对多父级包会截断该列表**（人类可读输出里写着「Found 8 paths」却只列 3 条）。
> `braces` 恰有两个父级，截断时只剩 expo 那条 → 同一状态连跑三次得到 **5 / 5 / 6**；
> 且把 `postcss` 误标为 client-toolchain（`pnpm why -r` 实测它有 **6 条 host 根链**：
> next / autoprefixer / postcss-import / tailwindcss 均在 `cooliebase-all` 之下）。
> 现改为从 `pnpm-lock.yaml` 离线推导（真源即依赖图本身），结果确定可复现 ——
> 连续 3 次运行的全量 (key, tier) 指纹完全一致。依据：`docs/specs/infra/deps-audit-tier-determinism/`。

失败方向的两个坑（实现里已显式处理）：
1. `pnpm audit` **有漏洞时自身返回非 0** —— 那不是工具失败，不能据此判定；
2. 反过来，拿不到 JSON 输出时**绝不能当作 0 漏洞通过**（静默放行），已 fail-loud。

## 3. 已接受风险台账

「已接受」= 已评估、有明确理由、有正解路径，**不是被遗忘**。任何一条若要长期保留，
必须在此有记录；修复后从本表移除并刷新基线。

### 3.1 无补丁可用（升级根本解决不了）

| 包 | 条数 | 严重度 | 处置 |
|---|---|---|---|
| `braces` | 1 | high | `Patched versions` 为空。两个父级链（`pnpm why braces` 实测）：`tailwindcss → chokidar`（根 devDependency）与 `react-native → babel-jest → micromatch`。待上游发版，或改用其它解析/监听链。 |
| `node-forge` | 1 | high | `Patched versions` 为空（`<=1.4.0`）。`clients/expo` 工具链传递依赖。 |
| `sprintf-js` | 1 | moderate | `Patched versions` 为空（`<=1.1.3`）。同上。 |

这三条**不得**伪造成已修复；只能等上游，或移除对应依赖。

### 3.2 阻塞在上游大版本（Expo 客户端构建工具链，33 条）

| 包 | 条数 | 严重度 | 传递来源 |
|---|---|---|---|
| `@xmldom/xmldom` | 15 | high/moderate | `clients/expo → @expo/cli` |
| `tar` | 12 | **critical**/high/moderate | 同上 |
| `image-size` | 2 | high | 同上 |
| `shell-quote` | 1 | **critical** | `react-native → react-devtools-core` |
| `uuid` | 1 | moderate | `@expo/cli` |
| `node-forge` / `sprintf-js` | 各 1 | high/moderate | 见 §3.1（同时无补丁） |

（`postcss` 4 条原列于此，经锁文件推导**改判为 `runtime`** —— 它有 6 条 host 根链，详见 §3.3。）

**为什么接受**：这些全部是**客户端构建/调试工具链**依赖，不进 app bundle，也不在本仓服务端运行时路径上；
要修只能二选一 ——

1. 升 `expo` SDK 大版本（会连带 react-native 与 React 一起动，属对客户端应用的破坏性变更）；
2. 用 `pnpm.overrides` 强改跨大版本的传递依赖（`tar` 6→7、`@xmldom/xmldom` 0.7→0.9、
   `uuid` 7→11、`image-size` 1→2 …）。

**正解**：走第 1 条 —— 作为独立事项排期升级 Expo SDK，并为其补一条能被验证的客户端构建门禁。
在**没有任何 Expo 构建门禁**的情况下强推第 2 条，等于用不可验证的风险换数字好看，
所以本次**刻意不做**（宁可如实记录，也不假装做完）。

### 3.3 阻塞在第三方包（本仓依赖图内）

| 包 | 条数 | 严重度 | 阻塞原因 |
|---|---|---|---|
| `mysql2` | 2 | high/moderate | 被报实例是 `prisma@7.10.0` 的**传递依赖** 3.15.3，不是本仓直接依赖。本仓用 PostgreSQL/SQLite，MySQL 路径完全未使用。 |
| `postcss` | 4 | high/moderate | 构建期传递依赖；`pnpm why -r` 实测 **6 条 host 根链**（next / autoprefixer / postcss-import / tailwindcss 均在 `cooliebase-all` 之下），故属 runtime。 |
| `deepmerge-ts` | 1 | high | 构建期传递依赖；跨大版本（7→8）。 |
| `postcss-selector-parser` | 1 | moderate | 构建期传递依赖；跨大版本（6→7）。 |
| `source-map-js` | 1 | high | 构建期传递依赖（Next 工具链）。 |

`mysql2` 未采用 `pnpm.overrides` 强升：该依赖只因 Prisma 的多库支持被引入，
为一条**未使用的代码路径**新增 override 惯例去改 Prisma 的依赖解析，收益不抵风险。
正解是等 Prisma 上游升级其 mysql2 依赖，或本仓不再需要 MySQL 支持时移除。

## 4. 禁止项

1. **禁止手改基线**：基线是生成物，只能由 `npm run deps:audit:baseline` 产出；手改即制造漂移，
   且 T5 的一致性用例（基线 == 当前扫描）会正确地拦下。
2. **禁止把"冻结"说成"无漏洞"**：门禁输出措辞固定为 `frozen in baseline` + `no NEW advisory`。
3. **禁止伪装修复**：无补丁项只能如实登记（§3.1），不得标为已修。
4. **禁止为了过门禁而放宽判据**（例如把 severity 阈值调高以跳过 critical）。
5. **禁止在未验证的前提下强推跨大版本 override**：见 §3.2 正解。

## 5. 与 `security:scan` 的分工

| 门禁 | 测什么 | 依赖环境 |
|---|---|---|
| `npm run security:scan` | **能不能被打**（未认证、伪造 token/tenant、越权、栈泄露、安全响应头…12 项） | docker + DB + 起应用，故为独立 CI job |
| `npm run deps:audit` | **带的组件有没有已知洞**（CVE 棘轮） | 只需联网查通告库，故放进 `check` 快链 |

## 6. 相关文件

- 门禁实现：`scripts/check-deps-audit.cjs`
- 基线（生成物）：`docs/architecture/artifacts/deps-audit-baseline.json`
- 回归测试：`test/unit/deps-audit-gate.test.ts`
- 立项规格：`docs/specs/infra/deps-vuln-remediation/`
