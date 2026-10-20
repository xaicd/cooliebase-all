# 原型与交互规范: 生成校验器字段类型与表元数据相悖导致 HTTP 边界拒绝合法输入

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`validator-type-drift`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 故障修复面

```
无变更/微调
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 保持既有交互模式不变

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：正常展示。
- 空数据：正常展示。
- 出错：正常展示，具备明确指引。
- 成功：正常展示。
