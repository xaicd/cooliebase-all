# Claude Code Guidelines for cooliebase-all

This repository is `cooliebase-all`, an enterprise-grade fullstack platform built on Next.js 16 + React 19 + TypeScript 5, serving as a business project base and DigitalStaff NPC workspace template.

## Single Source of Truth for Rules & Two-Pillar Architecture
All engineering rules and architectural standards are unified in [`AGENTS.md`](AGENTS.md), [`HARNESS.md`](HARNESS.md), and `.agents/rules/`:
- **Pillar 1 — `harness` (`HARNESS.md` + `scripts/harness.cjs`) = Master Workflow & Lifecycle Specification**:
  `pnpm harness <install|check|build|start|health|status|stop|e2e|deliver>`
- **Pillar 2 — `speckit` (`pnpm run speckit`) + CMMI 00~09 Extensions (`scripts/cmmi-00-meta.cjs` ~ `scripts/cmmi-09-operations.cjs`) = Stage Document & Process Asset Engine**:
  `pnpm run speckit -- cmmi <00..09> [docs|check|asset|...]` (or `node scripts/cmmi-0X-*.cjs`)
- **Mandatory Rule 0**: `.agents/rules/RULE-0-UNIVERSAL-DIRECTIVES.md`
- **High-Order Inverse Thinking**: `.agents/rules/HIGH-ORDER-INVERSE-THINKING.md`
- **Spec-First Engineering**: `.agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md`
- **Unified Spec & Prototype Standard**: `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md`
- **Project Refactor & Init**: `.agents/rules/PROJECT-INIT-AND-REFACTOR.md`
- **Multi-Tenant Isolation**: `.agents/rules/MULTI-TENANT-ISOLATION.md`

## Project PMO & 4-Scenario AI Agent Playbook (Identical Across `coolie`, `cooliebase-all` & `yudao-quad-terminal`)
0. **Scenario 0 — Project PMO Instant Backlog & Next-Action Radar (CMMI-01)**:
   - Run `pnpm run pmo` (or `node scripts/cmmi-01-management.cjs pmo [--write|--json]` / `pnpm harness pmo`)
   - Inspect [`docs/01_management/pmo-dashboard.md`](docs/01_management/pmo-dashboard.md) for active WIP specs, unverified tasks `[T1..Tn]`, ready-to-archive specs, and the prioritized `P0 / P1 / P2` Next Action Queue.
1. **Scenario A — Zero-Pollution Sandbox Hatching (CMMI-01)**:
   `node scripts/cmmi-01-management.cjs init --name <slug> --title "<系统中文名>" --target /tmp/<slug>-sandbox`
   (or `pnpm run project:init -- --name <slug> --title "<系统中文名>" --target /tmp/<slug>-sandbox`)
2. **Scenario B — `<500 Tokens` Blueprint Fullstack Delivery + Embedded PostgreSQL 18.4 E2E (CMMI-03~05)**:
   - `node scripts/cmmi-03-design.cjs doctor --file <domain>.blueprint.json --write`
   - `node scripts/cmmi-04-implementation.cjs deliver --file <domain>.blueprint.json --verify-e2e`
   (or `pnpm run blueprint:deliver -- --file <domain>.blueprint.json --verify-e2e`)
3. **Scenario C — Feature / Bugfix / Refactor Iteration (Spec-Kit × CMMI 00~09)**:
   - `pnpm run agent:route -- "<用户的原始需求原文>"`
   - `pnpm run speckit:new -- --name <name> --domain <domain> --title "<title>" [--type feature|bugfix|enhancement|refactor]`
   - `pnpm run speckit:build -- --name <name>`
   - `pnpm run speckit -- cmmi 04 docs --spec <name>` & `pnpm run speckit:tasks -- --spec <name>`
   - `node scripts/cmmi-05-verification.cjs e2e`
   - `pnpm run check` & `pnpm run compat:check`
   - `pnpm run speckit:archive -- --name <name>`

## Execution Environment & Mac Host Bridge
- **Current Runtime**: Agent executes inside a Docker/container sandbox.
- **Mac Host Capabilities**: The workspace is mounted from the macOS host (`macdeMac-Studio.local arm64`).
- **Transparent Host Execution**: When macOS host tooling is needed (e.g. Xcode iOS Simulator, Android Emulator, host-native node/processes), use `host-exec "<command>"` or `bash scripts/host-exec.sh <command>`.

## Architecture & Contract Truth
- Canonical Domain Catalog: `packages/shared/backend/constants/domain-catalog.json`
- Compat Manifest: `packages/shared/contract/compat-manifest.json`
- Agent Profile: `packages/shared/contract/agent-profile.json`
- Seam Graph: `packages/shared/contract/seam-graph.json`

## 第一步（强制）：需求分诊

动手做任何需求之前，先跑：

    pnpm run agent:route -- "<用户的原始需求原文>"

它会给出**确定性判定**，而不是靠模型自行揣测：

- `SPEC_REQUIRED` → 先 `pnpm run speckit:new -- --name <名> --domain <域> --type <类型> --title "<标题>"`
- `DIRECT_OK` → 可直接改（改完仍须 `pnpm run check` 全绿）
- `NOT_A_REQUIREMENT` → 这句话不是一个需求（确认 / 授权 / 上下文陈述 / 调研提问 / 续作指令），既不立规格也不改代码

它同时把用户原始输入记入 `docs/features/sprint-prod/{MMDD}.md`（AGENTS §15）。
判定规则真源：`scripts/lib/spec-necessity-rules.cjs`。

---

## 工坊本地模型通道生存法则（层A 工坊规范 · 2026-11-06 沉淀）

> 本工作区的作业 agent 跑 claude_local + qwen3.8:27b-32k（cwall，num_ctx 硬上限 32000）。

1. **微步**：单次回复 ≤300 行；单次 Write ≤300 行，大文件拆多次追加，禁止一次生成整篇长文/长报告。
2. **限字**：最终回报 ≤100~150 字。
3. **按节读**：只读需求相关节；严禁通读本仓 AGENTS.md（~95K）与 prisma/schema.prisma（~50K）全文——按节检索。
4. **产出纪律**：run 状态不可信，完成与否以本仓 git log 为准；每波落盘 = 一次 git commit（信息含 [T<工单ID>]）。
5. **单飞**：一次只做一件被派的事，不自行并发多任务。

---

## C 端门户壳层规范 (PortalShell · 强制继承)

1. **统一蓝图壳层**：所有 `src/app/(portal-pages)/**` 下的 C 端页面（如 `/2c`、`/portal`、`/booking`、`/approvals` 等）必须使用 `src/app/(portal-pages)/components/portal-shell.tsx`（`<PortalShell>`）包裹，保留 `data-portal-shell="cooliebase-portal-v1"`、顶部毛玻璃品牌导航、深靛蓝点阵 Hero 抬头、`max-w-7xl` 响应式多列容器与标准页脚；严禁退化为裸 `<main className="max-w-md">` 窄盒。
2. **业务正门对齐**：非图书商城类派生项目必须将 `/2c`、`/portal` 及 `src/app/page.tsx` 替换为本项目的真实业务门户组件，严禁残留底座默认演示书城（`BookStorePortal` / `九夏书肆` / `电子书城`）。
3. **站内跳转反双前缀**：Next.js `<Link href="...">` 会自动拼接 `basePath`，因此 `<Link>` 的 `href` 一律传裸路径（如 `href="/admin"`、`href="/booking"`），严禁在 `<Link href>` 内再包一层 `apiPath(...)`。
