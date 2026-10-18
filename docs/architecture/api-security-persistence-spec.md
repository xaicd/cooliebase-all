# API 安全与数据访问统一 Spec

## 1. 背景与结论

当前项目已有 JWT、接口签名、AES-GCM、Kysely 和 Prisma 的局部实现，但未形成可上线闭环：

- 管理端权限守卫可将缺失 `x-user-id` 的请求默认识别为 `SYSTEM`，存在匿名越权风险。
- `auth-gateway` 与 app 守卫只解码 JWT Payload，未验证签名；兼容身份头可由外部客户端伪造。
- AES-GCM 与签名工具仅有单元测试，未接入前端请求链路或 API 路由。
- Kysely 与 Prisma 同时访问数据，Schema、模型、迁移、事务与生产降级策略没有统一边界。

本 Spec 以 **先修 P0 鉴权，再收敛 ORM，最后按需接入接口签名/加密** 为实施顺序。

## 2. 目标

1. 所有受保护 API 必须基于已验证签名的令牌建立身份与权限上下文。
2. 生产环境不得使用默认密钥、匿名超级管理员、可伪造身份头、内存持久化或 Prisma mock。
3. Prisma 成为数据库 schema 与 migration 的唯一事实来源；Kysely 作为 Repository 与复杂查询执行层。
4. 将请求签名用于开放/服务间接口并实现防重放；报文加密仅在明确需要的非浏览器客户端场景启用。
5. 提供可灰度、可验证、可回滚的迁移过程，不破坏已有 `/api/v1` 路径与响应信封。

## 3. 非目标

- 不以“前端持有 AES 共享密钥”的方式给浏览器管理后台增加伪加密。
- 不在同一业务事务内混用 Prisma Transaction 与独立 Kysely 连接。
- 不在本阶段重写所有业务服务，或把所有 Kysely 查询改回 Prisma。
- 不承诺 SQL Server、SQLite、Oracle、达梦等未实现 Kysely Dialect 的运行时支持。

## 4. 安全基线与决策

| 场景 | 强制机制 | 说明 |
|---|---|---|
| 管理后台 / 用户端 API | HTTPS、Bearer JWT 验签、RBAC/业务权限 | 不接受客户端传递的身份/权限头 |
| 第三方开放 API | appId/keyId、HMAC-SHA256、时间戳、nonce、防重放 | 密钥仅服务端/第三方服务端持有 |
| 内部服务调用 | mTLS 或受信任网关令牌；独立服务身份 | 不复用用户 JWT 或 `x-user-id` |
| 敏感字段 | 存储字段级加密或传输 TLS | 按字段分类决定，不默认加密全包 |
| 非浏览器端报文加密 | 版本化 AEAD 信封协议 | 仅完成密钥分发/轮换设计后启用 |

## 5. P0：统一鉴权与授权

### 5.1 统一认证上下文

新增共享认证模块，作为全部 Route Handler 的唯一身份入口：

```ts
type AuthContext = {
  subject: string
  tenantId?: string
  roles: string[]
  permissions: string[]
  endpoint: "admin" | "app" | "open" | "internal"
}
```

- JWT 必须验证算法、签名、`exp`、`iat`、issuer、audience（配置后强制）。
- HMAC 比较必须使用 `timingSafeEqual`，拒绝格式异常 token。
- 令牌中的权限只作为短期快照；高风险操作可按需从服务端重新加载权限。
- `SYSTEM` 只能由服务端受信任内部身份显式签发，不能成为缺省值。
- 删除面向公网请求的 `x-user-id`、`x-permissions` 兼容逻辑；如遗留网关确有需要，仅由网关注入并经独立内部认证校验。

### 5.2 密钥与令牌策略

- 生产环境 `JWT_SECRET` 缺失、长度不足 32 字节或仍为开发默认值时应用启动失败。
- 配置 `JWT_ISSUER`、`JWT_AUDIENCE`、`JWT_EXPIRES_IN`；默认 access token 不超过 24 小时。
- 密钥由部署环境注入，代码与日志不得输出密钥、原始 token、签名或完整敏感 Payload。
- 保留刷新令牌需要单独设计持久化、撤销、轮换与设备会话；本阶段不把 access token 刷新伪装成长会话。

### 5.3 路由接入规则

- Admin Route：`requireAdminAuth(request, permission)`。
- App Route：`requireAppAuth(request)`；游客接口显式 `optionalAppAuth(request)`。
- Open Route：`requireOpenSignature(request, bodyText)`。
- Internal Route：`requireInternalAuth(request)`。
- 权限、认证、验证错误统一返回 `{ success: false, error, code, requestId }`，分别采用 401、403、400、409、429。

## 6. 接口签名与防重放

### 6.1 适用范围

请求签名只适用于 `/api/v1/open/**` 与受控的服务间接口；管理后台和浏览器用户端以 HTTPS + JWT 为主，不要求浏览器保存共享签名密钥。

### 6.2 协议

请求必须发送：

```text
X-App-Id: partner-a
X-Key-Id: 2026-01
X-Timestamp: 1760000000000
X-Nonce: 128-bit random base64url
X-Content-SHA256: hex(sha256(raw-body))
X-Signature: base64url(hmac-sha256(secret, canonical-request))
```

`canonical-request` 固定为：

```text
METHOD\nPATH\nQUERY\nTIMESTAMP\nNONCE\nCONTENT-SHA256
```

规则：

- 使用 Node `createHmac("sha256", secret)`，禁止 `sha256(payload + secret)` 自定义拼接。
- 时间窗口默认 300 秒，可配置；时间戳单位统一为毫秒。
- nonce 使用 Redis/数据库的原子 `SET NX EX` 或等效机制消费；同一 `appId + nonce` 在 TTL 内第二次请求返回 409。
- 先限制 body 大小、读取 raw body、算 Hash、验签、消费 nonce，最后再 JSON 解析。
- 对密钥、appId、签名长度实施格式和长度限制，使用常量时间比较。
- Key 按 `keyId` 轮换；新旧 key 重叠期可同时验证，过期 key 拒绝。

### 6.3 开放应用登记

建立 `infra_open_app` 与 `infra_open_app_key`（或等价模型），包含：

- appId、名称、状态、权限范围、IP 白名单、限流策略；
- keyId、密钥密文/外部 Secret 引用、启用时间、失效时间、撤销时间；
- 禁止存储可逆明文密钥到业务表或日志。

## 7. 报文与字段加密

### 7.1 报文加密决策

`web-crypto.ts` 的 AES-256-GCM 只能作为协议基础，不能直接以浏览器可见共享 secret 接入 Admin Web。

若后续某个非浏览器客户端明确需要报文加密，协议必须具备：

```json
{
  "version": "v1",
  "alg": "A256GCM",
  "kid": "key-2026-01",
  "iv": "base64url",
  "ciphertext": "base64url",
  "tag": "base64url"
}
```

并且：

- 每条报文使用随机 96-bit IV；
- 认证附加数据绑定 HTTP method、path、timestamp、requestId；
- 使用 KMS/Vault 或部署 Secret 管理 key，不由客户端长期硬编码共享 key；
- 实施 keyId、轮换、废弃与解密兼容窗口；
- 明确错误信封、内容类型和日志脱敏规则。

### 7.2 字段级加密

对身份证号、银行卡号、第三方密钥等敏感字段建立数据分类。存储使用独立 data-encryption key（DEK）与 keyId；查询需要盲索引时使用独立 HMAC key，不直接对密文做查询。

### 7.3 密码哈希迁移

- 新密码使用 Argon2id（首选）或 bcrypt，参数由环境配置并版本化。
- 旧双 MD5 + salt 密码只允许登录时兼容验证；成功登录后立即升级为新哈希。
- 禁止记录密码、Hash、salt 到日志、审计事件、异常对象或前端响应。

## 8. Prisma 与 Kysely 的目标架构

### 8.1 所有权

| 层级 | 唯一职责 |
|---|---|
| `prisma/schema.prisma` | 数据模型、关系、索引、数据库迁移的唯一事实来源 |
| `prisma/migrations/**` | 可追溯、可部署的迁移历史 |
| Prisma Client | schema migration、少量关系密集型事务与管理操作 |
| Kysely `schema.ts` | 从 Prisma schema 或数据库 introspection 自动生成/校验的查询类型 |
| Kysely Repository | 模块化 CRUD、复杂 SQL、报表、大列表查询 |
| Service | 编排业务规则，不直接绕过 Repository/事务约定 |

### 8.2 访问边界

- 每张表登记一个主要运行时访问层：`prisma` 或 `kysely`。
- `system_*`、`infra_*` 的标准 CRUD 默认由 Kysely Repository 负责。
- 关系密集、迁移期或 Prisma 已稳定覆盖的 `auth/session/open-app-key` 可由 Prisma 负责。
- 同一 Service 方法不可在无显式适配器的情况下同时调用 `cooliebasePrisma` 与独立 `getKyselyDb()`。
- 跨表原子操作必须选择一个执行器：`prisma.$transaction` 或 `kysely.transaction()`；禁止假设两个事务能自动互相提交/回滚。

### 8.3 环境与失败策略

- `NODE_ENV=production` 时必须存在有效 `DATABASE_URL` 与受支持 `DB_DRIVER`。
- Kysely 生产环境不允许 memory/dummy dialect；未支持的 Driver 必须启动失败。
- Prisma Client 构造/连接失败必须抛错；删除生产 mock fallback。
- 内存 Repository 与 mock Prisma 只允许测试，必须通过显式 `ALLOW_IN_MEMORY_PERSISTENCE=true` 启用。
- Health Check 检测 Prisma、Kysely、数据库方言、迁移版本与关键表，不可把 mock 视为健康。

## 9. Schema、模型与迁移收敛

### 9.1 当前不一致的修复

以源码实际访问为准，先建立模型清单。至少核对并补齐或替换以下遗留 Prisma 调用：

- `setting`
- `admin`
- `user`
- `session`
- `adminMenu`
- `adminRole`
- `tenant`
- `tenantPackage`

每项必须明确：真实表名、字段、关系、调用服务、目标拥有者（Prisma/Kysely）、迁移文件、测试数据与删除策略。

### 9.2 Migration 规范

1. 每次结构变更在 `prisma/schema.prisma` 修改后生成命名 migration。
2. 不允许手工修改已部署 migration。
3. 生产部署执行 `prisma migrate deploy`，不执行开发性质的 `migrate dev`。
4. 引入迁移前，先对现有数据库做基线/漂移检查并备份。
5. 每个不可逆 migration 都提供向前修复方案与数据备份说明。
6. Kysely `schema.ts` 必须在 CI 中与 Prisma schema 校验或生成，禁止长期双手工维护。

## 10. 文件与模块设计

新增或调整后的目标位置：

```text
packages/shared/backend/
├── auth/
│   ├── jwt.ts                     # JWT 签发、严格验签、配置校验
│   ├── guards.ts                  # requireAdminAuth / requireAppAuth
│   ├── context.ts                 # AuthContext
│   └── internal-auth.ts           # 内部身份校验
├── security/
│   ├── api-signature.ts           # HMAC canonical request + constant time compare
│   ├── replay-store.ts            # nonce 原子消费接口与 Redis 实现
│   ├── payload-envelope.ts        # 非浏览器报文加密协议（按需）
│   └── secret-policy.ts           # 生产密钥校验、日志脱敏
├── backend/lib/database/
│   ├── kysely-client.ts
│   ├── schema.ts                  # 生成或受 CI 校验
│   └── transaction.ts             # 单执行器事务约定
└── prisma.ts                      # 仅 Prisma 单例，不含生产 mock

prisma/
├── schema.prisma
└── migrations/
```

旧 `auth-gateway.ts`、`app-auth-guard.ts`、`permission-guard.ts` 在迁移后只保留兼容适配层，并设置删除期限；不再直接读取客户端身份头。

## 11. 分阶段实施计划

### Phase 0 — 基线与保护（阻断高风险发布）

1. 建立当前路由、认证入口、Prisma/Kysely 表访问清单。
2. 增加 CI 检查：禁止生产默认 JWT secret、禁止 `x-user-id`/`x-permissions` 直接建立身份、禁止 Prisma production mock。
3. 在部署文档注明紧急风险；未完成 Phase 1 前不得暴露管理端 API 到公网。

**完成标准：** 清单可追踪；风险路由和风险依赖有明确数量与负责人。

### Phase 1 — P0 鉴权修复

1. 实现严格 JWT 解析与签名验证，使用标准库或经过审计的 JWT 库。
2. 将 `permission-guard` 改为 fail-closed：缺少/无效 token 返回 401，权限不足返回 403。
3. 删除默认 `SYSTEM` 与公网 `x-user-id`/`x-permissions` 信任。
4. Admin 与 App 路由逐步迁移到统一 Guard；认证、登录和明确公开路由显式白名单。
5. 生产密钥配置校验与启动失败策略落地。

**完成标准：** 未带 token、伪造 payload、过期 token、错误签名、伪造 header 均无法访问受保护路由。

### Phase 2 — 开放接口签名与限流

1. 实现 HMAC canonical-request、nonce store、key rotation。
2. 建立 open app/key 领域模型、存储与管理接口。
3. 接入 `/api/v1/open/**`，加入 appId、权限、IP 白名单和限流。
4. 删除旧非 HMAC SHA256 拼接签名实现或仅保留迁移适配。

**完成标准：** 篡改 body/path/query、重放 nonce、超时请求、撤销 key、错误 appId 均被拒绝。

### Phase 3 — Prisma Schema 与 Migration 收敛

1. 对照运行时 Prisma 调用补齐模型，或将无归属调用迁移到 Kysely Repository。
2. 建立现网 schema baseline 并纳入 `prisma/migrations`。
3. 移除 Prisma mock fallback；测试由显式测试 double 注入。
4. 建立 Prisma/Kysely 表所有权登记表。

**完成标准：** `prisma generate`、`prisma validate`、migration 部署及所有运行时模型访问都一致。

### Phase 4 — Kysely 真实数据库与类型收敛

1. 只宣称真实实现的 PostgreSQL/MySQL 方言；未实现 Driver 启动失败。
2. 替换 Repository 的 `as any` 写入，以正确的 Insertable 类型、默认值和 ID 策略实现。
3. 让 Kysely schema 从 Prisma 或数据库生成/校验。
4. 生产环境禁止 memory Repository；health check 验证真实连通性。

**完成标准：** PostgreSQL 与 MySQL 目标环境的 CRUD 集成测试通过，且无生产 silent fallback。

### Phase 5 — 密码与敏感数据升级

1. 引入版本化密码 hash，按登录渐进迁移 MD5 数据。
2. 建立敏感字段清单、脱敏日志和字段级加密方案。
3. 如确有非浏览器端需求，实施版本化报文加密协议与密钥轮换。

**完成标准：** 新密码不再使用 MD5；敏感日志扫描无明文泄漏；加密协议具备互操作和轮换测试。

## 12. 测试与验收

### 12.1 安全测试

- JWT：有效、过期、篡改 header/payload、错签名、issuer/audience 不匹配、开发密钥生产启动失败。
- RBAC：未认证 401、无权限 403、拥有权限 200、客户端伪造 `x-user-id`/`x-permissions` 无效。
- 签名：body/query/path/method 任何一项篡改均失败；nonce 重放失败；过期失败；key rotation 成功。
- 加密：篡改 IV/tag/ciphertext/AAD 均失败；不得返回明文密钥或敏感异常。
- 日志：token、password、secret、完整身份证号等不写入日志。

### 12.2 数据访问测试

- `prisma validate` 与 `prisma generate` 成功。
- 干净数据库执行所有 migration 成功；升级路径 migration 成功。
- PostgreSQL/MySQL 各运行 Repository CRUD、分页、软删除和事务测试。
- Prisma/Kysely 分别执行的事务遵守所有权；混用尝试有静态检查或测试阻止。
- 生产配置下断开数据库/缺失密钥必须失败关闭，而不是返回 mock 成功结果。

### 12.3 建议命令

```powershell
npx tsc --noEmit
npx prisma validate
npx prisma generate
npx vitest run packages/shared/backend
npm run build
```

真实数据库集成测试使用专门测试数据库与明确的 `DATABASE_URL`，不得对生产库执行 migration 或 destructive reset。

## 13. 发布、观察与回滚

- Phase 1 可用 feature flag 仅控制迁移期旧路由兼容，不能恢复匿名 `SYSTEM` 后门。
- 发布前备份数据库；migration 使用扩展优先、双读/双写（如必要）、最后收缩的顺序。
- 发布监控：401/403、签名失败、nonce 重放、数据库连接错误、Kysely/Prisma 错误率、认证延迟。
- JWT 密钥轮换采用 `kid`，验证端接受当前与上一把密钥的短重叠窗口。
- 数据库 migration 出错时停止后续部署并执行向前修复；不可逆数据变更依赖备份恢复。

## 14. 风险与取舍

| 风险 | 处理 |
|---|---|
| 直接移除遗留身份头影响内部网关 | 先明确可信网关路径，采用内部认证替代，逐路由灰度 |
| 双 ORM schema 漂移 | Prisma 为唯一 schema authority，Kysely 自动生成/CI 校验 |
| 现有数据库没有 Prisma migration 历史 | 先 baseline，备份并在 staging 演练 |
| 全量接口 AES 导致浏览器密钥泄漏/运维复杂 | 默认不做；仅限有明确威胁模型的非浏览器端 |
| MD5 密码迁移强制重置影响用户 | 采用登录时渐进升级，设置过渡期与强制重置兜底 |

## 15. Definition of Done

本 Spec 完成需同时满足：

1. 受保护 Admin/App API 不再信任客户端身份头或默认超级管理员。
2. 全部 JWT 入口统一做签名与有效期校验，生产缺失安全配置会失败关闭。
3. Open API 已实现 HMAC、防重放、密钥轮换和限流，或明确标记为未开放。
4. Prisma schema、generated client、migration 和运行时模型访问完全一致。
5. Kysely 仅在声明支持的真实 Driver 下运行，生产无 mock/memory 静默回退。
6. Prisma 与 Kysely 的表所有权、事务约定、测试矩阵与健康检查已文档化并在 CI 验证。
7. TypeScript、Prisma 校验、目标数据库集成测试和生产构建全部通过。
