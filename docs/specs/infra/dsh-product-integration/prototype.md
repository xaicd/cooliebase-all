# 原型与交互规范: 产物并存两种界面：业务管理 UI + dsh 对话 UI（通过 MCP 打通）

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`dsh-product-integration`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### /admin/**（现有）

```
不变
```

### dsh Web UI（外部）

```
dsh 自带界面，本仓只负责装配与入口链接
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 沿用现有交互；dsh 侧交互由 dsh 负责

## 3. 状态与空态处理 (States & Degraded UI)

- 沿用现有状态；dsh 未启动时对话入口显示「未启用」而不是报错
