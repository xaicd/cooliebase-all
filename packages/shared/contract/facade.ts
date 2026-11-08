import { projectProfile, type ProjectProfile } from "./project-profile"

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
    const facade = profile?.facade
    if (!facade) return NEUTRAL_FACADE
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
