import { z } from "zod"

/**
 * 站点/主题外观配置（WordPress 式：后台配 → C 端呈现）。
 * 全字段带默认值，缺字段回填默认。
 */
export const siteAppearanceSchema = z.object({
  siteName: z.string().trim().min(1).max(60).default("CoolieBase Next 商城"),
  logoUrl: z.string().trim().max(500).default("/logo.svg"),
  faviconUrl: z.string().trim().max(500).default("/favicon.ico"),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "主色需为 hex 颜色，如 #4f46e5")
    .default("#4f46e5"),
  radius: z.coerce.number().int().min(0).max(32).default(8),
  fontFamily: z
    .string()
    .trim()
    .max(200)
    .default("system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"),
  layout: z
    .object({
      density: z.enum(["comfortable", "compact"]).default("comfortable"),
    })
    .default({ density: "comfortable" }),
})

export type SiteAppearance = z.infer<typeof siteAppearanceSchema>

/** 后台更新：所有字段可选（局部更新） */
export const siteAppearanceUpdateSchema = siteAppearanceSchema.partial({
  siteName: true,
  logoUrl: true,
  faviconUrl: true,
  primaryColor: true,
  radius: true,
  fontFamily: true,
  layout: true,
})

/** 默认外观（无配置时返回） */
export const DEFAULT_APPEARANCE: SiteAppearance = siteAppearanceSchema.parse({})

/** C 端公开呈现字段（脱敏：目前全部为呈现所需，直接透出） */
export function toPublicAppearance(a: SiteAppearance) {
  return {
    siteName: a.siteName,
    logoUrl: a.logoUrl,
    faviconUrl: a.faviconUrl,
    primaryColor: a.primaryColor,
    radius: a.radius,
    fontFamily: a.fontFamily,
    layout: a.layout,
  }
}
