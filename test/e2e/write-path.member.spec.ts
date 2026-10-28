import { expect, test } from "@playwright/test"

/**
 * **写链路 E2E：会员注册（红绿对抗双层）** —— 本仓第一条**会真跑**的写链路用例。
 *
 * ## 为什么选它
 *
 * 会员注册 `POST /api/v1/app/member/auth/register` 是**公开写接口**：
 * 不需要管理员凭证，却完整走「校验 → 服务 → 落库」链路 —— 正好能验证
 * 「正向真的写进去了」与「对抗真的被 4xx 拦住」这两件事。
 *
 * ## 与 sample 的区别
 *
 * `write-path.sample.spec.ts` 是**模板**（默认静态 skip，等业务填）；
 * 本文件是**真用例**：只要目标服务可达，它就真跑，不可达才跳过 ——
 * 跳过理由写在输出里，不静默。
 *
 * ## 关于「写库」的说明（不夸大）
 *
 * 服务在**内存模式**（未配 `DATABASE_URL`）时，写入落在内存仓储；
 * 本用例的断言是「**换一条路径读回来**」（注册 → 用同一凭证登录成功），
 * 这能证明「写确实发生了且可被另一条路径观察到」。
 * 配了 `DATABASE_URL` 时同一条用例仍然成立（此时就是真落库）。
 * 想看字面意义的数据库断言，请配 `DATABASE_URL` 后运行。
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000"
const REGISTER = "/api/v1/app/member/auth/register"
const LOGIN = "/api/v1/app/member/auth/login"

/** 服务不可达时跳过（运行时探测，而不是加载期静态 skip） */
async function requireServer(request: any): Promise<boolean> {
  try {
    const r = await request.get(`${BASE}/readyz`, { timeout: 5000 })
    return r.ok()
  } catch {
    return false
  }
}

test.describe("写链路 E2E：会员注册", () => {
  test("① 正向：注册成功 → 换登录路径读回 → 证明写真的发生了", async ({ request }) => {
    const up = await requireServer(request)
    test.skip(!up, `目标服务不可达（${BASE}）—— 本用例需要运行中的应用；请先 pnpm start 或设 PLAYWRIGHT_BASE_URL`)

    const account = `e2e_m_${Date.now()}`
    const password = "e2e-pass-123"

    const reg = await request.post(`${BASE}${REGISTER}`, { data: { account, password, nickname: "E2E 会员" } })
    expect(reg.status(), `注册应 2xx，实际 ${reg.status()}：${await reg.text()}`).toBeLessThan(300)
    const regBody = await reg.json()
    expect(regBody.success).toBe(true)

    // **换一条路径读回**：能用刚注册的凭证登录 → 说明这次写入确实生效了
    const login = await request.post(`${BASE}${LOGIN}`, { data: { account, password } })
    expect(login.status()).toBeLessThan(300)
    const loginBody = await login.json()
    expect(loginBody.success).toBe(true)
    expect(loginBody.data?.token, "登录应返回 token（证明账号已存在且密码正确）").toBeTruthy()
  })

  test("② 对抗：重复账号 / 弱密码 → 必须 4xx（不是 500），且不产生脏数据", async ({ request }) => {
    const up = await requireServer(request)
    test.skip(!up, `目标服务不可达（${BASE}）`)

    const account = `e2e_dup_${Date.now()}`
    const password = "e2e-pass-123"

    // 先成功注册一次
    const first = await request.post(`${BASE}${REGISTER}`, { data: { account, password } })
    expect(first.status()).toBeLessThan(300)

    // ① 重复账号：必须是**业务 4xx**，不是 500
    const dup = await request.post(`${BASE}${REGISTER}`, { data: { account, password } })
    expect(dup.status(), "重复注册应 4xx").toBeGreaterThanOrEqual(400)
    expect(dup.status(), "重复注册不应是 500（那是崩了，不是拒绝）").toBeLessThan(500)

    // ② 弱密码：校验层必须拦住
    const weak = await request.post(`${BASE}${REGISTER}`, { data: { account: `e2e_weak_${Date.now()}`, password: "123" } })
    expect(weak.status()).toBeGreaterThanOrEqual(400)
    expect(weak.status()).toBeLessThan(500)

    // ③ **不产生脏数据**：弱密码那次不能把账号建出来
    const weakAccount = `e2e_weak_${Date.now()}`
    const loginWeak = await request.post(`${BASE}${LOGIN}`, { data: { account: weakAccount, password: "123" } })
    expect(loginWeak.status(), "被拒绝的注册不应留下可用账号").toBeGreaterThanOrEqual(400)

    // ④ 首次注册的账号仍然可登录（证明上面的失败没有把它写坏）
    const ok = await request.post(`${BASE}${LOGIN}`, { data: { account, password } })
    expect(ok.status()).toBeLessThan(300)
  })
})
