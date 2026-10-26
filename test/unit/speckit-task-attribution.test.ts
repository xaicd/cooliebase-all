import { describe, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"

/**
 * 任务归属判据的**常驻反向对照**。
 *
 * 背景（实测事故）：`[T<ID>]` 是**全仓可见**的 —— 别的规格也用 `T3` 时，
 * 它那条提交会命中本规格的 T3，于是在**根本没做**的情况下报「3/3 100%」。
 * 修完之后判据分三层（无歧义标记 / 独有文件 / 提到规格名或碰规格目录），
 * 无法归属时**如实标注**并报出「和哪个规格撞了」。
 *
 * 这个测试把那次实测**固化**下来：在临时 Git 仓库里造提交，跑真的 `speckit.ts`，
 * 断言「带规格名 → 归得上」「不带 → 归不上」。这样以后再改判据不会悄悄退化。
 */

const ROOT = path.resolve(__dirname, "../..")
const SPECKIT = path.join(ROOT, "scripts/speckit.ts")
const SPEC_NAME = "ghost-spec"

function sh(cwd: string, args: string[]): string {
  return execFileSync(args[0], args.slice(1), { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
}

/** 造一个最小 Git 仓库：一份 brief.json（两个任务，白名单都指向同一个**共享**文件）+ scripts/speckit.ts */
function makeRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "speckit-attrib-"))
  fs.mkdirSync(path.join(dir, "docs/specs/infra", SPEC_NAME), { recursive: true })
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true })
  fs.copyFileSync(SPECKIT, path.join(dir, "scripts/speckit.ts"))
  // 另一个规格也声明同一个文件 → 让它成为「共享文件」
  fs.mkdirSync(path.join(dir, "docs/specs/infra/other-spec"), { recursive: true })

  const brief = {
    name: SPEC_NAME,
    domain: "infra",
    tasks: [
      { id: "T1", parent: "main", title: "任务一", files: ["shared/thing.txt"] },
      { id: "T2", parent: "main", title: "任务二", files: ["docs/01_management/project-plan.md"] },
    ],
  }
  fs.writeFileSync(path.join(dir, "docs/specs/infra", SPEC_NAME, "brief.json"), JSON.stringify(brief, null, 2))
  fs.writeFileSync(
    path.join(dir, "docs/specs/infra/other-spec/brief.json"),
    JSON.stringify({ name: "other-spec", domain: "infra", tasks: [{ id: "T2", files: ["docs/01_management/project-plan.md"] }] }, null, 2),
  )
  fs.mkdirSync(path.join(dir, "docs/01_management"), { recursive: true })
  fs.writeFileSync(path.join(dir, "docs/01_management/project-plan.md"), "# plan\n")
  fs.writeFileSync(path.join(dir, "package.json"), '{"name":"t","private":true}\n')

  sh(dir, ["git", "init", "-q"])
  sh(dir, ["git", "config", "user.email", "t@t.t"])
  sh(dir, ["git", "config", "user.name", "t"])
  sh(dir, ["git", "add", "-A"])
  sh(dir, ["git", "commit", "-q", "-m", "chore: init"])
  return dir
}

function tasksReport(dir: string): string {
  try {
    return sh(dir, [process.execPath, "--import", "tsx", "scripts/speckit.ts", "tasks", "--spec", SPEC_NAME])
  } catch (e: any) {
    return `${e.stdout || ""}${e.stderr || ""}`
  }
}

function row(report: string, id: string): string {
  return report.split("\n").find((l) => l.startsWith(`| ${id} `)) || ""
}

function commitShared(dir: string, message: string) {
  fs.appendFileSync(path.join(dir, "docs/01_management/project-plan.md"), "x\n")
  sh(dir, ["git", "add", "-A"])
  sh(dir, ["git", "commit", "-q", "-m", message])
}

describe("speckit 任务归属：只碰共享文件时，靠标记消歧", () => {
  it("反向对照①：只写 [T2] 且只改共享文件 → 无法归属，且报出撞车规格", () => {
    const dir = makeRepo()
    try {
      commitShared(dir, "[T2] test: 只改共享文件，标记无规格名")
      const r = row(tasksReport(dir), "T2")
      expect(r).toContain("无法归属")
      expect(r).toContain("other-spec") // 必须说清和谁撞了，否则读的人没法行动
      expect(r).toContain(`[${SPEC_NAME}/T2]`) // 并且给出消歧办法
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("正向：写 [<规格名>/T2] 且只改共享文件 → 归得上", () => {
    const dir = makeRepo()
    try {
      commitShared(dir, `[${SPEC_NAME}/T2] test: 只改共享文件，但标记带规格名`)
      const r = row(tasksReport(dir), "T2")
      expect(r).toContain("已完成")
      expect(r).not.toContain("无法归属")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("别的规格的提交不会算到本规格头上", () => {
    const dir = makeRepo()
    try {
      commitShared(dir, "[other-spec/T2] test: 这是别人的 T2")
      const r = row(tasksReport(dir), "T2")
      expect(r).toContain("无法归属")
      expect(r).not.toContain("已完成")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
