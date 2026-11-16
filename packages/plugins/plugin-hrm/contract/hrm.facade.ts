import { createDomainFacade } from "@/modules/shared/backend/lib/rpc-facade"

export const HRM_FACADE_METHODS = ["hrmEmployee.create", "hrmEmployee.page", "hrmEmployee.update", "hrmPayroll.create", "hrmPayroll.page", "hrmPayroll.update", "hrmPosition.create", "hrmPosition.page", "hrmPosition.update"] as const

export const hrmFacade = createDomainFacade("hrm", HRM_FACADE_METHODS)
