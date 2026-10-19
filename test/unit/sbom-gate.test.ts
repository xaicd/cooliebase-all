import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/generate-sbom.cjs"
const SBOM = path.join(ROOT, "docs", "04_implementation", "sbom.json")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE, "--check"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

/**
 * SBOM 漂移门禁。
 *
 * 它守的是"物料清单与锁文件一致"：SBOM 一旦与 `pnpm-lock.yaml` 脱钩，
 * 它就从"物料清单"退化成"一份写着包名的旧文档" —— 而质量阶段仍会把它当真实资产。
 *
 * 注意 `--check` **只比较包名+版本**，不比较许可证列：许可证来自已安装依赖树，
 * 是**环境相关**的（其他平台的可选二进制在本机不安装），纳入判定会让门禁"换个平台就红"。
 */
describe("SBOM 漂移门禁", () => {
  function withMutatedSbom<T>(mutate: (report: any) => void, body: () => T): T {
    const original = fs.readFileSync(SBOM, "utf8")
    try {
      const report = JSON.parse(original)
      mutate(report)
      fs.writeFileSync(SBOM, `${JSON.stringify(report, null, 2)}\n`)
      return body()
    } finally {
      fs.writeFileSync(SBOM, original)
      if (fs.readFileSync(SBOM, "utf8") !== original) throw new Error("sbom.json 未逐字还原")
    }
  }

  it("正向：当前 SBOM 与锁文件一致", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向 1：清单里少登记一个包 → 必须失败", () => {
    withMutatedSbom(
      (report) => {
        report.components.pop()
      },
      () => {
        const result = runGate()
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/未登记/)
      },
    )
  })

  it("★ 反向 2：计数与实际不符 → 必须失败", () => {
    withMutatedSbom(
      (report) => {
        report.componentCount.total += 1
      },
      () => {
        const result = runGate()
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/计数不一致/)
      },
    )
  })

  it("★ 反向 3：版本基线漂移 → 必须失败", () => {
    withMutatedSbom(
      (report) => {
        report.templateVersion = "0.0.0-stale"
      },
      () => {
        const result = runGate()
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/版本基线漂移/)
      },
    )
  })
})
