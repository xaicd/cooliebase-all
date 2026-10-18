const {
  writeGeneratedManifests,
  writeGeneratedModuleManifests,
  writeGeneratedModuleRegistry,
} = require("./lib/domain-catalog.cjs")

const routeManifests = writeGeneratedManifests()
console.log(`[domain-manifests] wrote ${routeManifests.length} route manifests:`)
for (const file of routeManifests) console.log(`  ${file}`)

// 域声明面。全部字段由既有真源(domain-catalog / facade / proto / actions / permissions)
// 聚合而来, 不是第二份真源。
//
// 命名注意: 这些产物是 **Platform Module 声明**(可信/进程内/显式注册),
// 显式注册面), 不是 §6.2 的可安装 Plugin。故一律用 module 而非 plugin 命名,
// 详见 docs/architecture/cooliebase-all-base-module-to-plugin-migration.md §5.3。
const moduleManifests = writeGeneratedModuleManifests()
console.log(`[domain-manifests] wrote ${moduleManifests.length} module manifests:`)
for (const file of moduleManifests) console.log(`  ${file}`)

// 各域 manifest 的静态索引(供运行时加载)
console.log(`[domain-manifests] wrote module registry: ${writeGeneratedModuleRegistry()}`)
