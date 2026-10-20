import { NextResponse } from "next/server"
import { MesMdAutoCodeRecordService } from "@/modules/mes/backend/services/mes-md-auto-code-record.service"
import { mesMdAutoCodeRecordCreateSchema, mesMdAutoCodeRecordPageQuerySchema, mesMdAutoCodeRecordUpdateSchema } from "@/modules/mes/backend/validators/mes-md-auto-code-record.validator"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await MesMdAutoCodeRecordService.get(id)
    if (!data) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const data = await MesMdAutoCodeRecordService.update(id, mesMdAutoCodeRecordUpdateSchema.parse({ ...body, id }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await MesMdAutoCodeRecordService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
