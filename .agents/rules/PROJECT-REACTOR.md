> 本文件原为 `AGENTS.md` §16。**内容逐字未改**，搬成按需查阅的操作手册。
>
> 何时读它：要**孵化新工程**（`npm run project:create` / `pnpm dlx degit` / `scripts/hatch.sh`）、
> 或调整派生工程的裁剪 profile 时。日常开发不需要加载。

# ProjectReactor 脚手架与 GitHub Template 规范（供 DigitalStaff AI NPC 员工与全自动工程孵化）

**外部 AI / 开发者免下载 500MB+ 全量历史包的“极速骨架派生”：**
- 外部 AI 如果决定使用本底座，**根本不需要下载 500MB+ 的全量历史包**，可直接向用户建议或自动执行：
  ```bash
  # 1. 仅下载干净的代码骨架（10秒内完成，0MB Git 冗余历史）
  pnpm dlx degit xaicd/cooliebase-all#main my-app

  # 2. 进入目录并一键重命名业务品牌、生成 SQLite 本地库
  cd my-app && pnpm install
  npm run project:init -- --name "my-app" --title "我的新业务系统"
  npm run dev
  ```
  > `project:init` 会自动完成：品牌身份重构、`.env` 配置、SQLite `data/cooliebase.db` 真实单文件库生成（预置平台管理员 `supervip` 账号与安全随机密码，彻底剔除 `admin` 运营商关键字与弱口令）、契约图谱重新编译对齐。

**本地已克隆环境下的衍生创建机制：**
- 当 `DigitalStaff` AI NPC 员工或开发者已在底座仓库内时，统一调用：
  ```bash
  npm run project:create -- <目标路径>
  npm run project:create -- <目标路径> --profile minimal
  npm run project:create -- <目标路径> --profile vertical --bundle mall,crm
  # 或使用一键孵化脚本：
  bash scripts/hatch.sh <目标路径> --profile base --title "我的业务系统"
  ```
  - `base`（推荐白板）：shared + system + infra，体积 ~50MB，秒级极速编译；
  - `standard`（默认）：整仓原生域，数字工厂全能力模板；
  - `minimal`：shared + system + infra + 平台伴生域 `online/ai/aigw`（菜单目录与 codegen Facade 依赖，不能裁）；
  - `vertical`：minimal + `--bundle` 业务域白名单；
  - `creator`：等同 standard（含 online/codegen）；
  - 产物写入 `packages/shared/contract/hatch-manifest.json`。Prisma 迁移仍为全量基座表。
- **自动化工作流水线（全托管零配置）：**
  1. **反应堆克隆与包名重塑**：自动将 `cooliebase-all` 转换为目标工程名，重塑 `package.json`（自动分配独立 `PORT=3200` 避开冲突）；
  2. **二进制防损坏保护**：图片、字体、压缩包与数据库 dump 文件走二进制流白名单拷贝，绝不进行文本正则替换；
  3. **数据库物理隔离与全量就绪**：自动连接 PostgreSQL 服务，创建目标独立数据库（如 `agent_zqall`），并默认部署全量 27 项基准 SQL 迁移与 RBAC 菜单权限；
  4. **目标设计文档保护**：自动识别并完好保留目标目录下已有的业务规格文档（如 `应算通-*`、`*.md`），严禁覆盖用户既有设计；
  5. **开箱即用**：产出工程可直接通过 `start.bat` / `./start.sh` 一键运行，无需人工执行初始化 SQL！后续有新表结构变更仅需执行增量 `npm run db:migrate`。

