# Cooliebase-All — Harness 自画像 (Self-Portrait)

> **立场**: 只写事实(带路径), 不评价好坏。作为 harness-mutual-audit 10 维审计的事实底座。
> **勘察**: 2026-10-23, wenlv-next 侧 Claude 会话 (手勘 + 只读子代理复核合并)。

## 1. 项目身份

- **定位**: AI-Native 低代码业务底座 (CoolieBase), TS 单仓: Next.js (^16.4.2) + Prisma (58 model) + Kysely 双轨 + 可替换后端与微服务边界 (§3.3)。
- **核心思想**: Zero Token Waste + Tool-First Low-Code — 大模型输出压缩至 <500 token 的 Schema/DSL 声明, 由通用引擎展开 (RULE-0)。
- **agent-profile.json** (8.1KB): kind=workspace-bundle, role=business-project-template; 本仓**不是** agent-runtime (Agent loop 在 DigitalStaff NativeCodingEngine, runtimePath 指向 D:/workspace/cw/ai/DigitalStaff); promptAssembly 定义组装顺序 (identity→rule-0→inverse-thinking→spec-first→…→skills on-demand→gates)。
- **compat-manifest.json** (5.6KB): templateVersion 1.2.0 (2026-10-10); 工具链锁 (node/next/react/kysely/zod/prisma/TS); 契约含 domainCatalog (**17 域**) / rpcActions / agentProfile / seamGraph, `pnpm run compat:check` 强校验。

## 2. 入口文件

| 文件 | 体积 | 角色 |
|---|---|---|
| `AGENTS.md` | 91KB | **宪法**: 13 条铁律 + §1-§25 全体系 (无独立 HARNESS.md 首屏) |
| `CLAUDE.md` | 3.7KB | 命令面 + Mac 宿主桥 `scripts/host-exec.sh` + **强制第一步需求分诊** `pnpm run agent:route -- "<原文>"` (SPEC_REQUIRED / DIRECT_OK / NOT_A_REQUIREMENT 三态, 规则真源 `scripts/lib/spec-necessity-rules.cjs`) |
| `CURRENT.md` | 3.3KB | 已发布能力真源, 仅登记过 RELEASE_APPROVED 门禁的能力 + 发布标签历史 |
| `TESTING.md` | 4.7KB | 测试规范 |
| `.agents/context/` | — | IDENTITY / SOUL / ASSEMBLY (NPC 人格 + prompt 组装清单) |

## 3. 宪法体系 (AGENTS.md §1-§25, 13 条编号铁律)

①零 Token 浪费 (Schema/DSL 声明式, <500 token) ②极致复用泛型 BaseMapper/QueryWrapper/BaseService/createBaseSchema (自动继承多租户/逻辑删除/8 审计字段) ③存量低代码工具优先 ④缺工具就造工具 ⑤开源优先 ROI 选型 ⑥SpaceX 级 4 层测试 + 真 DB 反假 Mock ⑦本体域导航 + API 契约第一 (§21) ⑧四类契约族 API/数据/流程/预案 (§22) ⑨高阶反向思维 + Harness 全程监督 (§23) ⑩0-1 交付资产 + 8 要素 Brief + 7 类工程资产, No Artifact No Done (§24) ⑪单一真源 + 过程资产防污染 (§25) ⑫OpenWiki 首屏导航 ⑬全能力 AI Agent Driven (Page Schema + Agent 契约 + agent:ops 无头 + Strix 红队)。

专项章: §3.4 AI-Driven 交付链 / §5 Domain-First 六要素 / §6.1 多模型三阶段协作 (规划/开发/独立测试) / §6.2 Skill Registry / §6.3 standards:check 机检 / §6.4 evolution:backlog 进化回流 / §9.4 测试必须内存模式 / §9.5 表定义真源=低代码元数据 (2026-10) / §14 代码生成器 / §15 需求会话记录 MANDATORY / §16 ProjectReactor / §17 Core Base vs Business Domain / §18 Harness 进化 (DeepSeek × DigitalStaff NPC) / §20 需求三叉戟分流。

## 4. Rules (10) / Commands (11) / Workflows (4) / Hooks

- `.agents/rules/`: RULE-0-UNIVERSAL-DIRECTIVES (13 条可执行版) / API-CONTRACT-FIRST (禁口头规范、机检化) / ALL-ROLE-CONTRACT-FAMILIES / MULTI-TENANT-ISOLATION (getCurrentTenantId @/shared/backend/lib/biz-tenant) / PROJECT-INIT-AND-REFACTOR / PROJECT-REACTOR / FEATURE-SPEC-AND-PROTOTYPE-STANDARD (CMMI V2.0/ISO 29148 Spec Bundle) / HIGH-ORDER-INVERSE-THINKING (苏格拉底自循环) / SPEC-FIRST-ENGINEERING-ARTIFACTS (7 类资产硬规矩) + 共 10 文件
- `.agents/commands/`: speckit.* 11 个 (specify/plan/tasks/implement/gate/checklist/eval/archive/constitution/cmmi/ops)
- `.agents/workflows/`: feature-delivery / bugfix / security-patch / architecture-refactor (workflow-engine 驱动: new/list/check/dry-run/run)
- `.agents/hooks/`: **spec-gate.sh 挂 PreToolUse** (matcher *, timeout 10s, `.agents/hooks.json`) + adapters.json (Paperclip 适配) + parse-payload.js

## 5. Skills (40 个, `.agents/skills/`)

工程规范族: api-design (OpenAPI 3.1) / database-design / database-compatibility (Tier-A/B/C 多库) / automated-testing / mutation-tester / ears-spec-writer / dar-decision-matrix / postmortem-analyzer / sre-slo-manager / compliance-auditor (CMMI PPQA/FCA/PCA) / security / strix-penetration-testing / devops / service-governance。
AI/资产族: spec-driven-development (Kiro SDD 五类型) / cmmi-asset-authoring / skill-authoring / skill-creator / mcp-builder / plugin-authoring / agent-harness (DigitalStaff NPC 模板) / new-business-plugin (一句话→新业务域插件全链路) / new-feature / project-init / coding (Modules-First CRUD) / webapp-testing (Playwright)。
架构/前端族: architecture-design / adr-architect (ADR/MADR) / archify / microservice-evolution (A/B/C 域拆分) / product-requirements / financial-reconciliation-agent / frontend-design / ui-design / ui-framework-governance / canvas-design / theme-factory / brand-guidelines。

## 6. 脚本命令面 (~130 条 npm scripts, 160+ 文件)

- **check-\* 门禁家族 (20+)**: engineering-standards / domain-manifests / compat-manifest / agent-native(+baseline) / agent-routes / agent-selectors / agent-contract-coverage / handwritten-files (生成物防手改+baseline) / delivery(--strict) / route-validation / repository-column-coverage / microservice-governance / doc-claims / docs-commands / llms-sync / harness-bundle / specs-health / deps-audit / version-consistency / plan-freshness / audit-log-contracts / contract-governance / generated-paths / client-build
- **generate/sync 家族**: admin-route-manifest / rpc-actions / page-schemas / domain-service-loaders / agent-contracts / table-migration / admin-pages / sbom / dict-catalog / domain-rbac-migration; sync-skills / sync-openwiki / sync-agent-surface / sync-kiro / sync-nullability
- **Agent 自治**: `agent:route` (需求分诊) / agent:contracts / agent:ops (:health/:suite) / agent:autopilot (:daemon/:heal) / agent:native:check (:audit/:baseline) / agent:page-schemas; `scripts/agent-autopilot-daemon.ts` 常驻心跳守护 (逻辑在 packages/shared/backend/lib/agent-autopilot); `scripts/agent/run-ops.cjs` 契约驱动"走接口不开浏览器"运营 runner; `scripts/mcp/cooliebase-mcp-server.cjs` (40.2KB stdio 只读 MCP)
- **规格/交付**: speckit 全家 + cmmi:asset + delivery:check/status + runbook + fingerprint + task:verify + plan:freshness
- **进化**: evolution:backlog / upstream:radar+audit / harness:health / guard-high-order-invariants.cjs / socratic-inquiry-engine
- **孵化**: hatch.sh + hatch-e2e.cjs + project-init.cjs + clone-project-base.cjs + quick-start.* / host-exec.sh (Mac 宿主 SSH 桥)
- **打假**: mutation-gate.cjs / audit-test-vacuity.cjs / verify-real-db.cjs

## 7. 低代码引擎与泛型体系 (铁律 ② 的落点)

- `packages/shared/backend/lib/database/base-mapper.ts` (13.5KB): MyBatis-Plus 风格 BaseMapper/QueryWrapper/BaseService, 自动注入租户上下文 + Kysely; 同目录 schema.ts (Kysely 表类型与 prisma 镜像) / tenant-isolation-plugin / sharding-engine / read-write-router / dynamic-table / multi-datasource-manager
- 代码生成: `packages/domains/infra/backend/services/` codegen.service / codegen-engine / codegen-table / codegen-templates / template-presets; §14 流程: /admin/infra/codegen 导表→预览→ZIP→tmp/ 受控注入 (冲突即失败)
- 业务落位: 平台域 packages/domains/{system,infra}, 插件 packages/plugins/plugin-<domain> (ai/aigw/bpm/crm/erp/im/iot/mall/member…), src/ 仅 app/+proxy.ts (§17 铁律); gen/go/<域>/v1/service.go 为 Go 侧生成物

## 8. 测试体系 (4 层金字塔, 目录即层次)

- L1 单测: src/**/__tests__ (69) + test/unit (48) vitest, 含断网守卫 test/framework/network-guard.ts; L2 集成 test/integration (真 DB 读写); L3 契约 rpc-protocol.test.ts 等; L4 E2E test/e2e + test/agent (Playwright: admin-flow / agent-contract / agent-ui-probe)。
- SQLite 嵌入式: `db:bootstrap:sqlite` 建 data/cooliebase.db (8 审计列 + supervip 引导); ephemeral-pg; **必须内存模式**跑 (§9.4)。
- 门禁型单测: openwiki-stale.test.ts 防过期、mutation/load-verdict/doc-claims 等大量。

## 9. OpenWiki 与 CMMI 目录学

- `wiki/`: index.md + 四词条域 — architecture/ (14 词条: base-mapper-and-queries / modular-plugin-system / autonomous-heartbeat-autopilot / socratic-inversion-flywheel / tenant-isolation-ast / transactional-outbox 等), domains/ (19 域词条, mes.md 31KB 最大), gotchas/, testing/ (9 词条: testing-pyramid / real-database-testing / mutation-testing / strix-autonomous-pentest / k6-load-benchmark); `sync-openwiki.cjs` 从 domain-catalog/seam-graph/contracts.json 自动编译 + 自愈 (openwiki:sync/check)
- `docs/01_management ~ 09_operations` 九段 CMMI 全生命周期 (01 含 project-plan 35.7KB / charter / risk-register / dar-records; 08_sre 含 slo_sli_metrics + incidents_postmortem)

## 10. Spec 包机制 (§25 + specs-health)

`docs/specs/{infra(11 个),system,archive(2026-Q4)}/<name>/` 16 文件制; 四态 feature/bugfix/enhancement/refactor (skill 另支持 security); `spec:new --name --domain --type` 创建 → speckit 生命周期 → archive.cjs 归档; **CLAUDE.md 强制先 agent:route 分诊再决定立规格**。

## 11. 部署

- Dockerfile (node:24-alpine 多阶段 standalone, 产物 .next-cooliebase/standalone) + Dockerfile.domain (单域 API-only, --build-arg COOLIEBASE_PACK_DOMAIN=pay); deploy/ docker-compose.{local,dev,test,prod,domains}.yml + caddy/; sql/init/ + build-v1-init-sql.ts; .githooks/ 由 setup-git-hooks.cjs 安装。

## 12. 协同

多模型三阶段 (§6.1) + 任意 CLI 接入 (§3.5: cmd/Claude Code/agy/Hermes) + Paperclip adapters + Skill Registry 强制登记 (§6.2)。

## 13. 与家族互认点 (事实)

- yudao HARNESS.md 引用本仓 `harness:health` 为同族反向控制标准。
- 仓库含 .claude/worktrees / .kiro / .specify / .cursor / .commandcode / .cooliebase 多 IDE/harness 配置副本 (多工具共栖形态)。
- speckit / compat-manifest / llms / hatch 家族与 yudao 同构 (同族模板演化)。
