import { describe, expect, it } from "vitest"
import { assertSystemFieldsImmutable, createInitialOnlineInteraction, createInitialOnlineModel, mergeSystemFields, mergeSystemInteractions } from "./online-model-defaults"
import { parseOnlineInteractionIR } from "./online-interaction.compiler"
import { parseOnlineModelIR } from "./online-schema-plan.compiler"

describe("CoolieBase Online 默认业务字段", () => {
  it("创建标准模型，并生成全部只读系统字段交互", () => {
    const model = parseOnlineModelIR(createInitialOnlineModel())
    const interaction = parseOnlineInteractionIR(createInitialOnlineInteraction(model), model)
    expect(model.fields.map((field) => field.code)).toEqual(["create_time", "creator", "deleted", "id", "tenant_id", "update_time", "updater"])
    expect(model.fields.every((field) => field.systemManaged)).toBe(true)
    expect(interaction.fields.every((field) => field.readOnly)).toBe(true)
  })

  it("为存量模型保留业务字段并补齐标准系统字段", () => {
    const legacy = parseOnlineModelIR({ version: 1, storage: { kind: "GENERIC_RECORD" }, fields: [{ code: "field_1", type: "string", nullable: true, length: 100 }], indexes: [], relations: [] })
    const legacyInteraction = parseOnlineInteractionIR({ version: 1, fields: [{ code: "field_1", label: "field_1", widget: "TEXT", query: { enabled: false }, visibility: { list: true, form: true, detail: true }, list: { sortable: false, summary: false }, form: { span: 12 }, detail: { formatter: "PLAIN" }, validation: { ruleKeys: [] }, readOnly: false }], actions: [] }, legacy)
    const model = parseOnlineModelIR(mergeSystemFields(legacy))
    const interaction = parseOnlineInteractionIR(mergeSystemInteractions(legacyInteraction, model), model)
    expect(model.fields.map((field) => field.code)).toContain("field_1")
    expect(model.fields.filter((field) => field.systemManaged)).toHaveLength(7)
    expect(interaction.fields.find((field) => field.code === "field_1")?.readOnly).toBe(false)
    expect(interaction.fields.filter((field) => field.code !== "field_1").every((field) => field.readOnly)).toBe(true)
  })

  it("拒绝删除或篡改已固化的系统字段", () => {
    const current = parseOnlineModelIR(createInitialOnlineModel())
    const next = parseOnlineModelIR({ ...current, fields: current.fields.filter((field) => field.code !== "tenant_id") })
    expect(() => assertSystemFieldsImmutable(current, next)).toThrow("tenant_id")
  })
})
