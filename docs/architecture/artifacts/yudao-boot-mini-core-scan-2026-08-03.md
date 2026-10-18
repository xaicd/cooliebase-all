# yudao-boot-mini 核心基础设施全量扫描

- 生成时间: 2026-08-03T02:27:39.241Z
- 目标仓: cooliebase/yudao-boot-mini

## Framework Starters

| Starter | Java 文件 | AutoConfig | Properties |
|---|---:|---:|---:|
| yudao-spring-boot-starter-biz-data-permission | 15 | 2 | 0 |
| yudao-spring-boot-starter-biz-ip | 5 | 0 | 0 |
| yudao-spring-boot-starter-biz-tenant | 26 | 1 | 1 |
| yudao-spring-boot-starter-excel | 18 | 1 | 0 |
| yudao-spring-boot-starter-job | 9 | 2 | 0 |
| yudao-spring-boot-starter-monitor | 8 | 2 | 1 |
| yudao-spring-boot-starter-mq | 16 | 3 | 0 |
| yudao-spring-boot-starter-mybatis | 24 | 3 | 0 |
| yudao-spring-boot-starter-protection | 29 | 1 | 0 |
| yudao-spring-boot-starter-redis | 5 | 2 | 1 |
| yudao-spring-boot-starter-security | 17 | 1 | 1 |
| yudao-spring-boot-starter-web | 67 | 7 | 4 |
| yudao-spring-boot-starter-websocket | 27 | 1 | 1 |

### yudao-spring-boot-starter-biz-data-permission

- package groups: datapermission(15)
- auto configs: src/main/java/cn/iocoder/yudao/framework/datapermission/config/YudaoDataPermissionAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/datapermission/config/YudaoDeptDataPermissionAutoConfiguration.java
- properties: none

### yudao-spring-boot-starter-biz-ip

- package groups: ip(5)
- auto configs: none
- properties: none

### yudao-spring-boot-starter-biz-tenant

- package groups: tenant(25)
- auto configs: src/main/java/cn/iocoder/yudao/framework/tenant/config/YudaoTenantAutoConfiguration.java
- properties: src/main/java/cn/iocoder/yudao/framework/tenant/config/TenantProperties.java

### yudao-spring-boot-starter-excel

- package groups: excel(12), dict(6)
- auto configs: src/main/java/cn/iocoder/yudao/framework/dict/config/YudaoDictAutoConfiguration.java
- properties: none

### yudao-spring-boot-starter-job

- package groups: quartz(9)
- auto configs: src/main/java/cn/iocoder/yudao/framework/quartz/config/YudaoAsyncAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/quartz/config/YudaoQuartzAutoConfiguration.java
- properties: none

### yudao-spring-boot-starter-monitor

- package groups: tracer(8)
- auto configs: src/main/java/cn/iocoder/yudao/framework/tracer/config/YudaoMetricsAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/tracer/config/YudaoTracerAutoConfiguration.java
- properties: src/main/java/cn/iocoder/yudao/framework/tracer/config/TracerProperties.java

### yudao-spring-boot-starter-mq

- package groups: mq(16)
- auto configs: src/main/java/cn/iocoder/yudao/framework/mq/rabbitmq/config/YudaoRabbitMQAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/mq/redis/config/YudaoRedisMQConsumerAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/mq/redis/config/YudaoRedisMQProducerAutoConfiguration.java
- properties: none

### yudao-spring-boot-starter-mybatis

- package groups: mybatis(17), datasource(4), translate(3)
- auto configs: src/main/java/cn/iocoder/yudao/framework/datasource/config/YudaoDataSourceAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/mybatis/config/YudaoMybatisAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/translate/config/YudaoTranslateAutoConfiguration.java
- properties: none

### yudao-spring-boot-starter-protection

- package groups: ratelimiter(11), idempotent(9), signature(5), lock4j(4)
- auto configs: src/main/java/cn/iocoder/yudao/framework/signature/config/YudaoApiSignatureAutoConfiguration.java
- properties: none

### yudao-spring-boot-starter-redis

- package groups: redis(5)
- auto configs: src/main/java/cn/iocoder/yudao/framework/redis/config/YudaoCacheAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/redis/config/YudaoRedisAutoConfiguration.java
- properties: src/main/java/cn/iocoder/yudao/framework/redis/config/YudaoCacheProperties.java

### yudao-spring-boot-starter-security

- package groups: security(13), operatelog(4)
- auto configs: src/main/java/cn/iocoder/yudao/framework/security/config/YudaoSecurityAutoConfiguration.java
- properties: src/main/java/cn/iocoder/yudao/framework/security/config/SecurityProperties.java

### yudao-spring-boot-starter-web

- package groups: desensitize(26), web(10), xss(8), encrypt(7), apilog(6), swagger(4), banner(3), jackson(2), package-info.java(1)
- auto configs: src/main/java/cn/iocoder/yudao/framework/apilog/config/YudaoApiLogAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/banner/config/YudaoBannerAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/encrypt/config/YudaoApiEncryptAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/jackson/config/YudaoJacksonAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/swagger/config/YudaoSwaggerAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/web/config/YudaoWebAutoConfiguration.java, src/main/java/cn/iocoder/yudao/framework/xss/config/YudaoXssAutoConfiguration.java
- properties: src/main/java/cn/iocoder/yudao/framework/encrypt/config/ApiEncryptProperties.java, src/main/java/cn/iocoder/yudao/framework/swagger/config/SwaggerProperties.java, src/main/java/cn/iocoder/yudao/framework/web/config/WebProperties.java, src/main/java/cn/iocoder/yudao/framework/xss/config/XssProperties.java

### yudao-spring-boot-starter-websocket

- package groups: websocket(27)
- auto configs: src/main/java/cn/iocoder/yudao/framework/websocket/config/YudaoWebSocketAutoConfiguration.java
- properties: src/main/java/cn/iocoder/yudao/framework/websocket/config/WebSocketProperties.java

## Core Modules

| Module | Java 文件 | Controller | ServiceImpl | Mapper | DO | Enum | admin API | app API |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| yudao-module-system | 419 | 35 | 36 | 32 | 32 | 18 | 32 | 3 |
| yudao-module-infra | 205 | 16 | 15 | 22 | 16 | 11 | 15 | 1 |

### yudao-module-system admin controllers

- controller/admin/auth/AuthController.java
- controller/admin/captcha/CaptchaController.java
- controller/admin/dept/DeptController.java
- controller/admin/dept/PostController.java
- controller/admin/dict/DictDataController.java
- controller/admin/dict/DictTypeController.java
- controller/admin/ip/AreaController.java
- controller/admin/logger/LoginLogController.java
- controller/admin/logger/OperateLogController.java
- controller/admin/mail/MailAccountController.java
- controller/admin/mail/MailLogController.java
- controller/admin/mail/MailTemplateController.java
- controller/admin/notice/NoticeController.java
- controller/admin/notify/NotifyMessageController.java
- controller/admin/notify/NotifyTemplateController.java
- controller/admin/oauth2/OAuth2ClientController.java
- controller/admin/oauth2/OAuth2OpenController.java
- controller/admin/oauth2/OAuth2TokenController.java
- controller/admin/oauth2/OAuth2UserController.java
- controller/admin/permission/MenuController.java
- controller/admin/permission/PermissionController.java
- controller/admin/permission/RoleController.java
- controller/admin/sms/SmsCallbackController.java
- controller/admin/sms/SmsChannelController.java
- controller/admin/sms/SmsLogController.java
- controller/admin/sms/SmsTemplateController.java
- controller/admin/socail/SocialClientController.java
- controller/admin/socail/SocialUserController.java
- controller/admin/tenant/TenantController.java
- controller/admin/tenant/TenantPackageController.java
- controller/admin/user/UserController.java
- controller/admin/user/UserProfileController.java

### yudao-module-system app controllers

- controller/app/dict/AppDictDataController.java
- controller/app/ip/AppAreaController.java
- controller/app/tenant/AppTenantController.java

### yudao-module-infra admin controllers

- controller/admin/codegen/CodegenController.java
- controller/admin/config/ConfigController.java
- controller/admin/db/DataSourceConfigController.java
- controller/admin/demo/demo01/Demo01ContactController.java
- controller/admin/demo/demo02/Demo02CategoryController.java
- controller/admin/demo/demo03/erp/Demo03StudentErpController.java
- controller/admin/demo/demo03/inner/Demo03StudentInnerController.java
- controller/admin/demo/demo03/normal/Demo03StudentNormalController.java
- controller/admin/file/FileConfigController.java
- controller/admin/file/FileController.java
- controller/admin/job/JobController.java
- controller/admin/job/JobLogController.java
- controller/admin/logger/ApiAccessLogController.java
- controller/admin/logger/ApiErrorLogController.java
- controller/admin/redis/RedisController.java

### yudao-module-infra app controllers

- controller/app/file/AppFileController.java

## SQL Footprint

- mysql total tables: 48
- top prefixes: system_oauth2(5), system_sms(4), infra_file(3), system_mail(3), system_social(3), yudao_demo03(3), infra_api(2), infra_codegen(2), infra_job(2), system_dict(2), system_notify(2), system_role(2), system_tenant(2), system_user(2), infra_config(1), infra_data(1), system_dept(1), system_login(1), system_menu(1), system_notice(1)

## Mini UI Snapshot

- ui exists: true
- ui root: yudao-ui/yudao-ui-admin-vue3/src
- view domains: mes
- api domains: mes
- system vue/api: 0/0
- infra vue/api: 0/0

## 结论

1. 该扫描专门针对 yudao-boot-mini，避免和 cooliebase-vue-pro 口径混淆。
2. 核心能力主轴是 framework starters + system + infra。
3. 迁移时应优先复刻 starter 能力，再映射 system/infra API。
