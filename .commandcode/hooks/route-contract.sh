#!/usr/bin/env bash
# SessionStart hook：把「需求分诊」契约注入**会话第一轮**。
#
# 为什么用 hook 而不是只靠 AGENTS.md：规范文件是"希望模型遵守"，而 hook 是**引擎级**注入 ——
# 每次会话开始必定执行，模型绕不过去。这层不依赖任何模型是否读懂了文档。
#
# SessionStart 是非阻塞事件：只消费 additionalContext 与 systemMessage。
set -euo pipefail
INPUT=$(cat)

BRANCH=$(git -C "${COMMANDCODE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null || echo "unknown")
CTX=$(cat <<'TXT'
【本仓强制流程 · 需求分诊】
在动手做任何需求之前，**第一步必须**运行：

    npm run agent:route -- "<用户的原始需求原文>"

它会给出确定性判定（SPEC_REQUIRED / DIRECT_OK）、规格类型、命中的规则与下一步确切命令，
并顺带把用户原始输入记入 docs/features/sprint-prod/{MMDD}.md（AGENTS §15）。

规则真源：scripts/lib/spec-necessity-rules.cjs（可审阅、可修改；判定结论必须能溯源到具体规则）。
不要自行判断"这个应该不用立规格"——那正是此前失控的地方。
TXT
)

if command -v jq >/dev/null 2>&1; then
  jq -n --arg ctx "$CTX" --arg branch "$BRANCH" '{
    systemMessage: ("需求分诊契约已注入（branch: " + $branch + "）"),
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: $ctx }
  }'
else
  node -e '
    const ctx = process.argv[1], branch = process.argv[2]
    process.stdout.write(JSON.stringify({
      systemMessage: "需求分诊契约已注入（branch: " + branch + "）",
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx }
    }))
  ' "$CTX" "$BRANCH"
fi
