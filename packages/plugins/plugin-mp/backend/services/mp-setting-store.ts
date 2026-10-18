import type { Prisma } from "@prisma/client"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

function listValue<T>(items: T[]): Prisma.InputJsonValue {
  return { items: items as Prisma.InputJsonArray }
}

export async function readSettingList<T>(key: string): Promise<T[]> {
  const row = await cooliebasePrisma.setting.findUnique({ where: { key } })
  const payload = row?.value as { items?: T[] } | null
  return Array.isArray(payload?.items) ? (payload.items as T[]) : []
}

export async function writeSettingList<T>(key: string, items: T[]) {
  await cooliebasePrisma.setting.upsert({
    where: { key },
    create: { key, value: listValue(items) },
    update: { value: listValue(items) },
  })
}
