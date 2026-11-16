# 领域百科：pms (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-pms/`](../../../packages/plugins/plugin-pms)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3229 | **上游环境变量**：`COOLIEBASE_DOMAIN_PMS_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（项目管理域：项目台账、里程碑节点、任务工时）
- **对外 HTTP API 前缀**：`/api/v1/admin/pms`
- **默认鉴权策略**：受众 `admin`，多租户策略 `required`

---

## 二、 跨域 Facade 门面

- [pms.facade.ts](../../../packages/plugins/plugin-pms/contract/pms.facade.ts)

---

## 三、 Agent 自动化实体与契约清单 (3 个)

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `PmsProject` | 项目台账 | `/admin/pms/pms-project` | `pms:project` | [`pms-project.agent.json`](../../../packages/plugins/plugin-pms/agent/pms-project.agent.json) |
| `PmsMilestone` | 里程碑 | `/admin/pms/pms-milestone` | `pms:milestone` | [`pms-milestone.agent.json`](../../../packages/plugins/plugin-pms/agent/pms-milestone.agent.json) |
| `PmsTimesheet` | 任务工时 | `/admin/pms/pms-timesheet` | `pms:timesheet` | [`pms-timesheet.agent.json`](../../../packages/plugins/plugin-pms/agent/pms-timesheet.agent.json) |
