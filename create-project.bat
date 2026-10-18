@echo off
setlocal enabledelayedexpansion
title CoolieBase All Base - Create New Project

cd /d "%~dp0"

echo ================================================================
echo       CoolieBase All Base - One-Click Project Generator
echo ================================================================
echo.

REM 1. 检查 Node.js 环境
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js v20+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 2. 获取目标路径参数
set "TARGET_DIR=%~1"

if "%TARGET_DIR%"=="" (
    echo [Step 1] 请输入新项目的目标完整路径:
    echo   例如: D:\workspace\cw\my-new-app
    echo   例如: ..\my-new-app
    echo.
    set /p "TARGET_DIR=目标路径: "
)

if "%TARGET_DIR%"=="" (
    echo [ERROR] 目标路径不能为空！
    pause
    exit /b 1
)

echo.
echo [Step 2] 正在基于当前底座克隆并初始化新项目...
echo ----------------------------------------------------------------
node scripts/clone-project-base.cjs "%TARGET_DIR%" %2 %3 %4 %5 %6 %7 %8 %9
if %errorlevel% neq 0 (
    echo [ERROR] 项目初始化失败，请检查路径权限。
    pause
    exit /b 1
)

echo.
echo ================================================================
echo       🎉 新项目已全自动创建就绪，全量 SQL 数据已默认初始化！
echo ================================================================
echo.
echo 是否立即进入新项目目录安装依赖 (npm install)？
echo   [1] 是 - 立即自动安装依赖 [推荐]
echo   [2] 否 - 稍后手动安装
echo.
set /p "AUTO_INSTALL=请输入选项 [默认 1]: "
if "!AUTO_INSTALL!"=="" set "AUTO_INSTALL=1"

if "!AUTO_INSTALL!"=="1" (
    echo.
    echo 正在安装依赖包...
    cd /d "%TARGET_DIR%"
    call npm install
    echo.
    echo ================================================================
    echo 全部就绪！数据库已自动初始化，直接双击 start.bat 即可启动：
    echo   cd /d "%TARGET_DIR%"
    echo   start.bat
    echo ================================================================
) else (
    echo.
    echo 您可以随时进入目录启动开发（数据库已为您默认初始化完成）：
    echo   1. cd /d "%TARGET_DIR%"
    echo   2. start.bat
)

echo.
pause

