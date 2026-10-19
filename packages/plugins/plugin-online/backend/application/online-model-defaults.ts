import type { OnlineInteractionIR } from "./online-interaction.compiler"
import type { OnlineFieldIR, OnlineModelIR } from "./online-schema-plan.contract"

export const COOLIEBASE_SYSTEM_FIELD_LABELS: Record<string, string> = {
  id: "主键", creator: "创建者", create_time: "创建时间", updater: "更新者", update_time: "更新时间", deleted: "是否删除", tenant_id: "租户编号",
}

export function createSystemFields(): OnlineFieldIR[] {
  return [
    { code: "id", type: "string", nullable: false, length: 36, remark: "主键", identity: "PLATFORM_UUID", systemManaged: true },
    { code: "creator", type: "string", nullable: false, length: 64, default: "", remark: "创建者", systemTemplate: "CREATED_AUDIT", systemManaged: true },
    { code: "create_time", type: "datetime", nullable: false, remark: "创建时间", systemTemplate: "CREATED_AUDIT", systemManaged: true },
    { code: "updater", type: "string", nullable: false, length: 64, default: "", remark: "更新者", systemTemplate: "UPDATED_AUDIT", systemManaged: true },
    { code: "update_time", type: "datetime", nullable: false, remark: "更新时间", systemTemplate: "UPDATED_AUDIT", systemManaged: true },
    { code: "deleted", type: "boolean", nullable: false, default: false, remark: "是否删除", systemManaged: true },
    { code: "tenant_id", type: "integer", nullable: false, default: 0, remark: "租户编号", systemManaged: true },
  ]
}

export function createInitialOnlineModel(): OnlineModelIR {
  return { version: 1, storage: { kind: "GENERIC_RECORD" }, fields: createSystemFields(), indexes: [], relations: [] }
}

function widgetFor(field: OnlineFieldIR): string {
  return { string: "TEXT", text: "TEXTAREA", integer: "NUMBER", decimal: "NUMBER", boolean: "SWITCH", date: "DATE", datetime: "DATETIME", json: "JSON" }[field.type]
}

function createSystemFieldInteractions(fields: OnlineFieldIR[]): Record<string, unknown>[] {
  return fields.map((field) => ({
    code: field.code, label: COOLIEBASE_SYSTEM_FIELD_LABELS[field.code] ?? field.code, widget: widgetFor(field),
    query: { enabled: false }, visibility: { list: field.code !== "tenant_id" && field.code !== "deleted", form: false, detail: true },
    list: { sortable: false, summary: false }, form: { span: 12 }, detail: { formatter: field.type === "datetime" ? "DATETIME" : field.type === "boolean" ? "BOOLEAN" : "PLAIN" }, validation: { ruleKeys: [] }, readOnly: true,
  }))
}

export function createInitialOnlineInteraction(model: OnlineModelIR): Record<string, unknown> {
  return { version: 1, fields: createSystemFieldInteractions(model.fields), actions: [] }
}

function sameField(left: OnlineFieldIR, right: OnlineFieldIR, compareSystemManaged = true): boolean {
  return left.code === right.code && left.type === right.type && left.nullable === right.nullable && left.length === right.length && left.precision === right.precision && left.default === right.default && left.remark === right.remark && left.identity === right.identity && left.systemTemplate === right.systemTemplate && (!compareSystemManaged || left.systemManaged === right.systemManaged)
}

export function mergeSystemFields(model: OnlineModelIR): OnlineModelIR {
  const standardFields = createSystemFields()
  const standardByCode = new Map(standardFields.map((field) => [field.code, field]))
  const businessFields = model.fields.filter((field) => !standardByCode.has(field.code))
  for (const standard of standardFields) {
    const existing = model.fields.find((field) => field.code === standard.code)
    if (existing && !sameField(existing, standard, false)) throw new Error(`字段 ${standard.code} 已被业务字段使用，无法补齐 CoolieBase 系统字段`)
  }
  return { ...model, fields: [...businessFields, ...standardFields] }
}

export function mergeSystemInteractions(interaction: OnlineInteractionIR, model: OnlineModelIR): Record<string, unknown> {
  const systemCodes = new Set(createSystemFields().map((field) => field.code))
  const systemFields = model.fields.filter((field) => systemCodes.has(field.code))
  return { ...interaction, fields: [...interaction.fields.filter((field) => !systemCodes.has(field.code)), ...createSystemFieldInteractions(systemFields)] }
}

export function validateSystemFields(model: OnlineModelIR): void {
  const expected = new Map(createSystemFields().map((field) => [field.code, field]))
  for (const field of model.fields) {
    if (!field.systemManaged) continue
    const standard = expected.get(field.code)
    if (!standard || !sameField(field, standard)) throw new Error(`系统字段 ${field.code} 必须保持 CoolieBase 标准定义`)
  }
}

export function assertSystemFieldsImmutable(current: OnlineModelIR, next: OnlineModelIR): void {
  for (const field of current.fields.filter((item) => item.systemManaged)) {
    const candidate = next.fields.find((item) => item.code === field.code)
    if (!candidate || !sameField(field, candidate)) throw new Error(`系统字段 ${field.code} 已固化，不能删除或修改`)
  }
}
