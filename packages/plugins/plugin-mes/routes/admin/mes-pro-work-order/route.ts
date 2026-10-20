import { NextResponse } from "next/server"
import { MesProWorkOrderService } from "@/modules/mes/backend/services/mes-pro-work-order.service"
import { mesProWorkOrderCreateSchema, mesProWorkOrderPageQuerySchema, mesProWorkOrderUpdateSchema } from "@/modules/mes/backend/validators/mes-pro-work-order.validator"
import { MES_ACTION_SCHEMAS } from "@/modules/mes/contract/actions"
import { parseActionQuery } from "@/modules/shared/backend/http/parse-action-input"

export async function GET(request: Request) {
  try {
    const data = await MesProWorkOrderService.page(parseActionQuery(MES_ACTION_SCHEMAS["mes.listWorkOrders"], request))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesProWorkOrderService.create(mesProWorkOrderCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
