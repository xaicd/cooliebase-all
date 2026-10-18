import type { Prisma } from "@prisma/client"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

function listValue<T>(items: T[]): Prisma.InputJsonValue {
  return { items: items as Prisma.InputJsonArray }
}

export async function readSettingList<T>(key: string, prefixes: string[] = []): Promise<T[]> {
  const candidates = [key, ...prefixes]

  for (const candidate of candidates) {
    const exact = await cooliebasePrisma.setting.findUnique({ where: { key: candidate } })
    if (exact) {
      const payload = exact.value as { items?: T[] } | null
      if (Array.isArray(payload?.items)) {
        return payload.items as T[]
      }
    }

    const prefixed = await cooliebasePrisma.setting.findMany({
      where: { key: { startsWith: candidate } },
      orderBy: { createdAt: "asc" },
    })

    for (const row of prefixed) {
      const payload = row.value as { items?: T[] } | null
      if (Array.isArray(payload?.items)) {
        return payload.items as T[]
      }
    }
  }

  return []
}

export async function writeSettingList<T>(key: string, items: T[]) {
  await cooliebasePrisma.setting.upsert({
    where: { key },
    create: { key, value: listValue(items) },
    update: { value: listValue(items) },
  })
}
