#!/usr/bin/env node
/**
 * 规格归档工具 (Spec Archive Tool)
 *
 * 作用:
 * 将已完成上线交付、已通过验收门禁的 Spec，从活跃施工区归拢至按季度隔离的历史归档区
 * 防止 specs 目录随时间推移被已完结历史记录所污染。
 *
 * 示例:
 *   node scripts/archive-spec.cjs --name fix-cart-concurrency
 */
const fs = require("node:fs")
const path = require("node:path")
const { ROOT, resolveSpecDir } = require("./lib/spec-path-resolver.cjs")

const arg = (flag) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const name = arg("--name")
if (!name) {
  console.error("用法: node scripts/archive-spec.cjs --name <规格名>")
  process.exit(2)
}

const currentDir = resolveSpecDir(name)
if (!currentDir) {
  console.error(`[spec-archive] 找不到规格: ${name}`)
  process.exit(2)
}

// 检查是否已经归档
if (currentDir.includes(path.join("docs", "specs", "archive"))) {
  console.log(`[spec-archive] 规格 ${name} 已在归档区: ${path.relative(ROOT, currentDir)}`)
  process.exit(0)
}

// 获取规格元数据（提取 domain）
let domain = "common"
let specJsonPath = path.join(currentDir, "spec.json")
if (!fs.existsSync(specJsonPath)) {
  specJsonPath = path.join(currentDir, "feature.json")
}
if (!fs.existsSync(specJsonPath)) {
  specJsonPath = path.join(currentDir, "brief.json")
}
if (fs.existsSync(specJsonPath)) {
  try {
    const meta = JSON.parse(fs.readFileSync(specJsonPath, "utf8"))
    if (meta.domain) domain = meta.domain
  } catch {}
}

// 计算当前季度 (如 2026-Q4)
const now = new Date()
const year = now.getFullYear()
const quarter = Math.floor(now.getMonth() / 3) + 1
const quarterTag = `${year}-Q${quarter}`

const targetDir = path.join(ROOT, "docs", "specs", "archive", quarterTag, domain, name)
fs.mkdirSync(path.dirname(targetDir), { recursive: true })

// 执行归档移动
fs.renameSync(currentDir, targetDir)

// 若原父级域目录为空，自动清理防止产生空目录
const parentDir = path.dirname(currentDir)
if (fs.existsSync(parentDir) && parentDir !== path.join(ROOT, "docs", "specs") && fs.readdirSync(parentDir).length === 0) {
  try {
    fs.rmdirSync(parentDir)
  } catch {}
}

// 写入归档标记
const targetSpecJson = path.join(targetDir, "spec.json")
let specData = {}
if (fs.existsSync(targetSpecJson)) {
  try {
    specData = JSON.parse(fs.readFileSync(targetSpecJson, "utf8"))
  } catch {}
}
specData.name = name
specData.domain = domain
specData.archived = true
specData.archivedAt = now.toISOString()
specData.archiveQuarter = quarterTag
fs.writeFileSync(targetSpecJson, JSON.stringify(specData, null, 2) + "\n")

console.log(`[spec-archive] 规格已成功归档至: ${path.relative(ROOT, targetDir)}`)
