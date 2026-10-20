#!/usr/bin/env bash
# 跨 CLI 的「写受保护路径前必须走过规格流程」守卫 —— **一份脚本，三家通用**。
#
# 为什么这么写：各家的 hook 配置格式不同，但**拦截协议是同一个**：
#   · Command Code 文档：PreToolUse `exit 2` → 工具被跳过；
#   · Hermes 源码注释：`Exit code 2 blocks a pre_tool_call even without JSON (Claude-Code / Cursor)`。
# 所以这里只用 **stdin JSON + exit 2 + stderr**，不依赖任何一家的专有输出格式。
#
# 载荷差异（实测自各家源码/文档，非猜测）：
#   · cmd      : {"tool_name": ..., "tool_input": {"file_path": "..."}}
#   · Claude   : {"tool_name": ..., "tool_input": {"file_path": "..."}}
#   · Hermes   : {"tool_name": ..., "args": {"path": "..."}}      ← 路径字段是 path，不是 file_path
#
# 规则（与 .githooks/pre-commit 同源，避免两处漂移）：
#   写受保护路径（packages/ · prisma/ · src/app/api/）
#   且上一条需求分诊为 SPEC_REQUIRED
#   且还没有比该记录更新的规格包
#   → 拦下（exit 2）。
#
# 逃生阀：AGENT_ROUTE_SKIP=1（放行）。请只在确认判定有误时使用，并回头改规则表。
set -uo pipefail

if [ "${AGENT_ROUTE_SKIP:-0}" = "1" ]; then exit 0; fi

INPUT=$(cat)

# 从三种载荷里取文件路径（哪个字段存在用哪个）
FILE_PATH=$(printf '%s' "$INPUT" | node -e '
  const chunks = []
  process.stdin.on("data", (c) => chunks.push(c))
  process.stdin.on("end", () => {
    let d = {}
    try { d = JSON.parse(Buffer.concat(chunks).toString("utf8")) } catch { process.exit(0) }
    const pick = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o)
    const candidates = [
      "tool_input.file_path", "tool_input.path",   // cmd / Claude
      "args.file_path", "args.path",               // Hermes
      "tool_input.absolute_path",
    ]
    for (const c of candidates) { const v = pick(d, c); if (typeof v === "string" && v) { process.stdout.write(v); return } }
  })
' 2>/dev/null || true)

if [ -z "$FILE_PATH" ]; then exit 0; fi

case "$FILE_PATH" in
  */packages/*|*/prisma/*|*/src/app/api/*) : ;;
  *) exit 0 ;;
esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
# 记录路径可覆盖：测试用临时文件；也便于在尚未接入的仓库里显式指定
RECORD="${AGENT_ROUTE_ARTIFACT:-$ROOT/docs/architecture/artifacts/agent-route-last.json}"

if [ ! -f "$RECORD" ]; then
  exit 0   # 没有分诊记录时不拦（避免在还没跑过 agent:route 的仓库里卡死）
fi

VERDICT=$(node -e 'try{process.stdout.write(require(process.argv[1]).verdict||"")}catch{}' "$RECORD" 2>/dev/null || echo "")
if [ "$VERDICT" != "SPEC_REQUIRED" ]; then exit 0; fi

NEWER=$(find "$ROOT/docs/specs" -name brief.json -newer "$RECORD" 2>/dev/null | head -1 || true)
if [ -n "$NEWER" ]; then exit 0; fi

cat >&2 <<MSG
[spec-gate] 拦截：上一条需求被判为「需要规格」(SPEC_REQUIRED)，但还没有对应规格包。

  要写的文件：$FILE_PATH
  先执行：
      npm run speckit:new -- --name <名字> --domain <域> --type <类型> --title "<标题>"
  （分诊输出里已给出建议的 --type 与 --name）

  规则真源：scripts/lib/spec-necessity-rules.cjs（可审阅、可修改）
  确认判定有误时：AGENT_ROUTE_SKIP=1（并回头改规则表，而不是长期绕过）
MSG
exit 2
