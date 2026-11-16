# 领域百科：oa (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-oa/`](../../../packages/plugins/plugin-oa)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3226 | **上游环境变量**：`COOLIEBASE_DOMAIN_OA_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（协同办公域：通知公告、考勤打卡、请假用印）
- **对外 HTTP API 前缀**：`/api/v1/admin/oa`
- **默认鉴权策略**：受众 `admin`，多租户策略 `required`

---

## 二、 跨域 Facade 门面

- [oa.facade.ts](../../../packages/plugins/plugin-oa/contract/oa.facade.ts)

---

## 三、 Agent 自动化实体与契约清单 (3 个)

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `OaNotice` | 通知公告 | `/admin/oa/oa-notice` | `oa:notice` | [`oa-notice.agent.json`](../../../packages/plugins/plugin-oa/agent/oa-notice.agent.json) |
| `OaAttendance` | 考勤打卡 | `/admin/oa/oa-attendance` | `oa:attendance` | [`oa-attendance.agent.json`](../../../packages/plugins/plugin-oa/agent/oa-attendance.agent.json) |
| `OaLeaveApply` | 请假用印 | `/admin/oa/oa-leave-apply` | `oa:leave-apply` | [`oa-leave-apply.agent.json`](../../../packages/plugins/plugin-oa/agent/oa-leave-apply.agent.json) |
