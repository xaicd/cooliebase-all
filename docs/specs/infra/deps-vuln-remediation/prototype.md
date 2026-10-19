# 原型与交互规范: 依赖漏洞治理：生产树止血 + 依赖 CVE 门禁 + dev 树欠债冻结

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`deps-vuln-remediation`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 门禁证据产物

```
不涉及（JSON 产物 docs/architecture/artifacts/）
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 与既有门禁一致：命令行退出码即结论，不做交互式确认

## 3. 状态与空态处理 (States & Degraded UI)

- 加载中：不涉及。
- 空数据：无漏洞时输出 0 并 exit 0。
- 出错：pnpm audit 不可用/无网络时明确报错，不得静默当作 0 漏洞通过。
- 成功：输出生产/dev 分层计数与基线比对结果。
