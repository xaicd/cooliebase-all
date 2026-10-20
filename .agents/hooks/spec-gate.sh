#!/usr/bin/env bash
# 跨 CLI 的「写受保护路径前必须走过规格流程」守卫 —— **一份脚本，多家通用**。
#
# 为什么这么写：各家 hook 的配置格式不同，但拦截协议只有两类（均取自各家文档/源码，非猜测）：
#   · cmd / Claude / Hermes：用 **exit 2** 拦截
#       —— cmd 文档：PreToolUse `exit 2` → 工具被跳过；
#       —— Hermes 源码注释：`Exit code 2 blocks a pre_tool_call even without JSON (Claude-Code / Cursor)`。
#   · **Antigravity (agy)**：不看退出码，读 **stdout 上的 JSON**
#       —— `{"decision":"deny"|"allow"|"ask"|"force_ask","reason":"..."}`
#          （取自 agy 二进制内嵌的 hooks 文档）
#
# 载荷差异（实测/取证的字段名）：
#   · cmd / Claude : {"tool_input": {"file_path": "..."}}
#   · Hermes       : {"args": {"path": "..."}}
#   · Antigravity  : {"toolCall": {"args": {"TargetFile": "..."}}}   ← 出现 toolCall 即 agy
#
# 规则（与 .githooks/pre-commit 同源，避免两处漂移）：
#   写受保护路径（packages/ · prisma/ · src/app/api/）
#   且上一条需求分诊为 SPEC_REQUIRED
#   且还没有比该记录更新的规格包
#   → 拦下。
#
# 逃生阀：AGENT_ROUTE_SKIP=1（放行）。只在确认判定有误时用，并回头改规则表。
set -uo pipefail

if [ "${AGENT_ROUTE_SKIP:-0}" = "1" ]; then exit 0; fi

INPUT=$(cat)

# 解析「文件路径」与「协议类型」——逻辑在独立的 .agents/hooks/parse-payload.js 里。
# 之前内联在 node -e 里，正则中的单引号会把 shell 字符串提前闭合（踩过多次），故拆开。
PARSED=$(printf '%s' "$INPUT" | node "$(dirname "$0")/parse-payload.js" 2>/dev/null || printf '{"file":"","protocol":"exit2"}')

FILE_PATH=$(printf '%s' "$PARSED" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{process.stdout.write(JSON.parse(s).file||"")}catch{}})')
PROTOCOL=$(printf '%s' "$PARSED" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{process.stdout.write(JSON.parse(s).protocol||"exit2")}catch{process.stdout.write("exit2")}})')

# 不是写受保护路径 → 不表态
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

# **必须转成绝对路径**：下面用 `require()` 读它，而 `require("docs/x.json")` 会被当成模块名解析、
# 读不到 → VERDICT 为空 → **静默放行**（实测踩过）。宁可多一行，也不要静默失效。
RECORD="$(cd "$(dirname "$RECORD")" && pwd)/$(basename "$RECORD")"

VERDICT=$(node -e 'try{process.stdout.write(require(process.argv[1]).verdict||"")}catch{}' "$RECORD" 2>/dev/null || echo "")
if [ "$VERDICT" != "SPEC_REQUIRED" ]; then exit 0; fi

NEWER=$(find "$ROOT/docs/specs" -name brief.json -newer "$RECORD" 2>/dev/null | head -1 || true)
if [ -n "$NEWER" ]; then exit 0; fi

MSG="[spec-gate] 拦截：上一条需求被判为「需要规格」(SPEC_REQUIRED)，但还没有对应规格包。

  要写的文件：${FILE_PATH}
  先执行：
      npm run speckit:new -- --name <名字> --domain <域> --type <类型> --title \"<标题>\"
  （分诊输出里已给出建议的 --type 与 --name）

  规则真源：scripts/lib/spec-necessity-rules.cjs（可审阅、可修改）
  确认判定有误时：AGENT_ROUTE_SKIP=1（并回头改规则表，而不是长期绕过）"

printf '%s\n' "$MSG" >&2

if [ "$PROTOCOL" = "antigravity" ]; then
  # Antigravity：读 stdout 的 JSON decision，不看退出码
  node -e 'process.stdout.write(JSON.stringify({ decision: "deny", reason: process.argv[1] }))' "$MSG"
  exit 0
fi

exit 2
