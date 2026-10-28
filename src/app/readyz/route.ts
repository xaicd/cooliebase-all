import { NextResponse } from "next/server"
import { checkRuntimeReadiness, getReadinessDiagnostics } from "@/modules/shared/backend/lib/runtime-readiness"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Anonymous readiness probe used by load balancers before they send application traffic. */
export async function GET() {
  const readiness = await checkRuntimeReadiness()
  const status = readiness.ready ? 200 : 503
  return NextResponse.json(
    readiness.ready
      ? { success: true, data: { status: "ready", ...getReadinessDiagnostics() } }
      : {
          success: false,
          error: "service is not ready",
          // **带上 reason**：原先只返回 diagnostics，把"为什么不就绪"丢了 ——
          // 排查时只能看到 driver/env，看不到真正的原因（本文件 line 10 明明有 reason）。
          // reason 是固定英文文案（如 "persistent database is required in production"），不含敏感信息。
          reason: "reason" in readiness ? readiness.reason : undefined,
          data: getReadinessDiagnostics(),
        },
    { status, headers: { "Cache-Control": "no-store" } },
  )
}
