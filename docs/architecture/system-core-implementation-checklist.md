# cooliebase-all system-core 实施清单（基于 CoolieBase 原生）

更新时间：2026-08-02

## 1. 目标

把 system 域从“学习结论”推进到“可运行闭环”，且严格限定在 CoolieBase 原生能力范围内。

## 2. 数据模型必选项

1. system_users（用户）
2. system_role（角色）
3. system_menu（菜单）
4. system_user_role（用户-角色）
5. system_role_menu（角色-菜单）
6. system_tenant（租户）
7. system_tenant_package（租户套餐）

## 3. 约束必选项

1. 用户唯一字段：username / mobile / email。
2. 菜单唯一约束：同父节点同名不可重复，componentName 唯一。
3. 角色唯一约束：name / code。
4. 套餐唯一约束：name。
5. 内置对象保护：系统角色、系统租户不可误删误改。
6. 枚举约束：DataScopeEnum + MenuTypeEnum + CommonStatusEnum + UserTypeEnum。

## 4. 服务层必选项

1. UserService：创建、更新、删除、分页、登录态相关。
2. RoleService：CRUD、数据权限更新、系统角色保护。
3. MenuService：CRUD、树构建、禁用祖先过滤、菜单类型校验。
4. PermissionService：
- hasAnyPermissions
- hasAnyRoles
- assignRoleMenu（差量）
- assignUserRole（差量）
- getDeptDataPermission
5. TenantService：创建租户 + 自动创建租户管理员角色/用户、套餐变更触发权限重算。
6. TenantPackageService：套餐 CRUD + 使用中保护 + 变更联动租户权限收敛。

## 5. 鉴权链必选项

1. Controller 使用权限注解调用统一权限服务。
2. 提供 ss 风格权限入口（或等价表达层），可无缝承接 permission code 判断。
3. 登录后权限信息接口包含：
- user
- roles
- permissions
- menus（剔除按钮）

## 6. 缓存必选项

1. USER_ROLE_ID_LIST（用户 -> 角色）
2. MENU_ROLE_ID_LIST（菜单 -> 角色）
3. PERMISSION_MENU_ID_LIST（permission -> 菜单）

并在授权更新、角色删除、菜单删除时做精确或全量失效。

## 7. API 路由最小集合

1. /api/admin/system/users
2. /api/admin/system/roles
3. /api/admin/system/menus
4. /api/admin/system/permissions/assign-user-role
5. /api/admin/system/permissions/assign-role-menu
6. /api/admin/system/tenants
7. /api/admin/system/tenant-packages
8. /api/admin/system/auth/login
9. /api/admin/system/auth/get-permission-info

## 8. 验收标准（六要素）

每个子域都必须通过：

1. API
2. Service
3. Page
4. Permission
5. Log/Audit
6. Test

任一缺失，不得标记 DONE。
