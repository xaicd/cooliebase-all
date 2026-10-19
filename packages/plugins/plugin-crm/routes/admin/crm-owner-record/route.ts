import { NextResponse } from "next/server"
import { CrmOwnerRecordService } from "@/modules/crm/backend/services/crm-owner-record.service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const input = {
      page: Number(searchParams.get("page") || 1),
      pageSize: Number(searchParams.get("pageSize") || 20),
    }
    const data = await CrmOwnerRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmOwnerRecordService.create(body)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
