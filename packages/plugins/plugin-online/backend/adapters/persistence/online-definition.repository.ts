import { getKyselyDb, hasRealDatabase } from "@/modules/shared/backend/lib/database"
import { ApiError } from "@/modules/shared/backend/http/api-error"
import type { OnlineDefinitionDetail, OnlineDefinitionPage, OnlineDefinitionSummary, OnlineFieldDetail, OnlineIndexDetail, OnlineModelType, OnlineRelationDetail, OnlineReleaseSummary, OnlineRevisionDetail, OnlineViewDetail } from "../../application/online-definition.contract"
import { compileOnlineViews, failViewValidation, fingerprintOnlineViews } from "../../application/online-view.compiler"
import { parseOnlineInteractionIR } from "../../application/online-interaction.compiler"
import { validateOnlineModelAggregate } from "../../application/online-model.validator"
import { fingerprintOnlineModelIR, parseOnlineModelIR } from "../../application/online-schema-plan.compiler"
import { onlineReleaseChecksum, verifyOnlineReleaseChecksum } from "../../application/online-runtime.compiler"
import { assertSystemFieldsImmutable, createInitialOnlineInteraction, createInitialOnlineModel, mergeSystemFields, mergeSystemInteractions } from "../../application/online-model-defaults"

function requireDatabase(): void {
  if (!hasRealDatabase()) throw new ApiError("DEPENDENCY_UNAVAILABLE", "Online Definition 需要已迁移的 PostgreSQL 数据库，不支持内存持久化")
}

async function validateDraftConfiguration<T>(operation: () => T | Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError("VALIDATION_ERROR", error instanceof Error ? error.message : "Draft 配置无效")
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function date(value: Date | string): string { return value instanceof Date ? value.toISOString() : String(value) }
function mapDefinition(row: any): OnlineDefinitionSummary {
  const currentRelease = row.current_release_id ? {
    id: row.current_release_id,
    releaseNo: row.current_release_no,
    schemaRevision: row.current_release_schema_revision,
    releasedAt: date(row.current_release_released_at),
  } : null
  const latestSchemaPlan = row.latest_plan_id ? {
    id: row.latest_plan_id,
    risk: row.latest_plan_risk,
    status: row.latest_plan_status,
    expectedSchemaRevision: row.latest_plan_expected_schema_revision,
    appliedSchemaRevision: row.latest_plan_applied_schema_revision,
    createdAt: date(row.latest_plan_created_at),
    updatedAt: date(row.latest_plan_updated_at),
  } : null
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    modelType: row.model_type,
    status: row.status,
    lockVersion: row.lock_version,
    currentDraftRevisionId: row.current_draft_revision_id,
    publishedReleaseId: row.published_release_id,
    currentRelease,
    latestSchemaPlan,
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at),
  }
}
function mapRevision(row: any, fields: OnlineFieldDetail[] = [], indexes: OnlineIndexDetail[] = [], relations: OnlineRelationDetail[] = [], views: OnlineViewDetail[] = []): OnlineRevisionDetail {
  return { id: row.id, definitionId: row.definition_id, sequence: row.sequence, status: row.status, schemaRevision: row.schema_revision, model: asRecord(row.model_json), interaction: asRecord(row.interaction_json), policy: asRecord(row.policy_json), workflow: asRecord(row.workflow_json), fields, indexes, relations, views, validationReport: row.validation_report ? asRecord(row.validation_report) : null, createdAt: date(row.created_at), updatedAt: date(row.updated_at) }
}
function mapField(row: any): OnlineFieldDetail {
  return { code: row.code, label: row.label, fieldType: row.field_type, required: row.required, length: row.length, sort: row.sort, defaultValue: row.default_value, config: asRecord(row.config) }
}
function mapIndex(row: any): OnlineIndexDetail { return { code: row.code, fields: Array.isArray(row.fields_json) ? row.fields_json.filter((field: unknown) => typeof field === "string") : [], unique: row.unique } }
function mapRelation(row: any): OnlineRelationDetail {
  const config = asRecord(row.config)
  return {
    code: row.code, type: row.relation_type, sourceField: String(config.sourceField ?? ""),
    targetDefinitionCode: String(row.target_definition_code ?? ""),
    ...(typeof row.target_release_id === "string" && row.target_release_id ? { targetReleaseId: row.target_release_id } : {}),
    targetField: String(config.targetField ?? ""), onDelete: config.onDelete === "SET_NULL" ? "SET_NULL" : "RESTRICT",
  }
}
function mapRelease(row: any): OnlineReleaseSummary {
  return { id: row.id, releaseNo: row.release_no, revisionId: row.revision_id, schemaRevision: row.schema_revision, checksum: row.checksum, releasedAt: date(row.released_at), rollbackOfReleaseId: row.rollback_of_release_id }
}
function mapView(row: any): OnlineViewDetail {
  return { code: row.code, kind: "PUCK", puckData: asRecord(row.puck_data_json), componentConfig: { configVersion: 1 }, version: 1 }
}
function checksum(snapshot: unknown): string { return onlineReleaseChecksum(snapshot) }

const widgetsByScalarType: Record<string, readonly string[]> = {
  string: ["TEXT", "TEXTAREA", "SELECT", "DICTIONARY", "REFERENCE"], text: ["TEXT", "TEXTAREA", "SELECT", "DICTIONARY"],
  integer: ["NUMBER", "SELECT", "DICTIONARY", "REFERENCE"], decimal: ["NUMBER", "SELECT", "DICTIONARY"], boolean: ["SWITCH"],
  date: ["DATE"], datetime: ["DATETIME"], json: ["JSON"],
}
function defaultWidgetForType(type: string): string { return type === "boolean" ? "SWITCH" : type === "integer" || type === "decimal" ? "NUMBER" : type === "date" ? "DATE" : type === "datetime" ? "DATETIME" : type === "json" ? "JSON" : "TEXT" }
function normalizeDraftModel(model: ReturnType<typeof parseOnlineModelIR>): ReturnType<typeof parseOnlineModelIR> {
  return { ...model, fields: model.fields.map((field) => ({ ...field, ...(!["string", "text"].includes(field.type) ? { length: undefined } : {}), ...(field.type !== "decimal" ? { precision: undefined } : {}) })) }
}
function normalizeDraftInteraction(value: unknown, model: ReturnType<typeof parseOnlineModelIR>): Record<string, unknown> {
  const interaction = asRecord(value)
  const fieldTypes = new Map(model.fields.map((field) => [field.code, field.type]))
  const fields = Array.isArray(interaction.fields) ? interaction.fields.map((value) => {
    const field = asRecord(value); const type = fieldTypes.get(String(field.code)); if (!type) return field
    const supported = widgetsByScalarType[type] ?? [defaultWidgetForType(type)]
    const widget = supported.includes(String(field.widget)) ? field.widget : defaultWidgetForType(type)
    const query = asRecord(field.query)
    const queryWidget = query.widget && supported.includes(String(query.widget)) && query.widget !== "REFERENCE" ? query.widget : query.widget ? defaultWidgetForType(type) : undefined
    const next: Record<string, unknown> = { ...field, widget, query: { ...query, ...(queryWidget ? { widget: queryWidget } : {}) } }
    if (![next.widget, queryWidget].some((item) => item === "SELECT" || item === "DICTIONARY")) delete next.dictionaryCode
    return next
  }) : interaction.fields
  return { ...interaction, ...(fields ? { fields } : {}) }
}

function viewScope(definitionCode: string, model: ReturnType<typeof parseOnlineModelIR>, interaction: ReturnType<typeof parseOnlineInteractionIR>, actionRows: readonly any[]) {
  return { definitionCode, fieldCodes: new Set(model.fields.map((field) => field.code)), actionCodes: new Set(actionRows.map((action) => action.code)) }
}

async function readViews(trx: any, tenantId: string, revisionId: string): Promise<OnlineViewDetail[]> {
  const rows = await trx.selectFrom("online_view").selectAll().where("tenant_id", "=", tenantId).where("revision_id", "=", revisionId).where("deleted", "=", false).orderBy("code", "asc").execute()
  return rows.map(mapView)
}

async function syncViews(trx: any, input: { tenantId: string; revisionId: string; views: OnlineViewDetail[] }): Promise<void> {
  await trx.deleteFrom("online_view").where("tenant_id", "=", input.tenantId).where("revision_id", "=", input.revisionId).execute()
  if (!input.views.length) return
  const now = new Date()
  await trx.insertInto("online_view").values(input.views.map((view) => ({ id: crypto.randomUUID(), revision_id: input.revisionId, tenant_id: input.tenantId, code: view.code, kind: view.kind, puck_data_json: view.puckData, component_config_json: view.componentConfig, version: view.version, created_at: now, updated_at: now, deleted: false }))).execute()
}

async function loadViewScope(_trx: any, input: { tenantId: string; revisionId: string; definitionCode: string; model: ReturnType<typeof parseOnlineModelIR>; interaction: ReturnType<typeof parseOnlineInteractionIR> }) {
  return viewScope(input.definitionCode, input.model, input.interaction, input.interaction.actions)
}

async function resolveRelationTargets(trx: any, input: { tenantId: string; definitionCode: string; model: ReturnType<typeof parseOnlineModelIR> }): Promise<ReturnType<typeof parseOnlineModelIR>> {
  const targets = [...new Set(input.model.relations.map((relation) => relation.targetDefinitionCode))]
  if (!targets.length) return input.model
  if (targets.includes(input.definitionCode)) throw new Error("当前阶段不允许 Relation 自引用 Definition")

  const definitions = await trx.selectFrom("online_definition").select(["id", "code", "published_release_id"]).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("code", "in", targets).execute() as Array<{ id: string; code: string; published_release_id: string | null }>
  const definitionByCode = new Map(definitions.map((definition) => [definition.code, definition]))
  for (const target of targets) if (!definitionByCode.has(target)) throw new Error(`关联目标 Definition ${target} 不存在或不属于当前租户`)

  const resolvedRelations = []
  for (const relation of input.model.relations) {
    const target = definitionByCode.get(relation.targetDefinitionCode)!
    const releaseId = relation.targetReleaseId ?? target.published_release_id
    if (!releaseId) throw new Error(`关联 ${relation.code} 的目标 Definition ${relation.targetDefinitionCode} 尚未发布 Release`)
    const release = await trx.selectFrom("online_release").select(["id", "definition_id", "snapshot_json", "checksum"]).where("id", "=", releaseId).where("tenant_id", "=", input.tenantId).where("definition_id", "=", target.id).executeTakeFirst()
    if (!release) throw new Error(`关联 ${relation.code} 的 targetReleaseId 不属于当前租户目标 Definition`)
    verifyOnlineReleaseChecksum(release.snapshot_json, release.checksum)
    const snapshot = asRecord(release.snapshot_json)
    const snapshotDefinition = asRecord(snapshot.definition)
    if (snapshotDefinition.code !== target.code) throw new Error(`关联 ${relation.code} 的目标 Release Definition 快照不匹配`)
    const snapshotRevision = asRecord(snapshot.revision)
    const targetModel = parseOnlineModelIR(snapshotRevision.model)
    if (!targetModel.fields.some((field) => field.code === relation.targetField)) throw new Error(`关联 ${relation.code} 的目标字段 ${relation.targetDefinitionCode}.${relation.targetField} 不存在于固定 Release`)
    resolvedRelations.push({ ...relation, targetReleaseId: release.id })
  }
  return { ...input.model, relations: resolvedRelations }
}

async function resolveMasterDetailTargets(trx: any, input: { tenantId: string; definitionCode: string; interaction: ReturnType<typeof parseOnlineInteractionIR> }): Promise<ReturnType<typeof parseOnlineInteractionIR>> {
  const masterDetail = input.interaction.masterDetail
  if (!masterDetail?.children.length) return input.interaction
  const targets = [...new Set(masterDetail.children.map((child) => child.targetDefinitionCode))]
  if (targets.includes(input.definitionCode)) throw new Error("MASTER_DETAIL 当前阶段不允许定义自引用子表")
  const definitions = await trx.selectFrom("online_definition").select(["id", "code", "published_release_id"]).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("code", "in", targets).execute() as Array<{ id: string; code: string; published_release_id: string | null }>
  const definitionByCode = new Map(definitions.map((definition) => [definition.code, definition]))
  for (const target of targets) if (!definitionByCode.has(target)) throw new Error(`主子表目标 Definition ${target} 不存在或不属于当前租户`)

  const children = []
  for (const child of masterDetail.children) {
    const target = definitionByCode.get(child.targetDefinitionCode)!
    const releaseId = child.targetReleaseId ?? target.published_release_id
    if (!releaseId) throw new Error(`主子表子定义 ${child.code} 的目标 ${child.targetDefinitionCode} 尚未发布 Release`)
    const release = await trx.selectFrom("online_release").select(["id", "definition_id", "snapshot_json", "checksum"]).where("id", "=", releaseId).where("tenant_id", "=", input.tenantId).where("definition_id", "=", target.id).executeTakeFirst()
    if (!release) throw new Error(`主子表子定义 ${child.code} 的 targetReleaseId 不属于当前租户目标 Definition`)
    verifyOnlineReleaseChecksum(release.snapshot_json, release.checksum)
    const snapshot = asRecord(release.snapshot_json)
    const snapshotDefinition = asRecord(snapshot.definition)
    if (snapshotDefinition.code !== target.code) throw new Error(`主子表子定义 ${child.code} 的目标 Release Definition 快照不匹配`)
    const targetModel = parseOnlineModelIR(asRecord(snapshot.revision).model)
    const foreignKey = targetModel.fields.find((field) => field.code === child.foreignKeyField)
    if (!foreignKey || foreignKey.systemManaged) throw new Error(`主子表子定义 ${child.code} 的 child foreignKeyField ${child.foreignKeyField} 不存在或不可写`)
    if (foreignKey.type !== "string") throw new Error(`主子表子定义 ${child.code} 的 foreignKeyField 必须是 string 类型以保存主记录 ID`)
    children.push({ ...child, targetReleaseId: release.id })
  }
  return { ...input.interaction, masterDetail: { ...masterDetail, children } }
}

async function syncFieldProjection(trx: any, input: { tenantId: string; revisionId: string; model: ReturnType<typeof parseOnlineModelIR>; interaction: ReturnType<typeof parseOnlineInteractionIR> }): Promise<void> {
  await trx.deleteFrom("online_field").where("tenant_id", "=", input.tenantId).where("revision_id", "=", input.revisionId).execute()
  if (!input.model.fields.length) return
  const interactionByCode = new Map(input.interaction.fields.map((field) => [field.code, field]))
  const now = new Date()
  await trx.insertInto("online_field").values(input.model.fields.map((field, sort) => {
    const display = interactionByCode.get(field.code)
    return {
      id: crypto.randomUUID(), revision_id: input.revisionId, tenant_id: input.tenantId, code: field.code,
      label: display?.label ?? field.code, field_type: field.type, required: !field.nullable, length: field.length ?? null,
      sort, default_value: field.default === undefined || field.default === null ? null : String(field.default),
      config: { ...(display ?? {}), remark: field.remark, precision: field.precision, identity: field.identity, systemTemplate: field.systemTemplate }, created_at: now, updated_at: now, deleted: false,
    }
  })).execute()
}

async function syncIndexProjection(trx: any, input: { tenantId: string; revisionId: string; model: ReturnType<typeof parseOnlineModelIR> }): Promise<void> {
  await trx.deleteFrom("online_index").where("tenant_id", "=", input.tenantId).where("revision_id", "=", input.revisionId).execute()
  if (!input.model.indexes.length) return
  const now = new Date()
  await trx.insertInto("online_index").values(input.model.indexes.map((index) => ({ id: crypto.randomUUID(), revision_id: input.revisionId, tenant_id: input.tenantId, code: index.code, fields_json: index.fields, unique: index.unique, created_at: now, updated_at: now, deleted: false }))).execute()
}

async function syncRelationProjection(trx: any, input: { tenantId: string; revisionId: string; model: ReturnType<typeof parseOnlineModelIR> }): Promise<void> {
  await trx.deleteFrom("online_relation").where("tenant_id", "=", input.tenantId).where("revision_id", "=", input.revisionId).execute()
  if (!input.model.relations.length) return
  const now = new Date()
  await trx.insertInto("online_relation").values(input.model.relations.map((relation) => ({ id: crypto.randomUUID(), revision_id: input.revisionId, tenant_id: input.tenantId, code: relation.code, relation_type: relation.type, target_definition_code: relation.targetDefinitionCode, target_release_id: relation.targetReleaseId ?? null, config: { sourceField: relation.sourceField, targetField: relation.targetField, onDelete: relation.onDelete }, created_at: now, updated_at: now, deleted: false }))).execute()
}

async function syncActionProjection(trx: any, input: { tenantId: string; revisionId: string; interaction: ReturnType<typeof parseOnlineInteractionIR> }): Promise<void> {
  await trx.deleteFrom("online_action").where("tenant_id", "=", input.tenantId).where("revision_id", "=", input.revisionId).execute()
  if (!input.interaction.actions.length) return
  const now = new Date()
  await trx.insertInto("online_action").values(input.interaction.actions.map((action) => ({ id: crypto.randomUUID(), revision_id: input.revisionId, tenant_id: input.tenantId, code: action.code, action_type: action.type, handler_key: null, config: { label: action.label, placement: action.placement, order: action.order, enabled: action.enabled }, created_at: now, updated_at: now, deleted: false }))).execute()
}

export class KyselyOnlineDefinitionRepository {
  static async page(input: { tenantId: string; page: number; pageSize: number; keyword?: string; modelType?: string; status?: "DRAFT" | "ACTIVE" }): Promise<Omit<OnlineDefinitionPage, "phase" | "persistence">> {
    requireDatabase()
    const db = await getKyselyDb()
    let base = db.selectFrom("online_definition")
      .where("online_definition.tenant_id", "=", input.tenantId)
      .where("online_definition.deleted", "=", false)
      .where("online_definition.status", "!=", "ARCHIVED")
    if (input.keyword) {
      base = base.where((eb) => eb.or([
        eb("online_definition.code", "ilike", `%${input.keyword}%`),
        eb("online_definition.name", "ilike", `%${input.keyword}%`),
      ]))
    }
    if (input.modelType) base = base.where("online_definition.model_type", "=", input.modelType)
    if (input.status) base = base.where("online_definition.status", "=", input.status)

    const count = await base.select((eb) => eb.fn.countAll<number>().as("count")).executeTakeFirst()
    const latestPlans = db.selectFrom("online_schema_change")
      .select([
        "id as latest_plan_id",
        "definition_id as latest_plan_definition_id",
        "risk as latest_plan_risk",
        "status as latest_plan_status",
        "expected_schema_revision as latest_plan_expected_schema_revision",
        "applied_schema_revision as latest_plan_applied_schema_revision",
        "created_at as latest_plan_created_at",
        "updated_at as latest_plan_updated_at",
      ])
      .where("tenant_id", "=", input.tenantId)
      .distinctOn("definition_id")
      .orderBy("definition_id", "asc")
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .as("latest_plan")
    const rows = await base
      .leftJoin("online_release as current_release", "current_release.id", "online_definition.published_release_id")
      .leftJoin(latestPlans, "latest_plan.latest_plan_definition_id", "online_definition.id")
      .select([
        "online_definition.id",
        "online_definition.code",
        "online_definition.name",
        "online_definition.model_type",
        "online_definition.status",
        "online_definition.current_draft_revision_id",
        "online_definition.published_release_id",
        "online_definition.lock_version",
        "online_definition.created_at",
        "online_definition.updated_at",
        "current_release.id as current_release_id",
        "current_release.release_no as current_release_no",
        "current_release.schema_revision as current_release_schema_revision",
        "current_release.released_at as current_release_released_at",
        "latest_plan.latest_plan_id",
        "latest_plan.latest_plan_risk",
        "latest_plan.latest_plan_status",
        "latest_plan.latest_plan_expected_schema_revision",
        "latest_plan.latest_plan_applied_schema_revision",
        "latest_plan.latest_plan_created_at",
        "latest_plan.latest_plan_updated_at",
      ])
      .orderBy("online_definition.updated_at", "desc")
      .orderBy("online_definition.id", "desc")
      .offset((input.page - 1) * input.pageSize)
      .limit(input.pageSize)
      .execute()
    return { items: rows.map(mapDefinition), total: Number(count?.count ?? 0), page: input.page, pageSize: input.pageSize }
  }

  static async create(input: { tenantId: string; actorId: string; code: string; name: string; modelType: string; model?: Record<string, unknown>; interaction?: Record<string, unknown> }): Promise<OnlineDefinitionSummary> {
    requireDatabase()
    const db = await getKyselyDb()
    return db.transaction().execute(async (trx) => {
      const duplicate = await trx.selectFrom("online_definition").select("id").where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (duplicate) throw new ApiError("CONFLICT", "当前租户已存在相同 code 的 Online Definition")
      const definitionId = crypto.randomUUID()
      const revisionId = crypto.randomUUID()
      const now = new Date()
      const requestedModel = input.model ? parseOnlineModelIR(input.model) : createInitialOnlineModel()
      const initialModel = await resolveRelationTargets(trx, { tenantId: input.tenantId, definitionCode: input.code, model: mergeSystemFields(requestedModel) })
      const requestedInteraction = input.interaction ? parseOnlineInteractionIR(input.interaction, initialModel) : parseOnlineInteractionIR(createInitialOnlineInteraction(initialModel), initialModel)
      const initialInteraction = await resolveMasterDetailTargets(trx, { tenantId: input.tenantId, definitionCode: input.code, interaction: parseOnlineInteractionIR(mergeSystemInteractions(requestedInteraction, initialModel), initialModel) })
      await validateDraftConfiguration(() => validateOnlineModelAggregate(input.modelType as OnlineModelType, input.code, initialModel, initialInteraction))
      await trx.insertInto("online_definition").values({ id: definitionId, tenant_id: input.tenantId, code: input.code, name: input.name, model_type: input.modelType, status: "DRAFT", current_draft_revision_id: null, published_release_id: null, lock_version: 1, created_by: input.actorId, updated_by: input.actorId, created_at: now, updated_at: now, deleted: false }).execute()
      await trx.insertInto("online_revision").values({ id: revisionId, definition_id: definitionId, tenant_id: input.tenantId, sequence: 1, status: "DRAFT", schema_revision: 0, model_json: initialModel, interaction_json: initialInteraction, policy_json: {}, workflow_json: {}, validation_report: null, created_by: input.actorId, published_by: null, published_at: null, created_at: now, updated_at: now }).execute()
      await syncFieldProjection(trx, { tenantId: input.tenantId, revisionId, model: initialModel, interaction: initialInteraction })
      await syncIndexProjection(trx, { tenantId: input.tenantId, revisionId, model: initialModel })
      await syncRelationProjection(trx, { tenantId: input.tenantId, revisionId, model: initialModel })
      await syncActionProjection(trx, { tenantId: input.tenantId, revisionId, interaction: initialInteraction })
      await trx.updateTable("online_definition").set({ current_draft_revision_id: revisionId, updated_at: now }).where("id", "=", definitionId).execute()
      const row = await trx.selectFrom("online_definition").selectAll().where("id", "=", definitionId).executeTakeFirstOrThrow()
      return mapDefinition(row)
    })
  }

  static async detail(input: { tenantId: string; code: string }): Promise<OnlineDefinitionDetail> {
    requireDatabase()
    const db = await getKyselyDb()
    const definition = await db.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
    if (!definition) throw new ApiError("NOT_FOUND", "Online Definition 不存在")
    const [revision, releases] = await Promise.all([
      definition.current_draft_revision_id ? db.selectFrom("online_revision").selectAll().where("id", "=", definition.current_draft_revision_id).where("tenant_id", "=", input.tenantId).executeTakeFirst() : undefined,
      db.selectFrom("online_release").selectAll().where("definition_id", "=", definition.id).where("tenant_id", "=", input.tenantId).orderBy("release_no", "desc").execute(),
    ])
    const [fields, indexes, relations, views] = revision ? await Promise.all([
      db.selectFrom("online_field").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("sort", "asc").execute(),
      db.selectFrom("online_index").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("code", "asc").execute(),
      db.selectFrom("online_relation").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("code", "asc").execute(),
      readViews(db, input.tenantId, revision.id),
    ]) : [[], [], [], []]
    return { ...mapDefinition(definition), revision: revision ? mapRevision(revision, fields.map(mapField), indexes.map(mapIndex), relations.map(mapRelation), views) : null, releases: releases.map(mapRelease) }
  }

  static async updateDefinition(input: { tenantId: string; actorId: string; code: string; name?: string; expectedLockVersion: number }): Promise<OnlineDefinitionSummary> {
    requireDatabase()
    const db = await getKyselyDb()
    const row = await db.updateTable("online_definition").set((eb) => ({ ...(input.name ? { name: input.name } : {}), updated_by: input.actorId, updated_at: new Date(), lock_version: eb("lock_version", "+", 1) } as any)).where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).returningAll().executeTakeFirst()
    if (!row) throw new ApiError("CONFLICT", "Definition 不存在或版本已过期")
    return mapDefinition(row)
  }

  static async archiveDefinition(input: { tenantId: string; actorId: string; code: string; expectedLockVersion: number }): Promise<OnlineDefinitionSummary> {
    requireDatabase()
    const db = await getKyselyDb()
    const row = await db.updateTable("online_definition").set((eb) => ({ status: "ARCHIVED", updated_by: input.actorId, updated_at: new Date(), lock_version: eb("lock_version", "+", 1) } as any)).where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).where("status", "!=", "ARCHIVED").where("lock_version", "=", input.expectedLockVersion).returningAll().executeTakeFirst()
    if (!row) throw new ApiError("CONFLICT", "Definition 不存在、已移除或版本已过期")
    return mapDefinition(row)
  }

  static async deleteDefinition(input: { tenantId: string; actorId: string; code: string; expectedLockVersion: number }): Promise<void> {
    requireDatabase()
    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      const definition = await trx.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (!definition || definition.lock_version !== input.expectedLockVersion) throw new ApiError("CONFLICT", "Definition 不存在或版本已过期")
      if (definition.published_release_id) throw new ApiError("CONFLICT", "已发布 Definition 不能删除，请先使用移除功能归档")
      const reference = await trx.selectFrom("online_relation").select("id").where("tenant_id", "=", input.tenantId).where("target_definition_code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (reference) throw new ApiError("CONFLICT", "Definition 已被其他表单关联，不能删除")
      const changed = await trx.updateTable("online_definition").set({ deleted: true, updated_by: input.actorId, updated_at: new Date(), lock_version: definition.lock_version + 1 }).where("id", "=", definition.id).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).executeTakeFirst()
      if (Number(changed.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Definition 版本已过期")
    })
  }

  static async normalizeSystemFields(input: { tenantId: string; actorId: string; code: string; expectedLockVersion: number }): Promise<OnlineDefinitionDetail> {
    requireDatabase()
    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      const definition = await trx.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (!definition || definition.lock_version !== input.expectedLockVersion || !definition.current_draft_revision_id) throw new ApiError("CONFLICT", "Definition 不存在、无 Draft 或版本已过期")
      const current = await trx.selectFrom("online_revision").selectAll().where("id", "=", definition.current_draft_revision_id).where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).where("status", "in", ["DRAFT", "VALIDATED"]).executeTakeFirst()
      if (!current) throw new ApiError("CONFLICT", "Draft Revision 已被发布或归档")
      const nextModel = await resolveRelationTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, model: parseOnlineModelIR(mergeSystemFields(parseOnlineModelIR(current.model_json))) })
      const nextInteraction = await resolveMasterDetailTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, interaction: parseOnlineInteractionIR(mergeSystemInteractions(parseOnlineInteractionIR(current.interaction_json, parseOnlineModelIR(current.model_json)), nextModel), nextModel) })
      const modelChanged = fingerprintOnlineModelIR(current.model_json) !== fingerprintOnlineModelIR(nextModel)
      const revisionUpdated = await trx.updateTable("online_revision").set({ model_json: nextModel, interaction_json: nextInteraction, status: "DRAFT", validation_report: null, updated_at: new Date() }).where("id", "=", current.id).where("tenant_id", "=", input.tenantId).where("status", "in", ["DRAFT", "VALIDATED"]).executeTakeFirst()
      if (Number(revisionUpdated.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Draft Revision 已被发布或归档")
      await syncFieldProjection(trx, { tenantId: input.tenantId, revisionId: current.id, model: nextModel, interaction: nextInteraction })
      await syncIndexProjection(trx, { tenantId: input.tenantId, revisionId: current.id, model: nextModel })
      await syncRelationProjection(trx, { tenantId: input.tenantId, revisionId: current.id, model: nextModel })
      await syncActionProjection(trx, { tenantId: input.tenantId, revisionId: current.id, interaction: nextInteraction })
      if (modelChanged) await trx.updateTable("online_schema_change").set({ status: "SUPERSEDED", updated_at: new Date() }).where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).where("revision_id", "=", current.id).where("status", "in", ["DRAFT", "REVIEW_REQUIRED", "APPROVED"]).execute()
      const changed = await trx.updateTable("online_definition").set({ updated_by: input.actorId, updated_at: new Date(), lock_version: definition.lock_version + 1 }).where("id", "=", definition.id).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).executeTakeFirst()
      if (Number(changed.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Definition 版本已过期")
    })
    return this.detail({ tenantId: input.tenantId, code: input.code })
  }

  static async updateDraft(input: { tenantId: string; actorId: string; code: string; expectedLockVersion: number; model?: Record<string, unknown>; interaction?: Record<string, unknown>; views?: unknown[]; policy?: Record<string, unknown>; workflow?: Record<string, unknown> }): Promise<OnlineDefinitionDetail> {
    requireDatabase()
    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      const definition = await trx.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (!definition || definition.lock_version !== input.expectedLockVersion || !definition.current_draft_revision_id) throw new ApiError("CONFLICT", "Definition 不存在、无 Draft 或版本已过期")
      const current = await trx.selectFrom("online_revision").selectAll().where("id", "=", definition.current_draft_revision_id).where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).where("status", "in", ["DRAFT", "VALIDATED"]).executeTakeFirst()
      if (!current) throw new ApiError("CONFLICT", "Draft Revision 已被发布或归档")
      const requestedModel = normalizeDraftModel(await validateDraftConfiguration(() => parseOnlineModelIR(input.model ?? current.model_json)))
      const currentModel = await validateDraftConfiguration(() => parseOnlineModelIR(current.model_json))
      await validateDraftConfiguration(() => assertSystemFieldsImmutable(currentModel, requestedModel))
      const nextModel = await validateDraftConfiguration(() => resolveRelationTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, model: requestedModel }))
      const requestedInteraction = await validateDraftConfiguration(() => parseOnlineInteractionIR(normalizeDraftInteraction(input.interaction ?? current.interaction_json, nextModel), nextModel))
      const nextInteraction = await validateDraftConfiguration(() => resolveMasterDetailTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, interaction: requestedInteraction }))
      const modelNeedsPersistence = input.model !== undefined || fingerprintOnlineModelIR(current.model_json) !== fingerprintOnlineModelIR(nextModel)
      const nextViewScope = await loadViewScope(trx, { tenantId: input.tenantId, revisionId: current.id, definitionCode: definition.code, model: nextModel, interaction: nextInteraction })
      let nextViews: OnlineViewDetail[]
      try { nextViews = input.views === undefined ? await readViews(trx, input.tenantId, current.id) : compileOnlineViews(input.views, nextViewScope) } catch (error) { failViewValidation(error) }
      const modelChanged = fingerprintOnlineModelIR(current.model_json) !== fingerprintOnlineModelIR(nextModel)
      const updated = await trx.updateTable("online_revision").set({ ...(modelNeedsPersistence ? { model_json: nextModel } : {}), ...(input.interaction !== undefined ? { interaction_json: nextInteraction } : {}), ...(input.policy ? { policy_json: input.policy } : {}), ...(input.workflow ? { workflow_json: input.workflow } : {}), status: "DRAFT", validation_report: null, updated_at: new Date() }).where("id", "=", current.id).where("tenant_id", "=", input.tenantId).where("status", "in", ["DRAFT", "VALIDATED"]).executeTakeFirst()
      if (Number(updated.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Draft Revision 已被发布或归档")
      if (modelNeedsPersistence || input.interaction !== undefined) {
        await syncFieldProjection(trx, { tenantId: input.tenantId, revisionId: current.id, model: nextModel, interaction: nextInteraction })
        await syncIndexProjection(trx, { tenantId: input.tenantId, revisionId: current.id, model: nextModel })
        await syncRelationProjection(trx, { tenantId: input.tenantId, revisionId: current.id, model: nextModel })
        await syncActionProjection(trx, { tenantId: input.tenantId, revisionId: current.id, interaction: nextInteraction })
      }
      if (input.views !== undefined) await syncViews(trx, { tenantId: input.tenantId, revisionId: current.id, views: nextViews })
      if (modelChanged) await trx.updateTable("online_schema_change").set({ status: "SUPERSEDED", updated_at: new Date() }).where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).where("revision_id", "=", current.id).where("status", "in", ["DRAFT", "REVIEW_REQUIRED", "APPROVED"]).execute()
      const changed = await trx.updateTable("online_definition").set({ updated_by: input.actorId, updated_at: new Date(), lock_version: definition.lock_version + 1 }).where("id", "=", definition.id).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).executeTakeFirst()
      if (Number(changed.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Definition 版本已过期")
    })
    return this.detail({ tenantId: input.tenantId, code: input.code })
  }

  static async validateDraft(input: { tenantId: string; actorId: string; code: string; expectedLockVersion: number }): Promise<OnlineDefinitionDetail> {
    requireDatabase()
    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      const definition = await trx.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (!definition || definition.lock_version !== input.expectedLockVersion || !definition.current_draft_revision_id) throw new ApiError("CONFLICT", "Definition 不存在、无 Draft 或版本已过期")
      const revision = await trx.selectFrom("online_revision").selectAll().where("id", "=", definition.current_draft_revision_id).where("tenant_id", "=", input.tenantId).executeTakeFirst()
      if (!revision || revision.status !== "DRAFT") throw new ApiError("CONFLICT", "仅 DRAFT Revision 可以校验")
      let modelFingerprint: string
      let viewFingerprint: string
      try {
        const model = await resolveRelationTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, model: parseOnlineModelIR(revision.model_json) })
        const interaction = await resolveMasterDetailTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, interaction: parseOnlineInteractionIR(revision.interaction_json, model) })
        validateOnlineModelAggregate(definition.model_type as any, definition.code, model, interaction)
        const storedViews = await readViews(trx, input.tenantId, revision.id)
        const views = compileOnlineViews(storedViews.map(({ code, kind, puckData, version }) => ({ code, kind, puckData, version })), await loadViewScope(trx, { tenantId: input.tenantId, revisionId: revision.id, definitionCode: definition.code, model, interaction }))
        modelFingerprint = fingerprintOnlineModelIR(model)
        viewFingerprint = fingerprintOnlineViews(views)
        const revisionUpdated = await trx.updateTable("online_revision").set({ model_json: model, interaction_json: interaction, status: "VALIDATED", validation_report: { valid: true, validatedAt: new Date().toISOString(), checks: ["model-ir", "field-index-relation-release-pins", "field-interaction-query-validation-ir", "built-in-action-registry", "puck-view-allowlist", "puck-view-references", `${definition.model_type.toLowerCase()}-semantics`], compilerVersion: "2026-08-15", modelFingerprint, viewFingerprint, warnings: ["MANAGED_TABLE 需要在发布前审批并应用 Schema Plan；GENERIC_RECORD 仅用于沙箱测试"] }, updated_at: new Date() }).where("id", "=", revision.id).where("tenant_id", "=", input.tenantId).where("status", "=", "DRAFT").executeTakeFirst()
        if (Number(revisionUpdated.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Draft Revision 已被更新")
        await syncRelationProjection(trx, { tenantId: input.tenantId, revisionId: revision.id, model })
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError("VALIDATION_ERROR", error instanceof Error ? `Online Draft 无效：${error.message}` : "Online Draft 无效")
      }
      const changed = await trx.updateTable("online_definition").set({ updated_by: input.actorId, updated_at: new Date(), lock_version: definition.lock_version + 1 }).where("id", "=", definition.id).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).executeTakeFirst()
      if (Number(changed.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Definition 版本已过期")
    })
    return this.detail({ tenantId: input.tenantId, code: input.code })
  }

  static async publish(input: { tenantId: string; actorId: string; code: string; expectedLockVersion: number }): Promise<OnlineDefinitionDetail> {
    requireDatabase()
    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      const definition = await trx.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (!definition || definition.lock_version !== input.expectedLockVersion || !definition.current_draft_revision_id) throw new ApiError("CONFLICT", "Definition 不存在、无 Draft 或版本已过期")
      const revision = await trx.selectFrom("online_revision").selectAll().where("id", "=", definition.current_draft_revision_id).where("tenant_id", "=", input.tenantId).executeTakeFirst()
      if (!revision || revision.status !== "VALIDATED") throw new ApiError("CONFLICT", "仅已校验的 Revision 可以发布")
      const pendingPlan = await trx.selectFrom("online_schema_change").select(["risk", "status", "applied_schema_revision", "plan_json"]).where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).where("revision_id", "=", revision.id).orderBy("created_at", "desc").executeTakeFirst()
      const managed = parseOnlineModelIR(revision.model_json).storage.kind === "MANAGED_TABLE"
      if (managed) {
        const managedTable = await trx.selectFrom("online_managed_table").selectAll().where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).executeTakeFirst()
        const targetFingerprint = pendingPlan ? String(asRecord(pendingPlan.plan_json).targetFingerprint ?? "") : ""
        if (!pendingPlan || pendingPlan.status !== "APPLIED" || pendingPlan.applied_schema_revision !== revision.schema_revision || !managedTable || managedTable.schema_revision !== revision.schema_revision || managedTable.model_fingerprint !== targetFingerprint) throw new ApiError("CONFLICT", "托管物理表尚未应用当前 Schema Plan；请先审批并应用后发布")
      } else if (pendingPlan && pendingPlan.risk !== "NONE" && pendingPlan.status !== "APPLIED") {
        throw new ApiError("CONFLICT", "Schema Plan 尚未执行；当前模型不能发布待迁移变更")
      }
      const last = await trx.selectFrom("online_release").select("release_no").where("tenant_id", "=", input.tenantId).where("definition_id", "=", definition.id).orderBy("release_no", "desc").executeTakeFirst()
      const model = await resolveRelationTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, model: parseOnlineModelIR(revision.model_json) })
      const interaction = await resolveMasterDetailTargets(trx, { tenantId: input.tenantId, definitionCode: definition.code, interaction: parseOnlineInteractionIR(revision.interaction_json, model) })
      await trx.updateTable("online_revision").set({ model_json: model, interaction_json: interaction, updated_at: new Date() }).where("id", "=", revision.id).where("tenant_id", "=", input.tenantId).execute()
      await syncRelationProjection(trx, { tenantId: input.tenantId, revisionId: revision.id, model })
      const fields = await trx.selectFrom("online_field").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("sort", "asc").execute()
      const indexes = await trx.selectFrom("online_index").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("code", "asc").execute()
      const relations = await trx.selectFrom("online_relation").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("code", "asc").execute()
      const storedViews = await readViews(trx, input.tenantId, revision.id)
      const actionRows = await trx.selectFrom("online_action").selectAll().where("tenant_id", "=", input.tenantId).where("revision_id", "=", revision.id).where("deleted", "=", false).orderBy("code", "asc").execute()
      const views = compileOnlineViews(storedViews.map(({ code, kind, puckData, version }) => ({ code, kind, puckData, version })), viewScope(definition.code, model, interaction, actionRows))
      const snapshot = { definition: { code: definition.code, name: definition.name, modelType: definition.model_type }, revision: { id: revision.id, sequence: revision.sequence, schemaRevision: revision.schema_revision, model, interaction, fields: fields.map(mapField), indexes: indexes.map(mapIndex), relations: relations.map(mapRelation), views, actions: actionRows.map((action) => ({ code: action.code, type: action.action_type, ...asRecord(action.config) })), policy: revision.policy_json, workflow: revision.workflow_json } }
      const releaseId = crypto.randomUUID()
      await trx.insertInto("online_release").values({ id: releaseId, definition_id: definition.id, revision_id: revision.id, tenant_id: input.tenantId, release_no: (last?.release_no ?? 0) + 1, snapshot_json: snapshot, schema_revision: revision.schema_revision, checksum: checksum(snapshot), released_by: input.actorId, released_at: new Date(), rollback_of_release_id: null }).execute()
      await trx.updateTable("online_revision").set({ status: "PUBLISHED", published_by: input.actorId, published_at: new Date(), updated_at: new Date() }).where("id", "=", revision.id).execute()
      const nextRevisionId = crypto.randomUUID()
      await trx.insertInto("online_revision").values({ id: nextRevisionId, definition_id: definition.id, tenant_id: input.tenantId, sequence: revision.sequence + 1, status: "DRAFT", schema_revision: revision.schema_revision, model_json: model, interaction_json: interaction, policy_json: revision.policy_json, workflow_json: revision.workflow_json, validation_report: null, created_by: input.actorId, published_by: null, published_at: null, created_at: new Date(), updated_at: new Date() }).execute()
      await syncViews(trx, { tenantId: input.tenantId, revisionId: nextRevisionId, views })
      const nextModel = model
      const nextInteraction = interaction
      await syncFieldProjection(trx, { tenantId: input.tenantId, revisionId: nextRevisionId, model: nextModel, interaction: nextInteraction })
      await syncIndexProjection(trx, { tenantId: input.tenantId, revisionId: nextRevisionId, model: nextModel })
      await syncRelationProjection(trx, { tenantId: input.tenantId, revisionId: nextRevisionId, model: nextModel })
      await syncActionProjection(trx, { tenantId: input.tenantId, revisionId: nextRevisionId, interaction: nextInteraction })
      const changed = await trx.updateTable("online_definition").set({ status: "ACTIVE", current_draft_revision_id: nextRevisionId, published_release_id: releaseId, updated_by: input.actorId, updated_at: new Date(), lock_version: definition.lock_version + 1 }).where("id", "=", definition.id).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).executeTakeFirst()
      if (Number(changed.numUpdatedRows) !== 1) throw new ApiError("CONFLICT", "Definition 版本已过期")
    })
    return this.detail({ tenantId: input.tenantId, code: input.code })
  }

  static async rollback(input: { tenantId: string; actorId: string; code: string; releaseId: string; expectedLockVersion: number }): Promise<OnlineDefinitionDetail> {
    requireDatabase()
    const db = await getKyselyDb()
    const row = await db.transaction().execute(async (trx) => {
      const definition = await trx.selectFrom("online_definition").selectAll().where("tenant_id", "=", input.tenantId).where("code", "=", input.code).where("deleted", "=", false).executeTakeFirst()
      if (!definition || definition.lock_version !== input.expectedLockVersion) throw new ApiError("CONFLICT", "Definition 不存在或版本已过期")
      const release = await trx.selectFrom("online_release").selectAll().where("id", "=", input.releaseId).where("definition_id", "=", definition.id).where("tenant_id", "=", input.tenantId).executeTakeFirst()
      if (!release) throw new ApiError("NOT_FOUND", "目标 Release 不存在")
      const changed = await trx.updateTable("online_definition").set({ status: "ACTIVE", published_release_id: release.id, updated_by: input.actorId, updated_at: new Date(), lock_version: definition.lock_version + 1 }).where("id", "=", definition.id).where("tenant_id", "=", input.tenantId).where("deleted", "=", false).where("lock_version", "=", input.expectedLockVersion).returningAll().executeTakeFirst()
      if (!changed) throw new ApiError("CONFLICT", "Definition 版本已过期")
      return changed
    })
    return this.detail({ tenantId: input.tenantId, code: row.code })
  }
}
