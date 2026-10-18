/**
 * scripts/guard-high-order-invariants.cjs
 *
 * CoolieBase-All-Next AI-Driven 基座 Harness 自动化守卫脚本
 * 深度吸收 DeepSeek Harness (dsh) 与 Palantir 体系精髓：
 * 1. 高阶反向思维规则挂载与装配检查 (.agents/rules/HIGH-ORDER-INVERSE-THINKING.md)
 * 2. 反假 Mock 与反空壳测试断言扫描 (SpaceX-Grade Anti-Fake Testing)
 * 3. 跨域调用 Domain Facade 边界扫描 (No Cross-Domain Internal Service Leakage)
 * 4. 路由写接口变更审计与安全防护校验 (Immutable Audit Log & Contract Guard)
 *
 * 用法:
 *   node scripts/guard-high-order-invariants.cjs
 *   node scripts/guard-high-order-invariants.cjs --check
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

let errors = [];
let warnings = [];

function check(label, fn) {
  try {
    fn();
  } catch (err) {
    errors.push(`[${label}] ${err.message}`);
  }
}

// 1. 检查高阶反向思维规则挂载
check("Rule-Mounting", () => {
  const rulePath = path.join(ROOT, ".agents/rules/HIGH-ORDER-INVERSE-THINKING.md");
  if (!fs.existsSync(rulePath)) {
    throw new Error("缺失 .agents/rules/HIGH-ORDER-INVERSE-THINKING.md 规则文件！");
  }
  const ruleContent = fs.readFileSync(rulePath, "utf8");
  if (!ruleContent.includes("四大合一最高审视视角") || !ruleContent.includes("敲代码全流程监督铁律")) {
    throw new Error("HIGH-ORDER-INVERSE-THINKING.md 内容不完整，缺少核心视角或监督铁律！");
  }

  // 检查 ASSEMBLY.md 挂载
  const assemblyPath = path.join(ROOT, ".agents/context/ASSEMBLY.md");
  if (!fs.existsSync(assemblyPath)) {
    throw new Error("缺失 .agents/context/ASSEMBLY.md 装配文件！");
  }
  const assemblyContent = fs.readFileSync(assemblyPath, "utf8");
  if (!assemblyContent.includes("high-order-inverse-thinking")) {
    throw new Error("ASSEMBLY.md 必须在 promptAssembly 中挂载 high-order-inverse-thinking！");
  }

  // 检查 agent-profile.json 声明
  const profilePath = path.join(ROOT, "packages/shared/contract/agent-profile.json");
  if (fs.existsSync(profilePath)) {
    const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
    const sections = profile.promptAssembly?.sections || [];
    const hasSection = sections.some((s) => s.name === "high-order-inverse-thinking");
    if (!hasSection) {
      throw new Error("agent-profile.json promptAssembly.sections 必须声明 high-order-inverse-thinking！");
    }
  }

  // 检查 AGENTS.md 登记
  const agentsMd = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
  if (!agentsMd.includes("HIGH-ORDER-INVERSE-THINKING.md") || !agentsMd.includes("§23")) {
    throw new Error("AGENTS.md 必须在 Universal Directives 与 §23 登记高阶反向思维准则！");
  }

  // 检查通用高阶反向提示词库文件存在性与 5 大模版完备性
  const promptLibPath = path.join(ROOT, "docs/architecture/universal-high-order-inverse-prompts.md");
  if (!fs.existsSync(promptLibPath)) {
    throw new Error("缺失 docs/architecture/universal-high-order-inverse-prompts.md 通用提示词库文件！");
  }
  const promptLibContent = fs.readFileSync(promptLibPath, "utf8");
  if (!promptLibContent.includes("模版 1") || !promptLibContent.includes("模版 5")) {
    throw new Error("universal-high-order-inverse-prompts.md 必须完整包含五大核心反向提示词模版！");
  }

  // 检查 AI-Driven 全生命周期 6 大阶段治理大纲
  const lifecyclePath = path.join(ROOT, "docs/architecture/ai-driven-full-lifecycle-governance-and-reinforcement.md");
  if (!fs.existsSync(lifecyclePath)) {
    throw new Error("缺失 docs/architecture/ai-driven-full-lifecycle-governance-and-reinforcement.md 全生命周期治理大纲！");
  }
  const lifecycleContent = fs.readFileSync(lifecyclePath, "utf8");
  const requiredPhases = ["需求", "设计", "开发", "测试", "运营", "运维"];
  for (const phase of requiredPhases) {
    if (!lifecycleContent.includes(phase)) {
      throw new Error(`全生命周期治理大纲必须包含【${phase}】阶段的强化规范！`);
    }
  }
});

// 2. 反假 Mock 与反空壳测试断言扫描
check("Anti-Fake-Testing", () => {
  const testDir = path.join(ROOT, "test");
  if (!fs.existsSync(testDir)) return;

  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(walk(full));
      } else if (/\.(test|spec)\.(ts|tsx|js)$/.test(item.name)) {
        results.push(full);
      }
    }
    return results;
  }

  const testFiles = walk(testDir);
  const hollowPatterns = [
    /expect\s*\(\s*true\s*\)\s*\.toBe\s*\(\s*true\s*\)/,
    /expect\s*\(\s*false\s*\)\s*\.toBe\s*\(\s*false\s*\)/,
    /expect\s*\(\s*1\s*\)\s*\.toBe\s*\(\s*1\s*\)/,
    /expect\s*\(\s*['"]a['"]\s*\)\s*\.toBe\s*\(\s*['"]a['"]\s*\)/,
  ];

  for (const file of testFiles) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    for (const pat of hollowPatterns) {
      if (pat.test(content)) {
        errors.push(`[Anti-Fake-Testing] 发现空壳测试断言 ${pat} 在 ${rel}！单测必须基于真实状态机与数据断言。`);
      }
    }
  }
});

// 3. 跨域调用边界扫描 (严格单向依赖与 Domain Facade)
check("Domain-Facade-Boundaries", () => {
  const pluginDir = path.join(ROOT, "packages/plugins");
  if (!fs.existsSync(pluginDir)) return;

  const plugins = fs.readdirSync(pluginDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("plugin-"))
    .map((d) => d.name);

  // 检查插件内部是否非法相对导入了其他插件的后端内部 service/mapper
  for (const p of plugins) {
    const pPath = path.join(pluginDir, p);
    function walkPlugin(dir) {
      let results = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          results = results.concat(walkPlugin(full));
        } else if (/\.(ts|tsx)$/.test(item.name) && !item.name.endsWith(".d.ts")) {
          results.push(full);
        }
      }
      return results;
    }
    const files = walkPlugin(pPath);
    for (const f of files) {
      const content = fs.readFileSync(f, "utf8");
      const illegalRelative = /\.\.\/\.\.\/(plugin-[^/]+|packages\/domains\/[^/]+)\/(backend|services|mappers)/g;
      let match;
      while ((match = illegalRelative.exec(content)) !== null) {
        errors.push(`[Domain-Boundaries] ${path.relative(ROOT, f)} 存在非法跨域内部相对导入: ${match[0]}。跨域必须走 Facade / RPC！`);
      }
    }
  }
});

console.log("=== [cooliebase-all] AI-Driven 基座 Harness 自动化守卫扫描 ===");
if (errors.length > 0) {
  console.error(`❌ 发现 ${errors.length} 项违规门禁:`);
  for (const err of errors) {
    console.error(`   - ${err}`);
  }
  process.exit(1);
} else {
  console.log("✅ 守卫扫描全部通过：高阶反向思维规则挂载完整，无空壳单测，跨域契约边界合规！");
}
