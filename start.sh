#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f deploy/docker-compose.dev.yml)

echo "================================================================"
echo "         CoolieBase All - Developer Launcher (Linux/macOS)      "
echo "================================================================"
echo ""

# 1. 检查 node 与 npm
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed or not in PATH."
  echo "Please install Node.js v20+ from https://nodejs.org/"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm is not found in PATH."
  exit 1
fi

# 2. 智能感知当前目录与同步环境
node scripts/auto-detect-env.cjs

# 默认端口避开 Coolie 控制面 :3200，优先取调用方传入的 PORT，其次取 .env，缺省回退 3301
APP_PORT="${PORT:-}"
if [ -z "$APP_PORT" ] && [ -f ".env" ]; then
  DETECTED_PORT=$(grep -E '^PORT=' .env | cut -d'=' -f2 | tr -d ' "' || true)
  if [ -n "$DETECTED_PORT" ]; then
    APP_PORT="$DETECTED_PORT"
  fi
fi
APP_PORT="${APP_PORT:-3301}"

# 3. 解析模式或展示交互式菜单
MODE="${1:-}"

if [ -z "$MODE" ]; then
  echo "Please select startup mode:"
  echo "  [1] Fast Local Dev Mode - Next.js at http://localhost:${APP_PORT} [Recommended]"
  echo "  [2] Embedded Postgres Dev Mode - Embedded PostgreSQL:55432 (Zero Docker) + Next.js"
  echo "  [3] Infrastructure Only - Start Embedded PostgreSQL (55432)"
  echo "  [4] Full Docker Mode - Docker PostgreSQL:5433 + Redis:6380 + Next.js"
  echo "  [5] Architecture Governance Check - pnpm run check"
  echo "  [6] Stop Project Services (Embedded DB & Docker)"
  echo "  [7] Database Backup - pnpm run db:backup"
  echo ""
  read -r -p "Enter number [default 1]: " CHOICE || true
  CHOICE="${CHOICE:-1}"
  case "$CHOICE" in
    1) MODE="app" ;;
    2) MODE="dev" ;;
    3) MODE="infra" ;;
    4) MODE="docker" ;;
    5) MODE="check" ;;
    6) MODE="stop" ;;
    7) MODE="backup" ;;
    *) MODE="app" ;;
  esac
fi

usage() {
  cat <<EOF
Usage: ./start.sh [mode]

Available modes:
  app     - Fast local Next.js dev server: http://localhost:${APP_PORT} [Default]
  dev     - Start Docker DB/Redis, migrate, seed, backup, and run Next.js
  infra   - Start DB/Redis containers, migrate, seed, and backup
  docker  - Full containerized deployment
  memory  - Pure in-memory dev server
  check   - Run matrix, domain, and microservice governance checks
  backup  - Backup PostgreSQL database to backups/
  status  - Show Docker container status
  stop    - Stop all project containers
EOF
}

app() {
  local pkg_slug
  pkg_slug="$(node -p 'try { JSON.parse(require("fs").readFileSync("package.json","utf8")).name } catch { "cooliebase" }' 2>/dev/null || echo "cooliebase")"
  if [ -f "scripts/port-registry.cjs" ]; then
    if ! node scripts/port-registry.cjs check "${APP_PORT}" "${pkg_slug}"; then
      echo "[ERROR] 端口 ${APP_PORT} 已被其他项目独占，拒绝静默换栈启动！请先释放端口。"
      exit 1
    fi
  fi
  if lsof -iTCP:"${APP_PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[ERROR] 端口 ${APP_PORT} 已有活跃监听进程 (PID: $(lsof -iTCP:"${APP_PORT}" -sTCP:LISTEN -t | tr '\n' ' '))，拒绝冲突启动！"
    exit 1
  fi
  echo "[INFO] Starting Next.js development server..."
  echo "[INFO] Access Homepage: http://localhost:${APP_PORT}"
  echo "[INFO] Access Admin:    http://localhost:${APP_PORT}/login"
  echo ""
  exec pnpm run dev
}

infra() {
  echo "[STEP] 启动嵌入式真实 PostgreSQL (端口 55432，零 Docker)..."
  node scripts/dev-db-embedded.cjs -d
  echo "[STEP] Generating Prisma client, applying migrations, seeding and backing up data..."
  pnpm run db:generate
  pnpm run db:migrate
  pnpm run db:seed
  pnpm run db:backup
  echo "[OK] 嵌入式基础设施就绪 (PostgreSQL: 55432)。"
  return 0
}

docker_infra() {
  if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    echo "[WARN] Docker 未运行，自动回退到嵌入式 PostgreSQL..."
    infra
    return 0
  fi
  echo "[STEP] 启动 Docker 容器 (PostgreSQL: 5433, Redis: 6380)..."
  "${COMPOSE[@]}" up -d --wait postgres redis
  pnpm run db:generate
  pnpm run db:migrate
  pnpm run db:seed
  pnpm run db:backup
  echo "[OK] Docker 容器基础设施就绪。"
  return 0
}

dev() {
  if infra; then
    app
  else
    app
  fi
}

case "$MODE" in
  app)
    app
    ;;
  dev)
    dev
    ;;
  infra)
    infra
    echo "[OK] Infrastructure containers are running."
    ;;
  docker)
    infra || true
    echo '[STEP] Building and starting complete Docker compose stack...'
    "${COMPOSE[@]}" up -d --build
    echo "[OK] App running in Docker at http://localhost:${APP_PORT}"
    ;;
  memory)
    echo "[INFO] Starting in pure in-memory mode on http://localhost:${APP_PORT}..."
    DB_DRIVER=memory DATABASE_URL=memory://cooliebase-all REDIS_URL= PORT="${APP_PORT}" exec pnpm exec next dev -H 0.0.0.0 -p "${APP_PORT}"
    ;;
  check)
    echo "[STEP] Running governance and lint checks..."
    pnpm run check
    ;;
  backup)
    echo "[STEP] Backing up database..."
    pnpm run db:backup
    ;;
  status)
    "${COMPOSE[@]}" ps
    ;;
  stop)
    echo '[STEP] Stopping project services...'
    node scripts/dev-db-embedded.cjs --stop || true
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      "${COMPOSE[@]}" down 2>/dev/null || true
    fi
    echo '[OK] Services and databases stopped.'
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "[ERROR] Unknown mode: $MODE" >&2
    usage
    exit 2
    ;;
esac
