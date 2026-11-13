# 原型与交互规范: 客户端构建门禁（Expo 导出）+ Expo SDK 升级路径评估

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`client-build-gate`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 门禁输出

```
不涉及（CLI 文本）
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 与既有门禁一致：退出码即结论，无交互

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：不涉及。
- 空数据：无客户端 → 跳过并打印原因，exit 0。
- 出错：导出失败 → exit 非 0 并打印日志尾部，不静默通过。
- 成功：打印耗时与产物数量，exit 0。
