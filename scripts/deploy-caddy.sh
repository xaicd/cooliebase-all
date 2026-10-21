#!/usr/bin/env bash
# deploy-caddy.sh —— 把本项目的网关片段部署到本机 Caddy，并**实测路由真的通**。
#
# 为什么要有"部署后实测"：`caddy validate` 只验**语法**，验不了**路由**。
# 实测（2026-10-21，本地 caddy v2.11.7 + 真实应用）：
#   片段里 `/cooliebase-all-api/*` 少了 `strip_prefix`，语法**完全合法**、热重载**成功**，
#   但真实请求全部 **404** —— 因为本仓接口根是 `/api/v1/**`，不是 `/<slug>-api/**`。
# 即：**"校验通过 + reload 成功" 不等于 "网关真的能把请求送到应用"**。
# 所以本脚本在 reload 之后**真发一次请求**，不通就**回滚**。
#
# 用法:
#   bash scripts/deploy-caddy.sh                 # 部署（需要 /etc/caddy/services.d）
#   PROBE_BASE=http://127.0.0.1:8080 bash scripts/deploy-caddy.sh   # 指定探测地址
#   SKIP_ROUTE_PROBE=1 bash scripts/deploy-caddy.sh                 # 跳过实测（不推荐）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SNIPPET_SRC=$(ls "$PROJECT_ROOT/deploy/caddy/"*.caddy 2>/dev/null | head -n 1 || true)
SERVICES_DIR="${SERVICES_DIR:-/etc/caddy/services.d}"   # 可覆盖：便于在临时目录里演练部署与回滚
PROBE_BASE="${PROBE_BASE:-http://127.0.0.1}"
CADDY_CONFIG="${CADDY_CONFIG:-/etc/caddy/Caddyfile}"   # 可覆盖：便于在本机演练

if [ -z "$SNIPPET_SRC" ] || [ ! -f "$SNIPPET_SRC" ]; then
  echo "❌ Caddy 规则片段不存在 (deploy/caddy/*.caddy)"
  exit 1
fi

SLUG_NAME="$(basename "$SNIPPET_SRC" .caddy)"
DEPLOYED="${SERVICES_DIR}/${SLUG_NAME}.caddy"
BACKUP="${DEPLOYED}.bak.$$"
HAD_PREVIOUS=0

echo "🌐 [deploy-caddy] 部署项目网关配置: ${SLUG_NAME}..."
SUDO=""
if [ "$EUID" -ne 0 ]; then SUDO="sudo"; fi
# 演练/测试可显式置空（真实部署不要动它）
if [ "${CADDY_NO_SUDO:-0}" = "1" ]; then SUDO=""; fi

reload_caddy() {
  $SUDO systemctl reload caddy >/dev/null 2>&1 || $SUDO caddy reload --config "$CADDY_CONFIG" >/dev/null 2>&1
}

# 从片段里抽出所有 `handle /<prefix>/*` 的前缀 —— 这些是**对外暴露的入口**，
# 部署后逐个探测，确认它们真的能落到应用上。
route_prefixes() {
  # 抓整段路径（**不能**用 `[^/]+` —— 那会在第一个 `/` 停住，实测漏掉
  # `/services/cooliebase-all` 这种多段前缀），再剥掉结尾的 `/*`。
  # 同时认 `handle` 与 `handle_path`（后者是 Caddy 的 strip 变体）。
  sed -nE 's#^[[:space:]]*handle(_path)?[[:space:]]+(/[^[:space:]{}]+)[[:space:]]*\{.*#\2#p' "$1" \
    | sed -E 's#/\*$##' \
    | sort -u
}

# 探测：拼 `<prefix>/healthz` 走一遍网关。
#   · strip 正确 → 上游 /healthz → 200 ✅
#   · strip 缺失 → 上游 <prefix>/healthz → **404** ❌（实测正是这样暴露的）
# 200/3xx 视为通；401/403 也算通（路由存在、被鉴权拦住）；404/000/5xx 视为不通。
probe_routes() {
  local snippet="$1" failed=0
  local prefixes
  prefixes="$(route_prefixes "$snippet")"
  if [ -z "$prefixes" ]; then
    echo "  ⚠ 片段里没找到 handle /<prefix>/* 入口，跳过路由实测"
    return 0
  fi
  while IFS= read -r prefix; do
    [ -z "$prefix" ] && continue
    local url="${PROBE_BASE}${prefix}/healthz"
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$url" 2>/dev/null || echo 000)"
    case "$code" in
      2*|3*|401|403) echo "  ✓ ${prefix} → HTTP ${code}（路由可达）" ;;
      *) echo "  ✗ ${prefix} → HTTP ${code}（**路由不通**：语法合法并不代表能送到应用）"; failed=1 ;;
    esac
  done <<< "$prefixes"
  return "$failed"
}

if [ -d "$SERVICES_DIR" ] && command -v caddy >/dev/null 2>&1; then
  # 先备份旧片段：回滚要有东西可回。
  if [ -f "$DEPLOYED" ]; then
    $SUDO cp -f "$DEPLOYED" "$BACKUP"
    HAD_PREVIOUS=1
  fi

  $SUDO cp -f "$SNIPPET_SRC" "$DEPLOYED"
  if ! $SUDO caddy validate --config "$CADDY_CONFIG" >/dev/null 2>&1; then
    echo "  ❌ Caddy 语法校验失败 —— 恢复原配置"
    if [ "$HAD_PREVIOUS" = "1" ]; then $SUDO mv -f "$BACKUP" "$DEPLOYED"; else $SUDO rm -f "$DEPLOYED"; fi
    exit 1
  fi

  reload_caddy
  echo "  ✅ 语法校验通过、已热重载: ${DEPLOYED}"

  if [ "${SKIP_ROUTE_PROBE:-0}" = "1" ]; then
    echo "  ⚠ 已按 SKIP_ROUTE_PROBE=1 跳过路由实测（**语法通过不等于路由通**，请自行确认）"
  elif ! probe_routes "$SNIPPET_SRC"; then
    echo "  ❌ 路由实测未通过 —— **回滚**到部署前的配置"
    if [ "$HAD_PREVIOUS" = "1" ]; then
      $SUDO mv -f "$BACKUP" "$DEPLOYED"
    else
      $SUDO rm -f "$DEPLOYED"
    fi
    reload_caddy
    echo "  ↩ 已回滚并重载：${DEPLOYED}"
    exit 1
  else
    echo "  ✅ 路由实测通过：入口都能落到应用"
  fi

  # 成功路径：清掉备份
  if [ "$HAD_PREVIOUS" = "1" ]; then $SUDO rm -f "$BACKUP"; fi
else
  echo "  ℹ️ 当前宿主环境未就地激活 Caddy 网关目录 (${SERVICES_DIR})"
  echo "  👉 生产网关规则已就绪: ${SNIPPET_SRC}"
  echo "  👉 部署到生产宿主机后，**务必**按本脚本同样的方式做一次路由实测："
  echo "     # 对片段里每个 handle /<prefix>/* 都探测一次"
  echo "     curl -s -o /dev/null -w '%{http_code}' http://<host><prefix>/healthz"
  echo "     # 200/3xx/401/403 = 路由可达；**404 = 前缀没 strip，网关把请求送丢了**"
  echo "  👉 或直接在本机 Caddy 上跑本脚本，它会自动做这件事并在失败时回滚"
fi
