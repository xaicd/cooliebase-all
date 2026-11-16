# 领域百科：fms (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-fms/`](../../../packages/plugins/plugin-fms)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3228 | **上游环境变量**：`COOLIEBASE_DOMAIN_FMS_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（财务管理域：资金账户、收支凭证、对账结算）
- **对外 HTTP API 前缀**：`/api/v1/admin/fms`
- **默认鉴权策略**：受众 `admin`，多租户策略 `required`

---

## 二、 跨域 Facade 门面

- [fms.facade.ts](../../../packages/plugins/plugin-fms/contract/fms.facade.ts)

---

## 三、 Agent 自动化实体与契约清单 (3 个)

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `FmsAccount` | 资金账户 | `/admin/fms/fms-account` | `fms:account` | [`fms-account.agent.json`](../../../packages/plugins/plugin-fms/agent/fms-account.agent.json) |
| `FmsVoucher` | 收支凭证 | `/admin/fms/fms-voucher` | `fms:voucher` | [`fms-voucher.agent.json`](../../../packages/plugins/plugin-fms/agent/fms-voucher.agent.json) |
| `FmsReconcile` | 对账结算 | `/admin/fms/fms-reconcile` | `fms:reconcile` | [`fms-reconcile.agent.json`](../../../packages/plugins/plugin-fms/agent/fms-reconcile.agent.json) |
