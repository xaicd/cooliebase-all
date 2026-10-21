# 领域百科：bpm (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-bpm/`](../../packages/plugins/plugin-bpm)  
> **演进阶段**：阶段 A | **独立部署默认端口**：3213 | **上游环境变量**：`COOLIEBASE_DOMAIN_BPM_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/bpm`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`8000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [bpm.facade.ts](../../packages/plugins/plugin-bpm/contract/bpm.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listDefinitions`
- `listTasks`
- `actionTask`

---

## 三、 Agent 自动化实体与契约清单 (8 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `BpmCategory` | BPM 流程分类 | `/admin/bpm/bpm-category` | `bpm:bpm_category` | [`bpm-category.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-category.agent.json) |
| `BpmForm` | BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景 | `/admin/bpm/bpm-form` | `bpm:bpm_form` | [`bpm-form.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-form.agent.json) |
| `BpmOALeave` | OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 | `/admin/bpm/bpm-oaleave` | `bpm:bpm_oaleave` | [`bpm-oaleave.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-oaleave.agent.json) |
| `BpmProcessDefinitionInfo` | BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表 | `/admin/bpm/bpm-process-definition-info` | `bpm:bpm_process_definition_info` | [`bpm-process-definition-info.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-process-definition-info.agent.json) |
| `BpmProcessExpression` | BPM 流程表达式 | `/admin/bpm/bpm-process-expression` | `bpm:bpm_process_expression` | [`bpm-process-expression.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-process-expression.agent.json) |
| `BpmProcessInstanceCopy` | 流程抄送 | `/admin/bpm/bpm-process-instance-copy` | `bpm:bpm_process_instance_copy` | [`bpm-process-instance-copy.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-process-instance-copy.agent.json) |
| `BpmProcessListener` | BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计 | `/admin/bpm/bpm-process-listener` | `bpm:bpm_process_listener` | [`bpm-process-listener.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-process-listener.agent.json) |
| `BpmUserGroup` | BPM 用户组 | `/admin/bpm/bpm-user-group` | `bpm:bpm_user_group` | [`bpm-user-group.agent.json`](../../packages/plugins/plugin-bpm/agent/bpm-user-group.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-bpm/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-bpm/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-bpm/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
