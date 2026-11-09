# 缺陷与修复记录 (Bugs & Red-Green Tests)

## 1. 历史缺陷台账

| 编号 | 现象 | 根因 | 修复状态 | 验证测试 |
|---|---|---|---|---|
| BUG-CRYPTO-01 | `NODE_ENV=production` 未设置 `COOLIEBASE_CRYPTO_KEY` 时静默回退公开常量 `'cooliebase-default-crypto-key-32'` | `getKey()` 直接使用 `process.env.COOLIEBASE_CRYPTO_KEY \|\| DEFAULT_KEY`，缺少生产环境显式密钥强校验 | 已修复 | `packages/domains/infra/backend/lib/__tests__/crypto.test.ts` |
