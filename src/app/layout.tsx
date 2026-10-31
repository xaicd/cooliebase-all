import type { Metadata } from "next"
import { projectProfile } from "@/shared/contract/project-profile"
import { OntologyCopilotDrawer } from "@/shared/frontend/components/ontology-copilot-drawer"
import "./globals.css"

// metadata 在**服务端**求值，而 next.config.mjs 的 `env`（NEXT_PUBLIC_BASE_PATH）
// 只注入客户端产物（实测 server chunk 里取不到），故这里按 next.config.mjs 的同一
// 规则、从服务端可见的 PREVIEW_BASE_PATH 现算一次，让 favicon 等绝对路径在
// 「单域名 + 路径前缀」下也带前缀。
const PREVIEW_BASE_PATH = (() => {
  const raw = (process.env.PREVIEW_BASE_PATH || "").trim()
  return raw && raw !== "/" ? "/" + raw.replace(/^\/+/, "").replace(/\/+$/, "") : ""
})()

export const metadata: Metadata = {
  title: {
    default: projectProfile.platformName,
    template: `%s · ${projectProfile.shortName}`,
  },
  description: projectProfile.description,
  icons: { icon: `${PREVIEW_BASE_PATH}${projectProfile.branding.favicon}` },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full antialiased">
        {children}
        <OntologyCopilotDrawer />
      </body>
    </html>
  )
}
