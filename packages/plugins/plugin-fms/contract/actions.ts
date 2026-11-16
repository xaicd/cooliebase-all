import { z } from "zod"
import { registerActionSchema } from "@/modules/shared/backend/lib/broker-validator"
import {
  fmsAccountCreateSchema,
  fmsAccountPageQuerySchema,
  fmsAccountUpdateSchema,
  fmsReconcileCreateSchema,
  fmsReconcilePageQuerySchema,
  fmsReconcileUpdateSchema,
  fmsVoucherCreateSchema,
  fmsVoucherPageQuerySchema,
  fmsVoucherUpdateSchema,
} from "../backend/validators"

export const fmsPingSchema = z.object({
  n: z.number().optional(),
})

export const FMS_ACTION_SCHEMAS = {
  "fms.fmsAccount.create": fmsAccountCreateSchema,
  "fms.fmsAccount.page": fmsAccountPageQuerySchema,
  "fms.fmsAccount.update": fmsAccountUpdateSchema,
  "fms.fmsReconcile.create": fmsReconcileCreateSchema,
  "fms.fmsReconcile.page": fmsReconcilePageQuerySchema,
  "fms.fmsReconcile.update": fmsReconcileUpdateSchema,
  "fms.fmsVoucher.create": fmsVoucherCreateSchema,
  "fms.fmsVoucher.page": fmsVoucherPageQuerySchema,
  "fms.fmsVoucher.update": fmsVoucherUpdateSchema,
} as const

export function registerActionSchemas() {
  for (const [action, schema] of Object.entries(FMS_ACTION_SCHEMAS)) {
    registerActionSchema(action, schema)
  }
}
