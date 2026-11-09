# CoolieBase 低代码多端系统开发说明书（面向 27B 本地模型与初级开发者）

> **适用读者**：27B 本地大模型（如 Qwen2.5-27B / Gemma-2-27B / DeepSeek-Distill-27B）、Coolie工坊自动化流水线、以及初级业务研发工程师。
> **核心原则**：像使用商业低代码平台（PagePlug / 宜搭 / NocoBase）一样，**不手写重复的 CRUD 样板、不手写底层 8 大审计列、不改核心框架代码**，对照本说明书通过 **「声明式 JSON + 5 步标准命令」** 完成从全站换肤、建表、多区块联动页面、状态机到移动端/小程序的完整业务系统开发。

---

## 目录

1. [全景速览：开发一个新业务系统只需改哪 3 处？](#1-全景速览开发一个新业务系统只需改哪-3-处)
2. [第 1 步：全站品牌、门户与多端坐标配置（79 项模板变量）](#2-第-1-步全站品牌门户与多端坐标配置79-项模板变量)
3. [第 2 步：声明新业务域与数据表（极简 JSON 自动展开全栈代码）](#3-第-2-步声明新业务域与数据表极简-json-自动展开全栈代码)
4. [第 3 步：配置多端页面区块与 `{{ $form.xxx }}` 表单联动（PageBlockDSL v2）](#4-第-3-步配置多端页面区块与--formxxx--表单联动pageblockdsl-v2)
5. [第 4 步：编写核心业务规则（状态机与跨模块 Facade 调用速查表）](#5-第-4-步编写核心业务规则状态机与跨模块-facade-调用速查表)
6. [第 5 步：移动端与小程序（`clients/expo`）模块挂载](#6-第-5-步移动端与小程序clientsexpo模块挂载)
7. [端到端完整案例：10 分钟开发「宠爱有家智慧动物医院系统」](#7-端到端完整案例10-分钟开发宠爱有家智慧动物医院系统)

---

## 1. 全景速览：开发一个新业务系统只需改哪 3 处？

在 CoolieBase 蓝图底座中，85% 的通用能力（登录鉴权、RBAC 权限、多租户隔离、聚合支付、工作流、通用表格/看板画布、移动端渲染器）已经内置。开发一个全新业务系统，你**只需要聚焦以下 3 件事**：

| 步骤 | 你需要编写的声明文件 | 执行的自动化引擎命令 | 引擎自动为你生成的产物 |
| :--- | :--- | :--- | :--- |
| **① 定品牌与行业门户** | 填写 `variables` 变量字典（基于根目录 `blueprint.template.json`） | `node scripts/blueprint-engine.cjs render` | 自动重写 `project-profile.json`、`clients/expo/app.json`、`.env.example`，全站首页、登录页、C端门户与移动端同步换肤 |
| **② 建业务表与全栈插件** | 编写极简业务域蓝图 `<domain>.blueprint.json`（只写业务字段与控件类型） | `node scripts/blueprint-engine.cjs compile-domain --file <domain>.blueprint.json --write` 随后 `pnpm run domain:new <domain>` | 自动补齐 `id` 与 6 大多租户审计列，生成 SQL 迁移、Repository、Service、Zod 校验器、BFF 路由、RBAC 权限与单测 |
| **③ 配多区块画布与状态机** | 在 `<domain>.blueprint.json` 中声明 `blocks[]`、`visibleOn` 联动公式与 `stateMachine` | 自动同步至 `PageBlockDSL v2` 与 `defineStateMachine` | PC 管理端自动渲染顶部 KPI 指标卡、分布图表、表格/看板视图切换与联动弹窗；移动端同步渲染轮播、宫格与表单 |

---

## 2. 第 1 步：全站品牌、门户与多端坐标配置（79 项模板变量）

根目录的 `blueprint.template.json` 定义了新业务涉及的 **8 大变量域（共 79 个标准 `{{VAR}}` 变量）**。

### 2.1 快速查看所有可用变量
```bash
node scripts/blueprint-engine.cjs schema --compact
```

### 2.2 5 套内置行业预设词包（`INDUSTRY_PRESET`）
只需设置 `INDUSTRY_PRESET`，全站 C 端门户（`/2c`、`/portal`）的分类、精选服务卡片、购物车名称以及首页 15 大业务域的行业术语会自动切换：

| `INDUSTRY_PRESET` 取值 | 适用业务场景 | C 端门户默认标题 | 购物车/清单按钮名 | 主行动按钮文案 |
| :--- | :--- | :--- | :--- | :--- |
| `general-enterprise` | 通用企业数字化中台 / SaaS | 数字化精选服务门户 | 选购清单 | 立即选购 |
| `retail-commerce` | 新零售商城 / 社区团购 / 跨境电商 | 优品生活全渠道商城 | 购物车 | 立即抢购 |
| `smart-healthcare` | 智慧医院 / 宠物诊所 / 口腔体检预约 | 智慧医疗与健康预约中心 | 预约清单 | 立即预约 |
| `digital-publishing` | 在线教育 / 知识付费 / 数字阅读 | 数字化知识与典藏书城 | 阅读车 | 解锁全本 |
| `smart-manufacturing` | 智能制造 / 工业品备件 / 供应链协同 | 智能制造与工业品协同门户 | 申购单 | 加入申购 |

### 2.3 一键渲染全栈变量命令
```bash
node scripts/blueprint-engine.cjs render \
  --preset smart-healthcare \
  --set PROJECT_NAME=pet-care-pro \
  --set PLATFORM_TITLE="宠爱有家智慧动物医院" \
  --set SHORT_NAME="宠爱医疗" \
  --set BRAND_MARK="宠" \
  --set BRAND_PRIMARY_COLOR="#0d9488" \
  --set PORTAL_TITLE="宠爱线上预约门户" \
  --set IOS_BUNDLE_ID="com.petcare.app" \
  --set ANDROID_PACKAGE="com.petcare.app"
```

---

## 3. 第 2 步：声明新业务域与数据表（极简 JSON 自动展开全栈代码）

初级开发者或 27B 模型**切勿手写 SQL DDL 或手写几百行 `CodegenConfig`**。只需编写一份极简 JSON，由 `scripts/blueprint-engine.cjs compile-domain` 自动补齐主键 `id` 与 6 大强制审计底座列（`tenant_id`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`）。

### 3.1 22 种标准字段控件（`widget`）速查表

在定义字段 `fields[]` 时，指定 `widget` 即可同时决定**数据库列类型**与**前后端表单渲染控件**：

| 分类 | `widget` 标识 | 含义与渲染效果 | 自动映射 DB 类型 | 附加属性 |
| :--- | :--- | :--- | :---: | :--- |
| **文本类** | `text` | 单行文本框 | `varchar` | `query: "LIKE"` 支持模糊搜索 |
| | `textarea` | 多行文本域 | `text` | — |
| | `rich_text` | 富文本编辑器 | `text` | — |
| **数值与金额** | `number` | 整数输入框 | `int` | `query: "="` |
| | `currency` | 金额输入框（带 `¥` 前缀与千分位） | `int` | 建议存分（`price_cents`） |
| | `percent` | 百分比输入框（带 `%` 后缀） | `int` | — |
| | `rate` | 1~5 星级评分组件 | `int` | — |
| | `slider` | 进度滑动条（0~100） | `int` | — |
| **选择与字典** | `select` | 下拉选择框 | `varchar` | `options: ["选项A", "选项B"]` |
| | `radio` | 单选按钮组 | `varchar` | `options: ["选项A", "选项B"]` |
| | `checkbox` | 多选复选框组 | `varchar` | `options: ["标签1", "标签2"]` |
| | `switch` | 布尔开关（是/否） | `int` | `1` 开启 / `0` 关闭 |
| | `cascader` | 多级级联选择器 | `varchar` | — |
| | `tree_select` | 树形下拉选择器 | `varchar` | — |
| **日期与时间** | `date` | 日期选择器 (`YYYY-MM-DD`) | `timestamp` | `query: "BETWEEN"` |
| | `datetime` | 日期时间选择器 | `timestamp` | — |
| **组织与媒体** | `user_picker` | 用户选择器 | `varchar` | — |
| | `dept_picker` | 部门选择器 | `varchar` | — |
| | `image` | 图片上传与缩略图预览 | `varchar` | — |
| | `file` | 附件上传 | `varchar` | — |
| | `color` | 颜色拾取器 (`#RRGGBB`) | `varchar` | — |
| | `signature` | 手写电子签名板 | `text` | — |
| **复杂结构** | `sub_table` | 主子表内嵌明细表格 | `text` | `subFields: [...]` |

---

## 4. 第 3 步：配置多端页面区块与 `{{ $form.xxx }}` 表单联动（PageBlockDSL v2）

对标 PagePlug 与 Formily，每个实体页面不仅有表格，还可以声明**多端区块 (`blocks[]`)**、**视图模式 (`layoutMode`)** 与**字段级响应式联动公式**。

### 4.1 页面视图模式 (`layoutMode`)
- `"table"`（默认）：顶部统计指标卡 + 搜索栏 + 标准 CRUD 数据表；
- `"kanban"`：支持「表格视图 / 状态看板视图」一键切换，自动按状态或分类字段分列展示卡片；
- `"dashboard"`：默认展开顶部 KPI 指标卡与可视化分布图表面板。

### 4.2 页面区块类型 (`blocks[]`)
```json
"blocks": [
  {
    "id": "top_kpi",
    "type": "stat_metrics",
    "title": "核心经营指标",
    "surface": "all",
    "metrics": [
      { "code": "total", "label": "总预约数", "aggregate": "count", "tone": "indigo" },
      { "code": "revenue", "label": "预计营收(分)", "aggregate": "sum", "field": "fee_cents", "tone": "emerald" }
    ]
  },
  {
    "id": "type_chart",
    "type": "chart",
    "title": "业务类型分布",
    "chartKind": "bar",
    "dimensionField": "service_type",
    "metricField": "fee_cents",
    "surface": "pc"
  },
  {
    "id": "mobile_hero",
    "type": "banner",
    "surface": "mobile",
    "items": [
      { "title": "新客首诊 8 折特惠", "subtitle": "专业医师全天候守护" }
    ]
  }
]
```

### 4.3 表单响应式联动公式（`visibleOn` / `disabledOn` / `requiredOn`）
使用零 `eval` 安全沙箱语法 `{{ 表达式 }}`，前后端校验器会自动同步求值（当字段因 `visibleOn` 隐藏时，后端自动跳过其必填校验；当 `requiredOn` 为真时，后端强制校验必填）：

| 联动场景 | 属性名 | 标准公式写法示例 |
| :--- | :--- | :--- |
| **当选某项时才显示字段** | `visibleOn` | `"{{ $form.service_type === '急诊手术' }}"` |
| **数值超阈值时要求必填** | `requiredOn` | `"{{ $form.fee_cents >= 50000 }}"` |
| **多条件组合显隐** | `visibleOn` | `"{{ $form.member_level === 'VIP' && $form.fee_cents > 10000 }}"` |
| **包含某标签时显示** | `visibleOn` | `"{{ $form.tags.includes('传染病隔离') }}"` |
| **根据状态锁定不可改** | `disabledOn` | `"{{ $form.status === 2 }}"` |

---

## 5. 第 4 步：编写核心业务规则（状态机与跨模块 Facade 调用速查表）

当生成的标准 CRUD 需要叠加业务状态流转或调用其他域（如支付、库存、会员）时，**严禁直接 `import` 其他域的 Service 或手写 `if/else` 状态判断**，直接复制以下标准范式：

### 5.1 声明式状态机范式（`defineStateMachine`）
在 `packages/plugins/plugin-<domain>/backend/services/` 中使用状态机原语：
```ts
import { defineStateMachine } from "@/shared/backend/lib/state-machine"

export const appointmentStateMachine = defineStateMachine({
  name: "pet_appointment.status",
  initial: "PENDING",
  transitions: [
    { name: "confirm", from: ["PENDING"], to: "CONFIRMED" },
    { name: "complete", from: ["CONFIRMED"], to: "COMPLETED" },
    { name: "cancel", from: ["PENDING", "CONFIRMED"], to: "CANCELLED" },
  ],
})
```

### 5.2 跨业务域 Facade 标准调用速查表
所有跨域调用统一通过各域 `contract/*.facade.ts` 暴露的门面接口调用：

| 目标业务域 | 标准导入路径 | 常用方法与用途 |
| :--- | :--- | :--- |
| **仓储库存 (`wms`)** | `@/plugins/plugin-wms/contract/wms.facade` | `wmsFacade.lockStock({ inventoryId, amount })`（条件扣减预占库存，返回 0 行表示库存不足） |
| **聚合支付 (`pay`)** | `@/plugins/plugin-pay/contract/pay.facade` | 创建支付单、处理支付回调幂等更新 |
| **客户会员 (`member`)** | `@/plugins/plugin-member/contract/member.facade` | 查询会员档案、等级折扣与积分变动 |
| **数据字典 (`system`)** | `@/domains/system/contract/system.facade` | `systemPublicFacade.getDictDataByType(dictType)` 获取字典项 |

---

## 6. 第 5 步：移动端与小程序（`clients/expo`）模块挂载

客户端遵循严格的 `clients/expo/src/{app,shared,modules/<domain>/{api,models,pages,components}}` 结构：
1. 在 `clients/expo/src/modules/<domain>/` 下创建 `api/index.ts`、`models/index.ts`、`pages/`、`components/`；
2. 页面内直接使用 `SchemaFieldRenderer` 与 `MobileBlockRenderer` 渲染服务端下发的 `PageBlockDSL v2`（自动支持移动端轮播 `banner`、宫格导航 `grid_nav`、统计卡 `stat_metrics` 及 `visibleOn` 表单联动）；
3. 在 `clients/expo/src/modules/index.ts` 的 `CLIENT_DOMAIN_MODULES` 中登记该模块即可。

---

## 7. 端到端完整案例：10 分钟开发「宠爱有家智慧动物医院系统」

无论你是 **27B 本地模型** 还是 **初级开发工程师**，只需按顺序执行以下 3 步：

### Step A：编写业务蓝图文件 `pet-clinic.blueprint.json`
```json
{
  "variables": {
    "PROJECT_NAME": "pet-care-pro",
    "PLATFORM_TITLE": "宠爱有家智慧动物医院",
    "SHORT_NAME": "宠爱医疗",
    "BRAND_MARK": "宠",
    "BRAND_PRIMARY_COLOR": "#0d9488",
    "INDUSTRY_PRESET": "smart-healthcare",
    "PORTAL_TITLE": "宠爱线上预约门户",
    "PORTAL_CART_LABEL": "预约单",
    "PORTAL_PRIMARY_CTA": "立即预约"
  },
  "domain": "pet",
  "title": "宠物诊疗管理",
  "entities": [
    {
      "table": "pet_appointment",
      "className": "PetAppointment",
      "title": "宠物挂号预约单",
      "layoutMode": "kanban",
      "fields": [
        { "name": "pet_name", "label": "宠物昵称", "widget": "text", "required": true, "query": "LIKE" },
        { "name": "species", "label": "宠物品种", "widget": "select", "options": ["猫咪", "犬类", "异宠"], "query": "=" },
        { "name": "service_type", "label": "就诊类型", "widget": "radio", "options": ["常规体检", "疫苗接种", "急诊手术"], "required": true },
        {
          "name": "anesthesia_consent_no",
          "label": "麻醉知情同意书编号",
          "widget": "text",
          "visibleOn": "{{ $form.service_type === '急诊手术' }}",
          "requiredOn": "{{ $form.service_type === '急诊手术' }}"
        },
        { "name": "fee_cents", "label": "预计诊疗费(分)", "widget": "currency", "required": true },
        { "name": "appointment_time", "label": "预约到院时间", "widget": "datetime", "required": true },
        { "name": "status", "label": "预约状态", "widget": "number", "query": "=" }
      ],
      "blocks": [
        { "id": "pet_kpi", "type": "stat_metrics", "title": "今日门诊核心指标", "surface": "all" },
        { "id": "pet_chart", "type": "chart", "title": "就诊类型分布", "chartKind": "bar", "dimensionField": "service_type", "metricField": "fee_cents", "surface": "pc" }
      ],
      "stateMachine": {
        "initial": "PENDING",
        "transitions": [
          { "name": "confirm", "from": ["PENDING"], "to": "CONFIRMED" },
          { "name": "complete", "from": ["CONFIRMED"], "to": "COMPLETED" },
          { "name": "cancel", "from": ["PENDING", "CONFIRMED"], "to": "CANCELLED" }
        ]
      }
    }
  ]
}
```

### Step B：运行蓝图编译器生成表元数据与多端配置
```bash
# 预览编译产物（表结构、PageBlockDSL v2 画布与状态机定义）
node scripts/blueprint-engine.cjs compile-domain --file pet-clinic.blueprint.json

# 落盘生成 scripts/data/pet-tables.ts 并渲染全站品牌变量（加 --write）
node scripts/blueprint-engine.cjs compile-domain --file pet-clinic.blueprint.json --write
```

### Step C：一键生成全栈插件并启动验证
```bash
# 自动生成建表迁移 + Repository/Service/Validator/Routes/Pages + 注册第一方插件
pnpm run domain:new pet

# 运行全量质量门禁与构建验证
pnpm run check
```

---

## 9. 通用蓝图底座 4 大业务原语（面向应届生与 27B 本地模型零手写交付任意领域系统）

为了让普通刚毕业的大学生与本地 27B 模型（`qwen-local`）无需手写复杂 Service 状态守卫、跨表转化逻辑与 React 操作按钮即可构建任意领域系统（如办公 OA、CRM、数字内容平台、医院 HIS、物业工单等），[`scripts/blueprint-engine.cjs`](../../scripts/blueprint-engine.cjs) 与 [`codegen-templates/`](../../packages/domains/infra/backend/services/codegen-templates/) 内置了 **4 大通用全栈展开原语**：

1. **通用状态机全栈展开 (`stateMachine`)**：
   - 蓝图中声明 `stateMachine: { initial, transitions: [{ name, label, from, to }] }` 后，编译器自动补齐 `status` 枚举列，并在生成的 `Service` 中注入 `transition(id, action)` 状态守卫、在 `Route` 生成 `POST /.../transition`、在 `ListPage` 表格操作列按当前行状态动态渲染业务流转按钮（如【审批通过】【驳回】【发布上架】）。
2. **通用跨单据一键转化原语 (`convertActions`)**：
   - 蓝图中声明 `convertActions: [{ name, label, targetClassName, whenStatus, nextStatus, fieldMap }]` 后，自动生成跨单据字段映射转化方法 `Service.convert(id, actionName)` 与前端行级转化按钮（如 CRM 线索一键转客户、OA 审批单转归档单）。
3. **通用表格/看板双视图切换 (`layoutMode: "table" | "kanban"`)**：
   - 列表页原生内置「切换看板 / 切换表格」视图开关（`data-testid="<kebab>-view-toggle"`）。
4. **27B 口语同义词防呆自愈诊断器 (`diagnoseAndHealBlueprint`)**：
   - 自动将非标准控件名（如 `money`/`price` ➔ `currency`、`dropdown`/`enum` ➔ `select`、`boolean`/`toggle` ➔ `switch`、`input` ➔ `text`）自愈为 22 种标准商业控件，并自动补齐缺失的 `<domain>_` 表名前缀与状态机枚举列。
