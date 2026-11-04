import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

/**
 * compat-manifest **单一真源**门禁（COO-55-1-1）。
 *
 * ## 这条门禁守的是什么
 *
 * compat-manifest 曾经有**两份**：真源 `packages/shared/contract/compat-manifest.json`
 * 与生成物 `compat-manifest.json`（根）/ `public/compat-manifest.json`（由 `pnpm surface:sync`
 * 从真源单向回写）。
 *
 * 实测事故（COO-64）：开发者改了**根生成物**，补了 deployment / apiPartitions / harness
 * 共 35 行声明，真源没同步 → 下一次 `pnpm check`（链里 `contracts:sync` 在前、`surface:check`
 * 在后）按真源把根文件整段覆盖 → 35 行声明**静默丢失**，而所有门禁都是绿的。
 *
 * 根因不是"多了一份文件"，而是**没人声明"哪些节必须在真源里"**，且回写路径不区分
 * "生成物比真源旧"（该同步）与"生成物比真源多"（会吃掉内容，不该同步）。
 *
 * ## 为什么每条断言都有反向对照
 *
 * 只测"现在是好的"等于没测。所以下面每条都配一条**必须失败**的对照：
 * 删掉声明要报错、悬空命令要报错、生成物持有独有内容时回写要**拒绝**而不是吃掉。
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const require = createRequire(import.meta.url)
const { REQUIRED_SECTIONS, validateRequiredSections } = require("../../scripts/lib/compat-manifest-sections.cjs")

const TRUTH_REL = "packages/shared/contract/compat-manifest.json"
const MIRROR_RELS = ["compat-manifest.json", "public/compat-manifest.json"]

const readText = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const readJson = (rel: string) => JSON.parse(readText(rel))
/** 读沙箱里的文件（沙箱有自己的根，不能走 ROOT）。 */
const readIn = (dir: string, rel: string) => fs.readFileSync(path.join(dir, rel), "utf8")

/** 造一个"完整的发现表面"沙箱：5 组 source/target 全部齐备且一致。 */
const SYNC_PAIRS: Array<{ src: string; targets: string[] }> = [
  { src: TRUTH_REL, targets: ["compat-manifest.json", "public/compat-manifest.json"] },
  { src: "packages/shared/contract/agent-profile.json", targets: ["agent-profile.json", "public/agent-profile.json"] },
  { src: "llms.txt", targets: ["public/llms.txt", ".well-known/llms.txt"] },
  { src: "llms-full.txt", targets: ["public/llms-full.txt", ".well-known/llms-full.txt"] },
  { src: ".well-known/agent.json", targets: ["public/.well-known/agent.json"] },
]

function makeSandbox(label: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cooliebase-${label}-`))
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true })
  fs.copyFileSync(path.join(ROOT, "scripts/sync-agent-surface.cjs"), path.join(dir, "scripts/sync-agent-surface.cjs"))
  for (const pair of SYNC_PAIRS) {
    const content = pair.src.endsWith(".json") ? `${JSON.stringify({ kind: "stub" }, null, 2)}\n` : "stub\n"
    const srcAbs = path.join(dir, pair.src)
    fs.mkdirSync(path.dirname(srcAbs), { recursive: true })
    fs.writeFileSync(srcAbs, content)
    for (const target of pair.targets) {
      const targetAbs = path.join(dir, target)
      fs.mkdirSync(path.dirname(targetAbs), { recursive: true })
      fs.writeFileSync(targetAbs, content)
    }
  }
  return dir
}

function runSync(dir: string, args: string[] = []) {
  const result = spawnSync(process.execPath, [path.join(dir, "scripts/sync-agent-surface.cjs"), ...args], {
    cwd: dir,
    encoding: "utf8",
  })
  return { code: result.status, out: `${result.stdout || ""}${result.stderr || ""}` }
}

describe("compat-manifest 单一真源（COO-55-1-1）", () => {
  it("真源里必须存在三节必备声明（deployment / apiPartitions / harness）", () => {
    const manifest = readJson(TRUTH_REL)
    for (const section of REQUIRED_SECTIONS) {
      expect(manifest[section], `真源缺少必备声明 ${section}`).toBeTruthy()
    }
  })

  it("生成物镜像必须与真源逐字节一致（漂移即红）", () => {
    const truth = readText(TRUTH_REL)
    for (const mirror of MIRROR_RELS) {
      expect(readText(mirror), `${mirror} 与真源漂移`).toBe(truth)
    }
  })

  it("校验器：真源现状必须通过", () => {
    expect(() => validateRequiredSections(readJson(TRUTH_REL), readJson("package.json"))).not.toThrow()
  })

  it("校验器：声明缺失必须报错（丢失 → 红灯，不再靠人眼）", () => {
    const manifest = readJson(TRUTH_REL)
    const pkg = readJson("package.json")
    for (const section of REQUIRED_SECTIONS) {
      const broken: Record<string, unknown> = { ...manifest }
      delete broken[section]
      expect(() => validateRequiredSections(broken, pkg), `删掉 ${section} 竟然没报错`).toThrow()
    }
  })

  it("校验器：悬空命令必须报错（仓里没有的 npm script）", () => {
    const manifest = readJson(TRUTH_REL)
    const pkg = readJson("package.json")
    const broken = {
      ...manifest,
      harness: { ...manifest.harness, doctorCommand: "pnpm harness:doctor" },
    }
    expect(() => validateRequiredSections(broken, pkg)).toThrow(/harness\.doctorCommand/)
  })

  it("回写护栏：生成物持有真源没有的内容时必须拒绝写入（不静默吃掉）", () => {
    const dir = makeSandbox("surface-guard")
    try {
      const mirrorRel = "compat-manifest.json"
      const truth = readIn(dir, TRUTH_REL)
      const mirror = `${JSON.stringify({ kind: "stub", onlyInMirror: true }, null, 2)}\n`
      fs.writeFileSync(path.join(dir, mirrorRel), mirror)

      const result = runSync(dir)
      expect(result.code, "回写本该被拒绝").not.toBe(0)
      expect(result.out).toMatch(/REFUSED/)
      expect(result.out).toMatch(/onlyInMirror/)
      expect(fs.readFileSync(path.join(dir, mirrorRel), "utf8"), "生成物被覆盖 = 内容被静默吃掉").toBe(mirror)
      expect(readIn(dir, TRUTH_REL)).toBe(truth)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("回写护栏：--force 才允许丢弃生成物里的独有内容", () => {
    const dir = makeSandbox("surface-force")
    try {
      const mirrorRel = "compat-manifest.json"
      fs.writeFileSync(
        path.join(dir, mirrorRel),
        `${JSON.stringify({ kind: "stub", onlyInMirror: true }, null, 2)}\n`,
      )
      const result = runSync(dir, ["--force"])
      expect(result.code, result.out).toBe(0)
      expect(readIn(dir, mirrorRel)).toBe(readIn(dir, TRUTH_REL))
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
