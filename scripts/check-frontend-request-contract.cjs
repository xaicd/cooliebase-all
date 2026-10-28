#!/usr/bin/env node
/**
 * `frontend:request-contract:check` —— 页面/组件不得裸调 `fetch(`。
 *
 * ## 为什么
 *
 * 本仓有统一请求层 `packages/shared/frontend/lib/request.ts`，它负责：
 * 结构化错误（`code` / `message` / `messageKey` / `details`）、401 跳登录、超时与网络异常归一。
 * 页面里裸 `fetch(` 会**绕过全部这些** —— 拿不到错误码、拿不到中文提示、401 不跳转。
 * 实测：9 个页面各写一套，行为还不一致。
 *
 * （这是外部项目「AES 传输契约」在本仓的对应物：本仓**没有**传输加密信封，
 *  但有统一请求层。见 `docs/specs/infra/sdd-write-path-discipline/research.md` §①⑤。）
 *
 * ## 判定
 *
 * - **扫描面**：`packages/*\/*\/frontend/{pages,components}/**\/*.{ts,tsx}`。
 *   不扫 `frontend/api/**` —— 那一层本来就该用 `request.*`。
 * - **命中**：`fetch(` 调用（排除 `xx.fetch(` 这类成员调用，以及注释里的字样）。
 * - **棘轮**：存量 9 条冻结在基线里，**只减不增**。
 * - **豁免**：行内写 `request-contract-exempt: <非空理由>` 可放行 —— 但**理由必须非空**，
 *   否则等于没写（这也是为什么理由用正则校验，而不是"有这个词就行"）。
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const BASELINE_REL = "docs/architecture/artifacts/frontend-raw-fetch-baseline.json"
const BASELINE = path.join(ROOT, BASELINE_REL)

/** 扫描面：只看页面与组件，不看 api 层 */
function collectFiles() {
  const files = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(e.name)) files.push(full)
    }
  }
  for (const group of ["plugins", "domains"]) {
    const base = path.join(ROOT, "packages", group)
    if (!fs.existsSync(base)) continue
    for (const pkg of fs.readdirSync(base)) {
      for (const sub of ["pages", "components"]) walk(path.join(base, pkg, "frontend", sub))
    }
  }
  return files
}

/** 命中裸 fetch 的文件（排除成员调用与注释行） */
function findRawFetch(file) {
  const src = fs.readFileSync(file, "utf8")
  const hits = []
  src.split("\n").forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "")
    if (!/(?<![.\w$])fetch\s*\(/.test(code)) return
    if (/request-contract-exempt:\s*\S/.test(line)) return // 有理由的显式豁免
    hits.push({ line: i + 1, text: line.trim().slice(0, 90) })
  })
  return hits
}

function main() {
  const writeBaseline = process.argv.includes("--write-baseline")
  const files = collectFiles()
  if (files.length === 0) {
    console.error("[request-contract] ✗ 扫描到 0 个页面/组件文件 —— 扫描面失效，不允许静默通过")
    process.exit(1)
  }

  const found = []
  for (const f of files) {
    const hits = findRawFetch(f)
    if (hits.length) found.push({ file: path.relative(ROOT, f), hits })
  }

  if (writeBaseline) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true })
    fs.writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          note: "页面/组件里裸 fetch( 的存量（棘轮：只减不增）。收紧：pnpm run frontend:request-contract:baseline",
          files: found.map((x) => x.file).sort(),
        },
        null,
        2,
      ) + "\n",
    )
    console.log(`[request-contract] 已写入 ${BASELINE_REL}（${found.length} 个文件）`)
    return 0
  }

  let accepted = []
  if (fs.existsSync(BASELINE)) {
    const parsed = JSON.parse(fs.readFileSync(BASELINE, "utf8"))
    if (!Array.isArray(parsed.files)) {
      console.error(`[request-contract] ✗ ${BASELINE_REL} 格式失效（缺 files 数组），不允许静默通过`)
      process.exit(1)
    }
    accepted = parsed.files
  } else {
    console.error(`[request-contract] ✗ 缺少基线 ${BASELINE_REL}（不允许"找不到基线 ⇒ 静默通过"）`)
    console.error("  生成：pnpm run frontend:request-contract:baseline")
    process.exit(1)
  }

  const foundSet = new Set(found.map((x) => x.file))
  const newOnes = found.filter((x) => !accepted.includes(x.file))
  const fixed = accepted.filter((f) => !foundSet.has(f))

  console.log(`[request-contract] 扫描 ${files.length} 个页面/组件文件；命中裸 fetch 的 ${found.length} 个（基线 ${accepted.length} 个）`)
  if (fixed.length) console.log(`  · 基线里有 ${fixed.length} 条已不再违规，建议收紧基线`)

  if (newOnes.length === 0) {
    console.log("[request-contract] ✓ 无新增裸 fetch")
    return 0
  }

  console.error("")
  console.error(`[request-contract] ✗ ${newOnes.length} 个文件新增了裸 fetch( —— 请改用 request.*（packages/shared/frontend/lib/request.ts）：`)
  for (const n of newOnes) {
    console.error(`  · ${n.file}`)
    for (const h of n.hits.slice(0, 3)) console.error(`      L${h.line}: ${h.text}`)
  }
  console.error("")
  console.error("  确有必要（如上传/流式下载）时，在该行写：// request-contract-exempt: <理由>")
  return 1
}

if (require.main === module) process.exit(main())
module.exports = { collectFiles, findRawFetch }
