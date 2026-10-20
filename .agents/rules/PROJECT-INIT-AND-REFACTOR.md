# PROJECT INITIALIZATION & REFACTOR RULES (项目初始化与重塑工程规范)

本规范定义了将 `cooliebase-all` 作为业务项目底座时的重塑与初始化铁律。

## 1. 原地重塑与派生克隆双模原则
- **原地重构模式 (In-Place)**：开发者或 AI Agent 在当前目录直接工作时，运行 `pnpm run project:init` 或 `scripts/project-init.cjs`。自动更新 `packages/shared/contract/project-profile.json`、`package.json`、`.env`/`.env.local` 与 Git Remote。
- **派生克隆模式 (Hatch)**：使用 `--target <dir> --profile minimal|standard` 派生新工程。裁掉的业务域必须彻底清理（依赖、静态表、映射清单），绝不允许残留破损 import。

## 2. 真实数据库初始化规范 (Zero External Dependency)
- 任何业务项目初始化完成后，必须通过 `pnpm run db:bootstrap:sqlite` 生成本地单文件数据库 (`data/cooliebase.db`)。
- 数据库必须自动注入：
  1. 平台核心超级管理用户 `supervip`（严禁使用 `admin` 等运营商黑名单关键字；密码必须使用高强度随机密码，持久化至 `.env.local`，绝不允许硬编码弱口令）；
  2. 超级管理员角色与默认租户（`default`）；
  3. 完整的 8 大企业级审计底座字段。
- 绝不允许强制依赖外部未运行的 PostgreSQL/MySQL 导致项目初始化后无法跑通。

## 3. 品牌与契约同步铁律
- 更新系统名称与标题后，必须自动同步更新 `project-profile.json`。
- 前端组件与页面标题严禁硬编码项目名，必须统一引用 `projectProfile.platformName` 与 `projectProfile.shortName`。
- 初始化后必须跑通 `pnpm run check`，保持所有架构契约一致。

## 4. 免下载全量 Git 历史的“一键骨架派生”能力 (Zero-Git-History Hatching)
- **免 Git 历史派生铁律**：严禁在创建新业务工程时无端下载基座 500MB+ 的全量历史提交；必须通过 degit、shallow clone 或 tarball 流式解包，极速生成 0MB 历史的干净骨架。
- **一键派生命令**：
  ```bash
  # 远程一键极速孵化（无需提前克隆仓库）
  curl -fsSL https://raw.githubusercontent.com/xaicd/cooliebase-all/main/scripts/hatch.sh | bash -s -- <target-dir> --profile base --title "新系统标题"
  ```
- **规格分级**：
  - `base` (默认推荐): 平台核心地基 (`shared` + `system` + `infra`)，体积 ~50MB，秒级编译，业务白板；
  - `minimal`: 地基 + 平台伴生域 (`online`/`ai`/`aigw`)；
  - `standard`: 17 个全量原生业务域与客户端；
  - `vertical`: 地基 + `--bundle mall,crm` 等指定业务域。
- **独立任务痕迹与指纹地基**：
  - 骨架派生后自动执行 `git init` 并提交基线快照（`feat: 派生自 cooliebase-all`），为新工程提供独立的任务痕迹（`[T1]` commit）与交付指纹支持。

