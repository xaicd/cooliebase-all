#!/usr/bin/env bash
# PreToolUse(write|edit) hook：在**没走规格流程**时拦下对受保护路径的写入。
#
# 为什么是 hook 而不是写在文档里：文档只能"提醒模型"，hook 是引擎级判定 —— 模型无法绕过。
# 这是"任意 CLI 都能自动"的 cmd 侧那一半（另一半是 .githooks，跨 CLI 生效）。
#
# 判定逻辑（精准拦截，不是为了找麻烦）：
#   · 只拦**受保护路径**：packages/ · prisma/ · src/app/api/
#   · 只拦**上一条需求被判为 SPEC_REQUIRED、却还没有任何规格包**的情况
#   · 其余一律放行 —— 判为 DIRECT_OK 的改动不受影响
# 逃生阀：AGENT_ROUTE_ENFORCE=0 关闭拦截（只提示）。
set -euo pipefail
INPUT=$(cat)

PROJECT_DIR="${COMMANDCODE_PROJECT_DIR:-.}"
ENFORCE="${AGENT_ROUTE_ENFORCE:-1}"

read_field() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -r "$1 // \"\""
  else
    node -e '
      const fs=require("fs"); const [path]=process.argv.slice(1)
      let d={}; try{ d=JSON.parse(fs.readFileSync(0,"utf8")) }catch{}
      const get=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o)
      process.stdout.write(String(get(d,path) ?? ""))
    ' "$1"
  fi
}

emit() { # $1 = decision(allow|deny)  $2 = reason  $3 = extra context
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg d "$1" --arg r "$2" --arg c "$3" '{
      continue: true,
      systemMessage: $r,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: $d,
        permissionDecisionReason: $r,
        additionalContext: $c
      }
    }'
  else
    node -e '
      const [d,r,c]=process.argv.slice(1)
      process.stdout.write(JSON.stringify({continue:true,systemMessage:r,hookSpecificOutput:{
        hookEventName:"PreToolUse",permissionDecision:d,permissionDecisionReason:r,additionalContext:c}}))
    ' "$1" "$2" "$3"
  fi
}

FILE_PATH=$(read_field ".tool_input.file_path")
if [ -z "$FILE_PATH" ]; then
  exit 0   # 没有文件路径（非 write/edit）→ 不表态
fi

case "$FILE_PATH" in
  */packages/*|*/prisma/*|*/src/app/api/*) : ;;
  *) exit 0 ;;
esac

RECORD="$PROJECT_DIR/docs/architecture/artifacts/agent-route-last.json"
if [ ! -f "$RECORD" ]; then
  emit "allow" "未找到需求分诊记录（agent-route-last.json）" \
"本仓要求：动手前先跑 \`npm run agent:route -- \"<用户原始需求>\"\`。当前**没有分诊记录**，
所以无法判断这次改动该不该立规格。请先跑该命令，再继续写文件。"
  exit 0
fi

VERDICT=$(node -e 'try{process.stdout.write(require(process.argv[1]).verdict||"")}catch{}' "$RECORD" 2>/dev/null || echo "")
AT=$(node -e 'try{process.stdout.write(require(process.argv[1]).at||"")}catch{}' "$RECORD" 2>/dev/null || echo "")

if [ "$VERDICT" != "SPEC_REQUIRED" ]; then
  # 判为可直接改：明确放行，避免模型误以为还要立规格
  emit "allow" "需求分诊结论：DIRECT_OK（可直接改）" \
"上一条需求的分诊结论是 DIRECT_OK（$(date -r "$RECORD" +%F 2>/dev/null || echo "$AT")），本仓允许直接改。
改完仍须 \`npm run check\` 全绿。"
  exit 0
fi

# 判为需要规格 —— 看是否已经建了比记录更新的规格包
NEWER=$(find "$PROJECT_DIR/docs/specs" -name brief.json -newer "$RECORD" 2>/dev/null | head -1)

MSG="上一条需求被判为 **需要规格**（SPEC_REQUIRED），但**还没有对应的规格包**。
请先执行：
    npm run speckit:new -- --name <名字> --domain <域> --type <类型> --title \"<标题>\"
（分诊输出里已给出建议的 --type 与 --name）。
这一步不是形式：规格包会固定验收标准与不变量，后面 \`speckit:tasks\` 靠它做任务追溯。"
CTX="分诊记录：${AT}（${RECORD}）。规则真源 scripts/lib/spec-necessity-rules.cjs —— 若认为判错了，改规则表并跑 test/unit/agent-route.test.ts，而不是绕过。"

if [ -n "$NEWER" ] || [ "$ENFORCE" = "0" ]; then
  emit "allow" "需求分诊：SPEC_REQUIRED（已存在规格包$([ -n "$NEWER" ] && echo "：${NEWER#"$PROJECT_DIR"/}")）" "$CTX"
else
  emit "deny" "拦截：本需求需要规格，但还没有规格包 —— 先立规格再改受保护路径" "$MSG"
fi
