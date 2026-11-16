#!/usr/bin/env node
/**
 * scripts/render-gateway-conf.mjs
 *
 * 渲染四端统一反向代理 Caddy 片段（供 `pnpm run gateway:gen` 与 `node scripts/cmmi-07-release.cjs gateway` 调用）。
 * 严格读取 `package.json#scripts.dev` 中的监听端口，确保与 `launcher-gateway-port-consistency` 门禁 100% 一致。
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes("--dry-run")

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
  const slug = String(pkg.name || "cooliebase-all").replace(/^@.*\//, "")
  const portMatch = String(pkg.scripts?.dev || "").match(/-p\s+(\d+)/)
  const devPort = portMatch ? Number(portMatch[1]) : 3200

  const caddySnippet = [
    `# deploy/caddy/${slug}.caddy`,
    `# 项目: ${slug}`,
    `# 四端平面: /services/${slug}/{admin,2c,miniapp,api} -> 127.0.0.1:${devPort}`,
    `# 动态 API 路由前缀: /${slug}-api`,
    `# 独立服务端口: ${devPort}`,
    "",
    `handle /${slug}-api/* {`,
    "\t# **必须 strip 前缀**：本仓接口根是 `/api/v1/**`，不是 `/cooliebase-all-api/**`。",
    "\t# 实测（2026-10-21，本地 caddy + 真实应用）：不 strip 时该入口**全部 404**；",
    "\t# strip 后同一个请求落到 `/api/v1/admin/system/users` → **401**（路由存在、待鉴权）。",
    `\turi strip_prefix /${slug}-api`,
    `\treverse_proxy 127.0.0.1:${devPort} {`,
    "\t\theader_up Host {host}",
    "\t\theader_up X-Real-IP {remote_host}",
    "\t\theader_up X-Forwarded-For {remote_host}",
    "\t\theader_up X-Forwarded-Proto {scheme}",
    "\t}",
    "}",
    "",
    `redir /services/${slug} /services/${slug}/ 308`,
    `handle /services/${slug}/* {`,
    `\t@api path /services/${slug}/${slug}-api/* /services/${slug}/api/*`,
    "\thandle @api {",
    `\t\turi strip_prefix /services/${slug}`,
    `\t\treverse_proxy 127.0.0.1:${devPort}`,
    "\t}",
    "\thandle {",
    `\t\turi strip_prefix /services/${slug}`,
    `\t\treverse_proxy 127.0.0.1:${devPort}`,
    "\t}",
    "}",
    "",
  ].join("\n")

  const outRel = `deploy/caddy/${slug}.caddy`
  const outAbs = path.join(ROOT, outRel)

  if (!dryRun) {
    fs.mkdirSync(path.dirname(outAbs), { recursive: true })
    fs.writeFileSync(outAbs, caddySnippet, "utf8")
  }

  console.log(`[gateway:gen] ${dryRun ? "(dry-run) " : ""}已渲染四端网关片段 -> ${outRel} (upstream 127.0.0.1:${devPort})`)
}

main()
