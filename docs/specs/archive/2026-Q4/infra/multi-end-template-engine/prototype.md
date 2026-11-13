# 原型与交互规范: 对标 PagePlug 与商业低代码平台：多端模版源头与响应式区块画布升级

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`multi-end-template-engine`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### UniversalSchemaCanvas v2 (多区块+看板+联动表单)

```
[顶部指标卡组 StatMetrics: 总记录 / 正常态 / 待处理 / 合计金额] -> [可折叠可视化图表区 ChartBlock] -> [工具栏: 搜索过滤 + 表格/看板(Kanban)视图切换 + 新建] -> [主视图: Table 或按状态分列 Kanban] -> [联动表单 Modal: 根据 {{ $form.xxx }} 实时显隐字段]
```

### Online 多端双视口设计器 (/admin/online/[code]/designer)

```
[顶栏: 模型JSON | 交互配置 | 多端画布与联动预览 (PC 1440px / 手机小程序 375px 切换)] -> [左侧: 区块与20+控件库] + [中间: 实时交互画布] + [右侧: 字段属性 & {{visibleOn}} 联动规则配置]
```

### Expo 模块化多端样板 (clients/expo)

```
[顶栏动态品牌 + 渠道标识] -> [轮播 BannerBlock + 宫格导航 GridNavBlock] -> [modules/mall 双列商品瀑布流 & 规格下单 | modules/member 会员中心 & Schema 联动扩展表单]
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 在画布点击『看板视图』自动按状态/分类字段分组为多列卡片；在弹窗表单中修改触发字段值，依赖该字段的 visibleOn/disabledOn 控件毫秒级显隐切换。
* 在 Online 设计器点击『手机/小程序视口 (375px)』，画布立即切换为移动端外框并实时渲染移动端区块与表单。
* 在孵化命令传入 `--profile vertical --bundle member` 或 `--clients` 时，自动裁剪对应后端与客户端目录。

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：指标卡、图表与表格/看板区域局部脉冲骨架屏，不阻塞顶栏。
- 空数据：表格与看板列展示结构化空态与快捷新建引导，保留筛选栏。
- 出错：展示错误原因与一键重试按钮；表达式语法错误时静默降级并在设计器高亮提示。
- 无权限：受权限码与 Action 条件表达式双重守卫控制。
