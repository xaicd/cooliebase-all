> ⚠️ **2026-10-18 勘误**: 2026 Q3 之前流程文档中涉及的 `yudao-cloud` 条目已从 `docs/architecture/upstream-radar-catalog.json` 移除（Phase A3 重构）。本文档保留作为通用流程参考，但具体追踪对象列表请以最新 radar catalog 为准。

# CoolieBase-All-Next 开源生态持续追踪、漏洞防御与技术吸收权威指南
# (Open-Source Ecosystem Radar, Vulnerability Defense & Continuous Evolution Manual)

> **发布日期**: 2026-10-09  
> **核心原则**: 开源成熟方案优先 (Mandatory Rule 0 §5) × 高阶反向思维 (High-Order Inverse Thinking) × 真实测试先行驱动  
> **自动化工具支撑**: `scripts/upstream-radar.cjs`、`docs/architecture/upstream-radar-catalog.json`、`npm run upstream:radar`

---

## 一、 为什么必须建立开源持续追踪机制？

`cooliebase-all` 的定位是 **现代全栈中后台企业级基座与 AI-Native 交付工厂**。本项目站在巨人的肩膀上，大量汲取了国内外顶尖开源项目的精髓。

然而，企业级软件工程最危险的隐患是：**“一次性搬迁后彻底闭门造车，与上游生态演进和安全补丁脱节”**。
- 上游若依/芋道在成千上万企业生产环境中验证并修复的 **业务状态机边界 Bug、支付回调并发漏洞、并发库存超卖暗坑**，若不持续跟踪，本仓就会重新踩坑；
- 底层依赖（Next.js、Kysely、better-sqlite3、NATS）爆发的 **CVE 高危安全漏洞**（如 Server Actions SSRF、SQL 动态转义边缘漏洞），若不及时感知，将直接威胁系统安全。

因此，本仓确立了 **“制度化、工具化、可量化”的开源持续追踪与漏洞吸收闭环**。

---

## 二、 四大开源技术谱系与基准雷达

本仓在 [`docs/architecture/upstream-radar-catalog.json`](file:///host-workspace/xaicd/cooliebase-all/docs/architecture/upstream-radar-catalog.json) 中系统收录了四大技术谱系：

```
                      【cooliebase-all 开源追踪四大谱系】

 ┌────────────────────────────────────────────────────────────────────────┐
 │ 1. 业务模型与领域契约谱系 (Domain & Contract Upstreams)               │
 │    - yudao-cloud (芋道源码): 17 原生域实体模型、BPM 审批流、Pay/Mall/CRM 状态机│
 │    - CoolieBase-Vue (若依官方): RBAC 权限码、字典缓存、不可变操作与登录审计底座    │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 2. 现代全栈与运行时框架谱系 (Full-Stack & Runtime Upstreams)            │
 │    - Next.js (Vercel): App Router、Server Actions CSRF 防护、Turbopack │
 │    - React 19: Server Components、Actions 异步状态与并发渲染基线        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 3. 数据底座、信创与分库分表谱系 (Data, Xinchuang & Sharding Upstreams)   │
 │    - Kysely: 零 SQL 注入风险编译、多方言扩展、嵌套事务与 Savepoint       │
 │    - Apache ShardingSphere: 事务内强一致读主、哈希/时间分片与跨片归并    │
 │    - 达梦 DM8/DM9: dmdb 原生驱动演进、数据守护 (Data Watch) 实时主备透明漂移 │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 4. 分布式总线与微服务治理谱系 (Distributed Bus & Governance Upstreams)  │
 │    - NATS.io / nats-server: Request-Reply 熔断舱壁、JetStream 幂等去重 │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 三、 开源更新与漏洞吸收的四步闭环标准流程 (The 4-Step Protocol)

当开源社区发布版本升级、CVE 预警或重大 Bug 修复时，必须严格执行以下四步闭环，**严禁盲目复制粘贴**：

```
     ┌─────────────────┐       ┌─────────────────┐
     │ 1. 雷达周期巡检 │ ────> │ 2. 架构差异过滤 │
     │  (Radar Scan)   │       │  (Parity Diff)  │
     └─────────────────┘       └─────────────────┘
                                        │
                                        ▼
     ┌─────────────────┐       ┌─────────────────┐
     │ 4. 门禁回归归档 │ <──── │ 3. 测试先行复现 │
     │ (Gate & Ledger) │       │   (Test-First)  │
     └─────────────────┘       └─────────────────┘
```

### 步骤 1：雷达周期巡检 (Radar Scan)
通过内置雷达脚本定期扫描依赖与上游动态：
```bash
# 1. 扫描上游项目基准状态与焦点
npm run upstream:radar

# 2. 深度执行依赖安全漏洞与 CVE 审计
npm run upstream:audit
```
产物将自动更新至：
- `docs/architecture/artifacts/upstream-radar-report.json`
- `docs/architecture/artifacts/upstream-radar-report.md`

### 步骤 2：架构差异过滤与反向思维推导 (Parity Diff & Inverse Thinking)
上游通常是 Java / Spring Boot 体系，而本仓是 TypeScript / Next.js 体系。**吸收的绝对不是语言代码，而是架构思想与业务不变量**：
- **过滤掉**：Spring Cloud 专有注解、Java 复杂反射配置、MyBatis XML 映射文件；
- **提炼出**：
  1. 状态流转规则：例如订单 `CANCELLED` 后是否允许退款？（逆向拦截守卫）；
  2. 防御机制：例如分布式库存扣减是否保证了 `WHERE stock >= #{deduct}` 原子比较？
  3. 漏洞根因：例如某个 CVE 是因为入参未做路径白名单校验，还是反序列化未过滤类型？

### 步骤 3：测试先行与缺陷复现 (Test-First & Zero Fake Mock)
在动手修改任何业务逻辑前，**必须先编写针对该 Bug / 漏洞的红灯单元测试（Red Test）**：
- 编写测试断言该漏洞在未修补状态下被触发；
- 在使用真实嵌入式 SQLite / PostgreSQL 数据库的环境下验证测试确实能够抓到该缺陷；
- 严禁编写只打桩（Mock）的假测试！

### 步骤 4：架构吸收、修补与全仓门禁闭环 (Gate & Ledger)
- 在目标业务 Service / Repository 或框架层落地修补；
- 运行测试变绿（Green Test）；
- 执行全仓工程门禁：
  ```bash
  npm run check && npm run test:unit
  ```
- 将本次吸收案例记录入本文档或特性 Brief，做到 **可追溯、可审计**。

---

## 四、 典型吸收实战案例复盘 (Case Studies)

### 案例 1：从 `yudao-cloud` 吸收支付域 4 态状态机与幂等防重入
- **背景**：上游 `yudao-module-pay` 在处理微信支付多次异步通知时，增加了幂等版本号和退款状态机校验。
- **本仓吸收落地**：在 `packages/plugins/plugin-pay/backend/services/pay-order.service.ts` 中实现：
  1. 支付订单严格经过 `SUBMITTED` -> `PAID` -> `REFUND_PARTIAL` / `REFUND_ALL` / `CLOSED`；
  2. 针对重复支付通知，通过 `isAlreadyPaid` 守卫实现**零破坏幂等返回**；
  3. 落地 `pay-order.service.test.ts` 真实入库验证。

### 案例 2：从 `Apache ShardingSphere` 吸收读写分离“事务内强制读主”铁律
- **背景**：在分布式读写分离架构中，主从同步存在数毫秒到数秒延迟。若在同一个事务内刚执行 `INSERT`，随后的 `SELECT` 路由到从库，就会导致“查询为空”的严重脏读。
- **本仓吸收落地**：在 `packages/shared/backend/lib/database/read-write-router.ts` 中设计：
  1. 一旦进入 `runInTransaction`，上下文硬性锁定主库；
  2. 哪怕代码显式调用 `runWithReplica`，路由守卫也会强行拦截并强制读主，保证 `Read-Your-Writes` 强一致；
  3. 落地 `read-write-router.test.ts` 测试验证。

### 案例 3：Next.js Server Actions 与安全加固
- **背景**：开源社区曾爆发 Next.js Server Actions SSRF 漏洞（CVE-2024-34351）。
- **本仓防御落地**：
  1. 所有 API Route 统一通过 `withAdminRoute` / `withPublicRoute` 严格校验 `Origin` / `Host` 头；
  2. 鉴权通过自研轻量 JWT + 统一租户隔离上下文注入（`runWithTenantContext`），杜绝未经校验的重定向。

---

## 五、 日常运维与持续迭代检查表 (Checklist)

| 巡检周期 | 执行动作 | 负责角色 | 验收标准 |
|---|---|---|---|
| **每周** | 运行 `npm run upstream:radar` | 架构师 / AI Agent | 追踪清单 8 个项目状态正常，无未记录的重大架构断层 |
| **每月 / 发布前** | 运行 `npm run upstream:audit` | 安全工程师 / AI Agent | `0 Critical / 0 High` 安全漏洞；若有需立即补丁升级 |
| **版本迭代** | 对齐 `yudao-cloud` 实体与 API 契约 | 领域开发者 | 涉及业务域完成契约与状态机更新，测试 100% 通过 |
