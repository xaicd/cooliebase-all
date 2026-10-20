# Design Document: Frontend C/U Form Codegen Synchronization

## Overview
本设计把每个标准后台 CRUD 的 API client、C/U Form 和列表页固定为 modules-first 三层结构。它先让生成契约成为唯一事实来源，再分批迁移真实页面，避免“手写已拆、生成器仍产出 page 内表单”的回归。

## Architecture
以 `AGENTS.md` §14.2 为权威，并同步 `.kiro/steering/plugin-domain-structure.md`：
```text
packages/domains/{domain}[/{subModule}]/frontend/
├── api/{entity}.api.ts
├── components/{PascalEntity}Form.tsx
└── pages/{entity}-list.page.tsx
```
App bridge 在 `src/app/(admin-pages)/admin/{domain}[/{subModule}]/{entity}/page.tsx`；route 在 `src/app/api/v1/admin/{domain}[/{subModule}]/{entity}/route.ts`。所有路径通过同一规范化 route segment 构造，修复现有 subModule 漏失。

生成器收敛为版本化 frontend CRUD renderer：`CodegenEngineService`、`codegen/module-pack` 与 `scripts/codegen-from-source.ts` 共享 renderer 或共同 fixture，不得各自复制页面字符串。CRUD 生成 api、Form、list page、bridge；TREE、MASTER_CHILD、WORKFLOW、SINGLETON 必须采用专用 renderer 或显式拒绝。

`inject-codegen-output.cjs` 变为 manifest 驱动的受控落盘器：只接受 manifest 列出的 `src/**` 文件，支持 `--dry-run`，报告冲突并默认非覆盖；成功注入后校验输出路径和内部 imports。

## Components and Interfaces
- **API client**：公开实体、分页、CreateInput、UpdateInput、候选读取函数和 `page/get/create/update/delete`；其内部才允许 shared `request`。
- **Form**：`mode: "create" | "edit"`、`initialData`、`onSubmit(input): Promise<FormSubmitResult>`、`onCancel`。Form await `onSubmit`，处理 loading/错误，阻止重复提交，成功由 Page 决定关闭和刷新。
- **Page**：维护搜索、分页、列表数据、editing item 与 Form 开关；不包含字段 JSX、Form state、候选请求或 DTO 映射。
- **Renderer**：接收 table metadata、规范化 module path、entity/class 名与模板类型，产出有类型的 API/Form/Page/bridge 输出。
- **Injector**：解析 manifest，计算白名单目标，预检全部冲突，再写入；任何越界或冲突均不产生部分写入。

## Data Models
本 Spec 不改数据库模型。新增或统一的前端契约为：
```ts
type FormMode = "create" | "edit"
type FormSubmitResult = { success: boolean; error?: string }
type EntityFormProps<TInitial, TInput> = {
  mode: FormMode
  initialData?: TInitial
  onSubmit: (input: TInput) => Promise<FormSubmitResult>
  onCancel: () => void
}
type CodegenManifest = {
  contractVersion: string
  outputs: Array<{ path: string; type: "api" | "component" | "page" | "route" | "test" | "type" | "validator" | "service" }>
}
```
业务实体 DTO 仍以各模块现有 validator/API 契约为准。Form 不公开 `Record<string, any>`；生成器在未知 schema 边界可以内部使用 metadata，但输出需要有命名 DTO 类型。

## Correctness Properties

### Property 1: 输出结构一致性
**Validates: Requirements 1.1, 3.1**

对任一标准 CRUD，renderer 输出恰有 api、Form、list page，且它们的 entity 路径前缀一致。

### Property 2: 子模块路径一致性
**Validates: Requirements 3.3**

对任一含 subModule 的配置，module source import、API BASE、route 与 app bridge 使用同一 segment。

### Property 3: 前端请求边界
**Validates: Requirements 1.5**

Page 不直接 import shared `request`；Form 不直接 import shared `request`。

### Property 4: 表单提交状态
**Validates: Requirements 1.4, 2.2**

Form 的提交 Promise 未完成时不可二次提交；失败时保留 Form 和错误，成功时由 Page 刷新。

### Property 5: 注入原子性
**Validates: Requirements 5.1, 5.3**

Injector 的允许写入集合是 manifest 输出集合的子集，冲突或路径拒绝时目标树不改变。

## Error Handling
候选请求失败展示可恢复错误，表单提交失败显示服务端可安全暴露的错误文本并保持输入。缺失的关联候选、权限拒绝、状态变更和 scope 不匹配由后端保留最终错误语义。生成/注入输入无效、输出冲突、manifest 不匹配或路径越界必须产生非零错误；不得静默跳过后声称成功。

## Testing Strategy
使用固定 table metadata fixture 测试 CRUD renderer 的输出路径、imports、async Form contract 和 subModule。使用临时目录集成测试覆盖 injector dry-run、冲突、越界拒绝及成功注入。每批真实页面迁移做 Form 行为测试或组件 smoke，覆盖创建、编辑、取消、失败、关联候选状态和成功刷新；执行定向 Vitest、受影响 `pnpm exec tsc --noEmit`、生成/注入 smoke 与 `git diff --check`。测试文件被 tsconfig 排除，必须由 Vitest 单独运行。

## Migration Plan
System 先迁移 users、roles、depts、menus、posts、dicts、tenants、tenant-packages；随后迁移 infra configs、db-configs 和 crm customers。迁移保留现有默认值、不可变键、payload coercion、租户/套餐/菜单边界，特别是 users 的部门/角色/岗位、树表单父级过滤、tenants 的订阅、tenant-packages 的安全菜单和 db-configs 的敏感凭证不回显。job-center 先完成契约判定。

## Risks and Rollback
生成文件绝不覆盖已有人工文件，冲突由人工合并。保留旧注入入口的兼容读取路径，直到 renderer 和注入契约测试稳定。每页独立迁移且不变更 API/数据库契约，因此可以按组件、API client、页面三个文件回退。
