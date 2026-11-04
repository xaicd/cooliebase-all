import LoginPage from "@/modules/system/frontend/pages/login.page"

export const dynamic = "force-dynamic"

/**
 * 登录页 —— **绝不向匿名访客渲染任何凭据**（COOA-610.2 根修同步 / web-3503-实例正在公开泄露-01）。
 *
 * 病灶（2026-11-02 取证，3300 实例公开泄露 supervip 口令约 13.5h）：
 *   本页曾以 `NODE_ENV !== "production"` 门控把 `ADMIN_BOOTSTRAP_USERNAME/PASSWORD`
 *   塞进 `bootstrapCredentials` prop ⇒ React SSR 序列化进响应体 ⇒ 未登录 curl /login
 *   就能读到明文口令。旧判据是**伪安全**：next dev 恒为 development ⇒ 预览实例照样泄露。
 *
 * 现在改为**显式开关 + 只回填用户名**（结构性保证，不依赖运行时分支）：
 *   ① 开关必须是 `ADMIN_LOGIN_PREFILL=1/true` 显式 opt-in，默认关闭（缺省即安全）；
 *   ② 即使开关打开，也**只回填用户名**，口令一律不回填 —— 口令永不进响应体；
 *   ③ 源码不再出现 ADMIN_BOOTSTRAP_PASSWORD（静态守门 scripts/check-admin-login-credential-leak.cjs）。
 */
export default function Page() {
  // 显式开关，默认关闭；必须是精确的 "1" / "true" 才算开启。
  const prefillEnabled = /^(1|true)$/i.test(process.env.ADMIN_LOGIN_PREFILL ?? "")
  const usernameOnly = prefillEnabled && Boolean(process.env.ADMIN_BOOTSTRAP_USERNAME)

  const bootstrapCredentials = usernameOnly
    ? { username: process.env.ADMIN_BOOTSTRAP_USERNAME as string }
    : undefined

  return <LoginPage bootstrapCredentials={bootstrapCredentials} />
}
