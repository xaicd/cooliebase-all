// Codegen Templates Master Index & Orchestration Pipeline
import { type CodegenConfig, type CodegenOutput, toCamel } from "./common"
import { generateTypes } from "./types.template"
import { generateValidator } from "./validator.template"
import { generateRepository } from "./repository.template"
import { generateService } from "./service.template"
import { generateActions } from "./actions.template"
import { generateRoute, generateActionRoutes } from "./route.template"
import { generateApiClient } from "./frontend-api.template"
import { generateFormComponent } from "./frontend-form.template"
import { generateListPage } from "./frontend-list.template"
import { generateAppPage } from "./frontend-page.template"
import { generateTest } from "./test.template"
import { generateRbacSql } from "./rbac-sql.template"
import { generateTableDdl } from "./table-ddl.template"
import { generateAgentContract } from "./agent-contract.template"

export * from "./common"
export * from "./types.template"
export * from "./validator.template"
export * from "./repository.template"
export * from "./service.template"
export * from "./actions.template"
export * from "./route.template"
export * from "./frontend-api.template"
export * from "./frontend-form.template"
export * from "./frontend-list.template"
export * from "./frontend-page.template"
export * from "./test.template"
export * from "./rbac-sql.template"
export * from "./table-ddl.template"
export * from "./agent-contract.template"

export interface GenerateCodesOptions {
  includeClients?: boolean
}

/**
 * 完整组装并生成该数据表/模块的全套工程代码产物
 * 包含：后端 6 大分层 + 前端 4 大组件 + RBAC 增量 SQL + 单元测试 + Clients 多端 (可选)
 */
export function generateAllCodegenOutputs(config: CodegenConfig, options?: GenerateCodesOptions): CodegenOutput[] {
  const outputs: CodegenOutput[] = [
    generateTypes(config),
    generateValidator(config),
  ]

  if (config.onlineRuntime?.storageKind !== "MANAGED_TABLE") {
    outputs.push(generateRepository(config))
  }

  outputs.push(
    generateService(config),
    generateActions(config),
    generateRoute(config),
    ...generateActionRoutes(config),
    generateApiClient(config),
    generateFormComponent(config),
    generateListPage(config),
    generateAppPage(config),
    generateTest(config),
    generateRbacSql(config),
    // 建表迁移: 没有它，生成的 Repository 会查一张不存在的表（内存回退下看不出来）
    generateTableDdl(config),
    // Agent 操作契约: 与代码**同源产出**。新域一生成就自动可被
    // agent-device / agent-browser 驱动，不需要另外补文档（文档必然过时）。
    generateAgentContract(config),
    {
      path: "codegen-manifest.json",
      type: "manifest" as any,
      content: JSON.stringify({
        moduleName: config.moduleName,
        className: config.className,
        rpcActions: [`cooliebase.cmd.${config.moduleName}.${toCamel(config.className)}.page`],
      }, null, 2),
    },
  )

  // 客户端渠道模板（h5 / uniapp / flutter）已随这些渠道一并移除：
  // 本仓只保留 clients/expo 一个客户端。includeClients 选项保留以兼容调用方，
  // 但当前没有可生成的客户端目标（若将来新增渠道，在此恢复对应模板）。

  return outputs
}
