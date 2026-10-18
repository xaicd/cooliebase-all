# all-next 对 yudao-boot-mini starter 覆盖扫描

- 生成时间: 2026-08-03T01:53:47.546Z
- 口径: signal 匹配（用于迁移优先级，不作为最终功能验收）

| Starter | 状态 | 命中信号 | 缺失信号 |
|---|---|---|---|
| web (web/apilog/encrypt/xss/swagger) | DONE | api-logs,swagger,encrypt,xss | none |
| security (security) | DONE | permission-guard,permissions,audit-log | none |
| mybatis (mybatis/datasource/translate) | DONE | datasource,mapper,translate | none |
| redis (redis/cache) | DONE | redis,cache | none |
| protection (idempotent/ratelimiter/lock/signature) | DONE | idempotent,rate,lock,signature | none |
| job (job/quartz) | DONE | job-center,cron | none |
| mq (mq/rabbit/kafka) | DONE | mq,kafka,rabbit | none |
| websocket (websocket) | DONE | websocket,ws | none |
| monitor (monitor/metrics/tracer) | DONE | metrics,tracer,monitor | none |
| excel (excel/dict) | DONE | excel,dict | none |
| biz-tenant (biz-tenant) | DONE | tenant,tenant-package | none |
| biz-data-permission (biz-data-permission) | DONE | data-permission,scope,permission | none |
| biz-ip (biz-ip) | DONE | ip,area | none |

## web

- 状态: DONE
- 命中: api-logs, swagger, encrypt, xss
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/infra/api-logs/page.tsx
  - apps/cooliebase-all/src/app/api/admin/infra/api-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/swagger/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/web-protection-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/web-crypto.ts
  - apps/cooliebase-all/src/backend/lib/web-swagger.ts
  - apps/cooliebase-all/src/backend/lib/web-xss.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/__tests__/infra-services.test.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/api-log.service.ts
  - apps/cooliebase-all/packages/domains/infra/frontend/pages/api-logs.page.tsx

## security

- 状态: DONE
- 命中: permission-guard, permissions, audit-log
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/api/admin/bpm/process-definitions/route.ts
  - apps/cooliebase-all/src/app/api/admin/bpm/tasks/route.ts
  - apps/cooliebase-all/src/app/api/admin/crm/clues/route.ts
  - apps/cooliebase-all/src/app/api/admin/crm/customers/route.ts
  - apps/cooliebase-all/src/app/api/admin/crm/followups/route.ts
  - apps/cooliebase-all/src/app/api/admin/erp/orders/route.ts
  - apps/cooliebase-all/src/app/api/admin/erp/products/route.ts
  - apps/cooliebase-all/src/app/api/admin/erp/stock-adjustments/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/api-error-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/api-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/db-configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/file-configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/files/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/swagger/route.ts

## mybatis

- 状态: DONE
- 命中: datasource, mapper, translate
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/persistence-datasource.ts
  - apps/cooliebase-all/src/backend/lib/persistence-mapper.ts
  - apps/cooliebase-all/src/backend/lib/persistence-translate.ts
  - apps/cooliebase-all/src/backend/lib/platform-excel-dict.ts

## redis

- 状态: DONE
- 命中: redis, cache
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/infra/redis/page.tsx
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/cache-store.ts
  - apps/cooliebase-all/src/backend/lib/platform-mq.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/infra-log-audit.test.ts
  - apps/cooliebase-all/src/backend/services/infra-redis.service.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/index.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/redis.service.ts
  - apps/cooliebase-all/packages/domains/infra/frontend/pages/redis.page.tsx

## protection

- 状态: DONE
- 命中: idempotent, rate, lock, signature
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/system/operate-logs/page.tsx
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/template-engine-archive.test.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/auth/captcha/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/operate-logs/export/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/operate-logs/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/idempotent-lock-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/web-protection-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/protection-idempotent.ts
  - apps/cooliebase-all/src/backend/lib/protection-lock.ts
  - apps/cooliebase-all/src/backend/lib/protection-signature.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-auth-oauth2.service.test.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-dict-notice-notify.service.test.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/infra-log-audit.test.ts

## job

- 状态: DONE
- 命中: job-center, cron
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/infra/job-center/page.tsx
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/services/__tests__/infra-services.test.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/infra-job-center.service.ts
  - apps/cooliebase-all/src/backend/services/infra-log-audit.test.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/__tests__/infra-services.test.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/index.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/job-center.service.ts
  - apps/cooliebase-all/packages/domains/infra/frontend/pages/job-center.page.tsx

## mq

- 状态: DONE
- 命中: mq, kafka, rabbit
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/platform-mq.ts

## websocket

- 状态: DONE
- 命中: websocket, ws
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/route.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/platform-excel-dict.ts
  - apps/cooliebase-all/src/backend/lib/platform-websocket.ts
  - apps/cooliebase-all/src/backend/validators/infra.validator.ts
  - apps/cooliebase-all/packages/domains/bpm/backend/services/process.service.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/__tests__/template-engine.service.test.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-engine-presets.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/index.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/next-react-admin-workflow-client.template.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/next-react-admin-workflow-route.template.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/next-react-admin-workflow-service.template.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/next-react-admin-workflow-validator.template.ts
  - apps/cooliebase-all/packages/domains/infra/frontend/pages/template-engine.page.tsx
  - apps/cooliebase-all/packages/domains/system/backend/services/auth.service.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/dept.service.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/login-log.service.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/menu.service.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/online-user.service.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/operate-log.service.ts

## monitor

- 状态: DONE
- 命中: metrics, tracer, monitor
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/platform-monitor.ts
  - apps/cooliebase-all/src/backend/services/infra-log-audit.test.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/redis.service.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/next-react-admin-domain-api-index.template.ts
  - apps/cooliebase-all/packages/domains/infra/backend/services/template-presets/next-react-admin-report-page.template.ts

## excel

- 状态: DONE
- 命中: excel, dict
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/system/dicts/page.tsx
  - apps/cooliebase-all/src/app/api/admin/system/dicts/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/persistence-translate.ts
  - apps/cooliebase-all/src/backend/lib/platform-excel-dict.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-dict-notice-notify.service.test.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/system-dict.service.ts
  - apps/cooliebase-all/src/backend/services/system-log-audit.test.ts
  - apps/cooliebase-all/src/backend/validators/system.validator.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/__tests__/system-persistence-services.test.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/dict.service.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/index.ts
  - apps/cooliebase-all/packages/domains/system/frontend/pages/dicts.page.tsx

## biz-tenant

- 状态: DONE
- 命中: tenant, tenant-package
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/system/tenant-packages/page.tsx
  - apps/cooliebase-all/src/app/(admin)/admin/system/tenants/page.tsx
  - apps/cooliebase-all/src/app/api/admin/system/tenant-packages/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/tenants/assign-package/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/tenants/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/tenants/update-status/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/biz-tenant.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-tenant.service.test.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/system-log-audit.test.ts
  - apps/cooliebase-all/src/backend/services/system-tenant-package.service.ts
  - apps/cooliebase-all/src/backend/services/system-tenant.service.ts
  - apps/cooliebase-all/src/backend/validators/system.validator.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/__tests__/tenant-package.service.test.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/__tests__/tenant.service.test.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/index.ts
  - apps/cooliebase-all/packages/domains/system/backend/services/tenant-package.service.ts

## biz-data-permission

- 状态: DONE
- 命中: data-permission, scope, permission
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/api/admin/bpm/process-definitions/route.ts
  - apps/cooliebase-all/src/app/api/admin/bpm/tasks/route.ts
  - apps/cooliebase-all/src/app/api/admin/crm/clues/route.ts
  - apps/cooliebase-all/src/app/api/admin/crm/customers/route.ts
  - apps/cooliebase-all/src/app/api/admin/crm/followups/route.ts
  - apps/cooliebase-all/src/app/api/admin/erp/orders/route.ts
  - apps/cooliebase-all/src/app/api/admin/erp/products/route.ts
  - apps/cooliebase-all/src/app/api/admin/erp/stock-adjustments/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/api-error-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/api-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/db-configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/file-configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/files/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/swagger/route.ts

## biz-ip

- 状态: DONE
- 命中: ip, area
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/system/ip-areas/page.tsx
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/template-engine-archive.test.ts
  - apps/cooliebase-all/src/app/api/admin/infra/codegen/export/template-engine-archive.ts
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/ip/areas/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/web-protection-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/biz-ip-area.ts
  - apps/cooliebase-all/src/backend/lib/web-crypto.ts
  - apps/cooliebase-all/src/backend/lib/web-swagger.ts
  - apps/cooliebase-all/src/backend/lib/web-xss.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-dict-notice-notify.service.test.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-notice-notify-persistence.test.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-sms-mail-social-persistence.test.ts
  - apps/cooliebase-all/src/backend/services/__tests__/system-sys5.service.test.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/system-ip-area.service.ts
