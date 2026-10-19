import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-engineering-standards.cjs"
const CLIENT = path.join(ROOT, "packages", "plugins", "plugin-ai", "frontend", "api", "ai-tool.api.ts")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

function withInjected<T>(snippet: string, body: (r: ReturnType<typeof runGate>) => T): T {
  const original = fs.readFileSync(CLIENT, "utf8")
  try {
    fs.writeFileSync(CLIENT, `${original}\n${snippet}\n`)
    return body(runGate())
  } finally {
    fs.writeFileSync(CLIENT, original)
    if (fs.readFileSync(CLIENT, "utf8") !== original) throw new Error("客户端文件未逐字还原")
  }
}

/**
 * 规则 `frontend-api-url-shape`。
 *
 * 实证：340 个生成客户端写成 `request.put(BASE_URL, data)` 与
 * `request.delete(`${BASE_URL}?id=${id}`)` —— 打的是**集合路径**；
 * 而路由注册里 PUT/DELETE 有 **696 个是 item 级**（`/[id]`），collection 级仅 40 个且全是
 * 定制动作（`/profile`、`/channels` 之类）。即：界面的"编辑保存"与"删除"打的是没人处理的路径。
 */
describe("规则：api 客户端 URL 形态", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向 1：PUT 打到集合路径 → 必须失败", () => {
    withInjected(
      "export const __probePut = async () => request.put<ProbeVO>(BASE_URL, {})",
      (result) => {
        expect(result.status).toBe(1)
        const output = `${result.stderr}${result.stdout}`
        expect(output).toMatch(/frontend-api-url-shape/)
        expect(output).toMatch(/PUT 打到集合路径/)
      },
    )
  })

  it("★ 反向 2：DELETE 用 ?id= 查询参数 → 必须失败", () => {
    withInjected(
      "export const __probeDelete = async (id: string) => request.delete<void>(`${BASE_URL}?id=${id}`)",
      (result) => {
        expect(result.status).toBe(1)
        const output = `${result.stderr}${result.stdout}`
        expect(output).toMatch(/frontend-api-url-shape/)
        expect(output).toMatch(/DELETE 用 \?id=/)
      },
    )
  })

  it("★ 反向 3：正确的 item 路径写法 → **不得**误报", () => {
    withInjected(
      "export const __probeOk = async (id: string) => request.delete<void>(`${BASE_URL}/${id}`)",
      (result) => {
        expect(result.status).toBe(0)
        const output = `${result.stderr}${result.stdout}`
        expect(output).not.toMatch(/FAIL\s+frontend-api-url-shape/)
      },
    )
  })
})
