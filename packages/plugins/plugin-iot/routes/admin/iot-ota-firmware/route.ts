import { NextResponse } from "next/server"
import { IotOtaFirmwareService } from "@/modules/iot/backend/services/iot-ota-firmware.service"
import { iotOtaFirmwareCreateSchema, iotOtaFirmwarePageQuerySchema, iotOtaFirmwareUpdateSchema } from "@/modules/iot/backend/validators/iot-ota-firmware.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = iotOtaFirmwarePageQuerySchema.parse(raw)
    const data = await IotOtaFirmwareService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await IotOtaFirmwareService.create(iotOtaFirmwareCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
