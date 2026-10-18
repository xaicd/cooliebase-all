#!/bin/bash
# ============================================================
# cooliebase-all-base 一键启动脚本（Linux/macOS）
# 用法: bash scripts/quick-start.sh [mode]
# mode: local(默认) | dev | test | prod | docker
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

MODE="${1:-local}"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     cooliebase-all-base Quick Start       ║"
echo "  ║     Mode: $MODE                         ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ============================================================
# Docker 模式
# ============================================================
if [ "$MODE" = "docker" ]; then
  log_step "启动 Docker 容器（local 模式）..."
  docker compose -f deploy/docker-compose.local.yml up --build -d
  log_info "容器已启动"
  log_info "访问: http://localhost:3100"
  log_info "登录: supervip (密码见 .env.local 或终端初始化日志)"
  exit 0
fi

if [ "$MODE" = "dev-docker" ]; then
  log_step "启动 Docker 容器（dev 模式，含 PostgreSQL）..."
  docker compose -f deploy/docker-compose.dev.yml up -d
  log_info "等待数据库就绪..."
  sleep 5
  log_info "容器已启动"
  log_info "访问: http://localhost:3100"
  log_info "PostgreSQL: localhost:5432 (cooliebase/cooliebase123)"
  exit 0
fi

# ============================================================
# 本地 Node.js 模式
# ============================================================

# Step 1: 检查 Node.js
log_step "1/5 检查环境..."
if ! command -v node &>/dev/null; then
  log_error "Node.js 未安装，请先安装 Node.js >= 20"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  log_error "Node.js 版本需要 >= 20，当前: $(node -v)"
  exit 1
fi
log_info "Node.js $(node -v) ✓"

# Step 2: 安装依赖
log_step "2/5 安装依赖..."
if [ ! -d "node_modules" ]; then
  npm install --legacy-peer-deps
  log_info "依赖安装完成 ✓"
else
  log_info "依赖已存在，跳过安装 ✓"
fi

# Step 3: 环境配置
log_step "3/5 配置环境..."
if [ ! -f ".env.local" ]; then
  cat > .env.local << 'EOF'
# cooliebase-all-base 本地开发配置（自动生成）
DB_DRIVER=memory
DATABASE_URL=file:./dev.db
JWT_SECRET=cooliebase-all-base-dev-secret-key-2026
JWT_EXPIRES_IN=86400
EOF
  log_info ".env.local 已生成（内存模式）✓"
else
  log_info ".env.local 已存在 ✓"
fi

# Step 4: Prisma generate（可选）
log_step "4/5 Prisma 初始化..."
if [ -f "prisma/schema.prisma" ]; then
  npx prisma generate 2>/dev/null || log_warn "Prisma generate 跳过（内存模式不需要）"
fi
log_info "Prisma ✓"

# Step 5: 启动
log_step "5/5 启动开发服务器..."
echo ""
log_info "═══════════════════════════════════════"
log_info "  应用地址: http://localhost:3100"
log_info "  登录页面: http://localhost:3100/login"
log_info "  平台账号: supervip (密码见 .env.local 或终端初始化日志)"
log_info "  数据模式: 内存（重启后数据重置）"
log_info "═══════════════════════════════════════"
echo ""

npm run dev
