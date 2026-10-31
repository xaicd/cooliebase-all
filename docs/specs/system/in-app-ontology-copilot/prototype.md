# 原型与交互规范: 底座内嵌活体本体自省与AI Copilot抽屉

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`system` | 规格标识：`in-app-ontology-copilot`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 全局布局侧边栏 / (admin-pages)/layout.tsx

```
[Header] -> [Main Content] -> [Right Floating Copilot Button & Drawer]
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 点击右下角 Copilot 浮标展开抽屉，输入自然语言查数，结果以表格/指标卡片呈现，点击关闭按钮或按 ESC 折叠抽屉。

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：抽屉内展示骨架屏波浪动效。
- 空数据：提示未查到相关领域数据，提供示例提问提示词。
- 出错：明确展示错误原因并允许一键重试。
