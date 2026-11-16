# 领域百科：crm (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-crm/`](../../packages/plugins/plugin-crm)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3219 | **上游环境变量**：`COOLIEBASE_DOMAIN_CRM_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/crm`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`5000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [crm.facade.ts](../../packages/plugins/plugin-crm/contract/crm.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listCustomers`
- `listClues`
- `createFollowup`

---

## 三、 Agent 自动化实体与契约清单 (21 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `CrmBusiness` | CRM 商机 | `/admin/crm/crm-business` | `crm:crm_business` | [`crm-business.agent.json`](../../packages/plugins/plugin-crm/agent/crm-business.agent.json) |
| `CrmBusinessProduct` | CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines | `/admin/crm/crm-business-product` | `crm:crm_business_product` | [`crm-business-product.agent.json`](../../packages/plugins/plugin-crm/agent/crm-business-product.agent.json) |
| `CrmBusinessStatus` | CRM 商机状态 DO注意，它是个配置表 | `/admin/crm/crm-business-status` | `crm:crm_business_status` | [`crm-business-status.agent.json`](../../packages/plugins/plugin-crm/agent/crm-business-status.agent.json) |
| `CrmBusinessStatusType` | CRM 商机状态组 DO注意，它是个配置表 | `/admin/crm/crm-business-status-type` | `crm:crm_business_status_type` | [`crm-business-status-type.agent.json`](../../packages/plugins/plugin-crm/agent/crm-business-status-type.agent.json) |
| `CrmClue` | CRM 线索 | `/admin/crm/crm-clue` | `crm:crm_clue` | [`crm-clue.agent.json`](../../packages/plugins/plugin-crm/agent/crm-clue.agent.json) |
| `CrmContact` | CRM 联系人 | `/admin/crm/crm-contact` | `crm:crm_contact` | [`crm-contact.agent.json`](../../packages/plugins/plugin-crm/agent/crm-contact.agent.json) |
| `CrmContactBusiness` | CRM 联系人与商机的关联 | `/admin/crm/crm-contact-business` | `crm:crm_contact_business` | [`crm-contact-business.agent.json`](../../packages/plugins/plugin-crm/agent/crm-contact-business.agent.json) |
| `CrmContract` | CRM 合同 | `/admin/crm/crm-contract` | `crm:crm_contract` | [`crm-contract.agent.json`](../../packages/plugins/plugin-crm/agent/crm-contract.agent.json) |
| `CrmContractConfig` | 编号 | `/admin/crm/crm-contract-config` | `crm:crm_contract_config` | [`crm-contract-config.agent.json`](../../packages/plugins/plugin-crm/agent/crm-contract-config.agent.json) |
| `CrmContractProduct` | CRM 合同产品关联表 | `/admin/crm/crm-contract-product` | `crm:crm_contract_product` | [`crm-contract-product.agent.json`](../../packages/plugins/plugin-crm/agent/crm-contract-product.agent.json) |
| `CrmCustomer` | CRM 客户 | `/admin/crm/crm-customer` | `crm:crm_customer` | [`crm-customer.agent.json`](../../packages/plugins/plugin-crm/agent/crm-customer.agent.json) |
| `CrmCustomerLimitConfig` | 客户限制配置 | `/admin/crm/crm-customer-limit-config` | `crm:crm_customer_limit_config` | [`crm-customer-limit-config.agent.json`](../../packages/plugins/plugin-crm/agent/crm-customer-limit-config.agent.json) |
| `CrmCustomerPoolConfig` | 客户公海配置 | `/admin/crm/crm-customer-pool-config` | `crm:crm_customer_pool_config` | [`crm-customer-pool-config.agent.json`](../../packages/plugins/plugin-crm/agent/crm-customer-pool-config.agent.json) |
| `CrmFollowUpRecord` | 跟进记录 DO用于记录客户、联系人的每一次跟进 | `/admin/crm/crm-follow-up-record` | `crm:crm_follow_up_record` | [`crm-follow-up-record.agent.json`](../../packages/plugins/plugin-crm/agent/crm-follow-up-record.agent.json) |
| `CrmOwnerRecord` | CRM 负责人变更记录 | `/admin/crm/crm-owner-record` | `crm:crm_owner_record` | [`crm-owner-record.agent.json`](../../packages/plugins/plugin-crm/agent/crm-owner-record.agent.json) |
| `CrmPerformanceConfig` | CRM 业绩目标 | `/admin/crm/crm-performance-config` | `crm:crm_performance_config` | [`crm-performance-config.agent.json`](../../packages/plugins/plugin-crm/agent/crm-performance-config.agent.json) |
| `CrmPermission` | CRM 数据权限 | `/admin/crm/crm-permission` | `crm:crm_permission` | [`crm-permission.agent.json`](../../packages/plugins/plugin-crm/agent/crm-permission.agent.json) |
| `CrmProduct` | CRM 产品 | `/admin/crm/crm-product` | `crm:crm_product` | [`crm-product.agent.json`](../../packages/plugins/plugin-crm/agent/crm-product.agent.json) |
| `CrmProductCategory` | 产品分类 | `/admin/crm/crm-product-category` | `crm:crm_product_category` | [`crm-product-category.agent.json`](../../packages/plugins/plugin-crm/agent/crm-product-category.agent.json) |
| `CrmReceivable` | 回款 | `/admin/crm/crm-receivable` | `crm:crm_receivable` | [`crm-receivable.agent.json`](../../packages/plugins/plugin-crm/agent/crm-receivable.agent.json) |
| `CrmReceivablePlan` | CRM 回款计划 | `/admin/crm/crm-receivable-plan` | `crm:crm_receivable_plan` | [`crm-receivable-plan.agent.json`](../../packages/plugins/plugin-crm/agent/crm-receivable-plan.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-crm/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-crm/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-crm/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
