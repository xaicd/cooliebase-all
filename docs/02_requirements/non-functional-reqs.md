# 非功能性需求与性能指标规范 (Non-Functional Requirements - NFR)

- **归属规范**: CMMI 02_requirements (RDM) / `.agents/skills/product-requirements`
- **编写原则**: 每条指标都必须**可复现**（写明度量方式）或**明确标注为历史实测**。
  不可复现又不标来源的数字，比没有数字更糟 —— 它会被当成事实引用下去。

---

## 1. 交付链耗时指标（2026-10-19 在开发机实测）

| 指标 | 目标 | 实测 | 度量方式 |
|---|---|---|---|
| 静态门禁 `npm run check` | ≤ 60s | **17s** | 本地计时 |
| 全量测试 `pnpm exec vitest run` | ≤ 300s | **194s**（vitest 自报 193.28s） | vitest Duration |
| 生产构建 `npm run build` | ≤ 120s | **26s** | 本地计时 |
| 孵化工程依赖安装 `pnpm install --frozen-lockfile` | ≤ 60s | **8.1s** | 克隆产物内实测 |

> 门槛定为"实测的 3 倍以上"是刻意的：这些是**回归护栏**，用来拦住"耗时被打成十倍"，
> 不是跑分目标。真实容量必须在生产用真实流量压。

## 2. 吞吐与延迟

| 指标 | 值 | 来源与可复现性 |
|---|---|---|
| 单机独立进程吞吐护栏 | ≥ 5,000 rps | `npm run load:test` 对**生产产物**施压 |
| 历史实测吞吐 | ~26,877 rps | **历史实测，本机不可复现**（Docker 为 colima，宿主机端口未转发） |
| API P95 延迟 | ≤ 20ms（Tier-1） | `docs/08_sre/01_slo_sli_metrics/SLO-SLI-ERROR-BUDGET-MATRIX.md` |
| API P99 延迟 | ≤ 50ms（Tier-1） | 同上 |

**踩过的坑（必须记住）**：压测前**必须清端口**，否则会打到残留的 dev 进程，
拿到低一个数量级的数字（实测报过 588 rps，实际 26,877 —— 不是产品慢，是打错了进程）。

## 3. 可用性 SLO 与错误预算

| 分级 | 范围 | 可用性 | 30 天停机预算 |
|---|---|---|---|
| Tier-1 | 核心交易（pay / mall / member） | 99.95% | ≤ 21.6 分钟 |
| Tier-2 | 运营管理端（admin / report） | 99.90% | ≤ 43.2 分钟 |

真源为 SLO 矩阵文档（`docs/08_sre/01_slo_sli_metrics/`），本文件只是引用。

## 4. 安全与合规

| 要求 | 约束 | 机器判据 |
|---|---|---|
| 租户隔离 | 禁止越权串租户；Repository 一律从全局上下文取租户 | `standards:check` 规则 `business-repository-tenant-scope`（**report，不拦截**）、`test/integration/sqlite-rbac.integration.test.ts` |
| 生产兜底 | `TENANT_MODE=required` 时缺租户上下文直接抛错 | 同上 |
| 依赖准入 | 运行时新增漏洞必须为 0 | `npm run deps:audit`（基线冻结既有欠债） |
| 物料清单 | SBOM 必须与锁文件一致 | `npm run sbom:check` |
| 许可证 | LGPL/MPL 等弱著佐权须知情；分发时随附许可证文本 | `docs/04_implementation/software-bill-of-materials.md` §0 |
| 敏感数据 | 密码哈希存储；手机/身份证展示脱敏；日志禁止输出密钥与完整隐私数据 | 人工审查项（见代码审查清单） |
| 渗透 | 未认证 / 伪造 token / 伪造 tenant / 插件挂载 / 不泄露栈 / 安全响应头 / 错误口令 | `npm run security:scan`（20 项，含两个**阴性对照**） |

## 5. 可维护性与治理

| 指标 | 值 | 真源 |
|---|---|---|
| 原生域 | 17 | `domain-catalog.json` |
| 第一方插件 | 15 | `packages/plugins/plugin-*/` |
| Agent Skills | 38 | `.agents/skills/*/SKILL.md` |
| 静态交付门禁 | 21 | `compat-manifest.json` → `consumptionSurface.gates`（**勿手抄**：`pnpm run compat:check` 打印当前条数） |
| 工程规范机检规则 | 19（enforce 15 / ratchet 3 / report 1） | `scripts/check-engineering-standards.cjs` 规则注册表（**勿手抄**：`pnpm run standards:check --audit`） |

> **注意 §5 的数字口径**：本文件**不在** `llms:check` 的被检列表内（该门禁只比对 `llms.txt` / `llms-full.txt`）。
> 本节数字由 `pnpm run docs:claims:check` 看守（扫 `docs/01_management/**` + `docs/02_requirements/**` 的
> 可核验声明，对照真源；反向对照已实测能 exit 1）。

## 6. 明确不承诺的部分

诚实边界，避免被当成能力：

- **不承诺"无限扩展"**：容量目标须由 SLO、压测与资源预算确定，本仓不给出无边界的扩展声明。
- **不承诺"全部四层金字塔都有独立入口"**：L3 契约层有测试但**无独立 npm 入口**
  （见 `docs/01_management/project-plan.md` 的 E1）。
- **不承诺"压测已通过"**：`load:test` 现已可本机零容器运行（嵌入式 Postgres），但本机 rps **受机器负载影响**（实测 1.8k–2.8k vs 基线 26.9k），容量结论仍以生产真实流量为准。
- **不承诺第三方依赖无漏洞**：既有 9 条 advisory 已被**基线冻结**（"冻结"≠"无漏洞"），
  台账见 `docs/architecture/cooliebase-all-dependency-policy.md`。
