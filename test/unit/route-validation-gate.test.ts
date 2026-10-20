import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-route-validation.cjs"
/** 探针落点：插件路由目录（门禁只扫 packages/plugins 与 src/app/api）。 */
const PROBE_DIR = "packages/plugins/plugin-ai/routes/admin/__probe_route_validation__"

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
 * 路由校验覆盖门禁（AGENTS §4.1）。
 *
 * 守的是「写路由不得绕过 Validator 直连 Service」。既有 794 条欠债棘轮冻结，只拦新增。
 *
 * 这里**两个反向对照**都是必须的：
 * ① 注入一个裸传 body 的写路由 → 必须 FAIL（否则门禁形同虚设）；
 * ② 微调基线的**冻结语义**太容易做错 —— 若门禁变成"只要基线存在就放行"，
 *    上面的注入也不会红，所以 ① 同时验证了基线没有被当成免死金牌。
 */
describe("路由校验覆盖门禁（§4.1 禁止裸传 body）", () => {
  const probeFile = path.join(ROOT, PROBE_DIR, "route.ts")

  function withProbe<T>(source: string, body: () => T): T {
    const dir = path.join(ROOT, PROBE_DIR)
    try {
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(probeFile, source)
      return body()
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
      if (fs.existsSync(probeFile)) throw new Error("探针未清理干净")
    }
  }

  it("正向：当前无新增裸传写路由", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向：注入一个裸传 body 的写路由后必须 FAIL 并指名该文件", () => {
    const unvalidated = [
      'import { NextResponse } from "next/server"',
      "export async function POST(request: Request) {",
      "  const body = await request.json()",
      "  return NextResponse.json({ success: true, data: body })",
      "}",
      "",
    ].join("\n")

    const result = withProbe(unvalidated, runGate)
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/FAIL/)
    expect(result.stderr).toMatch(/__probe_route_validation__/)
  })

  it("反向：带校验器的写路由**不应**被判为违规", () => {
    const validated = [
      'import { NextResponse } from "next/server"',
      'import { z } from "zod"',
      "const probeSchema = z.object({ name: z.string() })",
      "export async function POST(request: Request) {",
      "  const body = await request.json()",
      "  const data = probeSchema.parse(body)",
      "  return NextResponse.json({ success: true, data })",
      "}",
      "",
    ].join("\n")

    const result = withProbe(validated, runGate)
    expect(result.status).toBe(0)
  })

  it("探针清理后回到通过（不留痕）", () => {
    const result = runGate()
    expect(result.status).toBe(0)
  })
})
