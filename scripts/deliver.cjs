#!/usr/bin/env node
/**
 * 交付链的**单一入口**。给一个特性，它把「能自动的」都跑一遍，并告诉你**下一步做什么**。
 *
 * 为什么要有: 机制再多，agent 来了**不知道从哪进**就等于没有。这里把
 * AGENTS §3.4 的 12 步里「可自动的」串起来，剩下的（填 brief、写业务逻辑、实施）
 * 逐条打印下一步命令 —— 让人和 agent 都不用背流程。
 *
 * 用法:
 *   node scripts/deliver.cjs --name points --domain points --title "会员积分"
 *   node scripts/deliver.cjs --name points            # 继续推进已有特性
 */
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const arg = (flag) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}
const name = arg("--name")
if (!name) {
  console.error('用法: node scripts/deliver.cjs --name <特性名> [--domain <域>] [--title "<标题>"]')
  process.exit(2)
}
const domain = arg("--domain")
const title = arg("--title") ?? name

const run = (command, args, quiet = false) => {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: quiet ? "pipe" : "inherit" })
  return result.status === 0
}
const dir = path.join(ROOT, "docs", "features", name)
const exists = fs.existsSync(path.join(dir, "brief.json"))

console.log(`\n=== 交付链: ${name} ===\n`)
if (!exists) {
  if (!domain) {
    console.error("[deliver] 新规格需要 --domain（规格与域名不必同名）")
    process.exit(2)
  }
  console.log("▶ 1/4 立规格（生成 brief.json —— 这是唯一需要人/模型写的东西）")
  run("pnpm", ["exec", "tsx", "scripts/speckit.ts", "new", "--name", name, "--domain", domain, "--title", title])
} else {
  console.log("▶ 1/4 规格已存在，跳过立项")
}

console.log("\n▶ 2/4 校验 brief 是否够展开文档")
const briefOk = run("pnpm", ["exec", "tsx", "scripts/speckit.ts", "build", "--name", name, "--check"])

if (briefOk) {
  console.log("\n▶ 3/4 展开文档（结构不可能缺）")
  run("pnpm", ["exec", "tsx", "scripts/speckit.ts", "build", "--name", name])
}

console.log("\n▶ 4/4 交付状态")
run("node", ["scripts/check-delivery.cjs", "--spec", name])

const featureJson = JSON.parse(fs.readFileSync(path.join(dir, "feature.json"), "utf8"))
console.log(`\n=== 下一步 ===`)
if (!briefOk) {
  console.log(`  ① 填 brief: ${path.relative(ROOT, path.join(dir, "brief.json"))}`)
  console.log(`     把目标/角色/故事/约束/验收/不变量/任务（含归属与文件白名单）写进去`)
  console.log(`     然后: npm run deliver -- --name ${name}`)
} else {
  console.log(`  ① 建域:      npm run domain:new ${featureJson.domain}`)
  console.log(`  ② 门禁:      npm run check && npm run build`)
  console.log(`  ③ 建库:      pnpm exec prisma migrate deploy && 种子`)
  console.log(`  ④ 业务逻辑:  写成 Service + 测试（复用条件更新/状态机/幂等原语）`)
  console.log(`  ⑤ 追溯:      npm run task:verify -- --feature ${name} --summary   （提交带 [T1] 标记）`)
  console.log(`  ⑥ 上线:      npm run fingerprint && npm run fingerprint:verify`)
  console.log(`  ⑦ 实施:      npm run runbook -- --feature ${name} --check --run`)
  console.log(`  ⑧ 运营:      npm run agent:ops -- ${featureJson.domain}.<实体> health`)
}
console.log("")
