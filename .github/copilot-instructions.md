# GitHub Copilot Instructions for cooliebase-all

This workspace is `cooliebase-all`, an enterprise-grade fullstack platform built on Next.js 16 + React 19 + TypeScript 5, with zero-Docker Embedded PostgreSQL 18.4 (`embedded-postgres`) and SQLite support.

## Architecture & Two-Pillar Engineering System
- **Pillar 1 — `harness` (`HARNESS.md` + `scripts/harness.cjs`) = Master Workflow & Lifecycle Specification**:
  `pnpm harness <install|check|build|start|health|status|stop|e2e|deliver>`
- **Pillar 2 — `speckit` (`pnpm run speckit`) + CMMI 00~09 Extensions (`scripts/cmmi-00-meta.cjs` ~ `scripts/cmmi-09-operations.cjs`) = Stage Document & Process Asset Engine**:
  `pnpm run speckit -- cmmi <00..09> [docs|check|asset|...]`
- **Zero-Pollution Sandbox Hatching**: `pnpm run project:init -- --name <slug> --title "<系统名>" --target /tmp/<slug>-sandbox`
- **`<500 Tokens` Blueprint + Embedded PostgreSQL 18.4 E2E**: `pnpm run blueprint:deliver -- --file <domain>.blueprint.json --verify-e2e`
- **Multi-tenancy**: Strictly obtain tenant scope from `getCurrentTenantId()`, never pass explicit tenantId across layers.
- **Spec-Driven Architecture**: Review `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md`. Commands: `pnpm run spec:new`, `pnpm run spec:build`, `pnpm run spec:check`, `pnpm run spec:archive`.
- **Detailed Rules**: Review `AGENTS.md`, `HARNESS.md`, `CLAUDE.md`, and `llms.txt`.

## 第一步（强制）：需求分诊

动手做任何需求之前，先跑：

    pnpm run agent:route -- "<用户的原始需求原文>"

它会给出**确定性判定**，而不是靠模型自行揣测：

- `SPEC_REQUIRED` → 先 `pnpm run speckit:new -- --name <名> --domain <域> --type <类型> --title "<标题>"`
- `DIRECT_OK` → 可直接改（改完仍须 `pnpm run check` 全绿）
- `NOT_A_REQUIREMENT` → 这句话不是一个需求（确认 / 授权 / 上下文陈述 / 调研提问 / 续作指令），既不立规格也不改代码

它同时把用户原始输入记入 `docs/features/sprint-prod/{MMDD}.md`（AGENTS §15）。
判定规则真源：`scripts/lib/spec-necessity-rules.cjs`。
