# 测试百科：安全渗透扫描与性能容量回归护栏

## 一、 自动化安全扫描 (`pnpm run security:scan`)
覆盖本仓承诺的 12 项真实安全红线：
1. 未认证访问后台接口强制 401；
2. 伪造 Token 强制 401；
3. 伪造 `x-tenant-id` Header 拦截越权；
4. 弱口令拒绝；
5. 错误时不泄露底层 SQL 与堆栈；
6. 强制安全响应头 (HSTS, NoSniff)；
7. 插件挂载点权限守卫。

## 二、 性能压测护栏 (`pnpm run load:test`)
- 依据 `packages/shared/contract/load-baseline.json` 基线；
- 统计 RPS、P95 延迟与失败率；
- **铁律**：必须针对生产 standalone 产物进行压测，严禁对开发热更新进程跑压测！
