# Design — 阶段 1：C 端用户模块 + 站点/主题可配置化

> 阶段：**规划 (Planning)** · 权威推导 `requirements.md` → **`design.md`** → `tasks.md`
> 关键设计前提（已代码核实）：**运行时用 Kysely，SQLite 建表来自 `scripts/bootstrap-sqlite.ts`**（非 Prisma migration）；配置存 `system_config`（value=TEXT）。所有设计以「SQLite 模板可真实预览」（NFR6）为一等约束。

---

## 1. 架构总览（遵循 plugin-domain-structure.md）

```
packages/domains/member/                      # C 端用户（复用现有模块，新增 app 侧能力，不动 admin CRUD）
  backend/
    repositories/member-user.repository.ts   [新] Kysely 落库（member_user）
    services/member-auth.service.ts            [新] register/login/logout（真实，非 mock）
    services/member-profile.service.ts         [新] getProfile/updateProfile（真实）
    validators/member-auth.validators.ts       [新] zod: register/login/updateProfile
  contract/actions.ts                          [改] +app 动作声明（register/login/profile）

packages/domains/infra/                        # 站点/主题配置（复用现有 config 能力）
  backend/services/appearance.service.ts       [新] get/update SiteAppearance（存 system_config）
  backend/validators/appearance.validators.ts  [新] zod SiteAppearance + 默认值

packages/shared/backend/http/
  app-route.ts                                 [新] withAppRoute（对标 withAdminRoute）

src/app/api/v1/
  app/member/auth/register/route.ts            [新] POST
  app/member/auth/login/route.ts               [新] POST
  app/member/auth/logout/route.ts              [新] POST
  app/member/user/profile/route.ts             [改] GET/PUT 接真实 service（现为 stub）
  admin/infra/appearance/route.ts              [新] GET/PUT（withAdminRoute + 权限码）
  open/meta/appearance/route.ts                [新] GET（游客可读，脱敏公开配置）

prisma/schema.prisma                           [改] +model MemberUser（PG 一致性）
scripts/bootstrap-sqlite.ts                    [改] +CREATE TABLE member_user（SQLite 真源）
```

依赖单向：member/infra(业务) → shared(auth/db/http 底座)。不新增跨模块反向依赖。

---

## 2. 数据模型

### 2.1 member_user（双库：Prisma PG model + SQLite bootstrap 建表）

**Prisma（`prisma/schema.prisma`，PG 一致性，走 migration）**
```prisma
/// C 端会员用户
model MemberUser {
  id           String   @id @default(cuid())
  account      String   @unique @db.VarChar(64)          // 登录账号（用户名）
  email        String?  @unique @db.VarChar(120)
  passwordHash String   @map("password_hash") @db.VarChar(200)
  passwordSalt String   @map("password_salt") @db.VarChar(100)
  nickname     String   @db.VarChar(60)
  avatarUrl    String?  @map("avatar_url") @db.VarChar(500)
  status       String   @default("ACTIVE") @db.VarChar(10)  // ACTIVE | DISABLED
  memberLevel  String   @default("normal") @map("member_level") @db.VarChar(30)
  tenantId     String   @default("default") @map("tenant_id") @db.VarChar(64)
  createdBy    String   @default("system") @map("created_by") @db.VarChar(64)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedBy    String   @default("system") @map("updated_by") @db.VarChar(64)
  updatedAt    DateTime @updatedAt @map("updated_at")
  deleted      Int      @default(0)
  deletedAt    DateTime? @map("deleted_at")
  remark       String?  @db.VarChar(500)
  @@map("member_user")
}
```

**SQLite（`scripts/bootstrap-sqlite.ts`，运行时真源，SQLite 原生类型 + 8 审计字段）**
```sql
CREATE TABLE IF NOT EXISTS member_user (
  id TEXT PRIMARY KEY,
  account TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'ACTIVE',
  member_level TEXT DEFAULT 'normal',
  tenant_id TEXT DEFAULT 'default',
  created_by TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT DEFAULT 'system',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted INTEGER DEFAULT 0,
  deleted_at DATETIME,
  remark TEXT
);
```
> 两处字段名/映射一一对应（Prisma `@map` snake_case ↔ SQLite 列名）。可选：bootstrap seed 一个演示会员（demo/demo123）方便预览即点即用。

### 2.2 appearance（存 system_config，value=TEXT 序列化）
> **⚠️ 已核实的关键事实（决定存储选型）**：SQLite bootstrap 建的是 **`system_config`**（列 `key/value:TEXT`）；而现有 `InfraConfigRepository` 查的是 **`infra_config`**（Prisma/PG 表名），SQLite 下 `infra_config` **不存在** → 该 repo 在 SQLite 落到 MEMORY_STORE（重启即丢，不可用于持久化预览）。
> **决策**：appearance **不复用 InfraConfigRepository**，而是新建一个**直接读写 `system_config` 表**的轻量 `AppearanceRepository`（Kysely，`hasRealDatabase()` 时走 `system_config`，否则 MEMORY_STORE 兜底），保证 **SQLite 预览下真实持久化**。同时在 Kysely `schema.ts` 登记 `system_config` 表类型（当前只有 `infra_config`）。
用 `system_config`，`key='site.appearance'`，`value` = `JSON.stringify(SiteAppearance)`（TEXT）。
```ts
// SiteAppearance（zod，全字段带默认值）
{
  siteName: string,        // 默认 "CoolieBase Next 商城"
  logoUrl: string,         // 默认内置 logo
  faviconUrl: string,
  primaryColor: string,    // 默认 "#4f46e5"（hex）
  radius: number,          // 圆角 px，默认 8
  fontFamily: string,      // 默认系统字体栈
  layout: { density: 'comfortable'|'compact' }  // 排版密度，默认 comfortable
}
```

---

## 3. 鉴权链路（复用既有底座，零改造）
- **登录签发**：`issueJwt({ type:'app', sub: memberId, memberId, memberLevel, roles:[], permissions:[] })`（jwt.ts 已支持 app + memberId）。
- **受保护接口**：`withAppRoute(handler)` → 内部 `requireAppAuth`（guards.ts）→ `auth.memberId` 定位会员。
- **公开接口**（register/login/appearance-open）：不加鉴权（appearance-open 可选 `optionalAppAuth` 以支持个性化，但本阶段游客只读默认）。

### 3.1 withAppRoute（对标 withAdminRoute，简化版）
```ts
// shared/backend/http/app-route.ts
export function withAppRoute(handler, options?: { optional?: boolean }) {
  return async (request, ...args) => {
    // trace + 计时（对齐 admin）
    try {
      const auth = options?.optional ? optionalAppAuth(request) : requireAppAuth(request);
      const res = await runWithTenantContext(toTenantContext(auth), () => handler(request, auth, ...args));
      // 记录访问日志（复用 recordApiAccess/persistApiAccessLog）
      return res;
    } catch (e) { return handleApiError(e, { request }); }
  };
}
```
> 比 admin 版轻：无 permission/platform 校验、无 mutation 审计（C 端写操作后续按需加）。

---

## 4. 服务与仓储（Kysely 真实落库，非 mock）

### 4.1 MemberUserRepository（Kysely）
`findByAccount(account)` / `findById(id)` / `insert(row)` / `updateProfile(id, patch)`。走 `shared/backend/lib/database`（datasource-manager，SQLite/PG/MySQL 统一），查询自动带 `deleted=0` 与 `tenant_id`。

### 4.2 MemberAuthService
- `register({account,email?,password,nickname})`：`findByAccount` 去重（R2）→ `salt=generateSalt()`,`passwordHash=hashPassword(password,salt)` → insert → 返回会员概要（无密码）。
- `login({account,password})`：`findByAccount` → 不存在/禁用/`verifyPassword` 失败 → 抛统一 `AuthenticationError("账号或密码错误")`（R4 防枚举）→ 成功 `issueJwt` → 返回 `{token,expiresIn,member}`。
- `logout()`：无状态 JWT，返回成功（预留 session-registry 撤销扩展点）。

### 4.3 MemberProfileService
- `getProfile(memberId)` / `updateProfile(memberId, {nickname?,avatarUrl?})`（不含账号/密码）。

### 4.4 AppearanceService（infra）
- `get()`：读 `system_config` key=`site.appearance` → `JSON.parse` → 与默认值 merge（缺字段回填默认，R11 无配置返回默认）。
- `update(patch)`：merge → `JSON.stringify` → upsert 到 `system_config`（复用 infra config.repository）。
- `getPublic()`：`get()` 后挑 C 端呈现字段（脱敏，R12）。

---

## 5. API 契约（响应格式统一 — R13 决策）
**决策：后端统一 `{ success: boolean, data?, error? }`**（与现有 `app/member/profile` stub 及 admin 一致）。客户端 h5/uniapp 现假设 `{code,data,msg}` 属**客户端 bug**，在阶段 3（clients/expo）与后续统一按 `{success,data}` 消费；本阶段不改既有 h5 代码，只固化后端为 `{success,data}`。

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/v1/app/member/auth/register` | 无 | 注册 |
| POST | `/api/v1/app/member/auth/login` | 无 | 登录→token |
| POST | `/api/v1/app/member/auth/logout` | app | 登出 |
| GET | `/api/v1/app/member/user/profile` | app | 我的资料（改 stub 为真实） |
| PUT | `/api/v1/app/member/user/profile` | app | 更新资料 |
| GET/PUT | `/api/v1/admin/infra/appearance` | admin+权限码 | 后台读/写外观 |
| GET | `/api/v1/open/meta/appearance` | 无 | C 端只读外观（默认兜底） |

权限码：新增 `INFRA_APPEARANCE_QUERY` / `INFRA_APPEARANCE_UPDATE`（`shared/backend/constants/permissions.ts`）。

---

## 6. SQLite 预览可运行性（NFR6 落地要点）
1. `bootstrap-sqlite.ts` 加 `member_user` 建表（§2.1）→ 预览启动即有表。
2. appearance 存 `system_config`（已存在）→ 无需新表,value 走 TEXT 序列化 → SQLite 无 Json 依赖。
3. member repository/service 走 Kysely（datasource-manager 按 `DB_DRIVER` 选 SQLite）→ 三库统一，SQLite 下真实读写。
4. 冒烟：`npm run db:bootstrap:sqlite` → 起 dev server → 注册/登录/profile/appearance 全通（A7）。

---

## 7. 测试（NFR4）
- **单测**：MemberAuthService（注册去重 R2 / 登录成败 R4 / 密码哈希校验）、MemberProfileService（读写）、AppearanceService（默认值 merge / 序列化往返）。参照 `member/backend/services/__tests__/*.test.ts` 与 `infra-services.test.ts` 风格。
- **SQLite 端到端**（A7）：bootstrap 临时库 → repository 真实 insert/select 往返（可用 `SQLITE_DB_PATH` 指临时文件）。

---

## 8. 兼容与回滚
- 纯新增：不改 admin 登录、不改 member admin CRUD、不改现有 config 消费。
- 回滚：删新增文件 + 回退 schema/bootstrap/permissions 增量即可；`member_user` 为新表，不影响存量。
- 双库一致：PG 走 `prisma migrate`（新增 migration），SQLite 走 bootstrap；两处字段严格对齐。

---

## 9. 阶段声明
规划产物。待 tasks.md 完成并经用户批准 → `PLAN_APPROVED`。严禁本阶段写产品代码。
