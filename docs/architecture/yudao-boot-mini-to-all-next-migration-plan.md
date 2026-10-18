# yudao-boot-mini → all-next 迁移计划

更新时间：2026-08-02

## 1. 目标

把 yudao-boot-mini 的核心基础设施能力完整复制到 cooliebase-all，并按 mini 的真实启用范围建立迁移顺序。

## 2. 迁移原则

1. 先复制 framework starter 能力，再复制 system 和 infra。
2. 先复制基础设施中间件与治理能力，再复制页面与接口外壳。
3. 不按完整版能力清单盲拷，只按 mini 实际启用能力落地。
4. system/infra 相关能力必须保留事件日志、审计日志、测试闭环。

## 3. 第一层：framework starters

优先复制的 starter：

1. web：apilog、encrypt、swagger、xss、desensitize、web
2. security：认证、鉴权、操作日志
3. mybatis：数据源、MyBatis、translate
4. redis：缓存与 Redis 封装
5. protection：幂等、限流、锁、签名
6. job：Quartz 调度与异步
7. mq：Redis / RabbitMQ 消费生产
8. websocket：消息推送
9. monitor：metrics / tracer
10. excel：导入导出与字典翻译
11. biz-tenant：租户隔离
12. biz-data-permission：数据权限
13. biz-ip：IP / 地区基础能力

## 4. 第二层：system 核心闭环

system 复制优先级：

1. auth / captcha / oauth2
2. user / dept / post
3. permission / role / menu
4. tenant / tenant-package
5. dict / notice / notify
6. logger（login-log / operate-log）
7. sms / mail / social / ip / area

## 5. 第三层：infra 核心闭环

infra 复制优先级：

1. config（参数中心）
2. job + job-log（任务中心）
3. file + file-config（文件中心）
4. api-access-log / api-error-log（API 日志中心）
5. redis（缓存监控）
6. datasource config（数据源配置）
7. codegen（代码生成）
8. demo 示例集（仅保留必要演示样例）

## 6. 迁移顺序

### Phase 0

1. 复制 starter 抽象与通用配置。
2. 建立 all-next 内部的基础设施门面层。

### Phase 1

1. system 模块完成 API / Service / Validator / Permission / Log / Test。
2. 先闭环 auth、user、permission、tenant、logger。

### Phase 2

1. infra 模块完成 API / Service / Validator / Permission / Log / Test。
2. 先闭环 config、job、file、api log、redis、codegen。

### Phase 3

1. 补齐 UI 和页面入口。
2. 仅在核心 API 闭环完成后再做前端模板扩展。

## 7. 交付门禁

1. 有扫描证据：mini scan + deep scan + migration board。
2. 有实现证据：API / Service / Validator / Page / Permission / Log / Test。
3. 有治理证据：strict governance 通过。
4. 有回归证据：域级测试通过。

## 8. 当前已完成的证据

1. [yudao-boot-mini 核心基础设施全量扫描](apps/cooliebase/cooliebase-all/docs/architecture/artifacts/yudao-boot-mini-core-scan-2026-08-02.md)
2. [yudao-boot-mini 核心基础设施全量复核](apps/cooliebase/cooliebase-all/docs/architecture/yudao-boot-mini-core-foundation-study.md)
3. [cooliebase 全域迁移作战板](apps/cooliebase/cooliebase-all/docs/architecture/cooliebase-full-migration-board.md)
4. [all-next starter 覆盖扫描](apps/cooliebase/cooliebase-all/docs/architecture/artifacts/all-next-starter-coverage-2026-08-02.md)
5. [system/infra 工程任务拆解](apps/cooliebase/cooliebase-all/docs/architecture/yudao-mini-system-infra-task-breakdown.md)
