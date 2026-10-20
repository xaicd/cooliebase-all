import { NextResponse } from "next/server"
import { IotAlertConfigService } from "@/modules/iot/backend/services/iot-alert-config.service"
import { iotAlertConfigCreateSchema, iotAlertConfigPageQuerySchema, iotAlertConfigUpdateSchema } from "@/modules/iot/backend/validators/iot-alert-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = iotAlertConfigPageQuerySchema.parse(raw)
    const data = await IotAlertConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await IotAlertConfigService.create(iotAlertConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
