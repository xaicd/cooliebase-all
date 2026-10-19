# cooliebase-all 同步任务看板（执行版）

更新时间：2026-08-06

## 1. 规则

1. 任务状态只能使用：`TODO`、`DOING`、`DONE`
2. 一个域必须按“六要素”逐项打勾
3. 一个域未完成前，不得跳过到下一域宣称全量同步

六要素：

1. API
2. Service
3. Page
4. Permission + Menu
5. Log + Audit
6. Test

## 2. P0 任务（先闭环）

| 域 | 状态 | API | Service | Page | Permission | Log/Audit | Test | 备注 |
|---|---|---|---|---|---|---|---|---|
| system-online-users | DOING | DONE | DONE | DONE | DONE | DONE | DONE | 已有骨架，需接真实会话存储 |
| system-login-logs | DOING | DONE | DONE | DONE | DONE | DONE | TODO | 需接登录事件落库 |
| system-operate-logs | DOING | DONE | DONE | DONE | DONE | DONE | TODO | 需接操作日志索引 |
| infra-configs | DOING | DONE | DONE | DONE | DONE | DONE | DONE | 需接配置持久层 |
| infra-job-center | DOING | DONE | DONE | DONE | DONE | DONE | DONE | 需接真实调度引擎 |
| infra-api-logs | DOING | DONE | DONE | DONE | DONE | DONE | DONE | 需接请求日志流水 |
| bpm-process-definitions | DOING | DONE | DONE | DONE | DONE | TODO | TODO | 需接真实流程定义持久层与发布能力 |
| bpm-tasks | DOING | DONE | DONE | DONE | DONE | DONE | TODO | 需接真实任务引擎与实例状态机 |

## 3. P1 任务（通用中台）

| 域 | 状态 | 备注 |
|---|---|---|
| bpm | TODO | 流程定义、审批任务、表单设计 |
| pay | DOING | 已完成支付单/退款单骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实支付渠道与回调 |
| report | DOING | 已完成数据大屏列表/导出骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实报表引擎 |
| mp | DOING | 已完成账号/粉丝/消息发送骨架，待接真实微信渠道 |
| member | DOING | 已完成会员列表/等级/积分骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实会员数据层 |

## 4. P2 任务（行业域）

| 域 | 状态 | 备注 |
|---|---|---|
| mall | TODO | 商品交易促销统计拆域 |
| crm | DOING | 已完成客户/线索/跟进骨架，待接商机转化流程 |
| erp | DOING | 已完成商品/订单/库存调整骨架，待接进销存台账闭环 |
| wms | DOING | 已补齐最小骨架（API/Service/Validator/Page/Permission/Audit/Test），待扩展子模块 |
| mes | DOING | 已补齐最小骨架（API/Service/Validator/Page/Permission/Audit/Test），待扩展子模块 |
| ai | DOING | 已完成模型管理/对话记录骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实推理引擎 |
| iot | DOING | 已完成设备管理/告警处理骨架（API+Service+Validator+Page+Permission+Audit+Test），待接真实设备接入层 |
| im | DOING | 已补齐最小骨架（API/Service/Validator/Page/Permission/Audit/Test），待扩展子模块 |
