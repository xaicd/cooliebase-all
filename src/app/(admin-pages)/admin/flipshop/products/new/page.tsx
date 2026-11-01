import { FlipProductCreatePage } from "@/modules/flipshop/frontend/pages/products/new.page"

/**
 * 翻牌小店 · 商品新增路由（/admin/flipshop/products/new）。
 *
 * 固定字面路由（优先于同级的 `[id]` 动态段，避免 `new` 被当作商品 id）。
 * 已在 `packages/shared/contract/admin-pages.json` 以 `kind: "unknown"` 登记，仅做渲染透传。
 */
export default function FlipProductCreateRoute() {
  return <FlipProductCreatePage />
}
