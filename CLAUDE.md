# Claude Code Guidelines for cooliebase-all

This repository is `cooliebase-all`, an enterprise-grade fullstack platform built on Next.js 16 + React 19 + TypeScript 5, serving as a business project base and DigitalStaff NPC workspace template.

## Single Source of Truth for Rules
All engineering rules and architectural standards are unified in `.agents/rules/` and `AGENTS.md`.
- **Mandatory Rule 0**: `.agents/rules/RULE-0-UNIVERSAL-DIRECTIVES.md`
- **High-Order Inverse Thinking**: `.agents/rules/HIGH-ORDER-INVERSE-THINKING.md`
- **Spec-First Engineering**: `.agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md`
- **Unified Spec & Prototype Standard**: `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md`
- **Project Refactor & Init**: `.agents/rules/PROJECT-INIT-AND-REFACTOR.md`
- **Multi-Tenant Isolation**: `.agents/rules/MULTI-TENANT-ISOLATION.md`
- **10 Quality Gates**: `AGENTS.md`

## Key Developer Commands
- **Check All Gates**: `npm run check` (Runs all 10 engineering standards, seam checks, compat checks, admin route audits)
- **Run Unit Tests**: `npm run test:unit` (Runs Vitest suite)
- **Spec-Driven Lifecycle**:
  - `npm run spec:new -- --name <name> --domain <domain> --title "<title>" [--type feature|bugfix|enhancement|refactor]`
  - `npm run spec:build -- --name <name>`
  - `npm run spec:check -- --feature <name>`
  - `npm run spec:archive -- --name <name>`
- **Bootstrap Local SQLite DB**: `npm run db:bootstrap:sqlite` (Creates `data/cooliebase.db` with standard 8 audit columns, boots supervip user, and generates secure password)
- **Start Dev Server**: `pnpm dev` (Runs on http://localhost:3200, credentials: `supervip` with password in `.env.local`)
- **Project Refactor / Init**: `npm run project:init` (or `npm run project:refactor`)
- **Login Smoke Test**: `npm run smoke:login`

## Execution Environment & Mac Host Bridge
- **Current Runtime**: Agent executes inside a Docker/container sandbox.
- **Mac Host Capabilities**: The workspace is mounted from the macOS host (`macdeMac-Studio.local arm64`).
- **Transparent Host Execution**: When macOS host tooling is needed (e.g. Xcode iOS Simulator, Android Emulator, host-native node/processes, inspecting host dev environments like coolie), use:
  `bash scripts/host-exec.sh <command>` (automatically authenticated via SSH key without prompt).

## Architecture & Contract Truth
- Canonical Domain Catalog: `packages/shared/backend/constants/domain-catalog.json`
- Compat Manifest: `packages/shared/contract/compat-manifest.json`
- Agent Profile: `packages/shared/contract/agent-profile.json`
- Seam Graph: `packages/shared/contract/seam-graph.json`
