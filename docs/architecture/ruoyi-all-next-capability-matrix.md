# cooliebase-all 全量能力同步矩阵（来自 cooliebase 目录）

更新时间：2026-08-06

## 1. 目标与口径

目标：cooliebase 目录下两套项目能力要完整迁移到 cooliebase-all，不做遗漏。

能力来源：

1. 后端模块来源：`apps/cooliebase/cooliebase-vue-pro/yudao-module-*`
2. 前端域来源：`apps/cooliebase/yudao-ui-admin-vue3/src/views/*` 与 `src/api/*`
3. 功能定义来源：`apps/cooliebase/cooliebase-vue-pro/README.md`、`apps/cooliebase/yudao-ui-admin-vue3/README.md`

同步判定标准（六要素）：

1. 模块定义文档
2. API（路由 + 校验）
3. Service（业务逻辑）
4. 后台页面入口
5. 权限码与菜单
6. 审计日志与测试

通过规则：六要素全齐才算“已同步”。

## 2. 已识别模块总览（后端）

共 15 个一级模块：

1. yudao-module-system
2. yudao-module-infra
3. yudao-module-bpm
4. yudao-module-pay
5. yudao-module-report
6. yudao-module-mp
7. yudao-module-mall
8. yudao-module-member
9. yudao-module-crm
10. yudao-module-erp
11. yudao-module-wms
12. yudao-module-mes
13. yudao-module-ai
14. yudao-module-iot
15. yudao-module-im

模块证据路径：

1. `apps/cooliebase/cooliebase-vue-pro/yudao-module-system`
2. `apps/cooliebase/cooliebase-vue-pro/yudao-module-infra`
3. `apps/cooliebase/cooliebase-vue-pro/yudao-module-bpm`
4. `apps/cooliebase/cooliebase-vue-pro/yudao-module-pay`
5. `apps/cooliebase/cooliebase-vue-pro/yudao-module-report`
6. `apps/cooliebase/cooliebase-vue-pro/yudao-module-mp`
7. `apps/cooliebase/cooliebase-vue-pro/yudao-module-mall`
8. `apps/cooliebase/cooliebase-vue-pro/yudao-module-member`
9. `apps/cooliebase/cooliebase-vue-pro/yudao-module-crm`
10. `apps/cooliebase/cooliebase-vue-pro/yudao-module-erp`
11. `apps/cooliebase/cooliebase-vue-pro/yudao-module-wms`
12. `apps/cooliebase/cooliebase-vue-pro/yudao-module-mes`
13. `apps/cooliebase/cooliebase-vue-pro/yudao-module-ai`
14. `apps/cooliebase/cooliebase-vue-pro/yudao-module-iot`
15. `apps/cooliebase/cooliebase-vue-pro/yudao-module-im`

## 3. 已识别域总览（前端）

后台视图域（20）：

1. system
2. infra
3. bpm
4. pay
5. report
6. mp
7. mall
8. member
9. crm
10. erp
11. wms
12. mes
13. ai
14. iot
15. im
16. Home
17. Login
18. Profile
19. IFrame
20. Error

后台 API 域（15）：

1. system
2. infra
3. bpm
4. pay
5. mp
6. mall
7. member
8. crm
9. erp
10. wms
11. mes
12. ai
13. iot
14. im
15. login

证据路径：

1. `apps/cooliebase/yudao-ui-admin-vue3/src/views`
2. `apps/cooliebase/yudao-ui-admin-vue3/src/api`

## 4. cooliebase-all 能力同步清单

状态说明：

1. `DONE`：六要素齐全
2. `PARTIAL`：有骨架未闭环
3. `TODO`：未启动

### 4.1 P0 基座（必须先全量）

| 域 | 关键能力 | 当前状态 | 备注 |
|---|---|---|---|
| system | 用户/角色/菜单/组织/岗位/字典/通知公告/在线用户/登录日志/操作日志 | PARTIAL | 当前仓已有 RBAC，online-users/login-logs/operate-logs 已具备 API+Service+Page+Permission+Audit 基线，待接真实存储与完整测试 |
| infra | 配置管理/文件服务/任务调度/API日志/代码生成/接口文档/Redis与SQL监控 | PARTIAL | 参数中心、任务中心、API日志中心已具备 API+Service+Page+Permission+Audit 基线，待接持久层与真实日志链路 |

### 4.2 通用业务中台

| 域 | 关键能力 | 当前状态 | 备注 |
|---|---|---|---|
| bpm | 流程定义/审批流/任务中心/表单设计器 | PARTIAL | 已落地流程定义与待办任务骨架（API+Service+Page+Permission+Audit），待接真实流程引擎与实例流转 |
| pay | 支付应用/支付单/退款单/回调通知 | PARTIAL | 已落地支付单/退款单骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实支付渠道与回调通知 |
| report | 报表与大屏 | PARTIAL | 已落地数据大屏列表/导出骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实报表引擎与指标计算 |
| mp | 公众号账号/粉丝/消息/模板消息/菜单/素材 | PARTIAL | 已落地账号/粉丝/消息发送骨架（API+Service+Page+Permission+Audit），待接真实微信渠道与模板消息引擎 |
| member | 会员/等级/积分/分组/标签 | PARTIAL | 已落地会员列表/等级/积分调整骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实会员数据层 |

### 4.3 行业业务域（需完整覆盖）

| 域 | 关键能力 | 当前状态 | 备注 |
|---|---|---|---|
| mall | 商品/交易/促销/统计 | PARTIAL | 主仓有交易与活动，需映射 mall 子域能力 |
| crm | 客户管理/线索商机/跟进体系 | PARTIAL | 已落地客户/线索/跟进骨架（API+Service+Page+Permission+Audit），待接真实客户画像与商机转化流程 |
| erp | 进销存与经营台账 | PARTIAL | 已落地商品/订单/库存调整骨架（API+Service+Page+Permission+Audit），待接真实进销存台账与结算核对流程 |
| wms | 仓储/出入库/库存作业 | PARTIAL | 已补齐最小骨架（API/Service/Validator/Page/Permission/Audit/Test），待扩展子模块 |
| mes | 生产任务/工序执行 | PARTIAL | 已补齐最小骨架（API/Service/Validator/Page/Permission/Audit/Test），待扩展子模块 |
| ai | 模型配置/对话与调用治理 | PARTIAL | 已落地模型管理/对话记录骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实推理引擎 |
| iot | 设备/网关/数据上报/告警联动 | PARTIAL | 已落地设备管理/告警处理骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实设备接入层 |
| im | 即时通讯/会话消息 | PARTIAL | 已补齐最小骨架（API/Service/Validator/Page/Permission/Audit/Test），待扩展子模块 |

## 5. 同步策略（必须执行，不可跳）

### 5.1 第一阶段（2 周）

1. 完成 P0：system + infra 全闭环
2. 把 online-users/login-logs/operate-logs 从模板升级成可用模块
3. 建立模块生成器：一键生成 API/Service/Validator/Page/Permission/Test

### 5.2 第二阶段（3-4 周）

1. 通用中台：bpm/pay/report/mp/member
2. 每个域至少完成 1 个端到端样板子模块

### 5.3 第三阶段（持续）

1. 行业域：mall/crm/erp/wms/mes/ai/iot/im
2. 每个域按“最小可运行 + 可复用模板”落地

## 6. 验收门禁

每个域同步完成必须满足：

1. 有域文档：能力边界、数据模型、权限模型
2. 有 API：统一响应，含参数校验
3. 有页面：列表 + 详情 + 关键操作
4. 有权限：菜单权限 + 按钮权限
5. 有日志：event + audit + 脱敏
6. 有测试：至少覆盖关键路径
7. 有检查：纳入 CI 同步矩阵检查

## 7. 当前结论

1. 你提的“cooliebase 目录能力都要同步”是正确方向。
2. 已完成“全量域识别 + 同步矩阵”落盘。
3. 下一步应先把 P0 的 system/infra 做成可运行闭环，再推进其它 13 个域。
