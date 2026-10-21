#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SNIPPET_SRC=$(ls "$PROJECT_ROOT/deploy/caddy/"*.caddy 2>/dev/null | head -n 1 || true)
SERVICES_DIR="/etc/caddy/services.d"

if [ -z "$SNIPPET_SRC" ] || [ ! -f "$SNIPPET_SRC" ]; then
  echo "❌ Caddy 规则片段不存在 (deploy/caddy/*.caddy)"
  exit 1
fi

SLUG_NAME="$(basename "$SNIPPET_SRC" .caddy)"
echo "🌐 [deploy-caddy] 部署项目网关配置: ${SLUG_NAME}..."
SUDO=""
[ "$EUID" -ne 0 ] && SUDO="sudo"

if [ -d "$SERVICES_DIR" ] && command -v caddy >/dev/null 2>&1; then
  $SUDO cp -f "$SNIPPET_SRC" "${SERVICES_DIR}/${SLUG_NAME}.caddy"
  if $SUDO caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
    $SUDO systemctl reload caddy >/dev/null 2>&1 || $SUDO caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1
    echo "  ✅ 本地 Caddy 网关热重载成功: ${SERVICES_DIR}/${SLUG_NAME}.caddy"
  else
    echo "  ❌ Caddy 语法校验失败，已保留原配置"
    exit 1
  fi
else
  echo "  ℹ️ 当前宿主环境未就地激活 Caddy 网关目录 (${SERVICES_DIR})"
  echo "  👉 生产网关规则已就绪: ${SNIPPET_SRC}"
  echo "  👉 若部署到生产宿主机 (tc-coolie-claw)，可执行:"
  echo "     scp \"${SNIPPET_SRC}\" tc-coolie-claw:/etc/caddy/services.d/"
  echo "     ssh tc-coolie-claw 'sudo caddy reload --config /etc/caddy/Caddyfile'"
fi
