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
| 数据持久化 | 支持嵌入式真 SQLite（零外部依赖秒起）与生产级 PostgreSQL / MySQL，绝不在生产模式降级内存 |
| 唯一网关基线 | 动态 BasePath 规范（`/${slug}`），单一端口（默认 `:3300`），绝不硬编码绝对子路径 |

---

## 2. 核心入口与契约矩阵

| 优先级 | 文件 | 用途 |
|---|---|---|
| ★ | **`HARNESS.md`**（本文件） | 一图总览：交付物规范 + 统一生命周期环节 + 自证矩阵 |
| ★★ | [`AGENTS.md`](AGENTS.md) | 宪法与红线法典（唯一真源） |
| ★★ | [`compat-manifest.json`](compat-manifest.json) | 下游消费契约（机器可读，`pnpm compat:check` 强校验） |
| ★★ | [`scripts/harness.cjs`](scripts/harness.cjs) | 统一全生命周期 Harness 执行引擎（`pnpm harness <action>`） |
| ★★ | [`scripts/service.sh`](scripts/service.sh) | 物理服务运维控制器（与 `pnpm harness` 完全等价映射） |

---

## 3. 交付物标准 Harness 9 大闭环生命周期环节

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
