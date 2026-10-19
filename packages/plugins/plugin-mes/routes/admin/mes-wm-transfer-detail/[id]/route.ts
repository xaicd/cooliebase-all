import { NextResponse } from "next/server"
import { MesWmTransferDetailService } from "@/modules/mes/backend/services/mes-wm-transfer-detail.service"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await MesWmTransferDetailService.get(id)
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
    const data = await MesWmTransferDetailService.update(id, body)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await MesWmTransferDetailService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
