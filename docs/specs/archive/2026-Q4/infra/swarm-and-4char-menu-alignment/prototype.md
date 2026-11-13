# 原型与交互规范: SWARM多智能体协同法典、8动词service.sh与4字菜单门禁对齐

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`swarm-and-4char-menu-alignment`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 管理后台左侧导航栏 (/admin/*)

```
[Logo] -> [一级目录 <=4字] -> [二级菜单 <=4字] -> [主工作区: 2字操作按钮 查询/重置/新增/编辑/删除]
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* CLI 交互：bash scripts/service.sh --help 输出 8 动词用法并 exit 0；pnpm run admin:nav:check 校验生成物一致性与 <=4 字棘轮。

## 3. 状态与空态处理 (States & Degraded UI)

- service status Running：PID 存活且端口监听正常。
- service status Stopped：无残留僵尸进程。
- menu-title-guard Pass：0 新增超 4 字可见菜单。
- menu-title-guard Fail：检测到未在冻结基线中的 >4 字菜单，输出修复指引并 exit 1。
