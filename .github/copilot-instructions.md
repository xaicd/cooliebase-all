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
