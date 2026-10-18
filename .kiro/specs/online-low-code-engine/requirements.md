# Requirements Document

## Online Low-Code Engine

## Introduction
在 `cooliebase-all` 建设自研 Online 低代码引擎，以 JeecgBoot Online 的功能范围为参考，而不依赖其未公开后端实现。引擎必须让有权限的管理员在线定义数据模型、表单与页面，受控执行数据库变更，发布不可变版本，并在浏览器中直接运行和测试真实业务 CRUD。Puck 仅作为受限页面布局编排器；数据、权限、动作、流程与数据库变更均由服务端结构化元数据控制。

## Glossary
- **Definition**：一个租户拥有的 Online 应用定义，描述数据、交互、视图、动作和策略。
- **Revision**：Definition 的可编辑草稿或不可变发布快照。
- **Runtime**：依据已发布版本解释元数据、执行受保护 CRUD 的页面与 API。
- **Online Test**：在非生产环境或允许的租户沙箱内，直接进入 Runtime 完成真实写入、查询、更新、删除和权限验证的能力。
- **Migration Plan**：由数据模型差异生成、经检查和批准后执行的数据库变更计划。
- **Puck View**：只描述布局与受限组件槽位的 Puck Data；不是数据库、权限或业务逻辑事实来源。

## Requirements

### Requirement 1: Definition、版本和租户边界
**User Story:** 作为平台或租户管理员，我希望在线维护版本化的应用定义，并确保它不会泄露或修改其他租户的配置与数据。

#### Acceptance Criteria
1. THE system SHALL 为 Definition、Revision、Field、Index、Relation、View、Action、Policy、WorkflowBinding、Release 和 SchemaChange 建立 Prisma 权威模型、迁移与 Kysely 类型。
2. EACH tenant-owned record SHALL 包含 `tenant_id`；Definition code 在租户范围内唯一；所有读取、写入、关联和发布操作必须从已验签请求上下文取得 tenant scope。
3. WHEN Definition 被编辑 THEN 系统必须只修改 DRAFT Revision，并以 optimistic locking 拒绝陈旧写入。
4. WHEN Revision 发布 THEN 系统必须产生不可变 Release snapshot；Runtime 只能读取 PUBLISHED Release。
5. THE system SHALL 支持将当前发布版本回滚至一个此前完整、已校验的 Release，不修改历史快照。

### Requirement 2: 可配置数据模型与安全迁移
**User Story:** 作为管理员，我希望通过字段、索引、树和主子表关系定义数据模型，并安全将经批准的定义应用到数据库。

#### Acceptance Criteria
1. THE system SHALL 支持 `SINGLE`、`TREE`、`MASTER_DETAIL` 模型，字段类型、必填、长度、枚举/字典、默认值、唯一约束、索引及受控关联。
2. THE system SHALL 在发布前将 Definition Revision 编译为可审查的 Migration Plan，包含风险等级、SQL/操作摘要、受影响对象、回滚或向前修复说明。
3. THE system SHALL 不在生产环境提供“删表重建”的 force sync；破坏性变更必须默认拒绝或走显式审批和备份确认流程。
4. WHEN migration 执行 THEN 系统必须记录执行人、tenant、revision、时间、结果、错误和 schema revision，并阻止并发执行同一 Definition。
5. THE system SHALL 在迁移完成前拒绝使用依赖该 schema revision 的 Runtime 发布。

### Requirement 3: Online 表单、列表和直接在线测试
**User Story:** 作为业务管理员，我希望发布后可在浏览器直接测试真实的页面和数据，而非只能查看设计预览。

#### Acceptance Criteria
1. THE Runtime SHALL 根据发布 Definition 提供列表、查询、分页、排序、详情、新增、编辑、删除，以及树和主子表专用交互。
2. THE system SHALL 在 Admin 中提供 Definition 的“在线测试”入口；该入口必须显示当前 Release、schema revision、测试环境和数据写入提示。
3. WHEN 在线测试创建、更新或删除记录 THEN 操作必须通过与正式 Runtime 相同的服务端 validator、policy、tenant scope、事务、审计和错误处理。
4. THE test page SHALL 支持 sandbox 标记或专用测试数据集；生产环境的写操作必须受 runtime feature flag、权限和显式确认约束。
5. THE system SHALL 提供发布前预览与发布后 Runtime 测试；预览不得伪造有权限的业务写入成功。

### Requirement 4: Puck 页面编排的受限使用
**User Story:** 作为页面设计者，我希望拖拽布局 Online 页面，同时不能绕过数据模型、权限与安全边界。

#### Acceptance Criteria
1. THE Puck registry SHALL 只暴露 `OnlinePageHeader`、`OnlineSearchForm`、`OnlineDataTable`、`OnlineForm`、`OnlineDetail`、`OnlineActionBar`、`OnlineMasterDetail`、`OnlineStatistic`、`OnlineChart` 等受控组件。
2. EACH Puck component SHALL 仅引用已发布的 `definitionCode`、`viewCode`、field/action scope 和受控展示属性；不得接受任意 API URL、HTML、JavaScript 或 SQL。
3. THE Runtime renderer SHALL 使用与编辑器相同的 allowlist config 渲染发布快照，拒绝未知组件、未知字段和超限 JSON。
4. THE existing `page-builder` prototype SHALL 被迁移到 OnlineView/Revision/Release 模型；不得继续使用未鉴权的内存持久化 API 或摘要式渲染。

### Requirement 5: 策略、动作和流程
**User Story:** 作为安全管理员，我希望控制谁能设计、看到、编辑和执行每个 Online 应用的数据与操作。

#### Acceptance Criteria
1. THE system SHALL 在 `PERMISSIONS`、运行时菜单/角色授权中定义 `infra:online-definition:query/create/update/publish/delete/test/generate` 等管理权限。
2. THE Runtime SHALL 在服务端实施字段 read/write、action execute 和 row scope policy；浏览器隐藏不是安全控制。
3. THE system SHALL 提供内置 CRUD、导入、导出和 Workflow action，并让自定义动作只能调用注册的 server Action Handler。
4. THE system SHALL NOT 执行数据库保存的任意 JavaScript、任意 SQL 或任意服务器代码；条件逻辑只允许受限表达式 DSL。
5. WHEN WorkflowBinding 生效 THEN 流程 key、状态字段、允许动作和状态转换必须显式配置并由服务端校验。

### Requirement 6: 发布后的代码生成
**User Story:** 作为开发者，我希望将已在线验证的应用定义生成可维护的源码模块。

#### Acceptance Criteria
1. THE code generator SHALL 从完整 PUBLISHED Release，而非裸 `TableInfo`，生成 Repository、Zod validators、Service、protected routes、typed frontend API、List/Form/Detail 页面、Puck blueprint、菜单/权限 migration 和 manifest。
2. THE generator SHALL 对 CRUD、TREE、MASTER_CHILD、WORKFLOW、SINGLETON 实现专用 renderer；未支持的 Release 必须明确拒绝，不能假装生成。
3. THE generator SHALL 以 dry-run 预览、ZIP 下载和受控 injector 输出；默认不得覆盖人工维护文件。
4. Generated Runtime contracts SHALL 保持 tenant scope、field/action policy 和 WorkflowBinding 的服务端边界。

### Requirement 7: 可观测性、验收和治理
**User Story:** 作为项目负责人，我希望每一次设计、迁移、发布和在线测试均可追踪、可验证、可回滚。

#### Acceptance Criteria
1. ALL Definition、migration、release、online-test 和 generated artifact 操作 SHALL 通过 `withAdminRoute`、trace、访问日志和操作审计。
2. THE system SHALL 记录 Definition/revision/release/schema revision、actor、tenant、trace ID 和安全可公开的失败原因。
3. THE project SHALL 为模型编译、策略、迁移计划、Runtime CRUD、双租户隔离、Puck allowlist、代码生成和发布回滚提供定向测试。
4. THE project SHALL 维护 API、菜单、默认角色、数据字典、迁移与在线测试操作手册，并在交付时提供验证证据。
