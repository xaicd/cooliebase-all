import { z } from "zod"
import {
  flipshopProductPageQuerySchema,
  flipshopProductCreateSchema,
} from "../backend/validators"

/**
 * 翻牌小店 (flipshop) · 商品动作契约
 *
 * 动作名与 COO-32 活体本体 `M_ActionTypes[].contract` 一一对应，禁止悬空：
 *   product.list   → flipshop.pageProduct
 *   product.detail → flipshop.getProduct
 *   product.create → flipshop.createProduct
 */
export const flipshopGetProductSchema = z.object({
  id: z.string().trim().min(1, "id 不能为空"),
})

export const FLIPSHOP_ACTION_SCHEMAS = {
  "flipshop.pageProduct": flipshopProductPageQuerySchema,
  "flipshop.getProduct": flipshopGetProductSchema,
  "flipshop.createProduct": flipshopProductCreateSchema,
} as const

export type FlipshopActionName = keyof typeof FLIPSHOP_ACTION_SCHEMAS
