# 领域百科：hrm (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-hrm/`](../../../packages/plugins/plugin-hrm)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3227 | **上游环境变量**：`COOLIEBASE_DOMAIN_HRM_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（人力资源域：员工档案、岗位编制、薪资核算）
- **对外 HTTP API 前缀**：`/api/v1/admin/hrm`
- **默认鉴权策略**：受众 `admin`，多租户策略 `required`

---

## 二、 跨域 Facade 门面

- [hrm.facade.ts](../../../packages/plugins/plugin-hrm/contract/hrm.facade.ts)

---

## 三、 Agent 自动化实体与契约清单 (3 个)

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `HrmEmployee` | 员工档案 | `/admin/hrm/hrm-employee` | `hrm:employee` | [`hrm-employee.agent.json`](../../../packages/plugins/plugin-hrm/agent/hrm-employee.agent.json) |
| `HrmPosition` | 岗位编制 | `/admin/hrm/hrm-position` | `hrm:position` | [`hrm-position.agent.json`](../../../packages/plugins/plugin-hrm/agent/hrm-position.agent.json) |
| `HrmPayroll` | 薪资核算 | `/admin/hrm/hrm-payroll` | `hrm:payroll` | [`hrm-payroll.agent.json`](../../../packages/plugins/plugin-hrm/agent/hrm-payroll.agent.json) |
