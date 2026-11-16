import { createDomainFacade } from "@/modules/shared/backend/lib/rpc-facade"

export const OA_FACADE_METHODS = ["oaAttendance.create", "oaAttendance.page", "oaAttendance.update", "oaLeaveApply.create", "oaLeaveApply.page", "oaLeaveApply.update", "oaNotice.create", "oaNotice.page", "oaNotice.update"] as const

export const oaFacade = createDomainFacade("oa", OA_FACADE_METHODS)
