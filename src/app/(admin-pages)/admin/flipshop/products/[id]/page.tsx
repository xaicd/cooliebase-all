import { FlipProductDetailPage } from "@/modules/flipshop/frontend/pages/products/[id].page"

/**
 * 翻牌小店 · 商品详情动态路由（/admin/flipshop/products/[id]）。
 *
 * 为什么是手写路由而不是派发器条目：admin 派发器（`[...slug]` + `dynamicParams=false`）
 * 只认**声明过的字面 slug**，无法承载真实动态 id。此为 `kind: "unknown"` 手写页，
 * 已在 `packages/shared/contract/admin-pages.json` 登记，仅做参数透传，不含业务逻辑。
 */
export default async function FlipProductDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FlipProductDetailPage id={id} />
}
