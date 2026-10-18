# 业务项目身份初始化指南 (Project Profile & Refactor Bootstrap)

本仓库是交付真实商业业务项目的开箱即用工程底座。每个新业务项目派生一次代码骨架、初始化一次本地/云端数据库，之后只需自定义业务身份、品牌标识与数据，无需从零搭建中后台基座与权限脚手架。

---

## ⚡ 极速派生与自动化重构 (推荐 AI Agent 与开发者执行)

无需手动逐项编辑配置文件，推荐通过自动化派生命令 10 秒内完成：

```bash
# 1. 极速拉取干净代码骨架（0MB 历史体积）
npx degit xaicd/cooliebase-all#main my-app

# 2. 进入目录并安装依赖
cd my-app && pnpm install

# 3. 执行一键自动化重构引擎 (ProjectReactor CLI)
npm run project:init -- --name "my-app" --title "我的新业务数字化中台"

# 4. 启动本地开发服务 (http://localhost:3200)
npm run dev
```

自动化脚本会自动完成：
- 替换 `packages/shared/contract/project-profile.json` 中的品牌、中文全称、缩写与版权声明；
- 同步 `package.json` 中的项目坐标与端口设置；
- 基于真实 SQLite 数据库（`data/my-app.db`）自动执行建表迁移与种子数据填充；
- 废除任何弱口令，自动创建超级管理员账号 `supervip` 并生成 16 位加密随机密码写入 `.env.local`；
- 同步全域机器可读契约（`compat-manifest.json` 等）。

---

## 🛠️ 手动精细化配置项对照表

若需进一步定制品牌视觉或租户套餐，可针对性调整以下文件：

| 配置项 | 文件位置 | 生效时机 |
|---|---|---|
| **平台全称、简称、登录文案、版权** | `packages/shared/contract/project-profile.json` | 立即生效（页面刷新） |
| **Logo 与 Favicon 图标** | `public/branding/logo.svg`、`public/branding/favicon.svg` | 立即生效（页面刷新） |
| **默认租户名称、编码、联系人** | 同上 JSON 的 `tenants` 数组 | `npm run db:seed` 时入库 |
| **租户套餐显示名称** | 同上 JSON 的 `packages`（id 固定保持 `111` / `113`） | `npm run db:seed` 时入库 |
| **管理员显示昵称** | 同上 JSON 的 `bootstrapAdmin.nickname` | `npm run db:seed` 时入库 |
| **平台超级管理员账号与密码** | `.env.local` 中的 `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` | 系统引导初始化时入库 |

> [!IMPORTANT]
> - **严禁硬编码密码**：禁止将账号密码写入 Git 追踪的 JSON 或代码文件；
> - **安全管理员账号**：默认平台超级管理员为 `supervip`，密码由系统生成的高熵随机字符串承载；
> - **多端品牌自动对齐**：移动端 (Expo) 与 C 端客户端通过 `GET /api/v1/open/meta/project-profile` 动态获取品牌信息，统一权威真源。

---

## 🚫 绝对不动项黑名单 (Untouchable Boundaries)

在业务项目初始化过程中，**严禁修改以下底座核心结构**：
1. `packages/shared/` 核心公共 SDK 的导出契约与鉴权网关；
2. 域目录结构、API 契约路由前缀、系统基础权限码体系；
3. 跨域通信 Domain Facade 与 Broker 事件总线架构；
4. 租户隔离上下文解析逻辑（一律权威绑定 `getCurrentTenantId()`）。
