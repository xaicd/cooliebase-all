import fs from "node:fs"
import path from "node:path"

import { DEFAULT_NEXT_REACT_TEMPLATE_PRESETS } from "../packages/domains/infra/backend/services/template-engine-presets"

type Vars = Record<string, string | number | boolean | null | undefined>

type CliArgs = {
  modulePath: string
  entityName: string
  serviceName: string
  permissionUpdate: string
  stack: string
  templates: string[]
  pack?: "service-pattern"
  outRoot: string
  force: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args = new Map<string, string>()
  const flags = new Set<string>()

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith("--")) continue
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      flags.add(token)
    } else {
      args.set(token, next)
      i += 1
    }
  }

  const modulePath = args.get("--module") ?? "system/user"
  const entityName = args.get("--entity") ?? "SystemUser"
  const serviceName = args.get("--service") ?? `${entityName}Service`
  const permissionUpdate = args.get("--permission-update") ?? "SYSTEM_USER_UPDATE"
  const stack = args.get("--stack") ?? "next-react"
  const templates = (args.get("--templates") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
  const pack = args.get("--pack") as "service-pattern" | undefined
  const outRoot = path.resolve(args.get("--out-root") ?? path.resolve(__dirname, ".."))
  const force = flags.has("--force")

  return {
    modulePath,
    entityName,
    serviceName,
    permissionUpdate,
    stack,
    templates,
    pack,
    outRoot,
    force,
  }
}

function renderTemplate(content: string, variables: Vars) {
  return content.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key]
    if (value === null || value === undefined) return ""
    return String(value)
  })
}

function expandTemplateCodes(codes: string[], stack: string): string[] {
  const presetMap = new Map(
    DEFAULT_NEXT_REACT_TEMPLATE_PRESETS
      .filter((item) => String(item.options?.stack ?? "") === stack)
      .map((item) => [item.code, item]),
  )

  const expanded: string[] = []
  const seen = new Set<string>()

  for (const code of codes) {
    const preset = presetMap.get(code)
    if (!preset) continue

    const bundleCodes = Array.isArray(preset.options?.bundleTemplateCodes)
      ? (preset.options?.bundleTemplateCodes as string[])
      : []

    if (bundleCodes.length === 0) {
      if (!seen.has(preset.code)) {
        expanded.push(preset.code)
        seen.add(preset.code)
      }
      continue
    }

    for (const bundleCode of bundleCodes) {
      if (!presetMap.has(bundleCode) || seen.has(bundleCode)) continue
      expanded.push(bundleCode)
      seen.add(bundleCode)
    }
  }

  return expanded
}

function codesFromPack(pack?: "service-pattern"): string[] {
  if (pack === "service-pattern") {
    return ["next-react-admin-service-pattern-pack"]
  }
  return []
}

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function main() {
  const cli = parseArgs(process.argv.slice(2))

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`用法: npm run scaffold -- [参数]\n\n参数:\n  --pack service-pattern       使用 Service 设计模式组合包\n  --templates code1,code2      指定模板编码列表\n  --module system/user         模块路径变量 modulePath\n  --entity SystemUser          实体名变量 entityName\n  --service SystemUserService  服务名变量 serviceName\n  --permission-update XXX      权限变量 permissionUpdate\n  --out-root <path>            输出根目录（默认仓库根 "."；模板路径自带 packages/domains/<域>/ 结构）\n  --force                      覆盖已存在文件\n`) 
    return
  }

  const requestedCodes = [...codesFromPack(cli.pack), ...cli.templates]
  if (requestedCodes.length === 0) {
    throw new Error("请至少指定 --pack 或 --templates")
  }

  const expandedCodes = expandTemplateCodes(requestedCodes, cli.stack)
  if (expandedCodes.length === 0) {
    throw new Error("未找到可用模板，请检查 --pack/--templates 与 --stack")
  }

  // 模板里用的变量比 CLI 传入的多 —— 尤其是 `moduleName`（域目录名）。
  // 不提供它的话，`packages/domains/{{moduleName}}/…` 会渲染成
  // `packages/domains//backend/…`（少一段），文件落到错误位置（实测:
  // 产出 `packages/domains/system/packages/domains/backend/services/...`）。
  // 从 modulePath 的**首段**取域名 —— 这是它与 domain-catalog 的约定。
  const moduleName = cli.modulePath.split("/")[0]
  // 模板里还有几个派生变量 —— 都能从既有输入算出来，不该让模板渲染出空段:
  //   featureKebab   模块路径末段的 kebab 形式（如 `system/user` -> `user`）
  //   serviceFile / validatorFile  该功能的文件名
  const toKebab = (value: string) =>
    value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().replace(/^-+|-+$/g, "")
  const featureKebab = toKebab(cli.modulePath.split("/").slice(-1)[0] || cli.entityName)
  const variables: Vars = {
    modulePath: cli.modulePath,
    // 兼容两种写法: 老模板用 {{moduleName}}，新模板用 {{domain}} / {{domainDir}}
    moduleName,
    domain: moduleName,
    domainDir: moduleName,
    featureKebab,
    entityKebab: toKebab(cli.entityName),
    serviceFile: `${featureKebab}.service.ts`,
    validatorFile: `${featureKebab}.validator.ts`,
    entityName: cli.entityName,
    serviceName: cli.serviceName,
    permissionUpdate: cli.permissionUpdate,
  }

  const selected = DEFAULT_NEXT_REACT_TEMPLATE_PRESETS.filter(
    (item) => expandedCodes.includes(item.code) && String(item.options?.stack ?? "") === cli.stack,
  )

  const written: string[] = []

  for (const tpl of selected) {
    const rawPath = String(tpl.options?.filePath ?? `templates/${tpl.code}.txt`)
    const relativePath = renderTemplate(rawPath, variables)
    const outputPath = path.resolve(cli.outRoot, relativePath)

    if (fs.existsSync(outputPath) && !cli.force) {
      throw new Error(`文件已存在: ${outputPath}，如需覆盖请加 --force`)
    }

    ensureDir(outputPath)
    fs.writeFileSync(outputPath, renderTemplate(tpl.content, variables), "utf-8")
    written.push(path.relative(cli.outRoot, outputPath))
  }

  // 工程名从 package.json 取，不写死 —— 孵化出的工程不该再自称 cooliebase-all。
  const projectName = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")).name ?? "project"
    } catch {
      return "project"
    }
  })()
  console.log(`[${projectName}] 模板生成完成，共 ${written.length} 个文件:`)
  for (const file of written) {
    console.log(`- ${file}`)
  }
}

main()
