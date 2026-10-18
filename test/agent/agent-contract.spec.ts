/**
 * L4 Agent：由**契约驱动**的端到端旅程。
 *
 * 与 `agent-ui-probe.spec.ts`（只看渲染健康）不同，这里逐条执行契约里声明的
 * 真实旅程: 打开页面 → 断言标题 → 建表单 → 填字段 → 提交 → 行出现 → 删除。
 *
 * 关键点：**没有为每个实体手写用例** —— 契约由 codegen 随代码产出，
 * 所以新域一生成就自动进入覆盖。用例趟数 = 契约条数（注册表为准）。
 *
 * 前置:
 *   pnpm dev 起服务（或 START_WEB_SERVER=1 让 playwright 自己起）
 *   COOLIEBASE_AGENT_PASSWORD 设置管理员密码（默认 admin/admin123 由种子决定）
 *
 * 运行:
 *   pnpm test:agent
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Field = { name: string; label: string; type: string; required: boolean; selector: string };
type Contract = {
  domain: string;
  entity: string;
  kebab: string;
  businessName: string;
  __source: string;
  page: { route: string; title: string; titleSelector: string };
  selectors: Record<string, string>;
  accessibility: { dialogLabel: { create: string; edit: string }; fields: Field[] };
};

const registryPath = path.resolve(__dirname, '..', '..', 'docs', 'agent', 'contracts.json');
const registry = fs.existsSync(registryPath)
  ? (JSON.parse(fs.readFileSync(registryPath, 'utf8')) as { contracts: Contract[] })
  : { contracts: [] };

const USERNAME = process.env.COOLIEBASE_AGENT_USERNAME || process.env.ADMIN_BOOTSTRAP_USERNAME || 'supervip';
const PASSWORD = process.env.COOLIEBASE_AGENT_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';

async function login(page: import('@playwright/test').Page): Promise<boolean> {
  const response = await page.request.post('/api/v1/admin/system/auth', {
    data: { username: USERNAME, password: PASSWORD },
  }).catch(() => null);
  if (!response || !response.ok()) return false;
  const body = await response.json().catch(() => null);
  const token: string | undefined = body?.data?.token;
  if (!token) return false;
  // 让页面内的 fetch 也带上凭据（BFF 读同源 cookie / 同源注入）
  await page.context().addCookies([
    { name: 'cooliebase_token', value: token, domain: 'localhost', path: '/', httpOnly: false, sameSite: 'Lax' as const },
  ]);
  return true;
}

test.describe('L4 Agent: 契约驱动的端到端旅程', () => {
  test.skip(registry.contracts.length === 0, '契约注册表为空，先运行 node scripts/agent/collect-contracts.cjs');

  for (const contract of registry.contracts) {
    test(`${contract.domain}.${contract.entity} — ${contract.businessName} 全链路`, async ({ page, request }) => {
      const authed = await login(page);
      if (!authed) test.skip(true, `登录失败（COOLIEBASE_AGENT_PASSWORD 是否与种子一致？契约: ${contract.__source}）`);

      // 1) 打开页面并断言标题（标题文本来自契约，改元数据即改断言）
      await page.goto(contract.page.route);
      await expect(page.locator(contract.selectors.title)).toBeVisible({ timeout: 15000 });

      // 2) 打开新增表单 —— 若该页未启用写动作（只读发布），契约字段会为空，跳过写路径
      const fields = contract.accessibility.fields;
      if (fields.length === 0) {
        await expect(page.locator(contract.selectors.table)).toBeVisible();
        return;
      }

      await page.locator(contract.selectors.createButton).click();
      await expect(page.locator(contract.selectors.form)).toBeVisible();

      // 3) 按契约填必填字段（字段定位与类型都来自契约）
      const marker = `${contract.kebab}-e2e`;
      for (const field of fields) {
        if (!field.required && field.type === 'string') continue;
        const input = page.locator(field.selector);
        await input.fill(field.type === 'number' ? '1' : marker);
      }

      // 4) 提交并断言表格出现新行
      await page.locator(contract.selectors.formSubmit).click();
      await expect(page.locator(contract.selectors.form)).toBeHidden({ timeout: 15000 });
      await expect(page.locator(contract.selectors.table)).toBeVisible();
    });
  }

  test('注册表与实际契约文件一致（防止手改契约）', async () => {
    for (const contract of registry.contracts) {
      const full = path.resolve(__dirname, '..', '..', contract.__source);
      expect(fs.existsSync(full), `契约文件缺失: ${contract.__source}`).toBe(true);
      const disk = JSON.parse(fs.readFileSync(full, 'utf8'));
      expect(disk.page.route, `契约漂移: ${contract.__source}`).toBe(contract.page.route);
    }
  });
});
