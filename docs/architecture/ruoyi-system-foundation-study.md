# CoolieBase 系统基础能力学习笔记（第一轮）

## 1. 学习目标

本轮只做一件事：把系统基础能力的真实实现链路看清楚，而不是只看页面。

覆盖范围：
- 用户
- 菜单
- 角色与权限
- 部门与岗位
- 租户
- 租户套餐

## 2. 总体架构观察

1. 后端采用 controller + service + mapper 分层，controller 只做入参/鉴权/出参。
2. 权限判断统一依赖 `@PreAuthorize("@ss.hasPermission('xxx')")`。
3. 多租户不是单纯加字段，而是贯穿：套餐菜单约束、租户账号额度、租户角色权限重算。
4. 角色/菜单/用户关系通过关联表维护，更新时采用“差量新增 + 差量删除”。
5. 缓存在权限链路里是第一层能力（菜单权限、角色权限、用户角色都有缓存）。

## 3. 能力映射（后端）

### 3.1 用户（User）

核心文件：
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/user/UserController.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/service/user/AdminUserServiceImpl.java`

关键点：
1. 创建用户前会校验租户账号额度（`accountCount`）。
2. 用户唯一性校验（用户名/手机/邮箱）会显式绕过数据权限，避免误判。
3. 用户删除会级联清理用户角色关系与岗位关系。
4. 禁用用户会主动清理 token。
5. 支持导入导出、重置密码、按昵称搜索精简用户（用于 IM/好友场景）。

### 3.2 菜单（Menu）

核心文件：
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/permission/MenuController.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/service/permission/MenuServiceImpl.java`

关键点：
1. 菜单类型有严格约束：按钮类型会自动清空 component/icon/path。
2. 校验项完整：父节点合法性、同级名称唯一、componentName 唯一。
3. 删除菜单前强制检查子菜单，删除后会清理角色菜单授权。
4. 在多租户场景会按租户套餐过滤菜单集合。
5. 支持“过滤禁用祖先链菜单”，避免脏树结构被展示。

### 3.3 权限（Permission）与角色（Role）

核心文件：
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/permission/PermissionController.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/service/permission/PermissionServiceImpl.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/service/permission/RoleServiceImpl.java`

关键点：
1. 角色菜单分配和用户角色分配都走差量算法（避免全删全插）。
2. 超级管理员角色有兜底逻辑（权限检查短路放行）。
3. 数据权限支持 ALL / 自定义部门 / 本部门 / 本部门及子部门 / 仅本人。
4. 内置系统角色禁止删除或更新。
5. 角色删除会级联清理 user-role 与 role-menu 关系。

### 3.4 部门（Dept）与岗位（Post）

核心文件：
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/dept/DeptController.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/dept/PostController.java`

关键点：
1. 部门和岗位均为标准 CRUD + simple-list 下拉接口。
2. 岗位支持分页、导出、批量删除。
3. 用户创建/更新会联动校验部门与岗位的有效性。

### 3.5 租户（Tenant）

核心文件：
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/tenant/TenantController.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/service/tenant/TenantServiceImpl.java`

关键点：
1. 创建租户时会自动创建租户管理员角色、管理员用户并绑定。
2. 租户名和绑定域名都做唯一性校验。
3. 更新租户套餐时会触发“租户内角色权限重算”。
4. 系统内置租户不可删除/不可修改关键属性。
5. 提供免鉴权接口用于登录页按租户名或域名识别租户。

### 3.6 租户套餐（TenantPackage）

核心文件：
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/controller/admin/tenant/TenantPackageController.java`
- `cooliebase/cooliebase-vue-pro/yudao-module-system/src/main/java/cn/iocoder/yudao/module/system/service/tenant/TenantPackageServiceImpl.java`

关键点：
1. 套餐包含菜单权限集（menuIds），是租户权限上限。
2. 套餐修改菜单后会批量重算所有使用该套餐租户的角色菜单。
3. 套餐删除前必须确认无租户在使用。
4. 套餐名称唯一，且状态可控（启用/禁用）。

## 4. 前端页面与 API 对照

后端接口在前端都有一一对应封装：
- 用户 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/user/index.ts`
- 菜单 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/menu/index.ts`
- 权限 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/permission/index.ts`
- 角色 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/role/index.ts`
- 部门 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/dept/index.ts`
- 岗位 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/post/index.ts`
- 租户 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/tenant/index.ts`
- 租户套餐 API：`cooliebase/yudao-ui-admin-vue3/src/api/system/tenantPackage/index.ts`

页面入口（管理端）:
- 用户页：`cooliebase/yudao-ui-admin-vue3/src/views/system/user/index.vue`
- 角色页：`cooliebase/yudao-ui-admin-vue3/src/views/system/role/index.vue`
- 菜单页：`cooliebase/yudao-ui-admin-vue3/src/views/system/menu/index.vue`
- 租户页：`cooliebase/yudao-ui-admin-vue3/src/views/system/tenant/index.vue`
- 套餐页：`cooliebase/yudao-ui-admin-vue3/src/views/system/tenantPackage/index.vue`

## 5. 对 cooliebase-all-base 的落地启示

1. 先做“关系模型”再做页面：user-role、role-menu、tenant-package 是核心链。
2. 权限缓存与失效策略要提前设计，否则后期性能和一致性会一起出问题。
3. 多租户最重要的是“套餐变更后的权限收敛”，不是简单加 tenantId。
4. 用户模块必须联动岗位/部门/权限，而不是单表 CRUD。
5. 生成器模板要支持系统基础模块全链路文件，不仅是列表页。

## 6. 下一步学习计划（第二轮）

1. 深读 mapper + DO + 枚举（尤其数据权限与菜单类型约束）。
2. 深读登录鉴权链路（用户登录、菜单路由装载、permission 指令）。
3. 提炼 cooliebase-all-base 对应的数据模型与最小可运行骨架（system-core module）。

---

## 7. 第二轮补充（DAL + 枚举 + 鉴权链路）

### 7.1 DAL 关键事实（Mapper）

本轮聚焦 user / permission / tenant 三组 Mapper：

1. `AdminUserMapper`：支持用户名/邮箱/手机号唯一查询，以及分页条件组合（状态、创建时间、部门、用户集合）。
2. `MenuMapper`：菜单同级重名校验、子菜单计数、permission 反查菜单、componentName 唯一校验。
3. `RoleMapper`：角色名/编码唯一校验基础查询，分页以 sort 升序。
4. `RoleMenuMapper` 与 `UserRoleMapper`：均以内聚的 relation 表操作为主，提供按角色/菜单/用户维度的增删查。
5. `TenantMapper`：租户名称唯一、域名集合匹配、套餐关联租户计数。
6. `TenantPackageMapper`：套餐名唯一与状态筛选。

结论：

1. CoolieBase 系统基座的数据访问风格是“薄 Mapper + 业务在 Service 编排”。
2. 关系表的差量更新逻辑不在 Mapper，而在 PermissionService。

### 7.2 数据对象（DO）关键事实

1. `AdminUserDO`、`RoleDO` 继承 `TenantBaseDO`，天然携带 tenant 字段。
2. `MenuDO`、`TenantDO`、`TenantPackageDO` 标注 `@TenantIgnore`，说明它们属于跨租户基座数据。
3. `RoleDO.dataScope` + `dataScopeDeptIds` 直接落在角色模型里，数据权限是角色级能力。
4. `TenantPackageDO.menuIds` 作为套餐权限上限，租户与角色权限通过它收敛。

结论：

1. system-core 的最小模型必须先有：用户、角色、菜单、用户角色、角色菜单、租户、租户套餐。
2. 缺其中任一关系，后续权限闭环会失真。

### 7.3 枚举约束（Enum）

1. `DataScopeEnum`：ALL / DEPT_CUSTOM / DEPT_ONLY / DEPT_AND_CHILD / SELF。
2. `MenuTypeEnum`：DIR / MENU / BUTTON。
3. 大量模型字段引用 `CommonStatusEnum` 与 `UserTypeEnum`，是系统一致性基础枚举。

结论：

1. all-next 必须优先固化这组枚举语义，避免页面与后端出现“同名不同义”。

### 7.4 鉴权调用链（从注解到判定）

链路证据：

1. 控制器侧使用 `@PreAuthorize("@ss.hasPermission('...')")`。
2. `@Bean("ss")` 在 `YudaoSecurityAutoConfiguration` 注册为 `SecurityFrameworkServiceImpl`。
3. `SecurityFrameworkServiceImpl.hasAnyPermissions()` 调 `PermissionCommonApi.hasAnyPermissions(userId, ...)`。
4. `PermissionApiImpl` 转发到 `PermissionServiceImpl`。
5. `PermissionServiceImpl` 基于用户角色缓存、菜单权限缓存、角色菜单关系做权限判定；并带超管兜底。

补充：

1. 登录后权限菜单构建在 `AuthController.getPermissionInfo()` + `AuthConvert.buildMenuTree()`，按钮类型菜单会被剔除，仅菜单树保留目录/页面。

结论：

1. all-next 若要对齐 CoolieBase，必须同时实现“权限判定链 + 菜单树装配链”，不能只做静态菜单。

## 8. system-core 落地最小闭环（实现级）

1. 模型闭环：User / Role / Menu / UserRole / RoleMenu / Tenant / TenantPackage。
2. 能力闭环：登录获取权限信息、角色差量授权、菜单差量授权、租户套餐变更触发权限重算。
3. 约束闭环：系统内置角色/租户保护、禁用状态过滤、数据权限五档。
4. 性能闭环：至少三类缓存键（用户角色、菜单角色、permission->menu）。

## 9. 下一步（第三轮）

1. 深读 system 的 dict/logger/oauth2 模块 Mapper 与 Service，补齐通用基座能力证据。
2. 输出 all-next 的 system-core 关系模型草案（表结构 + 约束 + 迁移顺序）。
3. 把当前学习结论同步到 capability matrix 的执行备注，形成可追踪迁移任务。
