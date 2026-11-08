#!/usr/bin/env node
/**
 * scripts/project-reactor.mjs
 *
 * Coolie 商业软件交付工厂项目全自动白标置换引擎 (Project Reactor)
 *
 * 核心职责:
 * 1. 深度白标化 (White-Labeling & Brand Neutrality)：
 *    彻底清洗开源底座 (yudao-quad-terminal, cooliebase-all) 中残留的厂商商业品牌与人名关键字；
 * 2. 跨语言代码空间物理重构：
 *    - Java 微服务: cn.iocoder.yudao ➜ com.<project>.server，物理搬迁源码目录并同步重命名启动类；
 *    - 前端 Vue3 / Uni-App / Expo: 环境变量 (VITE_APP_TITLE)、HTML title、Logo、manifest、多语言词条 100% 替换；
 *    - cooliebase-all: 清除历史遗留 ruoyiPrisma / ruoyi 变量，对齐标准命名空间；
 * 3. 幂等与零破坏性：
 *    多次运行不产生二次破坏，二进制与字体文件绝对保护，置换后 Monorepo 编译闭环 100% 保全。
 *
 * 用法:
 *   node scripts/project-reactor.mjs <targetDir> --project <name> --title <title> [--package-prefix <prefix>] [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 本引擎所属的 Coolie 平台仓库根目录（白标 MUST NOT 作用于它自身）。 */
const REACTOR_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseCliArgs() {
  const args = process.argv.slice(2);
  let targetDir = '';
  let projectName = '';
  let projectTitle = '';
  let titleFile = '';
  let packagePrefix = '';
  let dryRun = false;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--project') {
      projectName = args[++i];
    } else if (arg === '--title') {
      projectTitle = args[++i];
    } else if (arg === '--title-file') {
      // 从文件读标题：**掌柜输入的项目名不可信**（含引号/换行/`$()` 等），
      // 拼进 shell 命令即注入面。走文件参数 = 参数与数据分离。
      titleFile = args[++i];
    } else if (arg === '--package-prefix') {
      packagePrefix = args[++i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--quiet') {
      quiet = true;
    } else if (!arg.startsWith('-') && !targetDir) {
      targetDir = arg;
    }
  }

  if (!targetDir) {
    console.error('❌ 必须显式指定 <targetDir>：白标置换引擎不再回退到 cwd。');
    console.error('   历史事故：无参运行会把当前目录（可能是 Coolie 平台仓库自身）当作待白标项目改写，');
    console.error('   污染 .agents/skills/*.md 等平台源码并连带打挂技能评测证据门禁。');
    process.exit(2);
  }

  const resolvedTargetDir = path.resolve(targetDir);
  if (
    resolvedTargetDir === REACTOR_REPO_ROOT ||
    REACTOR_REPO_ROOT.startsWith(resolvedTargetDir + path.sep)
  ) {
    console.error(`❌ 拒绝在 Coolie 平台仓库内运行白标置换: ${resolvedTargetDir}`);
    console.error('   白标只能作用于派生的客户项目目录，平台自身源码 MUST NOT 被改写。');
    process.exit(2);
  }

  if (!projectName) {
    const resolvedPath = path.resolve(targetDir);
    let base = path.basename(resolvedPath).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    // 防御 _default 穿透：Paperclip 工作区模式下末级目录通常为 _default
    if (base === '_default' || base === 'default' || !base) {
      const parentDir = path.dirname(resolvedPath);
      const parentBase = path.basename(parentDir).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (parentBase && parentBase !== 'projects' && parentBase !== 'instances' && parentBase !== 'workspace') {
        base = parentBase;
      } else {
        base = 'app';
      }
    }
    projectName = base;
  }

  // --title-file 优先于 --title：项目真名可能含中文/引号/换行，走文件读最稳
  if (titleFile) {
    try {
      const raw = fs.readFileSync(path.resolve(titleFile), 'utf8').trim();
      if (raw) projectTitle = raw;
    } catch (err) {
      console.error(`❌ --title-file 读取失败: ${titleFile} (${err.message})`);
      process.exit(2);
    }
  }

  if (!projectTitle) {
    projectTitle = projectName.toUpperCase();
  }

  if (!packagePrefix) {
    let safeName = projectName.replace(/[^a-zA-Z0-9_]/g, '_');
    if (safeName === '_default' || safeName === 'default') {
      safeName = 'app';
    }
    packagePrefix = `com.${/^[0-9]/.test(safeName) ? 'p_' + safeName : safeName}`;
  }

  return {
    targetDir: path.resolve(targetDir),
    projectName,
    projectTitle,
    packagePrefix,
    dryRun,
    quiet,
  };
}

function printHelp() {
  console.log(`
🚀 Coolie Project Reactor - 全自动项目白标置换引擎

用法:
  node scripts/project-reactor.mjs <targetDir> [选项]

选项:
  --project <name>           项目英文代号 (如: helloworld7)
  --title <title>            项目中文/商业全称 (如: "HelloWorld 演示系统")
  --package-prefix <prefix>  Java 顶级包名前缀 (默认: com.<projectName>)
  --dry-run                  预演模式，仅扫描统计不修改物理文件
  --quiet                    静默模式
  -h, --help                 显示帮助信息
`);
}

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.dump', '.xdb', '.jar', '.class',
  '.bmp', '.mp3', '.mp4', '.avi', '.mov', '.wasm'
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'target', 'dist', 'build', '.next',
  '.claude', '.commandcode', '.idea', '.vscode'
]);

export async function runProjectReactor(options) {
  const startTime = Date.now();
  const { targetDir, projectName, projectTitle, packagePrefix, dryRun, quiet } = options;

  if (!fs.existsSync(targetDir)) {
    throw new Error(`目标目录不存在: ${targetDir}`);
  }

  let cleanName = (projectName || 'app').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleanName === '_default' || cleanName === 'default' || !cleanName) {
    cleanName = 'app';
  }
  let cleanIdent = cleanName.replace(/[^a-z0-9_]/g, '_');
  const safeJavaIdent = /^[0-9]/.test(cleanIdent) ? `p_${cleanIdent}` : cleanIdent;
  let effectivePackagePrefix = packagePrefix;
  if (!effectivePackagePrefix || effectivePackagePrefix === 'com._default' || effectivePackagePrefix === 'com.default') {
    effectivePackagePrefix = `com.${safeJavaIdent}`;
  }

  // PascalCase for Java Class names (e.g. helloworld109 -> Helloworld109, my-app -> MyApp)
  const projectPascal = cleanIdent
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') || 'App';
  const projectUpper = cleanIdent.toUpperCase();

  if (!quiet) {
    console.log('========================================================================');
    console.log(`🚀 Coolie Project Reactor 启动白标置换引擎`);
    console.log(`   目标目录:   ${targetDir}`);
    console.log(`   项目标识:   ${cleanName} (${cleanIdent})`);
    console.log(`   商业全称:   ${projectTitle}`);
    console.log(`   Java 包名:  ${effectivePackagePrefix}`);
    console.log(`   Java 启动类: ${projectPascal}ServerApplication`);
    console.log(`   运行模式:   ${dryRun ? '⚠️  DRY-RUN (预演不写盘)' : '✍️  WRITE (原子写盘)'}`);
    console.log('========================================================================\n');
  }

  let filesScanned = 0;
  let filesModified = 0;
  let matchesCount = 0;
  const modifiedList = [];

  // 1. 规范化子包与模块目录 (若是多端大单体)
  // 项目实体按 `<slug>-server` 命名（掌柜口径：具体项目应叫 helloworld03-server，
  // 而不是通用的 `server`）。若 slug 本身已以 `-server` 结尾，直接沿用，避免
  // 生成 `helloworld03-server-server` 这类双后缀。
  const serverModuleName = cleanName.endsWith('-server') ? cleanName : `${cleanName}-server`;
  const gatewayModuleName = cleanName.endsWith('-gateway') ? cleanName : `${cleanName}-gateway`;
  const dirRenames = [
    { from: 'apps/yudao-admin-vue3', to: 'apps/admin' },
    { from: 'apps/admin-vue3', to: 'apps/admin' },
    { from: 'apps/yudao-mall-uniapp', to: 'apps/miniapp' },
    { from: 'apps/yudao-quad-app', to: 'apps/app' },
    { from: 'apps/backend/yudao-server', to: `apps/backend/${serverModuleName}` },
    { from: 'apps/backend/yudao-gateway', to: `apps/backend/${gatewayModuleName}` },
  ];

  for (const { from, to } of dirRenames) {
    const fromPath = path.join(targetDir, from);
    const toPath = path.join(targetDir, to);
    if (fs.existsSync(fromPath)) {
      if (!fs.existsSync(toPath)) {
        if (!dryRun) {
          fs.mkdirSync(path.dirname(toPath), { recursive: true });
          fs.renameSync(fromPath, toPath);
        }
      } else {
        // 若目标目录已存在 (例如预先存在 target 目录)，合并子条目并清理源目录
        if (!dryRun) {
          const entries = fs.readdirSync(fromPath);
          for (const entry of entries) {
            const src = path.join(fromPath, entry);
            const dst = path.join(toPath, entry);
            if (!fs.existsSync(dst)) {
              fs.renameSync(src, dst);
            }
          }
          try {
            fs.rmdirSync(fromPath);
          } catch (_err) { /* ignore error safely */ }
        }
      }
      if (!quiet) {
        console.log(`  📁 [DIR RENAME/MERGE] ${from} ➜ ${to}`);
      }
    }
  }

  // 2. 构建替换词典 (按长度优先匹配，防止短词污染长词)
  const textReplacements = [
    // 品牌中文
    [new RegExp('芋道四位一体企业级管理中台', 'g'), `${projectTitle} · 企业级管理中台`],
    [new RegExp('芋道四位一体管理系统', 'g'), `${projectTitle} · 业务管理系统`],
    [new RegExp('芋道四位一体业务工作台', 'g'), `${projectTitle} · 业务工作台`],
    [new RegExp('芋道四位一体云商中台', 'g'), `${projectTitle} · 业务中台`],
    [new RegExp('芋道四位一体', 'g'), `${projectTitle} · 多端中台`],
    [new RegExp('芋道管理后台', 'g'), `${projectTitle} · 管理后台`],
    [new RegExp('芋道管理系统', 'g'), `${projectTitle} · 管理系统`],
    [new RegExp('芋道管理中台', 'g'), `${projectTitle} · 管理中台`],
    [new RegExp('芋道商城', 'g'), `${projectTitle} · 业务端`],
    [new RegExp('芋道源码', 'g'), '商业技术底座'],
    [new RegExp('芋道', 'g'), projectTitle],

    // Java 包名与命名空间 (将 cn.iocoder.yudao 精准映射到 effectivePackagePrefix，不额外追加 .server)
    [new RegExp('cn\\.iocoder\\.cloud', 'g'), effectivePackagePrefix],
    [new RegExp('cn\\.iocoder\\.boot', 'g'), effectivePackagePrefix],
    [new RegExp('cn\\.iocoder\\.yudao', 'g'), effectivePackagePrefix],
    [new RegExp('cn/iocoder/yudao', 'g'), effectivePackagePrefix.replace(/\./g, '/')],

    // 模块与组件名
    [new RegExp('<module>yudao-server</module>', 'g'), `<module>${serverModuleName}</module>`],
    [new RegExp('<module>yudao-gateway</module>', 'g'), `<module>${gatewayModuleName}</module>`],
    [new RegExp('yudao-quad-terminal', 'g'), `${cleanName}-quad-terminal`],
    [new RegExp('yudao-ui-admin-vue3', 'g'), `@${cleanName}/admin`],
    [new RegExp('yudao-cloud-backend', 'g'), `@${cleanName}/backend`],
    [new RegExp('yudao-server', 'g'), `${cleanName}-server`],
    [new RegExp('yudao-monorepo', 'g'), `@${cleanName}`],
    [new RegExp('yudao-native-app', 'g'), `@${cleanName}/app`],
    [new RegExp('yudao-mall-uniapp', 'g'), `@${cleanName}/miniapp`],
    [new RegExp('yudao-dependencies', 'g'), `${cleanName}-dependencies`],
    [new RegExp('yudao-framework', 'g'), `${cleanName}-framework`],
    [new RegExp('yudao-gateway', 'g'), `${cleanName}-gateway`],
    [new RegExp('yudao-module-', 'g'), `${cleanName}-module-`],
    [new RegExp('yudao-', 'g'), `${cleanName}-`],
    [new RegExp('yudaocode', 'g'), cleanName],
    [new RegExp('/api/yudao/', 'g'), '/api/system/'],
    [new RegExp('yudao-mysql-dev', 'g'), `${cleanName}-mysql-dev`],
    [new RegExp('yudao-redis-dev', 'g'), `${cleanName}-redis-dev`],

    // 类名与启动类
    [new RegExp('\\bYudaoServerApplication\\b', 'g'), `${projectPascal}ServerApplication`],
    [new RegExp('\\bYudaoGatewayApplication\\b', 'g'), `${projectPascal}GatewayApplication`],

    // 外部链接与开源作者站点脱敏
    [new RegExp('https://gitee.com/zhijiantianya/ruoyi-vue-pro', 'g'), '#'],
    [new RegExp('https://github.com/YunaiV/ruoyi-vue-pro', 'g'), '#'],
    [new RegExp('https://gitee.com/zhijiantianya/yudao-cloud', 'g'), '#'],
    [new RegExp('https://github.com/YunaiV/yudao-cloud', 'g'), '#'],
    [new RegExp('https://doc.iocoder.cn', 'g'), '#'],
    [new RegExp('http://doc.iocoder.cn', 'g'), '#'],
    [new RegExp('yudao-cloud', 'g'), `${cleanName}-cloud`],

    // cooliebase-all 全栈清理 (消灭 ruoyiPrisma 等历史别名)
    [new RegExp('\\bruoyiPrisma\\b', 'g'), 'prisma'],
    [new RegExp('\\bRuoyiPrisma\\b', 'g'), 'Prisma'],
    [new RegExp('\\bruoyi-all\\b', 'g'), cleanName],
    [new RegExp('\\bnext-ruoyi\\b', 'g'), cleanName],

    // cooliebase-all **品牌词**（实测 2026-11-03 漏网：档案层已由结构化注入改写，
    // 但 public/agent-profile.json · public/compat-manifest.json · src/app/page.tsx
    // 仍顶着底座名 —— 客户打开首页就看见 cooliebase-all，白标等于没做）。
    // 词典此前**一条都没有** cooliebase 品牌词（只有 ruoyi 系），故整类漏网。
    // 组合词优先（词典按长度降序排序，长词先命中）：品牌 + 底座味后缀要整体换，
    // 否则会留下「图书管理系统 基座平台」这种半截话（实测 2026-11-03）。
    // 全族词条一律 gi（2026-11-08 T5 实测：孵化产物残留 99 文件全是**大写形态**
    // COOLIEBASE_RPC_TOKEN / COOLIEBASE_PLUGIN_DIR / COOLIEBASE-REL-* 等环境变量
    // 风格标识 —— 原词典只有小写与 TitleCase 两条，大写全漏；且 BSD grep 对这些
    // 文件静默跳过，机器断言必须用 node 读取侧扫描才是真值）。
    [new RegExp('CoolieBase All 基座平台', 'gi'), `${projectTitle} · 管理后台`],
    [new RegExp('CoolieBase All 基座', 'gi'), projectTitle],
    [new RegExp('CoolieBase All', 'gi'), projectTitle],
    [new RegExp('cooliebase-all', 'gi'), cleanName],
    [new RegExp('cooliebase-', 'gi'), `${cleanName}-`],
    // 裸词兜底（2026-11-08 实测漏网）：@cooliebase / com.cooliebase.app / cooliebase_next
    // 这类「.」「_」「@」连接的形态，带后缀词条（-all / -）命中不了，必须补裸词。
    // 词典按长度降序优先匹配，组合词仍先于裸词命中，不会产生半截替换。
    // 变体映射：全大写→项目大写标识（环境变量风格）、帕斯卡→项目类名风格、
    // TitleCase→商业全称、全小写→项目代号。
    [new RegExp('cooliebase', 'gi'), (m) => {
      if (m === 'COOLIEBASE') return projectUpper;
      if (m === 'Cooliebase') return projectPascal;
      if (m === 'CoolieBase') return projectTitle;
      return cleanName;
    }],
  ];

  const fallbackReplacements = [
    // 通用兜底词匹配 (必须放在全部具体词条之后，且保护 yudao.* 和 yudao:* 配置属性路径不受侵入)
    [new RegExp('\\byudao\\b(?!\\.|:|\\w)', 'gi'), (m) => {
      if (m === 'Yudao') return projectPascal;
      if (m === 'YUDAO') return projectUpper;
      return cleanIdent;
    }],
  ];

  // 3. 构建单遍优先替换引擎 (具体词条按长度降序优先匹配，通用词兜底，单遍执行杜绝递归二次替换)
  const sortedSpecific = [...textReplacements].sort((a, b) => {
    return b[0].source.length - a[0].source.length;
  });
  const allOrderedReplacements = [...sortedSpecific, ...fallbackReplacements];

  // 组合正则必须带 i：词条自身的 'gi' 标志在 source 拼进 alternation 后会失效
  // （2026-11-08 T5 实测：combined 'g' 导致 COOLIEBASE_* 大写变体整类漏网）。
  // 匹配面放宽是安全的：单遍分派循环按各词条自身 flags 重测路由，无 i 的词条
  // 依旧只接自己的精确大小写命中。
  const combinedRegex = new RegExp(
    allOrderedReplacements.map((pair) => `(?:${pair[0].source})`).join('|'),
    'gi'
  );

  function replaceSinglePass(content) {
    let replacedCount = 0;
    const newContent = content.replace(combinedRegex, (match) => {
      for (const [re, repl] of allOrderedReplacements) {
        const singleRe = new RegExp(`^${re.source}$`, re.flags.includes('i') ? 'i' : '');
        if (singleRe.test(match)) {
          replacedCount++;
          return typeof repl === 'function' ? repl(match) : repl;
        }
      }
      return match;
    });
    return { newContent, replacedCount };
  }

  // 递归遍历替换文本文件
  function scanAndReplace(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanAndReplace(fullPath);
      } else if (entry.isFile()) {
        if (
          entry.name === 'blueprint.template.json' ||
          entry.name === '.env.template' ||
          entry.name === 'blueprint-engine.cjs' ||
          entry.name.endsWith('.template.json')
        ) {
          continue;
        }
        const ext = path.extname(entry.name).toLowerCase();
        if (BINARY_EXTENSIONS.has(ext)) continue;

        filesScanned++;
        let content;
        try {
          content = fs.readFileSync(fullPath, 'utf8');
        } catch {
          continue; // 跳过非 UTF8 编码文件
        }

        const { newContent, replacedCount } = replaceSinglePass(content);

        if (replacedCount > 0 && newContent !== content) {
          filesModified++;
          matchesCount += replacedCount;
          modifiedList.push(path.relative(targetDir, fullPath));
          if (!dryRun) {
            fs.writeFileSync(fullPath, newContent, 'utf8');
          }
        }
      }
    }
  }

  // 3.5 结构化档案注入（cooliebase-all 底座）—— **白标的正路**
  //
  // 为什么必须单独一步（实测 2026-11-03）：
  //   底座的 project-profile.json 是**结构化字段**（platformName / loginHeadline /
  //   loginTagline / branding / tenants / defaultUsers），品牌与客户可见文案由它驱动。
  //   但白标词典只覆盖 yudao 系（芋道/ruoyi），cooliebase-all 的品牌词一条没有
  //   → 文本替换**碰不到**这些字段 → 每个孵化出来的交付物都顶着底座原名
  //   （实测：客户看到「CoolieBase All 基座平台」而不是自己的项目名）。
  //   而且文本替换天然造不出新字段（如新增的 loginTrustBadges）→ 档案缺键。
  //
  // 做法：直接按**字段**写档案，缺键补默认 —— 结构化数据用结构化方式改，
  //   不靠全仓正则碰运气（文本替换会漏、也会误伤）。
  const projectProfileRel = path.join('packages', 'shared', 'contract', 'project-profile.json');
  const projectProfilePath = path.join(targetDir, projectProfileRel);
  const blueprintEnginePath = path.join(targetDir, 'scripts', 'blueprint-engine.cjs');

  // 根据项目中文名自动推断行业场景预设与 C 端门户动作词包
  const inferIndustryAndPortal = (title) => {
    const t = String(title || '');
    const firstChar = (t.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '')[0] || 'C').toUpperCase();
    if (/医疗|医院|诊所|宠物|康养|体检/.test(t)) {
      return {
        industryPreset: 'smart-healthcare',
        brandMark: firstChar,
        subtitleEn: 'SMART HEALTHCARE PORTAL',
        heroBadge: 'SMART HEALTHCARE · 在线预约与健康门户',
        heroTitle: `${t} · 在线预约与健康服务中心`,
        heroDesc: '提供科室门诊预约、体检套餐选购、诊疗进度查询与健康档案在线服务。',
        searchPlaceholder: '搜索科室、体检套餐、医师或健康服务...',
        cartLabel: '预约单',
        primaryCta: '立即预约',
        previewCta: '服务详情',
        cEndLabel: '预约门户',
      };
    }
    if (/会议室|预订|预约|场馆|空间|工位/.test(t)) {
      return {
        industryPreset: 'general-enterprise',
        brandMark: firstChar,
        subtitleEn: 'ENTERPRISE RESERVATION PORTAL',
        heroBadge: 'SMART WORKSPACE · 实时资源调度与预订门户',
        heroTitle: `${t} · 空间资源与时段预订中心`,
        heroDesc: '实时查看空间容量、设备配置与空闲时段，支持在线锁定、冲突智能推荐与超时分级审批。',
        searchPlaceholder: '搜索空间名称、楼层、容纳人数或设备标签...',
        cartLabel: '预订清单',
        primaryCta: '立即预订',
        previewCta: '空间详情',
        cEndLabel: '预订门户',
      };
    }
    if (/商城|电商|零售|百货|美妆|百货|选品|专柜/.test(t)) {
      return {
        industryPreset: 'retail-commerce',
        brandMark: firstChar,
        subtitleEn: 'RETAIL COMMERCE PORTAL',
        heroBadge: 'OMNI-CHANNEL RETAIL · 品牌直营商城门户',
        heroTitle: `${t} · 官方线上商城与会员中心`,
        heroDesc: '官方正品直供、会员专享权益、积分抵扣结算与全链路订单履约追踪。',
        searchPlaceholder: '搜索商品名称、分类、品牌或规格...',
        cartLabel: '购物袋',
        primaryCta: '立即选购',
        previewCta: '商品详情',
        cEndLabel: '官方商城',
      };
    }
    if (/制造|工厂|车间|MES|WMS|ERP|供应链|仓储/.test(t)) {
      return {
        industryPreset: 'smart-manufacturing',
        brandMark: firstChar,
        subtitleEn: 'INDUSTRIAL COLLABORATION PORTAL',
        heroBadge: 'SMART MANUFACTURING · 供应链与生产协同门户',
        heroTitle: `${t} · 供应链协同与数字工单门户`,
        heroDesc: '连接采购寻源、生产排程、仓储出入库与质量追溯，全流程数据实时可视。',
        searchPlaceholder: '搜索物料编码、工单批次、供应商或单据...',
        cartLabel: '申领清单',
        primaryCta: '发起申领',
        previewCta: '规格明细',
        cEndLabel: '协同门户',
      };
    }
    if (/图书|书城|书店|出版|阅读|文库/.test(t)) {
      return {
        industryPreset: 'digital-publishing',
        brandMark: firstChar,
        subtitleEn: 'DIGITAL PUBLISHING PORTAL',
        heroBadge: 'DIGITAL PUBLISHING · 在线书刊与知识订阅门户',
        heroTitle: `${t} · 精品书刊与数字阅读中心`,
        heroDesc: '汇聚正版电子书刊、专栏连载、在线试读与读者会员订阅服务。',
        searchPlaceholder: '搜索书名、作者、ISBN 或专栏标签...',
        cartLabel: '购书袋',
        primaryCta: '立即订阅',
        previewCta: '在线试读',
        cEndLabel: '读者门户',
      };
    }
    return {
      industryPreset: 'general-enterprise',
      brandMark: firstChar,
      subtitleEn: 'ENTERPRISE SERVICE PORTAL',
      heroBadge: 'ENTERPRISE SERVICE PORTAL · 全端契约驱动',
      heroTitle: `${t} · 在线业务服务门户`,
      heroDesc: '提供线上业务办理、方案浏览、进度查询与多租户协同服务。',
      searchPlaceholder: '搜索服务事项、业务方案或编号...',
      cartLabel: '服务清单',
      primaryCta: '立即办理',
      previewCta: '查看详情',
      cEndLabel: '业务门户',
    };
  };

  const inferred = inferIndustryAndPortal(projectTitle);
  const shortTitle = projectTitle.slice(0, 16).trim() || projectTitle;

  if (!dryRun && fs.existsSync(blueprintEnginePath) && fs.existsSync(path.join(targetDir, 'blueprint.template.json'))) {
    try {
      const { execFileSync } = await import('node:child_process');
      // 变量全覆盖（2026-11-08 合流收口）：品牌语义变量必须按项目坐标传值，
      // 不许留给模板 CoolieBase 默认值兜底（上游模板默认值中性化归上游 COO-226 修复包，
      // 母仓传值是孵化侧的兜底正道 —— 实测模板 79 变量中 13 处默认值带原厂牌）。
      const engineVars = {
        // —— 项目坐标 ——
        PROJECT_NAME: cleanName,
        PLATFORM_TITLE: projectTitle.slice(0, 40),
        SHORT_NAME: shortTitle,
        BRAND_MARK: inferred.brandMark,
        SITE_NAME: shortTitle,
        DOMAIN_TAGLINE: `${projectTitle} · 数字化业务服务平台`,
        // —— 署名与版权（模板原默认：CoolieBase All Team）——
        AUTHOR_ORG: `${projectTitle} 项目组`,
        COPYRIGHT_TEXT: `© 2026 ${projectTitle}`,
        PROJECT_DESCRIPTION: `${projectTitle} · 业务管理系统`,
        // —— 登录页（模板原默认：CoolieBase All 基座平台）——
        LOGIN_HEADLINE: `${projectTitle} · 管理后台`.slice(0, 40),
        LOGIN_TAGLINE: `${projectTitle} —— 业务管理系统，操作全程留痕可追溯。`.slice(0, 120),
        LOGIN_SUBTITLE: `${projectTitle} · 数字化业务服务平台`.slice(0, 40),
        LOGIN_TRUST_BADGE_1: '全流程留痕 · 操作可追溯',
        LOGIN_TRUST_BADGE_2: '真实数据库 · 零假数据',
        // —— 门面首屏与卡片（与档案 facade 注入同源取值）——
        HERO_BADGE: inferred.heroBadge,
        HERO_TITLE: projectTitle.slice(0, 40),
        HERO_SUBTITLE: inferred.heroDesc.slice(0, 80),
        HERO_DESCRIPTION: inferred.heroDesc,
        HERO_HIGHLIGHT: '全端契约同源驱动',
        C_END_ENTRY_LABEL: inferred.cEndLabel,
        C_END_ENTRY_HREF: '/2c',
        C_END_CARD_TITLE: `进入 ${inferred.cEndLabel} (C端)`,
        C_END_CARD_CTA: `${inferred.primaryCta} →`,
        C_END_CARD_DESC: inferred.heroDesc,
        B_END_ENTRY_LABEL: '管理后台',
        B_END_ENTRY_HREF: '/admin',
        B_END_CARD_TITLE: '进入运营管理后台 (B端)',
        B_END_CARD_CTA: '控制台 →',
        B_END_CARD_DESC: '核心业务台账管理、审批流转、多租户权限配置与审计留痕。',
        // —— C 端门户词包 ——
        PORTAL_BRAND_MARK: inferred.brandMark,
        PORTAL_TITLE: shortTitle,
        PORTAL_SUBTITLE_EN: inferred.subtitleEn,
        PORTAL_HERO_BADGE: inferred.heroBadge,
        PORTAL_HERO_TITLE: inferred.heroTitle,
        PORTAL_HERO_DESC: inferred.heroDesc,
        PORTAL_SEARCH_PLACEHOLDER: inferred.searchPlaceholder,
        PORTAL_CART_LABEL: inferred.cartLabel,
        PORTAL_PRIMARY_CTA: inferred.primaryCta,
        PORTAL_PREVIEW_CTA: inferred.previewCta,
        PORTAL_PROFILE_LABEL: '个人中心',
        // —— 多端客户端（模板原默认：CoolieBase / com.cooliebase.app）——
        EXPO_APP_NAME: shortTitle,
        EXPO_APP_SLUG: `${cleanName}-app`,
        IOS_BUNDLE_ID: `com.${safeJavaIdent}.app`,
        ANDROID_PACKAGE: `com.${safeJavaIdent}.app`,
        // —— 工程坐标（模板原默认：@cooliebase / cooliebase_next / demo.cooliebase.local）——
        PACKAGE_SCOPE: `@${cleanName}`,
        DB_NAME: cleanName,
        SQLITE_DB_PATH: `data/${cleanName}.db`,
        DEMO_TENANT_DOMAIN: `demo.${cleanName}.local`,
        // 历史仓库地址不外泄：客户项目不保留上游 git remote
        GIT_REMOTE_URL: '',
      };
      execFileSync(
        process.execPath,
        [
          blueprintEnginePath,
          'render',
          '--preset',
          inferred.industryPreset,
          ...Object.entries(engineVars).flatMap(([k, v]) => ['--set', `${k}=${String(v)}`]),
        ],
        { cwd: targetDir, stdio: quiet ? 'ignore' : 'inherit' }
      );
      if (!quiet) {
        console.log(`  🎨 [BLUEPRINT-ENGINE] 已通过 blueprint-engine.cjs 渲染全栈多端动态模板 (preset=${inferred.industryPreset}, vars=${Object.keys(engineVars).length}/79)`);
      }
    } catch (err) {
      if (!quiet) {
        console.log(`  ⚠️ [BLUEPRINT-ENGINE] 模板引擎执行提示: ${err.message}`);
      }
    }
  }

  // 4. 正则清扫单遍置换 —— **必须跑在引擎 render 之后**（顺序即正确性）
  //
  // 为什么（2026-11-08 合流收口实测）：引擎 render 对未传值变量按模板默认值兜底落盘，
  //   其中 13 处是 CoolieBase 品牌值（AUTHOR_ORG/COPYRIGHT_TEXT/LOGIN_HEADLINE/
  //   EXPO_APP_NAME/com.cooliebase.app/@cooliebase scope/demo.cooliebase.local 等）。
  //   清扫若先跑完，render 后落盘的原厂牌词永远扫不掉；先 render 后清扫 = 兜底值也过词典。
  scanAndReplace(targetDir);

  if (fs.existsSync(projectProfilePath)) {
    try {
      const profile = JSON.parse(fs.readFileSync(projectProfilePath, 'utf8'));
      const mark = inferred.brandMark || (profile.branding?.mark || 'C').trim().slice(0, 2) || 'C';
      const next = {
        ...profile,
        platformName: projectTitle.slice(0, 40),
        shortName: shortTitle,
        description: `${projectTitle} · 业务管理系统`,
        copyright: `© 2026 ${projectTitle}`,
        industryPreset: inferred.industryPreset,
        loginHeadline: `${projectTitle} · 管理后台`.slice(0, 40),
        loginTagline: `${projectTitle} —— 业务管理系统，操作全程留痕可追溯。`.slice(0, 120),
        facade: {
          ...(profile.facade || {}),
          siteName: shortTitle,
          domainTagline: `${projectTitle} · 数字化业务服务平台`.slice(0, 120),
          cEndEntry: { label: inferred.cEndLabel, href: '/2c' },
          bEndEntry: { label: '管理后台', href: '/admin' },
          heroBadge: inferred.heroBadge,
          heroTitle: projectTitle.slice(0, 80),
          heroHighlight: '全端契约同源驱动',
          heroSubtitle: inferred.heroDesc.slice(0, 160),
          heroDescription: inferred.heroDesc,
          cEndCardTitle: `进入 ${inferred.cEndLabel} (C端)`,
          cEndCardCta: `${inferred.primaryCta} →`,
          cEndCardDesc: inferred.heroDesc,
          bEndCardTitle: '进入运营管理后台 (B端)',
          bEndCardCta: '控制台 →',
          bEndCardDesc: '核心业务台账管理、审批流转、多租户权限配置与审计留痕。',
          loginSubtitle: `${projectTitle} · 数字化业务服务平台`.slice(0, 160),
          telemetryEnabled: false,
          devPort: profile.facade?.devPort || 3210,
        },
        consumerPortal: {
          ...(profile.consumerPortal || {}),
          brandMark: mark,
          title: shortTitle,
          subtitleEn: inferred.subtitleEn,
          heroBadge: inferred.heroBadge,
          heroTitle: inferred.heroTitle,
          heroDesc: inferred.heroDesc,
          searchPlaceholder: inferred.searchPlaceholder,
          cartLabel: inferred.cartLabel,
          primaryCta: inferred.primaryCta,
          previewCta: inferred.previewCta,
          profileLabel: '个人中心',
        },
        multiClient: {
          ...(profile.multiClient || {}),
          expoAppName: shortTitle,
          expoAppSlug: `${cleanName}-app`,
          iosBundleId: `com.${safeJavaIdent}.app`,
          androidPackage: `com.${safeJavaIdent}.app`,
        },
        branding: {
          ...(profile.branding || {}),
          mark,
        },
        // 客户可见的信任标识：按项目填业务口径，**不露平台内部词**（实测 2026-11-03 老板口径：
        // 页面不得出现「本体」这类平台内部说法）。
        loginTrustBadges: ['全流程留痕 · 操作可追溯', '真实数据库 · 零假数据'],
      };
      if (!dryRun) {
        fs.writeFileSync(projectProfilePath, JSON.stringify(next, null, 2) + '\n', 'utf8');
      }
      filesModified++;
      console.log(`  📇 [PROFILE] 注入项目档案与门面/C端门户模板变量: ${projectProfileRel} (preset=${inferred.industryPreset})`);
    } catch (err) {
      console.log(`  ⚠️ [PROFILE] 档案注入跳过（${err.message}）`);
    }
  } else {
    console.log(`  ℹ️ [PROFILE] 非 cooliebase-all 结构（无 ${projectProfileRel}），跳过档案注入`);
  }

  // 4. 重构 Java 源码包路径 (cn/iocoder/yudao ➜ effectivePackagePrefix)
  const oldJavaPkgRel = path.join('cn', 'iocoder', 'yudao');
  const newJavaPkgRel = path.join(...effectivePackagePrefix.split('.'));

  function restructureJavaPackages(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        restructureJavaPackages(fullPath);
      }
    }

    // 检查此目录是否是 cn/iocoder/yudao 节点
    if (dir.endsWith(oldJavaPkgRel)) {
      const parentRoot = dir.substring(0, dir.length - oldJavaPkgRel.length);
      const targetPkgDir = path.join(parentRoot, newJavaPkgRel);

      if (!dryRun) {
        fs.mkdirSync(targetPkgDir, { recursive: true });
        // 移动所有子项
        const oldEntries = fs.readdirSync(dir);
        for (const item of oldEntries) {
          const srcItem = path.join(dir, item);
          const dstItem = path.join(targetPkgDir, item);
          if (fs.existsSync(srcItem) && !fs.existsSync(dstItem)) {
            fs.renameSync(srcItem, dstItem);
          }
        }
        // 清理旧目录
        try {
          fs.rmdirSync(dir);
          // 尝试清理空父目录 cn/iocoder
          const parentIocoder = path.join(parentRoot, 'cn', 'iocoder');
          if (fs.existsSync(parentIocoder) && fs.readdirSync(parentIocoder).length === 0) {
            fs.rmdirSync(parentIocoder);
          }
          const parentCn = path.join(parentRoot, 'cn');
          if (fs.existsSync(parentCn) && fs.readdirSync(parentCn).length === 0) {
            fs.rmdirSync(parentCn);
          }
        } catch {
          // 允许非空保留
        }
      }
      if (!quiet) {
        console.log(`  ☕ [JAVA PKG MOVE] ${path.relative(targetDir, dir)} ➜ ${path.relative(targetDir, targetPkgDir)}`);
      }
    }
  }

  restructureJavaPackages(targetDir);

  // 5. 文件与目录名中的厂商词物理重命名 (如 YudaoServerApplication.java ➜ ProjectServerApplication.java, yudao-xxx ➜ project-xxx)
  function renameVendorFilesAndDirs(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        renameVendorFilesAndDirs(fullPath);
        if (entry.name === cleanName || entry.name === cleanIdent || entry.name === projectPascal || entry.name === safeJavaIdent) {
          continue;
        }
        if (
          entry.name.includes('yudao') ||
          entry.name.includes('Yudao') ||
          entry.name.includes('cooliebase') ||
          entry.name.includes('Cooliebase')
        ) {
          const newDirName = entry.name
            .replace(/cooliebase-all/g, cleanName)
            .replace(/Cooliebase/g, projectPascal)
            .replace(/cooliebase/g, cleanName)
            .replace(/Yudao/g, projectPascal)
            .replace(/yudao/g, cleanName);
          const newDirPath = path.join(dir, newDirName);
          if (!fs.existsSync(newDirPath)) {
            if (!dryRun) {
              try { fs.renameSync(fullPath, newDirPath); } catch (_err) { /* ignore error safely */ }
            }
            if (!quiet) {
              console.log(`  📁 [DIR RENAME] ${entry.name} ➜ ${newDirName}`);
            }
          }
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.java')) {
          if (entry.name === 'YudaoServerApplication.java') {
            const newFileName = `${projectPascal}ServerApplication.java`;
            const newFilePath = path.join(dir, newFileName);
            if (!fs.existsSync(newFilePath)) {
              if (!dryRun) { try { fs.renameSync(fullPath, newFilePath); } catch (_err) { /* ignore error safely */ } }
              if (!quiet) { console.log(`  📄 [FILE RENAME] ${entry.name} ➜ ${newFileName}`); }
            }
          } else if (entry.name === 'YudaoGatewayApplication.java') {
            const newFileName = `${projectPascal}GatewayApplication.java`;
            const newFilePath = path.join(dir, newFileName);
            if (!fs.existsSync(newFilePath)) {
              if (!dryRun) { try { fs.renameSync(fullPath, newFilePath); } catch (_err) { /* ignore error safely */ } }
              if (!quiet) { console.log(`  📄 [FILE RENAME] ${entry.name} ➜ ${newFileName}`); }
            }
          }
          // 其他 .java 文件必须保持原始文件名，防止破坏 public class 声明与文件名严格一致性
          continue;
        }

        // 非 Java 文件 (文档、图片、配置、Caddy、MCP Server 等) 物理脱敏
        if (
          entry.name.includes('yudao') ||
          entry.name.includes('Yudao') ||
          entry.name.includes('cooliebase') ||
          entry.name.includes('Cooliebase')
        ) {
          const newFileName = entry.name
            .replace(/cooliebase-all/g, cleanName)
            .replace(/Cooliebase/g, projectPascal)
            .replace(/cooliebase/g, cleanName)
            .replace(/Yudao/g, projectPascal)
            .replace(/yudao/g, cleanName);
          const newFilePath = path.join(dir, newFileName);
          if (!fs.existsSync(newFilePath)) {
            if (!dryRun) {
              try { fs.renameSync(fullPath, newFilePath); } catch (_err) { /* ignore error safely */ }
            }
            if (!quiet) {
              console.log(`  📄 [FILE RENAME] ${entry.name} ➜ ${newFileName}`);
            }
          }
        }
      }
    }
  }

  renameVendorFilesAndDirs(targetDir);

  // ── 层B 交付物独立轻量 Harness 出厂自检 ────────────────────────────
  // 铁律：交付物必须自带自闭环轻量 harness，出厂前必须就地自证清白
  let harnessVerification = { executed: false, passed: false };
  if (!dryRun) {
    // 动态优先：从交付物根目录的自描述清单 (compat-manifest.json / blueprint.json) 中读取自检指令
    let manifestHarnessCmd = null;
    let blueprintEngineName = null;
    try {
      const manifestPath = path.join(targetDir, 'compat-manifest.json');
      if (fs.existsSync(manifestPath)) {
        const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        blueprintEngineName = raw.framework?.name || raw.blueprint?.name || null;
        if (raw.harness?.checkCommand) {
          manifestHarnessCmd = raw.harness.checkCommand;
        }
      }
    } catch (_err) { /* ignore error safely */ }

    if (manifestHarnessCmd) {
      if (!quiet) console.log(`🛡️  [HARNESS] 触发 ${blueprintEngineName || '蓝图'} 交付物自描述出厂自检 (${manifestHarnessCmd})...`);
      try {
        const { spawnSync } = await import('node:child_process');
        const [bin, ...cmdArgs] = manifestHarnessCmd.trim().split(/\s+/);
        const res = spawnSync(bin, cmdArgs, { cwd: targetDir, stdio: quiet ? 'pipe' : 'inherit' });
        harnessVerification = { executed: true, passed: res.status === 0, engine: blueprintEngineName || 'manifest-driven' };
      } catch (e) {
        harnessVerification = { executed: true, passed: false, error: e.message };
      }
    } else {
      // 容错回退机制：检测已知交付物物理脚本
      const hasCooliebaseHarness = fs.existsSync(path.join(targetDir, 'scripts', 'harness.cjs'));
      const hasGateCheckHarness = fs.existsSync(path.join(targetDir, 'scripts', 'gate-check.mjs'));
      if (hasCooliebaseHarness) {
        if (!quiet) console.log('🛡️  [HARNESS] 触发 cooliebase-all 交付物出厂自检 (harness doctor)...');
        try {
          const { spawnSync } = await import('node:child_process');
          const res = spawnSync('node', ['scripts/harness.cjs', 'doctor'], { cwd: targetDir, stdio: quiet ? 'pipe' : 'inherit' });
          harnessVerification = { executed: true, passed: res.status === 0, engine: 'cooliebase-all' };
        } catch (e) {
          harnessVerification = { executed: true, passed: false, error: e.message };
        }
      } else if (hasGateCheckHarness) {
        if (!quiet) console.log('🛡️  [HARNESS] 触发 yudao-quad-terminal 交付物出厂自检 (gate-check fast)...');
        try {
          const { spawnSync } = await import('node:child_process');
          const res = spawnSync('node', ['scripts/gate-check.mjs', '--tier', 'fast'], { cwd: targetDir, stdio: quiet ? 'pipe' : 'inherit' });
          harnessVerification = { executed: true, passed: res.status === 0, engine: 'yudao-quad-terminal' };
        } catch (e) {
          harnessVerification = { executed: true, passed: false, error: e.message };
        }
      }
    }
  }

  // 5.5 沉降二遍清扫（自检再生内容兜底）
  // 实测（2026-11-08 孵化冒烟断言D 红灯抓回）：上一步的交付物出厂自检会触发底座
  //   自带 harness 生成器，再生约 99 个文件（AGENTS.md/SKILL.md/deploy/docs 等）——
  //   晚于主清扫落盘，其中部分内容带原厂牌词。主清扫已成过去时，必须在自检
  //   之后补第二遍清扫兜底，保证「换牌无残留」金标不受自检副作用破坏。
  // 幂等安全：单遍替换引擎 + 词典命中即净，二遍对已净内容零写入。
  const preSecondPassModified = filesModified;
  scanAndReplace(targetDir);
  if (!quiet && filesModified > preSecondPassModified) {
    console.log(`  🧹 [SWEEP-2] 沉降二遍清扫追回 ${filesModified - preSecondPassModified} 个自检再生文件`);
  }

  // ── 蓝图引擎验收扫描（check）───────────────────────────────────
  // 「换牌无残留」金标的机器断言：模板占位符闭合 + 硬编码泄漏双扫描。
  // 结果进返回值与控制台汇总；不改孵化退出码（扫描器误报不中断孵化，泄漏清单照常打印，
  // 机器断言由 scripts/test-incubation-smoke.mjs 承接）。
  let engineCheck = { executed: false, passed: false };
  if (!dryRun && fs.existsSync(blueprintEnginePath) && fs.existsSync(path.join(targetDir, 'blueprint.template.json'))) {
    try {
      const { spawnSync } = await import('node:child_process');
      const res = spawnSync(process.execPath, [blueprintEnginePath, 'check'], { cwd: targetDir, encoding: 'utf8' });
      engineCheck = { executed: true, passed: res.status === 0 };
      const out = `${res.stdout || ''}${res.stderr || ''}`.trim();
      if (!quiet) {
        if (res.status === 0) {
          console.log('  ✅ [BLUEPRINT-CHECK] 蓝图引擎验收扫描全绿（模板闭包 + 换牌无残留）');
        } else {
          console.log('  ⚠️ [BLUEPRINT-CHECK] 蓝图引擎验收扫描有发现：');
          console.log(out.split('\n').slice(0, 40).map((l) => `      ${l}`).join('\n'));
        }
      }
    } catch (e) {
      engineCheck = { executed: true, passed: false, error: e.message };
    }
  }

  const durationMs = Date.now() - startTime;

  if (!quiet) {
    console.log('\n========================================================================');
    console.log(`🎉 Project Reactor 白标置换完成！耗时: ${durationMs}ms`);
    console.log(`   扫描文件: ${filesScanned} 个`);
    console.log(`   置换文件: ${filesModified} 个`);
    console.log(`   命中置换: ${matchesCount} 处`);
    console.log(`   蓝图验收: ${engineCheck.executed ? (engineCheck.passed ? '✅ check 全绿' : '⚠️ check 有发现') : '— 跳过（dry-run 或无引擎结构）'}`);
    console.log('========================================================================\n');
  }

  return {
    targetDir,
    projectName: cleanName,
    projectTitle,
    filesScanned,
    filesModified,
    matchesCount,
    durationMs,
    modifiedList,
    engineCheck,
  };
}

// CLI 直跑入口
if (process.argv[1] && process.argv[1].endsWith('project-reactor.mjs')) {
  try {
    const opts = parseCliArgs();
    runProjectReactor(opts);
  } catch (err) {
    console.error(`❌ [ERROR] Project Reactor 执行失败:`, err.message);
    process.exit(1);
  }
}
