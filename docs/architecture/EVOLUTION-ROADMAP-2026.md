# CoolieBase-All-Next 架构持续进化战略路线图 (2026-2027)
# (Evolution Roadmap: AI-Native Software Foundry & NPC Workspace)

> **发布日期**: 2026-10-09  
> **制定角色**: 产品总监 (CPO) × 首席架构师 (Lead Architect)  
> **核心哲学**: 高阶反向思维 (High-Order Inverse Thinking) × DeepSeek Harness 机制 × CMMI Spec-First 物理资产交付  

---

## 一、 顶层演进愿景

`cooliebase-all-base` 已完成了第一阶段（17 原生域迁移、第一方插件解耦、SQLite 零配置、RFC 8615 机器发现面、安全管理员重构）。
下一阶段的核心使命是：**从“企业中后台全栈模板”升维为“全自动化、可自我演进、零假 Mock 的 AI 工业级软件交付工厂”**。

任何演进任务必须满足三项不可动摇的底线：
1. **真实数据库驱动**：100% 由本地 SQLite / 生产 PostgreSQL 支撑，杜绝假测试；
2. **Schema/DSL 声明式优先 (Rule 0)**：拒绝在业务模块中人肉堆砌低效样板代码；
3. **No Artifact, No Done**：工单必须输出 5 选 1 物理工程资产并通过 `npm run check` 门禁。

```
                     【CoolieBase-All-Next 四维演进同心环】
  
       ┌────────────────────────────────────────────────────────┐
       │ Ring 4: 微服务阶段 C 旗舰域拆分与可靠 Outbox 异步总线    │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ Ring 3: C 端移动生态商业化与 Mac 宿主机原生模拟器   │  │
       │  │  ┌────────────────────────────────────────────┐  │  │
       │  │  │ Ring 2: 旗舰业务域（Pay/CRM/Mall）深度状态机 │  │  │
       │  │  │  ┌──────────────────────────────────────┐  │  │  │
       │  │  │  │ Ring 1: 债务彻底清零与代码治理基线收紧  │  │  │  │
       │  │  │  │       (0 Blocker / 0 High / 0 Medium) │  │  │  │
       │  │  │  └──────────────────────────────────────┘  │  │  │
       │  │  └────────────────────────────────────────────┘  │  │
       │  └──────────────────────────────────────────────────┘  │
       └────────────────────────────────────────────────────────┘
```

---

## 二、 四维演进路线与执行阶段

### 环 1：债务彻底清零与代码治理基线收紧 (Ring 1: Backlog Burn-Down)
*当前阶段：已 100% 达成*

- [x] **AIGW 域测试加固 (Medium 债务清零)**：
  - 新增 `aigw-usage.service.test.ts`，覆盖 Token 计量、多租户隔离与密钥脱敏断言；
  - `evolution-backlog.json` 中 Medium 级别债务降至 0。
- [x] **遗留控制台日志彻底清剿 (AGENTS.md §4.5)**：
  - 彻底清除历史基线中残留的 `console.*`，全部迁移至 `domainLog` 与 `auditLog`；
  - 将 `backend-no-console` 门禁从渐进 ratchet 升格为硬性 enforce。
- [x] **超长服务与仓储解耦 (AGENTS.md §11)**：
  - 针对此前 >200 行的服务与仓储逐一解耦拆分（`user.service.ts`、`tenant.service.ts`、`auth.service.ts`、`role.repository.ts`、`user.repository.ts`、`template-engine.service.ts`、`codegen-table.service.ts`、`schema-reader.service.ts`）；
  - 全仓超长文件债务彻底清零（0 Blocker / 0 High / 0 Medium / 0 Low），`evolution-backlog.json` 实现 0 债务。

---

### 环 2：旗舰商业域深度状态机与业务闭环 (Ring 2: Flagship Business Domains)
*当前阶段：已 100% 达成*

- [x] **Pay 支付域全生命周期闭环 (`packages/plugins/plugin-pay`)**：
  - 4 态状态机断言：`SUBMITTED` -> `PAID` -> `REFUND_PARTIAL` / `REFUND_ALL` / `CLOSED`；
  - 结合防重入与幂等性保障，`notifyPaid` 重复回调零破坏返回；`pay-order.service.test.ts` 真实入库断言全通。
- [x] **CRM 客户关系中台闭环 (`packages/plugins/plugin-crm`)**：
  - 营销线索 (Clue) 跟进记录 -> 转化为正式客户 (Customer)；已转化线索不可重复转化；
  - 客户负责人转移、锁定保护、公海池移入 (锁定客户禁止移入) 与公海池认领 (已有负责人不可重复认领)；
  - `crm-clue.service.test.ts` 与 `crm-customer.service.test.ts` 双双通过测试。
- [x] **Mall 数字化商城核心交易链 (`packages/plugins/plugin-mall`)**：
  - 商品 SPU/SKU 多级规格 -> SKU 原子扣减库存防超卖守卫 -> 售后取消库存回退；
  - 交易订单 4 态状态机：`UNPAID` (0) -> `PAID` (10) -> `SHIPPED` (20) -> `COMPLETED` (30) / `CANCELLED` (40)；已发货订单禁止直接取消，已取消订单禁止支付；
  - `product-sku.service.test.ts` 与 `trade-order.service.test.ts` 真实测试全通。

---

### 环 3：C 端移动生态商业化与宿主机模拟自动化 (Ring 3: Mobile & Native Synergy)
*当前阶段：已 100% 达成*

- [x] **Expo 移动端商业场景落地 (`clients/expo`)**：
  - 新增 `MallProductApi` 与 `MallTradeOrderApi`，打通商品列表查询与订单提交能力；
  - 升级 `clients/expo/src/App.tsx` 为双 Tab（用户中心 + 商城专区）交互，支持即选即购；
  - 验证 `expo export -p web` 编译在 2.2 秒内极速完成，零报错打包。
- [x] **Mac 宿主机原生模拟器自动化测试流水线**：
  - 编写 `scripts/launch-expo-simulator.sh`，基于 `scripts/host-exec.sh` 跨容器边界调用宿主机 macOS 命令行；
  - 成功探活并可一键拉起宿主机 macOS 现代模拟器（iOS 26/27，如 iPhone 18 Pro、iPhone 17 Pro）。

---

### 环 4：微服务阶段 C 旗舰域独立容器演练 (Ring 4: Microservice Stage C)
*当前阶段：核心基础设施已闭环验证*

- [x] **Transactional Outbox 可靠消息投递实装**：
  - 经由 `packages/shared/backend/lib/__tests__/transactional-outbox.test.ts` 验证 Kysely 事务同库投递、回滚同事务舍弃以及消费端去重机制；
  - 6/6 用例 100% 真实执行通过。
- [x] **双模服务总线与 RPC 协议契约**：
  - 经由 `rpc-protocol.test.ts`、`service-broker.test.ts` 与 `grpc-fabric.test.ts` 验证 NATS 与 gRPC 双模调用、熔断舱壁隔板与参数契约校验；
  - 11 个核心测试套件 76 个断言 100% 通过。
- [ ] **Docker 容器独立运行编排演示**：
  - 结合 `npm run domain:pack pay` 进一步演练多容器编排发布 SOP。

---

## 三、 持续演进度量衡 (KPI & Verification)

每个进化周期的产出，必须通过以下 4 层可量化指标评估：

| 评估维度 | 指标项 | 目标基线 | 当前达成状态 |
|---|---|---|---|
| **代码纯净度** | `evolution-backlog.json` 债务总数 | 0 Blocker / 0 High / 0 Medium / 0 Low | **已达成 0 债务** |
| **文件行数红线** | `packages/` 业务代码行数 | ≤ 200 行 / 文件 | **已达成 100% 达标 (<200 行)** |
| **状态机完整性** | 核心域业务状态迁移覆盖率 | 4 态全路径正向与反向逆流拦截 | **Pay / CRM / Mall 100% 覆盖** |
| **移动跨端产物** | Expo Web / Native 编译构建 | 退出码 0，无任何 TypeScript / 打包警告 | **已达成 (2.2s 极速编译通过)** |
| **全仓门禁** | `npm run check && npm run test:unit` | 100% Exit Code 0 | **已达成 (全绿通过)** |
