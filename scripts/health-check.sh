#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-3100}"
SERVER_LOG="${TMPDIR:-/tmp}/cooliebase-all-base-health-start.log"

START_PID=""

cleanup() {
  if [[ -n "$START_PID" ]] && kill -0 "$START_PID" >/dev/null 2>&1; then
    kill "$START_PID" >/dev/null 2>&1 || true
    wait "$START_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

http_check() {
  local url="$1"
  local body_file
  local code
  body_file="$(mktemp)"

  code="$(curl -sS -o "$body_file" -w "%{http_code}" "$url" || true)"
  if [[ ! "$code" =~ ^[0-9]{3}$ ]]; then
    echo "[health-check] 请求失败: $url"
    rm -f "$body_file"
    return 1
  fi

  if [[ "$code" == "404" || "$code" =~ ^5 ]]; then
    echo "[health-check] 失败: $url 返回状态 $code"
    echo "[health-check] 响应摘要:"
    head -n 20 "$body_file"
    rm -f "$body_file"
    return 1
  fi

  echo "[health-check] 通过: $url -> $code"
  rm -f "$body_file"
}

echo "[health-check] App root: $APP_ROOT"
cd "$APP_ROOT"

if [[ ! -d "$APP_ROOT/node_modules" ]]; then
  echo "[health-check] 依赖缺失，先执行 npm install"
  npm install
fi

echo "[health-check] 1/4 构建检查"
npm run build

echo "[health-check] 2/4 启动生产服务 (port $PORT)"
PORT="$PORT" npm run start >"$SERVER_LOG" 2>&1 &
START_PID="$!"

echo "[health-check] 3/4 等待服务就绪"
for _ in $(seq 1 45); do
  if curl -sS -o /dev/null "http://127.0.0.1:$PORT/healthz"; then
    break
  fi

  if ! kill -0 "$START_PID" >/dev/null 2>&1; then
    echo "[health-check] 服务启动失败，日志如下:"
    cat "$SERVER_LOG"
    exit 1
  fi

  sleep 1
done

if ! curl -sS -o /dev/null "http://127.0.0.1:$PORT/healthz"; then
  echo "[health-check] 服务超时未就绪，日志如下:"
  cat "$SERVER_LOG"
  exit 1
fi

echo "[health-check] 4/4 无状态健康探针"
http_check "http://127.0.0.1:$PORT/healthz"
http_check "http://127.0.0.1:$PORT/readyz"

echo "[health-check] 完成: liveness 与 readiness 可用"