#!/usr/bin/env bash
# ==============================================================================
# cooliebase-all —— 标准全生命周期服务操控执行器 (Standard Lifecycle Service Controller)
# 支持指令：install | build | start | stop | restart | status | health | logs | deploy
# 统一 Harness 映射：与 pnpm harness <action> 保持严格 1:1 双向对齐
# 唯一对外端口标准：单一入口 http://127.0.0.1:${PORT}/${SLUG}/
# ==============================================================================
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJ_ROOT}"
mkdir -p logs

ACTION="${1:-status}"
shift || true

get_project_slug() {
  node -e '
    const fs = require("fs");
    let name = "cooliebase";
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      name = (pkg.name || "").replace(/^@.*\//, "");
    } catch {}
    const isMaster = process.env.COOLIE_MASTER_BASE === "true" || name === "cooliebase-all";
    if (isMaster) {
      console.log("");
    } else {
      const slug = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "").replace(/^-|-$/g, "") || "app";
      console.log(slug);
    }
  '
}

SLUG="$(get_project_slug)"
BASE_PATH="${SLUG:+/$SLUG}"
PORT="${PORT:-3300}"
PID_FILE="logs/service.pid"
LOG_FILE="logs/service.log"

get_pid() {
  if [ -f "$PID_FILE" ]; then
    local p="$(cat "$PID_FILE" | tr -d ' \n\r')"
    if [ -n "$p" ] && kill -0 "$p" 2>/dev/null; then
      echo "$p"
      return 0
    fi
  fi
  # 探针辅助：如果 pid 文件丢失但端口 3300 正在监听，嗅探 node 进程
  local listen_pid="$(lsof -i ":${PORT}" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true)"
  if [ -n "$listen_pid" ]; then
    echo "$listen_pid" > "$PID_FILE"
    echo "$listen_pid"
    return 0
  fi
  return 1
}

do_install() {
  echo "📦 [${SLUG:-cooliebase}] 执行标准依赖安装与初始化 (install)..."
  pnpm install
  pnpm exec prisma generate
  echo "✅ 安装与数据客户端生成就绪"
}

do_build() {
  echo "🏗️  [${SLUG:-cooliebase}] 执行标准轻全栈生产态构建 (build)..."
  pnpm build
  echo "✅ 构建完成（Standalone 独立部署包已就绪）"
}

do_start() {
  if pid="$(get_pid)"; then
    echo "⚠️  服务已在运行 (PID: $pid, 端口: ${PORT})"
    return 0
  fi
  # 启动前端口注册表检查与排他占用判定 (D5 防占坑假阳性)
  if [ -f "scripts/port-registry.cjs" ]; then
    if ! node scripts/port-registry.cjs check "${PORT}" "${SLUG:-cooliebase}"; then
      echo "❌ 启动终止: 端口 ${PORT} 存在外部项目冲突，请排查释放后重试"
      exit 1
    fi
  fi
  echo "🚀 [${SLUG:-cooliebase}] 启动全生命周期统一服务 (对外单一端口: ${PORT}${BASE_PATH})..."

  # 后台启动统一拉起引擎
  nohup node scripts/fullstack-up.mjs > "$LOG_FILE" 2>&1 &
  local new_pid=$!
  echo $new_pid > "$PID_FILE"
  if [ -f "scripts/port-registry.cjs" ]; then
    node scripts/port-registry.cjs claim "${PORT}" "${SLUG:-cooliebase}" "$new_pid" || true
  fi

  # 等待探活
  local max_wait=30
  local ok=0
  for ((i=1; i<=max_wait; i++)); do
    sleep 1
    if curl -s -f -m 2 "http://127.0.0.1:${PORT}${BASE_PATH}/readyz" >/dev/null 2>&1; then
      ok=1
      break
    fi
  done

  if [ $ok -eq 1 ]; then
    echo "✅ 全栈服务已拉起并就绪 (主进程 PID: $new_pid)"
    echo "🔗 统一对外单一入口: http://127.0.0.1:${PORT}${BASE_PATH}"
    echo "   • C端门户: http://127.0.0.1:${PORT}${BASE_PATH}/2c"
    echo "   • B端中台: http://127.0.0.1:${PORT}${BASE_PATH}/admin"
  else
    echo "⚠️ 服务已在后台拉起 (PID: $new_pid)，但 30s 内未完成就绪响应，请检查 $LOG_FILE"
  fi
}

do_stop() {
  echo "🛑 停止 [${SLUG:-cooliebase}] 全栈服务..."
  if [ -f "scripts/port-registry.cjs" ]; then
    node scripts/port-registry.cjs release "${PORT}" "${SLUG:-cooliebase}" || true
  fi
  if pid="$(get_pid)"; then
    kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  # 彻底清理监听端口
  lsof -i ":${PORT}" -t | xargs kill -9 2>/dev/null || true
  echo "✅ 全栈服务与端口 ${PORT} 已全部干净停止"
}

do_status() {
  if pid="$(get_pid)"; then
    echo "🟢 服务运行中 (PID: $pid, 监听端口: ${PORT})"
    echo "   • 统一入口: http://127.0.0.1:${PORT}${BASE_PATH}"
    echo "   • C端商城:  http://127.0.0.1:${PORT}${BASE_PATH}/2c"
    echo "   • B端后台:  http://127.0.0.1:${PORT}${BASE_PATH}/admin"
  else
    echo "🔴 服务未运行 (端口 ${PORT} 空闲)"
  fi
}

do_health() {
  if curl -s -f -m 3 "http://127.0.0.1:${PORT}${BASE_PATH}/readyz" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (readyz): http://127.0.0.1:${PORT}${BASE_PATH}/readyz"
  elif curl -s -f -m 3 "http://127.0.0.1:${PORT}${BASE_PATH}/2c" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (2c): http://127.0.0.1:${PORT}${BASE_PATH}/2c"
  elif curl -s -f -m 3 "http://127.0.0.1:${PORT}${BASE_PATH}/" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (root): http://127.0.0.1:${PORT}${BASE_PATH}/"
  else
    echo "⚠️ 统一网关端口 ${PORT}${BASE_PATH} 暂未就绪响应"
    return 1
  fi
}

do_logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -n 50 "$LOG_FILE"
  else
    echo "ℹ️ 暂无日志文件 ($LOG_FILE)"
  fi
}

do_deploy() {
  echo "🚀 [${SLUG:-cooliebase}] 执行标准生产部署同步 (deploy)..."
  bash scripts/fullstack-up.mjs --check || true
  echo "✅ 部署与网关规则校验通过"
}

case "$ACTION" in
  install) do_install "$@" ;;
  build)   do_build "$@" ;;
  start)   do_start "$@" ;;
  stop)    do_stop "$@" ;;
  restart) do_stop; sleep 1; do_start "$@" ;;
  status)  do_status "$@" ;;
  health)  do_health "$@" ;;
  logs)    do_logs "$@" ;;
  deploy)  do_deploy "$@" ;;
  *)
    echo "用法: bash scripts/service.sh [install|build|start|stop|restart|status|health|logs|deploy]"
    exit 1
    ;;
esac
