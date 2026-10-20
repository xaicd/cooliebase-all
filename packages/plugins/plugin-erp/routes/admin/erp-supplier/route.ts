import { NextResponse } from "next/server"
import { ErpSupplierService } from "@/modules/erp/backend/services/erp-supplier.service"
import { erpSupplierCreateSchema, erpSupplierPageQuerySchema, erpSupplierUpdateSchema } from "@/modules/erp/backend/validators/erp-supplier.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpSupplierPageQuerySchema.parse(raw)
    const data = await ErpSupplierService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpSupplierService.create(erpSupplierCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
