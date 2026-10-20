#!/usr/bin/env node
/**
 * 环境指纹握手（对齐 coolie 的 G5 PRE-SRE: 制品不可变、指纹一致）。
 *
 * 问题: "测试通过的那个版本" 与 "上线的那个版本" 之间，没有任何机制保证它们是同一份。
 * 常见后果 —— 测试跑在 A，上线部署的是 B（漏了重新构建、改了配置、装错依赖），
 * 而两个环境**都显示成功**。
 *
 * 指纹覆盖三样，缺一不可:
 *   1. **来源**: git commit + 是否脏（脏树意味着"测的不是提交里的东西"）
 *   2. **依赖**: pnpm-lock.yaml 的内容哈希（依赖漂了=同一份 commit 也不是同一个制品）
 *   3. **产物**: 构建输出（.next-cooliebase/standalone）的内容哈希 —— 这才是真正上线的东西
 *
 * 用法:
 *   node scripts/env-fingerprint.cjs --write    # 测试通过后盖章
 *   node scripts/env-fingerprint.cjs --verify   # 部署前核对（不一致即 exit 1）
 *   node scripts/env-fingerprint.cjs --print
 */
const { execFileSync } = require("node:child_process")
const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const ARTIFACT = path.join(ROOT, "docs", "architecture", "artifacts", "env-fingerprint.json")
const BUILD_DIR = path.join(ROOT, ".next-cooliebase", "standalone")

const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim()
  } catch {
    return ""
  }
}

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex")

/** 目录内容哈希: 路径 + 内容一起进哈希（只看内容会漏掉"改名"）。 */
function hashTree(dir) {
  if (!fs.existsSync(dir)) return null
  const hash = crypto.createHash("sha256")
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name)
      const rel = path.relative(dir, full)
      hash.update(rel)
      if (entry.isDirectory()) walk(full)
      else if (entry.isSymbolicLink()) hash.update("link:" + fs.readlinkSync(full)) // 不跟随（会成环），哈希链接目标
      else hash.update(fs.readFileSync(full))
    }
  }
  walk(dir)
  return hash.digest("hex")
}

function compute() {
  const lockfile = path.join(ROOT, "pnpm-lock.yaml")
  return {
    commit: git(["rev-parse", "HEAD"]),
    dirty: git(["status", "--short", "--untracked-files=no"]).length > 0,
    lockfileHash: fs.existsSync(lockfile) ? sha256(fs.readFileSync(lockfile)) : null,
    buildHash: hashTree(BUILD_DIR),
    nodeVersion: process.version,
  }
}

const args = process.argv.slice(2)
const now = compute()

if (args.includes("--print")) {
  console.log(JSON.stringify(now, null, 2))
  process.exit(0)
}

if (args.includes("--write")) {
  const record = { ...now, verifiedAt: new Date().toISOString() }
  fs.mkdirSync(path.dirname(ARTIFACT), { recursive: true })
  fs.writeFileSync(ARTIFACT, JSON.stringify(record, null, 2) + "\n")
  console.log(`[fingerprint] 已盖章: commit ${record.commit.slice(0, 8)}${record.dirty ? " (脏树!)" : ""}`)
  console.log(`[fingerprint] lock ${String(record.lockfileHash).slice(0, 12)}  产物 ${record.buildHash ? record.buildHash.slice(0, 12) : "未构建"}`)
  if (record.dirty) console.log("[fingerprint] ⚠️ 脏工作区: 测的不是提交里的东西，指纹只能算临时证明")
  process.exit(0)
}

if (args.includes("--verify")) {
  if (!fs.existsSync(ARTIFACT)) {
    console.error("[fingerprint] 没有指纹记录 —— 先跑测试并 `pnpm run fingerprint`")
    process.exit(2)
  }
  const stamped = JSON.parse(fs.readFileSync(ARTIFACT, "utf8"))
  const drifts = []
  for (const [field, label] of [["commit", "源码提交"], ["lockfileHash", "依赖锁"], ["buildHash", "构建产物"]]) {
    if (stamped[field] !== now[field]) drifts.push(`${label}: 盖章 ${String(stamped[field]).slice(0, 12)} → 现在 ${String(now[field]).slice(0, 12)}`)
  }
  console.log(`[fingerprint] 盖章于 ${stamped.verifiedAt}`)
  if (drifts.length === 0) {
    console.log("[fingerprint] PASS: 现在这份就是测试通过的那一份")
    process.exit(0)
  }
  for (const drift of drifts) console.log(`   ✗ ${drift}`)
  console.log("[fingerprint] FAIL: 上线的不是测试过的那一份")
  process.exit(1)
}

console.error("用法: node scripts/env-fingerprint.cjs --write | --verify | --print")
process.exit(2)
