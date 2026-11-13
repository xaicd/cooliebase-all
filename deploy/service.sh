#!/usr/bin/env bash
# ==============================================================================
# deploy/service.sh —— 标准 8 动词部署侧同源入口
# 同源委托至 ../scripts/service.sh，保证 install|build|start|stop|restart|status|health|logs 零漂移
# ==============================================================================
set -eo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${DEPLOY_DIR}/../scripts/service.sh" "$@"
