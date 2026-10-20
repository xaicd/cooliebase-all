import { NextResponse } from "next/server"
import { IotSceneRuleService } from "@/modules/iot/backend/services/iot-scene-rule.service"
import { iotSceneRuleCreateSchema, iotSceneRulePageQuerySchema, iotSceneRuleUpdateSchema } from "@/modules/iot/backend/validators/iot-scene-rule.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = iotSceneRulePageQuerySchema.parse(raw)
    const data = await IotSceneRuleService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await IotSceneRuleService.create(iotSceneRuleCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
