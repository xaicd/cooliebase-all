# 原型与交互规范: 测试之间通过仓库共享文件互相可见，导致 test:clean 间歇随机变红

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`test-shared-file-isolation`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### Vitest 并行门禁隔离沙箱诊断输出

```
为 spawn 门禁脚本的单元测试提供临时目录隔离（拷可变件、软链只读件），消除并发读写真仓根文件的竞态
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 测试调用 createIsolatedRoot 构造含软链只读目录与独立可变文件的临时工作区，传入 --root 环境变量或 cwd 执行门禁断言，结束后自动清理

## 3. 状态与空态处理 (States & Degraded UI)

- isolated-workspace-created（临时根初始化完成）
- mutated-under-test（测试注入坏数据验证门禁变红）
- cleaned-up（测试结束清理临时目录，主仓零污染）
