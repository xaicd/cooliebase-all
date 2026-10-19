import { NextResponse } from "next/server"
import { CrmCustomerService } from "@/modules/crm/backend/services/customer.service"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"
import { z } from "zod"

type RouteContext = { params: Promise<{ id: string }> }
const updateSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), phone: z.string().trim().max(20).optional(), email: z.string().trim().optional(), industry: z.string().trim().max(50).optional(), level: z.enum(["A", "B", "C", "D"]).optional(), source: z.string().trim().max(50).optional(), remark: z.string().trim().max(500).optional() })

export const GET = withAdminRoute(async (request, auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const data = await CrmCustomerService.getById(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) { return NextResponse.json({ success: false, error: error?.message }, { status: error?.message?.includes("不存在") ? 404 : 400 }) }
}, { permission: PERMISSIONS.CRM_CUSTOMER_VIEW })

export const PUT = withAdminRoute(async (request, auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const body = await request.json()
    const input = updateSchema.parse(body)
    const data = await CrmCustomerService.update(id, input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) { return NextResponse.json({ success: false, error: error?.message }, { status: 400 }) }
}, { permission: PERMISSIONS.CRM_CUSTOMER_VIEW })

export const DELETE = withAdminRoute(async (request, auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const data = await CrmCustomerService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) { return NextResponse.json({ success: false, error: error?.message }, { status: 400 }) }
}, { permission: PERMISSIONS.CRM_CUSTOMER_VIEW })
