# HARNESS — cooliebase-all 轻全栈旗舰底座交付物一图总览

> **目的**：AI 数字员工与人类工程师进场 30 秒内看清「这个底座交付了什么 / 怎么被业务项目用 / 哪些红线 / 怎么自证」。
> **统一律**：与 `yudao-quad-terminal` 严格保持 **Harness 9 大生命周期环节 100% 一致**（只能多不能少），具体实现因 Next.js 16 轻全栈技术栈自适应。

---

## 1. 底座身份（5 秒）

| 项 | 值 |
|---|---|
| 定位 | 企业级轻全栈**可派生旗舰底座**：Next.js 16 App Router + React 19 + Prisma 7 + Kysely + Expo 原生移动端 |
| 架构模式 | 单一应用代码库 (Single-Engine Monorepo)，15 企业级业务域自闭环，支持一体化运行与解耦部署 |
| 模板版本 | `templateVersion 1.2.0`（见 `compat-manifest.json`） |
| 数据持久化 | 支持零 Docker **嵌入式真 PostgreSQL 18.4 (`embedded-postgres`, `scripts/lib/ephemeral-pg.cjs`)** 与 SQLite/MySQL，绝不在生产模式降级内存 |
| 唯一网关基线 | 动态 BasePath 规范（`/${slug}`），单一端口（默认 `:3300`），绝不硬编码绝对子路径 |

---

## 2. 核心入口与跨底座统一 `.cjs` 契约矩阵

> **跨底座同名同参铁律**：无论底层是 `cooliebase-all`（Next.js/TS 插件架构）还是 `yudao-quad-terminal`（Java SpringBoot + Vue3 + UniApp + Expo 四端架构），向外部（Coolie 工坊 `coolie-cli` 与 AI Agent 数字员工）暴露的 **`.cjs` 脚本路径、CLI 参数、`pnpm run` 命令及 Embedded PostgreSQL 真库测试契约 100% 一致**：

| 优先级 | 统一入口文件 / 脚本 | 统一 `pnpm run` 命令 | 用途与跨底座标准行为 |
|---|---|---|---|
| ★ | **`HARNESS.md`**（本文件） | — | 一图总览：交付物规范 + 统一生命周期环节 + 自证矩阵 |
| ★★ | [`AGENTS.md`](AGENTS.md) | — | 宪法与红线法典（唯一真源） |
| ★★ | [`compat-manifest.json`](compat-manifest.json) | `pnpm run compat:check` | 下游消费契约（机器可读，`scripts/compat-check.cjs` 强校验） |
| ★★ | [`scripts/harness.cjs`](scripts/harness.cjs) | `pnpm run harness <action>` | 统一 9 阶段全生命周期 Harness 执行引擎 |
| ★★ | [`scripts/project-init.cjs`](scripts/project-init.cjs) | `pnpm run project:init -- ...` | 统一零污染沙箱派生与白标重构引擎（兼容 `pnpm project:hatch`） |
| ★★ | [`scripts/blueprint-engine.cjs`](scripts/blueprint-engine.cjs) | `pnpm run blueprint:deliver` | 统一 `<500 Tokens` 蓝图自愈 (`doctor`)、编译 (`compile-domain`) 与真库交付 (`deliver --verify-e2e`) |
| ★★ | [`scripts/lib/ephemeral-pg.cjs`](scripts/lib/ephemeral-pg.cjs) | — | 统一零 Docker **嵌入式真 PostgreSQL 18.4 (`embedded-postgres`)** 端点解析器 |
| ★★ | [`scripts/cmmi-asset-scaffold.cjs`](scripts/cmmi-asset-scaffold.cjs) | `pnpm run speckit` / `pnpm run speckit:cmmi` | 统一 Spec-Kit SDD 工程规格与 CMMI 00~09 阶段文档扩展引擎 |
| ★★ | [`scripts/codegen-module.cjs`](scripts/codegen-module.cjs) | `pnpm run gen:module` | 统一业务域全栈代码生成器 |
| ★★ | [`scripts/gate-check.cjs`](scripts/gate-check.cjs) | `pnpm run check` / `pnpm run gate:fast` | 统一工程质量与架构边界门禁 |
| ★★ | [`scripts/service.sh`](scripts/service.sh) | `pnpm run service:<cmd>` | 物理服务运维控制器（与 `pnpm harness` 完全等价映射） |

### 2.1 双支柱架构：`harness` 定工作流程总规范 × `speckit` 扩展 CMMI 00~09 全生命周期文档体系

> **核心分工哲学**：
> 1. **支柱一：`harness`（[`HARNESS.md`](HARNESS.md) + [`scripts/harness.cjs`](scripts/harness.cjs)）= 工作流程与运行生命周期总规范**
>    负责定义从依赖安装、静态检查、构建打包、服务启停、健康探活到真库 E2E 与出厂终验的 9 阶段标准工作流（`install -> check -> build -> start -> health -> status -> stop -> e2e -> deliver`）。
> 2. **支柱二：`speckit`（`pnpm run speckit`）+ CMMI 00~09 扩展（`scripts/cmmi-00-meta.cjs` ~ `scripts/cmmi-09-operations.cjs`）= 全环节工程文档与过程资产引擎**
>    因为**每个 CMMI 00~09 环节本质上都与工程文档强绑定**（同时承载 **Layer A 宏观过程文档 `docs/00_meta_standards/`~`docs/09_operations/`** 与 **Layer B 特性规格包阶段文档 `docs/specs/<domain>/<name>/`**），所以每个 CMMI 环节均属于 `speckit` 的一等公民扩展，统一通过 `pnpm run speckit -- cmmi <00..09> [docs|check|asset|...]`（或 `node scripts/cmmi-0X-*.cjs`）调用：

| CMMI 阶段 | `speckit` 阶段扩展入口 / `.cjs` 脚本 | 宏观工程过程文档 (Layer A) | 特性规格包阶段文档 (Layer B: `docs/specs/<域>/<名>/`) | 阶段专属动作与文档门禁 |
|---|---|---|---|---|
| **00 规范与元契约** | `pnpm run speckit -- cmmi 00`<br>([`scripts/cmmi-00-meta.cjs`](scripts/cmmi-00-meta.cjs)) | `docs/00_meta_standards/`、`.specify/memory/constitution.md`、`wiki/` | `spec.json` | `docs \| check \| constitution \| schema \| sync` |
| **01 立项与 PMO 大盘** | `pnpm run speckit -- cmmi 01`<br>([`scripts/cmmi-01-management.cjs`](scripts/cmmi-01-management.cjs)) | `docs/01_management/` (`pmo-dashboard.md`, `project-plan.md`, `project-charter.md`, `risk-register.md`) | `selection.md`, `research.md` | `pmo \| docs \| check \| asset \| init \| render` |
| **02 需求与规格工程** | `pnpm run speckit -- cmmi 02`<br>([`scripts/cmmi-02-requirements.cjs`](scripts/cmmi-02-requirements.cjs)) | `docs/02_requirements/` (`rtm-traceability-matrix.md`, `non-functional-reqs.md`) | `brief.json`, `requirements.md`, `spec.md` | `docs \| check \| asset \| route \| new \| build` |
| **03 架构设计与自愈** | `pnpm run speckit -- cmmi 03`<br>([`scripts/cmmi-03-design.cjs`](scripts/cmmi-03-design.cjs)) | `docs/03_design/` (`database-design-erd.md`, `adr/`, `diagrams/`) | `design.md`, `prototype.md` | `docs \| check \| asset \| doctor \| compile-domain` |
| **04 研发计划与实现** | `pnpm run speckit -- cmmi 04`<br>([`scripts/cmmi-04-implementation.cjs`](scripts/cmmi-04-implementation.cjs)) | `docs/04_implementation/` (`coding-standards-and-guidelines.md`, `code-review-*`) | `plan.md`, `tasks.md` | `docs \| check \| asset \| tasks \| deliver \| codegen` |
| **05 测试与真 PG E2E** | `pnpm run speckit -- cmmi 05`<br>([`scripts/cmmi-05-verification.cjs`](scripts/cmmi-05-verification.cjs)) | `docs/05_verification/` (`test-plan.md`, `test-summary-report.md`, `uat-acceptance-certificate.md`) | `testing.md`, `evidence.json`, `bugs.md` | `docs \| check \| asset \| e2e \| unit \| mutation` |
| **06 质量门禁与审计** | `pnpm run speckit -- cmmi 06`<br>([`scripts/cmmi-06-quality.cjs`](scripts/cmmi-06-quality.cjs)) | `docs/06_quality_assurance/` (`audit/fca-pca-audit-*.md`, `car-root-cause-*.md`) | `checklist.md` | `docs \| check \| asset \| tasks \| controls` |
| **07 发布 SOP 与指纹** | `pnpm run speckit -- cmmi 07`<br>([`scripts/cmmi-07-release.cjs`](scripts/cmmi-07-release.cjs)) | `docs/07_release/` (`system-deployment-sop.md`, `rollback-emergency-plan.md`) | `deployment.md`, `runbook.json` | `docs \| check \| asset \| gateway \| build \| fingerprint \| runbook` |
| **08 SRE 与事故复盘** | `pnpm run speckit -- cmmi 08`<br>([`scripts/cmmi-08-sre.cjs`](scripts/cmmi-08-sre.cjs)) | `docs/08_sre/` (`01_slo_sli_metrics/`, `06_incidents_postmortem/`) | `operations.md` | `docs \| check \| asset \| status \| health \| security \| load` |
| **09 持续运营与归档** | `pnpm run speckit -- cmmi 09`<br>([`scripts/cmmi-09-operations.cjs`](scripts/cmmi-09-operations.cjs)) | `docs/09_operations/` (`tenant-governance.md`, `01_financial_reconciliation/`)、`docs/specs/archive/` | `operations.md` | `docs \| check \| asset \| archive \| ops` |

---

## 3. 交付物标准 Harness 9 大闭环生命周期环节 & 蓝图三步交付流

无论是母本自身研发，还是派生出的层B交付物，统一暴露且严格执行以下 9 大标准环节：

```bash
pnpm harness install     # [环节 1] 依赖安装：pnpm i + Prisma Client 生成 + 领域种子数据注入
pnpm harness check       # [环节 2] 静态与契约门禁：0 编译报错、TypeScript 类型全绿、校验器与 DTO 对齐
pnpm harness build       # [环节 3] 制品编译：生产打包 (生成 .next-cooliebase/standalone/ 独立运行时)
pnpm harness start       # [环节 4] 运行时拉起：后台守护进程启动、PID 记录 (logs/service.pid)、环境变量加载
pnpm harness health      # [环节 5] 实时健康探活：物理拨测 /${slug}/readyz 与 /${slug}/2c/，严格 200 OK
pnpm harness status      # [环节 6] 状态大盘：查看 PID、端口监听、对外统一 C端/B端 入口
pnpm harness stop        # [环节 7] 资源回收：干净回收进程组与端口，清理残留文件锁
pnpm harness e2e         # [环节 8] 拟真人交互走查：agent-browser 驱动真机点击，输出不可伪造四态截图
pnpm harness deliver     # [环节 9] 商业终验出厂：23道物理门禁全量压测，生成不可篡改《出厂交付结项单》
```

### 3.1 Coolie 工坊 & AI Agent 数字员工跨底座统一三步流水线

在 `cooliebase-all` 与 `yudao-quad-terminal` 上，AI 员工无需区分底座类型，统一执行完全相同的 3 条标准指令：

```bash
# Step 1: 零污染沙箱派生 + 四端 BASE_PATH 同源渲染 (/<slug>/{2c,admin,api,api/docs})
pnpm run project:init -- --name <slug> --title "<系统中文名>" --target /tmp/<slug>-sandbox

# Step 2: 喂入 <500 Tokens 的 <domain>.blueprint.json，一键完成 doctor 自愈 + Spec-Kit 展开 + 全栈代码 + 6阶段真库 E2E
cd /tmp/<slug>-sandbox
pnpm run blueprint:deliver -- --file <domain>.blueprint.json --verify-e2e

# Step 3: 统一工程门禁与兼容契约自检
pnpm run check && pnpm run compat:check
```

---

## 4. 技术栈自适应内核映射 (CoolieBase vs Yudao)

| 统一环节 | CoolieBase 轻全栈内核 | Yudao 芋道微服务内核 | 统一判定准绳 |
| :--- | :--- | :--- | :--- |
| **`install`** | `pnpm install` + `prisma generate` | `mvn install -DskipTests` + `pnpm install` | 零依赖缺失 |
| **`check`** | `pnpm typecheck` + `admin:nav:check` | `mvn compile` + `vue-tsc` + 敏感配置扫描 | 零类型/语法报错 |
| **`build`** | `next build` (Standalone 独立包) | `mvn package` + Vite 生产打包 | 生成不可变部署产物 |
| **`start`** | Standalone `server.js` (端口 `:3300`) | Spring Boot Jar (`48080`) + Caddy (`48120`) | 后台守护 + PID 落盘 |
| **`health`** | 拨测 `/${slug}/readyz` | 拨测 `/${slug}/actuator/health` | 必须返回真实 HTTP 200 |
| **`stop`** | 优雅停机并释放 `:3300` | 停机并释放 `:48120` 与 `:48080` | 端口彻底释放 (0 残留) |
| **`e2e`** | `agent-browser` 走查 2C 美妆与 Admin | `agent-browser` 走查 Vue3 中台与 H5 | 零假按钮、截图非全白 |
| **`deliver`** | 跑满 23 道物理门禁并出厂核销 | 跑满 23 道物理门禁并出厂核销 | 100% 绿灯无降级 |

---

## 5. 底座级工程硬不变量 (违反即红灯)

1. **单端口统一入口**：全站所有渠道（2C 前台、Admin 中台、OpenAPI 契约）必须通过同一服务端口与 `/${slug}` 前缀访问，严禁跨端口散落。
2. **生产严禁内存数据源**：Standalone 与生产环境必须配置 SQLite 或 PostgreSQL 真实持久化存储，严禁回退至 `memory`。
3. **安全凭据防泄漏**：登录页面永不回填或下发明文密码；生产环境 `JWT_SECRET` 必须 ≥ 32 字节。
4. **单根原子重定向**：`next.config.mjs` 中的根路径分流必须严格带 `basePath: false`，杜绝双重嵌套。
5. **1 Task = 1 Commit & Clean Working Tree**：完工/投产档必须对应有效 Commit SHA，工作树 0 dirty。
