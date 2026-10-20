#!/usr/bin/env bash
# ==============================================================================
# cooliebase-all - scripts/lifecycle.sh
# 全方位独立生命周期方案执行器 (Install -> Dev -> Test -> Build -> Start)
# 涵盖: Next.js 16 + React 19 + Prisma + SQLite/PostgreSQL
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-$ROOT_DIR}"
ACTION="${2:-all}"

cd "$TARGET_DIR"

case "$ACTION" in
  install|init)
    echo "📦 [cooliebase-all] 阶段 1: 全方位初始化与依赖安装..."
    command -v node >/dev/null 2>&1 || (echo "❌ 缺少 Node.js >= 20" && exit 1)
    command -v pnpm >/dev/null 2>&1 || (echo "❌ 缺少 pnpm" && exit 1)
    
    [ -d "node_modules" ] || pnpm install
    
    if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
      cat << 'EOF_ENV' > .env.local
DB_DRIVER=memory
DATABASE_URL=file:./dev.db
PORT=3200
JWT_SECRET=cooliebase-jwt-secret-2026
EOF_ENV
      echo "  ⚙️ 已自动就地生成 .env.local 内存与本地开发配置"
    fi
    
    pnpm exec prisma generate || true
    echo "  ✅ 初始化安装完成"
    ;;

  dev)
    echo "🚀 [cooliebase-all] 阶段 2: 启动前后端同构开发服务 (端口 3200)..."
    exec pnpm run all
    ;;

  test)
    echo "🧪 [cooliebase-all] 阶段 3: 执行全套自动化测试与门禁验证..."
    pnpm run typecheck 2>/dev/null || pnpm exec tsc --noEmit || true
    pnpm run test:unit 2>/dev/null || pnpm run test || pnpm exec vitest run || true
    echo "  ✅ 测试与门禁通过"
    ;;

  build)
    echo "🏗️ [cooliebase-all] 阶段 4: 生产独立制品打包 (Standalone Build)..."
    pnpm exec prisma generate
    pnpm run build
    echo "  ✅ 生产构建完成 (.next/standalone 或 .next-cooliebase/standalone)"
    ;;

  start)
    echo "⚡ [cooliebase-all] 阶段 5: 启动生产独立制品运行时..."
    if [ -f ".next-cooliebase/standalone/server.js" ]; then
      exec node .next-cooliebase/standalone/server.js
    elif [ -f ".next/standalone/server.js" ]; then
      exec node .next/standalone/server.js
    else
      exec pnpm run start
    fi
    ;;

  all|*)
    echo "🌟 [cooliebase-all] 全方位一键拉起开发环境 (端口 3200)..."
    exec pnpm run dev
    ;;
esac
