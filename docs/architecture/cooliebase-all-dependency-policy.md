# 依赖漏洞治理规范与已接受风险台账

更新时间：2026-10-19

本文件规定本仓**依赖供应链 CVE** 的治理方式，并逐条登记**当前未修复**的项及其理由与正解。

## 1. 为什么需要这份文档

本仓曾同时存在 4 critical / 31 high 的依赖漏洞，而**没有任何门禁看得见它们**：
`scripts/security-scan.cjs` 的 20 项全是运行时检查（能不能被打），不含 CVE（带的组件有没有已知洞）。
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

当前总量：**9** 条（critical 1 / high 5 / moderate 3）= **runtime 6 + client-toolchain 3**，
由基线逐条记录，**总数、逐包与逐层计数均可复现**。

> 2026-10-19 客户端 SDK 逐级升级（52 → 54 → 55 → 56 → 57 → 58）后的实测结果：
> **43 → 9 条**，共消掉 34 条（client-toolchain 33 → 3）。逐级账见 §3.2.1。

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
| `node-forge` | 1 | high | `Patched versions` 为空（`<=1.4.0`）。客户端工具链传递依赖。 |

这两条**不得**伪造成已修复；只能等上游发版或移除对应依赖。

（`sprintf-js` 原也在此列，随 2026-10-19 的 Expo SDK 逐级升级**已消失**，不再需要接受风险。）

### 3.2 客户端工具链残留（Expo SDK 升级后，3 条）

| 包 | 条数 | 严重度 | 传递来源 |
|---|---|---|---|
| `shell-quote` | 1 | **critical** | `react-native → react-devtools-core`（开发调试工具，不进 app bundle） |
| `uuid` | 1 | moderate | 客户端工具链传递依赖 |
| `node-forge` | 1 | high | 见 §3.1（同时无补丁） |

2026-10-19 已把 Expo SDK 从 52 **逐级升到 58**（实测 43 → 9 条）：原先列于本节的
`tar`(12) / `@xmldom/xmldom`(15) / `postcss`(4) / `image-size`(2) / `sprintf-js`(1)
**全部随升级消失**。本节原为「阻塞在上游大版本，37 条」，现只剩上述 3 条，
且都不再依赖"升 SDK"来解。

`shell-quote` 的 critical 仍属**开发调试链**（`react-devtools-core`），不进客户端产物；
`node-forge` 无补丁版本，见 §3.1。

#### 3.2.1 逐级升级执行结果（2026-10-19，已落地）

前置门禁先落地（`npm run clients:build:check`，见 `docs/specs/infra/client-build-gate/`），
随后按 `docs/specs/infra/expo-sdk-upgrade/` 逐级执行：**每级一次原子提交**，每级都跑
构建门禁 + 全量 `check` + 全量测试（**数量不写死**，以 `pnpm exec vitest run` 输出为准）。

| 级别 | 漏洞总数 | runtime / client | 本级主要变更 |
|---|---|---|---|
| 起点 SDK 52 | 43 | 10 / 33 | — |
| → 54 | 16 | 10 / 6 | react 18.3.1 → 19.1.0、RN 0.76.5 → 0.81.5 |
| → 55 | 10 | 6 / 4 | react 19.2.0、RN 0.83.10 |
| → 56 | 9 | 6 / 3 | react 19.2.3、RN 0.85.3 |
| → 57 | 9 | 6 / 3 | RN 0.86.3（本级无进一步消减，如实记录） |
| **→ 58（终）** | **9** | **6 / 3** | react 19.3.0（与根应用一致）、RN 0.88.0 |

**实测结论：43 → 9 条，共消掉 34 条**（client-toolchain 33 → 3）；
severity：critical 2 → 1、high 30 → 5、moderate 11 → 3。
无补丁可用项 3 → 2（`sprintf-js` 随升级消失，剩 `braces` / `node-forge`）。

> 与升级前那次**间接预判**相比：`tar` / `@xmldom/xmldom` / `postcss` / `image-size` /
> `sprintf-js` 确实全部消失（与预判一致）；但 **`shell-quote` 与 `uuid` 仍在**，
> 未如预判般随升级消失 —— 这正是「间接证据不能当结论」的实例，最终数字只能以实测为准。

### 3.3 阻塞在第三方包（本仓依赖图内）

| 包 | 条数 | 严重度 | 阻塞原因 |
|---|---|---|---|
| `mysql2` | 2 | high/moderate | 被报实例是 `prisma@7.10.0` 的**传递依赖** 3.15.3，不是本仓直接依赖。本仓用 PostgreSQL/SQLite，MySQL 路径完全未使用。 |
| `deepmerge-ts` | 1 | high | 构建期传递依赖；跨大版本（7→8）。 |
| `postcss-selector-parser` | 1 | moderate | 构建期传递依赖；跨大版本（6→7）。 |
| `source-map-js` | 1 | high | 构建期传递依赖（Next 工具链）。 |

（`postcss` 4 条原列于此，随 2026-10-19 的 Expo SDK 逐级升级**已消失**。加上 §3.1 的 `braces` 1 条，
runtime 层合计 6 条。）

`mysql2` 未采用 `pnpm.overrides` 强升：该依赖只因 Prisma 的多库支持被引入，
为一条**未使用的代码路径**新增 override 惯例去改 Prisma 的依赖解析，收益不抵风险。
正解是等 Prisma 上游升级其 mysql2 依赖，或本仓不再需要 MySQL 支持时移除。

## 3.1 物料清单与许可证事实（`npm run sbom:check`）

SBOM 由 `npm run sbom:generate` 从 `pnpm-lock.yaml`（包与版本）+ 已安装依赖的真实
`license` 字段派生，产物为 `docs/04_implementation/sbom.json` 与同名 `.md`，**禁止手写**。
漂移由 `npm run sbom:check` 判定（已接入 `npm run check`）。

实测快照（607 包：host 391 / client 216）：

| 事项 | 事实 |
|---|---|
| `LGPL-3.0-or-later` | `@img/sharp-libvips-darwin-arm64@1.3.4`（1 个）—— sharp 的图像处理原生库 |
| `MPL-2.0` | `lightningcss` 及其平台二进制（4 个）—— Tailwind/PostCSS 链路 |
| `UNKNOWN` | 110 个（18.1%），**全部是其他平台的可选二进制**（`@esbuild/linux-x64` 等）。它们在本机不安装，故读不到 `license` 字段 —— 这是读取口径的限制，不是锁文件缺信息 |

判定口径：`sbom:check` 只比较**包名 + 版本**，**不比较许可证列** —— 许可证来自安装树、
是环境相关的，纳入漂移判定会让门禁"换个平台就红"，那不是门禁该有的性质。

> **LGPL / MPL 属弱著佐权**：以依赖形式使用且未修改源码时通常可接受，
> 但**分发时必须随附其许可证文本**；一旦**修改其源码或静态链接**，就会触发开源义务。
> 本项目当前为未修改的依赖引用，风险可控；上述前提若变化，**需重新评审**。
> 这类事实应当在选型阶段就可见，而不是等法务问起。

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
| `npm run security:scan` | **能不能被打**（未认证、伪造 token/tenant、越权、栈泄露、安全响应头…20 项） | 需起应用；**本机零容器可跑**（嵌入式 Postgres），CI 仍为独立 job |
| `npm run deps:audit` | **带的组件有没有已知洞**（CVE 棘轮） | 只需联网查通告库，故放进 `check` 快链 |

## 6. 相关文件

- 门禁实现：`scripts/check-deps-audit.cjs`
- 基线（生成物）：`docs/architecture/artifacts/deps-audit-baseline.json`
- 回归测试：`test/unit/deps-audit-gate.test.ts`
- 立项规格：`docs/specs/infra/deps-vuln-remediation/`
