# Requirements — 阶段 1：C 端用户模块 + 站点/主题可配置化（地基）

> 阶段：**规划 (Planning)** · 目标状态 `PLAN_APPROVED`
> 上位需求：给 cooliebase-all-base 补 C 端（用户端）能力，对标 WordPress「后台配置 → 前台呈现」。
> 本阶段 = 4 阶段中的第 1 阶段（后端地基）。后续：阶段 2 后台外观设置页 / 阶段 3 clients/expo / 阶段 4 规范文档。

---

## 1. 背景与范围

### 1.1 现状（已代码核实）
- **底座已就绪、可复用**：JWT 引擎 `issueJwt/verifyJwt` 已支持 `type:'app'` + `memberId/memberLevel`（`shared/backend/auth/jwt.ts`）；C 端守卫 `requireAppAuth/optionalAppAuth`、`requireAppLogin`（guards.ts / app-auth-guard.ts）；密码工具 `hashPassword/generateSalt/verifyPassword`（lib/crypto.ts）；Prisma 客户端 `cooliebasePrisma`（shared/backend/prisma.ts）；通用配置表 `Setting{key, value:Json}`（schema.prisma:424）；`withAdminRoute` 路由包装器（http/admin-route.ts）。
- **缺失（本阶段要补）**：member 无注册/登录/用户中心真实实现（现全是 mock）；Prisma **无 member 表**；无 C 端路由包装器 `withAppRoute`（只有 admin）；C 端 `/app/member/profile` 是 stub；无站点/主题配置的存储与 C 端读取 API；C 端客户端期望响应 `{code,data}` 而后端返回 `{success,data}`（契约不一致）。

### 1.2 本阶段范围（In Scope）
1. **C 端用户模块（后端）**：账号密码/邮箱注册、登录、登出、获取/更新个人资料（真实落库，签发 `type:'app'` JWT）。
2. **站点/主题配置（后端）**：一份 `site.appearance` 配置（Logo、站点名、主色、圆角、字体、排版等），存 `Setting` 表；后台写 API（admin 鉴权）+ C 端只读 API（`open/meta`，游客可读）。
3. **C 端路由包装器** `withAppRoute`（对标 `withAdminRoute`）。
4. **响应契约统一**：C 端 API 统一返回结构，修客户端 `{code}` vs 后端 `{success}` 不一致。

### 1.3 Out of Scope（后续阶段）
- 后台"外观设置"可视化配置页（阶段 2）。
- clients/expo App（阶段 3）。
- 规范文档（阶段 4）。
- 短信验证码登录（本阶段用账号密码，短信作后续扩展）。
- mall/pay 与 member 关联、积分/等级 C 端消费（后续）。

### 1.4 非目标（Never）
- ❌ 不改 admin 端现有鉴权/登录行为（member admin CRUD 页保持不动）。
- ❌ 不引外部依赖（短信/邮件网关）——本阶段自包含可跑通。
- ❌ 不 mock：新 service 真实落库（Rule：真实数据驱动）。

### 1.5 🆕 关联需求：对话生成结果支持「多端」预览（B 端后台 + 多个 C 端渠道），跨仓横切
> 来源：用户 steering（两条）。对话（Build 模式）生成 cooliebase-all-base 这类项目后，预览不能只给单一入口——需在**对话框中按渠道分别预览**，且**根据实际情况**决定展示哪些入口（只有后台→只出 B 端；含哪些 C 端渠道→出对应入口）。

**「C 端」= 多端概念，不是单一前台**（对齐仓库 `clients/` 现状 + 用户 steering）：
- **B 端（管理后台）**：管理员运营后台。
- **C 端（面向用户，多渠道）**：
  - **Web/H5 前台**（`clients/h5`，或 Next 内 C 端路由组 `/portal`）；
  - **PC 端**（桌面：`clients/desktop-pc`（Tauri），或 PC Web 前台）；
  - **App 端**（移动：`clients/uniapp`（小程序/App）、`clients/flutter`、`clients/expo`）。

- **R16（本仓侧 — 让各端有确定、可预览/可寻址的入口）**：cooliebase-all-base SHALL 让 B 端与各 C 端渠道有**确定入口**，供平台预览 UI 分别指向：
  - B 端：现有 `/login` → `/admin/*`。
  - C 端 Web/H5：Next 内 C 端路由组（如 `/portal`，含登录/首页/用户中心）——同一 dev server 可与 B 端一起预览（不同路径）。
  - C 端 PC/App（uniapp/flutter/expo/desktop-pc）：为**独立客户端包**，非本 Next 应用同源路由；其"预览"形态是**各自的运行/构建产物**（如 H5 build、Expo Web、Uniapp H5 预览），入口由各 client 的启动脚本/产物 URL 提供，遵循 `clients/README` 约定（启动先读 `/api/v1/open/meta/project-profile`）。
  - **本阶段（阶段 1）最小交付**：先让 **C 端 Web/H5** 有一个可访问的落地/登录页路径（`/portal`），使"C 端预览"有实际可指 URL；PC/App 各端预览为**后续阶段**（expo 在阶段 3），此处仅确立"多端渠道"模型。
- **R17（平台侧 — 对话框「多端命名预览入口」，主仓 DigitalStaff，属另一 spec/阶段）**：平台预览抽屉/对话框 SHALL 支持一个项目**多个命名预览入口（按渠道：B 端 / C 端 Web / PC / App…）**，并**根据项目实际探测结果**决定展示哪些（探测：项目 `clients/` 实际存在哪些渠道 + `open/meta/client-channels` 声明 + 路由/端口约定）。同源渠道（B 端/C 端 Web）走"同预览地址跳不同路径"，独立客户端渠道（App/PC 包）走各自产物 URL。**落在主仓预览 UI，不在本仓阶段 1 范围**，此处仅登记关联，避免需求丢失。
- **验收挂钩**：本仓侧见 A8（C 端 Web 有可预览入口）；多端渠道模型见 R16；平台侧多入口 UI 由主仓 spec 承接 R17。

---

## 2. 术语
| 术语 | 定义 |
|---|---|
| C 端 / app 端 | 面向消费者的用户端（区别于 admin 管理端） |
| member 用户 | C 端注册的会员，`type:'app'` JWT 主体，`memberId` = 会员 ID |
| 站点/主题配置(appearance) | Logo/站点名/主色/圆角/字体/排版等可配置项，后台配、C 端读 |

---

## 3. 功能需求（EARS）

### 3.1 C 端用户注册/登录
- **R1** — WHEN 用户以 `{account/email, password, nickname?}` 调 `POST /api/v1/app/member/auth/register`，THE 系统 SHALL 校验账号唯一、对密码加盐哈希（`hashPassword`）后落库 `member_user`，返回新会员概要（不含密码）。
- **R2** — IF 账号/邮箱已存在，THE 系统 SHALL 返回明确错误（如"账号已注册"），不泄露敏感信息。
- **R3** — WHEN 用户以 `{account/email, password}` 调 `POST /api/v1/app/member/auth/login`，THE 系统 SHALL 用 `verifyPassword` 校验，成功则 `issueJwt({ type:'app', sub:memberId, memberId, memberLevel, roles:[], permissions:[] })`，返回 `{ token, expiresIn, member }`。
- **R4** — IF 账号不存在或密码错误或账号被禁用，THE 系统 SHALL 返回统一的登录失败错误（不区分账号/密码错，防枚举）。
- **R5** — WHEN 用户调 `POST /api/v1/app/member/auth/logout`，THE 系统 SHALL 受理登出（本阶段无状态 JWT，返回成功即可；预留 session 撤销扩展点）。

### 3.2 C 端用户中心
- **R6** — WHEN 已登录用户调 `GET /api/v1/app/member/user/profile`，THE 系统 SHALL 用 `requireAppLogin` 校验并按 `auth.memberId` 返回真实资料（昵称/头像/等级/注册时间等），替换现有 stub。
- **R7** — WHEN 已登录用户调 `PUT /api/v1/app/member/user/profile`（昵称/头像等），THE 系统 SHALL 校验后落库并返回更新结果；不允许改账号/密码（改密另接口，后续）。
- **R8** — THE C 端受保护接口 SHALL 通过 `withAppRoute` 统一鉴权、错误处理与访问日志（对标 admin）。

### 3.3 站点/主题配置
- **R9** — THE 系统 SHALL 定义站点配置 schema `SiteAppearance`（zod）：`siteName, logoUrl, faviconUrl, primaryColor, radius, fontFamily, layout(density等)`，各字段有默认值。
- **R10** — WHEN 管理员调 `GET/PUT /api/v1/admin/infra/appearance`（`withAdminRoute` + 权限码），THE 系统 SHALL 读/写 `Setting` 表 key=`site.appearance` 的 JSON。
- **R11** — WHEN 任意端（含游客）调 `GET /api/v1/open/meta/appearance`，THE 系统 SHALL 返回**脱敏的**公开外观配置（只读，供 C 端消费），无配置时返回默认值。
- **R12** — THE 公开 appearance API SHALL 只暴露 C 端呈现所需字段（不含内部/敏感字段）。

### 3.4 契约统一
- **R13** — THE 新增 C 端 API 响应 SHALL 采用项目统一结构；IF 客户端（h5/uniapp）约定 `{code,data,msg}` 与后端 `{success,data}` 不一致，THE 本阶段 SHALL 选定一种为准并在 design 固化，避免各端各写。

### 3.5 🆕 预览免输入登录（预置演示凭据，用户 steering 硬要求）
> 目标：预览环境下打开登录页即可一键进入，**不让人手输账号密码**（避免体验断在登录页）。
- **R18** — THE `scripts/bootstrap-sqlite.ts` SHALL 预置一个**演示 C 端会员**（如 `demo / demo123`，ACTIVE），随 `member_user` 建表一并 seed；B 端演示管理员 `admin / admin123` 已有。
- **R19** — THE C 端登录页（`/portal` 登录）与 B 端登录页（`/login`）SHALL 在**预览/演示环境**下默认**预填**演示账号与密码（input 带默认值），用户点"登录"即可进入，无需输入。
- **R20** — THE 预填行为 SHALL 仅在预览/演示场景生效（如通过 `NEXT_PUBLIC_DEMO_LOGIN=1` / 非生产 env 开关控制），**生产环境不得预填明文凭据**（安全兜底）。
- **R21** — 演示会员 SHALL 有最小可用的资料（昵称/等级），使登录后用户中心/外观预览有真实内容可看。

---

## 4. 数据模型（新增 Prisma model）
- **R14** — THE 系统 SHALL 新增 `model MemberUser`：`id, account(唯一), email(唯一可空), passwordHash, passwordSalt, nickname, avatarUrl, status(ACTIVE/DISABLED), memberLevel, createdAt, updatedAt`，`@@map("member_user")`，遵循现有 schema 命名/映射风格。
- **R15** — THE 迁移 SHALL 兼容现有多数据库方言（SQLite/MySQL/PG，项目已支持），字段类型走 Prisma 通用类型。

---

## 5. 非功能需求
- **NFR1（安全）**：密码只存加盐哈希；登录失败不区分账号/密码；C 端 JWT 与 admin JWT 隔离（`type` 区分，已有）。
- **NFR2（架构一致）**：遵循 `.kiro/steering/plugin-domain-structure.md`——service/repository/validators/route 分层，桥接约定；配置放 infra 模块。
- **NFR3（真实数据）**：新 service 走 `cooliebasePrisma`/Repository，禁止 mock。
- **NFR4（测试）**：service 层单测（注册去重/登录成败/资料读写/配置读写默认值）。
- **NFR5（零破坏）**：不改 admin 端登录与 member admin CRUD 现有行为。
- **NFR6（🆕 SQLite 模板可运行预览 — 硬约束，已代码核实）**：cooliebase-all-base 作为模板被派生/预览时默认走**内置 SQLite**（`better-sqlite3` + `data/cooliebase.db`）。**关键事实**：SQLite 的建表**不来自 Prisma migration**（Prisma schema 是 PostgreSQL-only、196 处 `@db.VarChar`，且注释写明"运行时查询由 Kysely 完成，Prisma 不用于 runtime query"），而来自 **`scripts/bootstrap-sqlite.ts`** 手写的 `CREATE TABLE IF NOT EXISTS`（SQLite 原生类型 TEXT/INTEGER/DATETIME + 8 大审计底座字段）。因此本阶段：
  - **member 表必须加进 `scripts/bootstrap-sqlite.ts`**（新增 `CREATE TABLE IF NOT EXISTS member_user`，SQLite 原生类型 + 8 审计字段），否则 SQLite 预览下"表不存在"。同时在 `prisma/schema.prisma` 加对应 PG model 保持双库一致（PG 走 migration，SQLite 走 bootstrap）。
  - **appearance 配置存 `system_config` 表**（SQLite bootstrap 已有；`value` 列是 **TEXT**）——故 appearance 以 **JSON 字符串序列化**存入 `value`（不依赖 Prisma `Json` 类型，规避 SQLite 下 Json 不兼容），读取时反序列化。复用 infra `config.service.ts`/`config.repository.ts`（Kysely，运行时真源）。
  - **运行时用 Kysely**（非 Prisma）：新 member repository/service 必须走 `shared/backend/lib/database`（Kysely + datasource-manager），保证 SQLite/PG/MySQL 三库统一。
  - 预览启动链路（`db:bootstrap:sqlite` → Next dev server + `data/cooliebase.db`）下,注册→登录→取 profile→读/写 appearance 全链路**真实可跑**,而非报"表不存在/方言不兼容/Json 不支持"。
  - **验收挂钩**：见 A7（SQLite 端到端预览验收）。

---

## 6. 验收标准
| 编号 | 验收项 |
|---|---|
| A1 | 注册→登录→拿 token→带 token 取 profile 全链路真实落库跑通 |
| A2 | 重复账号注册被拒；错误密码登录被拒（统一错误） |
| A3 | admin 配置 appearance → `open/meta/appearance` 读到该配置；无配置返回默认 |
| A4 | 游客（无 token）可读 appearance，不可读 profile |
| A5 | admin 端登录 / member admin CRUD 回归不破 |
| A6 | service 层单测全绿；`tsc` / lint 无新增错误 |
| A7 | 🆕 **SQLite 模板预览端到端**：以内置 SQLite（`data/cooliebase.db`）启动，注册→登录→取 profile→读/写 appearance 全链路真实跑通，无"表不存在/方言不兼容"错误（对齐 NFR6） |
| A8 | 🆕 **C 端有可预览入口**：C 端存在一个明确、可访问的落地/登录页路径（如 `/portal`），供平台"C 端预览"指向（对齐 R16；平台侧多入口 UI 由主仓 spec 承接 R17） |
| A9 | 🆕 **预览免输入登录**：预览环境下打开 `/portal` 登录页与 `/login`，账号密码已默认预填（demo/demo123、admin/admin123），点"登录"即进，无需手输（R18-R21）；生产环境不预填 |

---

## 7. 阶段声明
本文件为规划产物之一。requirements + design + tasks 齐备且经用户批准 → `PLAN_APPROVED`，方可进入开发。严禁本阶段写产品代码（Rule 17）。
