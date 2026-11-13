# SWARM.md — CoolieBase-All 多智能体工匠协同与单写者交付法典

> **架构定位**：本文件是 **CoolieBase-All（Next.js 16 全栈 + 15 原生业务插件域 + Expo 移动端一体化底座）** 及其派生客户工程的 **Swarm 多工匠协同宪法**。所有进入本工作区的协调者（Coordinator）、分片写作者（Author）与独立核验官（Verifier）必须无条件遵守本规约。
> **底座快照真源**：`${COOLIE_HOME:-/opt/coolie}/blueprints/cooliebase-all`（派生工程初始化统一走 `node scripts/cmmi-01-management.cjs init --name <slug> --title "<系统中文名>" --target <project-root>`，严禁手工散拷文件或硬编码机器容器绝对路径）。

---

## 1. 五条不可逾越的协同铁律（Hard Invariants）

1. **单写者排他所有权（Single-Writer Ownership）**：
   - 同一波次（Wave）内，**任意物理文件或目录至多归属一名写作者**；严禁两名 Agent 并发编辑同一文件。
   - 若工匠在施工中发现需修改他人分片文件（如 `prisma/schema.prisma`、`packages/shared/backend/constants/permissions.ts` 或跨域 `Domain Facade`），必须通过看板 `@` 对应所有者或 `@coordinator` 申请接口变更，严禁越界私改。
2. **包管理与命令字符串铁律（pnpm-Only & Zero Silent Catch）**：
   - 全仓文档、脚本、测试与看板指令一律只准书写 **`pnpm run <script>`** 与 **`pnpm exec <tool>`**。
   - **绝对禁止**出现裸命令（禁止未加 `pnpm` 前缀的包管理调用与临时包执行器）以及无注释空 `catch` 块，由 `pnpm run standards:check`（`no-new-npm-run`、`no-new-npx`、`no-silent-catch` 棘轮）硬性拦截。
3. **跨域边界铁律（Domain Facade Only）**：
   - 15 个第一方业务插件域（`packages/plugins/plugin-*`：`ai`、`aigw`、`bpm`、`crm`、`erp`、`im`、`iot`、`mall`、`member`、`mes`、`mp`、`online`、`pay`、`report`、`wms`）与 2 个平台核心域（`packages/domains/system`、`packages/domains/infra`）之间**严禁跨包直接 import 对方 `backend/services/*`**。
   - 一切跨域调用必须走公开的 **`Domain Facade`**（`packages/domains/<domain>/index.ts` 或插件契约动作层 `contract/*.actions.ts`），由 `pnpm run domain:check` 与 `pnpm run microservice:check` 机检守卫。
4. **双目标文档字节级一致与零机器路径（`GOAL.md ≡ docs/GOAL.md` & Zero Host Path）**：
   - 当工程存在业务立项总纲 `GOAL.md` 时，根目录 `GOAL.md` 与 `docs/GOAL.md` **必须保持字节级完全一致**（`cmp -s GOAL.md docs/GOAL.md` 退出码为 `0`）。
   - 全仓源码、规格包、脚本与测试中**严禁写入宿主机或容器挂载绝对路径字面量**，一律使用相对 `<project-root>` 路径或 `${COOLIE_HOME:-/opt/coolie}/blueprints/cooliebase-all`。
5. **极简中文导航与按钮密度铁律（`<=4` 字菜单 & `2` 字按钮）**：
   - 管理后台左侧导航栏所有**新增可见菜单标题必须 `<= 4` 个汉字**（如 `采购订单`、`库位盘点`、`结算批次`），禁止堆砌“管理列表配置中心”等冗余后缀；由 `pnpm run admin:nav:check` 与 `scripts/blueprint-engine.cjs` 自愈守卫拦截（历史导入表存量冻结于 `docs/architecture/artifacts/menu-title-length-baseline.json`）。
   - 表格工具栏与行级标准动作按钮统一采用 **`2` 字极简动词**（`新增` / `查询` / `重置` / `刷新` / `编辑` / `删除` / `导出` / `审批`），间距与表头样式统一引用 `packages/shared/frontend/lib/design-tokens.ts` 的 `UI` 常量。

---

## 2. 标准工匠编制与职责矩阵（Canonical Roster）

根据需求规模按需裁剪（单域小改动可合并 Wave 1~2，全栈新项目或多域并发必须启用独立只读 Verifier）：

| 工匠角色名 | 所属波次 | 工作区模式 | 独占写权限白名单（Single-Writer Scope） | 核心职责与交付判据 |
| :--- | :---: | :---: | :--- | :--- |
| **`contract-architect`** | Wave 0 | `inherit` / `share` | `GOAL.md`, `docs/GOAL.md`, `docs/specs/<domain>/<name>/brief.json`, `prisma/`, `packages/shared/contract/`, `packages/shared/backend/constants/permissions.ts` | 立项规格（`cmmi-02-requirements.cjs`）、`<500 Tokens` 蓝图定义、数据库模型与迁移、全局静态权限键登记（`PERMISSIONS.<DOMAIN>_<KEBAB>_<ACTION>`）、冻结跨域契约。 |
| **`backend-domain-<d>`** | Wave 1 | `share` | `packages/plugins/plugin-<d>/backend/`, `packages/plugins/plugin-<d>/routes/`, `packages/plugins/plugin-<d>/contract/`, `packages/domains/<d>/` | 按域分片实现 Repository / Service / Validator / Route / Domain Facade；静态引用 `PERMISSIONS` 键；严禁写假内存回退充当主路径。 |
| **`multi-end-ui-<d>`** | Wave 2 | `share` | `packages/plugins/plugin-<d>/frontend/`, `src/app/(admin-pages)/`, `src/app/2c/`, `clients/expo/` | 落地带 Agent-Native 属性（`data-agent-scope` / `data-agent-target` / `data-agent-state` / `inert`）的后台页、2C 门户页与 Expo 端页面；遵守 `UI` 设计 Token、`<=4` 字菜单与 `2` 字按钮。 |
| **`e2e-harness-author`** | Wave 3 | `share` | `test/e2e/`, `test/agent/`, `test/integration/`, `.env.ports`, `deploy/caddy/`, `scripts/service.sh`, `deploy/service.sh` | 基于 `scripts/lib/ephemeral-pg.cjs`（Embedded PostgreSQL 18.4，兼容 root 与普通用户零 Docker 自举）编排 6 阶段真实数据库 E2E，验证 8 动词服务控制面与网关反代。 |
| **`delivery-verifier`** | Wave 4 | `inherit`（**只读**） | **`[]`（零写权限！严禁修改任何业务源码或测试断言）** | 独立黑盒实测：跑通 8 动词 `scripts/service.sh`、全量静态门禁、真实数据库 CRUD/状态机 E2E、`GOAL.md ≡ docs/GOAL.md` 与 `<=4` 字菜单核验；通过签发 `[SEALED]`，任一失败签发 `[REJECTED]` 打回对应写作者。 |

---

## 3. 波次化流水线与看板交接协议（Wave Execution Protocol）

```text
Wave 0 (契约与规格冻结)
  └─► Wave 1 (后端插件域与 Facade 并发) ──┐
  └─► Wave 2 (B端/2C门户/Expo 前端并发) ──┴─► Wave 3 (Embedded PG 18.4 全栈 E2E & 服务编排)
                                                 └─► Wave 4 (独立只读 Verifier 终审 -> [SEALED])
```

### 3.1 波次准入与准出标准
- **Wave 0 准出**：
  1. 若为新增业务域，优先使用 `<500 Tokens` 蓝图编译：`node scripts/cmmi-03-design.cjs doctor --file <domain>.blueprint.json --write`；
  2. 若为特性/缺陷演进，先跑 `pnpm run agent:route -- "<需求原文>"`，随后执行 `node scripts/cmmi-02-requirements.cjs new` 与 `pnpm run speckit:build -- --name <spec>` 生成完整规格包；
  3. 数据库表字段、状态机跃迁表、公开 API 路径与静态 `PERMISSIONS` 常量全部落盘，`pnpm run typecheck:check` 无新增错误。
- **Wave 1 & Wave 2 准出**：
  1. 各自域内单元测试实跑全绿：`pnpm exec vitest run <test-file>`；
  2. 路由层 100% 静态取键 `PERMISSIONS.<KEY>`（删键即触发 `TS2339` 编译失败），前端表格引用 `UI.table.*` 设计 Token；
  3. 新增脚本若挂入 `package.json`，必须同步注册到 `scripts/harness.cjs`，确保 `pnpm run harness:integrity:check` 不可达脚本数为 `0`。
- **Wave 3 准出**：
  1. 严禁通过后台静默 SQL Seed 伪造运营配置（Rule 0.8 反 Seed 铁律）；必须走真实 API / 页面拟人表单提交落入真实 PostgreSQL 18.4（`scripts/lib/ephemeral-pg.cjs`）；
  2. `.env.ports` 声明端口与 `deploy/caddy/*.caddy`（首行全局块必须声明 `{ admin off }` 防止宿主机 `:2019` 冲突）保持一致；
  3. 标准 8 动词入口实测通过：`bash scripts/service.sh status` 与 `bash deploy/service.sh --help`。
- **Wave 4 终审闭环（Author ≠ Verifier）**：
  - `delivery-verifier` **绝不替作者修补一行代码**。发现缺陷时，在看板精准 `@<author-name> [REJECTED]` 并附上复现命令、退出码与报错行号；仅当全部检查项实跑 `exit 0` 时，向 `@coordinator` 签发 `[SEALED]`。

### 3.2 看板通信纪律（Low-Noise Board Etiquette）
- **零寒暄确认**：禁止发送“收到 / 开始干活”等空洞消息；首条消息必须是**分片认领、阻塞提问或实测结论**。
- **点对点唤醒**：`@name` 是唤醒门铃而非抄送（CC）。Wave 1 完工交接 Wave 2/3 时只 `@` 下一棒同伴，**中间交接严禁 `@coordinator`**；仅在终审 `[SEALED]` 或遭遇跨仓裁决阻塞时 `@coordinator`。

---

## 4. 层 B 三件套与 8 动词服务控制契约（Runtime & Service Triad）

每个 CoolieBase-All 基座及派生客户项目必须保持层 B 运维三件套完备可执行：
1. [`HARNESS.md`](HARNESS.md) —— 生命周期总纲与门禁说明；
2. [`scripts/harness.cjs`](scripts/harness.cjs) —— 机器可调度的统一 CLI 主干（`pnpm harness <cmd>`）；
3. [`scripts/service.sh`](scripts/service.sh) 与同源入口 [`deploy/service.sh`](deploy/service.sh)（均具 `+x` 可执行权限）—— 标准 **8 动词**运维控制面，自动读取 `.env.ports` / `.env.local` / `.env`：

```bash
bash scripts/service.sh install   # 离线优先校验并安装依赖 + 生成 Prisma Client
bash scripts/service.sh build     # 生成 Prisma Client + Next.js standalone 生产构建
bash scripts/service.sh start     # 守护态拉起全栈服务（自动复用或拉起 Embedded PG 18.4）
bash scripts/service.sh stop      # 优雅终止服务进程并释放监听端口
bash scripts/service.sh restart   # 平滑执行 stop -> start
bash scripts/service.sh status    # 输出 PID 存活态、监听端口与入口地址
bash scripts/service.sh health    # 真实 HTTP 探活 /api/health（期望 HTTP 200）
bash scripts/service.sh logs      # 输出最新运行日志尾部摘要
```

---

## 5. Wave 4 独立核验官 `[SEALED]` 必跑清单（Verifier Checklist）

`delivery-verifier` 签发 `[SEALED]` 前，必须逐条实跑并贴出真实退出码与摘要：

```bash
# 1. PMO 待办雷达与工作区洁净度（目标：wipCount=0, plannedCount=0, skeletonCount=0, dirty=0）
pnpm run pmo

# 2. 工程规范棘轮、类型安全棘轮与菜单 <=4 字门禁
pnpm run standards:check
pnpm run typecheck:check
pnpm run admin:nav:check

# 3. 层 B 服务 8 动词契约自检
bash scripts/service.sh --help
bash deploy/service.sh --help

# 4. GOAL 双文件字节级一致性（若工程存在 GOAL.md）
test ! -f GOAL.md || cmp -s GOAL.md docs/GOAL.md

# 5. 容器路径零泄漏自检
! grep -rn "/host-""workspace" SWARM.md AGENTS.md HARNESS.md scripts/ packages/ src/ test/

# 6. 全量门禁与目标单元/集成测试套件
pnpm run check
```

所有条目返回 `exit 0` 后，以如下标准格式封板回报：
> `@coordinator [SEALED] commit=<sha> | standards=PASS | typecheck=PASS | nav4char=PASS | check=PASS | pmo(wip=0,planned=0,skeleton=0)`
