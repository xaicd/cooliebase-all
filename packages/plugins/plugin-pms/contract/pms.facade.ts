import { createDomainFacade } from "@/modules/shared/backend/lib/rpc-facade"

export const PMS_FACADE_METHODS = ["pmsMilestone.create", "pmsMilestone.page", "pmsMilestone.update", "pmsProject.create", "pmsProject.page", "pmsProject.update", "pmsTimesheet.create", "pmsTimesheet.page", "pmsTimesheet.update"] as const

export const pmsFacade = createDomainFacade("pms", PMS_FACADE_METHODS)
