# all-next 对 yudao-boot-mini starter 覆盖扫描

- 生成时间: 2026-08-02T09:32:48.055Z
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
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/swagger/route.ts
  - apps/cooliebase-all/src/app/api/admin/mp/accounts/route.ts
  - apps/cooliebase-all/src/app/api/admin/mp/fans/route.ts
  - apps/cooliebase-all/src/app/api/admin/mp/messages/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/login-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/online-users/route.ts

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
  - apps/cooliebase-all/src/backend/services/system-online-user.service.ts

## protection

- 状态: DONE
- 命中: idempotent, rate, lock, signature
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/(admin)/admin/system/operate-logs/page.tsx
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/operate-logs/route.ts
  - apps/cooliebase-all/src/backend/constants/admin-menu.ts
  - apps/cooliebase-all/src/backend/constants/permissions.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/idempotent-lock-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/web-protection-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/protection-idempotent.ts
  - apps/cooliebase-all/src/backend/lib/protection-lock.ts
  - apps/cooliebase-all/src/backend/lib/protection-signature.ts
  - apps/cooliebase-all/src/backend/services/index.ts
  - apps/cooliebase-all/src/backend/services/infra-job-center.service.ts
  - apps/cooliebase-all/src/backend/services/infra-log-audit.test.ts
  - apps/cooliebase-all/src/backend/services/system-log-audit.test.ts
  - apps/cooliebase-all/src/backend/services/system-operate-log.service.ts

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
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/platform-excel-dict.ts
  - apps/cooliebase-all/src/backend/lib/platform-websocket.ts

## monitor

- 状态: DONE
- 命中: metrics, tracer, monitor
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/platform-monitor.ts
  - apps/cooliebase-all/src/backend/services/infra-log-audit.test.ts
  - apps/cooliebase-all/src/backend/services/infra-redis.service.ts

## excel

- 状态: DONE
- 命中: excel, dict
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/persistence-translate.ts
  - apps/cooliebase-all/src/backend/lib/platform-excel-dict.ts

## biz-tenant

- 状态: DONE
- 命中: tenant, tenant-package
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/biz-tenant.ts

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
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-center/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/job-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/redis/route.ts
  - apps/cooliebase-all/src/app/api/admin/infra/swagger/route.ts
  - apps/cooliebase-all/src/app/api/admin/mp/accounts/route.ts
  - apps/cooliebase-all/src/app/api/admin/mp/fans/route.ts
  - apps/cooliebase-all/src/app/api/admin/mp/messages/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/login-logs/route.ts
  - apps/cooliebase-all/src/app/api/admin/system/online-users/route.ts

## biz-ip

- 状态: DONE
- 命中: ip, area
- 缺失: none
- 证据文件:
  - apps/cooliebase-all/src/app/api/admin/infra/configs/route.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/starter-platform-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/__tests__/web-protection-lib.test.ts
  - apps/cooliebase-all/src/backend/lib/biz-ip-area.ts
  - apps/cooliebase-all/src/backend/lib/web-crypto.ts
  - apps/cooliebase-all/src/backend/lib/web-swagger.ts
  - apps/cooliebase-all/src/backend/lib/web-xss.ts
  - apps/cooliebase-all/src/backend/services/system-login-log.service.ts
