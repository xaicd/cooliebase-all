import { NextResponse } from "next/server"

/**
 * 支付回调通知 - 开放接口（无鉴权，验签）
 * POST /api/v1/open/pay/notify
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()

    // TODO: 验证签名 + 解析回调数据 + 更新订单状态
    // const signature = request.headers.get("x-signature")
    // if (!cryptoEngine.verifySignature(body, signature)) throw new Error("签名验证失败")

    // **不许假成功**：这是个**无鉴权**的支付回调入口，验签还没实现。
    // 此前它对任何请求都回 `success: true` —— 一旦有调用方或探针把它当"回调已接收"，
    // 就是对账口径的污染；而且下次实现 TODO 的人很容易照着被注释掉的验签**漏掉它**。
    // 在验签实现之前，明确 501：调用方应视为"未实现"并重试/告警，而不是成功。
    void body
    void request
    return NextResponse.json(
      { success: false, error: "支付回调尚未实现（验签未接入）", code: "NOT_IMPLEMENTED" },
      { status: 501 },
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "处理失败" }, { status: 400 })
  }
}
