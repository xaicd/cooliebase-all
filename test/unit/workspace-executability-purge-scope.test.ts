import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

/**
 * 派生自检门禁的「清洗口径」门禁（COO-55-1-3）。
 *
 * ## 这条门禁守的是什么
 *
 * 底座侧派生自检（scripts/check-workspace-executability.cjs）原本只认平台
 * `PRIVATE_SPEC_ENGINE_FILES` 那 6 条路径，而平台真正的清洗面是
 * `cleanWorkspaceLeaks` 的**全量清洗面** —— 比那宽得多，且其中最危险的一条是
 * **它会改写 package.json**：
 *
 *   · 删 `scripts/harness.sh`（无条件）；
 *   · 删 8 个内部角色包（`.agents/skills/<role>`）+ 母港 server/ 产品源码两个文件；
 *   · **删 package.json 的 script 键**（`harness` / `pre-commit` / … / `speckit` / `spc:audit`），
 *     以及任何**值里引用了 `scripts/harness.sh`** 的 script 键。
 *
 * 删键的后果是**静默消失**：命令变成「不存在」，不报错，客户侧自证链整条断掉 ——
 * 与 COO-55-1 原始症状同源。而旧门禁**从不读 package.json**，这条路径底座完全看不见。
 *
 * ## 为什么每条断言都配反向对照
 *
 * 只测「现在是好的」等于没测。所以下面每条正面断言都配一条**必须失败**的对照：
 * 口径被收窄必须被看见、script 键引用被清洗文件必须报错、公开键被删必须报错、
 * 门禁 CLI 在装了探针的沙箱里必须 exit 1。
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const require = createRequire(import.meta.url)
const scope = require("../../scripts/lib/workspace-executability-scope.cjs")

const {
  PLATFORM_CLEAN_SURFACE,
  PLATFORM_PURGED_SCRIPT_KEYS,
  REQUIRED_PUBLIC_SCRIPT_KEYS,
  resolvePurgeTargets,
  auditPackageJson,
} = scope

const readJson = (rel: string) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))

/**
 * 造一个「派生工作区」沙箱：scripts/ 真拷贝，其余顶层条目软链，package.json 可改。
 * 门禁脚本的 ROOT 由 __dirname 推导 ⇒ 必须整棵 scripts/ 都在沙箱里。
 */
function makeSandbox(label: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cooliebase-${label}-`))
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.name === "scripts" || entry.name === "package.json" || entry.name === "node_modules") continue
    const abs = path.join(ROOT, entry.name)
    if (entry.isSymbolicLink()) continue
    try {
      fs.symlinkSync(abs, path.join(dir, entry.name), "dir")
    } catch {
      fs.symlinkSync(abs, path.join(dir, entry.name), "file")
    }
  }
  fs.cpSync(path.join(ROOT, "scripts"), path.join(dir, "scripts"), { recursive: true })
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(dir, "package.json"))
  return dir
}

function runGate(dir: string, env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [path.join(dir, "scripts/check-workspace-executability.cjs")], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, ...env },
  })
  return { code: result.status, out: `${result.stdout || ""}${result.stderr || ""}` }
}

describe("派生自检的清洗口径（COO-55-1-3）", () => {
  it("默认口径 = 平台 cleanWorkspaceLeaks 全量清洗面（不只是 6 条规约机文件）", () => {
    expect(PLATFORM_CLEAN_SURFACE).toContain("scripts/harness.sh")
    expect(PLATFORM_CLEAN_SURFACE).toContain("server/src/services/blueprint-profiles.ts")
    expect(PLATFORM_CLEAN_SURFACE).toContain("server/src/services/harness-project-provisioner.ts")
    for (const role of [
      "fda",
      "core-swe",
      "fdse",
      "ds",
      "pre-sre",
      "cmmi-gatekeeper",
      "local-team-toolchain",
      "coolie-boss-decision-log",
    ]) {
      expect(PLATFORM_CLEAN_SURFACE, `清洗面漏了内部角色包 ${role}`).toContain(`.agents/skills/${role}`)
    }
    // 母港规约机文件族仍在其中（保守口径：平台已改来源鉴别，偏严不假绿）
    for (const rel of [
      "scripts/speckit.cjs",
      "scripts/check-contracts.mjs",
      "scripts/lib/spec-resolver.cjs",
      "scripts/lib/spec-ontology-driver.cjs",
      "scripts/lib/speckit-issue-verifier.cjs",
      "scripts/lib/ontology-callchain-engine.cjs",
    ]) {
      expect(PLATFORM_CLEAN_SURFACE, `清洗面漏了规约机文件 ${rel}`).toContain(rel)
    }
  })

  it("不设环境变量时：口径完整、无缺口", () => {
    const { targets, coverageGaps } = resolvePurgeTargets({})
    expect(targets).toEqual(PLATFORM_CLEAN_SURFACE)
    expect(coverageGaps).toEqual([])
  })

  it("口径被收窄必须被看见（口径收窄 = 门禁变弱 = 假绿）", () => {
    const { coverageGaps } = resolvePurgeTargets({ DE_LEAK_PRIVATE_FILES: "scripts/harness.sh" })
    expect(coverageGaps.length).toBe(PLATFORM_CLEAN_SURFACE.length - 1)
    expect(coverageGaps).toContain("scripts/lib/spec-resolver.cjs")
  })

  it("口径加宽（默认全量 + 新增项）仍然无缺口", () => {
    const widened = [...PLATFORM_CLEAN_SURFACE, "scripts/some-new-private.cjs"].join(",")
    const { targets, coverageGaps } = resolvePurgeTargets({ DE_LEAK_PRIVATE_FILES: widened })
    expect(coverageGaps).toEqual([])
    expect(targets).toContain("scripts/some-new-private.cjs")
  })

  it("本仓 package.json 现状必须通过（不得引用被清洗文件、公开键齐全）", () => {
    expect(auditPackageJson(readJson("package.json"))).toEqual([])
  })

  it("反向对照：script 值引用 scripts/harness.sh 必须报错（平台会把这个键删掉）", () => {
    const pkg = { scripts: { __probe: "node scripts/harness.sh" } }
    const failures = auditPackageJson(pkg, { requiredKeys: [] })
    expect(failures).toHaveLength(1)
    expect(failures[0].kind).toBe("package-json-references-purged-file")
    expect(failures[0].key).toBe("__probe")
    expect(failures[0].detail).toContain("scripts/harness.sh")
  })

  it("反向对照：script 值指向母港规约机 scripts/speckit.cjs 必须报错（不得当公开入口）", () => {
    const pkg = { scripts: { speckit: "node scripts/speckit.cjs check" } }
    const failures = auditPackageJson(pkg, { requiredKeys: [] })
    expect(failures.some((f: { kind: string }) => f.kind === "package-json-references-purged-file")).toBe(true)
  })

  it("反向对照：公开 script 键被平台删掉必须报错（静默消失，不是报错）", () => {
    const pkg = { scripts: { build: "next build" } }
    const failures = auditPackageJson(pkg)
    const missing = failures.filter((f: { kind: string }) => f.kind === "public-script-key-missing")
    expect(missing.map((f: { key: string }) => f.key)).toEqual(REQUIRED_PUBLIC_SCRIPT_KEYS)
    expect(PLATFORM_PURGED_SCRIPT_KEYS).toContain("speckit")
    expect(PLATFORM_PURGED_SCRIPT_KEYS).toContain("harness")
  })

  it("门禁 CLI：本仓干净树上必须 exit 0", () => {
    const { code, out } = runGate(ROOT)
    expect(code, `门禁在本仓判红：\n${out}`).toBe(0)
  })

  it("门禁 CLI：package.json 装了引用 harness.sh 的探针键必须 exit 1（反向对照）", () => {
    const dir = makeSandbox("exec-probe")
    try {
      const pkgPath = path.join(dir, "package.json")
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      pkg.scripts.__probe = "node scripts/harness.sh"
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

      const { code, out } = runGate(dir)
      expect(code, `装了探针竟然还是绿的：\n${out}`).not.toBe(0)
      expect(out).toContain("package-json-references-purged-file")
      expect(out).toContain("这个 script 键会被整个删掉")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("门禁 CLI：模拟平台清洗后的 package.json（键被删）必须 exit 1（反向对照）", () => {
    const dir = makeSandbox("key-purged")
    try {
      const pkgPath = path.join(dir, "package.json")
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      delete pkg.scripts.speckit
      delete pkg.scripts.harness
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

      const { code, out } = runGate(dir)
      expect(code, `键被删竟然还是绿的：\n${out}`).not.toBe(0)
      expect(out).toContain("public-script-key-missing")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("门禁 CLI：公开脚本 exec 依赖 scripts/harness.sh 必须 exit 1（require/import 之外的依赖形态）", () => {
    const dir = makeSandbox("exec-dep")
    try {
      fs.writeFileSync(
        path.join(dir, "scripts", "__probe-harness-dep.cjs"),
        'const { execFileSync } = require("node:child_process")\n' +
          'execFileSync("bash", ["scripts/harness.sh"], { stdio: "ignore" })\n',
      )

      const { code, out } = runGate(dir)
      expect(code, `exec 依赖竟然还是绿的：\n${out}`).not.toBe(0)
      expect(out).toContain("references-purged-file")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("门禁 CLI：口径被收窄（DE_LEAK_PRIVATE_FILES）必须 exit 1（反向对照）", () => {
    const { code, out } = runGate(ROOT, { DE_LEAK_PRIVATE_FILES: "scripts/harness.sh" })
    expect(code, `口径收窄竟然还是绿的：\n${out}`).not.toBe(0)
    expect(out).toContain("purge-scope-narrower-than-platform")
  })
})
