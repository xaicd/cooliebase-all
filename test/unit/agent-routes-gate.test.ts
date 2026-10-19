import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-agent-routes.cjs"
const AI_DIR = path.join(ROOT, "packages", "plugins", "plugin-ai")
const PROBE_CONTRACT = path.join(AI_DIR, "agent", "__probe__.agent.json")
const ROUTE_FILE = path.join(AI_DIR, "routes", "admin", "ai-tool", "route.ts")
const ID_ROUTE_FILE = path.join(AI_DIR, "routes", "admin", "ai-tool", "[id]", "route.ts")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

const PROBE = JSON.stringify(
  {
    $schema: "cooliebase.agent.contract/v1",
    domain: "ai",
    entity: "__Probe__",
    kebab: "__probe__",
    businessName: "探针",
    permissionPrefix: "ai:probe",
    page: { route: "/admin/ai/ai-tool", title: "探针", titleSelector: '[data-testid="ai-tool-title"]' },
    api: {
      pluginMount: "/api/v1/plugins/cooliebase.ai/api",
      bffMount: "/api/v1/admin/ai",
      resource: "__probe_resource__",
      methods: { list: { http: "GET", path: "/__probe_resource__" } },
    },
  },
  null,
  2,
)

/**
 * Agent 契约 ↔ 后端路由门禁。
 *
 * 它分两种模式：
 *   · **enforce**（必须为 0）：HTTP 方法不匹配；资源目录在、但方法文件缺失。
 *   · **ratchet**（冻结既有欠债）：整块资源目录缺失（实测 48 个资源 —— 契约与页面都在、后端没有）。
 *
 * 三条反向对照分别覆盖这三种失败模式 —— 少任何一条，就有一种错法可以静默通过。
 */
describe("Agent 契约 ↔ 后端路由门禁", () => {
  function withRestore<T>(
    file: string,
    mutate: () => void,
    body: (result: ReturnType<typeof runGate>) => T,
  ): T {
    const original = fs.readFileSync(file, "utf8")
    try {
      mutate()
      return body(runGate())
    } finally {
      fs.writeFileSync(file, original)
      if (fs.readFileSync(file, "utf8") !== original) throw new Error(`${file} 未逐字还原`)
    }
  }

  it("正向：契约方法全部有路由导出；既有欠债已冻结、无新增", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
    expect(result.stdout).toMatch(/0 处不匹配/)
  })

  it("★ 反向 1（ratchet）：新增一个「契约有、后端无路由」的资源 → 必须失败", () => {
    // 这正是本门禁要防的主要风险：新写的契约配了页面却没有后端路由，页面必然 404。
    try {
      fs.writeFileSync(PROBE_CONTRACT, PROBE)
      const result = runGate()
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/__probe_resource__/)
      expect(`${result.stderr}${result.stdout}`).toMatch(/新增/)
    } finally {
      fs.rmSync(PROBE_CONTRACT, { force: true })
    }
  })

  it("★ 反向 2（enforce）：路由文件里 HTTP 方法导出被改掉 → 必须失败", () => {
    withRestore(
      ROUTE_FILE,
      () => {
        // 本仓两种导出写法并存：`export const GET = …`（142 文件）与
        // `export async function GET(…)`（681 文件）—— 只改其中一种会漏（我第一次就踩了）。
        const text = fs.readFileSync(ROUTE_FILE, "utf8").replace(
          /export\s+(async\s+function|const)\s+GET\b/,
          (matched) => matched.replace("GET", "PATCH"),
        )
        fs.writeFileSync(ROUTE_FILE, text)
      },
      (result) => {
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/没有对应导出/)
      },
    )
  })

  it("★ 反向 3（enforce）：资源目录在、但某个方法的路由文件缺失 → 必须失败", () => {
    // 模拟"路由被误删了单个文件"—— 这类**回归**必须立刻变红，而不是落进棘轮欠债里。
    const backup = `${ID_ROUTE_FILE}.probe-backup`
    fs.renameSync(ID_ROUTE_FILE, backup)
    try {
      const result = runGate()
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/找不到文件/)
    } finally {
      fs.renameSync(backup, ID_ROUTE_FILE)
    }
    expect(runGate().status).toBe(0)
  })
})
