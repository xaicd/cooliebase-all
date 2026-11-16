import { NextResponse } from "next/server"
import { AiService } from "@/modules/ai/backend/services"
import { aiEmbeddingSchema } from "@/modules/ai/backend/validators"
import { readOpenApiKey } from "@/modules/ai/backend/lib/open-api-key"

function fail(error: unknown) {
  const status =
    typeof error === "object" && error && "status" in error ? Number((error as { status: number }).status) : 400
  const message = error instanceof Error ? error.message : "请求失败"
  return NextResponse.json(
    { error: { message, type: "invalid_request_error" } },
    { status: Number.isFinite(status) ? status : 400 },
  )
}

export async function POST(request: Request) {
  try {
    const apiKey = readOpenApiKey(request)
    if (!apiKey) {
      return NextResponse.json({ error: { message: "缺少令牌" } }, { status: 401 })
    }
    const body = aiEmbeddingSchema.parse(await request.json())
    const data = await AiService.embed({
      apiKey,
      model: body.model,
      input: body.input,
    })
    return NextResponse.json(data)

  } catch (error) {
    return fail(error)
  }
}
