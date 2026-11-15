# 功能与物理配置审计报告 (FCA / PCA Configuration Audit)

- **归属规范**: CMMI 06_quality_assurance (CM / PPQA)
- **模板基线**: 对齐 `package.json#version` 与 `packages/shared/contract/compat-manifest.json`
- **自动化凭证**: `docs/06_quality_assurance/gate-evidence-trace.json`（由 `pnpm run check` 与交付门禁生成）

---

## 1. 功能配置审计 (Functional Configuration Audit, FCA)

| 审计项 | 判定准则 | 核验命令 / 真源 |
|---|---|---|
| **需求与契约一致性** | 活跃规格具备完整 Brief 与四类契约声明 | `pnpm run specs:health` · `pnpm run contracts:governance:check` |
| **Agent 契约与路由覆盖** | 契约注册表与真实路由一致，零未登记漂移 | `pnpm run agent:contracts:check` · `pnpm run agent:routes:check` |
| **真实数据库验证** | 状态机与写链路通过真实数据库测试，零假 Mock | `pnpm run test:clean` · `pnpm run verify:real-db` |

---

## 2. 物理配置审计 (Physical Configuration Audit, PCA)

| 审计项 | 判定准则 | 核验命令 / 真源 |
|---|---|---|
| **工程规范与分层隔离** | 跨域仅走 Facade，包管理器统一为 `pnpm` | `pnpm run domain:check` · `pnpm run standards:check` |
| **软件物料清单与依赖安全** | 锁文件冻结、SBOM 与漏洞棘轮合规 | `docs/04_implementation/sbom.json` · `pnpm run deps:audit` |
| **发布与回滚预案完备** | 部署 SOP、秒级回滚预案与制品指纹可复验 | `docs/07_release/rollback-runbook.json` · `pnpm run fingerprint:verify` |
