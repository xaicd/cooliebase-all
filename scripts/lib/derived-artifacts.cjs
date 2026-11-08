/**
 * 「由域集派生的产物」清单 —— **一处定义，孵化器与 domain:new 共用**。
 *
 * 为什么必须收成一处: 这条链上每加一个派生物，就有两个地方要同步
 * （孵化时重建、加域时重建），漏一个的表现是**门禁对不上**（"注册表 14 vs 实际 15"）。
 * 同一轮里我已经漏了两次 —— 补第三个不如把它变成不可能漏。
 *
 * 全部是**纯 node** 脚本（不依赖 pnpm install），所以孵化期就能跑。
 */
const DERIVED_ARTIFACTS = [
  { script: "scripts/write-domain-manifests.cjs", args: [], label: "域清单(domain:manifests)" },
  { script: "scripts/agent/collect-contracts.cjs", args: [], label: "Agent 契约注册表(agent:contracts)" },
  { script: "scripts/generate-page-schemas.cjs", args: ["--write"], label: "C 端页面 schema(agent:page-schemas)" },
  { script: "scripts/generate-domain-service-loaders.cjs", args: ["--write"], label: "跨域 loader(domain:loaders)" },
  { script: "scripts/generate-domain-rbac-migration.cjs", args: ["--write"], label: "菜单/权限迁移" },
  { script: "scripts/generate-admin-pages.cjs", args: ["--write"], label: "管理端页面清单(admin:pages)" },
  { script: "scripts/generate-admin-nav.cjs", args: ["--write"], label: "侧栏导航(admin:nav)" },
]

module.exports = { DERIVED_ARTIFACTS }
