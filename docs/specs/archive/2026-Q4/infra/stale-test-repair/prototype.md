# 原型与交互规范: 修复 6 条既存测试失败：退役脚本引用 + 过期断言

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`stale-test-repair`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 测试报告

```
不涉及
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 保持既有测试运行方式不变（vitest，无交互）

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：不涉及。
- 空数据：不适用。
- 出错：断言失败时打印实际值，便于定位。
- 成功：两个文件全绿，全量 failed = 0。
