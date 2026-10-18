import type { InfraPageQueryInput } from "@/modules/infra/backend/validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { readSettingList } from "./infra-setting-store"

type InfraCodegenItem = {
  id: string
  tableName: string
  moduleName: string
  author: string
  generatedAt: string
}

const DEFAULT_CODEGEN_TABLES: InfraCodegenItem[] = [
  {
    id: "cg-001",
    tableName: "system_user",
    moduleName: "system",
    author: "cooliebase",
    generatedAt: new Date().toISOString(),
  },
  {
    id: "cg-002",
    tableName: "infra_job",
    moduleName: "infra",
    author: "cooliebase",
    generatedAt: new Date().toISOString(),
  },
]

const CODEGEN_TABLES_SETTING_KEY = "infra.codegen.tables"

export class InfraCodegenService {
  static async list(input: InfraPageQueryInput) {
    domainLog.event("infra.codegen.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const keyword = input.keyword?.toLowerCase() ?? ""
    const storedTables = await readSettingList<InfraCodegenItem>(CODEGEN_TABLES_SETTING_KEY)
    const tables = storedTables.length > 0 ? storedTables : DEFAULT_CODEGEN_TABLES
    const filtered = keyword
      ? tables.filter(
          (item) =>
            item.tableName.toLowerCase().includes(keyword) ||
            item.moduleName.toLowerCase().includes(keyword),
        )
      : tables

    const start = (input.page - 1) * input.pageSize
    const items = filtered.slice(start, start + input.pageSize)
    return { items, total: filtered.length, page: input.page, pageSize: input.pageSize }
  }
}
