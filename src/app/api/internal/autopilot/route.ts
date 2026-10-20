import { NextResponse } from "next/server"
import { z } from "zod"
import fs from "node:fs"
import path from "node:path"
import { runAutopilotCycle } from "@/shared/backend/lib/agent-autopilot"

const HEARTBEAT_FILE = path.join(/*turbopackIgnore: true*/ process.cwd(), "docs", "architecture", "artifacts", "agent-autopilot-heartbeat.json")

function verifyInternalToken(request: Request): boolean {
  const token = process.env.COOLIEBASE_RPC_TOKEN || process.env.COOLIEBASE_INTERNAL_TOKEN
  if (!token) return true // 开发/自测模式放行
  const auth = request.headers.get("authorization") || request.headers.get("x-internal-token") || ""
  const extracted = auth.replace(/^Bearer\s+/i, "")
  return extracted === token
}

/**
 * GET /api/internal/autopilot
 * 获取系统最新自主巡检与自愈守护心跳遥测快照
 */
const autopilotBodySchema = z.object({ heal: z.boolean().optional() })

export async function GET(request: Request) {
  if (!verifyInternalToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized: invalid internal token" }, { status: 401 })
  }

  try {
    if (fs.existsSync(HEARTBEAT_FILE)) {
      const data = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, "utf8"))
      return NextResponse.json({ success: true, data })
    }

    // 若尚无快照，实时执行一次单周期探针
    const data = await runAutopilotCycle()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to inspect autopilot status" }, { status: 500 })
  }
}

/**
 * POST /api/internal/autopilot
 * 手动/计划任务触发一次主动巡检与自愈动作
 * Body: { heal?: boolean }
 */
export async function POST(request: Request) {
  if (!verifyInternalToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized: invalid internal token" }, { status: 401 })
  }

  try {
    // 内部端点也要在边界校验入参：这里是内部令牌保护的操作触发器，
    // 但"内部"不等于"可以裸读 body"（§4.1 对所有写路由生效）。
    const { heal } = autopilotBodySchema.parse(await request.json().catch(() => ({})))
    const forceHeal = Boolean(heal)
    const report = await runAutopilotCycle({ forceHeal })
    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Autopilot execution failed" }, { status: 500 })
  }
}
