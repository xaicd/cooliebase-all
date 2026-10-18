import type { CreateMailAccountInput, SystemModulePageQueryInput } from "../validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type MailAccountItem = {
  id: string
  email: string
  host: string
  status: "ACTIVE" | "DISABLED"
}

type MailLogItem = {
  id: string
  accountEmail: string
  receiverMask: string
  status: "SUCCESS" | "FAIL"
  sentAt: string
}

const ACCOUNTS_SETTING_KEY = "system.mail.accounts"
const LOGS_SETTING_KEY = "system.mail.logs"

function parseItems<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is T => Boolean(item && typeof item === "object")) as T[]
}

export class SystemMailService {
  static async listAccounts(input: SystemModulePageQueryInput) {
    domainLog.event("system.mail.account.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const setting = await cooliebasePrisma.setting.findUnique({ where: { key: ACCOUNTS_SETTING_KEY } })
    const items = parseItems<MailAccountItem>(setting?.value)
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter((item) => item.email.toLowerCase().includes(keyword) || item.host.toLowerCase().includes(keyword))
      : items

    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async createAccount(operatorId: string, input: CreateMailAccountInput) {
    const setting = await cooliebasePrisma.setting.upsert({
      where: { key: ACCOUNTS_SETTING_KEY },
      update: {},
      create: { key: ACCOUNTS_SETTING_KEY, value: [] },
    })
    const items = parseItems<MailAccountItem>(setting.value)
    const created: MailAccountItem = {
      id: `maila-${Date.now()}`,
      email: input.email,
      host: input.host,
      status: input.status,
    }
    const nextItems = [created, ...items]

    await cooliebasePrisma.setting.update({
      where: { key: ACCOUNTS_SETTING_KEY },
      data: { value: nextItems },
    })

    domainLog.audit("system.mail.account.create", {
      operatorId,
      email: input.email,
    })

    return created
  }

  static async listLogs(input: SystemModulePageQueryInput) {
    domainLog.event("system.mail.log.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const setting = await cooliebasePrisma.setting.findUnique({ where: { key: LOGS_SETTING_KEY } })
    const items = parseItems<MailLogItem>(setting?.value)
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter(
          (item) =>
            item.accountEmail.toLowerCase().includes(keyword) ||
            item.receiverMask.toLowerCase().includes(keyword),
        )
      : items

    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async createMailAccount(input: CreateMailAccountInput & { operatorId?: string }) {
    const { operatorId, ...data } = input
    return this.createAccount(operatorId ?? "system", data)
  }
}
