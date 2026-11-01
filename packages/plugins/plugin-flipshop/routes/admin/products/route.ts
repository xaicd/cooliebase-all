import { NextResponse } from "next/server"
import { FlipProductService } from "@/modules/flipshop/backend/services"
import { flipshopProductCreateSchema, flipshopProductPageQuerySchema } from "@/modules/flipshop/backend/validators"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

export const GET = withAdminRoute(
  async (request, auth) => {
    const input = flipshopProductPageQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    return NextResponse.json({ success: true, data: await FlipProductService.list(auth, input) })
  },
  { permission: PERMISSIONS.FLIPSHOP_PRODUCT_QUERY },
)

export const POST = withAdminRoute(
  async (request, auth) => {
    const input = flipshopProductCreateSchema.parse(await request.json())
    return NextResponse.json({ success: true, data: await FlipProductService.create(auth, input) }, { status: 201 })
  },
  { permission: PERMISSIONS.FLIPSHOP_PRODUCT_CREATE, idempotent: true },
)
