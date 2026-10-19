#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "================================================================"
echo "      CoolieBase All - One-Click Project Generator (Linux/macOS)"
echo "================================================================"
echo ""

# 1. 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed or not in PATH."
  echo "Please install Node.js v20+ from https://nodejs.org/"
  exit 1
fi

# 2. 获取目标路径参数
TARGET_DIR="${1:-}"

if [ -z "$TARGET_DIR" ]; then
  echo "[Step 1] 请输入新项目的目标完整路径:"
  echo "  例如: /home/user/workspace/my-new-app"
  echo "  例如: ../my-new-app"
  echo ""
  read -r -p "目标路径: " TARGET_DIR || true
fi

if [ -z "$TARGET_DIR" ]; then
  echo "[ERROR] 目标路径不能为空！"
  exit 1
fi

echo ""
echo "[Step 2] 正在基于当前底座克隆并初始化新项目..."
echo "----------------------------------------------------------------"
node scripts/clone-project-base.cjs "$TARGET_DIR" "${@:2}"

echo ""
echo "================================================================"
echo "      🎉 新项目已全自动创建就绪，全量 SQL 数据已默认初始化！"
echo "================================================================"
echo ""
echo "是否立即进入新项目目录安装依赖 (pnpm install)？"
echo "  [1] 是 - 立即自动安装依赖 [推荐]"
echo "  [2] 否 - 稍后手动安装"
echo ""
read -r -p "请输入选项 [默认 1]: " AUTO_INSTALL || true
AUTO_INSTALL="${AUTO_INSTALL:-1}"

if [ "$AUTO_INSTALL" = "1" ]; then
  echo ""
  echo "正在安装依赖包..."
  cd "$TARGET_DIR"
  pnpm install
  echo ""
  echo "================================================================"
  echo "全部就绪！数据库已自动初始化，直接运行 ./start.sh 即可启动："
  echo "  cd \"$TARGET_DIR\""
  echo "  ./start.sh"
  echo "================================================================"
else
  echo ""
  echo "您可以随时进入目录启动开发（数据库已为您默认初始化完成）："
  echo "  1. cd \"$TARGET_DIR\""
  echo "  2. ./start.sh"
fi

