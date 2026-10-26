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
  // 整个 scripts/ 目录都要拷：speckit.ts 依赖同目录的 ./lib/*.cjs
  // （只拷单文件会报 `Cannot find module './lib/spec-resolver.cjs'` —— 实测）
  fs.cpSync(path.join(ROOT, "scripts"), path.join(dir, "scripts"), {
    recursive: true,
    filter: (src) => !src.includes("__tests__") && !src.includes("node_modules"),
  })
  // 另一个规格也声明同一个文件 → 让它成为「共享文件」
  fs.mkdirSync(path.join(dir, "docs/specs/infra/other-spec"), { recursive: true })

  // 两份文件都要：speckit 的**任务表**读 tasks.md，**共享文件索引**读 brief.json（实测）
  const table = [
    "| 任务ID | 父任务 | 任务名称 | 白名单限制 | 状态 |",
    "|---|---|---|---|---|",
    "| T1 | main | 任务一 | shared/thing.txt | 未开始 |",
    "| T2 | main | 任务二 | docs/01_management/project-plan.md | 未开始 |",
    "",
  ].join("\n")
  fs.writeFileSync(path.join(dir, "docs/specs/infra", SPEC_NAME, "tasks.md"), `# Tasks: ${SPEC_NAME}\n\n${table}`)

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
  fs.writeFileSync(path.join(dir, "pnpm-workspace.yaml"), "packages: []\n")

  // 临时仓库没有 node_modules —— tsx 解析不到自己的依赖就会 ERR_MODULE_NOT_FOUND（实测）。
  // 软链真仓的 node_modules 即可，不需要 pnpm install。
  try {
    fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir")
  } catch {
    /* 已存在则忽略 */
  }

  sh(dir, ["git", "init", "-q"])
  sh(dir, ["git", "config", "user.email", "t@t.t"])
  sh(dir, ["git", "config", "user.name", "t"])
  sh(dir, ["git", "add", "-A"])
  sh(dir, ["git", "commit", "-q", "-m", "chore: init"])
  return dir
}

function tasksReport(dir: string): string {
  try {
    return sh(dir, [path.join(ROOT, "node_modules/.bin/tsx"), "scripts/speckit.ts", "tasks", "--spec", SPEC_NAME])
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
      // 注意：`[other-spec/T2]` 里并**不**包含子串 `[T2]`（是 `spec/T2]`），
      // 所以它连候选都进不了 —— 工具此时报的是「无物理提交」，这是对的。
      commitShared(dir, "[other-spec/T2] test: 这是别人的 T2")
      const r = row(tasksReport(dir), "T2")
      expect(r).not.toContain("已完成")
      expect(r).toContain("无物理提交")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
