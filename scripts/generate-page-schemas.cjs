#!/usr/bin/env node
/**
 * 由 Agent 操作契约**生成** C 端「页面 Schema」映射。
 *
 * 背景:
 *   C 端（portal Web / Expo）是 **schema 驱动** 渲染的 —— 后端下发
 *   `GET /api/v1/open/meta/page-schema/:entity`，前端按 fields 渲染列表与表单。
 *   而 `PageSchemaService.get()` 读不到配置时回退到 `defaultPageSchema()`，
 *   也就是 **fields: []** —— 新生成的业务域在 C 端是**空白页**。
 *
 *   但每个实体的 **Agent 契约**（`<插件根>/agent/<kebab>.agent.json`）里
 *   **已经有真实字段**: 名称、标签、类型、是否必填。所以这里把它转成 PageSchema，
 *   作为兜底数据 —— 零新增数据、单一真源（还是那份表元数据）。
 *
 * 为什么生成成 TS 而不是运行期读 JSON:
 *   Next 打包后 `docs/` 不一定在产物里；TS 模块会被正常打进 bundle。
 *
 * 用法:
 *   node scripts/generate-page-schemas.cjs            # dry-run
 *   node scripts/generate-page-schemas.cjs --write
 *   node scripts/generate-page-schemas.cjs --check    # 门禁: 是否漂移
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const REGISTRY = path.join(ROOT, "packages", "shared", "contract", "agent-contracts.json")
const OUT = path.join(ROOT, "packages", "shared", "contract", "page-schemas.generated.ts")
const write = process.argv.includes("--write")
const check = process.argv.includes("--check")

/** 低代码列类型 -> C 端渲染类型（与 FieldDef 的枚举对齐）。 */
function fieldType(tsType) {
  switch (tsType) {
    case "number": return "number"
    case "boolean": return "boolean"
    case "timestamp":
    case "date": return "date"
    default: return "text"
  }
}

/** 库里的表名（C 端按表名取 schema）: PascalCase/kebab -> snake_case。 */
function tableNameOf(contract) {
  const kebab = String(contract.kebab ?? contract.entity)
  return kebab.replace(/-/g, "_")
}

function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("[page-schemas] 契约注册表不存在，先运行 node scripts/agent/collect-contracts.cjs")
    process.exit(2)
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"))
  const entries = []

  for (const contract of registry.contracts ?? []) {
    const fields = (contract.accessibility?.fields ?? []).map((field) => {
      const def = {
        code: field.name,
        label: field.label || field.name,
        type: fieldType(field.type),
      }
      if (field.required) def.required = true
      return def
    })
    if (fields.length === 0) continue
    // C 端按**表名**取 schema；同时登记 kebab 形式，避免调用方用哪种都能命中
    const keys = new Set([tableNameOf(contract)])
    const entry = {
      entity: tableNameOf(contract),
      title: contract.businessName || contract.entity,
      fields,
      __source: contract.__source,
    }
    for (const key of keys) entries.push([key, entry])
  }

  entries.sort((a, b) => a[0].localeCompare(b[0]))
  console.log(`[page-schemas] ${entries.length} 个实体的 C 端 schema（来自 ${registry.total} 份契约）`)

  const body = entries
    .map(([key, entry]) => {
      const fields = entry.fields
        .map((f) => `      { code: ${JSON.stringify(f.code)}, label: ${JSON.stringify(f.label)}, type: ${JSON.stringify(f.type)}${f.required ? ", required: true" : ""} },`)
        .join("\n")
      return `  ${JSON.stringify(key)}: {\n    entity: ${JSON.stringify(entry.entity)},\n    title: ${JSON.stringify(entry.title)},\n    fields: [\n${fields}\n    ],\n  },`
    })
    .join("\n")

  const content = `// 由 scripts/generate-page-schemas.cjs 从 packages/shared/contract/agent-contracts.json 生成，**勿手改**。
//
// 用途: PageSchemaService 在 system_config 里读不到 \`page.schema.<entity>\` 时回退到这份数据，
// 让**新生成的业务域在 C 端就有真实字段**（否则是空页面）。
// 单一真源仍是表元数据 —— 契约由元数据生成，这里再由契约生成。
//
// 类型在本地声明而**不 import online 插件**: shared 是平台 SDK，不能反向依赖某个域
// （AGENTS §17.1）。结构与 online 的 PageSchema 一致，赋值处按结构化类型兼容。
export interface GeneratedPageField {
  code: string
  label: string
  type: "text" | "textarea" | "number" | "boolean" | "date" | "select" | "image"
  required?: boolean
}

export interface GeneratedPageSchema {
  entity: string
  title: string
  fields: GeneratedPageField[]
}

export const GENERATED_PAGE_SCHEMAS: Record<string, GeneratedPageSchema> = {
${body}
}

/** 按实体名取兜底 schema（未登记返回 undefined，调用方再退到 defaultPageSchema）。 */
export function generatedPageSchema(entity: string): GeneratedPageSchema | undefined {
  return GENERATED_PAGE_SCHEMAS[entity]
}
`

  if (check) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== content) {
      console.error("[page-schemas] FAIL: 与 Agent 契约不一致 —— 跑 node scripts/generate-page-schemas.cjs --write")
      process.exit(1)
    }
    console.log("[page-schemas] PASS: 与契约一致")
    return
  }
  if (!write) {
    console.log("  (dry-run: 加 --write 写入)")
    return
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, content)
  console.log(`  ✓ 已写 ${path.relative(ROOT, OUT)}`)
}

main()
