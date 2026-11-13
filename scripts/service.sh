#!/usr/bin/env bash
# ==============================================================================
# cooliebase-all —— 标准 8 动词全生命周期服务操控执行器 (Standard Lifecycle Service Controller)
# 支持指令：install | build | start | stop | restart | status | health | logs | deploy | --help
# 统一 Harness 映射：与 pnpm harness service <action> 及 scripts/run-all.cjs 对齐
# 端口契约：优先读取调用方环境变量 -> .env.ports -> .env.local -> .env -> 默认 3300
# ==============================================================================
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJ_ROOT}"
mkdir -p logs

ACTION="${1:-status}"
if [ $# -gt 0 ]; then
  shift
fi

load_env_defaults() {
  local env_file
  for env_file in ".env.ports" ".env.local" ".env"; do
    if [ -f "${env_file}" ]; then
      while IFS= read -r raw_line || [ -n "${raw_line}" ]; do
        local line="${raw_line%%#*}"
        line="$(printf '%s' "${line}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        [ -z "${line}" ] && continue
        case "${line}" in
          *=*)
            local key="${line%%=*}"
            local val="${line#*=}"
            key="$(printf '%s' "${key}" | tr -d '[:space:]')"
            val="$(printf '%s' "${val}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
            if [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && [ -z "${!key:-}" ]; then
              export "${key}=${val}"
            fi
            ;;
        esac
      done < "${env_file}"
    fi
  done
}

load_env_defaults

get_project_slug() {
  node -e '
    const fs = require("fs");
    let name = "cooliebase";
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      name = (pkg.name || "").replace(/^@.*\//, "");
    } catch (_err) {
      /* package.json 缺失或解析异常时回退默认名称 */
    }
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
if [ -n "${BASE_PATH:-}" ]; then
  if [ "${BASE_PATH}" = "/" ]; then
    NORM_BASE_PATH=""
  else
    NORM_BASE_PATH="/${BASE_PATH#/}"
    NORM_BASE_PATH="${NORM_BASE_PATH%/}"
  fi
else
  NORM_BASE_PATH="${SLUG:+/$SLUG}"
fi
PORT="${PORT:-${GATEWAY_PORT:-${BACKEND_PORT:-3300}}}"
export PORT
PID_FILE="logs/service.pid"
LOG_FILE="logs/service.log"

print_help() {
  cat <<EOF
用法: bash scripts/service.sh <verb> [options]
      bash deploy/service.sh <verb> [options]

标准 8 动词服务控制契约 (Coolie Layer-B Service Triad):
  install   安装工作区依赖（优先离线缓存）并生成 Prisma Client
  build     执行 Prisma 生成与 Next.js Standalone 生产构建 (pnpm run build)
  start     后台拉起全栈服务（对接 scripts/fullstack-up.mjs 与 .env.ports）
  stop      优雅终止服务进程并释放端口 ${PORT}
  restart   平滑重启服务 (stop -> start)
  status    查询 PID 存活态、监听端口与 B/C 端访问入口
  health    真实 HTTP 就绪探活 (/api/health -> /readyz -> /2c)
  logs      查看最近运行日志 (${LOG_FILE})

扩展指令:
  deploy    执行全栈启动前置自检 (node scripts/run-all.cjs --check)
  --help    显示本帮助说明并退出 (exit 0)
EOF
}

get_pid() {
  if [ -f "$PID_FILE" ]; then
    local p
    p="$(cat "$PID_FILE" | tr -d ' \n\r')"
    if [ -n "$p" ] && kill -0 "$p" 2>/dev/null; then
      echo "$p"
      return 0
    fi
  fi
  if command -v lsof >/dev/null 2>&1; then
    local listen_pid
    listen_pid="$(lsof -i ":${PORT}" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true)"
    if [ -n "$listen_pid" ]; then
      echo "$listen_pid" > "$PID_FILE"
      echo "$listen_pid"
      return 0
    fi
  fi
  return 1
}

do_install() {
  echo "📦 [${SLUG:-cooliebase}] 执行标准依赖安装与初始化 (install)..."
  pnpm install --frozen-lockfile --offline || pnpm install --frozen-lockfile || pnpm install
  pnpm exec prisma generate
  echo "✅ 安装与数据客户端生成就绪"
}

do_build() {
  echo "🏗️  [${SLUG:-cooliebase}] 执行标准轻全栈生产态构建 (build)..."
  pnpm run build
  echo "✅ 构建完成（Standalone 独立部署包已就绪）"
}

do_start() {
  if pid="$(get_pid)"; then
    echo "⚠️  服务已在运行 (PID: $pid, 端口: ${PORT})"
    return 0
  fi
  if [ -f "scripts/port-registry.cjs" ]; then
    if ! node scripts/port-registry.cjs check "${PORT}" "${SLUG:-cooliebase}"; then
      echo "❌ 启动终止: 端口 ${PORT} 存在外部项目冲突，请排查释放后重试"
      exit 1
    fi
  fi
  echo "🚀 [${SLUG:-cooliebase}] 启动全生命周期统一服务 (对外单一端口: ${PORT}${NORM_BASE_PATH})..."

  nohup node scripts/fullstack-up.mjs > "$LOG_FILE" 2>&1 &
  local new_pid=$!
  echo "$new_pid" > "$PID_FILE"
  if [ -f "scripts/port-registry.cjs" ]; then
    node scripts/port-registry.cjs claim "${PORT}" "${SLUG:-cooliebase}" "$new_pid" || true
  fi

  local max_wait=30
  local ok=0
  for ((i=1; i<=max_wait; i++)); do
    sleep 1
    if curl -s -f -m 2 "http://127.0.0.1:${PORT}${NORM_BASE_PATH}/api/health" >/dev/null 2>&1 \
      || curl -s -f -m 2 "http://127.0.0.1:${PORT}${NORM_BASE_PATH}/readyz" >/dev/null 2>&1; then
      ok=1
      break
    fi
  done

  if [ $ok -eq 1 ]; then
    echo "✅ 全栈服务已拉起并就绪 (主进程 PID: $new_pid)"
    echo "🔗 统一对外单一入口: http://127.0.0.1:${PORT}${NORM_BASE_PATH}"
    echo "   • C端门户: http://127.0.0.1:${PORT}${NORM_BASE_PATH}/2c"
    echo "   • B端中台: http://127.0.0.1:${PORT}${NORM_BASE_PATH}/admin"
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
  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":${PORT}" -t 2>/dev/null | xargs kill -9 2>/dev/null || true
  fi
  echo "✅ 全栈服务与端口 ${PORT} 已全部干净停止"
}

do_status() {
  if pid="$(get_pid)"; then
    echo "🟢 服务运行中 (PID: $pid, 监听端口: ${PORT})"
    echo "   • 统一入口: http://127.0.0.1:${PORT}${NORM_BASE_PATH}"
    echo "   • C端商城:  http://127.0.0.1:${PORT}${NORM_BASE_PATH}/2c"
    echo "   • B端后台:  http://127.0.0.1:${PORT}${NORM_BASE_PATH}/admin"
  else
    echo "🔴 服务未运行 (端口 ${PORT} 空闲)"
  fi
}

do_health() {
  if curl -s -f -m 3 "http://127.0.0.1:${PORT}${NORM_BASE_PATH}/api/health" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (api/health): http://127.0.0.1:${PORT}${NORM_BASE_PATH}/api/health"
  elif curl -s -f -m 3 "http://127.0.0.1:${PORT}${NORM_BASE_PATH}/readyz" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (readyz): http://127.0.0.1:${PORT}${NORM_BASE_PATH}/readyz"
  elif curl -s -f -m 3 "http://127.0.0.1:${PORT}${NORM_BASE_PATH}/2c" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (2c): http://127.0.0.1:${PORT}${NORM_BASE_PATH}/2c"
  elif curl -s -f -m 3 "http://127.0.0.1:${PORT}${NORM_BASE_PATH}/" >/dev/null 2>&1; then
    echo "✅ 探活 200 OK (root): http://127.0.0.1:${PORT}${NORM_BASE_PATH}/"
  else
    echo "⚠️ 统一网关端口 ${PORT}${NORM_BASE_PATH} 暂未就绪响应"
    return 1
  fi
}

do_logs() {
  local lines="${1:-50}"
  if [ -f "$LOG_FILE" ]; then
    tail -n "${lines}" "$LOG_FILE"
  else
    echo "ℹ️ 暂无日志文件 ($LOG_FILE)"
  fi
}

do_deploy() {
  echo "🚀 [${SLUG:-cooliebase}] 执行标准生产部署同步校验 (deploy)..."
  node scripts/run-all.cjs --check
  echo "✅ 部署与网关规则校验通过"
}

case "$ACTION" in
  install)            do_install "$@" ;;
  build)              do_build "$@" ;;
  start)              do_start "$@" ;;
  stop)               do_stop "$@" ;;
  restart)            do_stop; sleep 1; do_start "$@" ;;
  status)             do_status "$@" ;;
  health)             do_health "$@" ;;
  logs)               do_logs "$@" ;;
  deploy)             do_deploy "$@" ;;
  --help|-h|help)     print_help ;;
  *)
    print_help >&2
    exit 1
    ;;
esac
