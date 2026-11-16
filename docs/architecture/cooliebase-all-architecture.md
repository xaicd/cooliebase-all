# cooliebase-all 架构总览

更新时间：2026-11-16（`v1.5.0`）

## 1. 项目定位与核心愿景

`cooliebase-all` 是基于 Next.js 16 (React 19) 的企业级四位一体全栈应用平台与业务系统底座。
其不仅是支持单体向微服务平滑演进的企业中后台底座，更是专为 **AI Coding Agent 与 DigitalStaff NPC** 构建的 **AI 原生商业软件工程工作区 (Quad-Terminal Workspace Bundle)**。

## 2. 技术栈与运行时环境

| 层级 | 技术选型 | 说明 |
|---|---|---|
| **全栈框架** | Next.js 16 (App Router) + React 19 | 薄 BFF 路由、Admin 运营后台与 2C 消费者门户 |
| **开发语言** | TypeScript 5 | 全链路严格类型安全，禁止使用 `any` |
| **持久化引擎** | SQLite 3 (better-sqlite3 / Kysely) + PostgreSQL + Prisma 7 | **Tier-A 零配置 SQLite / Embedded PG 18.4**（开发与测试立等可跑），生产无缝支持 PG/MySQL |
| **运行时校验** | Zod 4 | 强制输入/输出 Schema 校验，统一 400 语义 |
| **UI 与交互** | Tailwind CSS + Shadcn / UI-UX-Pro-Max | 规范化后台组件库与移动端响应式布局 |
| **测试框架** | Vitest + Playwright | 4 层金字塔（L1-L4）真实数据库驱动测试 |
| **四端客户端** | Admin (`src/app/(admin-pages)`) + 2C (`src/app/(portal-pages)`) + Expo (`clients/expo`) + Uni-App (`clients/miniapp`) | 跨 PC Web、iOS/Android 原生与微信小程序/H5 四端同源协同 |

## 3. 物理目录结构与三层边界

代码严格遵循 `packages/` 工作区与 BFF 分层组织，**严禁在 `src/` 下新建平铺业务模块**：

```
cooliebase-all/
├── packages/
│   ├── shared/                       # 核心公共基座 SDK（永远是 SDK，严禁当作微服务）
│   │   ├── backend/
│   │   │   ├── constants/            # 权限码、菜单树、domain-catalog.json（权威真源）
│   │   │   └── lib/                  # 鉴权网关、biz-tenant 租户上下文、服务总线、审计日志
│   │   └── contract/                 # 跨域共享契约、OpenAPI 规范、DTO 定义
│   │
│   ├── domains/                      # 平台基础地基（永不拆分、平台伴生）
│   │   ├── system/                   # RBAC、用户、角色、租户、部门、字典、认证鉴权
│   │   └── infra/                    # 系统配置、定时任务、文件存储、低代码生成引擎
│   │
│   └── plugins/                      # 18 个第一方可插拔业务域（插件化生命周期，支持独立打包）
│       ├── plugin-bpm/               # 流程审批中心
│       ├── plugin-pay/               # 支付通道与退款
│       ├── plugin-mall/              # 数字化商城系统
│       ├── plugin-crm/               # 客户关系中台
│       ├── plugin-erp/               # 经营中台与进销存
│       ├── plugin-wms/               # 仓储管理中心
│       ├── plugin-mes/               # 制造执行系统
│       ├── plugin-oa/                # 协同办公中心（公告/考勤/请假用印）
│       ├── plugin-hrm/               # 人力资源中心（员工/岗位/薪资核算）
│       ├── plugin-fms/               # 财务资金中心（账户/凭证/对账结算）
│       ├── plugin-pms/               # 项目管理中心（项目/里程碑/任务工时）
│       ├── plugin-ai/                # 大模型中台与开放网关
│       ├── plugin-report/            # 商业智能报表
│       ├── plugin-mp/                # 微信公众号中台
│       ├── plugin-member/            # 会员中心
│       ├── plugin-iot/               # 物联网中心
│       ├── plugin-im/                # 即时通讯中心
│       └── plugin-online/            # 低代码在线开发中心
│
├── src/app/                          # Next.js BFF 路由薄壳、Admin 页面与 2C 门户入口
│   ├── api/v1/admin/                 # 管理后台 REST API
│   ├── (admin-pages)/admin/          # 管理后台前端页面
│   ├── (portal-pages)/               # 2C 消费者门户页面
│   ├── login/                        # 动态管理员登录页面
│   └── proxy.ts                      # 反向代理与微服务上游调度网关
│
├── clients/expo/                     # Expo 跨端移动与 Web 预览应用渠道
├── clients/miniapp/                  # Uni-App Vue 3 微信小程序与 H5 客户端渠道
├── docs/                             # 唯一文档目录（01~09 过程资产, wiki/, specs/, audit/）
├── scripts/                          # 脚手架与门禁（scaffold, project-init, check, hatch）
└── data/                             # 真实本地数据库存储（data/cooliebase.db）
```

## 4. 架构分层拓扑

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser / Expo)              │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP / REST / WebSocket
┌─────────────────────────▼───────────────────────────────┐
│              Next.js Route BFF Layer (src/app/)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ API Route│  │ API Route│  │ Admin    │              │
│  │ (admin)  │  │ (plugin) │  │ Pages    │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼──────────────┼─────────────┼────────────────────┘
        │              │             │
┌───────▼──────────────▼─────────────▼────────────────────┐
│           Shared Infrastructure (packages/shared)       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │BizTenant │ │  Trace   │ │ Domain   │   │
│  │ Gateway  │ │ Context  │ │ Context  │ │  Facade  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Service  │ │  Audit   │ │   API    │ │  Rate    │   │
│  │   Bus    │ │   Log    │ │ Registry │ │ Limiter  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│           Platform Foundation & Pluggable Domains       │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐ │
│  │   system    │ │    infra    │ │ plugin-pay / mall  │ │
│  │   Service   │ │   Service   │ │ (18 Pluggable)     │ │
│  │  Validator  │ │  Validator  │ │ Services/Validators│ │
│  └─────────────┘ └─────────────┘ └────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│        Data Layer (SQLite / PostgreSQL / MySQL)         │
└─────────────────────────────────────────────────────────┘
```

## 5. 微服务演进路径与通信规范

项目支持三种渐进式演进形态：

### 阶段 A：模块化单体（当前开箱即用默认形态）
- 所有域共享一个 Next.js 进程；
- 域代码内聚在 `packages/domains/` 与 `packages/plugins/plugin-*`；
- BFF 同进程调用各域 Service；
- 数据库默认使用零配置 SQLite 本地库或共享 PostgreSQL。

### 阶段 B：可拆分单体（第一方插件独立打包部署）
- 每个插件域具备独立的 `plugin.manifest.json` 与 `contract/route.manifest.yaml`；
- 通过 `pnpm run domain:pack <domain>` 产出 API-only 独立子服务容器；
- BFF 反向代理通过 `COOLIEBASE_DOMAIN_<DOMAIN>_UPSTREAM` 自动反代至独立进程；
- 对前端暴露的 API 契约与 DTO 100% 保持一致，调用方无感。

### 阶段 C：独立微服务（跨语言平滑迁移）
- 核心业务域可完全拆分至 Go / Java 独立服务；
- 域间通信走自研 RPC（默认 nats-rr + JSON 或 gRPC Unary）；
- 事件驱动总线结合 Transactional Outbox 保证消息可靠投递。

### 🚨 跨域调用铁律（代码审查门禁强制断言）

```typescript
// ❌ 严禁：跨域直接 import 其他域的 Service、Repository 或 Model
import { PayOrderService } from "@/plugins/plugin-pay/backend/services"

// ✅ 正确：走统一 Domain Facade（单体走内存 SDK，拆分走轻量 RPC）
import { createDomainFacade } from "@/shared/backend/lib/rpc-facade"
const payFacade = createDomainFacade("pay", ["createOrder"] as const)
await payFacade.createOrder({ amount: 9900 }, { caller: "mall.order" })

// ✅ 正确：走发布订阅事件总线
import { eventBus } from "@/shared/backend/lib/event-bus"
await eventBus.publish({
  type: "mall.order.created",
  source: "mall",
  payload: { orderId: "1001", amount: 9900 }
})
```

## 6. 核心数据规模与工程量

| 指标维度 | 数量规模 | 状态说明 |
|---|---|---|
| **原生业务域** | 20 (2 Platform + 18 Plugins) | 全部已落地并注册在 `domain-catalog.json` |
| **Agent 机器可读契约** | 354 份 | 覆盖 19 个契约域，驱动无头运营与测试 |
| **API 端点** | 2290+ | 遵循 RESTful `/api/v1/` 规范与 Zod 强校验 |
| **四位一体终端** | 4 端 (Admin + 2C + Expo + MiniApp) | 同源共享 `project-profile.json` 与 `/api/v1` 契约 |
| **治理与交付门禁** | 28 项交付门禁 + 24 条工程标准 | `pnpm run check` 零容忍静态与动态守护 |

## 7. 安全铁律与多租户底座

1. **零默认凭据体系与动态安全引导**：
   - 彻底杜绝任何静态默认弱凭据，平台特权引导凭证由密码学安全随机函数动态生成并安全注入本地环境变量；
2. **多租户数据隔离真源**：
   - 租户来源唯一权威是全局执行上下文 `getCurrentTenantId()`；
   - 严禁信任外部接口透传的 `tenantId`，防止越权数据泄露。
3. **真实数据库驱动测试 (SpaceX-Grade)**：
   - 所有单测与状态机流转必须在真实数据库（SQLite / PostgreSQL）中执行落地与回滚断言；
   - 严禁编写只走前端假 Mock 的无效测试。
4. **日志与安全审计**：
   - 严禁 `console.log`；
   - 普通业务记录 `domainLog`，涉及权限变动、资金流向、状态变更的操作强制挂载 `auditLog`。
