import { NextResponse } from "next/server"
import { BpmProcessDefinitionService } from "@/modules/bpm/backend/services/bpm-process-definition.service"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await BpmProcessDefinitionService.get(id)
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
    const data = await BpmProcessDefinitionService.update(id, body)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await BpmProcessDefinitionService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
