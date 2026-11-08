# 原型与交互规范: G1 需求门禁 · EARS 需求基线（Spec-Kit SRS）

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`system` | 规格标识：`g1-requirements-baseline`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 纯需求工程无页面

```
无
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 无前端交互，交付物为需求基线文档与门禁退出码凭证

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：不适用
- 空数据：无实测数据的 NFR 指标保持严格留空
- 出错：门禁检出占位符或缺项时退出码非 0 阻断流水线
- 成功：exit=0 且 list 状态 PLAN_APPROVED
