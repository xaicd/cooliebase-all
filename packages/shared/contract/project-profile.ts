import { z } from "zod"
import rawProjectProfile from "./project-profile.json"
import { resolveBlueprintPlaceholders } from "./blueprint-vars"

/**
 * 门面（首屏/正门/登录页）业务身份段 —— 孵化期由白标按项目档案填充（[T1] [COO-219]）。
 *
 * **所有字段可选 + telemetryEnabled 有默认**：老档案（无 facade 段）与部分填充的
 * 新档案都必须照常解析 —— zod 解析失败 = 全站 500（同 loginTrustBadges 的教训）。
 * 取值统一走唯一读口 `facade.ts#readFacadeIdentity`（缺省回落中立默认值），
 * 消费方不得直读本文件或 project-profile.json。
 */
const facadeEntrySchema = z.object({
  label: z.string().min(1).max(24).optional(),
  href: z.string().min(1).max(200).optional(),
})

export const facadeSchema = z.object({
  siteName: z.string().min(1).max(40).optional(),
  domainTagline: z.string().min(1).max(120).optional(),
  cEndEntry: facadeEntrySchema.optional(),
  bEndEntry: facadeEntrySchema.optional(),
  heroBadge: z.string().min(1).max(80).optional(),
  heroTitle: z.string().min(1).max(80).optional(),
  heroHighlight: z.string().min(1).max(60).optional(),
  heroSubtitle: z.string().min(1).max(160).optional(),
  heroDescription: z.string().min(1).max(300).optional(),
  cEndCardTitle: z.string().min(1).max(60).optional(),
  cEndCardCta: z.string().min(1).max(40).optional(),
  cEndCardDesc: z.string().min(1).max(200).optional(),
  bEndCardTitle: z.string().min(1).max(60).optional(),
  bEndCardCta: z.string().min(1).max(40).optional(),
  bEndCardDesc: z.string().min(1).max(200).optional(),
  loginSubtitle: z.string().min(1).max(160).optional(),
  telemetryEnabled: z.boolean().default(false),
  devPort: z.number().int().min(1024).max(65535).optional(),
})

export type FacadeSection = z.infer<typeof facadeSchema>

export const consumerPortalSchema = z.object({
  brandMark: z.string().min(1).max(2).optional(),
  title: z.string().min(1).max(40).optional(),
  subtitleEn: z.string().min(1).max(60).optional(),
  heroBadge: z.string().min(1).max(80).optional(),
  heroTitle: z.string().min(1).max(80).optional(),
  heroDesc: z.string().min(1).max(240).optional(),
  searchPlaceholder: z.string().min(1).max(80).optional(),
  cartLabel: z.string().min(1).max(24).optional(),
  primaryCta: z.string().min(1).max(24).optional(),
  previewCta: z.string().min(1).max(24).optional(),
  profileLabel: z.string().min(1).max(24).optional(),
  categories: z.array(z.object({
    key: z.string().min(1).max(32),
    label: z.string().min(1).max(24),
  })).optional(),
  catalogItems: z.array(z.object({
    id: z.string().min(1).max(40),
    title: z.string().min(1).max(80),
    author: z.string().min(1).max(40),
    category: z.string().min(1).max(32),
    categoryLabel: z.string().min(1).max(24),
    priceCents: z.number().int().min(0),
    rating: z.number().min(0).max(5),
    ratingCount: z.number().int().min(0),
    tags: z.array(z.string().min(1).max(24)),
    intro: z.string().min(1).max(400),
    accentColor: z.string().min(1).max(20),
    trialChapter: z.object({
      title: z.string().min(1).max(120),
      paragraphs: z.array(z.string().min(1).max(500)),
    }),
  })).optional(),
})

export const multiClientSchema = z.object({
  expoAppName: z.string().min(1).max(40).optional(),
  expoAppSlug: z.string().min(1).max(60).optional(),
  iosBundleId: z.string().min(1).max(80).optional(),
  androidPackage: z.string().min(1).max(80).optional(),
  wechatAppId: z.string().min(1).max(40).optional(),
  tabHomeLabel: z.string().min(1).max(16).optional(),
  tabStudioLabel: z.string().min(1).max(16).optional(),
  tabMemberLabel: z.string().min(1).max(16).optional(),
  defaultEntity: z.string().min(1).max(80).optional(),
})

const tenantSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1).max(32).regex(/^[a-z][a-z0-9-]*$/, "租户编码只允许小写字母、数字和连字符"),
  name: z.string().min(1).max(40),
  contactName: z.string().min(1).max(32).optional(),
  contactPhone: z.string().max(20).optional(),
  domain: z.string().max(80).nullable().optional(),
  packageId: z.string().min(1),
})

export const projectProfileSchema = z.object({
  platformName: z.string().min(1).max(40),
  shortName: z.string().min(1).max(16),
  description: z.string().min(1).max(200),
  copyright: z.string().min(1).max(80),
  version: z.string().min(1).max(20),
  industryPreset: z.string().min(1).max(40).optional(),
  loginHeadline: z.string().min(1).max(40),
  loginTagline: z.string().min(1).max(120),
  /**
   * 登录页底部的信任标识（客户可见文案）。
   * 为什么走档案而不是写死在页面里：层B 交付物是按客户项目白标生成的，写死的
   * 文案必然与客户业务无关（且常含平台内部词，如「本体」—— 客户看不懂也不该看）。
   * 由平台孵化时按项目填写 → 页面动态渲染（实测 2026-11-03 老板口径）。
   *
   * 有默认值：老档案（缺该键）不得让整个底座起不来 —— zod 解析失败 = 全站 500。
   */
  loginTrustBadges: z
    .array(z.string().min(1).max(40))
    .min(1)
    .max(4)
    .default(["全流程留痕 · 操作可追溯", "真实数据库 · 零假数据"]),
  /** 门面业务身份段（可选）：缺失时由 facade 读口回落中立默认值。 */
  facade: facadeSchema.optional(),
  /** C端门户动态变量段（可选）：支持 27B 模型与 Coolie工坊注入新业务门户词包。 */
  consumerPortal: consumerPortalSchema.optional(),
  /** 多端客户端渠道坐标与 Tab 变量段（可选）。 */
  multiClient: multiClientSchema.optional(),
  branding: z.object({
    mark: z.string().min(1).max(2),
    primaryColor: z.string().min(1).max(20).optional(),
    accentColor: z.string().min(1).max(20).optional(),
    logoSrc: z.string().min(1),
    favicon: z.string().min(1),
  }),
  bootstrapAdmin: z.object({
    nickname: z.string().min(1).max(32),
  }),
  defaultUsers: z.array(z.object({
    username: z.string().min(1).max(32),
    nickname: z.string().min(1).max(32),
  })),
  tenants: z.array(tenantSchema).min(1),
  packages: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(40),
  })).min(1),
})

export type ProjectProfile = z.infer<typeof projectProfileSchema>
export type ProjectTenantProfile = z.infer<typeof tenantSchema>

/**
 * 解析前先经过 `resolveBlueprintPlaceholders`，保证即使 `project-profile.json` 处于含 `{{VAR}}`
 * 的模板占位态，也能自动展开为 `blueprint.template.json` 中的基准默认值并通过 Zod 校验。
 */
export const projectProfile: ProjectProfile = projectProfileSchema.parse(
  resolveBlueprintPlaceholders(rawProjectProfile)
)

export type PublicProjectProfile = Pick<
  ProjectProfile,
  "platformName" | "shortName" | "description" | "copyright" | "version" | "loginHeadline" | "loginTagline" | "branding"
> & {
  industryPreset?: string
  consumerPortal?: z.infer<typeof consumerPortalSchema>
  multiClient?: z.infer<typeof multiClientSchema>
}

/** Public branding for H5 / uni-app / Flutter / desktop. Never includes accounts or tenant secrets. */
export function toPublicProjectProfile(profile: ProjectProfile = projectProfile): PublicProjectProfile {
  return {
    platformName: profile.platformName,
    shortName: profile.shortName,
    description: profile.description,
    copyright: profile.copyright,
    version: profile.version,
    industryPreset: profile.industryPreset,
    loginHeadline: profile.loginHeadline,
    loginTagline: profile.loginTagline,
    branding: profile.branding,
    consumerPortal: profile.consumerPortal,
    multiClient: profile.multiClient,
  }
}
