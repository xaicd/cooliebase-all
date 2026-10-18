---
name: new-feature
description: 全链路一站式新功能研发与交付闭环（融合 .kiro/feature-development-workflow、RBAC 数据库持久化、全动词 API、多租户仓储、UI 单行规范、CRUD 操作列与弹窗、自动化测试）。
---

# 全链路一站式新功能研发规范 (End-to-End Feature Delivery Workflow)

## 1. 适用场景与核心目标
- 用户提出“新增功能”“设计接口”“设计表结构”“生成 CRUD”“配置菜单”“多端扩展”等需求时，**必须强制启用本 Skill 闭环执行**。
- **绝对禁止仅交付只读骨架或占位页面（Forbidden Skeleton-Only Delivery）**。
- 交付标准：用户在界面上即可**直接新增、筛选、编辑、启停、删除、调测并多端动态可见**。

---

## 1.5 第 0 步：先解析目标域的**真实目录**（强制）

**本仓 15 个业务域已插件化**，代码在 `packages/plugins/plugin-<domain>/`，
只有平台地基（`system` / `infra`）还在 `packages/domains/`。

所以**任何时候都不要手写 `packages/domains/{domain}/...`**。先解析：

- MCP：`cooliebase_domain_resolve`（域名 → 真实目录 + 是否插件）
- MCP：`cooliebase_codegen_targets`（低代码/脚手架在该域的**落点**，按真实目录算）
- 脚本侧：`scripts/lib/domain-catalog.cjs` 的 `domainDirOf` / `domainPathOf`
- 服务端 TS 侧：codegen 的 `domainBaseDir`

**写死路径的后果通常不是报错，而是静默失效** —— 文件生成到了应用从不 import 的目录，
门禁也可能扫不到（检查器只扫已知根，域搬走后规则会**空转**而仍然显示绿）。

下面各步里的 `packages/{domainDir}/...` 一律指**上一步解析出来的真实目录**。

## 2. 标准七步闭环交付体系 (End-to-End Checklist)

```mermaid
flowchart TD
    S0[0. 风险分类与立项] --> S1[1. 需求与三端入口设计]
    S1 --> S2[2. 数据库建模与多租户索引]
    S2 --> S3[3. 权限 RBAC 与契约设计]
    S3 --> S4[4. 全动词 API 与薄层 Route]
    S4 --> S5[5. Service 业务与状态机/审计]
    S5 --> S6[6. 前端单行 UI 与 CRUD 弹窗]
    S6 --> S7[7. 迁移部署、测试与文档归档]
```

### 第 0 步：风险分类与立项门禁 (Classification & Feature Gate)
1. **分类识别**：
   - **标准 CRUD**：字典、日志、基础配置、目录列表；
   - **高风险领域**：订单、支付、履约、库存/容量日历、状态机、多租户资金、外部回调、异步 Cron；
2. **立项记录**：需求与对话事实按规范实时追加到 `docs/features/sprint-prod/{MMDD}.md`。

---

### 第 1 步：RBAC 数据库菜单与权限持久化 (Database RBAC)
1. **代码层常量声明**：在 `packages/shared/backend/constants/permissions.ts` 中声明 4 级增删改查权限码：
   - `{DOMAIN}_{ENTITY}_VIEW`: `"{domain}:{entity}:view"`
   - `{DOMAIN}_{ENTITY}_CREATE`: `"{domain}:{entity}:create"`
   - `{DOMAIN}_{ENTITY}_UPDATE`: `"{domain}:{entity}:update"`
   - `{DOMAIN}_{ENTITY}_DELETE`: `"{domain}:{entity}:delete"`
2. **数据库持久化迁移**：在 `prisma/migrations/` 中编写纯 SQL 迁移，插入 `system_menu`（目录 DIR、页面 MENU、按钮 BUTTON），并通过 `system_role_menu` 动态关联赋权管理员角色，**禁止仅改前端内存假菜单**。

---

### 第 2 步：数据建模与多租户索引设计 (Prisma & Kysely)
1. **标准 6 大审计与租户字段（强制）**：
   - `tenant_id`（带 B-Tree 索引）、`created_by`、`updated_by`、`created_at`、`updated_at`、`deleted`；
2. **Kysely DB 工厂解包规则**：`const db = await getKyselyDb()` 必须 `await` 异步解包 Kysely 实例，禁止同步直调；
3. **Repository 双导出规范**：文件与 `index.ts` 必须同时导出 `XxxRepository` (PascalCase) 与 `export const xxxRepository = XxxRepository` (camelCase) 别名；
4. **Repository 落地**：必须实现 `findAll`、`findById`、`create`、`update`、`delete`，并在所有 SQL/Kysely 查询中强制限定租户隔离。**租户必须从全局上下文取，禁止显式 tenantId 参数透传**（透传断链=数据泄露，AGENTS.md §4.8 已实证）：
   ```ts
   import { getCurrentTenantId, isTenantRequired, isPlatformContext } from "@/shared/backend/lib/biz-tenant"

   function currentTenantId(): string | undefined {
     const tenantId = getCurrentTenantId()
     if (tenantId) return tenantId
     if (isTenantRequired() && !isPlatformContext()) throw new Error("业务数据访问缺少租户上下文")
     return undefined
   }
   // 查询：真实库 where tenant_id = current；内存 filter (!row.tenantId || row.tenantId === current) 同语义
   // 写入：tenant_id 取 current，无上下文场景（open/relay）从已验证资源归属取，禁止硬编码 "1"
   ```

---

### 第 3 步：数据契约与验证器 (Contract & Zod Validator)
1. **Zod Validator**：在 `backend/validators/` 中定义严格的输入白名单（`createSchema` / `updateSchema` / `pageQuerySchema`）；
2. **Contract Actions 契约**：在 `contract/actions.ts` 中注册 `ACTION_SCHEMAS`，实现 HTTP 与 ServiceBus/RPC 双模共用。

---

### 第 4 步：全动词 API 路由 (Full Verbs API Route)
在 `src/app/api/v1/admin/{domain}/{entity}/route.ts` 中**完整实现全部 4 大 HTTP 动词**：
- `GET`: 列表分页查询，挂载 `withAdminRoute({ permission: PERMISSIONS.{DOMAIN}_{ENTITY}_VIEW })`；
- `POST`: 新增实体，挂载 `withAdminRoute({ permission: PERMISSIONS.{DOMAIN}_{ENTITY}_CREATE })`；
- `PUT`: 更新实体，挂载 `withAdminRoute({ permission: PERMISSIONS.{DOMAIN}_{ENTITY}_UPDATE })`；
- `DELETE`: 删除实体，挂载 `withAdminRoute({ permission: PERMISSIONS.{DOMAIN}_{ENTITY}_DELETE })`。

---

### 第 5 步：Service 业务逻辑与审计日志 (Service & Audit)
1. **Service 门面方法**：实现 `page`、`get`、`create`、`update`、`delete`；
2. **审计与事件输出**：关键动作记录 `domainLog.event()`，敏感及写操作记录 `domainLog.audit()`；
3. **图片统一上传（如涉及图片）**：严禁手填任意外部 URL，必须使用项目统一上传组件与托管存储。

---

### 第 6 步：前端开箱即用 UI 与弹窗交互 (Frontend UI Standard)
严格遵循 `channels.page.tsx` UI Design System：
1. **API Client 封装**：`packages/{domainDir}/frontend/api/{entity}.api.ts` 使用 `request.get(url, { params })` / `request.post(url, data)`；
2. **顶部工具栏与按钮顺序**：标题 `text-xl font-bold tracking-tight text-slate-900`，`[刷新]`(白色描边 `bg-white border-slate-300`) 在左，`[+ 新增]`(Blue `bg-blue-600`) 在右；
3. **搜索栏 Container**：`p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3`，`bg-slate-900` 查询 + `bg-slate-100` 重置，右侧统计数据；
4. **严格单行排版（whitespace-nowrap）**：`bg-slate-50/80` 表头，`px-5 py-3 text-xs` 单元格；
5. **超长内容单行截断（Truncate）**：URL、密钥、长名称等使用 `max-w-[200px] truncate` + `title="..."` 悬停提示；
6. **多标签收敛**：列表 Tags 单行最多显示 2 个，超出显示 `+N` 徽标；
7. **操作列横向排布**：操作列固定保底宽度（`min-w-[190px]`），横向平铺 `[编辑]`(Blue)、`[启用/禁用]`(Amber/Emerald)、`[删除]`(Rose)、业务动作；
8. **模态表单弹窗（Form Modal）**：具备参数校验、新增/编辑状态复用与友好反馈。

---

### 第 7 步：迁移部署、测试与文档归档 (Verification & Delivery)
1. **数据库迁移执行与自动备份**：
   ```bash
   npm run db:migrate
   npm run db:backup
   ```
2. **契约生成与门禁检查**：
   ```bash
   npm run domain:contracts
   npm run domain:manifests
   npm run check
   ```
3. **自动化单元测试**：编写并运行 `packages/{domainDir}/backend/services/__tests__/{entity}.service.test.ts` 确保 100% 绿灯。
