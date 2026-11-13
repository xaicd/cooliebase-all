# 原型与交互规范: 低代码 MCP 写类工具（B1 二期）：scaffold.plan / codegen.preview

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`mcp-write-tools`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 无头消费面

```
不涉及
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 保持既有交互不变：工具调用仍为 MCP stdio 请求-应答，不引入流式或后台任务语义

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：不涉及（stdio 同步应答）。
- 空数据：计划为空时返回空 plannedWrites 并说明原因，不报错。
- 出错：未登记域/越权路径返回明确错误码与原因，不静默兜底。
- 成功：返回 plannedWrites + followUpGates + manualSteps 三段结构。
