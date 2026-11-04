import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * 根路由 /login 自动平滑重定向至标准中台登录入口 /admin/login
 */
export default function LegacyLoginRedirect() {
  redirect("/admin/login")
}
