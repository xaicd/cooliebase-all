/**
 * 源仓库能力扫描器。
 *
 * 它只读取 cooliebase-vue-pro / yudao-ui-admin-vue3 的 Controller 与视图目录，生成
 * 迁移审计报告；不生成或写入应用代码。CRUD 代码请使用 /admin/infra/codegen 的
 * 预览 + ZIP 下载流程，并通过 manifest 驱动的本地注入器审阅后落盘。
 *
 * 用法: npx tsx scripts/codegen-from-source.ts [--domain system]
 */

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")
const SOURCE_BACKEND = path.resolve(ROOT, "../cooliebase-vue-pro")
const SOURCE_FRONTEND = path.resolve(ROOT, "../yudao-ui-admin-vue3")
const DOMAINS = ["system", "infra", "bpm", "pay", "report", "mp", "mall", "member", "crm", "erp", "wms", "mes", "ai", "iot", "im"]

type MethodInfo = {
  httpMethod: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  operationName: string
  summary: string
  permission?: string
}
type ControllerInfo = { domain: string; name: string; entityName: string; apiPrefix: string; methods: MethodInfo[]; filePath: string }
type ViewInfo = { domain: string; subModule: string; files: string[]; hasForm: boolean; hasDetail: boolean; hasIndex: boolean }

function scanControllers(domain: string): ControllerInfo[] {
  const modulePath = path.join(SOURCE_BACKEND, `yudao-module-${domain}`)
  if (!fs.existsSync(modulePath)) return []
  const controllers: ControllerInfo[] = []
  walk(modulePath, (file) => {
    if (!file.endsWith("Controller.java") || file.includes(`${path.sep}app${path.sep}`)) return
    const content = fs.readFileSync(file, "utf8")
    const parsed = parseController(domain, content, file)
    if (parsed) controllers.push(parsed)
  })
  return controllers
}

function parseController(domain: string, content: string, filePath: string): ControllerInfo | null {
  const classMatch = content.match(/public class (\w+Controller)/)
  if (!classMatch) return null
  const name = classMatch[1]
  const entityName = name.replace("Controller", "")
  const mappingMatch = content.match(/@RequestMapping\("([^"]+)"\)/)
  const methods: MethodInfo[] = []
  const expression = /@(GetMapping|PostMapping|PutMapping|DeleteMapping)\((?:"([^"]*)"|\{[^}]*\}|[^)]*)\)[\s\S]*?public\s+\S+(?:<[^>]+>)?\s+(\w+)\(/g
  let match: RegExpExecArray | null
  while ((match = expression.exec(content)) !== null) {
    const mapping = match[1]
    methods.push({
      httpMethod: { GetMapping: "GET", PostMapping: "POST", PutMapping: "PUT", DeleteMapping: "DELETE" }[mapping] as MethodInfo["httpMethod"],
      path: match[2] ?? "",
      operationName: match[3],
      summary: match[3],
    })
  }
  return { domain, name, entityName, apiPrefix: mappingMatch?.[1] ?? `/${domain}/${entityName.toLowerCase()}`, methods, filePath }
}

function scanViews(domain: string): ViewInfo[] {
  const viewsPath = path.join(SOURCE_FRONTEND, "src/views", domain)
  if (!fs.existsSync(viewsPath)) return []
  return fs.readdirSync(viewsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const files = collectFiles(path.join(viewsPath, entry.name))
      return { domain, subModule: entry.name, files, hasForm: files.some((file) => file.toLowerCase().includes("form")), hasDetail: files.some((file) => file.toLowerCase().includes("detail")), hasIndex: files.some((file) => file === "index.vue") }
    })
}

function walk(directory: string, onFile: (file: string) => void) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(fullPath, onFile)
    else onFile(fullPath)
  }
}

function collectFiles(directory: string): string[] {
  const files: string[] = []
  walk(directory, (file) => files.push(path.basename(file)))
  return files
}

function main() {
  const args = process.argv.slice(2)
  if (args.includes("--generate")) {
    console.error("此脚本仅负责扫描源仓库，已停止生成代码。请使用 /admin/infra/codegen 的预览 + ZIP 下载流程，并通过受控注入器审阅后落盘。")
    process.exitCode = 1
    return
  }
  const domainArg = args.find((arg) => !arg.startsWith("--"))
  const targetDomains = domainArg ? [domainArg] : DOMAINS
  const report: Record<string, unknown> = {}

  console.log("=== cooliebase-all 源仓库能力扫描 ===\n")
  for (const domain of targetDomains) {
    const controllers = scanControllers(domain)
    const views = scanViews(domain)
    const summary = { controllerCount: controllers.length, totalMethods: controllers.reduce((sum, controller) => sum + controller.methods.length, 0), viewCount: views.length, totalViewFiles: views.reduce((sum, view) => sum + view.files.length, 0) }
    report[domain] = { domain, controllers, views, summary }
    console.log(`## ${domain}: controllers=${summary.controllerCount}, methods=${summary.totalMethods}, views=${summary.viewCount}, viewFiles=${summary.totalViewFiles}`)
  }

  const outPath = path.join(ROOT, "docs/architecture/artifacts/source-capability-scan.json")
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log(`\nReport written to: ${outPath}`)
}

main()
