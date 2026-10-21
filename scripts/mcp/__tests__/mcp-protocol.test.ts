import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../../..", import.meta.url))
const SERVER = path.join(ROOT, "scripts", "mcp", "cooliebase-mcp-server.cjs")

/**
 * **协议层**验证：真正 spawn 服务、走 NDJSON 的 JSON-RPC 握手。
 *
 * 为什么必须单独一层：既有的 MCP 测试都是**直接调 `TOOL.run()`** ——
 * 那验的是"工具函数对不对"，验不到客户端实际走的这条路。
 * 若 `initialize` / `tools/list` / `tools/call` 的帧格式、id 回填、错误码有偏差，
 * 工具单测**依然全绿**，而任何 MCP 客户端（Claude / Cursor / Hermes）都连不上。
 *
 * 这层之前**完全没有测试**（实测：测试文件里没有 initialize / tools/list / tools/call / spawn）。
 */
class McpClient {
  private child: ChildProcessWithoutNullStreams
  private buffer = ""
  private pending = new Map<number, (msg: Record<string, unknown>) => void>()
  private seq = 0
  readonly lines: string[] = []

  constructor() {
    this.child = spawn(process.execPath, [SERVER], { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] })
    this.child.stdout.setEncoding("utf8")
    this.child.stdout.on("data", (chunk: string) => {
      this.buffer += chunk
      let idx = this.buffer.indexOf("\n")
      while (idx !== -1) {
        const line = this.buffer.slice(0, idx).trim()
        this.buffer = this.buffer.slice(idx + 1)
        if (line) {
          this.lines.push(line)
          try {
            const msg = JSON.parse(line) as { id?: number }
            if (typeof msg.id === "number") {
              const resolve = this.pending.get(msg.id)
              if (resolve) {
                this.pending.delete(msg.id)
                resolve(msg as Record<string, unknown>)
              }
            }
          } catch {
            /* 非 JSON 行不入账 */
          }
        }
        idx = this.buffer.indexOf("\n")
      }
    })
  }

  request(method: string, params?: unknown): Promise<Record<string, unknown>> {
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 15_000)
      this.pending.set(id, (msg) => {
        clearTimeout(timer)
        resolve(msg)
      })
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`)
    })
  }

  /** 直接写一行原始文本（用于喂坏数据）。 */
  raw(line: string): void {
    this.child.stdin.write(`${line}\n`)
  }

  /** 通知（无 id）：不该有任何响应。 */
  notify(method: string, params?: unknown): void {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`)
  }

  close(): void {
    try {
      this.child.kill("SIGKILL")
    } catch {
      /* 已退出 */
    }
  }
}

let client: McpClient

beforeAll(() => {
  client = new McpClient()
}, 30_000)

afterAll(() => {
  client?.close()
})

describe("MCP 协议层（NDJSON JSON-RPC）", () => {
  it("initialize 返回协商后的协议版本与 serverInfo", async () => {
    const res = await client.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "vitest", version: "0" },
    })
    const result = res.result as Record<string, any>
    expect(res.jsonrpc).toBe("2.0")
    expect(typeof result.protocolVersion).toBe("string")
    expect(result.serverInfo?.name).toBeTruthy()
    expect(result.capabilities?.tools).toBeTruthy()
  })

  it("tools/list 列出全部工具，且名字唯一、都带 inputSchema", async () => {
    const res = await client.request("tools/list")
    const tools = (res.result as { tools: { name: string; description?: string; inputSchema?: unknown }[] }).tools
    expect(tools.length).toBeGreaterThan(10)
    expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length)
    for (const tool of tools) {
      expect(tool.name, "工具名不能为空").toBeTruthy()
      expect(tool.inputSchema, `${tool.name} 缺 inputSchema`).toBeTruthy()
    }
    // 上一轮新增的全接口探测必须出现在协议面里（工具单测绿 ≠ 客户端看得到）
    expect(tools.map((t) => t.name)).toContain("cooliebase_api_probe")
  })

  it("tools/call 走真实调用并回填同一个 id", async () => {
    const res = await client.request("tools/call", { name: "cooliebase_domain_list", arguments: {} })
    expect(res.id).toBeGreaterThan(0)
    expect(res.error, `意外错误: ${JSON.stringify(res.error)}`).toBeUndefined()
    const content = (res.result as { content: { type: string; text: string }[] }).content
    expect(Array.isArray(content)).toBe(true)
    const payload = JSON.parse(content[0].text)
    expect(payload.layers ?? payload.domains ?? payload).toBeTruthy()
  })

  it("未知方法返回 JSON-RPC 错误 -32601，而不是崩掉", async () => {
    const res = await client.request("tools/nope")
    expect(res.error).toBeTruthy()
    expect((res.error as { code: number }).code).toBe(-32601)
    // 出错后连接仍然可用
    const after = await client.request("ping")
    expect(after.result).toEqual({})
  })

  it("坏数据不得把服务搞死（后续请求仍然可用）", async () => {
    client.raw("{ this is not json")
    client.raw("")
    const res = await client.request("ping")
    expect(res.result).toEqual({})
  })

  it("通知（无 id）不得产生任何响应行", async () => {
    const before = client.lines.length
    client.notify("notifications/initialized")
    await new Promise((r) => setTimeout(r, 300))
    expect(client.lines.length).toBe(before)
  })
})
