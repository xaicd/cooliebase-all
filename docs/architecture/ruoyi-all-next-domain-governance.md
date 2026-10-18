# cooliebase-all-base 域治理声明表

更新时间：2026-08-20

## 1. 说明

本表用于声明每个能力域的：

1. 数据库兼容等级
2. UI 框架治理组合
3. 微服务演进阶段
4. 必用 Skill 绑定
5. 测试基线引用
6. 拆分说明（B/C 阶段必填）

规则：

1. 在能力矩阵中状态为 PARTIAL 或 DONE 的域，必须在本表中有声明。
2. 缺少声明的域不得对外宣称“标准化完成”。

## 2. 声明表

| 域 | 能力状态 | DB Tier | UI Stack | 微服务阶段 | Skill 绑定 | TestRefs | SplitNote |
|---|---|---|---|---|---|---|---|
| shop | plugin | B | — | — | — | — | —
| system | PARTIAL | Tier-A | React-radix | A | database-compatibility + ui-framework-governance + microservice-evolution | packages/domains/system/backend/services/__tests__/online-user.service.test.ts | 单体内聚，先补真实会话存储后再拆分 |
| infra | PARTIAL | Tier-A | React-radix | A | database-compatibility + ui-framework-governance + microservice-evolution | packages/domains/infra/backend/services/__tests__/infra-services.test.ts | 单体内聚，保留调度与配置适配层 |
| bpm | PARTIAL | Tier-A | React-radix | A | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-bpm/backend/services/__tests__/process.service.test.ts | 单体内聚，待流程实例增长后独立服务 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- bpm`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.bpm/api/** 挂载 
| pay | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-pay/backend/services/__tests__/pay.plugin.service.test.ts | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- pay`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.pay/api/** 挂载 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- pay`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.pay/api/** 挂载 
| report | PARTIAL | Tier-A | React-radix | A | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-report/backend/services/__tests__/report.plugin.service.test.ts | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- report`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.report/api/** 挂载 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- report`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.report/api/** 挂载 
| mp | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-mp/backend/services/__tests__/mp-services.test.ts | 拆账号治理与消息投递链路，降低第三方通道耦合 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- mp`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.mp/api/** 挂载 
| member | PARTIAL | Tier-A | React-radix | A | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-member/backend/services/__tests__/member.plugin.service.test.ts | 单体内聚，先统一会员模型再拆分 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- member`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.member/api/** 挂载 
| mall | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-mall/backend/services/__tests__/mall.plugin.service.test.ts | 拆交易与促销子域，减少高峰耦合 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- mall`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.mall/api/** 挂载 
| crm | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-crm/backend/services/__tests__/crm.plugin.service.test.ts | 拆客户主数据与跟进任务中心，支撑独立发布节奏 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- crm`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.crm/api/** 挂载 
| erp | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-erp/backend/services/__tests__/erp.plugin.service.test.ts | 拆库存账本与采购订单服务，隔离事务密集链路 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- erp`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.erp/api/** 挂载 
| wms | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-wms/backend/services/__tests__/wms.plugin.service.test.ts | 拆仓库主数据与作业执行链路，隔离高频库存操作 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- wms`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.wms/api/** 挂载 
| mes | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-mes/backend/services/__tests__/mes.plugin.service.test.ts | 拆工单编排与生产报工链路，支撑独立扩展 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- mes`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.mes/api/** 挂载 
| im | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-im/backend/services/__tests__/im.plugin.service.test.ts | 拆会话管理与消息审核链路，避免通信链路耦合 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- im`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.im/api/** 挂载 
| ai | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-ai/backend/services/__tests__/ai.plugin.service.test.ts | 拆模型治理与推理网关，控制依赖爆炸 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- ai`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.ai/api/** 挂载 
| aigw | PARTIAL | MIXED | React-radix | A | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-aigw/backend/services/__tests__/aigw.service.test.ts | 单体内聚。facade 刚接通（原有 7 个方法**零派发映射**、调用必抛，已补 `service`/`target`）；已有跨域调用方 `ai`（走 facade，不再直连 Service）。独立打包/运行尚未实测，故暂列 A | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- aigw`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.aigw/api/** 挂载 
| iot | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-iot/backend/services/__tests__/iot.plugin.service.test.ts | 拆设备接入与规则引擎，隔离高吞吐链路 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- iot`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.iot/api/** 挂载 
| online | PARTIAL | MIXED | React-radix | B | database-compatibility + ui-framework-governance + microservice-evolution | packages/plugins/plugin-online/backend/application/online-codegen.adapter.test.ts | 已支持独立打包；跨域 codegen 走 `infraPlatformFacade`，字典走 `systemPublicFacade`，数据库仍共享 | **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, `npm run domain:up -- online`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.online/api/** 挂载 
