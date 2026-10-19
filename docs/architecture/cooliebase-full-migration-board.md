# cooliebase-all 全域迁移作战板

- 生成时间: 2026-08-03T01:58:18.598Z
- 证据来源: apps/cooliebase/cooliebase-all/docs/architecture/artifacts/cooliebase-domain-evidence-2026-08-03.json
- 覆盖域数: 15

## 阶段拆分

1. P0-Foundation: system + infra 必须先闭环
2. P1-CloseGaps: 已有骨架，优先补日志与测试
3. P2-Bootstrap: PARTIAL 但六要素缺口较大
4. P3-NewDomain: TODO 域，从模块骨架启动

## P0-Foundation

- 域数量: 2

| 域 | 矩阵状态 | 后端规模(Cont/Serv/Map/DO/Enum) | 前端规模(Vue/API) | all-next 文件 | 缺口 |
|---|---|---|---|---:|---|
| system | PARTIAL | 35/34/32/32/18 | 66/28 | 134 | none |
| infra | PARTIAL | 16/15/22/16/11 | 51/16 | 128 | none |

执行动作:
1. 先补文档映射: 能力边界 + 数据模型 + 权限模型
2. 再补六要素: API/Service/Validator/Page/Permission/Log/Test
3. 每完成一个域，更新 capability matrix 状态

## P1-CloseGaps

- 域数量: 8

| 域 | 矩阵状态 | 后端规模(Cont/Serv/Map/DO/Enum) | 前端规模(Vue/API) | all-next 文件 | 缺口 |
|---|---|---|---|---:|---|
| mes | PARTIAL | 127/134/135/133/65 | 284/127 | 9 | none |
| mall | PARTIAL | 73/51/55/49/36 | 124/40 | 12 | none |
| crm | PARTIAL | 24/25/28/21/11 | 118/24 | 12 | none |
| im | PARTIAL | 30/18/18/17/16 | 101/28 | 9 | none |
| erp | PARTIAL | 23/23/35/33/2 | 63/23 | 12 | none |
| wms | PARTIAL | 17/17/17/16/5 | 39/17 | 9 | none |
| mp | PARTIAL | 12/9/8/8/3 | 46/11 | 23 | none |
| bpm | PARTIAL | 12/13/8/8/30 | 45/12 | 12 | none |

执行动作:
1. 先补文档映射: 能力边界 + 数据模型 + 权限模型
2. 再补六要素: API/Service/Validator/Page/Permission/Log/Test
3. 每完成一个域，更新 capability matrix 状态

## P2-Bootstrap

- 域数量: 5

| 域 | 矩阵状态 | 后端规模(Cont/Serv/Map/DO/Enum) | 前端规模(Vue/API) | all-next 文件 | 缺口 |
|---|---|---|---|---:|---|
| iot | PARTIAL | 18/20/15/17/28 | 91/16 | 9 | 待接真实设备接入层与规则引擎 |
| ai | PARTIAL | 14/14/14/14/8 | 69/14 | 8 | 待接真实推理引擎与模型调用治理 |
| member | PARTIAL | 20/12/11/11/2 | 32/10 | 9 | 待接真实会员数据层与积分结算 |
| pay | PARTIAL | 19/12/14/14/10 | 23/11 | 8 | 待接真实支付渠道与回调通知 |
| report | PARTIAL | 2/4/1/1/0 | 3/0 | 7 | 待接真实报表引擎与指标计算 |

执行动作:
1. 先补文档映射: 能力边界 + 数据模型 + 权限模型
2. 再补六要素: API/Service/Validator/Page/Permission/Log/Test
3. 每完成一个域，更新 capability matrix 状态

## P3-NewDomain

- 域数量: 0

| 域 | 矩阵状态 | 后端规模(Cont/Serv/Map/DO/Enum) | 前端规模(Vue/API) | all-next 文件 | 缺口 |
|---|---|---|---|---:|---|

执行动作:
1. 先补文档映射: 能力边界 + 数据模型 + 权限模型
2. 再补六要素: API/Service/Validator/Page/Permission/Log/Test
3. 每完成一个域，更新 capability matrix 状态

## 每域交付门禁

1. API 响应结构统一，并完成参数校验
2. Permission code 全量接入，不允许 roles 硬编码
3. 关键动作有 event + audit
4. 至少 1 条关键路径自动化测试
5. 文档、矩阵、治理声明同步更新
