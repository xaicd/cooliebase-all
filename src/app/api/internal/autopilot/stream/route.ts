import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { runAutopilotCycle, type AutopilotHeartbeat } from "@/shared/backend/lib/agent-autopilot"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const HEARTBEAT_FILE = path.join(/*turbopackIgnore: true*/ process.cwd(), "docs", "architecture", "artifacts", "agent-autopilot-heartbeat.json")

function verifyInternalToken(request: Request): boolean {
  const token = process.env.COOLIEBASE_RPC_TOKEN || process.env.COOLIEBASE_INTERNAL_TOKEN
  if (!token) return true // 开发/自测模式放行
  const auth = request.headers.get("authorization") || request.headers.get("x-internal-token") || ""
  const url = new URL(request.url)
  const queryToken = url.searchParams.get("token") || ""
  const extracted = (auth.replace(/^Bearer\s+/i, "") || queryToken).trim()
  return extracted === token
}

/**
 * GET /api/internal/autopilot/stream
 * Server-Sent Events (SSE) 实时流式推送系统巡检与自愈守护脉冲
 */
export async function GET(request: Request) {
  if (!verifyInternalToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized: invalid internal token" }, { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // 1. 发送初始建立连接帧与最新遥测
      try {
        let initialData: AutopilotHeartbeat | null = null
        if (fs.existsSync(HEARTBEAT_FILE)) {
          initialData = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, "utf8"))
        } else {
          initialData = await runAutopilotCycle()
        }
        controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`))
        controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify(initialData)}\n\n`))
      } catch (err: any) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err?.message || "Initial probe failed" })}\n\n`))
      }

      // 2. 定时推送脉冲（每 4 秒流式下发一次最新心跳）
      const interval = setInterval(async () => {
        try {
          if (request.signal.aborted) {
            clearInterval(interval)
            return
          }
          let data: AutopilotHeartbeat | null = null
          if (fs.existsSync(HEARTBEAT_FILE)) {
            data = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, "utf8"))
          } else {
            data = await runAutopilotCycle()
          }
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // 容错保持连接
        }
      }, 4000)

      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
