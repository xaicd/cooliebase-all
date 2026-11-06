/**
 * Codegen Engine - 审阅式 CRUD 代码生成引擎（门面协调器）
 *
 * 核心设计：
 * - 架构分层：模板渲染全部由 `codegen-templates/` 独立模块处理
 * - 本服务专注：配置校验、模板调度分发、多端联动装配与 ZIP 归档输出
 */

import { readdirSync } from "node:fs"
import path from "node:path"

import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import type { CodegenTemplate } from "../../contract/codegen.types"
import {
  type CodegenConfig,
  type CodegenOutput,
  generateAllCodegenOutputs,
  toCamel,
  toKebab,
  toPascal,
} from "./codegen-templates"

export type {
  CodegenActionType,
  CodegenAdvancedConfig,
  CodegenAdvancedField,
  CodegenConfig as CodegenEngineConfig,
  CodegenMasterDetailChild,
  CodegenQueryOperator,
  CodegenScene,
  CodegenTemplate,
  CodegenValidationRule,
  CodegenWidget,
} from "../../contract/codegen.types"

export type { CodegenConfig, CodegenOutput } from "./codegen-templates"

const IDENTIFIER = /^[a-z][a-z0-9_]{0,63}$/
const CLASS_NAME = /^[A-Z][A-Za-z0-9]{0,63}$/

function validateConfig(config: CodegenConfig): void {
  if (!IDENTIFIER.test(config.moduleName)) throw new Error("moduleName 必须为小写字母开头的模块标识")
  if (!CLASS_NAME.test(config.className)) throw new Error("className 必须为 PascalCase 标识")
  if (!config.businessName?.trim() || config.businessName.length > 100) throw new Error("businessName 必须为 1–100 个字符")
  if (!config.table?.name || !IDENTIFIER.test(config.table.name)) throw new Error("table.name 必须为小写字母开头的表标识")
}

export const CodegenEngineService = {
  /**
   * 生成该表的全套工程代码产物（全后端分层 + 前端组件 + RBAC SQL + 移动端 Clients）
   */
  generateCodes(config: CodegenConfig, options?: { includeClients?: boolean }): CodegenOutput[] {
    validateConfig(config)
    domainLog.event("infra.codegen.generated", {
      moduleName: config.moduleName,
      className: config.className,
      tableName: config.table.name,
    })
    // 迁移幂等：读磁盘已有迁移目录传给组装层，同表不重复产出迁移（2026-11-06 实测缺陷修复）。
    // cwd 非 repo 根（如服务端运行）时目录不存在 → 空数组，行为与旧版一致。
    let existingMigrationDirs: string[] = []
    try {
      existingMigrationDirs = readdirSync(path.resolve(process.cwd(), "prisma/migrations"), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    } catch {
      existingMigrationDirs = []
    }
    return generateAllCodegenOutputs(config, { ...options, existingMigrationDirs })
  },

  /** 兼容别名 */
  generate(config: CodegenConfig, options?: { includeClients?: boolean }): CodegenOutput[] {
    return this.generateCodes(config, options)
  },

  /** 兼容 RPC/API 的 previewCodegen */
  async previewCodegen(config: CodegenConfig, options?: { includeClients?: boolean }) {
    const files = this.generateCodes(config, options)
    return { files }
  },

  /** 兼容 RPC/API 的 generateCodegen */
  async generateCodegen(config: CodegenConfig, options?: { includeClients?: boolean }) {
    const files = this.generateCodes(config, options)
    return { files }
  },

  /**
   * 生成代码预览清单
   */
  preview(config: CodegenConfig, options?: { includeClients?: boolean }): Array<{ path: string; type: string; lineCount: number }> {
    const outputs = this.generateCodes(config, options)
    return outputs.map((o) => ({
      path: o.path,
      type: o.type,
      lineCount: o.content.split("\n").length,
    }))
  },

  /**
   * 生成 ZIP 包文件列表
   */
  async buildZipEntries(config: CodegenConfig, options?: { includeClients?: boolean }): Promise<Array<{ filename: string; content: string }>> {
    const outputs = this.generateCodes(config, options)
    return outputs.map((o) => ({
      filename: o.path,
      content: o.content,
    }))
  },

  /**
   * 获取可用模板列表
   *
   * 注: a09918c 将本服务由静态类重构为对象单例时遗漏了此方法, 而调用方
   * CodegenTableService.listCodegenCatalog() 仍在引用, 导致
   * infra.listCodegenCatalog 门面方法运行时抛错。此处按原实现恢复。
   */
  listTemplates(): Array<{ id: CodegenTemplate; name: string; description: string }> {
    return [
      { id: "CRUD", name: "标准 CRUD", description: "列表、字段配置、筛选、表单、导入导出、权限与审阅 ZIP。" },
      { id: "TREE", name: "树形 CRUD", description: "在标准 CRUD 上增加父子树约束与树形数据输出。" },
      { id: "MASTER_DETAIL", name: "主子表", description: "输出主记录与子定义绑定的嵌套配置和事务扩展点。" },
    ]
  },
}

export const codegenEngineService = CodegenEngineService

// 保留老版本常用辅助别名兼容
export {
  generateAllCodegenOutputs,
  toCamel,
  toKebab,
  toPascal,
}
