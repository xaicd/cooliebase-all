import type {
  BpmPageQueryInput,
  BpmTaskActionInput,
} from "@/modules/bpm/backend/validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type ProcessDefinitionItem = {
  id: string
  key: string
  name: string
  version: number
  status: "ACTIVE" | "SUSPENDED"
}

type TaskItem = {
  id: string
  title: string
  assignee: string
  status: "PENDING" | "DONE"
}

function mapBizTypeName(bizType: string): string {
  const LABELS: Record<string, string> = {
    MERCHANT_APPLY: "商户入驻审批",
    WITHDRAWAL: "提现审批",
    PRODUCT_LISTING: "商品上架审批",
    ROOM_LISTING: "房间上架审批",
    LIVE_BROADCAST: "直播开播审批",
    ACTIVITY: "活动发布审批",
    BANK_CARD: "银行卡核验审批",
    STATION_APPLY: "服务站点审批",
    COMMUNITY_GROUP: "社区群绑定审批",
  }
  return LABELS[bizType] ?? bizType
}

export class BpmProcessService {
  static async listDefinitions(input: BpmPageQueryInput) {
    const where = input.keyword
      ? {
          OR: [
            { bizType: { contains: input.keyword, mode: "insensitive" as const } },
            { title: { contains: input.keyword, mode: "insensitive" as const } },
          ],
        }
      : undefined

    const grouped = await cooliebasePrisma.approvalTask.groupBy({
      by: ["bizType"],
      where,
      _count: { _all: true },
    })

    const items: ProcessDefinitionItem[] = grouped
      .map((item) => ({
        id: `pd-${item.bizType.toLowerCase()}`,
        key: item.bizType.toLowerCase(),
        name: mapBizTypeName(item.bizType),
        version: 1,
        status: "ACTIVE" as const,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))

    const start = (input.page - 1) * input.pageSize
    const pageItems = items.slice(start, start + input.pageSize)

    domainLog.event("bpm.process-definition.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
      source: "db",
      total: items.length,
    })

    return {
      items: pageItems,
      total: items.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async listTasks(input: BpmPageQueryInput) {
    const where = {
      status: "PENDING",
      ...(input.keyword
        ? {
            OR: [
              { title: { contains: input.keyword, mode: "insensitive" as const } },
              { bizType: { contains: input.keyword, mode: "insensitive" as const } },
              { applicantName: { contains: input.keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const skip = (input.page - 1) * input.pageSize
    const [rows, total] = await Promise.all([
      cooliebasePrisma.approvalTask.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          bizType: true,
          applicantName: true,
        },
      }),
      cooliebasePrisma.approvalTask.count({ where }),
    ])

    const items: TaskItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title || `${mapBizTypeName(row.bizType)}任务`,
      assignee: row.applicantName || "审批池",
      status: "PENDING",
    }))

    domainLog.event("bpm.task.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
      source: "db",
      total,
    })

    return {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async actionTask(input: BpmTaskActionInput) {
    domainLog.event("bpm.task.action", { taskId: input.taskId, action: input.action })

    const exists = await cooliebasePrisma.approvalTask.findUnique({
      where: { id: input.taskId },
      select: { id: true },
    })
    if (!exists) {
      throw new Error("任务不存在")
    }

    const nextStatus = input.action === "APPROVE" ? "APPROVED" : "REJECTED"
    const task = await cooliebasePrisma.approvalTask.update({
      where: { id: input.taskId },
      data: {
        status: nextStatus,
        reviewedAt: new Date(),
        reviewRemark: input.comment ?? null,
      },
      select: { id: true },
    })

    domainLog.audit("bpm.task.action", {
      targetType: "TASK",
      targetId: task.id,
      action: input.action,
      source: "db",
    })

    return { taskId: task.id, action: input.action, status: "DONE" as const }
  }
}
