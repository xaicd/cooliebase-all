#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f deploy/docker-compose.dev.yml)

echo "================================================================"
echo "         CoolieBase All Base - Developer Launcher (Linux/macOS)      "
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

APP_PORT="3200"
if [ -f ".env" ]; then
  DETECTED_PORT=$(grep -E '^PORT=' .env | cut -d'=' -f2 | tr -d ' "' || true)
  if [ -n "$DETECTED_PORT" ]; then
    APP_PORT="$DETECTED_PORT"
  fi
fi

# 3. 解析模式或展示交互式菜单
MODE="${1:-}"

if [ -z "$MODE" ]; then
  echo "Please select startup mode:"
  echo "  [1] Fast Local Dev Mode - Next.js at http://localhost:${APP_PORT} [Recommended]"
  echo "  [2] Full Docker Mode - PostgreSQL:5433 + Redis:6380 + Next.js"
  echo "  [3] Infrastructure Only - Start DB + Redis containers"
  echo "  [4] Architecture Governance Check - npm run check"
  echo "  [5] Stop Project Docker Containers"
  echo "  [6] Database Backup - npm run db:backup"
  echo ""
  read -r -p "Enter number [default 1]: " CHOICE || true
  CHOICE="${CHOICE:-1}"
  case "$CHOICE" in
    1) MODE="app" ;;
    2) MODE="dev" ;;
    3) MODE="infra" ;;
    4) MODE="check" ;;
    5) MODE="stop" ;;
    6) MODE="backup" ;;
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
  echo "[INFO] Starting Next.js development server..."
  echo "[INFO] Access Homepage: http://localhost:${APP_PORT}"
  echo "[INFO] Access Admin:    http://localhost:${APP_PORT}/login"
  echo ""
  exec npm run dev
}

infra() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "[WARN] Docker is not installed or not in PATH."
    echo "[WARN] Falling back to Fast Local Dev Mode..."
    return 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "[WARN] Docker daemon is not running."
    echo "[WARN] Falling back to Fast Local Dev Mode..."
    return 1
  fi
  echo "[STEP] Starting PostgreSQL (5433) and Redis (6380)..."
  "${COMPOSE[@]}" up -d --wait postgres redis
  echo "[STEP] Generating Prisma client, applying migrations, seeding and backing up data..."
  npm run db:generate
  npm run db:migrate
  npm run db:seed
  npm run db:backup
  echo "[OK] Infrastructure is ready."
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
    echo "[INFO] Starting in pure in-memory mode..."
    DB_DRIVER=memory DATABASE_URL=memory://cooliebase-all-base REDIS_URL= exec npm run dev
    ;;
  check)
    echo "[STEP] Running governance and lint checks..."
    npm run check
    ;;
  backup)
    echo "[STEP] Backing up database..."
    npm run db:backup
    ;;
  status)
    "${COMPOSE[@]}" ps
    ;;
  stop)
    echo '[STEP] Stopping project Docker services...'
    "${COMPOSE[@]}" down
    echo '[OK] Containers stopped.'
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
