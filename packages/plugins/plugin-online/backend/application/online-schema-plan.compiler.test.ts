import { describe, expect, it } from "vitest"
import { buildOnlineSchemaPlan } from "./online-schema-plan.compiler"
import { createSystemFields } from "./online-model-defaults"

describe("managed physical table schema planning", () => {
  it("requires review for first managed-table creation and retains every field", () => {
    const target = { version: 1 as const, storage: { kind: "MANAGED_TABLE" as const }, fields: [...createSystemFields(), { code: "name", type: "string" as const, nullable: false, length: 100 }], indexes: [], relations: [] }
    const plan = buildOnlineSchemaPlan({ version: 1, storage: { kind: "GENERIC_RECORD" }, fields: [], indexes: [], relations: [] }, target)
    expect(plan.risk).toBe("REVIEW_REQUIRED")
    expect(plan.payload.operations.filter((operation) => operation.kind === "ADD_FIELD")).toHaveLength(target.fields.length)
    expect(plan.payload.target.storage.kind).toBe("MANAGED_TABLE")
  })

  it("rejects a storage migration after a managed model already exists", () => {
    const managed = { version: 1 as const, storage: { kind: "MANAGED_TABLE" as const }, fields: createSystemFields(), indexes: [], relations: [] }
    expect(buildOnlineSchemaPlan(managed, { ...managed, storage: { kind: "GENERIC_RECORD" as const } }).risk).toBe("UNSUPPORTED")
  })
})
