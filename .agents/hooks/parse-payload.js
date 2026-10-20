#!/usr/bin/env node
/**
 * 从各家 CLI 的 hook 载荷里提取「目标文件路径」与「协议类型」。
 *
 * 为什么单独成文件：这段逻辑此前内联在 `.agents/hooks/spec-gate.sh` 的 `node -e '...'` 里，
 * 而正则里含单引号（如 `[^\s"']`）会把 shell 的单引号字符串**提前闭合**，
 * 导致语法错误甚至静默失效 —— 已经踩过不止一次。**代码归代码，shell 归 shell。**
 *
 * 读取 stdin 的 JSON，向 stdout 输出一行 JSON：{"file":"...","protocol":"exit2"|"antigravity"}
 *
 * 各家载荷差异（均取自文档/源码，非猜测）：
 *   · cmd / Claude : {"tool_input": {"file_path": "..."}}
 *   · Hermes       : {"args": {"path": "..."}}
 *   · Antigravity  : {"toolCall": {"args": {"TargetFile": "..."}}}   ← 出现 toolCall 即 agy
 *
 * 另外识别**用 shell 写受保护路径**（否则 `echo x > packages/y.ts` 直接绕过守卫）。
 * 该检测口径**刻意很窄**：只认「写操作符**紧跟着**受保护路径」，
 * 避免把 `git diff -- packages/x > /tmp/out` 这类**读**操作误判成写。
 */
const chunks = []
process.stdin.on("data", (chunk) => chunks.push(chunk))
process.stdin.on("end", () => {
  let payload = {}
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    process.stdout.write("\texit2")
    return
  }

  const pick = (source, dotted) =>
    dotted.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), source)

  const candidates = [
    "tool_input.file_path",
    "tool_input.path",
    "tool_input.absolute_path",
    "args.file_path",
    "args.path",
    "toolCall.args.TargetFile",
    "toolCall.args.AbsolutePath",
    "toolCall.args.FilePath",
    "toolCall.args.target_file",
    "toolCall.args.Path",
  ]

  // 工具名：用于区分「读」与「写」。
  // 踩过的坑：`tool_input.absolute_path` 是**读**工具的字段，若不分读写就会把
  // "读一个受保护目录下的文件"误判成写入并拦下（实测）。
  const toolName = String(
    pick(payload, "tool_name") ||
      pick(payload, "toolCall.name") ||
      pick(payload, "tool_display_name") ||
      "",
  )
  const isReadTool = /^(read|read_file|view_file|view|glob|grep|ls|list)/i.test(toolName)

  let file = ""
  if (!isReadTool) {
    for (const candidate of candidates) {
      const value = pick(payload, candidate)
      if (typeof value === "string" && value) {
        file = value
        break
      }
    }
  }

  // ── 用 shell 写文件也要能拦 ────────────────────────────────────────────────
  if (!file && !isReadTool) {
    const command =
      pick(payload, "tool_input.command") ||
      pick(payload, "args.command") ||
      pick(payload, "toolCall.args.CommandLine")
    if (typeof command === "string" && command) {
      // 受保护路径本身（不含空白/引号/命令分隔符）
      const protectedPath = String.raw`(?:[^\s"']*[/\\])?(?:packages|prisma)[/\\][^\s;&|"']*|(?:[^\s"']*[/\\])?src[/\\]app[/\\]api[/\\][^\s;&|"']*`
      const patterns = [
        new RegExp(String.raw`>{1,2}\s*["']?(` + protectedPath + String.raw`)`), // > path / >> path
        new RegExp(String.raw`\btee\s+(?:-a\s+)?["']?(` + protectedPath + String.raw`)`),
        new RegExp(String.raw`\b(?:cp|mv|install)\s+[^|;&]*?\s["']?(` + protectedPath + String.raw`)`),
        new RegExp(String.raw`\bsed\s+-i[^|;&]*?\s["']?(` + protectedPath + String.raw`)`),
        new RegExp(String.raw`\btruncate\b[^|;&]*?(` + protectedPath + String.raw`)`),
        new RegExp(String.raw`\bdd\b[^|;&]*?of=["']?(` + protectedPath + String.raw`)`),
      ]
      for (const pattern of patterns) {
        const match = command.match(pattern)
        if (match && match[1]) {
          file = match[1].replace(/^["']|["']$/g, "")
          break
        }
      }
    }
  }

  // 协议：出现 toolCall 即 Antigravity（它读 stdout JSON，不看 exit code）
  const protocol = payload && payload.toolCall ? "antigravity" : "exit2"

  // 推断是哪家 CLI —— 用于心跳与"金丝雀"自检（证明该 CLI 真的执行了我们的 hook）
  //   cmd      : 有 tool_display_name（SHELL/READ/WRITE/EDIT）
  //   Claude   : 有 hook_event_name 且无 tool_display_name
  //   Hermes   : 用 args 传工具参数
  //   agy      : 有 toolCall
  let kind = "unknown"
  if (payload && payload.toolCall) kind = "agy"
  else if (payload && typeof payload.args === "object" && payload.args) kind = "hermes"
  else if (payload && payload.tool_display_name) kind = "cmd"
  else if (payload && payload.hook_event_name) kind = "claude"

  process.stdout.write(file + "\t" + protocol + "\t" + kind)
})
