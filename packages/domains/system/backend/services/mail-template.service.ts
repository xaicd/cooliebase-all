import type { CreateMailTemplateInput, SystemModulePageQueryInput, UpdateMailTemplateInput } from "../validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type MailTemplateItem = {
  id: string
  name: string
  code: string
  subject: string
  content: string
  status: "ACTIVE" | "DISABLED"
}

const SETTING_KEY = "system.mail.templates"

function parseItems(value: unknown): MailTemplateItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is MailTemplateItem => Boolean(item && typeof item === "object"))
}

async function load() {
  const setting = await cooliebasePrisma.setting.findUnique({ where: { key: SETTING_KEY } })
  return parseItems(setting?.value)
}

async function save(items: MailTemplateItem[]) {
  await cooliebasePrisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: items },
    update: { value: items },
  })
}

export class SystemMailTemplateService {
  static async listMailTemplates(input: SystemModulePageQueryInput) {
    const items = await load()
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter((item) => item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword))
      : items
    const start = (input.page - 1) * input.pageSize
    domainLog.event("system.mailTemplate.list", { total: filtered.length })
    return { items: filtered.slice(start, start + input.pageSize), total: filtered.length, page: input.page, pageSize: input.pageSize }
  }

  static async createMailTemplate(input: CreateMailTemplateInput) {
    const items = await load()
    if (items.some((item) => item.code === input.code)) throw new Error(`邮件模板编码已存在: ${input.code}`)
    const created: MailTemplateItem = {
      id: `mailt-${Date.now()}`,
      name: input.name ?? "",
      code: input.code ?? "",
      subject: input.subject ?? "",
      content: input.content ?? "",
      status: input.status ?? "ACTIVE",
    }
    await save([created, ...items])
    domainLog.audit("system.mailTemplate.create", { targetType: "MAIL_TEMPLATE", targetId: created.id })
    return created
  }

  static async getMailTemplate(input: { id: string }) {
    const item = (await load()).find((row) => row.id === input.id)
    if (!item) throw new Error("邮件模板不存在")
    return item
  }

  static async updateMailTemplate(input: UpdateMailTemplateInput) {
    const items = await load()
    const idx = items.findIndex((item) => item.id === input.id)
    if (idx === -1) throw new Error("邮件模板不存在")
    if (input.code && items.some((item, index) => index !== idx && item.code === input.code)) throw new Error(`邮件模板编码已存在: ${input.code}`)
    const { id, ...patch } = input
    items[idx] = { ...items[idx], ...patch }
    await save(items)
    domainLog.event("system.mailTemplate.update", { id })
    return { id }
  }

  static async deleteMailTemplate(input: { id: string }) {
    const items = await load()
    const next = items.filter((item) => item.id !== input.id)
    if (next.length === items.length) throw new Error("邮件模板不存在")
    await save(next)
    domainLog.event("system.mailTemplate.delete", { id: input.id })
    return { success: true }
  }
}
