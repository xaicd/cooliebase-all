# 租户套餐与菜单初始化

套餐和菜单的唯一业务来源是本工作区的 CoolieBase SQL：`../cooliebase-vue-pro/sql/mysql/cooliebase-vue-pro.sql`。不要手写另一套菜单或套餐目录。

## 生成与部署

1. 上游 SQL 更新后执行 `npm run catalog:sync:cooliebase`，生成 `prisma/data/menus.seed-data.ts` 与 `prisma/data/tenant-packages.seed-data.ts`。
2. 部署数据库结构：`npm run db:migrate`。
3. 写入可重复的目录与关联数据：`npm run db:seed`。

`db:seed` 会将套餐菜单完整写入 `system_tenant_package_menu`，并将旧的本地草稿套餐（1/2/3）软删除；不会删除历史记录。Docker 数据库初始化不直接挂载该业务 SQL，因为 Prisma 表结构必须先完成迁移。

## 租户运行边界

- `tenant-packages.seed-data.ts` 保留上游 CoolieBase 套餐的原始菜单清单，便于同步和追溯；它不是租户的最终可授权范围。
- 写入 `system_tenant_package_menu`、套餐编辑候选、角色授权候选、建租户首管理员初始化都会统一排除平台控制面及其所有子孙节点。识别规则同时覆盖菜单名称、路径、组件路径与权限码，不能只依赖中文名称。
- 平台控制面包括租户/套餐管理、数据源配置和 OAuth 2.0（令牌、客户端、应用）等；即使上游普通套餐原始清单包含这些节点，租户角色也不会取得这些权限。
- 套餐未勾选任何菜单表示“未授权菜单”，不是“全部菜单”。菜单树会保留安全父链，避免子菜单被提升成无父级根节点。

- 新建租户必须选择启用套餐，并同时创建首个租户管理员。
- 管理员角色菜单由套餐菜单初始化；登录、权限详情和侧栏都以角色菜单与套餐菜单的交集作为最终权限。
- 租户禁用、过期、未分配套餐或套餐停用时，普通租户用户不能重新登录。
- 租户内新增账号会执行 `accountCount` 额度检查。

平台管理员是控制面身份，保留跨租户套餐与租户管理能力。平台身份须由已验签 JWT 的 `platform-admin` 角色决定。
