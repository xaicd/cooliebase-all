# 原型与交互规范: 依赖 CVE 门禁分层判据改为从 pnpm-lock.yaml 离线推导（消除多父级包导致的 5/5/6 不确定）

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`deps-audit-tier-determinism`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 门禁输出

```
不涉及（CLI 文本 + JSON）
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 与既有门禁一致：退出码即结论，无交互

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：不涉及。
- 空数据：锁文件解析不到 host 可达集合时 fail-loud，不静默降级。
- 出错：锁文件缺失/不可读时明确报错。
- 成功：分层计数确定可复现，且与锚点断言一致。
