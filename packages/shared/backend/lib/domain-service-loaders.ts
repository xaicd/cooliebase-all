/**
 * 各域 services 的**静态** loader 映射（两级: 域 -> 模块）。
 *
 * 由 scripts/generate-domain-service-loaders.cjs 从 rpc-actions.json 生成，**勿手改**
 * （加了域或模块后跑该脚本重生成；--check 是门禁）。
 *
 * 为什么不能用模板字符串动态 import:
 *   broker 原先写 import(`@/modules/${domain}/backend/services/${module}`) ——
 *   这类「前缀 + 动态段」Turbopack 无法解析（实测 build 报
 *   'Module not found: Can't resolve \'@/modules/\' <dynamic>' / strip_prefix prefix is too long），
 *   改相对路径同样失败。显式列出每条 (域, 模块) 后动态前缀消失。
 *
 * 为什么必须从 catalog 生成:
 *   这张表此前是手工维护的（文件头写着"清单取自 rpc-actions.json"，却没人真的生成它）——
 *   注册新域/新模块时漏登记，跨域调用只会在**运行时**才炸。现在两者同源。
 */

type Loader = () => Promise<Record<string, unknown>>

export const DOMAIN_SERVICE_LOADERS: Record<string, Record<string, Loader>> = {
  "ai": {
    "index": () => import("@/modules/ai/backend/services/index"),
  },
  "bpm": {
    "index": () => import("@/modules/bpm/backend/services/index"),
    "process.service": () => import("@/modules/bpm/backend/services/process.service"),
  },
  "crm": {
    "index": () => import("@/modules/crm/backend/services/index"),
  },
  "erp": {
    "index": () => import("@/modules/erp/backend/services/index"),
  },
  "fms": {
    "fms-account.service": () => import("@/modules/fms/backend/services/fms-account.service"),
    "fms-reconcile.service": () => import("@/modules/fms/backend/services/fms-reconcile.service"),
    "fms-voucher.service": () => import("@/modules/fms/backend/services/fms-voucher.service"),
  },
  "hrm": {
    "hrm-employee.service": () => import("@/modules/hrm/backend/services/hrm-employee.service"),
    "hrm-payroll.service": () => import("@/modules/hrm/backend/services/hrm-payroll.service"),
    "hrm-position.service": () => import("@/modules/hrm/backend/services/hrm-position.service"),
  },
  "im": {
    "index": () => import("@/modules/im/backend/services/index"),
  },
  "infra": {
    "api-access-log.service": () => import("@/modules/infra/backend/services/api-access-log.service"),
    "api-error-log.service": () => import("@/modules/infra/backend/services/api-error-log.service"),
    "audit-log-retention.service": () => import("@/modules/infra/backend/services/audit-log-retention.service"),
    "codegen-engine.service": () => import("@/modules/infra/backend/services/codegen-engine.service"),
    "codegen-table.service": () => import("@/modules/infra/backend/services/codegen-table.service"),
    "config.service": () => import("@/modules/infra/backend/services/config.service"),
    "data-source-config.service": () => import("@/modules/infra/backend/services/data-source-config.service"),
    "file.service": () => import("@/modules/infra/backend/services/file.service"),
    "index": () => import("@/modules/infra/backend/services/index"),
    "job.service": () => import("@/modules/infra/backend/services/job.service"),
    "page.service": () => import("@/modules/infra/backend/services/page.service"),
    "template-engine.service": () => import("@/modules/infra/backend/services/template-engine.service"),
  },
  "iot": {
    "index": () => import("@/modules/iot/backend/services/index"),
  },
  "mall": {
    "index": () => import("@/modules/mall/backend/services/index"),
  },
  "member": {
    "index": () => import("@/modules/member/backend/services/index"),
  },
  "mes": {
    "index": () => import("@/modules/mes/backend/services/index"),
  },
  "mp": {
    "index": () => import("@/modules/mp/backend/services/index"),
  },
  "oa": {
    "oa-attendance.service": () => import("@/modules/oa/backend/services/oa-attendance.service"),
    "oa-leave-apply.service": () => import("@/modules/oa/backend/services/oa-leave-apply.service"),
    "oa-notice.service": () => import("@/modules/oa/backend/services/oa-notice.service"),
  },
  "online": {
    "index": () => import("@/modules/online/backend/services/index"),
    "online-definition.service": () => import("@/modules/online/backend/services/online-definition.service"),
    "online-managed-table.service": () => import("@/modules/online/backend/services/online-managed-table.service"),
  },
  "pay": {
    "index": () => import("@/modules/pay/backend/services/index"),
    "refund.service": () => import("@/modules/pay/backend/services/refund.service"),
  },
  "pms": {
    "pms-milestone.service": () => import("@/modules/pms/backend/services/pms-milestone.service"),
    "pms-project.service": () => import("@/modules/pms/backend/services/pms-project.service"),
    "pms-timesheet.service": () => import("@/modules/pms/backend/services/pms-timesheet.service"),
  },
  "report": {
    "index": () => import("@/modules/report/backend/services/index"),
  },
  "system": {
    "area.service": () => import("@/modules/system/backend/services/area.service"),
    "auth.service": () => import("@/modules/system/backend/services/auth.service"),
    "captcha.service": () => import("@/modules/system/backend/services/captcha.service"),
    "dept.service": () => import("@/modules/system/backend/services/dept.service"),
    "dict.service": () => import("@/modules/system/backend/services/dict.service"),
    "index": () => import("@/modules/system/backend/services/index"),
    "ip-area.service": () => import("@/modules/system/backend/services/ip-area.service"),
    "login-log.service": () => import("@/modules/system/backend/services/login-log.service"),
    "mail-template.service": () => import("@/modules/system/backend/services/mail-template.service"),
    "mail.service": () => import("@/modules/system/backend/services/mail.service"),
    "menu.service": () => import("@/modules/system/backend/services/menu.service"),
    "notice.service": () => import("@/modules/system/backend/services/notice.service"),
    "notify-message.service": () => import("@/modules/system/backend/services/notify-message.service"),
    "notify-template.service": () => import("@/modules/system/backend/services/notify-template.service"),
    "oauth2.service": () => import("@/modules/system/backend/services/oauth2.service"),
    "online-user.service": () => import("@/modules/system/backend/services/online-user.service"),
    "operate-log.service": () => import("@/modules/system/backend/services/operate-log.service"),
    "permission.service": () => import("@/modules/system/backend/services/permission.service"),
    "post.service": () => import("@/modules/system/backend/services/post.service"),
    "role.service": () => import("@/modules/system/backend/services/role.service"),
    "sms-template.service": () => import("@/modules/system/backend/services/sms-template.service"),
    "sms.service": () => import("@/modules/system/backend/services/sms.service"),
    "social-client.service": () => import("@/modules/system/backend/services/social-client.service"),
    "social.service": () => import("@/modules/system/backend/services/social.service"),
    "tenant-entitlement.service": () => import("@/modules/system/backend/services/tenant-entitlement.service"),
    "tenant-package.service": () => import("@/modules/system/backend/services/tenant-package.service"),
    "tenant.service": () => import("@/modules/system/backend/services/tenant.service"),
    "user-profile.service": () => import("@/modules/system/backend/services/user-profile.service"),
    "user.service": () => import("@/modules/system/backend/services/user.service"),
  },
  "wms": {
    "index": () => import("@/modules/wms/backend/services/index"),
    "inventory-stock-ops": () => import("@/modules/wms/backend/services/inventory-stock-ops"),
  },
}
