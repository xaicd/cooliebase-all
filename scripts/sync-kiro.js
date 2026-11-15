const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AI Steering & Skills 沉淀导出与同步工具
 * 
 * 用法:
 * 1. 导出沉淀: node scripts/sync-kiro.js export (把当前项目的 .kiro/ 导出到 ai-skills-hub/ 模板包)
 * 2. 远程同步: node scripts/sync-kiro.js sync <repo_url> (从远程 Git 沉淀库同步最新的 steering & skills)
 */

const PROJECT_ROOT = path.resolve(__dirname, '..');
const KIRO_DIR = path.join(PROJECT_ROOT, '.kiro');
const HUB_DIR = path.join(PROJECT_ROOT, 'ai-skills-hub');
const TEMP_DIR = path.join(PROJECT_ROOT, '.temp-ai-skills');

const action = process.argv[2] || 'export';
const repoUrl = process.argv[3] || 'git@github.com:xaicd/ai-skills-hub.git';

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function runExport() {
  console.log('📦 正在从当前项目导出通用 AI Steering & Skills 至 ai-skills-hub/ ...');

  if (!fs.existsSync(KIRO_DIR)) {
    console.error('❌ 未找到 .kiro/ 目录');
    process.exit(1);
  }

  // 确保 ai-skills-hub 结构
  ['steering', 'skills'].forEach(folder => {
    const src = path.join(KIRO_DIR, folder);
    const dest = path.join(HUB_DIR, folder);
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
      copyDirRecursive(src, dest);
      console.log(`  ✅ 已导出 .kiro/${folder} -> ai-skills-hub/${folder}`);
    }
  });

  console.log('\n✨ 导出完成！ai-skills-hub/ 文件夹已创建/更新。');
  console.log('💡 你可以直接将 ai-skills-hub 目录提交为一个独立的 Git 仓库供其他项目使用。');
}

async function runSync(url) {
  if (!url) {
    console.error('❌ 请提供远程 Git 仓库 URL！使用方式: pnpm run kiro:sync <git_url>');
    process.exit(1);
  }

  console.log(`🔄 正在从 ${url} 同步 AI Steering & Skills...`);

  try {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    execSync(`git clone --depth 1 "${url}" "${TEMP_DIR}"`, { stdio: 'inherit' });

    ['steering', 'skills'].forEach(folder => {
      const src = path.join(TEMP_DIR, folder);
      const dest = path.join(KIRO_DIR, folder);
      if (fs.existsSync(src)) {
        copyDirRecursive(src, dest);
        console.log(`  ✅ 已同步 .kiro/${folder}`);
      }
    });

    console.log('\n✨ [AI-Skills] 同步完成！当前项目已更新至最新 AI 开发规范。');
  } catch (err) {
    console.error('❌ 同步失败:', err.message);
  } finally {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

if (action === 'export') {
  runExport();
} else if (action === 'sync') {
  runSync(repoUrl);
} else {
  console.log('未知的指令。支持的参数: export | sync <git_url>');
}
