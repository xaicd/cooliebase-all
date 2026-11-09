/**
 * Kysely 数据库 Schema 类型定义
 * 与 prisma/schema.prisma 保持同步
 *
 * 命名规则：表名 = snake_case，与数据库实际表名一致
 */

import type { Generated, ColumnType } from "kysely"

// === System 域 ===

export interface SystemUserTable {
  id: Generated<string>
  username: string
  nickname: string
  password: string
  salt: string
  phone: string | null
  email: string | null
  avatar: string | null
  status: string
  dept_id: string | null
  remark: string | null
  login_ip: string | null
  login_date: ColumnType<Date, string | undefined, string | undefined>
  tenant_id: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemRoleTable {
  id: Generated<string>
  name: string
  code: string
  sort: number
  status: string
  remark: string | null
  data_scope: string
  tenant_id: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemUserRoleTable {
  id: Generated<string>
  user_id: string
  role_id: string
}

export interface SystemMenuTable {
  id: Generated<string>
  name: string
  permission: string | null
  type: string
  parent_id: string | null
  path: string | null
  component: string | null
  icon: string | null
  sort: number
  status: string
  visible: Generated<boolean>
  keep_alive: Generated<boolean>
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemRoleMenuTable {
  id: Generated<string>
  role_id: string
  menu_id: string
}

export interface SystemDeptTable {
  id: Generated<string>
  name: string
  parent_id: string | null
  sort: number
  leader_id: string | null
  phone: string | null
  email: string | null
  status: string
  tenant_id: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemPostTable {
  id: Generated<string>
  name: string
  code: string
  sort: number
  status: string
  remark: string | null
  tenant_id: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemUserPostTable {
  id: Generated<string>
  user_id: string
  post_id: string
}

export interface SystemDictTypeTable {
  id: Generated<string>
  name: string
  type: string
  status: string
  remark: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemDictDataTable {
  id: Generated<string>
  dict_type_id: string
  label: string
  value: string
  sort: number
  status: string
  color_type: string | null
  remark: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemTenantTable {
  id: Generated<string>
  tenant_code: string
  name: string
  contact_name: string | null
  contact_phone: string | null
  domain: string | null
  package_id: string | null
  status: string
  effective_at: Date
  expire_time: Date | null
  account_limit: number | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemTenantPackageTable {
  id: string
  name: string
  status: string
  account_limit: number | null
  remark: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemTenantPackageMenuTable {
  id: string
  package_id: string
  menu_id: string
}

export interface SystemTenantSubscriptionTable {
  id: string
  tenant_id: string
  package_id: string
  effective_at: Date
  expire_at: Date | null
  account_limit: number | null
  status: string
  change_type: string
  remark: string | null
  created_by: string | null
  created_at: Generated<Date>
}

export interface SystemNoticeTable {
  id: Generated<string>
  title: string
  content: string
  type: string
  status: string
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemAreaTable {
  id: Generated<string>
  name: string
  parent_id: string | null
  level: number
  status: string
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemNotifyTemplateTable {
  id: Generated<string>
  code: string
  name: string
  channel: string
  content: string
  params: string
  status: string
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface SystemNotifyMessageTable {
  id: Generated<string>
  template_code: string
  template_name: string
  channel: string
  receiver: string
  content: string
  read_status: Generated<boolean>
  created_at: Generated<Date>
  deleted: Generated<boolean>
}

export interface SystemLoginLogTable {
  id: Generated<string>
  user_id: string | null
  username: string
  user_ip: string
  user_agent: string | null
  result: string
  remark: string | null
  tenant_id: string | null
  created_at: Generated<Date>
}

export interface SystemOperateLogTable {
  id: Generated<string>
  user_id: string | null
  module: string
  name: string
  type: string
  request_method: string
  request_url: string
  content: string | null
  result_code: number
  duration: number
  user_ip: string | null
  tenant_id: string | null
  created_at: Generated<Date>
}

// === Infra 域 ===

export interface InfraConfigTable {
  id: Generated<string>
  category: string
  name: string
  config_key: string
  value: string
  visible: Generated<boolean>
  remark: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

// 🆕 system_config：SQLite bootstrap 实际存在的通用配置表（key/value:TEXT）。
// 注意与 infra_config 区分：SQLite 下只有 system_config；appearance 等运行时配置存这里。
export interface SystemConfigTable {
  id: Generated<string>
  category: Generated<string>
  name: string
  key: string
  value: string
  type: Generated<string>
  visible: Generated<boolean>
  tenant_id: Generated<string>
  created_by: Generated<string>
  created_at: Generated<Date>
  updated_by: Generated<string>
  updated_at: Generated<Date>
  deleted: Generated<boolean>
  deleted_at: Date | null
  remark: string | null
}

// 🆕 member_user：C 端会员用户（app 端注册/登录主体）。tenant_id 无数据库默认值：必须由调用方显式写入（§4.8）。
export interface MemberUserTable {
  id: string
  account: string
  email: string | null
  password_hash: string
  password_salt: string
  nickname: string
  avatar_url: string | null
  status: Generated<string>
  member_level: Generated<string>
  extra_fields: string | null
  tenant_id: string
  created_by: Generated<string>
  created_at: Generated<Date>
  updated_by: Generated<string>
  updated_at: Generated<Date>
  deleted: Generated<boolean>
  deleted_at: Date | null
  remark: string | null
}

export interface InfraJobTable {
  id: Generated<string>
  name: string
  handler_name: string
  handler_param: string | null
  cron_expression: string
  retry_count: number
  retry_interval: number
  status: string
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface InfraJobLogTable {
  id: Generated<string>
  job_id: string
  handler_name: string
  begin_time: Date
  end_time: Date | null
  duration: number
  status: string
  result: string | null
  created_at: Generated<Date>
}

export interface InfraApiAccessLogTable {
  id: Generated<string>
  trace_id: string | null
  user_id: string | null
  tenant_id: string | null
  application_name: string
  request_method: string
  request_url: string
  request_params: string | null
  response_body: string | null
  result_code: number
  duration: number
  user_ip: string | null
  user_agent: string | null
  operation: string | null
  created_at: Generated<Date>
}

export interface InfraApiErrorLogTable {
  id: Generated<string>
  trace_id: string | null
  user_id: string | null
  tenant_id: string | null
  application_name: string
  request_method: string
  request_url: string
  request_params: string | null
  exception_name: string
  exception_message: string
  exception_stack: string | null
  error_code: string | null
  root_cause: string | null
  status: string
  processed_at: Date | null
  processed_by: string | null
  process_note: string | null
  user_ip: string | null
  user_agent: string | null
  created_at: Generated<Date>
}

export interface InfraFileConfigTable {
  id: Generated<string>
  name: string
  storage: string
  config: string
  master: Generated<boolean>
  remark: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface InfraDataSourceConfigTable {
  id: string
  tenant_id: string | null
  name: string
  driver: string
  url: string
  username: string
  encrypted_password: string
  remark: string | null
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface InfraFileTable {
  id: Generated<string>
  config_id: string
  name: string | null
  path: string
  url: string
  type: string | null
  size: number
  created_at: Generated<Date>
}

export interface InfraMessageOutboxTable {
  id: string
  event_id: string
  subject: string
  type: string
  source: string
  payload: string
  headers: string
  status: string
  attempts: number
  tenant_id: string | null
  created_at: Date
  published_at: Date | null
}

export interface InfraMessageInboxTable {
  id: string
  consumer: string
  event_id: string
  processed_at: Date
}

// === 顶层 DB 接口（Kysely 入口） ===

export interface DB {
  // System
  system_user: SystemUserTable
  system_role: SystemRoleTable
  system_user_role: SystemUserRoleTable
  system_menu: SystemMenuTable
  system_role_menu: SystemRoleMenuTable
  system_dept: SystemDeptTable
  system_post: SystemPostTable
  system_user_post: SystemUserPostTable
  system_dict_type: SystemDictTypeTable
  system_dict_data: SystemDictDataTable
  system_tenant: SystemTenantTable
  system_tenant_package: SystemTenantPackageTable
  system_tenant_package_menu: SystemTenantPackageMenuTable
  system_tenant_subscription: SystemTenantSubscriptionTable
  system_notice: SystemNoticeTable
  system_area: SystemAreaTable
  system_notify_template: SystemNotifyTemplateTable
  system_notify_message: SystemNotifyMessageTable
  system_login_log: SystemLoginLogTable
  system_operate_log: SystemOperateLogTable

  // Infra
  infra_config: InfraConfigTable
  system_config: SystemConfigTable
  member_user: MemberUserTable
  infra_job: InfraJobTable
  infra_job_log: InfraJobLogTable
  infra_api_access_log: InfraApiAccessLogTable
  infra_api_error_log: InfraApiErrorLogTable
  infra_data_source_config: InfraDataSourceConfigTable
  infra_file_config: InfraFileConfigTable
  infra_file: InfraFileTable
  infra_message_outbox: InfraMessageOutboxTable
  infra_message_inbox: InfraMessageInboxTable

  // Online
  online_definition: OnlineDefinitionTable
  online_revision: OnlineRevisionTable
  online_field: OnlineFieldTable
  online_index: OnlineIndexTable
  online_relation: OnlineRelationTable
  online_view: OnlineViewTable
  online_action: OnlineActionTable
  online_policy: OnlinePolicyTable
  online_workflow_binding: OnlineWorkflowBindingTable
  online_release: OnlineReleaseTable
  online_schema_change: OnlineSchemaChangeTable
  online_managed_table: OnlineManagedTableTable
  online_test_session: OnlineTestSessionTable
  online_record: OnlineRecordTable
}


// === Online 域 ===

export interface OnlineDefinitionTable {
  id: string
  tenant_id: string
  code: string
  name: string
  model_type: string
  status: string
  current_draft_revision_id: string | null
  published_release_id: string | null
  lock_version: number
  created_by: string
  updated_by: string
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineRevisionTable {
  id: string
  definition_id: string
  tenant_id: string
  sequence: number
  status: string
  schema_revision: number
  model_json: unknown
  interaction_json: unknown
  policy_json: unknown
  workflow_json: unknown
  validation_report: unknown | null
  created_by: string
  published_by: string | null
  published_at: Date | null
  created_at: Generated<Date>
  updated_at: Date
}

export interface OnlineFieldTable {
  id: string
  revision_id: string
  tenant_id: string
  code: string
  label: string
  field_type: string
  required: boolean
  length: number | null
  sort: number
  default_value: string | null
  config: unknown
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineIndexTable {
  id: string
  revision_id: string
  tenant_id: string
  code: string
  fields_json: unknown
  unique: boolean
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineRelationTable {
  id: string
  revision_id: string
  tenant_id: string
  code: string
  relation_type: string
  target_definition_code: string | null
  target_release_id: string | null
  config: unknown
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineViewTable {
  id: string
  revision_id: string
  tenant_id: string
  code: string
  kind: string
  puck_data_json: unknown | null
  component_config_json: unknown
  version: number
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineActionTable {
  id: string
  revision_id: string
  tenant_id: string
  code: string
  action_type: string
  handler_key: string | null
  config: unknown
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlinePolicyTable {
  id: string
  revision_id: string
  tenant_id: string
  code: string
  policy_type: string
  subject_config: unknown
  rule_config: unknown
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineWorkflowBindingTable {
  id: string
  revision_id: string
  tenant_id: string
  provider: string
  process_key: string
  status_field: string
  config: unknown
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

export interface OnlineReleaseTable {
  id: string
  definition_id: string
  revision_id: string
  tenant_id: string
  release_no: number
  snapshot_json: unknown
  schema_revision: number
  checksum: string
  released_by: string
  released_at: Generated<Date>
  rollback_of_release_id: string | null
}

export interface OnlineManagedTableTable {
  id: string
  tenant_id: string
  definition_id: string
  physical_table_name: string
  schema_revision: number
  model_fingerprint: string
  last_plan_id: string | null
  created_at: Generated<Date>
  updated_at: Date
}

export interface OnlineSchemaChangeTable {
  id: string
  definition_id: string
  revision_id: string
  tenant_id: string
  plan_json: unknown
  risk: string
  status: string
  approval: unknown | null
  execution_log: unknown | null
  expected_schema_revision: number
  applied_schema_revision: number | null
  created_by: string
  created_at: Generated<Date>
  updated_at: Date
}

export interface OnlineTestSessionTable {
  id: string
  definition_id: string
  revision_id: string
  release_id: string | null
  tenant_id: string
  actor_id: string
  schema_revision: number
  environment: string
  sandbox: boolean
  started_at: Generated<Date>
  ended_at: Date | null
}


export interface OnlineRecordTable {
  id: string
  tenant_id: string
  definition_id: string
  release_id: string
  test_session_id: string
  schema_revision: number
  data_json: unknown
  created_by: string
  updated_by: string
  created_at: Generated<Date>
  updated_at: Date
  deleted: Generated<boolean>
}

// === AIGW 配额台账 & 运营商渠道 & 租户套餐关联表 ===






