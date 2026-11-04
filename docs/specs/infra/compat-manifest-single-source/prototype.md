# 原型与交互规范: compat-manifest 单一真源：把 deployment/apiPartitions/harness 声明并入真源并加机检堵住静默丢失

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`compat-manifest-single-source`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 不适用（无 UI）

```
不适用
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 不适用（无 UI）
* 命令行侧的防误触守卫：`pnpm surface:sync` 在回写前比对顶层键集合，
  生成物持有真源没有的键时**拒绝写入**并报错（需 `--force` 才丢弃）；
  `pnpm compat:check` 对「必备声明缺失」与「镜像与真源漂移」一律判红。

## 3. 状态与空态处理 (States & Degraded UI)

- 不适用（无 UI）
- 门禁侧降级：必备声明缺失 → 门禁红并打印缺失节名；生成物持有独有内容 →
  回写被拒并打印独有键名，便于人工把内容并回真源。
