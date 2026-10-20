import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const SCRIPT = path.join(ROOT, "scripts/check-plan-freshness.cjs")
const PLAN = "docs/01_management/project-plan.md"
const tmpRoots: string[] = []

afterAll(() => {
  for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true })
})

/**
 * WBS 时效性门禁（`npm run plan:freshness`，pre-commit 内执行）。
 *
 * 它解决的是一段真实的脱节：一轮做了 32 个提交，而 `project-plan.md` 只在被追问时才更新一次。
 * 判据刻意分两档，因为「每次改代码都要改计划」这种规则会被直接绕过：
 *   · **硬**：新增 script / 门禁 / 域 —— 能力面变了，计划必须跟随；
 *   · **软**：仅触及 `packages/` —— 只提示，不阻断。
 */
function sandbox(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plan-freshness-"))
  tmpRoots.push(dir)
  const write = (rel: string, content: string) => {
    const full = path.join(dir, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
  }
  const git = (...args: string[]) => spawnSync("git", args, { cwd: dir, encoding: "utf8" })

  write("package.json", JSON.stringify({ scripts: { "test:a": "node -e 0" } }, null, 2))
  write(
    "packages/shared/contract/compat-manifest.json",
    JSON.stringify({ consumptionSurface: { gates: ["test:a"] } }, null, 2),
  )
  write("packages/shared/backend/constants/domain-catalog.json", JSON.stringify({ domains: [{ id: "system" }] }, null, 2))
  write(PLAN, "# plan\n")
  git("init", "-q")
  git("config", "user.email", "t@example.com")
  git("config", "user.name", "t")
  git("add", "-A")
  git("commit", "-q", "-m", "init")
  return dir
}

function run(dir: string): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT], {
      encoding: "utf8",
      env: { ...process.env, PLAN_FRESHNESS_ROOT: dir },
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, out }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

function stage(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
  spawnSync("git", ["add", rel], { cwd: dir })
}

describe("WBS 时效性门禁", () => {
  it("没有暂存改动 → 通过", () => {
    const dir = sandbox()
    expect(run(dir).status).toBe(0)
  })

  it("★ 新增 npm script 但没改计划 → 失败（能力面变了）", () => {
    const dir = sandbox()
    stage(dir, "package.json", JSON.stringify({ scripts: { "test:a": "node -e 0", "test:b": "node -e 0" } }, null, 2))
    const result = run(dir)
    expect(result.status).toBe(1)
    expect(result.out).toMatch(/新增 npm script: test:b/)
  })

  it("★ 同上，但同一次提交里更新了计划 → 通过（这才是正确姿势）", () => {
    const dir = sandbox()
    stage(dir, "package.json", JSON.stringify({ scripts: { "test:a": "node -e 0", "test:b": "node -e 0" } }, null, 2))
    stage(dir, PLAN, "# plan\n\n## 4. WBS\n新增 test:b\n")
    expect(run(dir).status).toBe(0)
  })

  it("★ 新增门禁 → 失败；只触及 packages/ → 仅提示不阻断", () => {
    const dir = sandbox()
    stage(
      dir,
      "packages/shared/contract/compat-manifest.json",
      JSON.stringify({ consumptionSurface: { gates: ["test:a", "new:check"] } }, null, 2),
    )
    const gated = run(dir)
    expect(gated.status).toBe(1)
    expect(gated.out).toMatch(/新增门禁/)

    spawnSync("git", ["reset", "-q"], { cwd: dir })
    stage(dir, "packages/demo.ts", "export const x = 1\n")
    const soft = run(dir)
    expect(soft.status).toBe(0)
    expect(soft.out).toMatch(/提示（不阻断）/)
  })

  it("★ 新增域 → 失败", () => {
    const dir = sandbox()
    stage(
      dir,
      "packages/shared/backend/constants/domain-catalog.json",
      JSON.stringify({ domains: [{ id: "system" }, { id: "shop" }] }, null, 2),
    )
    const result = run(dir)
    expect(result.status).toBe(1)
    expect(result.out).toMatch(/新增域: shop/)
  })
})
