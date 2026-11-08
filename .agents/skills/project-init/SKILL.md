---
name: project-init
description: 业务项目初始化与原地重构技能，用于将 cooliebase-all 底座一键重构为客户专属的商业项目（自定义项目名称、中文系统全称、Git 远程仓库地址、数据库名与端口、版权声明）。接到「项目初始化 / 重命名项目 / 重构底座 / projectRefactor / 初始化新项目」时启用。
---

# 业务项目初始化与重构技能 (Project Refactor & Init Skill)

## 1. 何时启用

- 用户需要把 `cooliebase-all` 底座作为新业务项目的起点。
- 用户要求重命名项目、修改中英文系统名称、绑定新 Git 仓库地址。
- 用户在请求中提到项目初始化 / 重命名项目 / 重构底座 / projectRefactor 一类的需求（不区分命名风格）。
- 需要将底座从模板状态快速迁移为专属业务工程。

## 2. 核心执行机制

项目提供了自动化重构引擎脚本 `scripts/project-init.cjs`，支持两种模式：

### 模式 A：原地重构当前底座 (In-place Refactor)
当用户直接克隆或在现有目录中开发时使用：
```bash
node scripts/project-init.cjs --in-place \
  --name <kebab-project-name> \
  --title "<中文系统全称>" \
  --short-name "<中文简称>" \
  --git "<git-remote-url>" \
  --port <端口号, 默认 3200> \
  --author "<公司/团队名称>"
```

### 模式 B：派生克隆至新目录 (Hatch to New Target)
从当前底座生成一个全新的独立业务工程：
```bash
node scripts/project-init.cjs \
  --target <目标目录路径> \
  --name <kebab-project-name> \
  --title "<中文系统全称>" \
  --git "<git-remote-url>"
```

## 3. Coolie工坊与 27B 本地模型蓝图变量引擎 (`blueprint.template.json`)

当由 **Coolie工坊 (Coolie Workshop)** 或 **27B 本地大模型** 驱动新业务系统初始化与全栈定制时，优先使用根目录的 **`blueprint.template.json`** 与 **`scripts/blueprint-engine.cjs`**：

- **全栈使用说明手册（必读）**：`docs/04_implementation/lowcode-system-dev-manual.md`
- **模板变量注册表**：`blueprint.template.json`（涵盖 8 大动态变量域、79 个 `{{VAR}}` 占位符与 5 套行业预设：`ecommerce` / `culture_tourism` / `smart_manufacturing` / `saas_crm_erp` / `healthcare_service`）
- **4 条核心执行指令**：
  ```bash
  # 1. 输出 <800 Tokens 极简变量清单（供 27B 模型上下文直接读取）
  node scripts/blueprint-engine.cjs schema --compact

  # 2. 按行业预设 + 自定义键值一键渲染全仓模板文件 (.env / project-profile.json / clients/expo/app.json)
  node scripts/blueprint-engine.cjs render --preset culture_tourism \
    --set PROJECT_DISPLAY_NAME="云栖智慧文旅平台" \
    --set PORTAL_HERO_TITLE="全域景区票务与酒店一站式预订中枢"

  # 3. 校验模板完整性与残留未替换的 {{VAR}}
  node scripts/blueprint-engine.cjs check

  # 4. 将 30 行极简业务实体 JSON 自动编译为全栈 CodegenConfig + PageBlockDSL v2 画布
  node scripts/blueprint-engine.cjs compile-domain --input <domain.json>
  ```

## 4. 重构覆盖范围与自动化闭环

执行此命令后，系统会自动完成以下 7 项闭环操作：
1. **业务身份契约更新**：自动重写 `packages/shared/contract/project-profile.json` 中的 `platformName`, `shortName`, `loginHeadline`, `copyright` 以及门户/多端/设计器蓝图变量；
2. **工程包名重写**：自动重写 `package.json` 的 `name` 与 `dev` 端口；
3. **环境变量更新**：自动同步 `.env` 与 `.env.local` 中的 `NEXT_PUBLIC_APP_TITLE`, `DB_NAME`, `SQLITE_DB_PATH`, `PORT`；
4. **Git 远程仓库绑定**：如果提供了 `--git` 参数，自动执行 `git remote set-url origin` 或 `git remote add origin`；
5. **契约图谱重新编译**：自动执行 `node scripts/write-seam-graph.cjs` 与 `node scripts/write-domain-manifests.cjs`；
6. **本地轻量数据库自检**：重构后执行 `pnpm run db:bootstrap:sqlite` 生成新项目的专属 SQLite 库；
7. **全自动化门禁自检**：重构完成后运行 `pnpm run check` 确保工程门禁依然 100% 通过。
