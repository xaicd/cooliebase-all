> ⚠️ **ARCHIVED 2026-10-18**: 此文档为 2026 Q3 上游对标研究快照。
> 不再更新，所述上游项目（cooliebase-vue-pro / yudao-cloud / yudao-boot-mini 等）已不再作为本工程的事实来源。
> 历史对照参考保留，新读者请参考 `docs/specs/` 与 `.agents/rules/`。

# yudao-boot-mini 核心基础设施全量复核

更新时间：2026-08-02

## 1. 复核结论（先说结论）

1. yudao-boot-mini 的核心并不“轻”：它是一个完整的 system + infra 后端平台基座。
2. 你之前指出的风险成立：如果只看 all-next 现有薄骨架，会低估 mini 的基础设施深度。
3. mini 的复制优先级应该以 framework starters 为第一层，再到 system/infra API 与数据模型。

## 2. 模块边界（以 Maven 聚合为准）

来自 yudao-boot-mini 根 pom：

1. yudao-framework（13 个 starter）
2. yudao-module-system
3. yudao-module-infra
4. yudao-server（壳容器）

被注释的 member/bpm/report/mp/pay/mall/crm/erp/wms/mes/im/ai/iot 不属于 mini 默认启用范围。

## 3. framework 全量能力簇

按 starter 包族划分：

1. web：apilog、encrypt、desensitize、swagger、xss、web 基础过滤链
2. security：认证、鉴权、操作日志切面
3. mybatis：数据源、mybatis 拓展、translate
4. redis：缓存抽象与 Redis 封装
5. protection：idempotent、ratelimiter、lock4j、signature
6. job：quartz 调度
7. mq：redis/rabbitmq 生产消费能力
8. websocket：消息推送与多通道 sender
9. monitor：metrics 与 tracer
10. excel：导入导出 + dict 翻译
11. biz-tenant：SaaS 租户隔离
12. biz-data-permission：部门与数据权限
13. biz-ip：IP/地区基础能力

## 4. 核心模块深度（后端代码规模）

1. system：419 个 Java 文件；35 Controller、36 ServiceImpl、32 Mapper、32 DO。
2. infra：205 个 Java 文件；16 Controller、15 ServiceImpl、22 Mapper、16 DO。

这说明 mini 的后端基座是“可直接商用级”的，不是 demo 级别。

## 5. system 功能面（Controller 证据）

admin API 包含：

1. auth/captcha
2. user/profile
3. role/menu/permission
4. dept/post
5. tenant/tenant-package
6. dict
7. notice/notify
8. login-log/operate-log
9. sms 全链路（channel/template/log/callback）
10. mail 全链路（account/template/log）
11. oauth2（client/open/token/user）
12. social（client/user）
13. ip/area、cooliebase 通用接口

app API 包含：tenant、dict、ip。

## 6. infra 功能面（Controller 证据）

admin API 包含：

1. config（参数中心）
2. job + job-log（任务中心）
3. file + file-config（文件中心）
4. api-access-log + api-error-log（API 日志中心）
5. redis（缓存监控）
6. datasource config（数据库配置）
7. codegen（代码生成）
8. demo 示例集

app API 包含：file。

## 7. 数据库与多库适配

1. mini 内置 sql 目录覆盖 mysql/oracle/postgresql/sqlserver/dm/kingbase/opengauss/highgo。
2. mysql 主脚本表总数 48（含 system_*、infra_*、demo_*）。
3. quartz 独立脚本，说明任务中心按标准表单独落地。

## 8. 运行配置层证据

yudao-server 配置显示 mini 默认具备：

1. 动态数据源与 Druid 监控
2. Redis 缓存
3. Quartz 集群配置
4. MQ（Kafka/RabbitMQ/RocketMQ）参数位
5. Actuator + Spring Boot Admin
6. WebSocket sender 配置
7. API 加密、XSS、验证码、访问日志开关

## 9. 当前仓库的一个客观事实

本地 yudao-boot-mini 的 yudao-ui-admin-vue3 目录仅含 mes 片段，不是完整前端镜像。

因此本轮结论以“后端与 SQL 为主证据”，前端 UI 不作为完整覆盖依据。

## 10. all-next 复制策略修正

1. 先复制 framework 能力抽象：web/security/mybatis/redis/protection/job/mq/websocket/monitor/excel/tenant/data-permission/ip。
2. 再复制 system 与 infra 的 API/Service/模型矩阵。
3. 复制顺序改为“基础设施先行、业务接口后置”，避免只补页面骨架导致失真。

## 11. 对应产物

1. 扫描脚本：scripts/scan-yudao-boot-mini-core.ts
2. 扫描报告：apps/cooliebase/cooliebase-all/docs/architecture/artifacts/yudao-boot-mini-core-scan-2026-08-02.md
3. 扫描明细 JSON：apps/cooliebase/cooliebase-all/docs/architecture/artifacts/yudao-boot-mini-core-scan-2026-08-02.json
