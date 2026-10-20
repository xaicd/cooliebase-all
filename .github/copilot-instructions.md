# GitHub Copilot Instructions for cooliebase-all

This workspace is `cooliebase-all`, an enterprise-grade fullstack platform built on Next.js 16 + React 19 + TypeScript 5.

## Architecture & Technology Stack
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Database: Kysely query builder + SQLite (local development) / PostgreSQL (production)
- Multi-tenancy: Strictly obtain tenant scope from `getCurrentTenantId()`, never pass explicit tenantId across layers.
- Project Initialization: Use `npm run project:init` to customize project names, titles, and remotes.
- Quality Gates: Must pass `npm run check` and `npm run test:unit`.
- Spec-Driven Architecture: Review `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md`. All features, bugfixes, enhancements, and refactors are governed by Spec Bundles in `docs/specs/<domain>/<name>` with `assets/` and `prototypes/`. Commands: `npm run spec:new`, `npm run spec:build`, `npm run spec:check`, `npm run spec:archive`.
- Detailed Rules: Review `AGENTS.md`, `CLAUDE.md`, and `llms.txt`.

## 第一步（强制）：需求分诊

动手做任何需求之前，先跑：

    npm run agent:route -- "<用户的原始需求原文>"

它会给出**确定性判定**，而不是靠模型自行揣测：

- `SPEC_REQUIRED` → 先 `npm run speckit:new -- --name <名> --domain <域> --type <类型> --title "<标题>"`
- `DIRECT_OK` → 可直接改（改完仍须 `npm run check` 全绿）
- `NOT_A_REQUIREMENT` → 这句话不是一个需求（确认 / 授权 / 上下文陈述 / 调研提问 / 续作指令），既不立规格也不改代码

它同时把用户原始输入记入 `docs/features/sprint-prod/{MMDD}.md`（AGENTS §15）。
判定规则真源：`scripts/lib/spec-necessity-rules.cjs` —— 规则表可审阅、可修改；
**认为判错了就改规则表**（并跑 `test/unit/agent-route.test.ts`），而不是绕过它。

> 为什么强制：此前入口文件写的是"所有 feature/bugfix/enhancement/refactor 都归规格管"，
> 等于**全都需要、也等于没有判断** —— 小改被流程拖住、大改靠自觉。
