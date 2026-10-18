#!/usr/bin/env bash
# ==============================================================================
# cooliebase-all 一键骨架派生孵化器 (Zero-Git-History Hatch CLI)
#
# 功能：
# 1. 免下载全量 Git 历史 (Zero Git History): 通过 degit / shallow clone / tarball
#    极速拉取干净代码骨架，规避 500MB+ 冗余历史包与 Token/算力浪费；
# 2. 结合 ProjectReactor 引擎: 自动执行项目名、中文标题、端口、数据库名替换与
#    按需裁剪 (base / minimal / standard / vertical)；
# 3. 自动化地基准备: 自动执行 git init 独立首提交与 SQLite 零配置本地库准备；
# 4. 支持远程管道执行:
#    curl -fsSL https://raw.githubusercontent.com/xaicd/cooliebase-all/main/scripts/hatch.sh | bash -s -- my-app --profile base
# ==============================================================================

set -eo pipefail

BANNER="
   ___                   _   _ _   _          _   
  | _ \_  _ ___ _  _ (_) / /_\ | | |  | \| | _____ _| |_ 
  |   / || / _ \ || | | | / _ \| | |  | .\` |/ -_) \ /  _|
  |_|_\\\\_,_\\___/\\_,_| |_|/_/ \_\_|_|  |_|\_|\___/_\_\\\\__|
    Zero-Git-History Project Hatch Engine (Next.js 16 + React 19)
"

function show_help() {
  echo "$BANNER"
  echo "用法:"
  echo "  curl -fsSL https://raw.githubusercontent.com/xaicd/cooliebase-all/main/scripts/hatch.sh | bash -s -- <目标工程名或路径> [选项]"
  echo "  或本地运行: bash scripts/hatch.sh <目标工程名或路径> [选项]"
  echo ""
  echo "参数:"
  echo "  <目标工程>         新项目目录名或绝对/相对路径 (如: my-crm-app)"
  echo ""
  echo "选项:"
  echo "  --profile <name>   骨架规模: base (默认, 仅核心地基), minimal (地基+低代码/AI), standard (全量17域), vertical (定制业务域)"
  echo "  --title <text>     项目中文系统全称 (如: \"星云进销存管理系统\")"
  echo "  --port <number>    开发服务端口 (默认: 3300，避免与基座 3200 冲突)"
  echo "  --db <dbname>      数据库名 (默认: <工程名>_db)"
  echo "  --bundle <domains> vertical 模式下的保留业务域列表 (逗号分隔，如: mall,crm)"
  echo "  --install          派生完成后自动执行 pnpm install (默认: 提示手动执行)"
  echo "  --no-git           跳过自动创建新 git 仓库与首提交"
  echo "  -h, --help         显示帮助信息"
  echo ""
  echo "Profile 规格一览:"
  echo "  base      [推荐] 平台底座 (shared + system + infra) - 极轻(~50MB), 秒级编译, 纯白板"
  echo "  minimal   底座 + 伴生域 (online/ai/aigw) - 支持在线开发与大模型网关"
  echo "  standard  全量 17 域与客户端 (DigitalStaff NPC 全能力模板)"
  echo "  vertical  底座 + --bundle 指定的业务域 (如: --bundle mall,crm)"
  echo ""
  exit 0
}

# ----------------- 参数解析 -----------------
TARGET=""
PROFILE="base"
TITLE=""
PORT="3300"
DB_NAME=""
BUNDLE=""
AUTO_INSTALL=false
INIT_GIT=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --profile=*)
      PROFILE="${1#*=}"
      shift 1
      ;;
    --title)
      TITLE="$2"
      shift 2
      ;;
    --title=*)
      TITLE="${1#*=}"
      shift 1
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift 1
      ;;
    --db)
      DB_NAME="$2"
      shift 2
      ;;
    --db=*)
      DB_NAME="${1#*=}"
      shift 1
      ;;
    --bundle)
      BUNDLE="$2"
      shift 2
      ;;
    --bundle=*)
      BUNDLE="${1#*=}"
      shift 1
      ;;
    --install)
      AUTO_INSTALL=true
      shift 1
      ;;
    --no-git)
      INIT_GIT=false
      shift 1
      ;;
    -*)
      echo "❌ 未知参数: $1"
      show_help
      ;;
    *)
      if [[ -z "$TARGET" ]]; then
        TARGET="$1"
        shift 1
      else
        echo "❌ 多余位置参数: $1"
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "$BANNER"
  echo "❌ 缺少目标工程路径！"
  echo "示例: curl -fsSL https://raw.githubusercontent.com/xaicd/cooliebase-all/main/scripts/hatch.sh | bash -s -- my-app --profile base"
  echo "使用 --help 查看完整选项。"
  exit 1
fi

# 检查 Node 环境
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 错误: 未检测到 Node.js 环境，需要 Node.js >= 20.19.0"
  exit 1
fi

NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "⚠️ 警告: 当前 Node 版本 $(node -v) 低于推荐的 Node 20+"
fi

# 计算目标绝对路径
TARGET_DIR=$(node -e "const path = require('path'); console.log(path.resolve(process.cwd(), process.argv[1]))" "$TARGET")
PROJECT_NAME=$(basename "$TARGET_DIR")

if [[ -z "$TITLE" ]]; then
  TITLE="$PROJECT_NAME"
fi

if [[ -z "$DB_NAME" ]]; then
  DB_NAME="${PROJECT_NAME//-/_}_db"
fi

# 检查目标目录是否已有文件
if [[ -d "$TARGET_DIR" && "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
  echo "❌ 目标目录已存在且非空: $TARGET_DIR"
  echo "请指定一个不存在或为空的目录以防止误伤已有工程。"
  exit 1
fi

echo "$BANNER"
echo "🚀 开始一键骨架派生 (Zero Git History Hatching)..."
echo "   目标路径: $TARGET_DIR"
echo "   工程名称: $PROJECT_NAME"
echo "   系统标题: $TITLE"
echo "   预选规格: $PROFILE"
echo "   服务端口: $PORT"
echo "   数据库名: $DB_NAME"
if [[ -n "$BUNDLE" ]]; then
  echo "   专属域集: $BUNDLE"
fi
echo ""

# ----------------- 极速拉取纯净源码快照 (免 Git 历史) -----------------
TMP_BASE=$(mktemp -d -t cooliebase-hatch-XXXXXX)
trap 'rm -rf "$TMP_BASE"' EXIT

DOWNLOAD_SUCCESS=false

# 策略 1: 检查本地当前目录是否正是 cooliebase-all 基座
CURRENT_DIR=$(pwd)
if [[ -f "$CURRENT_DIR/scripts/clone-project-base.cjs" && -f "$CURRENT_DIR/package.json" ]]; then
  CURRENT_PKG_NAME=$(node -e "try { console.log(require('./package.json').name) } catch(e){}" 2>/dev/null || echo "")
  if [[ "$CURRENT_PKG_NAME" == "cooliebase-all" ]]; then
    echo "💡 检测到当前处于基座仓库中，直接执行就地克隆派生..."
    SOURCE_DIR="$CURRENT_DIR"
    DOWNLOAD_SUCCESS=true
  fi
fi

# 策略 2: npx degit (极速解包最新 commit，支持 Gitee / GitHub 双源自动测速)
if [[ "$DOWNLOAD_SUCCESS" = false ]]; then
  if command -v npx >/dev/null 2>&1; then
    echo "📦 [1/3] 正在使用 degit 极速拉取最新 commit 源码树 (0MB Git 历史)..."
    if npx --yes degit gitee:xaicd/cooliebase-all#main "$TMP_BASE/repo" --force >/dev/null 2>&1; then
      SOURCE_DIR="$TMP_BASE/repo"
      DOWNLOAD_SUCCESS=true
      echo "✅ Gitee degit 获取成功！"
    elif npx --yes degit xaicd/cooliebase-all#main "$TMP_BASE/repo" --force >/dev/null 2>&1; then
      SOURCE_DIR="$TMP_BASE/repo"
      DOWNLOAD_SUCCESS=true
      echo "✅ GitHub degit 获取成功！"
    fi
  fi
fi

# 策略 3: git clone --depth 1 (浅克隆，仅拉取顶层 commit，无长历史)
if [[ "$DOWNLOAD_SUCCESS" = false ]]; then
  if command -v git >/dev/null 2>&1; then
    echo "📦 [2/3] degit 不可用，切换浅层 Shallow Clone (--depth 1)..."
    if git clone --depth 1 -q https://gitee.com/xaicd/cooliebase-all.git "$TMP_BASE/repo" 2>/dev/null; then
      SOURCE_DIR="$TMP_BASE/repo"
      rm -rf "$SOURCE_DIR/.git"
      DOWNLOAD_SUCCESS=true
      echo "✅ Gitee Shallow Clone 获取成功！"
    elif git clone --depth 1 -q https://github.com/xaicd/cooliebase-all.git "$TMP_BASE/repo" 2>/dev/null; then
      SOURCE_DIR="$TMP_BASE/repo"
      rm -rf "$SOURCE_DIR/.git"
      DOWNLOAD_SUCCESS=true
      echo "✅ GitHub Shallow Clone 获取成功！"
    fi
  fi
fi

# 策略 4: GitHub Release/Archive Tarball 兜底
if [[ "$DOWNLOAD_SUCCESS" = false ]]; then
  echo "📦 [3/3] 切换 GitHub Tarball 压缩包直接流式解包..."
  mkdir -p "$TMP_BASE/repo"
  if curl -fsSL https://github.com/xaicd/cooliebase-all/archive/refs/heads/main.tar.gz | tar -xz -C "$TMP_BASE/repo" --strip-components=1; then
    SOURCE_DIR="$TMP_BASE/repo"
    DOWNLOAD_SUCCESS=true
    echo "✅ Tarball 获取成功！"
  fi
fi

if [[ "$DOWNLOAD_SUCCESS" = false ]]; then
  echo "❌ 无法从网络获取源码骨架，请检查网络连接。"
  exit 1
fi

# ----------------- 运行 ProjectReactor 反应堆克隆引擎 -----------------
echo ""
echo "⚡ 正在驱动 ProjectReactor 展开派生工程..."

REACTOR_ARGS=("$TARGET_DIR" "--profile" "$PROFILE")
if [[ -n "$BUNDLE" ]]; then
  REACTOR_ARGS+=("--bundle" "$BUNDLE")
fi

node "$SOURCE_DIR/scripts/clone-project-base.cjs" "${REACTOR_ARGS[@]}"

# 替换标题与端口等定制参数
if [[ -f "$TARGET_DIR/.env" ]]; then
  node -e "
    const fs = require('fs');
    const envFile = process.argv[1];
    let content = fs.readFileSync(envFile, 'utf8');
    content = content.replace(/PORT=\d+/g, 'PORT=' + process.argv[2]);
    content = content.replace(/NEXT_PUBLIC_APP_TITLE=.*$/m, 'NEXT_PUBLIC_APP_TITLE=' + process.argv[3]);
    fs.writeFileSync(envFile, content, 'utf8');
  " "$TARGET_DIR/.env" "$PORT" "$TITLE"
fi

# 检查/补充独立 Git 仓库
if [[ "$INIT_GIT" = true && ! -d "$TARGET_DIR/.git" ]]; then
  echo "📦 初始化客户专属 Git 仓库并创建首个基线快照..."
  (
    cd "$TARGET_DIR"
    git init -q
    git config user.email "bot@local" 2>/dev/null || true
    git config user.name "HatchBot" 2>/dev/null || true
    git add -A
    git commit -q -m "feat: 派生自 cooliebase-all 企业级底座 (profile: $PROFILE)"
  )
fi

echo ""
echo "================================================================"
echo "🎉 恭喜！新业务项目派生成功 (Zero-Git-History Hatch Completed)"
echo "================================================================"
echo "  工程路径: $TARGET_DIR"
echo "  工程名:   $PROJECT_NAME"
echo "  规格:     $PROFILE"
echo "  服务端口: $PORT"
echo ""
echo "  👉 极速运行指南:"
echo "     1. cd $TARGET_DIR"
echo "     2. pnpm install"
echo "     3. npm run db:bootstrap:sqlite   # 零配置启动本地 SQLite 数据库"
echo "     4. npm run dev                   # 启动开发服务器 (http://localhost:$PORT)"
echo ""
echo "  👉 平台超级管理员账号: supervip (随机安全密码详见 .env.local 或终端初始化日志)"
echo "================================================================"
