# 写链路 E2E：红绿对抗双层标准

> 本文是**标准**，不是现状声明。现状见下方「真实现状」——本仓 E2E 目前只有 2 个
> `status < 500` 的占位用例，按本仓铁律「骨架不算完成」，**它不算 E2E 覆盖**。

## 1. 什么时候必须写

规格触及以下任一，就必须有成对的 E2E（或由 `brief.json` 的 `depthTestExempt` 给出非空理由）：

- 写路由：`routes/**/route.ts` 导出 `POST` / `PUT` / `PATCH` / `DELETE`
- 页面含提交动作：`<form` / `onSubmit` / `handleSubmit`

## 2. 必须是**成对**的两层

### ① 正向旅程（Happy Path）—— 证明写进去了

```
真实账户 → 执行写操作 → 断言 HTTP 2xx
        → **直接查数据库**（不是查 UI 文案）
        → 断言落库字段与流水（金额/状态/时间）
        → 断言页面进入「已提交」状态
```

**关键**：断言必须落在**数据库**上。只断言「弹窗消失」「列表多了一行」是 UI 自证，
底层可能根本没写库（本仓实测过这类伪交付）。

### ② 对抗旅程（Antagonistic & Self-Healing）—— 证明拒绝得体面

至少覆盖一种：

```
非法输入（低于底价 / 越权 / 重复提交 / 竞态被抢先）
  → 断言 HTTP 4xx（业务码明确，不是 500）
  → 断言**页面不卡死**（按钮可再次点击）
  → 断言弹窗内有**中文可读告警**
  → 断言存在「自愈」路径（如「调整为最新有效值」按钮）
  → 断言**数据库没有被写脏**（这条最容易被漏掉）
```

## 3. 写法模板

见 `test/e2e/write-path.sample.spec.ts` —— 它默认 **skip**，只有设置 `E2E_BASE_URL`
且显式打开 `E2E_WRITE_PATH=1` 才运行。原因：写链路 E2E 需要**真实应用 + 真实数据库**，
本机不保证具备（嵌入式 Postgres 还受 macOS `kern.sysv.shmall` 4MB 限制，
见 `scripts/lib/ephemeral-pg.cjs`）。**宁可 skip，也不假装跑过。**

跑法：

```bash
E2E_BASE_URL=http://127.0.0.1:3200 E2E_WRITE_PATH=1 pnpm exec playwright test test/e2e/write-path.sample.spec.ts
```

## 4. 深度度量（report-only）

```bash
pnpm run write:path:depth:report
```

输出：写路由数 / E2E 用例数 / 含真实 API 断言的用例数 / 覆盖比。
**它永不失败** —— 目的是看趋势，不是造一个"覆盖率达标"的假象。

## 5. 真实现状（2026-10-28 实测）

```
route.ts 1105 个，含写方法 955 个
*.page.tsx 768 个，含提交表单 360 个
test/e2e/ 1 个文件 / 2 个用例 / 0 个写库断言
```

**结论**：写链路 E2E 覆盖 ≈ 0。本目录的 README 与 sample 是**标准与骨架**，
不是「已完成覆盖」。任何声称"955 个写路由都有测试"的说法都是假的。


## 6. 实跑记录（2026-10-28，本机验证通过）

**基础设施曾经是坏的**：`test:e2e` 脚本存在，但 `@playwright/test` **根本没装** ——
脚本一跑就报 "command not found"。已补装（`1.64.1` + chromium 1248）。

**跑法（本机实测可用的那条）**：

```bash
# ① 起生产构建（dev/Turbopack 在本机会挂，见下方）
pnpm run build
pnpm start                      # 监听 :3000

# ② 指向它跑（注意端口是 3000，不是 dev 的 3200）
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test e2e/admin-flow.spec.ts
```

实测结果：

```
✓ 2 [chromium] 管理端基础路由与登录页可用性断言 (462ms)
✓ 1 [chromium] 管理后台主页根路径重定向与加载验证 (504ms)
2 passed (3.2s)
```

**为什么不走 `START_WEB_SERVER=1`**：它内部跑 `pnpm dev`（Turbopack），本机报

```
Error [TurbopackInternalError]: unable to start FSEvent stream
```

—— macOS 文件监视器限额，与本仓代码无关；生产构建不需要 watcher，绕开即可。

**写链路用例仍需凭证**：`write-path.sample.spec.ts` 里的 `<domain>/<resource>` 与
`E2E_USER` / `E2E_PASS` 要换成真实业务。**在那之前它保持 skip** ——
本仓铁律：骨架不算完成，不拿 skip 的用例充覆盖。


## 7. 生产模式的前置条件（实测踩到，写清楚）

`pnpm start`（`NODE_ENV=production`）下，应用的就绪屏障**依次**要求：

| 缺失项 | `/readyz` 返回 | 说明 |
|---|---|---|
| `JWT_SECRET`（≥32 字节、非默认） | **503** | `生产环境必须配置至少 32 字节且非默认值的 JWT_SECRET` |
| `DATABASE_URL`（可达的真实库） | **503** | `生产环境必须配置 DATABASE_URL` —— 生产模式**禁止内存驱动** |

**这暴露了一条更严重的问题**：`admin-flow.spec.ts` 旧版只断言 `status < 500`，
而 **503 也 < 500** —— 所以它在「应用就绪失败」的状态下**照样通过**。已改为：

1. `/readyz` 必须 **200**；
2. `/login` 必须真的渲染出输入框与按钮；
3. 缺前置条件时**跳过并点名缺哪个变量**（不是"通过"）。

于是现在的行为是：**要么真跑真断言，要么明确跳过**，不再有第三种。

想让它在本机真跑起来，需要这条链（尚未自动化）：

```bash
# ① 起嵌入式 Postgres（本仓 scripts/lib/ephemeral-pg.cjs 可解析端点）
# ② 迁移 + 种子（DATABASE_URL 指向它）
# ③ JWT_SECRET=$(openssl rand -hex 16) pnpm start
# ④ PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test
```


## 9. `e2e:run` 的调试实录（2026-10-28）—— 连修 7 层后**跑绿**

这条链已经能跑到「应用就绪 + 用例真执行」，**每修一层都冒出下一层**。按出现顺序：

| # | 现象 | 真因 | 处理 |
|---|---|---|---|
| 1 | `/readyz` 503，报 JWT | **agent 的 shell 里带着 14 字节的 `JWT_SECRET`**，脚本 `process.env.JWT_SECRET \|\| random` 盲目继承 | 改为「≥32 字节才用，否则自己生成」 |
| 2 | `/readyz` 503，报驱动未知 | `DB_DRIVER=postgres` **不合法** —— 合法值是 **`postgresql`** | 改成 `postgresql` |
| 3 | 插件 API 404「未找到插件」 | 迁移+种子后**没跑 `plugins:register`** | 流水线补这一步 |
| 4 | 404「插件未声明该路由: POST /app/auth/register」 | **`app/` 是作用域层级，不进 URL** —— 声明里是 `/auth/register` | 用例改用 `/api/v1/plugins/cooliebase.member/api/auth/register` |
| 5 | **401「未登录或登录已过期」** | manifest 把 `/auth/login`、`/auth/register` 声明成 `auth: company` —— **拿 token 的入口要求先有 token** | **已修**：改为 `auth: public`（真 bug） |
| 6 | 500「插件 cooliebase.member 未运行」 | 插件注册进库了，但**运行时没启动**（`reconcile()` 只被管理端 POST 调用，全新启动的应用没人启动插件） | **已修**：挂载点首次命中时补一次 `reconcile()`（懒启动，memo 住） |
| 7 | 500「缺少租户标识：请提供 tenantCode」 | 注册要多租户定位（§4.8） | **用例侧**：请求体带 `tenantCode`（从 `projectProfile` 取，与种子同源） |
| 8 | 登录成功但取不到 token | 插件挂载点**再包一层信封**（`data.data.token`） | **用例侧**：两种信封都认 |
| 9 | 重复注册 → **500**（不是 4xx） | 裸 `throw new Error("账号已注册")` 被归成 `INTERNAL_ERROR` | **已修**：改用 `ApiError("CONFLICT")` = 409 |

**同时发现两个应用侧缺陷**（不是测试问题）：

1. `packages/plugins/plugin-member/frontend/pages/portal-shared.ts` 调
   `/api/v1/app/member/auth/*` —— 该前缀只在**拆分部署**时由 `publicPrefixes` 代理生效，
   **合并模式下 404**。
2. 插件挂载点 `/api/v1/plugins/<key>/api/**` 对**公开**会员接口也要求鉴权 → 401。
   要么这类接口需要显式的 public 声明，要么必须走拆分部署的 publicPrefixes 代理。

**结论**：`e2e:run` 的**管道**是对的（库→迁移→种子→插件→应用→就绪→测试→清场），
但**写链路 E2E 仍未跑绿**，卡在 #5。写链路覆盖**仍然是 0**，不声称完成。

### 结果

```
pnpm run e2e:run -- e2e/write-path.member.spec.ts
  e2e:run EXIT=0     2 passed (1.0s)
```

**真 PostgreSQL + 生产构建**（`pnpm build` 的 standalone 产物），不是开发服务器：
库 → 迁移 → 种子 → 插件注册 → 起应用 → 就绪 → 真跑写链路 → 清场。

顺带修掉 **3 个真实应用缺陷**（不是测试问题）：

1. 公开的会员登录/注册被声明成 `auth: company`（拿 token 的入口要求先有 token）；
2. 全新启动的应用从不启动插件（`reconcile()` 没有启动期调用方）；
3. 业务冲突（账号已注册）返回 500 而非 409，用户只看到「系统异常」。
