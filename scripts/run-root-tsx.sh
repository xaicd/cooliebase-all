#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法: bash ./scripts/run-root-tsx.sh <script-path> [args...]"
  echo "示例: bash ./scripts/run-root-tsx.sh scripts/check-cooliebase-capability-matrix.ts --strict"
  exit 2
fi

SCRIPT_RELATIVE_PATH="$1"
shift || true

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd -- "$APP_ROOT/../.." && pwd)"

cd "$REPO_ROOT"

if [[ $# -gt 0 ]]; then
  ./node_modules/.bin/tsx "$SCRIPT_RELATIVE_PATH" "$@"
else
  ./node_modules/.bin/tsx "$SCRIPT_RELATIVE_PATH"
fi
