# 版本发布说明书 (Release Notes: v1.4.0 — Brand-Shorthand)

- **受控编号**: `COOLIEBASE-REL-2026-v1.4.0-brand-shorthand`
- **基线版本**: `v1.4.0-brand-shorthand` (Git Tag: `v1.4.0-brand-shorthand`)
- **发布日期**: 待 GitHub 仓 rename 后定 (建议: rename 同窗口)
- **密级标识**: 内部公开 (Public Internal)
- **归属规范**: CMMI 07_release (TRANS) / `.agents/skills/cmmi-asset-authoring` / `.agents/skills/devops`
- **质量门禁状态**: **10 道全自动化门禁 100% 通过 (Exit Code 0)** | **pre-existing unit-test 5 项已知遗留 (scripts/spec-ops.ts 已被 speckit 统一引擎取代)**
- **前序基线**: `v1.3.0-ruoyi-removed` (品牌 2.0 — `ruoyi → cooliebase`) → `v1.4.0-brand-shorthand` (品牌 2.1 — `cooliebase-all-base → cooliebase-all`)
- **对标标准**: CMMI V2.0/V3.0 Level 3+ / IEEE 29148 / Google SRE / 运营商级软件工程交付规范

---

## 🎯 本版本一句话定位

**品牌 ID 缩短**:把上一轮 (`v1.3.0-ruoyi-removed`) 引入的 `cooliebase-all-base` 全部缩短为 `cooliebase-all`,保证 npm 包名、GitHub 仓名、`.well-known/agent.json` 三者 ID 完全一致。**纯字符串级 brand polish,非业务语义重命名。**

---

## 🌟 变更摘要 (Changes)

### 1. 品牌 ID 缩短 (Brand-Shorthand)

| 层级 | 旧值 (v1.3.0) | 新值 (v1.4.0) | 形式 |
|---|---|---|---|
| **GitHub 仓** (D1,浏览器 forward action) | `xaicd/cooliebase-all-base` | `xaicd/cooliebase-all` | kebab-case |
| **npm 包名** (B3 / D3) | `next-all-base` | `cooliebase-all` | kebab-case |
| **AI discovery — model id** (B2 / D4) | `cooliebase_all_base` | `cooliebase_all` | snake_case |
| **AI discovery — human name** (B2 / D4) | `CoolieBase All Base` | `CoolieBase All` | PascalCase (3 词) |
| **Docker 镜像 tag** (B5 / D6) | `cooliebase-all-base[:domain]` | `cooliebase-all[:domain]` | kebab-case |
| **品牌全名 (3 词,去 -base)** (D2) | `CoolieBase All Base` | `CoolieBase All` | PascalCase |

**变更范围**:
- 内容编辑: 186 文件 / 2576 行(纯字符串替换,无逻辑变更)
- 文件 rename: 0 (计划原列 2 个 `cooliebase-all-base-*.md` 不存在,跳过)
- 结构编辑: 1 行 (`package.json:name` `next-all-base → cooliebase-all`)
- 仓 rename: GitHub Settings 浏览器操作,301 重定向覆盖 90 天外链

### 2. Agent 发现表面一致性 (AI Discovery Surface)

- `.well-known/agent.json` (4 个 mirror 同步: 根 + `public/`)
  - `name_for_model`: `cooliebase_all_base` → `cooliebase_all`
  - `name_for_human`: `CoolieBase All Base` → `CoolieBase All`
  - `hatch.recommended_workflow[0]` + `hatch.one_line_curl` + `hatch.degit` 全部从 `xaicd/cooliebase-all-base` 切到 `xaicd/cooliebase-all`
- `packages/shared/contract/compat-manifest.json` (3 个 mirror 同步) — `framework.name` + `consumptionSurface.hatch.{oneLine,degit}` 同步
- `llms.txt` + `llms-full.txt` (4 个 mirror 同步: 根 + `.well-known/` + `public/` × 2) — 6 处 GitHub URL + 2 处品牌标题
- `agent-profile.json` + `project-profile.json` — 品牌字段同步

外部 Agent 启动时读到的 ID 现在与 npm 包名、GitHub URL **三者一致**,在 GitHub 仓 rename 同窗口期内同步改,保证 hermes/DSH/Claude Code/Cursor 启动读到一致 brand ID。

### 3. 文档与契约同步

- `AGENTS.md` 标题 (`# cooliebase-all-base 开发工作手册` → `# cooliebase-all 开发工作手册`)
- `AGENTS.md §10.2` Docker 构建示例 (`cooliebase-all-base` / `cooliebase-all-base-domain` → `cooliebase-all` / `cooliebase-all-domain`)
- `AGENTS.md:1` rename 标记: `<!-- rename/cooliebase-to-cooliebase active -->` → `<!-- rename/cooliebase-all-base-to-cooliebase-all active -->` (本轮 marker,合并后清)
- 38 个 docs/architecture/ + 41 个 docs/architecture/artifacts/ 文档全部同步
- 20 个 scripts/ 头部注释同步
- 4 个 `.agents/rules/` 文档同步
- 6 个 `deploy/` (docker-compose × 5 + README) 同步

---

## ❌ 明确不在本版本范围 (Out of Scope — 已知遗留 / 故意保留)

| # | 遗留项 | 原因 | 后续计划 |
|---|---|---|---|
| **L1** | Go `option go_package = "cooliebase/all-base/gen/<domain>/v1"` in 17 `.proto` files | Go module path 是 wire-stable,前序 v1.3.0 plan 决策 #3 已锁定该格式;Go module publish 触发的迁移会破坏 client 端依赖图 | 等 Go 端真正需要 publish 时另起 plan |
| **L2** | `prisma/data/cooliebase-all-base-local_cooliebase_next_export.sql` 文件名 | 一次性 bootstrap 快照,checksum-protected,rename 会失效 | 不计划,记录在档 |
| **L3** | `dist/release-assets/cooliebase-all-base-v1.3.0-ruoyi-removed-skeleton.tar.gz` | 冻结 tag 资产,gitignored,不影响 commit | 留作历史归档,新 release 资产用新 brand |
| **L4** | `scripts/spec-ops.ts` 引用,`test/unit/spec-driven-agent-workflow.test.ts` 5 项单测失败 | pre-existing on main (commit `d158d1f1` 已 retire spec-ops,改用 speckit 统一引擎,测试未跟改) | 独立单测迁移 ticket,不在本轮 |

---

## ⚠️ 风险登记关闭 (Risk Register Closeout)

| # | 风险 | 关闭方式 |
|---|---|---|
| **R1** | `pnpm-lock.yaml` 仍引用 `next-all-base` 导致 build 阻断 | `pnpm install` 重新生成,`--frozen-lockfile` 复测 PASS (657 packages,lockfile up to date) |
| **R2** | GitHub 仓 rename 期间 301 重定向,内部 URL 必须同步 | sed 同步所有内部 URL,GitHub 仓 rename 是 forward action,301 覆盖外链 |
| **R3** | `package.json:version` 与 `v1.4.0` tag 不一致 | 保守默认不 bump version (保持 1.2.0);tag 显式命名 `v1.4.0-brand-shorthand` 表明语义层级 |
| **R4** | pre-existing `cooliebase-all` (无 -base) 触发 double-rename | 24 个 pre-existing 文件**不在** 186 rename 列表中,经 sed 验证安全(无残留) |
| **R5** | `AGENTS.md:1` marker stale | 本轮 marker `rename/cooliebase-all-base-to-cooliebase-all`,合并后清 (D5) |
| **R6** | `prisma/data/cooliebase-all-base-local_*.sql` 文件名 | 见 L2 |
| **R7** | Go `go_package` 17 个 .proto 不动 | 见 L1 |
| **R8** | `hatch.sh` 单行 curl URL 变化 | sed 同步,老 URL 走 GitHub 301 重定向 90 天 |
| **R9** | `clients/README.md` + `.cursor/rules/cooliebase-rules.mdc` 引用 brand | sed 同步命中 |
| **R10** | public mirror parity 破损 | Verification V3 三对 critical mirror (compat-manifest / agent-profile / agent.json) byte-identical |
| **R11** | `compat-manifest.json:framework.templateVersion` 与 `package.json:version` 关系 | 保持 `templateVersion: "1.2.0"` 不动 (注释明确:templateVersion 跟踪 TEMPLATE,hatched project 自带 version) |

---

## 🔁 推送与发布流程 (Forward Action)

| 步骤 | 动作 | 责任人 | 时机 |
|---|---|---|---|
| 1 | Squash merge `brand/cooliebase-all-shorten` → `main` (3 commits → 1) | 仓管理员 | PR review 后 |
| 2 | Push tag `v1.4.0-brand-shorthand` 到 origin + Gitee | 仓管理员 | squash merge 同 PR 流程内 |
| 3 | **GitHub Settings → Rename** `cooliebase-all-base` → `cooliebase-all` (D1) | **你 (浏览器)** | tag push 之后,等 301 重定向生效 |
| 4 | `git remote set-url origin` + gitee 到新 URL | 仓管理员 | rename 之后 |
| 5 | `npm run release:package` 重打 skeleton tar (新 brand) | 仓管理员 | rename 之后 |
| 6 | **推送 GitHub/Gitee Release 页面** (本 notes + 新资产) | 仓管理员 | **v1.4.0 正式发布动作** |

**重要**:第 6 步不在 PR 流程内,需独立动作,需要本 notes 已合并到 main 才执行。

---

## 📋 交付与审核签署表 (RACI Sign-Off)

| 角色 | 签署部门 / 团队 | 责任人 | 审计意见与签名 | 签署日期 |
|---|---|---|---|---|
| **编制人 (Author)** | AI Agent 自动化工程团队 | @wf-planner / @agent-team | 186 文件 / 2576 行,字符串级 brand polish,3 commit 链 | 2026-10-18 |
| **架构审查人 (Architect)** | 技术委员会 / 架构部 | @wf-architect / @architect-team | 8 critical anchor (B1-B8) lockstep 通过,mirror parity 验证 | 2026-10-18 |
| **质量合规人 (QA/PPQA)** | 质量保障部 (PPQA) | @compliance-auditor | 10 大门禁 Exit Code 0,4 项 critical mirror byte-identical,11 项风险全部 close | 2026-10-18 |
| **SRE 运维签署人 (SRE/Ops)** | 基础设施与高可用 SRE 组 | @devops / @sre-team | `pnpm install` 657 packages,`--frozen-lockfile` 复测 PASS,`prisma generate` 正常 | 2026-10-18 |

---

## 📜 文档索引 (References)

- [AGENTS.md](../../AGENTS.md) — 仓库最高优先级工程铁律与 10 大门禁
- [CURRENT.md](../../CURRENT.md) — Release Source of Truth
- [`docs/features/sprint-prod/0918.md`](../features/sprint-prod/0918.md) — 本轮 sprint 详情
- [`.well-known/agent.json`](../../.well-known/agent.json) — AI discovery 主面
- [`packages/shared/contract/compat-manifest.json`](../../packages/shared/contract/compat-manifest.json) — 兼容性与能力全景清单
- [本 plan 归档](../../.claude/plans/sprightly-sauteeing-castle.md) — 完整 8 锚点 + 11 项风险登记
