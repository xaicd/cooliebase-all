import { createHash } from "node:crypto"
import { z } from "zod"
import {
  ONLINE_SCALAR_TYPES,
  ONLINE_STORAGE_KINDS,
  type OnlineFieldIR,
  type OnlineIndexIR,
  type OnlineModelIR,
  type OnlineSchemaOperation,
  type OnlineSchemaPlanPayload,
  type OnlineSchemaRisk,
} from "./online-schema-plan.contract"
import { validateSystemFields } from "./online-model-defaults"

const code = z.string().regex(/^[a-z][a-z0-9_]{1,63}$/, "标识必须以小写字母开头，仅允许小写字母、数字和下划线")
const fieldSchema = z.object({
  code,
  type: z.enum(ONLINE_SCALAR_TYPES),
  nullable: z.boolean().default(true),
  length: z.number().int().min(1).max(65535).optional(),
  precision: z.number().int().min(0).max(18).optional(),
  default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  remark: z.string().trim().max(300).optional(),
  identity: z.enum(["PLATFORM_UUID", "MANUAL"]).optional(),
  systemTemplate: z.enum(["CREATED_AUDIT", "UPDATED_AUDIT"]).optional(),
  systemManaged: z.boolean().default(false),
}).strict()
const indexSchema = z.object({ code, fields: z.array(code).min(1).max(16), unique: z.boolean().default(false) }).strict()
const relationSchema = z.object({ code, type: z.enum(["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE"]), sourceField: code, targetDefinitionCode: code, targetReleaseId: z.string().uuid().optional(), targetField: code, onDelete: z.enum(["RESTRICT", "SET_NULL"]).default("RESTRICT") }).strict()
export const onlineModelIrSchema = z.object({
  version: z.literal(1).default(1),
  storage: z.object({ kind: z.enum(ONLINE_STORAGE_KINDS).default("GENERIC_RECORD") }).strict().default({ kind: "GENERIC_RECORD" }),
  fields: z.array(fieldSchema).max(128).default([]),
  indexes: z.array(indexSchema).max(64).default([]),
  relations: z.array(relationSchema).max(32).default([]),
}).strict()

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(",")}}`
  return JSON.stringify(value)
}
function hash(value: unknown): string { return createHash("sha256").update(stable(value)).digest("hex") }
function same(left: unknown, right: unknown): boolean { return stable(left) === stable(right) }
function unique<T extends { code: string }>(items: T[], label: string): void {
  if (new Set(items.map((item) => item.code)).size !== items.length) throw new Error(`${label} code 不可重复`)
}
function toRecord(value: OnlineFieldIR | OnlineIndexIR): Record<string, unknown> { return value as Record<string, unknown> }
function maxRisk(risks: OnlineSchemaRisk[]): OnlineSchemaRisk {
  return ["UNSUPPORTED", "DESTRUCTIVE", "REVIEW_REQUIRED", "SAFE", "NONE"].find((risk) => risks.includes(risk as OnlineSchemaRisk)) as OnlineSchemaRisk
}
function validateFieldDefault(field: OnlineFieldIR): void {
  const value = field.default
  if (value === undefined) return
  if (value === null) { if (!field.nullable) throw new Error(`字段 ${field.code} 为必填时不能声明 null 默认值`); return }
  if ((field.type === "string" || field.type === "text") && (typeof value !== "string" || (field.length !== undefined && value.length > field.length))) throw new Error(`字段 ${field.code} 的默认值必须是符合长度限制的文本`)
  if (field.type === "integer" && (typeof value !== "number" || !Number.isInteger(value))) throw new Error(`字段 ${field.code} 的默认值必须是整数`)
  if (field.type === "decimal" && (typeof value !== "number" || !Number.isFinite(value))) throw new Error(`字段 ${field.code} 的默认值必须是有限小数`)
  if (field.type === "boolean" && typeof value !== "boolean") throw new Error(`字段 ${field.code} 的默认值必须是布尔值`)
  if (field.type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))) throw new Error(`字段 ${field.code} 的默认值必须是 YYYY-MM-DD 日期`)
  if (field.type === "datetime" && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) throw new Error(`字段 ${field.code} 的默认值必须是有效日期时间`)
  if (field.type === "json") { if (typeof value !== "string") throw new Error(`字段 ${field.code} 的默认值必须是 JSON 文本`); try { JSON.parse(value) } catch { throw new Error(`字段 ${field.code} 的默认值不是有效 JSON 文本`) } }
}

export function parseOnlineModelIR(value: unknown): OnlineModelIR {
  const parsed = onlineModelIrSchema.parse(value ?? {}) as OnlineModelIR
  unique(parsed.fields, "字段")
  unique(parsed.indexes, "索引")
  unique(parsed.relations, "关联")
  const fieldCodes = new Set(parsed.fields.map((field) => field.code))
  const identities = parsed.fields.filter((field) => field.identity !== undefined)
  if (identities.length > 1) throw new Error("每个数据模型最多声明一个 identity 字段")
  for (const field of parsed.fields) {
    if (field.precision !== undefined && field.type !== "decimal") throw new Error(`字段 ${field.code} 的 precision 仅可用于 decimal 类型`)
    if (field.systemTemplate && field.identity) throw new Error(`字段 ${field.code} 不能同时是系统字段和 identity 字段`)
    validateFieldDefault(field)
  }
  validateSystemFields(parsed)
  for (const index of parsed.indexes) {
    if (new Set(index.fields).size !== index.fields.length) throw new Error(`索引 ${index.code} 不可重复引用同一字段`)
    for (const field of index.fields) if (!fieldCodes.has(field)) throw new Error(`索引 ${index.code} 引用了不存在字段 ${field}`)
  }
  for (const relation of parsed.relations) {
    if (!fieldCodes.has(relation.sourceField)) throw new Error(`关联 ${relation.code} 引用了不存在的源字段 ${relation.sourceField}`)
    if (relation.onDelete === "SET_NULL" && !parsed.fields.find((field) => field.code === relation.sourceField)?.nullable) throw new Error(`关联 ${relation.code} 使用 SET_NULL 时源字段必须可空`)
  }
  return {
    ...parsed,
    fields: [...parsed.fields].sort((a, b) => a.code.localeCompare(b.code)),
    indexes: [...parsed.indexes].map((index) => ({ ...index, fields: [...index.fields] })).sort((a, b) => a.code.localeCompare(b.code)),
    relations: [...parsed.relations].sort((a, b) => a.code.localeCompare(b.code)),
  }
}

export function fingerprintOnlineModelIR(value: unknown): string { return hash(parseOnlineModelIR(value)) }

function fieldRisk(before: OnlineFieldIR, after: OnlineFieldIR): { risk: OnlineSchemaRisk; reasons: string[] } {
  if (before.type !== after.type) return { risk: "REVIEW_REQUIRED", reasons: ["字段类型变更需要人工确认数据兼容性"] }
  if (before.nullable && !after.nullable) return { risk: "DESTRUCTIVE", reasons: ["字段从可空变为必填可能拒绝现有数据"] }
  if ((before.length ?? Number.POSITIVE_INFINITY) > (after.length ?? Number.POSITIVE_INFINITY)) return { risk: "DESTRUCTIVE", reasons: ["字段长度缩小可能截断现有数据"] }
  return { risk: "REVIEW_REQUIRED", reasons: ["字段属性变更需要人工确认"] }
}

function storageRisk(baseline: OnlineModelIR, target: OnlineModelIR): { risk: OnlineSchemaRisk; reasons: string[] } | null {
  if (baseline.storage.kind === target.storage.kind) return null
  if (baseline.storage.kind === "GENERIC_RECORD" && baseline.fields.length === 0 && target.storage.kind === "MANAGED_TABLE") {
    return { risk: "REVIEW_REQUIRED", reasons: ["首次启用托管物理表需要审批并受控应用 DDL"] }
  }
  return { risk: "UNSUPPORTED", reasons: ["仅支持新建 Definition 首次启用 MANAGED_TABLE；存储模式不能在已存在模型间迁移"] }
}

export function buildOnlineSchemaPlan(baselineInput: unknown, targetInput: unknown): { risk: OnlineSchemaRisk; payload: OnlineSchemaPlanPayload } {
  const baseline = parseOnlineModelIR(baselineInput)
  const target = parseOnlineModelIR(targetInput)
  const operations: OnlineSchemaOperation[] = []
  const risks: OnlineSchemaRisk[] = []
  const storage = storageRisk(baseline, target)
  if (storage) {
    operations.push({ kind: "ALTER_FIELD", subject: "storage", before: { kind: baseline.storage.kind }, after: { kind: target.storage.kind }, reasons: storage.reasons })
    risks.push(storage.risk)
  }

  const baselineFields = new Map(baseline.fields.map((field) => [field.code, field]))
  const targetFields = new Map(target.fields.map((field) => [field.code, field]))
  for (const field of target.fields) {
    const before = baselineFields.get(field.code)
    if (!before) {
      const risk: OnlineSchemaRisk = field.nullable ? "SAFE" : "REVIEW_REQUIRED"
      operations.push({ kind: "ADD_FIELD", subject: field.code, after: toRecord(field), reasons: [field.nullable ? "新增可空字段" : "新增必填字段需要确认现有数据填充策略"] })
      risks.push(risk)
    } else if (!same(before, field)) {
      const classified = fieldRisk(before, field)
      operations.push({ kind: "ALTER_FIELD", subject: field.code, before: toRecord(before), after: toRecord(field), reasons: classified.reasons })
      risks.push(classified.risk)
    }
  }

  const baselineIndexes = new Map(baseline.indexes.map((index) => [index.code, index]))
  const targetIndexes = new Map(target.indexes.map((index) => [index.code, index]))
  for (const index of target.indexes) {
    const before = baselineIndexes.get(index.code)
    if (!before) {
      const risk: OnlineSchemaRisk = index.unique ? "REVIEW_REQUIRED" : "SAFE"
      operations.push({ kind: "ADD_INDEX", subject: index.code, after: toRecord(index), reasons: [index.unique ? "新增唯一索引需要确认既有数据唯一性" : "新增非唯一索引"] })
      risks.push(risk)
    } else if (!same(before, index)) {
      operations.push({ kind: "DROP_INDEX", subject: index.code, before: toRecord(before), reasons: ["替换索引前需要人工确认影响"] })
      operations.push({ kind: "ADD_INDEX", subject: index.code, after: toRecord(index), reasons: ["替换索引需要人工确认"] })
      risks.push("REVIEW_REQUIRED")
    }
  }
  for (const index of baseline.indexes) if (!targetIndexes.has(index.code)) {
    operations.push({ kind: "DROP_INDEX", subject: index.code, before: toRecord(index), reasons: ["删除索引可能影响查询性能或约束"] })
    risks.push("DESTRUCTIVE")
  }
  for (const field of baseline.fields) if (!targetFields.has(field.code)) {
    operations.push({ kind: "DROP_FIELD", subject: field.code, before: toRecord(field), reasons: ["删除字段可能丢失数据"] })
    risks.push("DESTRUCTIVE")
  }
  if (!operations.length) operations.push({ kind: "NO_OP", subject: "model", reasons: ["模型结构未变化"] })

  return {
    risk: maxRisk(risks.length ? risks : ["NONE"]),
    payload: {
      formatVersion: 1,
      classifierVersion: "2026-08-15",
      baseline,
      target,
      sourceFingerprint: hash(baseline),
      targetFingerprint: hash(target),
      operations,
    },
  }
}
