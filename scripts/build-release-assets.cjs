#!/usr/bin/env node

/**
 * build-release-assets.cjs
 * 自动打包 GitHub / Gitee Release 制品资产包 (Release Artifacts)
 */

const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")
const { execSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const DIST_ASSETS = path.join(ROOT, "dist", "release-assets")

function getTag() {
  const argTag = process.argv.slice(2).find((a) => a.startsWith("--tag="))
  if (argTag) return argTag.split("=")[1]
  if (process.argv[2] && !process.argv[2].startsWith("-")) return process.argv[2]
  try {
    const gitTag = execSync("git describe --tags --exact-match", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    if (gitTag) return gitTag
  } catch (_err) {
    /* 当前提交无精确 Tag 时回退 package.json 版本 */
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
  return `v${pkg.version || "1.5.0"}`
}

function sha256Of(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")
}

function main() {
  const tag = getTag()
  console.log(`\n📦 [release-assets] 正在构建版本制品资产包: ${tag}`)

  if (fs.existsSync(DIST_ASSETS)) {
    fs.rmSync(DIST_ASSETS, { recursive: true, force: true })
  }
  fs.mkdirSync(DIST_ASSETS, { recursive: true })

  // 1. 打包脱机骨架 Tarball（排除所有子包 node_modules、嵌入式 PG 与构建产物）
  const skeletonTar = path.join(DIST_ASSETS, `cooliebase-all-${tag}-skeleton.tar.gz`)
  console.log(`[1/3] 打包离线纯净工程骨架: ${path.basename(skeletonTar)}...`)
  const tarCmd = [
    "tar",
    "--exclude='./.git'",
    "--exclude='node_modules'",
    "--exclude='./.embedded-pg'",
    "--exclude='./.next'",
    "--exclude='./.next-cooliebase'",
    "--exclude='./.next-ruoyi'",
    "--exclude='*.tsbuildinfo'",
    "--exclude='./.turbo'",
    "--exclude='./.cache'",
    "--exclude='./data/*.db'",
    "--exclude='./data/*.db-wal'",
    "--exclude='./data/*.db-shm'",
    "--exclude='./backups'",
    "--exclude='./dist'",
    `-czf "${skeletonTar}"`,
    ".",
  ].join(" ")

  execSync(tarCmd, { cwd: ROOT, stdio: "inherit" })
  const tarStat = fs.statSync(skeletonTar)
  console.log(`✓ 骨架包构建成功: ${(tarStat.size / (1024 * 1024)).toFixed(2)} MB`)

  // 2. 导出机器发现契约与版本发布说明
  console.log("[2/3] 导出架构契约与机器发现清单...")
  const seamGraph = path.join(ROOT, "packages", "shared", "contract", "seam-graph.json")
  if (fs.existsSync(seamGraph)) {
    fs.copyFileSync(seamGraph, path.join(DIST_ASSETS, "seam-graph.json"))
  }
  const compatManifest = path.join(ROOT, "compat-manifest.json")
  if (fs.existsSync(compatManifest)) {
    fs.copyFileSync(compatManifest, path.join(DIST_ASSETS, "compat-manifest.json"))
  }
  const releaseMd = path.join(ROOT, "docs", "07_release", "releases", `${tag}.md`)
  if (fs.existsSync(releaseMd)) {
    fs.copyFileSync(releaseMd, path.join(DIST_ASSETS, `RELEASE-${tag}.md`))
  }

  // 3. 生成跨平台原生 SHA256SUMS.txt 完整性哈希清单（不依赖外部 sha256sum 命令）
  console.log("[3/3] 生成 SHA256SUMS.txt 完整性哈希清单...")
  const assetFiles = fs
    .readdirSync(DIST_ASSETS)
    .filter((f) => f !== "SHA256SUMS.txt")
    .sort()
  const checksumLines = assetFiles.map((f) => `${sha256Of(path.join(DIST_ASSETS, f))}  ${f}`)
  fs.writeFileSync(path.join(DIST_ASSETS, "SHA256SUMS.txt"), `${checksumLines.join("\n")}\n`, "utf8")

  const files = fs.readdirSync(DIST_ASSETS).sort()
  console.log("\n✅ [release-assets] 全部发布制品构建完成 (dist/release-assets/):")
  files.forEach((f) => {
    const s = fs.statSync(path.join(DIST_ASSETS, f))
    console.log(`  - ${f} (${(s.size / 1024).toFixed(1)} KB)`)
  })
  console.log("")
}

main()
