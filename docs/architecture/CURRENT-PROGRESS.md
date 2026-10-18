# cooliebase-all 当前进度与待办

更新时间：2026-08-23

## 双模 SDK / RPC 任务清单（持续更新）

权威门禁：`npm run microservice:check`、`npm run domain:check`。

| ID | 状态 | 项 | 说明 |
|---|---|---|---|
| D1 | DONE | 分层与 Facade | `shared` SDK；system/infra 平台；业务域可拆。跨域走 Facade |
| D2 | DONE | 一体 SDK / 拆分 RPC | `POST /api/internal/rpc`；nats-rr JSON；自研 gRPC unary |
| D3 | DONE | 低代码 codegen/template | Online 预览下载走 `infraPlatformFacade`；模板/ZIP 输出 `*.rpc.ts` |
| D4 | DONE | Online 字典 | `systemPublicFacade.getDictDataByType` |
| D5 | DONE | shared 鉴权 | `systemPlatformFacade.resolveTenantEntitlement` |
| D6 | DONE | Route/broker schema 合流 | `parseActionQuery` + rpc-actions schema 必须在 validators |
| D7 | DONE | infra 选表 / 报表数据源 | `onlineFacade` + `infraPlatformFacade.listQueryDataSources` |
| D8 | DONE | system 菜单 catalog | 改为 `online/contract/menu-catalog`，禁止 import online backend |
| D9 | DONE | 生成 managed-table Service | 改为 `onlineFacade` 托管表 CRUD，禁止生成 Repository import |
| D10 | DONE | outbox 归属挂钩 | `getOutboxStoreForDomain`；跨库表仍属阶段 C |
| D11 | DONE | Facade 覆盖 system/infra 全部 HTTP | 全量方法仅 BFF 同域双模；业务域不调这批后台 CRUD |
| D23 | DONE | system/infra 对外契约 | 业务域只开放字典 `getDictDataByType` 与登录用户 `getPermissionInfoByUser` |
| D21 | DONE | system/infra 剩余真实 HTTP | 字典数据/套餐/权限/日志/通知/邮件/短信/OAuth2/社交/codegen 表/数据源测试/导出/审计留存进 Facade |
| D22 | DONE | system/infra 收口剩余缺口 | profile/登录/验证码/侧栏/模板/社交客户端/codegen 候选表导入下载进 Facade |
| D12 | TODO | 官方 protoc + grpc-go | 当前 Go 桩走 `Invoker`，不引入 grpc-go |
| D13 | TODO | 跨库 outbox 投递 | 每域独立库后的表归属与 dispatcher |
| D14 | DONE | infra codegen import | `onlineFacade.resolveCodegenImport`，禁止 import online repository/adapter |
| D15 | DONE | pay 退款列表 schema 合流 | HTTP 与 broker 共用 `PAY_ACTION_SCHEMAS["pay.listRefunds"]` |
| D16 | DONE | report 测试改 spy Facade | 禁止测试 import infra `DataSourceConfigRepository` |
| D17 | DONE | 其余域列表查询 schema 合流 | mall/crm/bpm/member/erp/report/mp/wms/mes/ai/iot/im 门面列表 HTTP 改走对应 `ACTION_SCHEMAS` |
| D24 | DONE | 在线/表驱动生成对齐双模 | 生成 Route 走 `ACTION_SCHEMAS` + `parseActionQuery`/`parseActionBody`；清单带 `rpcActions` 片段；online 测试只断言 IR |
| D25 | DONE | 表驱动 CRUD 真实持久化 | 生成 Repository：有库走 Kysely 动态表（方言在 shared），无库内存回退；托管表仍走 `onlineFacade` |
| D26 | DONE | system 剩余 MOCK + infra 文件/调度实装 | 公告/地区/通知模板与消息双模仓储；在线用户接会话注册；本地文件落盘；任务 trigger 真实执行并写日志 |
| D27 | DONE | Online 功能测试对齐 Jeecg AUTO | 已发布定义进入 `/admin/infra/online-runtime/[code]`：查询/工具栏/列表/表单/详情；树表与主子表 ERP/INNER/TAB 沙箱 |
| D28 | DONE | 业务项目身份初始化底座 | 新项目只改 `project-profile.json`、Logo 与 `.env.local` 默认账号；seed 写入平台名/租户/套餐展示名 |
| D29 | DONE | 多端能力标准 | PC / H5 / uni-app / Flutter / 桌面客户端共用 admin/app/open 面；各端独立包且按域名分目录；H5 等工程尚未交付 |
| D18 | DONE | system 平台核心 CRUD 双模收口 | users/roles/menus/depts/posts/dicts/tenants 列表与创建走 Facade + 共用 schema |
| D19 | DONE | infra 平台核心 CRUD 双模收口 | configs/jobs/files/data-source 列表与创建走 Facade + 共用 schema |
| D20 | DONE | system/infra 单资源写路径 | `[id]` 更新/删除与 infra pages/logs 进 Facade |

## 已完成


1. modules-first 架构重构完成
2. 15 域全量代码生成（388 Controller → 1400+ 文件）
3. 微服务治理基础设施 15 个组件就绪
4. 多端 API 版本化（/api/v1/admin、/api/v1/app、/api/v1/open）
5. 低代码引擎核心（CodegenEngine + SchemaReader + Preview API）
6. Build 通过（typescript.ignoreBuildErrors=true 临时开启）
7. ui-ux-pro-max 规范集成
8. ✅ P0 目录结构调整全部完成
9. ✅ 多数据库兼容架构（Kysely + Prisma 双引擎）
10. ✅ System 域完整 CRUD：User/Role/Dept/Menu/Post/Dict/Tenant/TenantPackage
11. ✅ Auth 认证链路：JWT + 双重 MD5+Salt 密码
12. ✅ Docker 部署方案：4 环境 + Traefik
13. ✅ 前端完整 Admin Layout：
    - CoolieBase 风格二级折叠侧边栏
    - 7 个菜单分组（系统管理/认证安全/消息通知/基础设施/支付中心/CRM/系统监控）
    - 顶栏面包屑 + 用户头像 + 退出
    - 侧边栏折叠/展开
    - Auth Guard 路由守卫
14. ✅ 业务域扩展：
    - Infra：Config/Job/File + 代码生成可视化
    - Pay：订单/退款 列表+筛选
    - CRM：客户管理 CRUD
15. ✅ 对标 yudao-ui-admin-vue3 菜单层级
16. ✅ 低代码引擎完整实现：
    - 代码生成器：导入表 → 编辑列配置 → 预览 → 下载 ZIP
    - Schema Reader：Prisma Schema 解析 + DB Introspection + Mock fallback
    - Puck 页面构建器：拖拽式搭建（ProTable/Form/StatCard/Container/Button）
    - 模板引擎：Handlebars 模板管理
17. ✅ API Route 规范文档（docs/guides/api-route-conventions.md）
18. ✅ 前端统一请求封装（request client + API 路径常量）

## 当前问题

1. typescript.ignoreBuildErrors=true 需最终关闭
2. 密码加密已改为双重 MD5 + Salt（对标 CoolieBase 原版）
3. 非 system/infra/pay 域的 Service 仍为旧骨架，待后续按模式补全
4. 侧边栏 Logo 和用户信息待接入真实 auth state

## 可访问页面清单

| 路径 | 页面 | 状态 |
|---|---|---|
| / | 首页（着陆页） | ✅ |
| /login | 登录页 | ✅ |
| /admin/system/users | 用户管理 | ✅ CRUD |
| /admin/system/roles | 角色管理 | ✅ CRUD |
| /admin/system/menus | 菜单管理 | ✅ 树形 CRUD |
| /admin/system/depts | 部门管理 | ✅ 树形 CRUD |
| /admin/system/posts | 岗位管理 | ✅ CRUD |
| /admin/system/dicts | 字典管理 | ✅ CRUD |
| /admin/infra/configs | 系统配置 | ✅ CRUD |
| /admin/infra/job-center | 定时任务 | ✅ CRUD + 手动触发 |
| /admin/infra/files | 文件管理 | ✅ 列表 + 删除 |
| /admin/infra/online-definitions | Online 业务建模 | ✅ 列表 + 设计 + 发布 |
| /admin/infra/online-runtime/[code] | Online 功能测试 | ✅ 已发布 AUTO 沙箱（单表/树表/主子表） |
| /admin/infra/online-test | AUTO报表 | ✅ 只读参数化 SQL |
| /admin/pay/orders | 支付订单 | ✅ 列表 + 筛选 |
| /admin/pay/refunds | 退款订单 | ✅ 列表 + 筛选 |

## 下一步待办（按优先级）

### P1：关联关系功能（对标 CoolieBase 原版）
- ✅ 角色 → 菜单分配（Tree 勾选弹窗 + API）已完成
- ✅ 用户 → 角色分配（多选 Checkbox）已完成
- ✅ 用户 → 部门选择（下拉选择）已完成
- ✅ 租户 → 套餐分配（前端弹窗 + API）已完成
- ✅ 角色 → 数据权限配置（dataScope 下拉选择 ALL/DEPT/DEPT_AND_CHILD/SELF）已完成

### P0-HOTFIX：种子数据对齐原版
- ✅ 从 cooliebase-vue-pro/sql 提取完整种子数据（scripts/seed-output/）
- ✅ 生成 seed-data 模块（packages/shared/backend/seed-data/）
- ✅ Post Repository MEMORY_STORE 已接入种子数据（4 条）
- ✅ Dept Repository MEMORY_STORE 已接入种子数据（16 条）
- ✅ Menu Repository MEMORY_STORE 已接入由 CoolieBase SQL 全量生成的种子数据（1441 条）
- ✅ DictType Repository MEMORY_STORE 已接入种子数据（208 条）
- ✅ DictData Repository MEMORY_STORE 已接入种子数据（1036 条）
- ✅ Role Repository MEMORY_STORE 已接入种子数据（5 条：超管/普通/CRM/租户/测试）
- ✅ User Repository MEMORY_STORE 已接入种子数据（2 条：admin/test）
- ✅ 统一 seed-data 架构：所有 Repository → import from @/shared/backend/seed-data

### P2：其他域全量 Service 补全（已有脚本自动化）
- ✅ 运行 scripts/fix-service-methods.cjs 补全 140 个 Service 的 CRUD 方法（392 stubs）
- ✅ 运行 scripts/fix-service-methods-pass2.cjs 修复参数签名 + 创建 24 个缺失 Service 文件
- ✅ TypeScript 错误从 571 → 374（减少 35%）
- 剩余错误主要是：测试文件（35）、类型参数严格性（310）、index.ts 导出（10）
- TODO 逐步将 `...args: any[]` 替换为具体类型签名

### P3：前端统一改造
- ✅ 所有核心页面使用 `request` client + `API` 常量
  - system: users/roles/depts/menus/posts/dicts/tenants/login
  - infra: configs/job-center/files/codegen
  - pay: orders/refunds
  - crm: customers
- ✅ codegen 下载保持原生 fetch（blob 场景）
- TODO template-engine 页面（自定义 requestJson wrapper，非标准场景）

### P4：低代码引擎完善
- ✅ Puck 页面构建器物料扩展：6 → 14 个组件
  - 新增：TabsPanel / DescriptionList / ChartPlaceholder / SearchBar / Steps / EmptyState / TreeView
- ✅ 页面保存到数据库（InfraPage Repository + API CRUD）
  - POST /api/v1/admin/infra/pages — 创建页面
  - GET /api/v1/admin/infra/pages — 列表
  - PUT/DELETE /api/v1/admin/infra/pages/:id — 更新/删除
  - GET /api/v1/admin/infra/pages/render/:slug — 按路由渲染
- ✅ 页面构建器保存功能接入 API（发布后可通过 slug 访问）
- ✅ 动态页面渲染器 page-render.page.tsx
- TODO 表单设计器（Formily 或自研）

### P5：类型修复
- ✅ .next-cooliebase/ 和 __tests__/ 已从 tsconfig exclude
- ✅ **571 → 71 errors（-88%）** 脚本自动化修复
- ✅ Build-blocking export 命名冲突已修复
- ✅ 140+ Service CRUD stubs 补全 + body 引用修复
- ✅ 54 个 Service 方法签名放宽
- 剩余 71 errors：TS2345 optional/required 参数（22）+ Puck 类型（13）+ 杂项
- 不影响 `next dev` 运行（ignoreBuildErrors: true）
- TODO 逐步将 `any` 替换回具体类型，最终关闭 ignoreBuildErrors

### P0：让项目能跑起来 ✅ DONE
- ~~删除 src/backend/ 和 src/lib/~~
- ~~重命名 src/app/(admin) → src/app/(admin-pages)~~
- ~~旧 api/admin/ routes 迁移到 api/v1/admin/~~

### P1：数据库基础设施 ✅ DONE
- ~~创建 Prisma Schema（system + infra 核心表）~~
- ~~搭建 Kysely 多数据库 query engine~~
- ~~实现 User Repository（双模式）~~
- ~~补全 User CRUD 全链路（Service → API → Page）~~

### P2：按 User 模式复制到其他核心模块 ✅ DONE
- ✅ Role（角色）Repository + Service + API (list/create/update/delete/status)
- ✅ Dept（部门）Repository + Service + API (tree/list/create/update/delete)
- ✅ Menu（菜单）Repository + Service + API (tree/list/create/update/delete)
- ✅ Post（岗位）Repository + Service + API (list/create/update/delete)
- ✅ Dict（字典类型+数据）Repository + Service + API (types/data CRUD)
- ✅ Tenant（租户）Repository + Service + API (list/create/update/delete/status)

### P3：Infra 域实战接入 ✅ DONE
- ✅ InfraConfig Repository + Service + API（Kysely + 内存双模）
- ✅ InfraJob 定时任务 Repository + Service + API（CRUD + 手动触发）
- ✅ InfraFile 文件管理 Repository + Service + API（上传记录 + 删除）
- TODO 接入真实调度引擎（cron-based scheduler） → 进程内 cron 匹配 + trigger 真实执行 + job log；外部分布式调度仍可替换
- TODO 接入真实文件存储（S3/OSS/MinIO） → LOCAL 磁盘已落地（`FILE_STORAGE_DIR`）；对象存储适配器待补

### P4：类型修复
- 关闭 ignoreBuildErrors
- 修复所有 TypeScript 类型错误
- 补齐缺失的 Service 方法

### P5：大域子域拆分
- mall: product/trade/promotion/statistics
- mes: cal/md/pro/qc/tm/wm
- system: auth/user/permission/tenant/notify/log

## 关键文件位置

- 架构文档：docs/architecture/cooliebase-all-architecture.md
- 开发规范：AGENTS.md
- Prisma Schema：prisma/schema.prisma
- 数据库基础设施：packages/shared/backend/lib/database/
- User Repository：packages/domains/system/backend/repositories/user.repository.ts
- User Service：packages/domains/system/backend/services/user.service.ts
- User API：src/app/api/v1/admin/system/users/route.ts
- User Page：packages/domains/system/frontend/pages/users.page.tsx
- 权限码：packages/shared/backend/constants/permissions.ts
- DB 配置示例：.env.example
- 迁移脚本：scripts/migrate-api-routes-to-v1.cjs
- 低代码引擎：packages/domains/infra/backend/services/codegen-engine.service.ts

## 新对话启动指令

读取以下文件了解上下文：
1. docs/architecture/CURRENT-PROGRESS.md（本文件）
2. docs/architecture/cooliebase-all-architecture.md
3. AGENTS.md
4. prisma/schema.prisma
5. packages/shared/backend/lib/database/index.ts
