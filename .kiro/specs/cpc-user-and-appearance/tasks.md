# Tasks — 阶段 1：C 端用户模块 + 站点/主题可配置化

> 权威推导 `requirements.md` → `design.md` → **`tasks.md`**。目标：齐备 → `PLAN_APPROVED` → 开发。
> SQLite 可运行预览（NFR6/A7）为一等验收项，贯穿各任务。

## 任务 DAG
```
T0 复核接线 ─► T1 数据模型(双库) ─► T2 Kysely 仓储 ─► T3 member service ─► T5 API 路由
                                                     T4 appearance service ─┘
              T6 withAppRoute ───────────────────────────────────────────┘
T7 权限码/契约  T8 单测  T9 SQLite 端到端预览(A7)  T10 门禁(tsc/lint/回归)
```

## T0 — 开发前复核接线（第一步）
- 确认 Kysely datasource 如何按 `DB_DRIVER` 选 SQLite（`shared/backend/lib/database/datasource-manager.ts`），member repository 照哪个现有 repository 写（如 `system/backend/repositories/user.repository.ts` 或 infra config.repository）。
- 确认 `system_config` 的 Kysely 表定义在 `shared/backend/lib/database/schema.ts` 是否已登记；appearance 复用 infra `config.service`/`config.repository` 的读写方法签名。
- 确认 `permissions.ts` 与 admin-menu 的新增权限码登记方式。
- 产出：接线结论备注，决定 T2/T4 具体复用点。

## T1 — 数据模型（双库一致）
- `prisma/schema.prisma` 加 `model MemberUser`（design §2.1）。PG 侧生成 migration：`prisma migrate dev --name add_member_user`（在 PG 环境；若沙箱无 PG，则手写 migration SQL 对齐现有 migrations 风格）。
- `scripts/bootstrap-sqlite.ts` 加 `CREATE TABLE IF NOT EXISTS member_user`（SQLite 原生类型 + 8 审计字段）；可选 seed 一个 demo 会员。
- 在 Kysely `schema.ts` 登记 `member_user` 表类型（供类型安全查询）。
- 验收：`npm run db:bootstrap:sqlite` 生成的 `data/cooliebase.db` 含 member_user 表（`.schema member_user` 可见）。

## T2 — MemberUserRepository（Kysely）
- 新建 `member/backend/repositories/member-user.repository.ts`：`findByAccount/findById/insert/updateProfile`，走 datasource-manager，自动带 `deleted=0`/`tenant_id`。
- 验收：单测中真实 insert→findByAccount 往返（SQLite 临时库）。

## T3 — Member service（真实，非 mock）
- `member-auth.service.ts`：register（去重+加盐哈希）/ login（verifyPassword + issueJwt app）/ logout。
- `member-profile.service.ts`：getProfile / updateProfile。
- `member/backend/validators/member-auth.validators.ts`：zod register/login/updateProfile。
- `contract/actions.ts` 增 app 动作声明。
- 验收：见 T8 单测。

## T4 — AppearanceService（infra）
- `infra/backend/services/appearance.service.ts`：get（merge 默认）/ update（序列化 upsert system_config）/ getPublic（脱敏）。
- `infra/backend/validators/appearance.validators.ts`：zod SiteAppearance + 默认值。
- 验收：无配置返回默认；写后读回一致（序列化往返）。

## T5 — API 路由
- `app/member/auth/{register,login,logout}/route.ts`（register/login 无鉴权；logout 用 withAppRoute）。
- `app/member/user/profile/route.ts`：改 stub → 真实 service（GET/PUT，withAppRoute）。
- `admin/infra/appearance/route.ts`：GET/PUT，withAdminRoute + 权限码。
- `open/meta/appearance/route.ts`：GET，游客可读。
- 响应统一 `{success,data?,error?}`（design §5）。

## T6 — withAppRoute
- 新建 `shared/backend/http/app-route.ts`（对标 admin-route，简化版：trace/计时/错误处理/访问日志，无 permission/审计）。

## T7 — 权限码 & 契约
- `permissions.ts` 加 `INFRA_APPEARANCE_QUERY/UPDATE`；admin-menu 视需要加"外观设置"入口（阶段 2 主要用，但权限码本阶段先登记）。
- 固化后端响应 `{success,data}`（不改既有 h5 代码，仅约定）。

## T8 — 单测
- MemberAuthService（注册去重 R2 / 登录成败 R4 / 哈希校验）、MemberProfileService（读写）、AppearanceService（默认 merge / 序列化往返）。
- 参照现有 `member.plugin.service.test.ts` / `infra-services.test.ts`。

## T8b — 🆕 C 端 Web 入口 `/portal`（R16/A8）+ 双端同源预览
- 新建 C 端路由组：`src/app/(portal-pages)/portal/page.tsx`（落地/首页）、`.../portal/login/page.tsx`（登录）、`.../portal/profile/page.tsx`（用户中心，消费 profile API + appearance 主题）。
- C 端页面消费 `open/meta/appearance`（Logo/主色/圆角/排版）→ 注入 CSS 变量，体现"可配置化"。
- 结果：同一 Next dev server 下，B 端 `/login`→`/admin`、C 端 `/portal`——平台"双预览"可分别指向（同地址不同路径）。

## T8c — 🆕 预览免输入登录（R18-R21/A9）
- `bootstrap-sqlite.ts`：seed 演示会员 `demo/demo123`（member_user，ACTIVE，含昵称/等级）；`admin/admin123` 已有。
- C 端 `/portal/login` 与 B 端 `/login` 登录页：预览/演示环境下（`NEXT_PUBLIC_DEMO_LOGIN=1` 或非 production）**默认预填**账号密码，用户点"登录"即进；生产不预填（R20 安全兜底）。
- 验收：预览打开两个登录页，凭据已带、一点即进。

## T9 — 🆕 SQLite 端到端预览（A7，硬验收）
- `npm run db:bootstrap:sqlite`（临时/默认库）→ 起 dev server（或对 route handler 做集成测）→ register→login→profile→appearance/open 全链路真实跑通,无"表不存在/方言不兼容/Json 不支持"。
- 若无法起完整 dev server,至少对 repository/service 在 SQLite 驱动下做集成测覆盖 A7 语义。

## T10 — 门禁
- `tsc` / lint 无新增错误；单测全绿（T8）；admin 登录 + member admin CRUD 回归不破（A5）。

---

## 变更文件清单
| 文件 | 类型 |
|---|---|
| `prisma/schema.prisma` | 改（+MemberUser model） |
| `prisma/migrations/*_add_member_user/` | 新（PG migration） |
| `scripts/bootstrap-sqlite.ts` | 改（+member_user 建表 + 可选 seed） |
| `packages/shared/backend/lib/database/schema.ts` | 改（登记 member_user 表类型） |
| `packages/shared/backend/http/app-route.ts` | 新 |
| `packages/domains/member/backend/repositories/member-user.repository.ts` | 新 |
| `packages/domains/member/backend/services/member-auth.service.ts` | 新 |
| `packages/domains/member/backend/services/member-profile.service.ts` | 新 |
| `packages/domains/member/backend/validators/member-auth.validators.ts` | 新 |
| `packages/domains/member/contract/actions.ts` | 改（+app 动作） |
| `packages/domains/infra/backend/services/appearance.service.ts` | 新 |
| `packages/domains/infra/backend/validators/appearance.validators.ts` | 新 |
| `packages/shared/backend/constants/permissions.ts` | 改（+2 权限码） |
| `src/app/api/v1/app/member/auth/{register,login,logout}/route.ts` | 新 |
| `src/app/api/v1/app/member/user/profile/route.ts` | 改（stub→真实） |
| `src/app/api/v1/admin/infra/appearance/route.ts` | 新 |
| `src/app/api/v1/open/meta/appearance/route.ts` | 新 |
| `**/__tests__/*.test.ts` | 新（单测） |

> 无破坏性：member_user 为新表；admin/现有 config 行为不变。PG 走 migration、SQLite 走 bootstrap，双库字段严格对齐。

## 阶段声明
规划最后一项。三件套齐备 → 声明"规划完成"→ `PLAN_APPROVED`（待用户批准）→ 进入开发。严禁批准前写产品代码。
