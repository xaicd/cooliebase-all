import { describe, expect, it } from "vitest"

// @ts-expect-error cjs 无类型声明
import { ASSET_REGISTRY } from "../../scripts/cmmi-asset-scaffold.cjs"

// 门禁 scripts/check-doc-stub-provenance.cjs 管辖「阶段产物顶层 md」——
// 脚手架生成的这类 stub 必须出生即自带溯源头，否则新派生工程秒红。
const GATED: Array<[string, string, string]> = [
  ["02", "rtm", "AGENTS.md"],
  ["02", "nfr", "AGENTS.md"],
  ["02", "urs", "AGENTS.md"],
  ["03", "erd", "AGENTS.md"],
  ["03", "hld", "AGENTS.md"],
  ["07", "deployment-sop", "AGENTS.md"],
  ["07", "user-manual", "AGENTS.md"],
  ["07", "release-notes", "CHANGELOG.md"],
]

describe("cmmi-asset-scaffold 溯源头（v2 文档定位修复③）", () => {
  it("阶段产物顶层 md 的内置模板必须自带「> 上游真源」", () => {
    for (const [phase, type, pointer] of GATED) {
      const def = (ASSET_REGISTRY as any)[phase]?.types?.[type]
      expect(def, `${phase}/${type} 应在 ASSET_REGISTRY`).toBeTruthy()
      const content = def.template({ title: "T", slug: "S", version: "v1.1.0" })
      expect(content, `${phase}/${type} 模板缺溯源头`).toMatch(
        new RegExp(`^>\\s*上游真源[:：]\\s*${pointer}$`, "m"),
      )
    }
  })

  it("溯源头不得自指：模板产物的真源路径不等于产物自身落位", () => {
    for (const [phase, type, pointer] of GATED) {
      const def = (ASSET_REGISTRY as any)[phase]?.types?.[type]
      const resolved =
        typeof def.file === "function" ? def.file({ version: "v1.1.0", slug: "S" }) : def.file
      expect(resolved, `${phase}/${type} 自指`).not.toBe(pointer)
    }
  })
})
