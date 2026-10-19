import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-engineering-standards.cjs"

/** 代码生成的服务：签名是 (id, data, …) —— 传单对象首参就是错的。 */
const CODEGEN_ROUTE = path.join(ROOT, "packages", "plugins", "plugin-ai", "routes", "admin", "ai-tool", "[id]", "route.ts")
/** 手写定制服务：签名是 (input: UpdateInput) —— 单对象首参是**对的**。 */
const BESPOKE_ROUTE = path.join(ROOT, "packages", "domains", "system", "routes", "admin", "depts", "[id]", "route.ts")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

function withInjected<T>(file: string, snippet: string, body: (r: ReturnType<typeof runGate>) => T): T {
  const original = fs.readFileSync(file, "utf8")
  try {
    fs.writeFileSync(file, `${original}\n${snippet}\n`)
    return body(runGate())
  } finally {
    fs.writeFileSync(file, original)
    if (fs.readFileSync(file, "utf8") !== original) throw new Error(`${file} 未逐字还原`)
  }
}

/**
 * 规则 `route-service-update-arity`。
 *
 * 它守的是一个**实证过的系统性缺陷**：339 个代码生成的服务声明 `update(id, data, …)`，
 * 而 348 处 route 调用写成 `Service.update({ ...body, id })` —— 实测抛
 * `Cannot read properties of undefined (reading 'name')`，即**更新接口全部失效**。
 *
 * 关键是它**必须先解析服务的真实签名**：`SystemDeptService.update(input: UpdateInput)`
 * 是手写定制服务、签名本就是单对象，那种调用是对的。第一版规则没做这件事，直接误报了它。
 */
describe("规则：route 层 Service.update 参数形态", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向 1：对「签名是 (id, data)」的服务传单对象 → 必须失败", () => {
    withInjected(CODEGEN_ROUTE, "export const __probe = async () => AiToolService.update({ ...body, id })", (result) => {
      expect(result.status).toBe(1)
      const output = `${result.stderr}${result.stdout}`
      expect(output).toMatch(/route-service-update-arity/)
      expect(output).toMatch(/ai-tool/)
    })
  })

  it("★ 反向 2：对「签名是单对象」的定制服务传单对象 → **不得**误报", () => {
    // 这条锁的是规则的精度：不做签名解析就会误报 SystemDeptService —— 误报会逼出无意义豁免。
    withInjected(BESPOKE_ROUTE, "export const __probe = async () => SystemDeptService.update({ ...input })", (result) => {
      expect(result.status).toBe(0)
      // 注意：不能断言"输出里不含规则名" —— PASS 摘要行本身就会打印规则名。
      // 要断言的是"没有针对该规则的 FAIL / 违规明细"。
      const output = `${result.stderr}${result.stdout}`
      expect(output).not.toMatch(/FAIL\s+route-service-update-arity/)
      expect(output).not.toMatch(/depts\/\[id\]\/route\.ts/)
    })
  })
})
