/**
 * 端无关的类型契约（Web、小程序与 Expo 共用同一套 PageBlockDSL v2 与后端返回结构）。
 */

export type FieldWidgetType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "radio"
  | "checkbox"
  | "switch"
  | "cascader"
  | "tree_select"
  | "slider"
  | "rate"
  | "tags"
  | "currency"
  | "color"
  | "image"
  | "file"
  | "richtext"
  | "sub_table"
  | "json"

export type FieldDef = {
  code: string
  label: string
  type: FieldWidgetType
  required?: boolean
  showInList?: boolean
  showInForm?: boolean
  options?: Array<{ label: string; value: string; color?: string }>
  placeholder?: string
  sort?: number
  span?: number
  group?: string
  visibleOn?: string
  disabledOn?: string
  requiredOn?: string
  defaultValue?: unknown
}

export type MobileBlockItem = {
  title: string
  subtitle?: string
  icon?: string
  imageUrl?: string
  badge?: string
  actionUrl?: string
  color?: string
}

export type MobileBlockDef = {
  id: string
  type: "banner" | "grid_nav" | "product_waterfall" | "stat_metrics"
  title?: string
  surface?: "all" | "pc" | "mobile"
  visibleOn?: string
  items?: MobileBlockItem[]
}

export type PageSchema = {
  entity: string
  title: string
  layoutMode?: "table" | "kanban" | "split" | "dashboard" | "mobile_portal"
  fields: FieldDef[]
  blocks?: MobileBlockDef[]
}

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
