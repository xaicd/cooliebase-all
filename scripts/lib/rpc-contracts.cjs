const fs = require("fs")
const path = require("path")
const { ROOT, listDomains } = require("./domain-catalog.cjs")

const ACTIONS_PATH = path.join(ROOT, "packages", "shared", "backend", "constants", "rpc-actions.json")

function loadRpcActions() {
  return JSON.parse(fs.readFileSync(ACTIONS_PATH, "utf8"))
}

function pascal(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function snake(value) {
  return value.replace(/[A-Z]/g, (part) => `_${part.toLowerCase()}`).replace(/^_/, "")
}

function constName(domain) {
  return domain.toUpperCase()
}

function resolveFields(action, catalog) {
  if (action.schema === "ping" || action.fieldsRef === "ping") return catalog.fieldSets.ping
  if (action.fieldsRef) {
    const fields = catalog.fieldSets[action.fieldsRef]
    if (!fields) throw new Error(`Unknown field set: ${action.fieldsRef}`)
    return fields
  }
  return action.fields ?? catalog.fieldSets.ping
}

function protoFieldLine(field, index) {
  const optional = field.optional ? "optional " : ""
  const protoName = snake(field.name)
  const jsonName = protoName === field.name ? "" : ` [json_name = "${field.name}"]`
  return `  ${optional}${field.type} ${protoName} = ${index}${jsonName};`
}

function toActionsTs(domain, spec, catalog) {
  const actions = spec.actions
  const schemaImports = [...new Set(actions.filter((item) => item.schema !== "ping").map((item) => item.schema))]
  const pingName = `${domain}PingSchema`
  const mapName = `${constName(domain)}_ACTION_SCHEMAS`
  const importBlock = schemaImports.length
    ? `import {\n  ${schemaImports.join(",\n  ")},\n} from "../backend/validators"\n`
    : ""
  const entries = actions
    .map((item) => {
      const schemaName = item.schema === "ping" ? pingName : item.schema
      return `  "${domain}.${item.method}": ${schemaName},`
    })
    .join("\n")
  return `import { z } from "zod"
import { registerActionSchema } from "@/modules/shared/backend/lib/broker-validator"
${importBlock}
export const ${pingName} = z.object({
  n: z.number().optional(),
})

export const ${mapName} = {
${entries}
} as const

export function registerActionSchemas() {
  for (const [action, schema] of Object.entries(${mapName})) {
    registerActionSchema(action, schema)
  }
}
`
}

function toFacadeTs(domain, spec) {
  const methods = spec.actions.map((item) => item.method)
  const methodList = methods.map((item) => `"${item}"`).join(", ")
  const exportName = `${constName(domain)}_FACADE_METHODS`
  return `import { createDomainFacade } from "@/modules/shared/backend/lib/rpc-facade"

export const ${exportName} = [${methodList}] as const

export const ${domain}Facade = createDomainFacade("${domain}", ${exportName})
`
}

function uniqueMethods(methods) {
  return [...new Set(methods)]
}

function toNamedFacadeTs(domain, methods, constSuffix, exportName, header) {
  const methodsConst = `${constName(domain)}_${constSuffix}`
  if (methods.length === 0) {
    return `${header}export const ${methodsConst} = [] as const
`
  }
  const methodList = methods.map((item) => `"${item}"`).join(", ")
  return `${header}import { createDomainFacade } from "@/modules/shared/backend/lib/rpc-facade"

export const ${methodsConst} = [${methodList}] as const

export const ${exportName} = createDomainFacade("${domain}", ${methodsConst})
`
}

function exposureMethods(catalog, domain) {
  const spec = catalog.exposure?.[domain]
  if (!spec) return null
  const actionNames = new Set((catalog.domains[domain]?.actions ?? []).map((item) => item.method))
  for (const method of [...(spec.public ?? []), ...(spec.platform ?? [])]) {
    if (!actionNames.has(method)) throw new Error(`exposure ${domain}.${method} is not an rpc action`)
  }
  return {
    public: spec.public ?? [],
    platform: uniqueMethods([...(spec.platform ?? []), ...(spec.public ?? [])]),
  }
}

function toProto(domain, spec, catalog) {
  const service = `${pascal(domain)}Service`
  const messages = []
  const rpcs = []
  for (const action of spec.actions) {
    const rpc = pascal(action.method)
    const request = `${rpc}Request`
    const fields = resolveFields(action, catalog)
    const body = fields.map((field, index) => protoFieldLine(field, index + 1)).join("\n")
    messages.push(`message ${request} {\n${body}\n}`)
    rpcs.push(`  rpc ${rpc}(${request}) returns (JsonReply);`)
  }
  return `syntax = "proto3";

package cooliebase.${domain}.v1;

option go_package = "${catalog.goModule}/${domain}/v1;${domain}v1";

// Generated from packages/shared/backend/constants/rpc-actions.json
// Do not hand-edit. Run: npm run domain:contracts
// gRPC path: /cooliebase.${domain}.v1.${service}/<Method>

message JsonReply {
  string json = 1;
}

${messages.join("\n\n")}

service ${service} {
${rpcs.join("\n")}
}
`
}

function goType(field) {
  const map = { string: "string", int32: "int32", int64: "int64", double: "float64", bool: "bool" }
  const base = map[field.type] || "string"
  return field.optional ? `*${base}` : base
}

function goTag(field) {
  return field.optional ? `json:"${field.name},omitempty"` : `json:"${field.name}"`
}

function toGo(domain, spec, catalog) {
  const pkg = `${domain}v1`
  const service = `${pascal(domain)}Service`
  const structs = []
  const iface = []
  const methods = []
  const consts = [`\tServiceName = "${service}"`]
  for (const action of spec.actions) {
    const rpc = pascal(action.method)
    const request = `${rpc}Request`
    const pathName = `${rpc}Path`
    const fields = resolveFields(action, catalog)
    const body = fields
      .map((field) => `\t${pascal(field.name)} ${goType(field)} \`${goTag(field)}\``)
      .join("\n")
    structs.push(`type ${request} struct {\n${body}\n}`)
    consts.push(`\t${pathName} = "/cooliebase.${domain}.v1.${service}/${rpc}"`)
    iface.push(`\t${rpc}(ctx context.Context, in *${request}) (*JsonReply, error)`)
    methods.push(`func (c *Client) ${rpc}(ctx context.Context, in *${request}) (*JsonReply, error) {
	raw, err := c.Invoke(ctx, ${pathName}, in)
	if err != nil {
		return nil, err
	}
	return &JsonReply{JSON: raw}, nil
}`)
  }
  return `// Code generated by npm run domain:contracts. DO NOT EDIT.

package ${pkg}

import "context"

const (
${consts.join("\n")}
)

type JsonReply struct {
	JSON string \`json:"json"\`
}

${structs.join("\n\n")}

type ${service} interface {
${iface.join("\n")}
}

type Invoker func(ctx context.Context, path string, in any) (json string, err error)

type Client struct {
	Invoke Invoker
}

${methods.join("\n\n")}
`
}

function toGoMod() {
  return `module cooliebase/all-base/gen

go 1.22
`
}

function contractPaths(domain) {
  // 用共享解析器: 域改造成插件后目录在 packages/plugins/plugin-*，不能写死旧路径
  const dir = path.join(require("./domain-catalog.cjs").domainPathOf(ROOT, domain), "contract")
  return {
    dir,
    actions: path.join(dir, "actions.ts"),
    facade: path.join(dir, `${domain}.facade.ts`),
    publicFacade: path.join(dir, `${domain}.public.facade.ts`),
    platformFacade: path.join(dir, `${domain}.platform.facade.ts`),
    proto: path.join(dir, `${domain}.proto`),
    go: path.join(ROOT, "gen", "go", domain, "v1", "service.go"),
  }
}

function renderDomain(domain, catalog) {
  const spec = catalog.domains[domain]
  if (!spec) throw new Error(`rpc-actions.json missing domain: ${domain}`)
  return {
    actions: toActionsTs(domain, spec, catalog),
    facade: toFacadeTs(domain, spec),
    proto: toProto(domain, spec, catalog),
    go: toGo(domain, spec, catalog),
  }
}

function writeGeneratedContracts() {
  const catalog = loadRpcActions()
  const written = []
  const goRoot = path.join(ROOT, "gen", "go")
  fs.mkdirSync(goRoot, { recursive: true })
  fs.writeFileSync(path.join(goRoot, "go.mod"), toGoMod())
  for (const domain of listDomains()) {
    const files = renderDomain(domain.name, catalog)
    const targets = contractPaths(domain.name)
    fs.mkdirSync(targets.dir, { recursive: true })
    fs.mkdirSync(path.dirname(targets.go), { recursive: true })
    fs.writeFileSync(targets.actions, files.actions)
    fs.writeFileSync(targets.facade, files.facade)
    const scoped = exposureMethods(catalog, domain.name)
    if (scoped) {
      fs.writeFileSync(targets.publicFacade, toNamedFacadeTs(
        domain.name,
        scoped.public,
        "PUBLIC_METHODS",
        `${domain.name}PublicFacade`,
        "// Business-domain public RPC. Do not add admin CRUD here.\n",
      ))
      fs.writeFileSync(targets.platformFacade, toNamedFacadeTs(
        domain.name,
        scoped.platform,
        "PLATFORM_METHODS",
        `${domain.name}PlatformFacade`,
        "// Platform collaboration RPC for shared/online/report. Not a public business API.\n",
      ))
    }
    fs.writeFileSync(targets.proto, files.proto)
    fs.writeFileSync(targets.go, files.go)
    written.push(path.relative(ROOT, targets.dir).replace(/\\/g, "/"))
  }
  return written
}

module.exports = {
  ACTIONS_PATH,
  loadRpcActions,
  contractPaths,
  renderDomain,
  writeGeneratedContracts,
  pascal,
}
