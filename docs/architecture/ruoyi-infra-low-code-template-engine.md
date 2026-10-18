# cooliebase-all infra 低代码模板引擎方案

更新时间：2026-08-03

## 1. 目标

把 yudao-boot-mini 的基础设施能力、低代码能力、模板引擎能力，收敛到 cooliebase-all 的 infra 模块中，形成可持续演进的“低代码平台底座”，而不是只保留一个表列表式 codegen 页面。

## 2. 设计原则

1. DB-first：所有可配置项、模板、生成任务、预览产物都必须落库。
2. 模块内聚：低代码模板引擎属于 infra 能力，不散落到 system / 业务模块。
3. 模板与生成解耦：模板负责描述，生成负责执行，预览负责校验。
4. UI/后端分离：模板定义是数据，页面渲染与代码输出是不同层次。
5. 兼容渐进式落地：先提供模板列表、表结构读取、预览 JSON，再扩展 CRUD 生成。

## 3. yudao-boot-mini 参考能力簇

按 yudao-boot-mini 的 infra 习惯，low-code/代码生成不是单一功能，而是一个能力链：

1. 数据源中心：读取库表、字段、索引、注释。
2. 代码生成：基于表结构生成后端/前端骨架。
3. 模板引擎：通过可配置模板控制输出格式。
4. 低代码平台：支持表单、列表、详情、校验规则、API 路由、权限码的统一拼装。
5. 预览/下载：在真正落盘前可查看生成内容。
6. 双模调用：生成 Service 可被 broker 调用；同进程 SDK，拆分后同一 Facade 切 RPC。跨域禁止直接 import 其他域 Service。

## 4. cooliebase-all 的落位方式

### 4.1 目录建议

```text
apps/cooliebase/cooliebase-all/packages/domains/infra/
  backend/
    services/
      codegen.service.ts
      template-engine.service.ts
      datasource.service.ts
    validators/
      infra.validator.ts
      template-engine.validator.ts
    models/
      template-engine.types.ts
  frontend/
    pages/
      codegen/
      template-engine/
```

### 4.2 现有 codegen 的定位修正

当前的 `InfraCodegenService` 只是表清单列表，应该升级为模板引擎入口，而不是最终生成器本体。

建议拆成三层：

1. `DatasourceService`：读取数据源、库表、字段、索引。
2. `TemplateEngineService`：保存模板、预览渲染、生成任务编排。
3. `InfraCodegenService`：保留兼容入口，负责对外聚合“表 + 模板 + 生成任务”。

## 5. 数据模型建议

### 5.1 TemplateDefinition

用于保存低代码模板定义。

字段建议：

- `id`
- `name`
- `code`
- `category`：`CRUD` / `TREE` / `SINGLETON` / `WORKFLOW`
- `templateType`：`BACKEND` / `FRONTEND` / `API` / `SQL`
- `engine`：`handlebars` / `mustache` / `ejs` / `json-template`
- `content`
- `options`：JSON（分页、权限码命名、路由前缀、文件命名规则）
- `status`
- `createdAt` / `updatedAt`

### 5.2 CodegenTable

用于保存数据表元信息与字段元信息的快照。

字段建议：

- `id`
- `tableName`
- `moduleName`
- `businessName`
- `entityName`
- `author`
- `comment`
- `fields`：JSON 字段定义
- `generatedAt`

### 5.3 CodegenJob

用于保存生成任务与预览版本。

字段建议：

- `id`
- `tableId`
- `templateId`
- `status`：`PENDING` / `RUNNING` / `DONE` / `FAILED`
- `previewJson`
- `generatedFiles`
- `errorMessage`
- `createdBy`
- `createdAt`
- `updatedAt`

> 如果后续要严格 DB-first，可以把这些记录先放到 `Setting` 作为过渡，但最终建议独立模型，而不是长期塞在 KV 里。

## 6. API 设计建议

### 6.1 只读

- `GET /api/admin/infra/codegen/tables`
- `GET /api/admin/infra/codegen/templates`
- `GET /api/admin/infra/codegen/tables/[id]`
- `GET /api/admin/infra/codegen/templates/[id]`
- `GET /api/admin/infra/codegen/preview?tableId=&templateId=`

### 6.2 写入

- `POST /api/admin/infra/codegen/templates`
- `PATCH /api/admin/infra/codegen/templates/[id]`
- `POST /api/admin/infra/codegen/generate`
- `POST /api/admin/infra/codegen/sync-table`

### 6.3 生成结果

- `GET /api/admin/infra/codegen/jobs`
- `GET /api/admin/infra/codegen/jobs/[id]`
- `GET /api/admin/infra/codegen/jobs/[id]/download`

## 7. 模板引擎能力建议

### 7.1 模板变量

生成器至少要支持：

- `tableName`
- `moduleName`
- `entityName`
- `businessName`
- `fields`
- `primaryKey`
- `treeField`
- `permissions`
- `routePrefix`
- `apiPrefix`
- `frontendPageName`

### 7.2 模板阶段

模板执行建议分 4 个阶段：

1. schema 阶段：解析表结构、字段、约束、枚举。
2. plan 阶段：生成文件清单与路由清单。
3. render 阶段：把模板渲染为内容。
4. materialize 阶段：写入文件系统或返回下载包。

### 7.3 模板类型

建议至少覆盖：

- 后端 service / validator / route
- 前端 list / form / detail 页面
- 权限码注册
- 菜单注册数据
- SQL/DDL 片段

## 8. 与 cooliebase-all 现有规范对齐

1. 路由必须薄层，API route 只做鉴权、参数校验、调 service。
2. service 必须是 DB-first，不允许回退 mock。
3. 权限码必须接 `PERMISSIONS` / `ensurePermission`。
4. 所有生成动作必须打 `event + audit`。
5. 生成预览和下载必须有测试，至少覆盖正向预览与失败路径。

## 9. 与 infra 现有模块的关系

### 9.1 config

保存模板引擎配置开关、默认模板、默认命名规则。

### 9.2 job

承载生成任务、预览任务、异步下载任务。

### 9.3 file

承载最终生成包、zip 下载、模板文件归档。

### 9.4 db-config

承载“从哪个数据源读表结构”的配置。

### 9.5 codegen

升级为模板引擎入口，而不是一个纯列表页面。

## 10. 推荐实施顺序

### Phase A：打底

1. 保留 `InfraCodegenService` 兼容列表。
2. 增加 `TemplateEngineService`。
3. 增加模板定义的 validator 与存储结构。
4. 补 `GET/POST` 模板 CRUD API。

### Phase B：预览

1. 接表结构读取。
2. 支持模板预览 JSON。
3. 支持预览 HTML / TS / SQL 文本。

### Phase C：生成

1. 支持生成任务。
2. 支持 zip 下载。
3. 支持权限码、菜单、页面骨架同步生成。

### Phase D：平台化

1. 支持模板市场。
2. 支持团队私有模板。
3. 支持版本回滚与模板差异对比。

## 11. 结论

yudao-boot-mini 的 low-code / template engine 能力应该落在 cooliebase-all 的 infra 模块，而不是 system 模块或业务模块。

最合适的切入点是：

1. 以 `InfraCodegenService` 作为入口兼容层。
2. 新增 `TemplateEngineService` 承载真正的模板定义与生成逻辑。
3. 先做预览和模板 CRUD，再做生成与下载。
4. 最终把“代码生成”升级为“低代码模板平台”。
