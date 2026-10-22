const fs = require("fs")
const path = require("path")
const { ROOT, loadCatalog } = require("./lib/domain-catalog.cjs")
const { PLATFORM_COMPANIONS } = require("./lib/hatch-profile.cjs")
const { SEAM_GRAPH_REL, assertSeamGraphMatches } = require("./lib/seam-graph.cjs")

function fail(message) {
  throw new Error(`[harness-bundle] ${message}`)
}

const AGENT_PROFILE_REL = "packages/shared/contract/agent-profile.json"
const profilePath = path.join(ROOT, ...AGENT_PROFILE_REL.split("/"))
if (!fs.existsSync(profilePath)) fail(`missing ${AGENT_PROFILE_REL}`)

const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"))
if (profile.kind !== "workspace-bundle") fail("agent-profile.json kind must be workspace-bundle")
if (profile.role !== "business-project-template") fail("agent-profile.json role must be business-project-template")
if (!Array.isArray(profile.not) || !profile.not.includes("agent-runtime") || !profile.not.includes("cordis-host")) {
  fail("agent-profile.json must declare it is not an agent-runtime or cordis-host")
}

const requiredSections = [
  { name: "identity", path: ".agents/context/IDENTITY.md" },
  { name: "soul", path: ".agents/context/SOUL.md" },
  { name: "seams", path: AGENT_PROFILE_REL },
  { name: "seam-graph", path: SEAM_GRAPH_REL },
  { name: "catalog", path: "packages/shared/backend/constants/domain-catalog.json" },
]
for (const section of requiredSections) {
  const declared = (profile.promptAssembly?.sections || []).find((item) => item.name === section.name)
  if (!declared) fail(`promptAssembly missing section ${section.name}`)
  const target = path.join(ROOT, ...section.path.split("/"))
  if (!fs.existsSync(target)) fail(`prompt section ${section.name} missing file ${section.path}`)
}

if (!fs.existsSync(path.join(ROOT, ".agents/context/ASSEMBLY.md"))) fail("missing .agents/context/ASSEMBLY.md")
if (!fs.existsSync(path.join(ROOT, ".agents/skills/agent-harness/SKILL.md"))) fail("missing .agents/skills/agent-harness/SKILL.md")
if (fs.existsSync(path.join(ROOT, "docs/skills"))) fail("duplicate skills directory docs/skills must not exist")

// 规则文件必须**全部**在 ASSEMBLY.md 里注册 —— 否则 AI 入口根本看不到它（等于没写）。
// 此前只有一处点检（只查 high-order-inverse-thinking 挂没挂），其余规则漏了也没人知道。
{
  const rulesDir = path.join(ROOT, ".agents/rules")
  const assembly = fs.readFileSync(path.join(ROOT, ".agents/context/ASSEMBLY.md"), "utf8")
  const registered = new Set([...assembly.matchAll(/\.agents\/rules\/([A-Za-z0-9-]+\.md)/g)].map((m) => m[1]))
  const onDisk = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md"))
  const missing = onDisk.filter((f) => !registered.has(f))
  if (missing.length) {
    fail(
      `以下规则文件没有在 .agents/context/ASSEMBLY.md 注册，AI 入口（cmd / Claude / DigitalStaff）看不到：\n` +
        missing.map((f) => `  · .agents/rules/${f}`).join("\n") +
        `\n  修法：在 ASSEMBLY.md 表格里加一行（order / name / path / inject / 何时加载）`,
    )
  }
  const ghost = [...registered].filter((f) => !onDisk.includes(f))
  if (ghost.length) fail(`ASSEMBLY.md 引用了不存在的规则文件: ${ghost.join(", ")}`)
}

const agentsMd = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8")
if (!agentsMd.includes("agent-harness")) fail("AGENTS.md must register agent-harness")
if (!agentsMd.includes("Workspace Bundle")) fail("AGENTS.md §18 must declare Workspace Bundle")

if (Array.isArray(profile.bundles?.business?.domains)) {
  fail("agent-profile bundles.business must not duplicate domain names; catalog is the source of truth")
}
if (!String(profile.bundles?.business?.source || "").includes("domain-catalog.json")) {
  fail("agent-profile bundles.business.source must point at domain-catalog.json")
}

const companions = profile.profiles?.minimal?.companions || []
if (companions.join(",") !== PLATFORM_COMPANIONS.join(",")) {
  fail(`minimal companions must be ${PLATFORM_COMPANIONS.join(",")} (menu catalog + codegen facades)`)
}

if (profile.seamGraph?.path !== SEAM_GRAPH_REL) {
  fail(`agent-profile.seamGraph.path must be ${SEAM_GRAPH_REL}`)
}

const catalog = loadCatalog()
const graph = assertSeamGraphMatches({ catalog })
const catalogNames = catalog.domains.map((item) => item.name)
const graphNames = graph.domains.map((item) => item.name)
if (catalogNames.join(",") !== graphNames.join(",")) {
  fail("seam-graph domain names drifted from domain-catalog.json")
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
for (const [name, spec] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (String(name).toLowerCase().includes("cordis") || String(spec).toLowerCase().includes("cordis")) {
    fail("package.json must not depend on Cordis")
  }
}

if (!fs.existsSync(path.join(ROOT, "docs/features/sprint-prod"))) {
  fail("missing docs/features/sprint-prod append-only trace directory")
}

const hatchPath = path.join(ROOT, "scripts/lib/hatch-profile.cjs")
if (!fs.existsSync(hatchPath)) fail("missing scripts/lib/hatch-profile.cjs")
const hatchSource = fs.readFileSync(hatchPath, "utf8")
if (!hatchSource.includes("minimal") || !hatchSource.includes("--bundle")) {
  fail("hatch-profile must support --profile/--bundle")
}

const cloneSource = fs.readFileSync(path.join(ROOT, "scripts/clone-project-base.cjs"), "utf8")
if (!cloneSource.includes("resolveHatchPlan") || !cloneSource.includes("hatch-manifest.json")) {
  fail("clone-project-base.cjs must apply hatch profile patches")
}

if (!profile.trace?.sprintProd || !profile.trace?.gateArtifact || !profile.trace?.writer) {
  fail("agent-profile.trace must declare sprintProd, gateArtifact, and writer")
}
const writerRel = profile.trace.writer
if (!fs.existsSync(path.join(ROOT, ...writerRel.split("/")))) fail(`missing trace writer ${writerRel}`)

const CRUSH_SKILL_NAMES = new Set(["git-flow", "code-review", "build-project", "run-preview", "test-validate", "deploy-artifact"])
const layers = profile.npc?.layers
if (!layers || !layers.L0 || !layers.L4) fail("agent-profile.npc.layers must declare at least L0 and L4")
const skillsDir = profile.npc?.skillsDir || ".agents/skills"
const seenSkills = new Set()
for (const [layer, spec] of Object.entries(layers)) {
  if (!spec || !Array.isArray(spec.skills) || spec.skills.length === 0) {
    fail(`npc.layers.${layer} must list base skills`)
  }
  for (const skill of spec.skills) {
    const name = String(skill || "").trim()
    if (!name) fail(`npc.layers.${layer} has an empty skill name`)
    if (CRUSH_SKILL_NAMES.has(name) || name.toLowerCase().includes("crush")) {
      fail(`npc.layers.${layer} must not use Crush skill name ${name}`)
    }
    const skillFile = path.join(ROOT, skillsDir, name, "SKILL.md")
    if (!fs.existsSync(skillFile)) fail(`npc.layers.${layer} skill missing: ${skillsDir}/${name}/SKILL.md`)
    seenSkills.add(name)
  }
}

const surface = profile.consumptionSurface
if (!surface) fail("agent-profile.json must declare consumptionSurface (how external agents consume this repo)")

const compatRel = surface.compatManifest
if (!compatRel) fail("consumptionSurface.compatManifest is required")
const compatFull = path.join(ROOT, ...compatRel.split("/"))
if (!fs.existsSync(compatFull)) fail(`consumptionSurface.compatManifest missing on disk: ${compatRel}`)
const compat = JSON.parse(fs.readFileSync(compatFull, "utf8"))
if (compat.kind !== "compat-manifest") fail(`${compatRel} kind must be compat-manifest`)

const mcpServerRel = compat.consumptionSurface?.mcp?.server
if (!mcpServerRel) fail(`${compatRel} must declare consumptionSurface.mcp.server`)
if (!fs.existsSync(path.join(ROOT, ...mcpServerRel.split("/")))) fail(`MCP server missing: ${mcpServerRel}`)

const skillsSource = surface.skills?.source
if (skillsSource !== profile.npc?.skillsDir) {
  fail(`consumptionSurface.skills.source "${skillsSource}" != npc.skillsDir "${profile.npc?.skillsDir}"`)
}
if (surface.skills?.mirror) {
  fail("consumptionSurface.skills must not declare mirror; .agents/skills is the single truth")
}
// 该字段的契约是「指出一个存在的技能脚本」；历史数据带 npm 的 run 前缀，
// 而本仓 AGENTS §2.1 的规范形态是 pnpm。**两者都要认** ——
// 只认 npm（原实现）会在把数据统一成 pnpm 后直接把 check 打红（实测）。
const stripRunner = (value) => String(value || "").trim().replace(/^(?:npm|pnpm)\s+run\s+/, "")
const skillsCheck = stripRunner(surface.skills?.check)
if (skillsCheck && !pkg.scripts?.[skillsCheck]) {
  fail(`consumptionSurface.skills.check must name an existing npm script, got "${surface.skills?.check}"`)
}
const skillsSync = stripRunner(surface.skills?.sync)
if (!skillsSync || !pkg.scripts?.[skillsSync]) {
  fail(`consumptionSurface.skills.sync must name an existing npm script, got "${surface.skills?.sync}"`)
}

console.log(`[harness-bundle] PASS: workspace-bundle, ${graph.domains.length} seams, hatch P1, ${seenSkills.size} layer skills`)
