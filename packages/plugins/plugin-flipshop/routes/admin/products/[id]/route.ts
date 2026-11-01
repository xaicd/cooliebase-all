import { NextResponse } from "next/server"
import { FlipProductService } from "@/modules/flipshop/backend/services"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

type RouteContext = { params: Promise<{ id: string }> }

export const GET = withAdminRoute(
  async (_request, auth, context: RouteContext) => {
    const { id } = await context.params
    return NextResponse.json({ success: true, data: await FlipProductService.get(auth, id) })
  },
  { permission: PERMISSIONS.FLIPSHOP_PRODUCT_QUERY },
)
