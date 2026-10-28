import { expect, test } from '@playwright/test';

/**
 * 管理端基础可用性。
 *
 * ## 这里原来是一条**假测试**（2026-10-28 修）
 *
 * 旧版只断言 `page.goto('/login')` 的 `status < 500` —— 而 **503 也 < 500**。
 * 实测：应用因缺 `DATABASE_URL` 处于「就绪失败」状态、`/readyz` 返回 503 时，
 * 这条用例**照样通过**。也就是说它守不住任何东西。
 *
 * ## 现在断言的是真信号
 *
 * 1. `/readyz` 必须 **200**（就绪 = 数据库等依赖都通了）；
 * 2. `/login` 必须真的渲染出**登录表单**（不是空壳 / 错误页）。
 *
 * ## 跳过条件写的是「环境前置条件」，不是「应用返回了 503」
 *
 * 缺前置条件（本地没配 DB / 密钥）→ **跳过并说明缺什么**；
 * 有前置条件但 `/readyz` 不是 200 → **真失败**（那是 bug，不是环境问题）。
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

/**
 * 生产模式（`pnpm start`）下应用要求：`JWT_SECRET` ≥ 32 字节 且 `DATABASE_URL` 可达。
 * 缺任一项，应用会以 503 就绪失败 —— 这时跳过是诚实的，断言它「通过」才是骗人。
 */
const MISSING_PREREQ = [
  !process.env.JWT_SECRET && 'JWT_SECRET',
  !process.env.DATABASE_URL && 'DATABASE_URL',
].filter(Boolean) as string[];

test.describe('L3 E2E: Admin Portal 基础可用性', () => {
  test.skip(
    MISSING_PREREQ.length > 0,
    `缺少生产模式前置条件：${MISSING_PREREQ.join(' / ')} —— 应用会以 503 就绪失败；补齐后再跑`,
  );

  test('就绪探针必须 200（旧版只断言 status<500，503 也会通过）', async ({ request }) => {
    const r = await request.get(`${BASE}/readyz`);
    expect(r.status(), `readyz 应 200，实际 ${r.status()}：${await r.text()}`).toBe(200);
  });

  test('登录页真的渲染出表单（不是空壳 / 错误页）', async ({ page }) => {
    const resp = await page.goto(`${BASE}/login`);
    expect(resp?.status(), '登录页不应是 5xx').toBeLessThan(500);

    // 真实内容断言：至少一个输入框 + 一个可点击按钮
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible();
    expect(await inputs.count(), '登录页应有输入框').toBeGreaterThan(0);
    expect(await page.getByRole('button').count(), '登录页应有可点击按钮').toBeGreaterThan(0);
  });
});
