import fs from "node:fs"
import path from "node:path"
import { NextResponse, type NextRequest } from "next/server"
import { getBasePath, withBasePath } from "@/shared/frontend/lib/base-path"

interface AgentMethodSpec {
  http: string
  path: string
  query?: string[]
}

interface AgentContractEntry {
  domain: string
  entity: string
  kebab: string
  businessName: string
  permissionPrefix: string
  page?: {
    route?: string
    title?: string
  }
  api: {
    pluginMount?: string
    bffMount?: string
    resource: string
    methods: Record<string, AgentMethodSpec>
  }
  fields?: Array<{
    name: string
    type: string
    tsType?: string
    nullable?: boolean
    comment?: string
  }>
}

interface AgentContractsRegistry {
  total: number
  domains: Array<{ domain: string; count: number }>
  contracts: AgentContractEntry[]
}

function loadAgentContractsRegistry(): AgentContractsRegistry {
  const candidates = [
    path.join(process.cwd(), "docs", "agent", "contracts.json"),
    path.resolve(__dirname, "../../../../../docs/agent/contracts.json"),
  ]
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as AgentContractsRegistry
    }
  }
  return { total: 0, domains: [], contracts: [] }
}

/**
 * 将全量 Agent 契约（docs/agent/contracts.json）动态编译为 OpenAPI 3.1.0 标准文档
 */
export function buildOpenApi31Spec(domainFilter?: string, basePath = getBasePath()) {
  const registry = loadAgentContractsRegistry()
  const contracts = domainFilter
    ? registry.contracts.filter((c) => c.domain === domainFilter)
    : registry.contracts

  const paths: Record<string, Record<string, unknown>> = {}
  const schemas: Record<string, unknown> = {}

  for (const contract of contracts) {
    const baseMount = contract.api.bffMount || contract.api.pluginMount || `/api/v1/admin/${contract.domain}`
    const schemaName = `${contract.entity}DTO`

    const properties: Record<string, unknown> = {}
    const requiredFields: string[] = []
    for (const field of contract.fields ?? []) {
      const jsonType =
        field.tsType === "number" || field.type === "int" || field.type === "decimal"
          ? "number"
          : field.tsType === "boolean" || field.type === "boolean"
            ? "boolean"
            : "string"
      properties[field.name] = {
        type: jsonType,
        description: field.comment || field.name,
      }
      if (field.nullable === false && field.name !== "id") {
        requiredFields.push(field.name)
      }
    }

    schemas[schemaName] = {
      type: "object",
      description: `${contract.businessName} (${contract.entity})`,
      properties,
      ...(requiredFields.length > 0 ? { required: requiredFields } : {}),
    }

    for (const [actionName, methodSpec] of Object.entries(contract.api.methods || {})) {
      const normalizedSubPath = methodSpec.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}")
      const fullPath = `${baseMount}${normalizedSubPath}`
      const httpVerb = methodSpec.http.toLowerCase()
      if (!paths[fullPath]) paths[fullPath] = {}

      const parameters: Array<Record<string, unknown>> = []
      if (normalizedSubPath.includes("{id}")) {
        parameters.push({
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: `${contract.businessName} 主键 ID`,
        })
      }
      for (const q of methodSpec.query ?? []) {
        parameters.push({
          name: q,
          in: "query",
          required: false,
          schema: { type: q === "page" || q === "pageSize" ? "integer" : "string" },
        })
      }

      const operation: Record<string, unknown> = {
        tags: [contract.domain],
        operationId: `${contract.domain}_${contract.kebab}_${actionName}`,
        summary: `${contract.businessName} - ${actionName}`,
        description: `权限标识: \`${contract.permissionPrefix}:${actionName}\` · 关联页面: \`${contract.page?.route ?? "-"}\``,
        security: [{ bearerAuth: [] }],
        parameters,
        responses: {
          "200": {
            description: "请求成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "integer", example: 0 },
                    data: { $ref: `#/components/schemas/${schemaName}` },
                    msg: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
      }

      if (httpVerb === "post" || httpVerb === "put" || httpVerb === "patch") {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${schemaName}` },
            },
          },
        }
      }

      paths[fullPath][httpVerb] = operation
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "CoolieBase AI-Native Enterprise API Reference & Sandbox",
      version: "1.2.0",
      description: `聚合全仓 ${registry.total} 份机器可读 Agent 契约（覆盖 ${registry.domains.length} 个业务域），支持 Bearer JWT 注入与浏览器端实时 HTTP 调试。`,
    },
    servers: [
      {
        url: basePath || "/",
        description: basePath ? `当前子路径网关实例 (${basePath})` : "当前网关实例",
      },
    ],
    tags: registry.domains.map((d) => ({
      name: d.domain,
      description: `${d.domain} 域（${d.count} 个业务实体契约）`,
    })),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas,
    },
    paths,
  }
}

function renderInteractiveSandboxHtml(
  specUrl: string,
  totalContracts: number,
  totalDomains: number,
  basePath = "",
): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CoolieBase OpenAPI 3.1 交互式调试沙箱</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: #1e293b; border-bottom: 1px solid #334155; }
    .badge { background: #3b82f6; color: #fff; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-left: 8px; }
    .toolbar { display: flex; gap: 10px; align-items: center; }
    input, select, textarea { background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 6px 10px; border-radius: 6px; font-size: 13px; }
    button { background: #2563eb; color: #fff; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    button:hover { background: #1d4ed8; }
    main { display: grid; grid-template-columns: 340px 1fr; height: calc(100vh - 57px); }
    aside { border-right: 1px solid #334155; overflow-y: auto; padding: 12px; }
    .endpoint { padding: 8px 10px; border-radius: 6px; cursor: pointer; margin-bottom: 6px; border: 1px solid transparent; }
    .endpoint:hover, .endpoint.active { background: #1e293b; border-color: #475569; }
    .method { font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 6px; display: inline-block; }
    .method.get { background: #065f46; color: #6ee7b7; }
    .method.post { background: #1e40af; color: #93c5fd; }
    .method.put { background: #92400e; color: #fcd34d; }
    .method.delete { background: #991b1b; color: #fca5a5; }
    section.console { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
    pre { background: #020617; border: 1px solid #334155; padding: 14px; border-radius: 8px; overflow: auto; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <div>
      <strong>CoolieBase OpenAPI 3.1 交互式调试沙箱</strong>
      <span class="badge">OpenAPI 3.1.0</span>
      <span class="badge">${totalDomains} 业务域 / ${totalContracts} 契约</span>
      <span class="badge">basePath: ${basePath || "/"}</span>
    </div>
    <div class="toolbar">
      <input id="jwt-token" type="password" placeholder="Bearer JWT Token (可选)" style="width: 260px;" />
      <a href="${specUrl}" target="_blank" style="color: #93c5fd; font-size: 13px; text-decoration: none;">下载 OpenAPI JSON</a>
    </div>
  </header>
  <main>
    <aside id="endpoint-list">正在加载 OpenAPI 3.1 契约...</aside>
    <section class="console">
      <div style="display: flex; gap: 8px;">
        <select id="req-method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select>
        <input id="req-url" style="flex: 1;" value="/api/v1/admin/mall/product-spu?page=1&pageSize=10" />
        <button id="send-btn" type="button">发送请求 (Try it out)</button>
      </div>
      <textarea id="req-body" rows="6" placeholder='JSON 请求体（POST / PUT 时使用，例如 {"name":"示例"}）'></textarea>
      <div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">实时响应 (Response):</div>
        <pre id="res-output">点击左侧任意接口或直接点击「发送请求」进行在线调试。</pre>
      </div>
    </section>
  </main>
  <script>
    (async function () {
      const BASE_PATH = ${JSON.stringify(basePath)};
      function withBase(u) {
        if (!BASE_PATH || typeof u !== "string" || !u.startsWith("/")) return u;
        return (u === BASE_PATH || u.startsWith(BASE_PATH + "/")) ? u : BASE_PATH + u;
      }
      const res = await fetch(withBase("${specUrl}"));
      const spec = await res.json();
      const listEl = document.getElementById("endpoint-list");
      listEl.innerHTML = "";
      const entries = Object.entries(spec.paths || {}).slice(0, 200);
      for (const [pathStr, methods] of entries) {
        for (const [verb, op] of Object.entries(methods)) {
          const item = document.createElement("div");
          item.className = "endpoint";
          item.innerHTML = '<span class="method ' + verb + '">' + verb.toUpperCase() + '</span><span style="font-size:12px;">' + pathStr + '</span><div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + (op.summary || '') + '</div>';
          item.onclick = () => {
            document.getElementById("req-method").value = verb.toUpperCase();
            document.getElementById("req-url").value = pathStr.replace("{id}", "1");
          };
          listEl.appendChild(item);
        }
      }
      document.getElementById("send-btn").onclick = async () => {
        const method = document.getElementById("req-method").value;
        const url = document.getElementById("req-url").value;
        const token = document.getElementById("jwt-token").value.trim();
        const bodyText = document.getElementById("req-body").value.trim();
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = token.startsWith("Bearer ") ? token : "Bearer " + token;
        const out = document.getElementById("res-output");
        out.textContent = "请求发送中...";
        try {
          const r = await fetch(withBase(url), {
            method,
            headers,
            body: (method === "POST" || method === "PUT") && bodyText ? bodyText : undefined,
          });
          const text = await r.text();
          out.textContent = "HTTP " + r.status + "\\n\\n" + text;
        } catch (err) {
          out.textContent = "请求异常: " + String(err);
        }
      };
    })();
  </script>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format")
  const domain = searchParams.get("domain") || undefined
  const accept = request.headers.get("accept") || ""
  const basePath = getBasePath()

  if (format === "json" || accept.includes("application/openapi+json")) {
    const spec = buildOpenApi31Spec(domain, basePath)
    return NextResponse.json(spec, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    })
  }

  const registry = loadAgentContractsRegistry()
  const rawJsonUrl = domain ? `/api/docs?format=json&domain=${encodeURIComponent(domain)}` : "/api/docs?format=json"
  const jsonUrl = withBasePath(rawJsonUrl)
  const html = renderInteractiveSandboxHtml(jsonUrl, registry.total, registry.domains.length, basePath)
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
