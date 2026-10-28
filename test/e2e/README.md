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
