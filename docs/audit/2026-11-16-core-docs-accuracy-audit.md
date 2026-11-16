# 核心工程与 `docs/` 全域文档五维准确性专项审计与整改报告

- **审计仓库**: `cooliebase-all` (`v1.5.0`)
- **审计日期**: 2026-11-16
- **归属规范**: CMMI 06 过程与产品质量保证 (PPQA / FCA-PCA) & 文档单目录治理铁律
- **审计范围**:
  - **根目录核心入口与发现表面**: `README.md`、`AGENTS.md`、`CLAUDE.md`、`HARNESS.md`、`SWARM.md`、`CURRENT.md`、`project-status.md`、`CHANGELOG.md`、`TESTING.md`、`llms.txt`、`llms-full.txt`、`.well-known/llms.txt`、`.well-known/llms-full.txt`、`.well-known/agent.json`、`clients/README.md`、`deploy/README.md`
  - **`docs/` 全域文档目录（共 98+ 份活跃文档）**: `docs/01_management/` ~ `docs/09_operations/`、`docs/architecture/`、`docs/guides/`、`docs/operations/`、`docs/wiki/`（OpenWiki 46 篇词条）、`docs/specs/`、`docs/07_release/releases/v1.5.0.md`、`docs/audit/`
- **审计结论**: **CONFORMANT（100% 发现项闭环清零，非 `docs/` 平行文档目录 100% 收敛清零）**

---

## 一、五维审计准则与单目录防污染纪律

1. **单目录唯一收敛纪律 (`docs/` Exclusivity)**:
   - 物理移除根目录下的平行文档目录与历史软链（原根级 `wiki/`、`openwiki`、`specs`、`releases/` 及冗余备份 `project-status.md.bak`），统一收敛至 `docs/wiki/`、`docs/specs/`、`docs/07_release/releases/` 与 `docs/audit/`；
   - 在 `scripts/check-specs-health.cjs`（`pnpm run specs:health`）与 `.gitignore` 中固化根目录平行文档防复发拦截守卫。
2. **维度 A — 路径与大小写物理真值 (`git ls-files`)**:
   - 全盘提取反引号路径与 Markdown 相对链接，对照仓库跟踪文件与物理目录，清零悬空路径、漏后缀脚本与宿主机/容器私有绝对路径。
3. **维度 B — 命令与脚本可执行真值 (`package.json` & `scripts/`)**:
   - 核验全部 `pnpm run <script>`、`pnpm harness <cmd>`、`node scripts/<file>` 与 `bash scripts/service.sh <verb>` 均真实存在且严格遵守 `pnpm` 唯一铁律。
4. **维度 C — 架构规模与版本一致性 (`v1.5.0`)**:
   - 全仓统一模板与发布版本 `1.5.0`、**四位一体终端**（`src/app/(admin-pages)` Admin + `src/app/(portal-pages)` 2C 门户 + `clients/expo` 原生/Web App + `clients/miniapp` Uni-App 微信小程序/H5）、**20 原生域**（`system` + `infra` 2 平台地基 + `18` 第一方插件域，含 `oa`/`hrm`/`fms`/`pms` 与 `online`）、`354` 份 Agent 契约、`38` 个 Skills、`18` 个 MCP 工具。
5. **维度 D & E — 定制越界、退役节点与敏感弱凭据清零**:
   - 确保已移除的垂直定制插件、旧仓库代号、已退役节点标识在活跃声明中清零；全盘扫描敏感 Token 字面量与静态弱默认凭据示例并清零。

---

## 二、全量审计发现与闭环整改台账

| 编号 | 维度 | 涉及文件 / 目录 | 审计发现（整改前） | 闭环整改措施（整改后） | 状态 |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **D-00** | 单目录 | 根级 `wiki/`、`openwiki`、`specs`、`releases/` | 根目录存在非 `docs/` 平行文档目录与软链，违反三仓统一 `docs/` 收敛准则 | 执行 `git mv` 迁移至 `docs/wiki/` 与 `docs/07_release/releases/`，清理根软链 `openwiki`/`specs` 与 `project-status.md.bak`；同步更新 `.github/workflows/release.yml`、`scripts/build-release-assets.cjs`、`scripts/check-version-consistency.cjs`、`scripts/check-generated-paths.cjs`、`scripts/lib/speckit-cmmi-docs.cjs` 并在 `scripts/check-specs-health.cjs` 加硬拦截 | 已闭环 |
| **D-01** | C | `README.md` | 顶部徽章仍为 `1.1.0`，技能数写为 `36`，域与插件数停留在 `17 领域 / 15 插件`，OpenWiki 指向旧根级路径，拓扑未包含 `clients/miniapp` | 更新徽章至 `1.5.0`，技能数对齐 `38`，拓扑与正文同步为 **20 原生域（2 地基 + 18 插件）** 与四位一体终端，OpenWiki 链接全量指向 `docs/wiki/` | 已闭环 |
| **D-02** | A / B | `HARNESS.md`、`scripts/cmmi-00-meta.cjs` | 误引用异构底座脚本名 `scripts/compat-check.cjs`、`scripts/gate-check.cjs`、不存在的子命令及错误默认端口 `:3300` | 修正为真实存在的 `scripts/check-compat-manifest.cjs`、`scripts/audit-23-gates.cjs`（`pnpm run gates:23:static`）、`bash scripts/service.sh <cmd>`、`.specify/memory/constitution.md`、`docs/wiki/`、`docs/audit/` 及真实默认端口 `:3200` | 已闭环 |
| **D-03** | A / C / D | `AGENTS.md` | `scripts/scaffold-feature` 缺 `.ts` 后缀；CMMI-00 元目录写错；§3.2 仍写 `15 个业务域` 与单客户端；§3.4/§4.7/§17.3 残留已剥离定制域示例 | 补全 `scripts/scaffold-feature.ts`；修正 CMMI-00 元目录与 `docs/wiki/index.md`；更新 §3.2 为 `18 个插件域` 与 `expo + miniapp` 四端；替换仓储示例为 `wms-warehouse.repository.ts` 并更新 §17.3 为 `KNOWN_CUSTOM` 清零态 | 已闭环 |
| **D-04** | A / C / D | `SWARM.md` | 定位写为 `15 原生业务插件域 + Expo`，插件列表含已剥离项且缺 `oa/hrm/fms/pms`，Wave 2 写 `src/app/2c/` | 更新为 `18 第一方插件域（共 20 域）+ 四位一体底座`，修正 `src/app/(portal-pages)/` 并加入 `clients/miniapp/` | 已闭环 |
| **D-05** | A / C | `CURRENT.md`、`project-status.md` | `project-status.md` 停留在 `17 域 / 17 MCP tools` 旧快照，且两处仍声称版本一致性“没有机检” | 全面刷新 `project-status.md` 与 `CURRENT.md` 至 `v1.5.0`（20 域 / 38 技能 / 18 MCP 工具 / 28 门禁），如实登记 `pnpm run version:check` 机检闭环 | 已闭环 |
| **D-06** | A / C / D | `llms.txt`、`llms-full.txt` 及 `.well-known/*` 镜像 | 残留已移除定制域、缺 `oa/hrm/fms/pms` 与 `clients/miniapp`、`17 域` 旧口径，且 `.well-known/llms.txt` 底部相对链接失效 | 重写 `llms.txt` 与 `llms-full.txt` 为 `v1.5.0` 四端 + 20 域 + `docs/wiki/` 权威清单，底部链接改为完整可达 URL，并运行 `pnpm run surface:sync` 同步镜像 | 已闭环 |
| **D-07** | A / C | `clients/README.md`、`docs/architecture/cooliebase-all-client-channels.md` | 声称仅有一个客户端包且小程序尚未交付 | 补齐 `expo/`（`@cooliebase/clients-expo`）与 `miniapp/`（`@cooliebase/clients-miniapp`）双客户端包及四端渠道矩阵 | 已闭环 |
| **D-08** | A / B / E | `docs/architecture/cooliebase-all-ontology-navigation.md`、`docs/01_management/project-plan.md`、`docs/wiki/*` | `ontology-navigation.md` 注释残留静态弱口令示例与不存在的通配脚本名；`docs/wiki/index.md` 与 `benchmark-and-evolution.md` 迁移后相对路径层级偏移 | 移除静态弱口令注释（改为 CSPRNG 动态引导说明），修正真实门禁脚本名，修复 `docs/wiki/` 内部跨目录相对链接（`../04_implementation/`、`../../architecture/`） | 已闭环 |
| **D-09** | C | `deploy/README.md`、`CHANGELOG.md`、`docs/07_release/releases/v1.5.0.md` | `deploy/README.md` 未区分宿主机 `pnpm run dev` (`:3200`) 与 Compose (`:3100`)；根 `CHANGELOG.md` 缺失；`v1.5.0.md` 未带 `clients/miniapp/` 前缀 | 明确区分 `:3200` 与 `:3100` 端口；建立标准 `CHANGELOG.md`；补全 `clients/miniapp/src/utils/request.ts` 完整相对路径 | 已闭环 |
| **D-10** | 全域清理与刷新 | `docs/01_management`~`docs/08_sre`、`docs/architecture/*`、`docs/ontology/*`、`docs/wiki/*`、空置目录 | 空置悬挂目录 `docs/features/` 与 `docs/specs/infra/` 未清理；`project-charter.md`、`risk-register.md`、`rtm-traceability-matrix.md`、`ADR-0002`、`database-design-erd.md`、`plugin-architecture-blueprint.md`、`lowcode-system-dev-manual.md`、`system-deployment-sop.md`、`cooliebase-all-architecture.md`、`ontology/{domain,ontology,copilot}.yaml` 及 7 篇 `docs/wiki/` 词条仍停留于旧插件数/契约数或含已剥离定制项记录 | 物理移除空置悬挂目录 `docs/features/` 与 `docs/specs/infra/`；全量刷新 CMMI `01~08`、架构总览、20 域活体本体 `docs/ontology/*.yaml`（通过 `node scripts/ontology-gate.mjs` 16 条真实 HTTP 路由回指校验）及 `docs/wiki/` 词条至 **`v1.5.0`（四位一体终端 + 20 原生域 / 18 插件 + 354 契约）**，并重跑 `sbom:generate` 与 `test:summary` 生成最新实测报告 | 已闭环 |
| **D-11** | A / B / C / D | `docs/wiki/domains/*.md`、`docs/architecture/artifacts/*-baseline.json`、`docs/03_design/*`、`docs/01_management/project-plan.md`、`AGENTS.md`、`TESTING.md` | 终审复核发现：(1) `docs/wiki/domains/*.md` 迁入 `docs/wiki/` 后 398 条 `../../packages/` 相对链接少一层 `../`，且 331 处权限码前缀仍为历史下划线格式；(2) `docs/architecture/artifacts/` 四份冻结棘轮基线残留 20 条已剥离定制插件死键；(3) `project-plan.md` WBS、`ADR-0002` 正文及 `cooliebase-architecture.arch.{html,json}` 局部残留旧域数文案；(4) `AGENTS.md`、`TESTING.md`、`project-plan.md` 局部示例残留非 `pnpm` 命令字面量 | 批量修正 `docs/wiki/domains/*.md` 全部 398 条 `../../../packages/` 相对链接并与 `docs/agent/contracts.json` 对齐 331 处 kebab `permissionPrefix`（全仓 Markdown 断链数 = `0`）；重跑 `--write-baseline` 刷新 `design-tokens`、`route-validation`、`typecheck`、`menu-title-length` 基线并刷新 `socratic-inquiry-latest.json`（死键数 = `0`）；同步 `project-plan.md`、`ADR-0002`、`cooliebase-architecture.arch.{html,json}` 为 20 原生域 / 18 插件与四位一体终端；清零全部文档操作指引中的非 `pnpm` 命令示例 | 已闭环 |

---

## 三、自动化门禁与清洁测试复核凭证

上述目录收敛、文档修订与单测基线对齐后，统一通过以下确定性门禁自证（退出码均为 `0`）：

- `pnpm run specs:health` & `pnpm run cmmi:asset:check`：根目录 0 平行文档目录/软链，CMMI 01~09 与 `docs/wiki/`、`docs/audit/`、`docs/07_release/releases/` 拓扑完全合规；
- `pnpm run gen:paths:check`：OpenWiki（`docs/wiki/**`）全部路径与裸文件名引用 100% 真实存在；
- `pnpm run surface:check` & `pnpm run llms:check`：发现表面镜像与规模数字（20 域 / 38 技能 / 18 MCP 工具 / 28 门禁 / 354 契约）零漂移；
- `pnpm run docs:commands:check` & `pnpm run docs:claims:check`：文档脚本命令与架构规模声明 100% 可回验；
- `pnpm run standards:check` & `pnpm run compat:check` & `pnpm run gates:23:static` & `pnpm run test:clean` & `pnpm run build`：全量工程规范、出厂硬门禁、清洁环境自动化测试与生产构建全部通过。
