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
      : { success: false, error: "service is not ready", data: getReadinessDiagnostics() },
    { status, headers: { "Cache-Control": "no-store" } },
  )
}
