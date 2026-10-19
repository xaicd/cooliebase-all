import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-generated-paths.cjs"
// 探针必须落在**生成物**范围内（wiki/**），且必须是已跟踪文件 —— 门禁只扫这些。
const HOST = path.join(ROOT, "wiki", "cmmi", "cmmi-lifecycle.md")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

/**
 * 生成物路径真实性门禁。
 *
 * 它只查**生成物**（`wiki/**`）。为什么不全仓查：全仓文档里混着大量**合法**的
 * "不存在的路径"——反例语境（"严禁建立 `docs/skills/`"）、外部项目（DigitalStaff / Paperclip）、
 * 对标框架示例、历史记录。全仓判定误报率极高，必然逼出无意义豁免。
 * 生成物则相反：它**只应该引用真实路径**，实测 95 处引用 0 处不存在（零误报）。
 */
describe("生成物路径真实性门禁", () => {
  function withProbe<T>(probe: string, body: (result: { status: number; stdout: string; stderr: string }) => T): T {
    const original = fs.readFileSync(HOST, "utf8")
    try {
      fs.writeFileSync(HOST, `${original}\n${probe}\n`)
      return body(runGate())
    } finally {
      fs.writeFileSync(HOST, original)
      if (fs.readFileSync(HOST, "utf8") !== original) throw new Error("宿主生成物未逐字还原")
    }
  }

  it("正向：生成物中的路径引用全部真实存在", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
    expect(result.stdout).toMatch(/路径与 \d+ 处文件名引用全部真实存在/)
  })

  it("★ 反向 1：生成物引用了不存在的路径 → 必须失败", () => {
    withProbe("探针：`packages/domains/__definitely_missing__/`", (result) => {
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/__definitely_missing__/)
    })
  })

  it("★ 反向 2：通配写法不得被误判为具体路径（零误报的关键）", () => {
    withProbe("探针：`packages/plugins/plugin-*/contract/`", (result) => {
      expect(result.status).toBe(0)
    })
  })

  it("★ 反向 4：生成物引用了不存在的**裸文件名** → 必须失败", () => {
    // 这条口径是被实际漏检逼出来的：只查"以目录开头的完整路径"时，
    // `agent-page-schemas.generated.json`（真值是 packages/shared/contract/page-schemas.generated.ts）
    // 整整溜了过去 —— 它没有前导目录。
    withProbe("探针：`__definitely_missing__.generated.json`", (result) => {
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/__definitely_missing__/)
      expect(`${result.stderr}${result.stdout}`).toMatch(/文件名/)
    })
  })

  it("★ 反向 5：**存在**的裸文件名不得被误报（零误报的关键）", () => {
    withProbe("探针：`package.json` 与 `tsconfig.json`", (result) => {
      expect(result.status).toBe(0)
    })
  })

  it("★ 反向 3：失败信息必须指向**生成器**而不是让人改生成物", () => {
    withProbe("探针：`docs/__definitely_missing__.md`", (result) => {
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/请修\*\*生成器\*\*/)
    })
  })
})
