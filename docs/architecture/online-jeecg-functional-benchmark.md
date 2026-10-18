# JeecgBoot Online 功能对标与安全设计档案

> 状态：功能学习归档（只读分析）  
> 原始样本：`JeecgBoot/jeecg-boot/db/jeecgboot-mysql-5.7.sql`  
> 使用原则：JeecgBoot Online 仅作为产品能力对标，不复制其不可控后端实现。

## 目的

本档案保留 Online 低代码引擎的功能学习结论，为 `cooliebase-all` 后续设计、排期和评审提供依据。目标是实现安全的在线数据模型设计、Puck 页面设计、浏览器真实 Online Test 和从 Published Release 生成代码，而不是实现可执行脚本或任意数据库操作平台。

## 当前实现状态

- 已完成：租户隔离的 Definition / Draft Revision / Immutable Release 生命周期、乐观锁、结构化 Model IR、语义化 Schema Plan、字段 Interaction IR、`SINGLE` / `TREE` / `MASTER_DETAIL` Draft 校验、字段投影，以及仅对 Published `SINGLE + GENERIC_RECORD` Release 开放的 actor-owned sandbox Online Test CRUD。
- Online Test 使用固定 `online_record` 表，不创建动态业务表；每条测试记录均绑定 tenant、Definition、不可变 Release 与测试 Session。新增 migration 尚未部署，必须走审批后的 staging/production runbook。
- 当前唯一写入事实来源是 `revision.model_json + interaction_json`；`online_field` 是同一事务产生的结构化投影，供管理查询、发布快照和后续 Runtime 编译使用，不允许独立写入造成双写漂移。
- 未启用：动态 DDL、任意 SQL/脚本、Puck Runtime、生产 Runtime CRUD、受控报表/图表/仪表盘、工作流执行和 Release 代码生成。

## Jeecg Online 能力地图

| 能力域 | Jeecg 表 | 可观察到的产品能力 | 本项目安全对应 |
| --- | --- | --- | --- |
| 数据模型 | `onl_cgform_head`、`field`、`index` | 表、字段、索引、树、主子表配置 | Definition、Revision、Field、Index、Relation、Model IR |
| 表单交互 | `onl_cgform_field`、`button` | 控件、字典、校验、查询、列表/表单展示、动作 | Field Interaction IR、注册 Action |
| 权限 | `onl_auth_data/page/relation` | 行数据、页面、控件、角色约束 | 服务端 Field/Action/Row Policy |
| 报表 | `onl_cgreport_head/item/param` | 参数化列表、排序、分组、汇总 | 后续受控 Query/Aggregation IR |
| 页面与仪表盘 | `onl_drag_*` | 物料、数据集、布局、组件实例、分享 | OnlineView + Puck allowlist + Release snapshot |
| 图表 | `onl_graphreport_*` | 维度、指标、图表模板、参数 | 后续受控 Chart Definition |

## 已验证的 Jeecg 元数据分组

- **权限：**`onl_auth_data`、`onl_auth_page`、`onl_auth_relation`。
- **表单/模型：**`onl_cgform_head`、`onl_cgform_field`、`onl_cgform_index`、`onl_cgform_button`，以及 Java/JS/SQL 增强表。
- **动态报表：**`onl_cgreport_head`、`onl_cgreport_item`、`onl_cgreport_param`。
- **拖拽页面/数据集：**`onl_drag_comp`、`onl_drag_dataset_*`、`onl_drag_page`、`onl_drag_page_comp`、`onl_drag_share`、`onl_drag_table_relation`。
- **图表：**`onl_graphreport_head`、`item`、`params`、`templet`、`templet_item`。

## 需吸收的设计能力

1. **结构化模型。**字段、索引、关联、树语义和主子表语义应属于版本化 Revision，而不是由页面推断。
2. **结构化交互。**字段应有 widget、字典/lookup、required、readonly、查询操作符、列表/表单/详情可见性和排序等受校验元数据。
3. **策略分层。**字段读写、动作执行和行数据范围需分别建模，并在服务端编译和执行。
4. **页面分离。**数据模型与页面布局分离；页面只引用 Definition、View、Field 和 Action。
5. **逐层扩展。**Runtime CRUD 稳定后，再引入报表、图表、仪表盘、受控共享和发布版代码生成。


## `onl_cgform_*` 表结构的完整安全映射

本节以 Jeecg SQL 中实际存在的全部七张 `onl_cgform_*` 表为基准。它们用于产品能力对标；本系统不复制其动态执行机制。

| Jeecg 元数据表 | 观察到的职责 | 本系统持久化事实来源与投影 | 安全处理 |
| --- | --- | --- | --- |
| `onl_cgform_head` | 表单类型、分类、主键策略、分页/选择、树、模板与主题属性 | `OnlineDefinition` 身份 + `OnlineRevision.interaction_json.settings` | 只接受固定枚举；不保存任意模板、URL 或自由扩展 JSON |
| `onl_cgform_field` | 字段类型、长度/精度、默认值、备注、控件、可见性、只读、字典、查询及校验 | `OnlineRevision.model_json.fields` + `interaction_json.fields`；同步到 `online_field` | 字典仅保存受控 code；控件、formatter、operator、rule key 均为 allowlist |
| `onl_cgform_index` | 普通/唯一索引和有序字段列表 | `model_json.indexes`；同步到 `online_index` | 仅生成语义 Schema Plan；无 SQL、无 apply、无动态 DDL |
| `onl_cgform_button` | 受页面位置、排序、样式约束的按钮定义 | `interaction_json.actions`；同步到 `online_action` | 仅内置 CRUD / 导入导出 / 工作流动作类型；无表达式、无任意 handler |
| `onl_cgform_enhance_java` | Java 增强 | 不持久化 | 明确禁止用户配置 Java 类、类名或事件代码 |
| `onl_cgform_enhance_js` | JavaScript、字段联动和页面生命周期增强 | 不持久化 | 用受控字段 IR、固定 formatter 和注册服务端动作替代；禁止脚本 |
| `onl_cgform_enhance_sql` | SQL 增强 | 不持久化 | 明确禁止 SQL、动态查询、配置化数据库写入 |

### Draft → Release 数据一致性

每次 Draft 保存以 `model_json + interaction_json` 为唯一可编辑事实来源；同一 Kysely transaction 会重新生成 `online_field`、`online_index`、`online_relation` 和 `online_action` 投影。关联目标必须属于当前 tenant，并且目标 Definition 的当前 Draft 中存在被引用字段。

Draft 校验会再次编译模型、字段交互、查询/校验、索引、关联、内置动作和 Puck allowlist。发布时，归一化的模型/交互配置及四类投影一并进入不可变 `online_release.snapshot_json`；随后原样克隆到下一个 Draft。Runtime 仍只读取已发布 Release，绝不读取可变 Draft 或页面输入。

## 截图学习：页面级 Online 表单开发体验

> 样本：用户提供的 Jeecg Online 页面截图。以下仅记录可见产品功能，不推断、复制或依赖其未公开后端实现。

### 1. Online 表单资产列表（不是单一编辑器）

截图显示 Online 表单开发首先是一个可治理的资产列表：

- 多条件检索：表名、表类型、表描述，带查询、重置和高级查询入口。
- 创建与批量操作：新增、清空已选、导入数据库表。
- 表单级操作入口：编辑、更多操作、代码生成，以及受控的自定义按钮/增强能力入口。
- 可观测列表列：表类型、表名、表描述、版本、同步状态、创建时间和操作。
- 在左侧信息架构中，Online 表单开发与报表、数据源规则、系统校验规则、生成器案例并列，而非隐藏在一个 Puck 页面里。

**本项目吸收方式：**Online Definition 应有独立的列表管理页、检索、类型筛选、状态、Draft/Release 版本、最近更新时间、设计入口、复制、归档、沙箱测试和 Release 代码生成入口。业务用户先管理“在线表单资产”，再进入具体设计工作区。

### 2. 新建/编辑表单头部属性

截图中的表单头部是明确的产品配置区，包含：

- 表名、表描述、表类型（单表/树表/主子表）。
- 表单分类。
- 主键策略。
- 查询模式。
- 主题模板、表单布局样式、滚动条。
- 是否显示复选框、是否分页、是否为树。

**本项目安全对应：**

| 页面能力 | 受控 Online IR | 处理原则 |
| --- | --- | --- |
| 表名/描述/类型 | Definition `code`、`name`、`modelType` | tenant 内唯一；不等同于可执行物理表名 |
| 表单分类 | `definition.category`（后续） | 受控枚举/分类树，不影响权限 |
| 主键策略 | `model.identity`（后续） | 仅支持平台注册的 UUID/雪花/数据库序列策略 |
| 查询模式/分页/复选 | `interaction.list`（后续） | 只影响 Runtime UI；服务端分页始终生效 |
| 主题/表单布局/滚动 | `OnlineView` Puck props | 仅表现层 allowlist，不保存 CSS/HTML |
| 是否树 | `TREE + tree.parentField` | 必须经模型语义验证，不能只靠页面开关 |

### 3. 数据库属性页签：字段物理语义

截图中的“数据库属性”以表格编辑字段名称、备注、长度、小数位、默认值、字段类型、主键、允许空值，并可新增字段和排序。

**本项目吸收方式：**当前 Model IR 已承载字段编码、类型、nullable、length、default、index；下一轮 UI 要以字段网格呈现，不再默认暴露 JSON。需要补充：字段备注、精度/小数位、受控 identity、系统字段模板和字段排序。所有变更仍先产生语义 Schema Plan；不得改成浏览器动态 DDL 或强制同步。

### 4. 页面属性页签：列表、表单与查询交互

截图中的“页面属性”是字段在 UI 上的配置网格，包含表单显示、列表显示、排序、可编辑、控件类型、控件长度、是否查询、查询类型、默认值、扩展参数和自定义转换器。

**本项目吸收方式：**扩展 Interaction IR，分离：

- 列表：visible、display order、sortable、column width、summary。
- 表单：visible、widget、layout/span、readonly、placeholder、default。
- 查询：enabled、operator、query widget、排序、默认条件。
- 详情：visible、display order、format。

其中 widget、operator、format 必须是固定枚举；所谓“扩展参数”只能是组件的严格 props schema；“转换器”只能引用平台注册的 formatter key，不能保存 JavaScript。

### 5. 校验字段页签

截图显示字段可配置校验规则、必填校验，以及字典表/字典编码/字典文本映射。

**本项目吸收方式：**新增 `Validation IR`：required、min/max、length、pattern、enum/dictionaryRef、referenceRef、messageKey。编译为服务端 Zod command schema，并可导出前端提示 schema。字典和引用必须通过 tenant-scoped registry 解析；不接受任意表名、任意 SQL 或自定义表达式。

### 6. 外键与索引页签

截图分别提供外键字段、主表名、主表字段配置，以及索引名称、索引字段、索引类型的编辑页。

**本项目吸收方式：**

- 外键变为 Definition/Field 之间的显式 Relation Binding，必须同租户、目标 Release/Definition 存在，并由 `TREE`/`MASTER_DETAIL` 编译器校验。
- 索引保持结构化 `Index IR`，需支持唯一/普通索引和字段顺序。
- 两者都只能进入语义 Schema Plan，不能在 Online 页面直接执行 SQL/DDL；当前阶段仍不提供 apply。

### 7. 查询配置页签

截图中的查询配置为字段指定控件类型、字典信息、默认值和启用状态，说明“查询模型”应独立于表单展示属性。

**本项目吸收方式：**将现有 `query.enabled + operator` 扩展为独立 `Query IR`，声明可查询字段、固定查询组件、操作符、排序白名单、默认筛选和字典绑定。Runtime 必须根据 Release Query IR 构建参数化 Kysely 查询，不能拼接 SQL。

### 8. 增强、导入与代码生成

列表截图可见自定义按钮、JS/SQL/Java 增强、导入数据库表、代码生成等入口。

**安全替代：**

- 保留“内置动作”和“注册 server action”，删除用户保存的 JavaScript、Java、SQL 和任意 URL 增强。
- “导入数据库表”只能走受控 schema introspection：限定同一配置的数据源、只读、白名单 schema、人工确认后导入为 Draft Model IR；不得直接绑定任意连接字符串或自动改库。
- “代码生成”只允许从已发布、已校验、无待执行 Schema Plan 的 Release 生成，并提供 dry-run/预览/ZIP；不覆盖手工文件。

### 推荐的本项目页面信息架构

```text
Online开发
├── Online 表单管理（资产列表：查询、筛选、状态、版本、创建、复制、归档）
├── 表单设计工作区
│   ├── 基础属性
│   ├── 数据模型（字段、系统字段、主键、索引、关系）
│   ├── 页面属性（列表、表单、详情、查询）
│   ├── 校验与字典
│   ├── 页面设计（受控 Puck）
│   └── 发布治理（校验、Schema Plan、Release、回滚、沙箱测试）
├── Online 测试（仅 Published Release）
├── Release 代码生成（后续）
└── 受控数据源导入（后续、只读 introspection）
```

该信息架构是后续 UI 重构基准：先实现可治理的表单资产和结构化多页签设计，再逐步接入 Runtime、策略、树/主子和代码生成。


## 全能力安全路线图（2026-08-15）

> 本节把已观察到的 Jeecg Online 产品能力转化为本系统独立实现的范围、数据模型与启用前置条件。它不是对 Jeecg 服务端行为的推断，也不授权动态 DDL、任意 SQL 或脚本执行。

### 对标结论与当前边界

已观察到的 Jeecg 前端将“功能测试”按模型与页面主题路由到五类 AUTO 页面：默认单表、树表、ERP 主子表、内嵌子表和 Tab 主子表。各页呈现查询、受控工具栏、列表、表单、详情、导入导出等用户体验；表单资产管理还展示数据库导入、视图、授权、同步与代码生成等入口。

本系统已提供已发布 Definition 的沙箱 AUTO 功能测试：查询、工具栏、列表、新增/编辑弹窗与详情；按模型编译为 `SINGLE_DEFAULT` / `TREE_DEFAULT` / `MASTER_DETAIL_ERP|INNER|TAB`。它仍不是生产 AUTO Runtime：不访问业务动态表，不运行 Policy / Workflow，也不执行 Schema Plan。因此，界面、菜单和文档不得把现状描述为已具备 Jeecg 全能力。

### 能力范围矩阵

| 能力域 | 独立实现目标 | 需要持久化的受控事实 | 运行前置条件 | 状态 |
| --- | --- | --- | --- | --- |
| 表单资产管理 | Definition 检索、分类、创建、复制、归档、版本与设计入口 | Definition 状态、分类、审计与 Release 摘要 | 所有写入走 Draft 乐观锁 | 基础已完成；结构化编辑待完善 |
| 单表 AUTO | 发布版查询、列表、详情、创建、编辑、删除 | Release Query / List / Form / Detail / Action 配置 | 已验证 Release、受控存储、服务端策略 | 沙箱已启用；生产 MANAGED_TABLE Runtime 未启用 |
| 树 AUTO | 分页或懒加载树、添加子节点、排序与安全删除 | Tree Binding、父字段、排序字段、根值、删除策略 | 父子完整性、环检测、原子写入 | 沙箱已启用；生产 Runtime 未启用 |
| 主子 AUTO | ERP、内嵌、Tab 三种受控布局 | Master-detail Binding、子 Release Binding、显示布局 | 发布兼容性与主子事务 | 沙箱已启用；生产 Runtime 未启用 |
| 字典与引用 | 字典显示、下拉、受控关联选择 | Tenant-scoped Dictionary / Reference Registry | 固定 registry、服务端解析和权限过滤 | 未启用 |
| 权限策略 | 页面、动作、字段读写和行范围控制 | Typed Policy IR 与投影 | 每个服务端读写操作求值 | 未启用 |
| 导入导出 | 受控 CSV/XLSX 模板、校验、异步导出 | Import / Export Profile、Job、审计 | Release 字段与策略校验 | 未启用 |
| 表单分享 | 只读或受控提交的发布版访问 | Share Grant、期限、允许动作、受限受众 | 独立 token / 身份验证与服务端策略 | 未启用 |
| 数据库导入 | 平台拥有数据源的只读结构导入为 Draft | Approved Source Registry、Import Job、审计 | 管理员审批、schema/table allowlist | 未启用 |
| 代码生成 | 对已发布 Release 生成不可覆盖的预览 / ZIP | Generator Profile、Artifact、Release ID | 仅 immutable Release，人工下载 | 未启用 |
| 报表、图表、仪表盘 | Typed 数据集、聚合、图表和 Puck 仪表盘 | Dataset / Report / Chart / Dashboard / Share 发布快照 | 数据源 registry、策略、参数化查询 | 未启用 |

### 统一 Release 与运行时规则

1. **Release 是唯一运行事实。** AUTO Runtime、导出、导入模板、分享、报表与代码生成均只能解析不可变、checksum 已验证的 Release；运行过程绝不读取 Draft。
2. **Definition 是逻辑身份，Deployment 是物理绑定。** 即使将来采用 managed table，也不得用浏览器提交的名称、表名、连接串或 SQL 直接定位数据库对象。
3. **关联必须绑定兼容的目标 Release。** 当前 Draft-to-Draft target-field 校验只能作为编辑提示；上线前 Relation Binding 必须保存 `targetDefinitionId + targetReleaseId + targetField`，并在发布时检查 tenant、字段类型、唯一性和已部署 schema revision。
4. **服务端授权不可绕过。** 页面隐藏、Puck 控件隐藏和前端按钮 disabled 仅是展示；每次查询、读详情、创建、更新、删除、导入、导出和分享访问均由 authenticated server context、tenant scope 与编译后的 Policy 决定。
5. **所有运行时参数都是值，不能是语句。** 字段、排序字段、操作符、聚合函数、图表类型、组件类型和 action code 均由 Release allowlist 决定；客户端只能提交受限值，不能提交 SQL、表达式、URL、组件名、handler 或数据源。

### Managed Dynamic Table：待批准的生产存储设计

`GENERIC_RECORD` 继续只作为测试 sandbox。生产 AUTO CRUD 若要接近动态表体验，必须新建 `MANAGED_TABLE` 路径；该路径默认关闭，且本轮没有创建 migration、DDL worker 或执行端点。

**命名与隔离：**平台使用不可由用户配置的物理命名规则，例如 `onl_<tenant-safe-id>_<definition-stable-id>_r<schema-revision>`；Runtime 永不接收物理表名。每张平台管理表必须有平台生成主键、`tenant_id`、审计列与必要的软删除策略。所有查询还必须显式加服务端 tenant predicate；物理命名隔离不是授权替代。

**建议新增的持久化模型（须单独评审后才实现）：**

| 模型 | 最小字段 | 用途 |
| --- | --- | --- |
| `OnlineStorageBinding` | tenant、definition、storage kind、logical object key、active deployment | 将逻辑 Definition 映射到受控存储，而不是保存自由表名 |
| `OnlineSchemaDeployment` | tenant、definition、release、schema revision、target fingerprint、state、environment、physical object key、approved/applied/failed audit | 一条 Release 在一个环境中的不可变部署证据 |
| `OnlineDeploymentAttempt` | deployment、attempt no、worker identity、lock token、started/ended、result code、sanitized log | 保留重试、失败恢复和审计，不存 SQL 文本 |
| `OnlineReferenceBinding` | source release/field、target definition/release/field、lookup profile | 固化跨 Definition 引用版本，不依赖目标 Draft |
| `OnlinePolicyProjection` | revision、typed policy kind、subject、rule | 由 Policy IR 同步出的可审计投影，不能存表达式 |
| `OnlineImportProfile` / `OnlineExportProfile` | release、允许字段、格式、限制、审计配置 | 定义固定模板和数据边界 |

**仅允许的初始前向变更：**创建空 managed table、增加可空字段、增加非唯一索引，以及经明确审批后增加有回填策略的必填字段。字段删除、类型缩窄、唯一约束、默认值语义变更、关系约束变更、物理表复制、rename、drop 与 force-rebuild 都必须先归类为不可自动执行；初期应拒绝而非尝试“智能同步”。

**受信部署流程：**

```text
Draft 保存 → 严格编译/校验 → Semantic Schema Plan → 独立审批
→ 发布候选 Release → 后台受信 worker 取得数据库锁与部署租约
→ 参数化且由平台生成的 DDL adapter 执行 → 部署结果审计
→ schema revision 与 active deployment 原子切换 → AUTO Runtime 可解析
```

浏览器只可查看计划、审批状态和已脱敏的部署结果；不能调用 apply、传入 SQL 或指定表名。worker 必须与用户请求进程分离、使用最低权限数据库账号、采用环境 allowlist、幂等锁、超时与故障状态。回滚只允许切回仍兼容且仍存在的先前 Deployment；不可逆变更失败后进入 `FAILED / RECOVERY_REQUIRED`，禁止自动 drop 或覆盖数据。

### AUTO Runtime 编译与路由

产品层只暴露稳定的 Definition 路由，例如 `/admin/infra/online-runtime/[definitionCode]`；服务器解析当前已部署 Release 并编译 `runtime.kind`，页面不能选择任意组件或物理表：

| Runtime kind | Release 条件 | 固定页面组成 |
| --- | --- | --- |
| `SINGLE_DEFAULT` | `SINGLE + MANAGED_TABLE + deployed` | Query Form、Action Bar、List、Create/Edit Dialog、Detail |
| `TREE_DEFAULT` | `TREE + MANAGED_TABLE + deployed` | Query Form、Tree List、Add Child、Detail、受控删除 |
| `MASTER_DETAIL_ERP` | `MASTER_DETAIL + all children deployed` | 主表列表、选中主记录的只读/受控子表区域、原子编辑 Dialog |
| `MASTER_DETAIL_INNER` | 同上 | 主表 List 的单行展开子表区域 |
| `MASTER_DETAIL_TAB` | 同上 | 主表 Create/Edit/Detail 中的受控子表 Tabs |

`Online Test` 的 Definition deep-link `?definition=<code>` 会转到该 Definition 的功能测试 Runtime。资产列表与设计页的「功能测试」进入 `/admin/infra/online-runtime/[definitionCode]`，不再进入 AUTO 报表 SQL 页。生产 `MANAGED_TABLE` Runtime 仍未替换沙箱存储。

### Policy DSL 与受控动作

现有 `policy_json` / `OnlinePolicy` 不能视为已执行授权。后续仅接受以下无表达式的 typed policy：

- `PAGE_ACCESS`：固定 permission code 与 authenticated tenant membership。
- `ACTION_ACCESS`：固定 built-in action code，允许的 role / tenant package / owner scope。
- `FIELD_ACCESS`：对 Release field 的 `READ`、`WRITE`、`HIDDEN` 枚举决定。
- `ROW_SCOPE`：仅内置 `TENANT_ALL`、`CREATED_BY_SELF`、`DEPARTMENT_SUBTREE`、`ASSIGNED_TO_SELF` 等注册 scope，且由服务器转换为参数化查询。

Action 仅包括创建、更新、删除、批量删除、导入、导出、详情和经过注册的工作流提交。`handlerKey` 仅能引用平台发布的 server action registry；不得由 Draft 新增任意函数、HTTP 地址、Java 类、JavaScript 或 SQL。

### 表单结构化编辑与校验补齐

在启用 production runtime 前，管理工作区需将当前高级 JSON 覆盖的能力补成受控编辑器，并继续把结果写回 `model_json + interaction_json` 后同步投影：

- 字段：默认值、长度、decimal 精度、nullable、identity、系统字段、备注、顺序、列表宽度、表单 span、详情 formatter。
- 查询：是否启用、固定 operator、合法 query widget、默认值、排序白名单和默认排序。
- 校验：必填、长度、数值范围、注册 rule key、dictionary/reference binding；校验器同时用于服务端 command schema 和前端提示。
- 索引与关系：字段顺序、唯一性、on-delete、发布版目标绑定；编辑期间允许显示诊断，但发布必须 release-pin。
- 模型语义：Tree 的 parent/sort/root；Master-detail 的 child release binding 与 `ERP / INNER / TAB` 枚举布局。
- 动作与页面：固定 placement/order/enabled 和 Puck allowlist；嵌套容器要么完整以递归 schema 支持，要么在编辑器与编译器中一起拒绝。

旧 Draft 解析应验证 `relations`、`settings`、`actions` 等新增默认值可被安全补齐；任何不能归一化的历史数据应提示迁移诊断，不能静默放宽 strict schema。

### 报表、图表和仪表盘的独立后续域

Jeecg 的 `onl_cgreport_*`、`onl_graphreport_*`、`onl_drag_*` 代表独立分析产品，不应把任意 SQL 或数据源能力塞入表单 Runtime。它们应在 CRUD / policy 稳定后以以下顺序建设：

1. `Dataset`：只引用已发布且已部署的 Definition Release 或平台 curated dataset；字段、关联、可用维度/指标和 row policy 全部固定。
2. `Report`：固定 select fields、allowlisted filter/operator、group-by、aggregate、sort 和分页上限；服务端以 Kysely 生成参数化查询。
3. `Chart`：固定 chart type、dimension、metric、aggregate、palette 和上限；禁止脚本 formatter。
4. `Dashboard`：复用 OnlineView/Puck 的组件 allowlist；组件仅绑定已发布 Dataset/Report/Chart 的 ID，不能填写 endpoint 或任意数据源。
5. `Share`：发布版 dashboard/form 的受限 grant，含到期时间、访问主体、允许动作、撤销与审计；不生成匿名永久 URL。

### 分阶段交付和完成定义

| 阶段 | 交付物 | 完成定义 |
| --- | --- | --- |
| A：资产与建模体验 | 完整结构化编辑器、copy/archive、深链 sandbox 选择修复、字典 registry 设计 | 所有可见配置都能保存为 Draft、验证、发布并进入 Release 快照 |
| B：部署治理（需明确批准） | Managed Table 迁移、Deployment 元数据、受信 worker、审批与审计 | 无浏览器 DDL；只能从审批 Release 部署可允许的前向变更 |
| C：SINGLE AUTO | Release resolver、Policy evaluator、query/list/form/detail、生产 CRUD | 每个请求验证 Release、deployment、tenant、policy；无 Draft / raw SQL 读取 |
| D：结构模型 | Tree、ERP、Inner、Tab 和原子主子写入 | 环检测、外键完整性、发布兼容、事务和删除策略均被服务端验证 |
| E：数据交换与治理 | Import/export、sharing、workflow registry、generator artifact | 所有操作按 Release / policy / audit 执行，无自由 URL/脚本/连接 |
| F：分析产品 | Dataset、report、chart、dashboard、share | 仅 typed semantic data model 和 allowlisted Puck 组件可运行 |

在 A 阶段完成前不得宣称页面级表单设计已全功能；在 B 与 C 完成前不得宣称具有 Jeecg 式动态表 AUTO Runtime；在 F 完成前不得宣称报表、图表和仪表盘能力已对标完成。

### 永久禁止项

- 用户编写或持久化 JavaScript、Java、SQL、SpEL/任意表达式、HTML、`v-html`、任意 URL、动态组件名、任意数据源或连接串。
- 前端触发 DDL、raw SQL、force sync、drop/rebuild、物理表 copy/drop 或跳过审批的 schema 变更。
- 用前端隐藏控件代替服务端授权，或从浏览器传 tenant / role / data scope 作为可信上下文。
- 为了“兼容”而让 Release Runtime 回读 Draft、目标 Definition 当前 Draft，或在未部署 schema 上执行生产 CRUD。
