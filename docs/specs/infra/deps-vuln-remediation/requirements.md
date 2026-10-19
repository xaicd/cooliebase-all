# Requirements Specification: 依赖漏洞治理：生产树止血 + 依赖 CVE 门禁 + dev 树欠债冻结

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`security` | 所属领域：`infra` | 规格标识：`deps-vuln-remediation`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

消除生产运行时依赖的已知漏洞，并建立依赖 CVE 门禁使该类欠债不再无人看见：生产树强制 0 漏洞（enforce），dev/构建树以基线冻结既有欠债（ratchet，只拦新增）。


### 漏洞评级与威胁攻击面 (Vulnerability Advisory & Attack Surface)

- 漏洞概述与 PoC: 实测 `pnpm audit` 于本仓报出 53 条唯一通告（4 critical / 31 high / 17 moderate / 1 low），而 GitHub Dependabot 仅报 4 条（2 high / 2 moderate）——已抓取 GHSA-23hp-3jrh-7fpw（tar，CVE-2026-59873，critical）、GHSA-86w9-cpqp-85rv（node-forge，CVE-2026-85393，high）、GHSA-cjq9-62q9-8jv4（next，CVE-2026-94483，high）三条实锤，均为 GitHub 已审阅且带 CVE 编号的真实通告，故 53 为真、Dependabot 的 4 未扫全该 pnpm workspace。按依赖根分层后的真实暴露：生产运行时 8 条（next 6 条：>=16.0.0 <16.3.8，含 Image Optimization SSRF CVE-2026-94483；mysql2 2 条：<3.22.0 / <=3.23.0）；测试专属 4 条（tinypool 2 条 critical，随 vitest 3.2.7）；开发调试 1 条 critical（shell-quote 1.10.0，经 react-native > react-devtools-core，不进产物 bundle）；剩余约 38 条集中在 clients/expo > @expo/cli 工具链（tar 12 / @xmldom/xmldom 15 / postcss 4 / image-size 2 / node-forge / sprintf-js / uuid / braces），属构建期不在运行时。另有 3 条无补丁版本可用（node-forge <=1.4.0、braces <=3.0.3、sprintf-js <=1.1.3，Patched versions 均为空），升级无法解决。
- 攻击面削减: ① 生产 HTTP 面：Next.js 16.3.6 的 Image Optimization 存在 SSRF（CVE-2026-94483，可利用 images.remotePatterns 中的可控远端 URL 访问内网；若未配置 remotePatterns 则不受影响，但其余 5 条 next 通告另计）；② 数据访问面：mysql2 3.15.3 为真实生产依赖，被 packages/shared/backend/lib/database/kysely-client.ts、packages/domains/infra/backend/services/data-source-config.service.ts、packages/plugins/plugin-report/backend/services/custom-sql-report.service.ts 引用；③ 供应链面：clients/expo 的 @expo/cli 与 react-devtools-core 工具链含 tar / shell-quote 等 critical，属开发机构建期暴露（需开发机拉取恶意归档/调试工具时方可触发），不进入客户端产物。


## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 依赖漏洞治理：生产树止血 + 依赖 CVE 门禁 + dev 树欠债冻结 | deps-vuln-remediation | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为基座维护者] 建立依赖漏洞基线快照与按依赖根（生产/测试/构建工具链）分层台账，作为 ratchet 真源

2. **P0** [作为基座维护者] S1 生产树止血：next 升至 >=16.3.8、mysql2 升至 >=3.23.1（含 packages/plugins/plugin-pay 的 next 声明）

3. **P0** [作为基座维护者] S2 新增依赖 CVE 门禁：新增 `scripts/check-deps-audit.cjs` 与 `npm run deps:audit`，--prod 走 enforce、全树走 ratchet

4. **P0** [作为基座维护者] 门禁接线并配正反向测试，证明它会真的 fire（未验证的机制等于不存在）

5. **P1** [作为基座维护者] S3 dev/构建树升级（Expo/CLI/测试工具链）；3 条无补丁项转已接受风险台账

## 4. 关键业务不变量 (Key Business Invariants)

1. **生产树零漏洞** —— deps:audit --prod 以 enforce 模式断言生产 importer 层漏洞数为 0，违规直接 exit!=0
2. **门禁必须证明会 fire** —— 配正向（当前状态通过）与反向（人为注入一条新增漏洞后必须被拦）双向测试；反向测试按既有惯例在跑完后恢复现场

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0
2. **THE system SHALL** 验证：`npm run deps:audit -- --prod` exit=0（生产树漏洞数 = 0）
3. **THE system SHALL** 验证：`npm run deps:audit`（全树 ratchet）exit=0，且产出与 `docs/architecture/artifacts/deps-audit-baseline.json` 一致；人为新增一条不存在的漏洞版本后必须被拦下
4. **THE system SHALL** 验证：`npm run security:scan` exit=0（既有运行时 12 项不回退）
5. **THE system SHALL** 验证：`pnpm why next`/`pnpm why mysql2` 显示生产路径实际解析到 >=16.3.8 / >=3.23.1

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 分批推进：S1 生产树止血先行且独立可验证，S3 dev 树批量升级单独一轮，禁止一次性盲升全树。
* **THE system SHALL COMPLY WITH**: 单一锁文件真源：只允许 pnpm 操作（pnpm update / --frozen-lockfile），不得引入 package-lock.json 或第二份锁。
* **THE system SHALL COMPLY WITH**: 零破坏性：升级后 `npm run check`、`npm run security:scan`、全量测试必须全绿；不得为通过门禁而放宽既有契约。
* **THE system SHALL COMPLY WITH**: 禁止为消除告警而凭空造定义：3 条无补丁版本的通告不得伪造成已修复，必须落「已接受风险」台账并写明依据。
* **THE system SHALL COMPLY WITH**: 门禁不得自判通过：只报出真实漏洞事实与退出码，不引入推测性放行；基线只允许通过显式命令刷新。

### 明确不做与负向范围 (Non-Goals)
* 不引入商业 SCA/Snyk 类重型第三方依赖（沿用 pnpm 内置 audit）
* 不在本轮修复 3 条无补丁版本的通告（转已接受风险台账）
* 不改动 clients/expo 的应用代码或 Expo SDK 主版本
* 不做依赖架构重构（如替换 mysql2 驱动）
