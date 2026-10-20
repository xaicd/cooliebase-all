import { NextResponse } from "next/server"
import { MesWmStockTakingPlanParamService } from "@/modules/mes/backend/services/mes-wm-stock-taking-plan-param.service"
import { mesWmStockTakingPlanParamCreateSchema, mesWmStockTakingPlanParamPageQuerySchema, mesWmStockTakingPlanParamUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-stock-taking-plan-param.validator"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await MesWmStockTakingPlanParamService.get(id)
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
    const data = await MesWmStockTakingPlanParamService.update(id, mesWmStockTakingPlanParamUpdateSchema.parse({ ...body, id }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await MesWmStockTakingPlanParamService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
