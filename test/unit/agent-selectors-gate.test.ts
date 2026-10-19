import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-agent-selectors.cjs"
// 探针载体：本门禁读**已跟踪**文件（契约 + 页面模块）
const PAGE = path.join(ROOT, "packages", "domains", "infra", "frontend", "pages", "configs.page.tsx")
const CONTRACT = path.join(ROOT, "packages", "domains", "infra", "agent", "config.agent.json")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

function withMutated<T>(file: string, mutate: (text: string) => string, body: (r: ReturnType<typeof runGate>) => T): T {
  const original = fs.readFileSync(file, "utf8")
  try {
    fs.writeFileSync(file, mutate(original))
    return body(runGate())
  } finally {
    fs.writeFileSync(file, original)
    if (fs.readFileSync(file, "utf8") !== original) throw new Error(`${file} 未逐字还原`)
  }
}

/**
 * Agent 契约 ↔ 页面选择器一致性门禁。
 *
 * 它守的是"契约声明的 titleSelector 在页面里真的存在"——`agent-contract.spec.ts` 的无头探针
 * 正是靠它定位页面，此前**零门禁覆盖**，实测确有 2 处页面完全没有 `data-testid`。
 *
 * 判定口径刻意用**路由 → 页面注册表 → 页面模块**，而不是"文件名含 kebab"的 glob：
 * 后者曾把 `config` 猜到 `file-configs.page.tsx` 上，产生过误报。
 */
describe("Agent 契约选择器一致性门禁", () => {
  it("正向：全部契约的 titleSelector 都在对应页面里", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
    // 不写死数量：契约数会随 codegen 增长（实测 326 → 342），写死会让测试变成"文档更新器"
    expect(result.stdout).toMatch(/\d+ 份契约/)
  })

  it("★ 反向 1：页面缺了契约声明的 data-testid → 必须失败并点名两边", () => {
    // 这正是本门禁建立前真实存在的形态（infra/config 与 system/user 两个页面完全没有 testid）。
    withMutated(PAGE, (text) => text.replace(/ data-testid="config-title"/, ""), (result) => {
      expect(result.status).toBe(1)
      const output = `${result.stderr}${result.stdout}`
      expect(output).toMatch(/config\.agent\.json/)
      expect(output).toMatch(/configs\.page\.tsx/)
    })
  })

  it("★ 反向 2：契约声明了注册表里没有的路由 → 必须失败（路由解析这条路也要守）", () => {
    withMutated(
      CONTRACT,
      (text) => text.replace(/("route":\s*")\/admin\/infra\/configs(")/, "$1/admin/infra/__no_such_route__$2"),
      (result) => {
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/在页面注册表里找不到/)
      },
    )
  })
})
