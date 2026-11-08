import { projectProfile, type FacadeSection, type ProjectProfile } from "./project-profile"
import { BLUEPRINT_DEFAULT_VARS, resolveBlueprintPlaceholders } from "./blueprint-vars"

/**
 * 门面身份唯一读口（[T1] [COO-219]）。
 *
 * 依赖方向单向：首页/正门/登录页等门面消费方只依赖本模块，
 * **不得**直读 project-profile.json 或 `projectProfile.facade`。
 *
 * 兜底纪律：任何字段缺失、档案无 facade 段、读取抛错 → 逐字段/整体回落
 * `NEUTRAL_FACADE`（业务中立默认值），保证空数据不白屏、出错不 500。
 */
export interface FacadeEntry {
  label: string
  href: string
}

export interface FacadeIdentity {
  siteName: string
  domainTagline: string
  cEndEntry: FacadeEntry
  bEndEntry: FacadeEntry
  heroTitle: string
  heroSubtitle: string
  loginSubtitle: string
  /** 登录页遥测面板开关；出厂默认关（假遥测面板不得带病出厂）。 */
  telemetryEnabled: boolean
  /** dev 脚本端口缺省值；避开控制面保留端口 3200（T4 接线 PORT env）。 */
  devPort: number
}

export interface ExtendedFacadeIdentity extends FacadeIdentity {
  heroBadge: string
  heroHighlight: string
  heroDescription: string
  cEndCardTitle: string
  cEndCardCta: string
  cEndCardDesc: string
  bEndCardTitle: string
  bEndCardCta: string
  bEndCardDesc: string
}

/** 中立默认门面：不携带任何他业身份字样。 */
export const NEUTRAL_FACADE: FacadeIdentity = {
  siteName: "CoolieBase",
  domainTagline: "全栈蓝图底座",
  cEndEntry: { label: "C端入口", href: "/" },
  bEndEntry: { label: "B端后台", href: "/admin" },
  heroTitle: "CoolieBase",
  heroSubtitle: "全栈蓝图底座",
  loginSubtitle: "全栈蓝图底座",
  telemetryEnabled: false,
  devPort: 3210,
}

function pickText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback
}

function pickEntry(entry: unknown, fallback: FacadeEntry): FacadeEntry {
  if (!entry || typeof entry !== "object") return fallback
  const record = entry as { label?: unknown; href?: unknown }
  return {
    label: pickText(record.label, fallback.label),
    href: pickText(record.href, fallback.href),
  }
}

export function readFacadeIdentity(profile: ProjectProfile = projectProfile): FacadeIdentity {
  try {
    const rawFacade = profile?.facade
    if (!rawFacade) return NEUTRAL_FACADE
    const facade = resolveBlueprintPlaceholders(rawFacade)
    return {
      siteName: pickText(facade.siteName, NEUTRAL_FACADE.siteName),
      domainTagline: pickText(facade.domainTagline, NEUTRAL_FACADE.domainTagline),
      cEndEntry: pickEntry(facade.cEndEntry, NEUTRAL_FACADE.cEndEntry),
      bEndEntry: pickEntry(facade.bEndEntry, NEUTRAL_FACADE.bEndEntry),
      heroTitle: pickText(facade.heroTitle, NEUTRAL_FACADE.heroTitle),
      heroSubtitle: pickText(facade.heroSubtitle, NEUTRAL_FACADE.heroSubtitle),
      loginSubtitle: pickText(facade.loginSubtitle, NEUTRAL_FACADE.loginSubtitle),
      telemetryEnabled: facade.telemetryEnabled === true,
      devPort:
        typeof facade.devPort === "number" && Number.isInteger(facade.devPort) &&
        facade.devPort >= 1024 &&
        facade.devPort <= 65535
          ? facade.devPort
          : NEUTRAL_FACADE.devPort,
    }
  } catch {
    return NEUTRAL_FACADE
  }
}

/**
 * 读取完整门面与首屏动态变量（供首页 / 登录页 / 27B 模型模板化消费）
 */
export function readExtendedFacade(profile: ProjectProfile = projectProfile): ExtendedFacadeIdentity {
  const base = readFacadeIdentity(profile)
  const rawFacade: Partial<FacadeSection> = resolveBlueprintPlaceholders(
    (profile?.facade || {}) as Partial<FacadeSection>
  )
  return {
    ...base,
    heroBadge: pickText(
      rawFacade.heroBadge,
      String(BLUEPRINT_DEFAULT_VARS.HERO_BADGE || "企业级多端数字化业务平台 · 生产就绪")
    ),
    heroHighlight: pickText(
      rawFacade.heroHighlight,
      String(BLUEPRINT_DEFAULT_VARS.HERO_HIGHLIGHT || "Blueprint Matrix")
    ),
    heroDescription: pickText(
      rawFacade.heroDescription,
      String(
        BLUEPRINT_DEFAULT_VARS.HERO_DESCRIPTION ||
          "融合 15 大企业级原生业务域，打通从 C 端用户在线服务、商品检索与互动交易，到 B 端运营管控、聚合支付对账、供应链协同与流程审批的全流程闭环体系。"
      )
    ),
    cEndCardTitle: pickText(
      rawFacade.cEndCardTitle,
      String(BLUEPRINT_DEFAULT_VARS.C_END_CARD_TITLE || "进入 C 端业务门户")
    ),
    cEndCardCta: pickText(
      rawFacade.cEndCardCta,
      String(BLUEPRINT_DEFAULT_VARS.C_END_CARD_CTA || "立即访问 →")
    ),
    cEndCardDesc: pickText(
      rawFacade.cEndCardDesc,
      String(BLUEPRINT_DEFAULT_VARS.C_END_CARD_DESC || "精选商品与服务检索、在线体验/预约、会员权益中心与即时结算闭环。")
    ),
    bEndCardTitle: pickText(
      rawFacade.bEndCardTitle,
      String(BLUEPRINT_DEFAULT_VARS.B_END_CARD_TITLE || "进入 B 端运营中台")
    ),
    bEndCardCta: pickText(
      rawFacade.bEndCardCta,
      String(BLUEPRINT_DEFAULT_VARS.B_END_CARD_CTA || "控制台 →")
    ),
    bEndCardDesc: pickText(
      rawFacade.bEndCardDesc,
      String(BLUEPRINT_DEFAULT_VARS.B_END_CARD_DESC || "核心业务台账管理、交易订单履约、会员成长等级、聚合支付对账与 BPM 流程审批。")
    ),
  }
}
