/**
 * C 端前台共享：外观配置消费 + 会员 token + API 封装。
 * 统一后端响应 { success, data }。
 */

import { apiPath } from "@/modules/shared/frontend/lib/request"

const TOKEN_KEY = "cooliebase_member_token"

export type Appearance = {
  siteName: string
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  radius: number
  fontFamily: string
  layout: { density: "comfortable" | "compact" }
}

export type MemberPublic = {
  id: string
  account: string
  email: string | null
  nickname: string
  avatarUrl: string | null
  memberLevel: string
  status: string
  extraFields?: Record<string, unknown>
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY)
}

async function parse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || `请求失败(${res.status})`)
  }
  return json.data as T
}

export async function fetchAppearance(): Promise<Appearance> {
  const res = await fetch(apiPath("/api/v1/open/meta/appearance"))  // request-contract-exempt: 会员端公共接口：需自定义 token 与 401 语义，套用 admin 请求层会带错 token 并误跳 admin 登录
  return parse<Appearance>(res)
}

export async function memberLogin(account: string, password: string): Promise<{ token: string; member: MemberPublic }> {
  const res = await fetch(apiPath("/api/v1/app/member/auth/login"), {  // request-contract-exempt: 会员端公共接口：需自定义 token 与 401 语义，套用 admin 请求层会带错 token 并误跳 admin 登录
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password }),
  })
  const data = await parse<{ token: string; expiresIn: number; member: MemberPublic }>(res)
  setToken(data.token)
  return { token: data.token, member: data.member }
}

export async function memberRegister(input: { account: string; password: string; nickname?: string; email?: string }): Promise<MemberPublic> {
  const res = await fetch(apiPath("/api/v1/app/member/auth/register"), {  // request-contract-exempt: 会员端公共接口：需自定义 token 与 401 语义，套用 admin 请求层会带错 token 并误跳 admin 登录
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return parse<MemberPublic>(res)
}

export async function fetchProfile(): Promise<MemberPublic> {
  const token = getToken()
  const res = await fetch(apiPath("/api/v1/app/member/user/profile"), {  // request-contract-exempt: 会员端公共接口：需自定义 token 与 401 语义，套用 admin 请求层会带错 token 并误跳 admin 登录
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return parse<MemberPublic>(res)
}

/** 更新资料（含动态字段 extraFields） */
export async function updateProfile(patch: { nickname?: string; avatarUrl?: string; extraFields?: Record<string, unknown> }): Promise<MemberPublic> {
  const token = getToken()
  const res = await fetch(apiPath("/api/v1/app/member/user/profile"), {  // request-contract-exempt: 会员端公共接口：需自定义 token 与 401 语义，套用 admin 请求层会带错 token 并误跳 admin 登录
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(patch),
  })
  return parse<MemberPublic>(res)
}

/** 预览免输入登录：demo 模式下的默认演示凭据 */
export const DEMO_CREDENTIALS = { account: "demo", password: "demo123" }
export function isDemoMode(): boolean {
  // 客户端：非生产（NODE_ENV 由构建注入）或显式开关
  return process.env.NEXT_PUBLIC_DEMO_LOGIN === "1" || process.env.NODE_ENV !== "production"
}

/** 把外观注入为内联样式变量（C 端主题呈现） */
export function appearanceStyle(a: Appearance | null): React.CSSProperties {
  if (!a) return {}
  return {
    // @ts-expect-error CSS custom properties
    "--brand": a.primaryColor,
    "--radius": `${a.radius}px`,
    fontFamily: a.fontFamily,
  }
}


// === 🆕 端无关页面 Schema（Schema 驱动渲染器消费） ===

export type FieldDef = {
  code: string
  label: string
  type: "text" | "textarea" | "number" | "boolean" | "date" | "select" | "image"
  required?: boolean
  showInList?: boolean
  showInForm?: boolean
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  sort?: number
}

export type PageSchema = {
  entity: string
  title: string
  fields: FieldDef[]
}

/** 拉取某实体的页面 Schema（C 端只读，端无关；Web/Expo 渲染器共用） */
export async function fetchPageSchema(entity: string): Promise<PageSchema> {
  const res = await fetch(apiPath(`/api/v1/open/meta/page-schema/${encodeURIComponent(entity)}`))  // request-contract-exempt: 会员端公共接口：需自定义 token 与 401 语义，套用 admin 请求层会带错 token 并误跳 admin 登录
  return parse<PageSchema>(res)
}
