import { createDomainFacade } from "@/modules/shared/backend/lib/rpc-facade"

export const FMS_FACADE_METHODS = ["fmsAccount.create", "fmsAccount.page", "fmsAccount.update", "fmsReconcile.create", "fmsReconcile.page", "fmsReconcile.update", "fmsVoucher.create", "fmsVoucher.page", "fmsVoucher.update"] as const

export const fmsFacade = createDomainFacade("fms", FMS_FACADE_METHODS)
