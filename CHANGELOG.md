# Changelog

All notable changes to **`cooliebase-all`** are documented in this file.
For detailed release artifacts and channel tag policy, see [`docs/07_release/release-notes.md`](docs/07_release/release-notes.md) and [`docs/07_release/releases/`](docs/07_release/releases/).

---

## [1.5.0] - 2026-11-16

### Added
- **Quad-Terminal 4th Terminal (`clients/miniapp`)**: Added Uni-App Vue 3 + TypeScript + Vite multi-platform WeChat MiniApp & H5 client (`@cooliebase/clients-miniapp`), including dynamic `BASE_PATH` / `VITE_API_BASE_URL` request wrapper (`clients/miniapp/src/utils/request.ts`), `wx.login` silent auth helper, iPhone safe-area adaptation, `subPackages` config, and 4 concise TabBar pages (`首页`, `分类`, `工作台`, `我的`), wired into `client-channels`, `compat-manifest.json`, `check-client-build.cjs`, `clone-project-base.cjs`, and `project-init.cjs`.
- **19 Native Enterprise Domains (+1 `online` = 20 Total Domains)**: Added `<500-token` schema metadata `scripts/data/{oa,hrm,fms,pms}-tables.ts` and generated first-party plugins `packages/plugins/plugin-{oa,hrm,fms,pms}` (`OaNotice`, `OaAttendance`, `OaLeaveApply`, `HrmEmployee`, `HrmPosition`, `HrmPayroll`, `FmsAccount`, `FmsVoucher`, `FmsReconcile`, `PmsProject`, `PmsMilestone`, `PmsTimesheet`) with item route `[id]/route.ts` support in `CodegenEngineService` (`354` total Agent contracts across `19` contract-bearing domains).
- **Cross-Blueprint CLI & Gate Alias Parity**: Added `project:reactor`, `gates:23`, `gates:23:static` (`scripts/audit-23-gates.cjs`), `gen:three-role` (`scripts/scaffold-three-role-audit.cjs`), `domain:prune` / `trim:modules` / `trim:check` (`scripts/domain-prune.cjs`), `gateway:gen` (`scripts/render-gateway-conf.mjs`), `verify:b0`..`verify:b5`, and `dev:miniapp` / `build:miniapp` / `dev:app` / `build:admin`.
- **Automated Release Pipeline**: Added `docs/07_release/releases/v1.5.0.md`, updated `scripts/build-release-assets.cjs`, and verified `.github/workflows/release.yml` skeleton archive + `SHA256SUMS.txt` publication.

### Changed & Removed
- **Unified `docs/` Single-Directory Consolidation**: Consolidated `docs/wiki/`, `docs/specs/`, `docs/07_release/releases/`, and `docs/audit/` exclusively under `docs/`, removing legacy top-level `wiki/`, `openwiki`, `specs`, and `releases/` paths and enforcing root hygiene in `scripts/check-specs-health.cjs`.
- **Custom Vertical Plugin Boundary Cleanup**: Decoupled `plugin-ai` OpenAI-compatible routes from vertical channel billing, removed historical custom vertical plugin from `packages/plugins/`, and emptied `KNOWN_CUSTOM` in `scripts/check-engineering-standards.cjs`.
- **Core Documentation Accuracy Alignment**: Aligned `README.md`, `AGENTS.md`, `HARNESS.md`, `SWARM.md`, `CURRENT.md`, `project-status.md`, `llms.txt`, `llms-full.txt`, `.well-known/*`, `clients/README.md`, `deploy/README.md`, and `docs/architecture/*` with `v1.5.0` physical repository truth (`docs/audit/2026-11-16-core-docs-accuracy-audit.md`).

---

## [1.4.0-brand-shorthand] - 2026-10-18
- Unified brand shorthand identifiers across workspace packages and discovery contracts.

## [1.3.0-ruoyi-removed] - 2026-10-18
- Neutralized upstream legacy branding across white-label hatching templates.

## [1.2.0] - 2026-10-10
- Established modular monolith + progressive first-party plugin architecture baseline (`compat.framework.templateVersion` `1.2.0`).

## [1.1.0] - 2026-10-09
- Expanded real-database testing pyramid and CMMI 01~09 lifecycle governance scaffolds.

## [1.0.0] - 2026-10-09
- Initial Next.js + TypeScript + Kysely/Prisma enterprise workspace baseline.
