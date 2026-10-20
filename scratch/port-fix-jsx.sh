#!/usr/bin/env bash
# 修好 jsxText/javadoc 剥离后，重导元数据 + 重生成全部 12 个域。
set -u
cd "$(dirname "$0")/.." || exit 1
SRC="${SRC:-}"
DOMAINS="ai bpm crm erp im iot mall member mes mp pay report"

echo "======== 1) 重导元数据（剥 javadoc 标签）========"
for d in $DOMAINS; do
  pnpm exec tsx scripts/import-source-tables.ts --source "$SRC" --module "$d" --domain "$d" --write 2>&1 \
    | grep -oE "解析出 [0-9]+ 张表" | sed "s/^/  $d: /"
done

echo ""
echo "======== 2) 覆盖重生成 ========"
for d in $DOMAINS; do
  pnpm exec tsx scripts/create-business-domain.ts "$d" \
    --tables "scripts/data/$d-source-tables.ts" \
    --export "$(echo "$d" | tr '[:lower:]' '[:upper:]')_TABLES" --force >/dev/null 2>&1
  echo "  $d exit=$?"
done

echo ""
echo "======== 3) 恢复手写实现（生成器不该覆盖的）========"
git checkout HEAD -- packages/plugins/plugin-member/backend/repositories/member-user.repository.ts \
                    packages/plugins/plugin-member/backend/services/member-user.service.ts 2>/dev/null
rm -f packages/plugins/plugin-member/backend/services/__tests__/member-user.service.test.ts \
      packages/plugins/plugin-member/backend/services/member-user.rpc.ts \
      packages/plugins/plugin-member/contract/member-user.actions.ts \
      packages/plugins/plugin-member/contract/member-user.rbac.sql \
      packages/plugins/plugin-member/backend/validators/member-user.validator.ts
echo "  已恢复 member 手写对"

echo ""
echo "======== 4) 汇总 Agent 契约注册表 ========"
node scripts/agent/collect-contracts.cjs

echo ""
echo "======== 全部完成 ========"
