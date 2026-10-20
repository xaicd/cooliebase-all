#!/usr/bin/env bash
# 用生成器**覆盖**旧脚手架骨架（它们不是手写代码，是早期脚手架产物）。
# 排除 wms —— 那是手写的。
set -u
cd "$(dirname "$0")/.." || exit 1
for d in ai bpm crm erp im iot mall member mes mp pay report; do
  echo ""
  echo "================ $d (force) ================"
  pnpm exec tsx scripts/create-business-domain.ts "$d" \
    --tables "scripts/data/$d-source-tables.ts" \
    --export "$(echo "$d" | tr '[:lower:]' '[:upper:]')_TABLES" --force 2>&1 | grep -vE "^npm warn|^$" | tail -6
  echo "---- $d exit=${PIPESTATUS[0]} ----"
done
echo ""; echo "================ force 完成 ================"
