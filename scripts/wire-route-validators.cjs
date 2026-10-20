#!/usr/bin/env node
/**
 * 给生成路由接上 Zod 校验（AGENTS §4.1「禁止绕过 Validator 直连 Service」）。
 *
 * 背景：全仓 855 个「写路由且读 body」的路由里 794 个**裸传 body**（`Service.create(body)`）。
 * 内存回退不校验约束，所以裸传在测试里几乎不暴露；真实库上则表现为约束错误在 **Service 深处**
 * 抛出，而不是在边界被拦下。
 *
 * **顺序铁律（RSK-013）**：接线前必须先把该域的三类产物对齐到元数据
 * ——校验器、DTO(`types/*.types.ts`)、前端表单——否则接线会把「今天能跑的数字输入」变成 400。
 * 对齐用 `npx tsx scripts/align-validator-types.ts --domain <域> --write`。
 *
 * **本脚本刻意逐文件断言**：任何一处预期形态没匹配到就报错退出，而不是静默跳过 ——
 * 静默跳过会让"接了多少个"变成一个不可信的数字。
 *
 * 用法:
 *   node scripts/wire-route-validators.cjs --domain ai            # dry-run（默认）
 *   node scripts/wire-route-validators.cjs --domain ai --write
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const argIndex = argv.indexOf("--domain")
const domain = argIndex >= 0 ? argv[argIndex + 1] : undefined
const write = argv.includes("--write")

if (!domain) {
  console.error("用法: node scripts/wire-route-validators.cjs --domain <域> [--write]")
  process.exit(2)
}

const pluginDir = path.join(ROOT, "packages", "plugins", `plugin-${domain}`)
const routesDir = path.join(pluginDir, "routes", "admin")
const validatorsDir = path.join(pluginDir, "backend", "validators")

/** 从校验器文件里取三个 schema 的导出名（不猜命名，直接读导出） */
function schemaNames(resource) {
  const file = path.join(validatorsDir, `${resource}.validator.ts`)
  if (!fs.existsSync(file)) return null
  const source = fs.readFileSync(file, "utf8")
  const exports = [...source.matchAll(/export const (\w+)/g)].map((m) => m[1])
  const pick = (suffix) => exports.find((name) => name.endsWith(suffix))
  const page = pick("PageQuerySchema")
  const create = pick("CreateSchema")
  const update = pick("UpdateSchema")
  if (!page || !create || !update) return null
  return { page, create, update }
}

/**
 * 把手工拼装的 query 换成 schema.parse。
 *
 * 用「找配对右括号」而不是写死缩进：`withAdminRoute` 的 handler 体是 2 空格缩进，
 * 裸 handler 是 4 空格 —— 写死空格数会漏掉其中一种（实测 ai-api-key 即如此）。
 */
function replaceQueryBlock(source, schema) {
  const start = source.indexOf("const input = {")
  if (start < 0) return null
  const lines = source.slice(start).split("\n")
  let end = -1
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "}") { end = i; break }
  }
  if (end < 0) return null
  const indent = (source.slice(0, start).match(/(^|\n)( *)$/) || ["", "", ""])[2] || "  "
  const replacement = [
    "const raw: Record<string, unknown> = {}",
    "searchParams.forEach((value, key) => { raw[key] = value })",
    `const input = ${schema}.parse(raw)`,
  ].map((line) => indent + line).join("\n")
  const head = source.slice(0, start).replace(/[ \t]*$/, "")
  return head + replacement + source.slice(start + lines.slice(0, end + 1).join("\n").length)
}

const problems = []
const skipped = []
let changedFiles = 0
let changedRoutes = 0

for (const resource of fs.readdirSync(routesDir)) {
  const dir = path.join(routesDir, resource)
  if (!fs.statSync(dir).isDirectory()) continue
  const schemas = schemaNames(resource)
  if (!schemas) {
    // **不适用** ≠ **意外**：导出/统计/看板这类非标准端点没有生成的校验器，
    // 不能接线（需要手写 schema 或按例外登记）。这类**跳过并计数**，不算失败 ——
    // 否则工具会把"不适用"报成"坏掉了"，让人以为需要去修。
    skipped.push(resource)
    continue
  }
  const importLine = `import { ${schemas.create}, ${schemas.page}, ${schemas.update} } from "@/modules/${domain}/backend/validators/${resource}.validator"`

  for (const [file, kind] of [
    [path.join(dir, "route.ts"), "collection"],
    [path.join(dir, "[id]", "route.ts"), "item"],
  ]) {
    if (!fs.existsSync(file)) continue
    let source = fs.readFileSync(file, "utf8")
    const original = source

    // ① 插入 schema import（放在第一条相对 alias import 之后；已存在则跳过）
    if (!source.includes(`backend/validators/${resource}.validator`)) {
      const anchor = source.match(/^import .*from "@\/modules\/[^"]+\.service"\n/m)
      if (!anchor) {
        problems.push(`${path.relative(ROOT, file)}: 找不到 service import 锚点`)
        continue
      }
      source = source.replace(anchor[0], `${anchor[0]}${importLine}\n`)
    }

    // ② GET：手工拼装的 query → schema.parse
    if (kind === "collection") {
      // GET 可能**已经**通过共享助手接好了（`parseActionQuery(SCHEMAS[...], request)`）——
      // 那种情况不该重写，也不该报错；继续把 POST/PUT 接上即可（实测 mes-pro-work-order 即如此）。
      const alreadyWiredGet = /parseActionQuery\s*\(/.test(source)
      const wired = alreadyWiredGet ? source : replaceQueryBlock(source, schemas.page)
      if (wired) {
        source = wired
      } else if (!source.includes(`${schemas.page}.parse`)) {
        problems.push(`${path.relative(ROOT, file)}: GET 的 query 拼装形态未识别`)
        continue
      }
    }

    // ③ POST：create 走 create schema
    if (kind === "collection") {
      const createCall = source.match(/await \w+Service\.create\(\s*body\s*\)/)
      const createInline = source.match(/await \w+Service\.create\(\s*await request\.json\(\s*\)\s*\)/)
      if (createCall) {
        source = source.replace(createCall[0], createCall[0].replace("body", `${schemas.create}.parse(body)`))
      } else if (createInline) {
        // 变体：内联读取，没有 body 变量（实测 pay 域存在）
        source = source.replace(
          createInline[0],
          createInline[0].replace("await request.json()", `${schemas.create}.parse(await request.json())`),
        )
      } else if (!source.includes(`${schemas.create}.parse`)) {
        problems.push(`${path.relative(ROOT, file)}: POST 的 create 调用形态未识别`)
        continue
      }
    }

    // ④ PUT：update 走 update schema（merge id —— update schema 要求 id）
    if (kind === "item") {
      const updateCall = source.match(/await \w+Service\.update\(\s*id\s*,\s*body\s*\)/)
      const updateInline = source.match(/await \w+Service\.update\(\s*id\s*,\s*await request\.json\(\s*\)\s*\)/)
      if (updateCall) {
        source = source.replace(
          updateCall[0],
          updateCall[0].replace("id, body", `id, ${schemas.update}.parse({ ...body, id })`),
        )
      } else if (updateInline) {
        source = source.replace(
          updateInline[0],
          updateInline[0].replace("await request.json()", `${schemas.update}.parse({ ...(await request.json()), id })`),
        )
      } else if (!source.includes(`${schemas.update}.parse`)) {
        problems.push(`${path.relative(ROOT, file)}: PUT 的 update 调用形态未识别`)
        continue
      }
    }

    if (source !== original) {
      changedRoutes += 1
      if (write) fs.writeFileSync(file, source)
      changedFiles += 1
    }
  }
}

if (problems.length > 0) {
  console.error(`[wire-routes] FAIL: ${problems.length} 处预期形态未识别（刻意 fail-loud，不静默跳过）`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(
  `[wire-routes] 域 ${domain}${write ? "" : "（dry-run，加 --write 落盘）"}: ` +
    `${changedRoutes} 个路由文件需接线；跳过 ${skipped.length} 个无校验器的非标准资源` +
    (skipped.length > 0 ? `（${skipped.slice(0, 6).join(", ")}${skipped.length > 6 ? "…" : ""}）` : ""),
)
