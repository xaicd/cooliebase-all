/** @type {import('next').NextConfig} */

// 预览子路径支持（B2：同域名 path 前缀预览）
// 当应用被反代到形如 /api/tasks/host-preview/{id} 的子路径下预览时，
// 通过环境变量 PREVIEW_BASE_PATH 注入 Next.js 的 basePath + assetPrefix，
// 使 Link/router/_next 静态资源/API routes 自动挂到该前缀下。
// 不设置该变量时行为不变（应用运行在根路径 /，如子域名模式）。
// 注意：basePath 必须以 / 开头且不以 / 结尾。
const rawBasePath = (process.env.PREVIEW_BASE_PATH || "").trim();
const basePath = rawBasePath && rawBasePath !== "/"
  ? ("/" + rawBasePath.replace(/^\/+/, "").replace(/\/+$/, ""))
  : "";

const nextConfig = {
  distDir: ".next-cooliebase",
  output: "standalone",
    // monorepo: 显式声明仓库根，否则 standalone 的依赖追踪以 app 目录为根。
    // 现在 app 就在仓库根，行为不变；一旦宿主搬进 apps/web/ 就必须保留这一行，
    // 否则产物不会带上工作区依赖（Next + pnpm monorepo 的经典要求）。
    outputFileTracingRoot: import.meta.dirname,
    // 安全响应头 —— security:scan 首跑抓到的真问题（三项全缺）。
    // 用 Next 的 headers() 统一注入，覆盖所有路由；CSP 与登录页无冲突。
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data:",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "object-src 'none'",
                "base-uri 'self'",
              ].join("; "),
            },
          ],
        },
      ]
    },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  // 服务端外部包（pg/mysql2 不打入 bundle）
  serverExternalPackages: ["pg", "mysql2"],
  // 把最终生效的 basePath 暴露给客户端，供手写的 fetch("/api/...") 拼接前缀
  // （Next.js 的 basePath 不会自动改写代码里手写的字符串路径）
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

export default nextConfig
