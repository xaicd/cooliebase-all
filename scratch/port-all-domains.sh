#!/usr/bin/env bash
# 批量把源框架的业务域导入为本仓的第一方插件。
# 逐域调用 domain:new（内部: 建表迁移 -> codegen -> 注册插件 -> 重生成 -> 打印后续）。
# 已存在的手写文件默认**不覆盖**（domain:new 的既有保护）。
set -u
cd "$(dirname "$0")/.." || exit 1

DOMAINS="${DOMAINS:-ai bpm crm erp im iot mall member mes mp pay report}"

for d in $DOMAINS; do
  echo ""
  echo "================ $d ================"
  pnpm exec tsx scripts/create-business-domain.ts "$d" \
    --tables "scripts/data/$d-source-tables.ts" \
    --export "$(echo "$d" | tr '[:lower:]' '[:upper:]')_TABLES" 2>&1 | grep -vE "^npm warn|^$" | tail -12
  echo "---- $d exit=${PIPESTATUS[0]} ----"
done

echo ""
echo "================ 全部完成 ================"
